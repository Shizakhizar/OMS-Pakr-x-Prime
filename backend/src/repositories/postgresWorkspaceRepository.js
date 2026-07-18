const pool = require('../config/db');
const { HttpError } = require('../lib/errors');

const defaultWorkspaceData = {
  fundingHistory: [],
  government: [],
  ngos: [],
  private: [],
  dailyExpenses: [],
  store: [],
  templateVault: [],
};

function normalizeCompanyId(companyId) {
  return String(companyId || '').trim().toLowerCase();
}

function isPakroseCompany(companyId) {
  return normalizeCompanyId(companyId) === 'pakrose';
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDateOnlyString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    const dateMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})/);

    if (dateMatch) {
      return dateMatch[1];
    }
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

class PostgresWorkspaceRepository {
  constructor(options = {}) {
    this.fallbackRepository = options.fallbackRepository || null;
  }

  async readWorkspaceWithFallback(companyId) {
    return this.readWorkspace(companyId);
  }

  async readWorkspace(companyId) {
    if (!isPakroseCompany(companyId)) {
      if (this.fallbackRepository) {
        return this.fallbackRepository.readWorkspace(companyId);
      }

      return { ...defaultWorkspaceData };
    }

    const [organizationsResult, organizationExpensesResult, dailyExpensesResult, fundingHistoryResult, storeResult, templateVaultResult] =
      await Promise.all([
        pool.query('SELECT * FROM workspace_organizations ORDER BY created_at DESC'),
        pool.query('SELECT * FROM workspace_daily_expenses ORDER BY expense_date DESC, created_at DESC'),
        pool.query(
          'SELECT * FROM workspace_general_daily_expenses WHERE company = $1 ORDER BY expense_date DESC, created_at DESC',
          ['pakrose']
        ),
        pool.query(
          'SELECT * FROM workspace_funding_history WHERE company = $1 ORDER BY entry_date DESC, created_at DESC',
          ['pakrose']
        ),
        pool.query('SELECT * FROM workspace_store_items WHERE company = $1 ORDER BY created_at DESC', ['pakrose']),
        pool.query('SELECT * FROM template_vault_files WHERE company = $1 ORDER BY uploaded_at DESC', ['pakrose']),
      ]);

    const workspace = {
      ...defaultWorkspaceData,
      government: [],
      ngos: [],
      private: [],
      fundingHistory: fundingHistoryResult.rows.map(function (row) {
        return {
          id: row.id,
          date: toDateOnlyString(row.entry_date),
          amount: toNumber(row.amount),
          note: row.note || '',
          createdAt: toIsoString(row.created_at),
          createdBy: row.created_by || '',
        };
      }),
      dailyExpenses: dailyExpensesResult.rows.map(function (row) {
        return {
          id: row.id,
          date: toDateOnlyString(row.expense_date),
          description: row.description,
          amount: toNumber(row.amount),
          createdAt: toIsoString(row.created_at),
          createdBy: row.created_by || '',
        };
      }),
      store: storeResult.rows.map(function (row) {
        return {
          id: row.id,
          name: row.item_name,
          quantity: Number(row.quantity || 0),
          createdAt: toIsoString(row.created_at),
          createdBy: row.created_by || '',
          updatedAt: toIsoString(row.updated_at),
        };
      }),
      templateVault: templateVaultResult.rows.map(function (row) {
        return {
          id: row.id,
          name: row.file_name,
          extension: row.extension || '',
          mimeType: row.mime_type || '',
          contentDataUrl: row.content_data_url,
          uploadedAt: toIsoString(row.uploaded_at),
          uploadedBy: row.uploaded_by || '',
        };
      }),
    };

    organizationsResult.rows.forEach(function (organizationRow) {
      const sector = organizationRow.category;
      if (!Array.isArray(workspace[sector])) {
        return;
      }

      const organization = {
        id: organizationRow.id,
        name: organizationRow.name,
        createdAt: toIsoString(organizationRow.created_at),
        createdBy: organizationRow.created_by || '',
        updatedAt: toIsoString(organizationRow.updated_at),
        entries: organizationExpensesResult.rows
          .filter(function (expenseRow) {
            return expenseRow.org_id === organizationRow.id;
          })
          .map(function (expenseRow) {
            return {
              id: expenseRow.id,
              date: toDateOnlyString(expenseRow.expense_date),
              description: expenseRow.description,
              amountSpent: toNumber(expenseRow.amount),
              paidBy: expenseRow.paid_by || '',
              createdAt: toIsoString(expenseRow.created_at),
              createdBy: expenseRow.created_by || '',
            };
          }),
      };

      workspace[sector].push(organization);
    });

    return workspace;
  }

