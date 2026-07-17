const { randomUUID } = require('crypto');
const { HttpError } = require('../lib/errors');
const {
  requireDateString,
  requireNonNegativeNumber,
  requirePositiveNumber,
  requireString,
} = require('../lib/validators');

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

class PrimeFabricService {
  constructor(repository) {
    this.repository = repository;
  }

  async getWorkspace() {
    return this.repository.readWorkspace();
  }

  async saveProjects(projects) {
    if (!Array.isArray(projects)) {
      throw new HttpError(400, 'projects must be an array.');
    }

    const workspace = await this.getWorkspace();
    workspace.projects = projects;
    return this.repository.writeWorkspace(workspace);
  }

  async listProjects() {
    const workspace = await this.getWorkspace();
    return workspace.projects;
  }

  async createProject(payload, authContext) {
    const workspace = await this.getWorkspace();
    const project = this.buildProjectPayload(payload, authContext, null);

    workspace.projects.unshift(project);
    await this.repository.writeWorkspace(workspace);
    return project;
  }

  async updateProject(projectId, payload, authContext) {
    const { workspace, project } = await this.getProjectContext(projectId);
    this.assertProjectNotFailed(project);
    const nextProject = this.buildProjectPayload(
      {
        ...project,
        ...payload,
      },
      authContext,
      project
    );
    const projectIndex = workspace.projects.findIndex(function (item) {
      return item.id === projectId;
    });

    workspace.projects[projectIndex] = nextProject;
    await this.repository.writeWorkspace(workspace);
    return nextProject;
  }

  async deleteProject(projectId) {
    const workspace = await this.getWorkspace();
    const nextProjects = workspace.projects.filter(function (project) {
      return project.id !== projectId;
    });

    if (nextProjects.length === workspace.projects.length) {
      throw new HttpError(404, 'Project not found.');
    }

    workspace.projects = nextProjects;
    await this.repository.writeWorkspace(workspace);
    return { ok: true };
  }

  async saveDailyEntry(projectId, payload, authContext) {
    const { workspace, project } = await this.getProjectContext(projectId);
    this.assertProjectNotFailed(project);
    const entry = this.buildDailyEntryPayload(payload, project, authContext);
    const existingIndex = Array.isArray(project.dailyEntries)
      ? project.dailyEntries.findIndex(function (item) {
          return item.date === entry.date;
        })
      : -1;
    const existingEntry = existingIndex >= 0 ? project.dailyEntries[existingIndex] : null;
    const existingPieces = existingEntry ? this.getEntryTotalPieces(existingEntry) : 0;
    const nextPieces = this.getEntryTotalPieces(entry);
    const targetPieces = this.getProjectTargetPieces(project);
    const totalPiecesAfterSave = this.getProjectTotalPieces(project) - existingPieces + nextPieces;

    if (targetPieces > 0 && totalPiecesAfterSave > targetPieces) {
      throw new HttpError(400, 'Daily entry exceeds the total order target.');
    }

    this.assertOrderItemTargets(project, entry, existingEntry);

    if (!Array.isArray(project.dailyEntries)) {
      project.dailyEntries = [];
    }

    if (existingIndex >= 0) {
      project.dailyEntries[existingIndex] = entry;
    } else {
      project.dailyEntries.push(entry);
    }

    project.updatedAt = new Date().toISOString();
    project.updatedBy = authContext.email;
    await this.repository.writeWorkspace(workspace);
    return entry;
  }

  async saveWeeklySettlement(projectId, payload, authContext) {
    const { workspace, project } = await this.getProjectContext(projectId);
    this.assertProjectNotFailed(project);
    const weekKey = requireString(payload.weekKey, 'weekKey');
    const paymentStatus = String(payload.paymentStatus || '').trim();

    if (!['paid', 'not_paid'].includes(paymentStatus)) {
      throw new HttpError(400, 'paymentStatus must be paid or not_paid.');
    }

    const productionWeek = this.getProjectProductionWeeks(project).find(function (week) {
      return week.key === weekKey;
    });

    if (!productionWeek) {
      throw new HttpError(404, 'Production week not found.');
    }

    if (productionWeek.dates.length < 7 && paymentStatus === 'paid') {
      throw new HttpError(400, 'Only a complete 7-day production week can be marked paid.');
    }

    if (!Array.isArray(project.weeklySettlements)) {
      project.weeklySettlements = [];
    }

    const existingIndex = project.weeklySettlements.findIndex(function (record) {
      return record.weekKey === weekKey;
    });
    const nextRecord = {
      weekKey,
      paymentStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.email,
    };

    if (existingIndex >= 0) {
      project.weeklySettlements[existingIndex] = {
        ...project.weeklySettlements[existingIndex],
        ...nextRecord,
      };
    } else {
      project.weeklySettlements.push(nextRecord);
    }

    project.updatedAt = new Date().toISOString();
    project.updatedBy = authContext.email;
    await this.repository.writeWorkspace(workspace);
    return nextRecord;
  }

