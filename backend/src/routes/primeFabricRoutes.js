const express = require('express');
const { attachAuthContext } = require('../middleware/authContext');

function createPrimeFabricRoutes(controller) {
  const router = express.Router();

  router.use(attachAuthContext);

  router.get('/workspace', controller.getWorkspace);
  router.get('/projects', controller.listProjects);
  router.post('/projects', controller.createProject);
  router.patch('/projects/:projectId', controller.updateProject);
  router.delete('/projects/:projectId', controller.deleteProject);
  router.put('/projects/:projectId/daily-entries', controller.saveDailyEntry);
  router.put('/projects/:projectId/weekly-settlements', controller.saveWeeklySettlement);
  router.put('/workspace/projects', controller.saveProjects);
  router.put('/workspace/attendance', controller.saveAttendanceRecords);
  router.put('/workspace/store-items', controller.saveStoreItems);
  router.put('/workspace/machines', controller.saveMachineRecords);
  router.put('/workspace/template-vault', controller.saveTemplateVault);

  return router;
}

module.exports = {
  createPrimeFabricRoutes,
};
