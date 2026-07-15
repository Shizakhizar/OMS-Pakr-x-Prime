const express = require('express');
const { attachAuthContext } = require('../middleware/authContext');

function createCompanyWorkspaceRoutes(controller) {
  const router = express.Router({ mergeParams: true });

  router.use(attachAuthContext);

  router.get('/workspace', controller.getWorkspace);

  router.get('/sectors/:sector/organizations', controller.listOrganizations);
  router.post('/sectors/:sector/organizations', controller.createOrganization);

  router.patch('/organizations/:organizationId', controller.updateOrganization);
  router.delete('/organizations/:organizationId', controller.deleteOrganization);
  router.post('/organizations/:organizationId/expenses', controller.addOrganizationExpense);
  router.delete('/organizations/:organizationId/expenses/:expenseId', controller.deleteOrganizationExpense);

  router.get('/funding-entries', controller.listFundingEntries);
  router.post('/funding-entries', controller.createFundingEntry);
  router.delete('/funding-entries/:fundingEntryId', controller.deleteFundingEntry);

  router.get('/daily-expenses', controller.listDailyExpenses);
  router.post('/daily-expenses', controller.createDailyExpense);
  router.delete('/daily-expenses/:dailyExpenseId', controller.deleteDailyExpense);

  router.get('/store-items', controller.listStoreItems);
  router.post('/store-items', controller.createStoreItem);
  router.patch('/store-items/:storeItemId', controller.updateStoreItem);
  router.delete('/store-items/:storeItemId', controller.deleteStoreItem);

  router.get('/template-files', controller.listTemplateFiles);
  router.post('/template-files', controller.createTemplateFile);
  router.get('/template-files/:templateFileId', controller.getTemplateFile);
  router.delete('/template-files/:templateFileId', controller.deleteTemplateFile);

  return router;
}

module.exports = {
  createCompanyWorkspaceRoutes,
};
