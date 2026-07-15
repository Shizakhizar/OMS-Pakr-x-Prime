const fs = require('fs/promises');
const path = require('path');

const defaultWorkspaceData = {
  fundingHistory: [],
  government: [],
  ngos: [],
  private: [],
  dailyExpenses: [],
  store: [],
  templateVault: [],
};

class JsonWorkspaceRepository {
  constructor(options) {
    this.dataDir = options.dataDir;
  }

  getCompanyFilePath(companyId) {
    return path.join(this.dataDir, `${companyId}.json`);
  }

  async ensureCompanyFile(companyId) {
    const targetPath = this.getCompanyFilePath(companyId);
    await fs.mkdir(this.dataDir, { recursive: true });

    try {
      await fs.access(targetPath);
    } catch (error) {
      await fs.writeFile(targetPath, JSON.stringify(defaultWorkspaceData, null, 2));
    }
  }

  async readWorkspace(companyId) {
    await this.ensureCompanyFile(companyId);
    const rawData = await fs.readFile(this.getCompanyFilePath(companyId), 'utf8');
    const parsed = JSON.parse(rawData);

    return {
      ...defaultWorkspaceData,
      ...parsed,
      fundingHistory: Array.isArray(parsed.fundingHistory) ? parsed.fundingHistory : [],
      government: Array.isArray(parsed.government) ? parsed.government : [],
      ngos: Array.isArray(parsed.ngos) ? parsed.ngos : [],
      private: Array.isArray(parsed.private) ? parsed.private : [],
      dailyExpenses: Array.isArray(parsed.dailyExpenses) ? parsed.dailyExpenses : [],
      store: Array.isArray(parsed.store) ? parsed.store : [],
      templateVault: Array.isArray(parsed.templateVault) ? parsed.templateVault : [],
    };
  }

  async writeWorkspace(companyId, data) {
    await this.ensureCompanyFile(companyId);
    await fs.writeFile(this.getCompanyFilePath(companyId), JSON.stringify(data, null, 2));
    return data;
  }
}

module.exports = {
  JsonWorkspaceRepository,
};
