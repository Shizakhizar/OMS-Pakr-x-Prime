function buildWorkspaceResponse(workspace) {
  return {
    ok: true,
    workspace,
  };
}

function createCompanyWorkspaceController(workspaceService) {
  return {
    async getWorkspace(req, res, next) {
      try {
        const workspace = await workspaceService.getWorkspace(req.params.companyId);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async listOrganizations(req, res, next) {
      try {
        const items = await workspaceService.listOrganizations(req.params.companyId, req.params.sector);
        res.json({ ok: true, items });
      } catch (error) {
        next(error);
      }
    },

    async createOrganization(req, res, next) {
      try {
        const workspace = await workspaceService.createOrganization(
          req.params.companyId,
          req.params.sector,
          req.body,
          req.authContext
        );
        res.status(201).json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async updateOrganization(req, res, next) {
      try {
        const workspace = await workspaceService.updateOrganization(req.params.companyId, req.params.organizationId, req.body);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async deleteOrganization(req, res, next) {
      try {
        const workspace = await workspaceService.deleteOrganization(req.params.companyId, req.params.organizationId);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async addOrganizationExpense(req, res, next) {
      try {
        const workspace = await workspaceService.addOrganizationExpense(
          req.params.companyId,
          req.params.organizationId,
          req.body,
          req.authContext
        );
        res.status(201).json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async deleteOrganizationExpense(req, res, next) {
      try {
        const workspace = await workspaceService.deleteOrganizationExpense(
          req.params.companyId,
          req.params.organizationId,
          req.params.expenseId
        );
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async listFundingEntries(req, res, next) {
      try {
        const items = await workspaceService.listFundingEntries(req.params.companyId);
        res.json({ ok: true, items });
      } catch (error) {
        next(error);
      }
    },

    async createFundingEntry(req, res, next) {
      try {
        const workspace = await workspaceService.createFundingEntry(req.params.companyId, req.body, req.authContext);
        res.status(201).json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async deleteFundingEntry(req, res, next) {
      try {
        const workspace = await workspaceService.deleteFundingEntry(req.params.companyId, req.params.fundingEntryId);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async listDailyExpenses(req, res, next) {
      try {
        const items = await workspaceService.listDailyExpenses(req.params.companyId);
        res.json({ ok: true, items });
      } catch (error) {
        next(error);
      }
    },

    async createDailyExpense(req, res, next) {
      try {
        const workspace = await workspaceService.createDailyExpense(req.params.companyId, req.body, req.authContext);
        res.status(201).json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async deleteDailyExpense(req, res, next) {
      try {
        const workspace = await workspaceService.deleteDailyExpense(req.params.companyId, req.params.dailyExpenseId);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async listStoreItems(req, res, next) {
      try {
        const items = await workspaceService.listStoreItems(req.params.companyId);
        res.json({ ok: true, items });
      } catch (error) {
        next(error);
      }
    },

    async createStoreItem(req, res, next) {
      try {
        const workspace = await workspaceService.createStoreItem(req.params.companyId, req.body, req.authContext);
        res.status(201).json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async updateStoreItem(req, res, next) {
      try {
        const workspace = await workspaceService.updateStoreItem(req.params.companyId, req.params.storeItemId, req.body);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async deleteStoreItem(req, res, next) {
      try {
        const workspace = await workspaceService.deleteStoreItem(req.params.companyId, req.params.storeItemId);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async listTemplateFiles(req, res, next) {
      try {
        const items = await workspaceService.listTemplateFiles(req.params.companyId);
        res.json({ ok: true, items });
      } catch (error) {
        next(error);
      }
    },

    async createTemplateFile(req, res, next) {
      try {
        const workspace = await workspaceService.createTemplateFile(req.params.companyId, req.body, req.authContext);
        res.status(201).json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },

    async getTemplateFile(req, res, next) {
      try {
        const item = await workspaceService.getTemplateFile(req.params.companyId, req.params.templateFileId);
        res.json({ ok: true, item });
      } catch (error) {
        next(error);
      }
    },

    async deleteTemplateFile(req, res, next) {
      try {
        const workspace = await workspaceService.deleteTemplateFile(req.params.companyId, req.params.templateFileId);
        res.json(buildWorkspaceResponse(workspace));
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createCompanyWorkspaceController,
};