  async saveAttendanceRecords(attendanceRecords) {
    if (!attendanceRecords || typeof attendanceRecords !== 'object' || Array.isArray(attendanceRecords)) {
      throw new HttpError(400, 'attendanceRecords must be an object.');
    }

    const workspace = await this.getWorkspace();
    workspace.attendanceRecords = attendanceRecords;
    return this.repository.writeWorkspace(workspace);
  }

  async saveStoreItems(storeItems) {
    if (!Array.isArray(storeItems)) {
      throw new HttpError(400, 'storeItems must be an array.');
    }

    const workspace = await this.getWorkspace();
    workspace.storeItems = storeItems;
    return this.repository.writeWorkspace(workspace);
  }

  async saveMachineRecords(machineRecords) {
    if (!Array.isArray(machineRecords)) {
      throw new HttpError(400, 'machineRecords must be an array.');
    }

    const workspace = await this.getWorkspace();
    workspace.machineRecords = machineRecords;
    return this.repository.writeWorkspace(workspace);
  }

  async saveTemplateVault(templateVault) {
    if (!Array.isArray(templateVault)) {
      throw new HttpError(400, 'templateVault must be an array.');
    }

    const workspace = await this.getWorkspace();
    workspace.templateVault = templateVault;
    return this.repository.writeWorkspace(workspace);
  }

  async getProjectContext(projectId) {
    const workspace = await this.getWorkspace();
    const project = workspace.projects.find(function (item) {
      return item.id === projectId;
    });

    if (!project) {
      throw new HttpError(404, 'Project not found.');
    }

    return {
      workspace,
      project,
    };
  }

  buildProjectPayload(payload, authContext, existingProject) {
    const name = requireString(payload.name, 'name');
    const startDate = requireDateString(payload.startDate, 'startDate');
    const deadlineDays = requirePositiveNumber(payload.deadlineDays, 'deadlineDays');

    const orderItems = this.normalizeOrderItems(payload.orderItems);
    const tailors = this.normalizeTailors(payload.tailors, orderItems);
    const existingTailors = Array.isArray(existingProject?.tailors)
      ? this.normalizeTailors(existingProject.tailors, orderItems)
      : [];
    const nextTeamLocked = existingProject?.teamLocked
      ? true
      : Boolean(payload.teamLocked != null ? payload.teamLocked : existingProject?.teamLocked);

    if (!orderItems.length) {
      throw new HttpError(400, 'At least one order item is required.');
    }

    if (existingProject?.teamLocked) {
      this.assertLockedTeamShape(existingTailors, tailors);
    }

    const lockedAmount = orderItems.reduce(function (sum, item) {
      return sum + item.clientAmount;
    }, 0);
    const nextStatus = this.getDerivedProjectStatus({
      orderItems,
      tailors,
      teamLocked: nextTeamLocked,
      dailyEntries: Array.isArray(payload.dailyEntries)
        ? payload.dailyEntries.map(function (entry) {
            return cloneValue(entry);
          })
        : Array.isArray(existingProject?.dailyEntries)
          ? cloneValue(existingProject.dailyEntries)
          : [],
    });

    return {
      id: existingProject ? existingProject.id : randomUUID(),
      name,
      startDate,
      deadlineDays,
      status: nextStatus,
      orderItems,
      targetPieces: orderItems.reduce(function (sum, item) {
        return sum + item.targetPieces;
      }, 0),
      advancePaymentReceived: requireNonNegativeNumber(
        payload.advancePaymentReceived != null ? payload.advancePaymentReceived : existingProject?.advancePaymentReceived || 0,
        'advancePaymentReceived'
      ),
      clientAmount: lockedAmount,
      lockedAmount,
      tailors,
      teamLocked: nextTeamLocked,
      dailyEntries: Array.isArray(payload.dailyEntries)
        ? payload.dailyEntries.map(function (entry) {
            return cloneValue(entry);
          })
        : Array.isArray(existingProject?.dailyEntries)
          ? cloneValue(existingProject.dailyEntries)
          : [],
      weeklySettlements: Array.isArray(payload.weeklySettlements)
        ? payload.weeklySettlements.map(function (record) {
            return cloneValue(record);
          })
        : Array.isArray(existingProject?.weeklySettlements)
          ? cloneValue(existingProject.weeklySettlements)
          : [],
      createdAt: existingProject?.createdAt || new Date().toISOString(),
      createdBy: existingProject?.createdBy || authContext.email,
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.email,
    };
  }