  async writeWorkspace(companyId, data) {
    if (!isPakroseCompany(companyId)) {
      if (this.fallbackRepository) {
        return this.fallbackRepository.writeWorkspace(companyId, data);
      }

      return data;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM workspace_daily_expenses');
      await client.query('DELETE FROM workspace_organizations');
      await client.query('DELETE FROM workspace_general_daily_expenses WHERE company = $1', ['pakrose']);
      await client.query('DELETE FROM workspace_funding_history WHERE company = $1', ['pakrose']);
      await client.query('DELETE FROM workspace_store_items WHERE company = $1', ['pakrose']);
      await client.query('DELETE FROM template_vault_files WHERE company = $1', ['pakrose']);

      const sectorOrganizations = [
        { sector: 'government', items: Array.isArray(data.government) ? data.government : [] },
        { sector: 'ngos', items: Array.isArray(data.ngos) ? data.ngos : [] },
        { sector: 'private', items: Array.isArray(data.private) ? data.private : [] },
      ];

      for (const sectorGroup of sectorOrganizations) {
        for (const organization of sectorGroup.items) {
          await client.query(
            `INSERT INTO workspace_organizations (id, name, category, funding_total, created_at, created_by, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              organization.id,
              organization.name,
              sectorGroup.sector,
              toNumber(organization.fundingTotal),
              organization.createdAt || new Date().toISOString(),
              organization.createdBy || '',
              organization.updatedAt || null,
            ]
          );

          const entries = Array.isArray(organization.entries) ? organization.entries : [];
          for (const entry of entries) {
            await client.query(
              `INSERT INTO workspace_daily_expenses (id, org_id, description, amount, expense_date, paid_by, created_at, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                entry.id,
                organization.id,
                entry.description,
                toNumber(entry.amountSpent),
                entry.date,
                entry.paidBy || '',
                entry.createdAt || new Date().toISOString(),
                entry.createdBy || '',
              ]
            );
          }
        }
      }

      const dailyExpenses = Array.isArray(data.dailyExpenses) ? data.dailyExpenses : [];
      for (const expense of dailyExpenses) {
        await client.query(
          `INSERT INTO workspace_general_daily_expenses (id, company, expense_date, description, amount, created_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            expense.id,
            'pakrose',
            expense.date,
            expense.description,
            toNumber(expense.amount),
            expense.createdAt || new Date().toISOString(),
            expense.createdBy || '',
          ]
        );
      }

      const fundingHistory = Array.isArray(data.fundingHistory) ? data.fundingHistory : [];
      for (const entry of fundingHistory) {
        await client.query(
          `INSERT INTO workspace_funding_history (id, company, entry_date, amount, note, created_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            entry.id,
            'pakrose',
            entry.date,
            toNumber(entry.amount),
            entry.note || '',
            entry.createdAt || new Date().toISOString(),
            entry.createdBy || '',
          ]
        );
      }

      const storeItems = Array.isArray(data.store) ? data.store : [];
      for (const item of storeItems) {
        await client.query(
          `INSERT INTO workspace_store_items (id, company, item_name, quantity, created_at, created_by, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            item.id,
            'pakrose',
            item.name,
            Number(item.quantity || 0),
            item.createdAt || new Date().toISOString(),
            item.createdBy || '',
            item.updatedAt || null,
          ]
        );
      }

      const templateFiles = Array.isArray(data.templateVault) ? data.templateVault : [];
      for (const file of templateFiles) {
        await client.query(
          `INSERT INTO template_vault_files (id, company, file_name, extension, content_data_url, file_size, mime_type, uploaded_at, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            file.id,
            'pakrose',
            file.name,
            file.extension || '',
            file.contentDataUrl,
            0,
            file.mimeType || '',
            file.uploadedAt || new Date().toISOString(),
            file.uploadedBy || '',
          ]
        );
      }

      await client.query('COMMIT');
      return data;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createOrganization(companyId, sector, organization) {
    if (!isPakroseCompany(companyId)) {
      if (this.fallbackRepository && typeof this.fallbackRepository.createOrganization === 'function') {
        return this.fallbackRepository.createOrganization(companyId, sector, organization);
      }

      return this.fallbackRepository
        ? this.fallbackRepository.readWorkspace(companyId).then(async (workspace) => {
            workspace[sector].unshift(organization);
            await this.fallbackRepository.writeWorkspace(companyId, workspace);
            return workspace;
          })
        : { ...defaultWorkspaceData };
    }

    await pool.query(
      `INSERT INTO workspace_organizations (id, name, category, funding_total, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        organization.id,
        organization.name,
        sector,
        toNumber(organization.fundingTotal),
        organization.createdAt || new Date().toISOString(),
        organization.createdBy || '',
        organization.updatedAt || null,
      ]
    );

    return this.readWorkspace(companyId);
  }

  async updateOrganization(companyId, organizationId, changes) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query(
      `UPDATE workspace_organizations
       SET name = $2, updated_at = $3
       WHERE id = $1`,
      [organizationId, changes.name, changes.updatedAt || new Date().toISOString()]
    );

    if (!result.rowCount) {
      throw new HttpError(404, 'Organization not found.');
    }

    return this.readWorkspace(companyId);
  }

  async deleteOrganization(companyId, organizationId) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM workspace_daily_expenses WHERE org_id = $1', [organizationId]);
      const result = await client.query('DELETE FROM workspace_organizations WHERE id = $1', [organizationId]);

      if (!result.rowCount) {
        throw new HttpError(404, 'Organization not found.');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.readWorkspace(companyId);
  }

  async addOrganizationExpense(companyId, organizationId, expenseEntry) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const organizationResult = await pool.query('SELECT id FROM workspace_organizations WHERE id = $1', [organizationId]);

    if (!organizationResult.rowCount) {
      throw new HttpError(404, 'Organization not found.');
    }

    await pool.query(
      `INSERT INTO workspace_daily_expenses (id, org_id, description, amount, expense_date, paid_by, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        expenseEntry.id,
        organizationId,
        expenseEntry.description,
        toNumber(expenseEntry.amountSpent),
        toDateOnlyString(expenseEntry.date),
        expenseEntry.paidBy || '',
        expenseEntry.createdAt || new Date().toISOString(),
        expenseEntry.createdBy || '',
      ]
    );

    return this.readWorkspace(companyId);
  }

  async deleteOrganizationExpense(companyId, organizationId, expenseId) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query('DELETE FROM workspace_daily_expenses WHERE id = $1 AND org_id = $2', [expenseId, organizationId]);

    if (!result.rowCount) {
      throw new HttpError(404, 'Organization expense not found.');
    }

    return this.readWorkspace(companyId);
  }

