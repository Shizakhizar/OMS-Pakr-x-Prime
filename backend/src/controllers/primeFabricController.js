function buildPrimeFabricResponse(workspace) {
  return {
    ok: true,
    workspace,
  };
}

function createPrimeFabricController(service) {
  return {
    async getWorkspace(req, res, next) {
      try {
        const workspace = await service.getWorkspace();
        res.json(buildPrimeFabricResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async saveProjects(req, res, next) {
      try {
        const workspace = await service.saveProjects(req.body.projects);
        res.json(buildPrimeFabricResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async listProjects(req, res, next) {
      try {
        const items = await service.listProjects();
        res.json({ ok: true, items });
      } catch (error) {
        next(error);
      }
    },

    async createProject(req, res, next) {
      try {
        const item = await service.createProject(req.body, req.authContext);
        res.status(201).json({ ok: true, item });
      } catch (error) {
        next(error);
      }
    },

    async updateProject(req, res, next) {
      try {
        const item = await service.updateProject(req.params.projectId, req.body, req.authContext);
        res.json({ ok: true, item });
      } catch (error) {
        next(error);
      }
    },

    async deleteProject(req, res, next) {
      try {
        await service.deleteProject(req.params.projectId);
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    },

    async saveDailyEntry(req, res, next) {
      try {
        const item = await service.saveDailyEntry(req.params.projectId, req.body, req.authContext);
        res.json({ ok: true, item });
      } catch (error) {
        next(error);
      }
    },

    async saveWeeklySettlement(req, res, next) {
      try {
        const item = await service.saveWeeklySettlement(req.params.projectId, req.body, req.authContext);
        res.json({ ok: true, item });
      } catch (error) {
        next(error);
      }
    },

    async saveAttendanceRecords(req, res, next) {
      try {
        const workspace = await service.saveAttendanceRecords(req.body.attendanceRecords);
        res.json(buildPrimeFabricResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async saveStoreItems(req, res, next) {
      try {
        const workspace = await service.saveStoreItems(req.body.storeItems);
        res.json(buildPrimeFabricResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async saveMachineRecords(req, res, next) {
      try {
        const workspace = await service.saveMachineRecords(req.body.machineRecords);
        res.json(buildPrimeFabricResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async saveTemplateVault(req, res, next) {
      try {
        const workspace = await service.saveTemplateVault(req.body.templateVault);
        res.json(buildPrimeFabricResponse(workspace));
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createPrimeFabricController,
};