  buildDailyEntryPayload(payload, project, authContext) {
    const date = requireDateString(payload.date, 'date');
    this.assertEntryDateAllowed(project, date);

    if (!Array.isArray(payload.tailorItemQuantities)) {
      throw new HttpError(400, 'tailorItemQuantities must be an array.');
    }

    const orderItems = Array.isArray(project.orderItems) ? project.orderItems : [];
    const tailors = Array.isArray(project.tailors) ? project.tailors : [];
    const tailorItemQuantities = payload.tailorItemQuantities.map(function (tailorRow, tailorIndex) {
      if (!Array.isArray(tailorRow)) {
        throw new HttpError(400, 'Each tailor row must be an array.');
      }

      if (tailorIndex >= tailors.length) {
        throw new HttpError(400, 'Tailor quantity row exceeds assigned tailors.');
      }

      return orderItems.map(function (_, itemIndex) {
        return requireNonNegativeNumber(tailorRow[itemIndex] != null ? tailorRow[itemIndex] : 0, 'quantity');
      });
    });

    if (tailorItemQuantities.length !== tailors.length) {
      throw new HttpError(400, 'Daily entry must include all assigned tailors.');
    }

    tailorItemQuantities.forEach(function (tailorRow, tailorIndex) {
      const assignedItemId = String((tailors[tailorIndex] && tailors[tailorIndex].assignedItemId) || '').trim();
      const assignedItemIndex = orderItems.findIndex(function (item) {
        return item.id === assignedItemId;
      });

      if (assignedItemIndex === -1) {
        throw new HttpError(400, 'Each tailor must have one assigned item.');
      }

      tailorRow.forEach(function (quantity, itemIndex) {
        if (itemIndex !== assignedItemIndex && Number(quantity || 0) > 0) {
          throw new HttpError(400, 'A tailor can save pieces only for the assigned item.');
        }
      });
    });

    const quantities = tailorItemQuantities.map(function (tailorRow) {
      return tailorRow.reduce(function (sum, value) {
        return sum + value;
      }, 0);
    });

    const dailyPayout = tailorItemQuantities.reduce(function (sum, tailorRow) {
      return sum + tailorRow.reduce(function (rowSum, quantity, itemIndex) {
        const rate = Number(orderItems[itemIndex] && orderItems[itemIndex].ratePerStitch);
        return rowSum + quantity * (Number.isFinite(rate) ? rate : 0);
      }, 0);
    }, 0);

    const existingEntry = Array.isArray(project.dailyEntries)
      ? project.dailyEntries.find(function (entry) {
          return entry.date === date;
        })
      : null;

    return {
      id: existingEntry ? existingEntry.id : randomUUID(),
      date,
      quantities,
      tailorItemQuantities,
      dailyPayout,
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
      createdBy: existingEntry?.createdBy || authContext.email,
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.email,
    };
  }

  normalizeTailors(tailors, orderItems) {
    if (!Array.isArray(tailors)) {
      throw new HttpError(400, 'tailors must be an array.');
    }

    const itemIds = Array.isArray(orderItems)
      ? orderItems.map(function (item) {
          return item.id;
        })
      : [];
    const defaultItemId = itemIds[0] || '';

    return tailors
      .map(function (tailor) {
        const assignedItemId = String((tailor && tailor.assignedItemId) || defaultItemId).trim() || defaultItemId;

        if (assignedItemId && itemIds.length && !itemIds.includes(assignedItemId)) {
          throw new HttpError(400, 'tailor.assignedItemId must match an order item.');
        }

        return {
          id: String((tailor && tailor.id) || randomUUID()).trim(),
          name: requireString(tailor && tailor.name, 'tailor.name'),
          assignedItemId,
        };
      })
      .filter(function (tailor) {
        return tailor.name;
      });
  }