  async createFundingEntry(companyId, fundingEntry) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    await pool.query(
      `INSERT INTO workspace_funding_history (id, company, entry_date, amount, note, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        fundingEntry.id,
        'pakrose',
        toDateOnlyString(fundingEntry.date),
        toNumber(fundingEntry.amount),
        fundingEntry.note || '',
        fundingEntry.createdAt || new Date().toISOString(),
        fundingEntry.createdBy || '',
      ]
    );

    return this.readWorkspace(companyId);
  }

  async deleteFundingEntry(companyId, fundingEntryId) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query('DELETE FROM workspace_funding_history WHERE id = $1 AND company = $2', [
      fundingEntryId,
      'pakrose',
    ]);

    if (!result.rowCount) {
      throw new HttpError(404, 'Funding entry not found.');
    }

    return this.readWorkspace(companyId);
  }

  async createDailyExpense(companyId, dailyExpense) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    await pool.query(
      `INSERT INTO workspace_general_daily_expenses (id, company, expense_date, description, amount, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        dailyExpense.id,
        'pakrose',
        toDateOnlyString(dailyExpense.date),
        dailyExpense.description,
        toNumber(dailyExpense.amount),
        dailyExpense.createdAt || new Date().toISOString(),
        dailyExpense.createdBy || '',
      ]
    );

    return this.readWorkspace(companyId);
  }

  async deleteDailyExpense(companyId, expenseId) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query(
      'DELETE FROM workspace_general_daily_expenses WHERE id = $1 AND company = $2',
      [expenseId, 'pakrose']
    );

    if (!result.rowCount) {
      throw new HttpError(404, 'Daily expense not found.');
    }

    return this.readWorkspace(companyId);
  }

  async createStoreItem(companyId, storeItem) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    await pool.query(
      `INSERT INTO workspace_store_items (id, company, item_name, quantity, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        storeItem.id,
        'pakrose',
        storeItem.name,
        Number(storeItem.quantity || 0),
        storeItem.createdAt || new Date().toISOString(),
        storeItem.createdBy || '',
        storeItem.updatedAt || null,
      ]
    );

    return this.readWorkspace(companyId);
  }

  async updateStoreItem(companyId, itemId, changes) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query(
      `UPDATE workspace_store_items
       SET quantity = $2, updated_at = $3
       WHERE id = $1 AND company = $4`,
      [itemId, Number(changes.quantity || 0), changes.updatedAt || new Date().toISOString(), 'pakrose']
    );

    if (!result.rowCount) {
      throw new HttpError(404, 'Store item not found.');
    }

    return this.readWorkspace(companyId);
  }

  async deleteStoreItem(companyId, itemId) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query('DELETE FROM workspace_store_items WHERE id = $1 AND company = $2', [itemId, 'pakrose']);

    if (!result.rowCount) {
      throw new HttpError(404, 'Store item not found.');
    }

    return this.readWorkspace(companyId);
  }

  async createTemplateFile(companyId, file) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    await pool.query(
      `INSERT INTO template_vault_files (id, company, file_name, extension, content_data_url, file_size, mime_type, uploaded_at, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        file.id,
        'pakrose',
        file.name,
        file.extension || '',
        file.contentDataUrl,
        0,
        file.mimeType || '',
        file.uploadedAt || new Date().toISOString(),
        file.uploadedBy || '',
      ]
    );

    return this.readWorkspace(companyId);
  }

  async deleteTemplateFile(companyId, fileId) {
    if (!isPakroseCompany(companyId)) {
      return this.fallbackRepository ? this.fallbackRepository.readWorkspace(companyId) : { ...defaultWorkspaceData };
    }

    const result = await pool.query('DELETE FROM template_vault_files WHERE id = $1 AND company = $2', [fileId, 'pakrose']);

    if (!result.rowCount) {
      throw new HttpError(404, 'Template file not found.');
    }

    return this.readWorkspace(companyId);
  }
}

module.exports = {
  PostgresWorkspaceRepository,
};
