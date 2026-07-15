const { randomUUID } = require('crypto');
const { assertEnabledCompany } = require('../config/companies');
const { HttpError } = require('../lib/errors');
const {
  requireDateString,
  requireNonNegativeNumber,
  requireOneOf,
  requirePositiveNumber,
  requireString,
} = require('../lib/validators');

const organizationSectors = ['government', 'ngos', 'private'];
const allowedTemplateExtensions = ['PDF', 'DOC', 'DOCX'];

class WorkspaceService {
  constructor(repository) {
    this.repository = repository;
  }

  async getWorkspace(companyId) {
    assertEnabledCompany(companyId);
    return this.repository.readWorkspace(companyId);
  }

  async listOrganizations(companyId, sector) {
    requireOneOf(sector, organizationSectors, 'sector');
    const workspace = await this.getWorkspace(companyId);
    return workspace[sector];
  }

  async createOrganization(companyId, sector, payload, authContext) {
    requireOneOf(sector, organizationSectors, 'sector');
    const name = requireString(payload.name, 'name');
    const workspace = await this.getWorkspace(companyId);

    const organization = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      createdBy: authContext.email,
      entries: [],
    };

    workspace[sector].unshift(organization);
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async updateOrganization(companyId, organizationId, payload) {
    const name = requireString(payload.name, 'name');
    const { workspace, organization } = await this.getOrganizationContext(companyId, organizationId);
    organization.name = name;
    organization.updatedAt = new Date().toISOString();
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async deleteOrganization(companyId, organizationId) {
    const workspace = await this.getWorkspace(companyId);
    let removed = false;

    organizationSectors.forEach(function (sector) {
      const nextItems = workspace[sector].filter(function (organization) {
        const keep = organization.id !== organizationId;
        if (!keep) {
          removed = true;
        }
        return keep;
      });

      workspace[sector] = nextItems;
    });

    if (!removed) {
      throw new HttpError(404, 'Organization not found.');
    }

    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async addOrganizationExpense(companyId, organizationId, payload, authContext) {
    const date = requireDateString(payload.date, 'date');
    const description = requireString(payload.description, 'description');
    const amountSpent = requirePositiveNumber(payload.amountSpent, 'amountSpent');
    const paidBy = requireString(payload.paidBy, 'paidBy');
    const { workspace, organization } = await this.getOrganizationContext(companyId, organizationId);

    organization.entries.unshift({
      id: randomUUID(),
      date,
      description,
      amountSpent,
      paidBy,
      createdAt: new Date().toISOString(),
      createdBy: authContext.email,
    });

    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async deleteOrganizationExpense(companyId, organizationId, expenseId) {
    const { workspace, organization } = await this.getOrganizationContext(companyId, organizationId);
    const nextEntries = organization.entries.filter(function (entry) {
      return entry.id !== expenseId;
    });

    if (nextEntries.length === organization.entries.length) {
      throw new HttpError(404, 'Organization expense not found.');
    }

    organization.entries = nextEntries;
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async listFundingEntries(companyId) {
    const workspace = await this.getWorkspace(companyId);
    return workspace.fundingHistory;
  }

  async createFundingEntry(companyId, payload, authContext) {
    const date = requireDateString(payload.date, 'date');
    const amount = requirePositiveNumber(payload.amount, 'amount');
    const note = String(payload.note || '').trim();
    const workspace = await this.getWorkspace(companyId);

    workspace.fundingHistory.push({
      id: randomUUID(),
      date,
      amount,
      note,
      createdAt: new Date().toISOString(),
      createdBy: authContext.email,
    });

    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async deleteFundingEntry(companyId, fundingEntryId) {
    const workspace = await this.getWorkspace(companyId);
    const nextEntries = workspace.fundingHistory.filter(function (entry) {
      return entry.id !== fundingEntryId;
    });

    if (nextEntries.length === workspace.fundingHistory.length) {
      throw new HttpError(404, 'Funding entry not found.');
    }

    workspace.fundingHistory = nextEntries;
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async listDailyExpenses(companyId) {
    const workspace = await this.getWorkspace(companyId);
    return workspace.dailyExpenses;
  }

  async createDailyExpense(companyId, payload, authContext) {
    const date = requireDateString(payload.date, 'date');
    const description = requireString(payload.description, 'description');
    const amount = requirePositiveNumber(payload.amount, 'amount');
    const workspace = await this.getWorkspace(companyId);

    workspace.dailyExpenses.unshift({
      id: randomUUID(),
      date,
      description,
      amount,
      createdAt: new Date().toISOString(),
      createdBy: authContext.email,
    });

    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async deleteDailyExpense(companyId, expenseId) {
    const workspace = await this.getWorkspace(companyId);
    const nextEntries = workspace.dailyExpenses.filter(function (entry) {
      return entry.id !== expenseId;
    });

    if (nextEntries.length === workspace.dailyExpenses.length) {
      throw new HttpError(404, 'Daily expense not found.');
    }

    workspace.dailyExpenses = nextEntries;
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async listStoreItems(companyId) {
    const workspace = await this.getWorkspace(companyId);
    return workspace.store;
  }

  async createStoreItem(companyId, payload, authContext) {
    const name = requireString(payload.name, 'name');
    const quantity = payload.quantity == null ? 0 : requireNonNegativeNumber(payload.quantity, 'quantity');
    const workspace = await this.getWorkspace(companyId);

    workspace.store.unshift({
      id: randomUUID(),
      name,
      quantity,
      createdAt: new Date().toISOString(),
      createdBy: authContext.email,
    });

    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async updateStoreItem(companyId, itemId, payload) {
    const quantity = requireNonNegativeNumber(payload.quantity, 'quantity');
    const workspace = await this.getWorkspace(companyId);
    const item = workspace.store.find(function (entry) {
      return entry.id === itemId;
    });

    if (!item) {
      throw new HttpError(404, 'Store item not found.');
    }

    item.quantity = quantity;
    item.updatedAt = new Date().toISOString();
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async deleteStoreItem(companyId, itemId) {
    const workspace = await this.getWorkspace(companyId);
    const nextItems = workspace.store.filter(function (entry) {
      return entry.id !== itemId;
    });

    if (nextItems.length === workspace.store.length) {
      throw new HttpError(404, 'Store item not found.');
    }

    workspace.store = nextItems;
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async listTemplateFiles(companyId) {
    const workspace = await this.getWorkspace(companyId);
    return workspace.templateVault;
  }

  async createTemplateFile(companyId, payload, authContext) {
    const name = requireString(payload.name, 'name');
    const extension = requireOneOf(String(payload.extension || '').trim().toUpperCase(), allowedTemplateExtensions, 'extension');
    const mimeType = requireString(payload.mimeType, 'mimeType');
    const contentDataUrl = requireString(payload.contentDataUrl, 'contentDataUrl');
    const workspace = await this.getWorkspace(companyId);

    workspace.templateVault.unshift({
      id: randomUUID(),
      name,
      extension,
      mimeType,
      contentDataUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: authContext.email,
    });

    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async deleteTemplateFile(companyId, fileId) {
    const workspace = await this.getWorkspace(companyId);
    const nextFiles = workspace.templateVault.filter(function (entry) {
      return entry.id !== fileId;
    });

    if (nextFiles.length === workspace.templateVault.length) {
      throw new HttpError(404, 'Template file not found.');
    }

    workspace.templateVault = nextFiles;
    await this.repository.writeWorkspace(companyId, workspace);
    return workspace;
  }

  async getTemplateFile(companyId, fileId) {
    const workspace = await this.getWorkspace(companyId);
    const file = workspace.templateVault.find(function (entry) {
      return entry.id === fileId;
    });

    if (!file) {
      throw new HttpError(404, 'Template file not found.');
    }

    return file;
  }

  async getOrganizationContext(companyId, organizationId) {
    const workspace = await this.getWorkspace(companyId);

    for (const sector of organizationSectors) {
      const organization = workspace[sector].find(function (entry) {
        return entry.id === organizationId;
      });

      if (organization) {
        return {
          workspace,
          sector,
          organization,
        };
      }
    }

    throw new HttpError(404, 'Organization not found.');
  }
}

module.exports = {
  WorkspaceService,
  organizationSectors,
};