  assertLockedTeamShape(existingTailors, nextTailors) {
    if (existingTailors.length !== nextTailors.length) {
      throw new HttpError(400, 'Locked tailor team cannot add or remove members.');
    }

    existingTailors.forEach(function (tailor, index) {
      const nextTailor = nextTailors[index];

      if (!nextTailor || nextTailor.id !== tailor.id) {
        throw new HttpError(400, 'Locked tailor team order cannot be changed.');
      }

      if (String(nextTailor.name || '').trim() !== String(tailor.name || '').trim()) {
        throw new HttpError(400, 'Locked tailor team names cannot be changed.');
      }
    });
  }

  getProjectProductionDays(project) {
    const deadlineDays = Number(project.deadlineDays);

    if (!Number.isFinite(deadlineDays) || deadlineDays <= 0) {
      return 0;
    }

    if (deadlineDays === 1) {
      return 1;
    }

    return Math.max(deadlineDays - 1, 1);
  }

  getProjectProductionDueDate(project) {
    const productionDays = this.getProjectProductionDays(project);

    if (!project.startDate || !productionDays) {
      return null;
    }

    const startDate = new Date(project.startDate + 'T00:00:00');

    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + productionDays - 1);
    return dueDate;
  }

  getProjectDueDate(project) {
    const deadlineDays = Number(project.deadlineDays);

    if (!project.startDate || !Number.isFinite(deadlineDays) || deadlineDays <= 0) {
      return null;
    }

    const startDate = new Date(project.startDate + 'T00:00:00');

    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + deadlineDays - 1);
    return dueDate;
  }

  getCurrentDay() {
    return new Date('2026-07-17T00:00:00');
  }

  isProjectFailed(project) {
    const totalTarget = this.getProjectTargetPieces(project);
    const completedPieces = this.getProjectTotalPieces(project);
    const dueDate = this.getProjectDueDate(project);

    if (totalTarget <= 0 || completedPieces >= totalTarget || !dueDate) {
      return false;
    }

    return this.getCurrentDay().getTime() > dueDate.getTime();
  }

  assertProjectNotFailed(project) {
    if (this.isProjectFailed(project)) {
      throw new HttpError(400, 'Project is locked because it failed to complete on time.');
    }
  }

  getProjectProductionWeeks(project) {
    const dailyEntries = Array.isArray(project.dailyEntries) ? project.dailyEntries.slice() : [];
    const sortedEntries = dailyEntries.sort(function (left, right) {
      return String(left.date || '').localeCompare(String(right.date || ''));
    });
    const weeks = [];

    for (let index = 0; index < sortedEntries.length; index += 7) {
      const chunk = sortedEntries.slice(index, index + 7);
      const weekNumber = Math.floor(index / 7) + 1;
      const firstDate = chunk[0] ? chunk[0].date : '';

      weeks.push({
        key: 'production_week_' + weekNumber + '_' + firstDate,
        dates: chunk.map(function (entry) {
          return entry.date;
        }),
      });
    }

    return weeks;
  }

  getWeeklySettlementRecord(project, weekKey) {
    return Array.isArray(project.weeklySettlements)
      ? project.weeklySettlements.find(function (record) {
          return record.weekKey === weekKey;
        }) || null
      : null;
  }

  assertEntryDateAllowed(project, date) {
    const entryDate = new Date(date + 'T00:00:00');
    const startDate = project.startDate ? new Date(project.startDate + 'T00:00:00') : null;
    const productionDueDate = this.getProjectProductionDueDate(project);
    const existingEntries = Array.isArray(project.dailyEntries) ? project.dailyEntries.slice() : [];
    const existingEntry = existingEntries.find(function (entry) {
      return entry.date === date;
    });

    if (Number.isNaN(entryDate.getTime())) {
      throw new HttpError(400, 'date must be a valid project entry date.');
    }

    if (startDate && entryDate < startDate) {
      throw new HttpError(400, 'Daily entry date cannot be before the project start date.');
    }

    if (productionDueDate && entryDate > productionDueDate) {
      throw new HttpError(400, 'Daily entry date cannot be after the project production deadline.');
    }

    if (!existingEntry && existingEntries.length) {
      const latestSavedDate = existingEntries
        .map(function (entry) {
          return entry.date;
        })
        .sort(function (left, right) {
          return right.localeCompare(left);
        })[0];

      if (latestSavedDate && date < latestSavedDate) {
        throw new HttpError(400, 'New daily entries must be saved in forward date order.');
      }
    }

    if (!existingEntry) {
      const productionWeeks = this.getProjectProductionWeeks(project);
      const latestWeek = productionWeeks.length ? productionWeeks[productionWeeks.length - 1] : null;
      const latestWeekSettlement = latestWeek ? this.getWeeklySettlementRecord(project, latestWeek.key) : null;

      if (
        latestWeek &&
        latestWeek.dates.length >= 7 &&
        (!latestWeekSettlement || latestWeekSettlement.paymentStatus !== 'paid')
      ) {
        throw new HttpError(400, 'Current 7-day week must be marked paid before adding a new entry.');
      }
    }
  }

  normalizeOrderItems(orderItems) {
    if (!Array.isArray(orderItems)) {
      throw new HttpError(400, 'orderItems must be an array.');
    }

    return orderItems.map(function (item) {
      return {
        id: String((item && item.id) || randomUUID()).trim(),
        itemType: requireString(item && item.itemType, 'itemType'),
        targetPieces: requireNonNegativeNumber(item && item.targetPieces, 'targetPieces'),
        ratePerStitch: requireNonNegativeNumber(item && item.ratePerStitch, 'ratePerStitch'),
        clientAmount: requireNonNegativeNumber(item && item.clientAmount, 'clientAmount'),
      };
    });
  }

  getProjectTotalPieces(project) {
    return (project.dailyEntries || []).reduce(
      function (sum, entry) {
        return sum + this.getEntryTotalPieces(entry);
      }.bind(this),
      0
    );
  }

  getEntryTotalPieces(entry) {
    return Array.isArray(entry.quantities)
      ? entry.quantities.reduce(function (sum, quantity) {
          const parsedQuantity = Number(quantity);
          return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
        }, 0)
      : 0;
  }

  getProjectTargetPieces(project) {
    return Array.isArray(project.orderItems)
      ? project.orderItems.reduce(function (sum, item) {
          const parsedTarget = Number(item.targetPieces);
          return sum + (Number.isFinite(parsedTarget) ? parsedTarget : 0);
        }, 0)
      : 0;
  }

  getDerivedProjectStatus(project) {
    const totalTarget = this.getProjectTargetPieces(project);
    const completedPieces = this.getProjectTotalPieces(project);

    if (totalTarget > 0 && completedPieces >= totalTarget) {
      return 'completed';
    }

    if (this.isProjectFailed(project)) {
      return 'failed';
    }

    if (project && project.teamLocked) {
      return 'active';
    }

    return 'not_started';
  }

  getEntryItemTotals(entry, itemCount, tailorCount) {
    const quantities = Array.isArray(entry?.tailorItemQuantities)
      ? entry.tailorItemQuantities
      : Array.from({ length: tailorCount }, function () {
          return Array.from({ length: itemCount }, function () {
            return 0;
          });
        });

    return Array.from({ length: itemCount }, function (_, itemIndex) {
      return quantities.reduce(function (sum, tailorRow) {
        const parsedQuantity = Number(tailorRow && tailorRow[itemIndex] !== undefined ? tailorRow[itemIndex] : 0);
        return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
      }, 0);
    });
  }

  getProjectCompletedPiecesByItem(project) {
    const orderItems = Array.isArray(project.orderItems) ? project.orderItems : [];
    const tailorCount = Array.isArray(project.tailors) ? project.tailors.length : 0;

    return orderItems.map(
      function (item, itemIndex) {
        return (project.dailyEntries || []).reduce(
          function (sum, entry) {
            const itemTotals = this.getEntryItemTotals(entry, orderItems.length, tailorCount);
            return sum + Number(itemTotals[itemIndex] || 0);
          }.bind(this),
          0
        );
      }.bind(this)
    );
  }

  assertOrderItemTargets(project, nextEntry, existingEntry) {
    const orderItems = Array.isArray(project.orderItems) ? project.orderItems : [];
    const tailorCount = Array.isArray(project.tailors) ? project.tailors.length : 0;
    const completedByItem = this.getProjectCompletedPiecesByItem(project);
    const nextEntryItemTotals = this.getEntryItemTotals(nextEntry, orderItems.length, tailorCount);
    const existingEntryItemTotals = existingEntry
      ? this.getEntryItemTotals(existingEntry, orderItems.length, tailorCount)
      : orderItems.map(function () {
          return 0;
        });

    orderItems.forEach(function (item, itemIndex) {
      const targetPieces = Number(item.targetPieces || 0);
      const nextItemTotal =
        Number(completedByItem[itemIndex] || 0) -
        Number(existingEntryItemTotals[itemIndex] || 0) +
        Number(nextEntryItemTotals[itemIndex] || 0);

      if (nextItemTotal > targetPieces) {
        throw new HttpError(400, item.itemType + ' exceeds its total target.');
      }
    });
  }
}

module.exports = {
  PrimeFabricService,
};
