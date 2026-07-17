const pool = require('../config/db');

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

class PostgresWorkspaceRepository {
  constructor(options = {}) {
    this.fallbackRepository = options.fallbackRepository || null;
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
          date: row.entry_date,
          amount: toNumber(row.amount),
          note: row.note || '',
          createdAt: toIsoString(row.created_at),
          createdBy: row.created_by || '',
        };
      }),
      dailyExpenses: dailyExpensesResult.rows.map(function (row) {
        return {
          id: row.id,
          date: row.expense_date,
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
              date: expenseRow.expense_date,
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
}

module.exports = {
  PostgresWorkspaceRepository,
};
