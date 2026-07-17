const fs = require('fs/promises');
const path = require('path');

const defaultPrimeFabricWorkspace = {
  projects: [],
  attendanceRecords: {},
  storeItems: [],
  machineRecords: [],
  templateVault: [],
};

class JsonPrimeFabricRepository {
  constructor(options) {
    this.filePath = options.filePath;
  }

  async ensureWorkspaceFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch (error) {
      await fs.writeFile(this.filePath, JSON.stringify(defaultPrimeFabricWorkspace, null, 2));
    }
  }

  async readWorkspace() {
    await this.ensureWorkspaceFile();
    const rawData = await fs.readFile(this.filePath, 'utf8');
    const parsed = JSON.parse(rawData);

    return {
      ...defaultPrimeFabricWorkspace,
      ...parsed,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      attendanceRecords:
        parsed.attendanceRecords && typeof parsed.attendanceRecords === 'object' && !Array.isArray(parsed.attendanceRecords)
          ? parsed.attendanceRecords
          : {},
      storeItems: Array.isArray(parsed.storeItems) ? parsed.storeItems : [],
      machineRecords: Array.isArray(parsed.machineRecords) ? parsed.machineRecords : [],
      templateVault: Array.isArray(parsed.templateVault) ? parsed.templateVault : [],
    };
  }

  async writeWorkspace(workspace) {
    await this.ensureWorkspaceFile();
    await fs.writeFile(this.filePath, JSON.stringify(workspace, null, 2));
    return workspace;
  }
}

module.exports = {
  JsonPrimeFabricRepository,
  defaultPrimeFabricWorkspace,
};
