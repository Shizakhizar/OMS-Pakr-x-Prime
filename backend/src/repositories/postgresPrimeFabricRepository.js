const pool = require('../config/db');
const { HttpError } = require('../lib/errors');

const defaultPrimeFabricWorkspace = {
  projects: [],
  attendanceRecords: {},
  storeItems: [],
  machineRecords: [],
  templateVault: [],
};

function normalizeCompanyId(companyId) {
  return String(companyId || '').trim().toLowerCase();
}

function isPrimeFabricCompany(companyId) {
  const normalized = normalizeCompanyId(companyId);
  return !normalized || normalized === 'prime_fabric';
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

function parseJsonText(value, fallbackValue) {
  if (!value) {
    return fallbackValue;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallbackValue;
  }
}

function makeDailyEntryItemId(headerId, tailorId, orderItemId) {
  return [headerId, tailorId, orderItemId].join('__');
}

function makeWeeklySettlementId(projectId, weekKey) {
  return ['weekly', projectId, weekKey].join('__');
}

function makeAttendanceRowId(recordId, tailorId) {
  return ['attendance', recordId, tailorId].join('__');
}

function buildAttendanceRecordsMap(attendanceRecordsRows, attendanceRows) {
  const attendanceRecords = {};
  const metaCandidates = attendanceRecordsRows
    .filter(function (row) {
      return String(row.team_meta || '').trim();
    })
    .sort(function (left, right) {
      return String(right.attendance_date || '').localeCompare(String(left.attendance_date || ''));
    });

  const parsedMeta = metaCandidates.length ? parseJsonText(metaCandidates[0].team_meta, null) : null;
  if (parsedMeta && typeof parsedMeta === 'object' && !Array.isArray(parsedMeta)) {
    attendanceRecords.__meta = parsedMeta;
  }

  attendanceRecordsRows.forEach(function (recordRow) {
    const attendanceDateKey = toDateOnlyString(recordRow.attendance_date);

    if (!attendanceDateKey) {
      return;
    }

    attendanceRecords[attendanceDateKey] = attendanceRows
      .filter(function (row) {
        return row.record_id === recordRow.id;
      })
      .map(function (row) {
        return {
          tailorId: String(row.tailor_id || '').trim(),
          tailorName: String(row.tailor_name || '').trim(),
          status: row.status === 'present' ? 'present' : 'absent',
          checkIn: String(row.check_in || ''),
          checkOut: String(row.check_out || ''),
        };
      });
  });

  if (!attendanceRecords.__meta || !Array.isArray(attendanceRecords.__meta.team)) {
    const latestDate = Object.keys(attendanceRecords)
      .filter(function (key) {
        return key !== '__meta';
      })
      .sort(function (left, right) {
        return right.localeCompare(left);
      })[0];
    const latestRows = latestDate && Array.isArray(attendanceRecords[latestDate]) ? attendanceRecords[latestDate] : [];

    attendanceRecords.__meta = {
      team: latestRows.map(function (row, index) {
        return {
          id: row.tailorId || 'attendance_tailor_' + (index + 1),
          name: row.tailorName || 'Employee ' + (index + 1),
        };
      }),
    };
  }

  return attendanceRecords;
}

function buildProjectFromRows(projectRow, orderItemRows, tailorRows, dailyEntryHeaderRows, dailyEntryItemRows, weeklySettlementRows) {
  const projectOrderItems = orderItemRows.map(function (row) {
    return {
      id: row.id,
      itemType: row.item_type,
      targetPieces: Number(row.target_pieces || 0),
      ratePerStitch: toNumber(row.rate_per_stitch),
      clientAmount: toNumber(row.client_amount),
    };
  });

  const projectTailors = tailorRows.map(function (row) {
    return {
      id: row.id,
      name: row.name,
      assignedItemId: row.assigned_item_id || '',
    };
  });

  const projectDailyEntries = dailyEntryHeaderRows.map(function (headerRow) {
    const matrix = projectTailors.map(function () {
      return projectOrderItems.map(function () {
        return 0;
      });
    });

    dailyEntryItemRows.forEach(function (itemRow) {
      if (itemRow.header_id !== headerRow.id) {
        return;
      }

      const tailorIndex = projectTailors.findIndex(function (tailor) {
        return tailor.id === itemRow.tailor_id;
      });
      const orderItemIndex = projectOrderItems.findIndex(function (item) {
        return item.id === itemRow.order_item_id;
      });

      if (tailorIndex === -1 || orderItemIndex === -1) {
        return;
      }

      matrix[tailorIndex][orderItemIndex] = Number(itemRow.quantity || 0);
    });

    return {
      id: headerRow.id,
      date: toDateOnlyString(headerRow.entry_date),
      quantities: matrix.map(function (tailorRow) {
        return tailorRow.reduce(function (sum, value) {
          return sum + Number(value || 0);
        }, 0);
      }),
      tailorItemQuantities: matrix,
      dailyPayout: toNumber(headerRow.daily_payout),
      createdAt: toIsoString(headerRow.created_at),
      createdBy: headerRow.created_by || '',
      updatedAt: toIsoString(headerRow.updated_at),
      updatedBy: headerRow.updated_by || '',
    };
  });

  const weeklySettlements = weeklySettlementRows.map(function (row) {
    return {
      id: row.id,
      weekKey: row.week_key,
      paymentStatus: row.payment_status,
      createdAt: toIsoString(row.created_at),
      createdBy: row.created_by || '',
      updatedAt: toIsoString(row.updated_at),
      updatedBy: row.updated_by || '',
    };
  });

  const lockedAmount = projectOrderItems.reduce(function (sum, item) {
    return sum + toNumber(item.clientAmount);
  }, 0);

  return {
    id: projectRow.id,
    name: projectRow.name,
    startDate: toDateOnlyString(projectRow.start_date),
    deadlineDays: Number(projectRow.deadline_days || 0),
    status: projectRow.status || 'not_started',
    orderItems: projectOrderItems,
    targetPieces: projectOrderItems.reduce(function (sum, item) {
      return sum + Number(item.targetPieces || 0);
    }, 0),
    advancePaymentReceived: toNumber(projectRow.advance_payment_received),
    clientAmount: lockedAmount,
    lockedAmount: lockedAmount,
    tailors: projectTailors,
    teamLocked: Boolean(projectRow.team_locked),
    dailyEntries: projectDailyEntries,
    weeklySettlements: weeklySettlements,
    createdAt: toIsoString(projectRow.created_at),
    createdBy: projectRow.created_by || '',
    updatedAt: toIsoString(projectRow.updated_at),
    updatedBy: projectRow.updated_by || '',
  };
}

class PostgresPrimeFabricRepository {
  constructor(options = {}) {
    this.fallbackRepository = options.fallbackRepository || null;
  }

  async writeProjectGraph(client, project) {
    await client.query(
      `INSERT INTO prime_fabric_projects (id, name, start_date, deadline_days, status, advance_payment_received, team_locked, created_at, created_by, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        project.id,
        project.name,
        toDateOnlyString(project.startDate),
        Number(project.deadlineDays || 0),
        project.status || 'not_started',
        toNumber(project.advancePaymentReceived),
        Boolean(project.teamLocked),
        project.createdAt || new Date().toISOString(),
        project.createdBy || '',
        project.updatedAt || new Date().toISOString(),
        project.updatedBy || '',
      ]
    );

    const orderItems = Array.isArray(project.orderItems) ? project.orderItems : [];
    for (let orderItemIndex = 0; orderItemIndex < orderItems.length; orderItemIndex += 1) {
      const orderItem = orderItems[orderItemIndex];
      await client.query(
        `INSERT INTO prime_fabric_order_items (id, project_id, item_type, target_pieces, rate_per_stitch, client_amount, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderItem.id,
          project.id,
          orderItem.itemType,
          Number(orderItem.targetPieces || 0),
          toNumber(orderItem.ratePerStitch),
          toNumber(orderItem.clientAmount),
          orderItemIndex,
        ]
      );
    }

    const tailors = Array.isArray(project.tailors) ? project.tailors : [];
    for (let tailorIndex = 0; tailorIndex < tailors.length; tailorIndex += 1) {
      const tailor = tailors[tailorIndex];
      await client.query(
        `INSERT INTO prime_fabric_tailors (id, project_id, name, assigned_item_id, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [tailor.id, project.id, tailor.name, tailor.assignedItemId || null, tailorIndex]
      );
    }

    const dailyEntries = Array.isArray(project.dailyEntries) ? project.dailyEntries : [];
    for (const entry of dailyEntries) {
      await this.writeDailyEntry(client, project, entry);
    }

    const weeklySettlements = Array.isArray(project.weeklySettlements) ? project.weeklySettlements : [];
    for (const settlement of weeklySettlements) {
      await client.query(
        `INSERT INTO prime_fabric_weekly_settlements (id, project_id, week_key, payment_status, created_at, created_by, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          settlement.id || makeWeeklySettlementId(project.id, settlement.weekKey),
          project.id,
          settlement.weekKey,
          settlement.paymentStatus || 'not_paid',
          settlement.createdAt || settlement.updatedAt || new Date().toISOString(),
          settlement.createdBy || settlement.updatedBy || '',
          settlement.updatedAt || new Date().toISOString(),
          settlement.updatedBy || '',
        ]
      );
    }
  }

  async writeDailyEntry(client, project, entry) {
    await client.query(
      `INSERT INTO prime_fabric_daily_entry_headers (id, project_id, entry_date, daily_payout, created_at, created_by, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.id,
        project.id,
        toDateOnlyString(entry.date),
        toNumber(entry.dailyPayout),
        entry.createdAt || new Date().toISOString(),
        entry.createdBy || '',
        entry.updatedAt || new Date().toISOString(),
        entry.updatedBy || '',
      ]
    );

    const tailors = Array.isArray(project.tailors) ? project.tailors : [];
    const orderItems = Array.isArray(project.orderItems) ? project.orderItems : [];
    const matrix = Array.isArray(entry.tailorItemQuantities) ? entry.tailorItemQuantities : [];

    for (let tailorIndex = 0; tailorIndex < tailors.length; tailorIndex += 1) {
      const tailor = tailors[tailorIndex];
      const row = Array.isArray(matrix[tailorIndex]) ? matrix[tailorIndex] : [];
      for (let orderItemIndex = 0; orderItemIndex < orderItems.length; orderItemIndex += 1) {
        const orderItem = orderItems[orderItemIndex];
        await client.query(
          `INSERT INTO prime_fabric_daily_entry_items (id, header_id, tailor_id, order_item_id, quantity)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            makeDailyEntryItemId(entry.id, tailor.id, orderItem.id),
            entry.id,
            tailor.id,
            orderItem.id,
            Number(row[orderItemIndex] || 0),
          ]
        );
      }
    }
  }

  async readProjectById(projectId) {
    const projectResult = await pool.query('SELECT * FROM prime_fabric_projects WHERE id = $1', [projectId]);
    const projectRow = projectResult.rows[0];

    if (!projectRow) {
      throw new HttpError(404, 'Project not found.');
    }

    const [orderItemsResult, tailorsResult, dailyEntryHeadersResult, dailyEntryItemsResult, weeklySettlementsResult] =
      await Promise.all([
        pool.query('SELECT * FROM prime_fabric_order_items WHERE project_id = $1 ORDER BY sort_order ASC, id ASC', [projectId]),
        pool.query('SELECT * FROM prime_fabric_tailors WHERE project_id = $1 ORDER BY sort_order ASC, id ASC', [projectId]),
        pool.query('SELECT * FROM prime_fabric_daily_entry_headers WHERE project_id = $1 ORDER BY entry_date ASC, id ASC', [projectId]),
        pool.query(
          'SELECT items.* FROM prime_fabric_daily_entry_items items INNER JOIN prime_fabric_daily_entry_headers headers ON headers.id = items.header_id WHERE headers.project_id = $1 ORDER BY items.header_id ASC, items.tailor_id ASC, items.order_item_id ASC',
          [projectId]
        ),
        pool.query('SELECT * FROM prime_fabric_weekly_settlements WHERE project_id = $1 ORDER BY created_at ASC, id ASC', [projectId]),
      ]);

    return buildProjectFromRows(
      projectRow,
      orderItemsResult.rows,
      tailorsResult.rows,
      dailyEntryHeadersResult.rows,
      dailyEntryItemsResult.rows,
      weeklySettlementsResult.rows
    );
  }

  async readWorkspace(companyId) {
    if (!isPrimeFabricCompany(companyId)) {
      if (this.fallbackRepository) {
        return this.fallbackRepository.readWorkspace();
      }

      return {
        ...defaultPrimeFabricWorkspace,
      };
    }

    const [
      projectsResult,
      orderItemsResult,
      tailorsResult,
      dailyEntryHeadersResult,
      dailyEntryItemsResult,
      weeklySettlementsResult,
      attendanceRecordsResult,
      attendanceRowsResult,
      storeItemsResult,
      machineRecordsResult,
      templateVaultResult,
    ] = await Promise.all([
      pool.query('SELECT * FROM prime_fabric_projects ORDER BY created_at DESC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_order_items ORDER BY project_id ASC, sort_order ASC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_tailors ORDER BY project_id ASC, sort_order ASC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_daily_entry_headers ORDER BY project_id ASC, entry_date ASC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_daily_entry_items ORDER BY header_id ASC, tailor_id ASC, order_item_id ASC'),
      pool.query('SELECT * FROM prime_fabric_weekly_settlements ORDER BY project_id ASC, created_at ASC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_attendance_records ORDER BY attendance_date ASC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_attendance_rows ORDER BY record_id ASC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_store_items ORDER BY updated_at DESC, id ASC'),
      pool.query('SELECT * FROM prime_fabric_machine_records ORDER BY updated_at DESC, id ASC'),
      pool.query('SELECT * FROM template_vault_files WHERE company = $1 ORDER BY uploaded_at DESC', ['prime_fabric']),
    ]);

    const workspace = {
      ...defaultPrimeFabricWorkspace,
      projects: [],
      attendanceRecords: buildAttendanceRecordsMap(attendanceRecordsResult.rows, attendanceRowsResult.rows),
      storeItems: storeItemsResult.rows.map(function (row) {
        return {
          id: row.id,
          name: row.item_name,
          quantity: Number(row.quantity || 0),
          updatedAt: toIsoString(row.updated_at),
        };
      }),
      machineRecords: machineRecordsResult.rows.map(function (row) {
        return {
          id: row.id,
          type: row.machine_name,
          status: row.status || 'working',
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
          uploadedAt: row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }) : '',
          uploadedBy: row.uploaded_by || '',
        };
      }),
    };

    projectsResult.rows.forEach(function (projectRow) {
      workspace.projects.push(
        buildProjectFromRows(
          projectRow,
          orderItemsResult.rows.filter(function (row) {
            return row.project_id === projectRow.id;
          }),
          tailorsResult.rows.filter(function (row) {
            return row.project_id === projectRow.id;
          }),
          dailyEntryHeadersResult.rows.filter(function (row) {
            return row.project_id === projectRow.id;
          }),
          dailyEntryItemsResult.rows,
          weeklySettlementsResult.rows.filter(function (row) {
            return row.project_id === projectRow.id;
          })
        )
      );
    });

    return workspace;
  }

  async writeWorkspace(companyId, data) {
    let workspace = data;
    let normalizedCompanyId = companyId;

    if (data === undefined && companyId && typeof companyId === 'object') {
      workspace = companyId;
      normalizedCompanyId = 'prime_fabric';
    }

    if (!isPrimeFabricCompany(normalizedCompanyId)) {
      if (this.fallbackRepository) {
        return this.fallbackRepository.writeWorkspace(workspace);
      }

      return workspace;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [710017]);

      await client.query('DELETE FROM prime_fabric_daily_entry_items');
      await client.query('DELETE FROM prime_fabric_daily_entry_headers');
      await client.query('DELETE FROM prime_fabric_weekly_settlements');
      await client.query('DELETE FROM prime_fabric_tailors');
      await client.query('DELETE FROM prime_fabric_order_items');
      await client.query('DELETE FROM prime_fabric_projects');
      await client.query('DELETE FROM prime_fabric_attendance_rows');
      await client.query('DELETE FROM prime_fabric_attendance_records');
      await client.query('DELETE FROM prime_fabric_store_items');
      await client.query('DELETE FROM prime_fabric_machine_records');
      await client.query('DELETE FROM template_vault_files WHERE company = $1', ['prime_fabric']);

      const projects = Array.isArray(workspace.projects) ? workspace.projects : [];
      for (const project of projects) {
        await client.query(
          `INSERT INTO prime_fabric_projects (id, name, start_date, deadline_days, status, advance_payment_received, team_locked, created_at, created_by, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            project.id,
            project.name,
            toDateOnlyString(project.startDate),
            Number(project.deadlineDays || 0),
            project.status || 'not_started',
            toNumber(project.advancePaymentReceived),
            Boolean(project.teamLocked),
            project.createdAt || new Date().toISOString(),
            project.createdBy || '',
            project.updatedAt || new Date().toISOString(),
            project.updatedBy || '',
          ]
        );

        const orderItems = Array.isArray(project.orderItems) ? project.orderItems : [];
        for (const orderItem of orderItems) {
          await client.query(
            `INSERT INTO prime_fabric_order_items (id, project_id, item_type, target_pieces, rate_per_stitch, client_amount, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              orderItem.id,
              project.id,
              orderItem.itemType,
              Number(orderItem.targetPieces || 0),
              toNumber(orderItem.ratePerStitch),
              toNumber(orderItem.clientAmount),
              orderItems.indexOf(orderItem),
            ]
          );
        }

        const tailors = Array.isArray(project.tailors) ? project.tailors : [];
        for (const tailor of tailors) {
          await client.query(
            `INSERT INTO prime_fabric_tailors (id, project_id, name, assigned_item_id, sort_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [tailor.id, project.id, tailor.name, tailor.assignedItemId || null, tailors.indexOf(tailor)]
          );
        }

        const dailyEntries = Array.isArray(project.dailyEntries) ? project.dailyEntries : [];
        for (const entry of dailyEntries) {
          await client.query(
            `INSERT INTO prime_fabric_daily_entry_headers (id, project_id, entry_date, daily_payout, created_at, created_by, updated_at, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              entry.id,
              project.id,
              toDateOnlyString(entry.date),
              toNumber(entry.dailyPayout),
              entry.createdAt || new Date().toISOString(),
              entry.createdBy || '',
              entry.updatedAt || new Date().toISOString(),
              entry.updatedBy || '',
            ]
          );

          const matrix = Array.isArray(entry.tailorItemQuantities) ? entry.tailorItemQuantities : [];
          for (let tailorIndex = 0; tailorIndex < tailors.length; tailorIndex += 1) {
            const tailor = tailors[tailorIndex];
            const row = Array.isArray(matrix[tailorIndex]) ? matrix[tailorIndex] : [];
            for (let orderItemIndex = 0; orderItemIndex < orderItems.length; orderItemIndex += 1) {
              const orderItem = orderItems[orderItemIndex];
              const quantity = Number(row[orderItemIndex] || 0);
              await client.query(
                `INSERT INTO prime_fabric_daily_entry_items (id, header_id, tailor_id, order_item_id, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  makeDailyEntryItemId(entry.id, tailor.id, orderItem.id),
                  entry.id,
                  tailor.id,
                  orderItem.id,
                  quantity,
                ]
              );
            }
          }
        }

        const weeklySettlements = Array.isArray(project.weeklySettlements) ? project.weeklySettlements : [];
        for (const settlement of weeklySettlements) {
          await client.query(
            `INSERT INTO prime_fabric_weekly_settlements (id, project_id, week_key, payment_status, created_at, created_by, updated_at, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              settlement.id || makeWeeklySettlementId(project.id, settlement.weekKey),
              project.id,
              settlement.weekKey,
              settlement.paymentStatus || 'not_paid',
              settlement.createdAt || settlement.updatedAt || new Date().toISOString(),
              settlement.createdBy || settlement.updatedBy || '',
              settlement.updatedAt || new Date().toISOString(),
              settlement.updatedBy || '',
            ]
          );
        }
      }

      const attendanceRecords = workspace.attendanceRecords && typeof workspace.attendanceRecords === 'object' && !Array.isArray(workspace.attendanceRecords)
        ? workspace.attendanceRecords
        : {};
      const attendanceMeta = attendanceRecords.__meta && typeof attendanceRecords.__meta === 'object'
        ? attendanceRecords.__meta
        : { team: [] };
      const attendanceDates = Object.keys(attendanceRecords).filter(function (key) {
        return key !== '__meta';
      }).sort();

      for (const attendanceDate of attendanceDates) {
        const normalizedAttendanceDate = toDateOnlyString(attendanceDate);

        if (!normalizedAttendanceDate) {
          continue;
        }

        const recordId = normalizedAttendanceDate;
        const rows = Array.isArray(attendanceRecords[attendanceDate]) ? attendanceRecords[attendanceDate] : [];

        await client.query(
          `INSERT INTO prime_fabric_attendance_records (id, attendance_date, team_meta, created_at)
           VALUES ($1, $2, $3, $4)`,
          [recordId, normalizedAttendanceDate, JSON.stringify(attendanceMeta), new Date().toISOString()]
        );

        for (const row of rows) {
          await client.query(
            `INSERT INTO prime_fabric_attendance_rows (id, record_id, tailor_id, tailor_name, status, check_in, check_out)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              makeAttendanceRowId(recordId, row.tailorId),
              recordId,
              row.tailorId,
              row.tailorName || '',
              row.status || 'absent',
              row.checkIn || '',
              row.checkOut || '',
            ]
          );
        }
      }

      const storeItems = Array.isArray(workspace.storeItems) ? workspace.storeItems : [];
      for (const item of storeItems) {
        await client.query(
          `INSERT INTO prime_fabric_store_items (id, item_name, quantity, updated_at)
           VALUES ($1, $2, $3, $4)`,
          [item.id, item.name, Number(item.quantity || 0), item.updatedAt || new Date().toISOString()]
        );
      }

      const machineRecords = Array.isArray(workspace.machineRecords) ? workspace.machineRecords : [];
      for (const machine of machineRecords) {
        await client.query(
          `INSERT INTO prime_fabric_machine_records (id, machine_name, status, updated_at)
           VALUES ($1, $2, $3, $4)`,
          [machine.id, machine.type, machine.status || 'working', machine.updatedAt || new Date().toISOString()]
        );
      }

      const templateVault = Array.isArray(workspace.templateVault) ? workspace.templateVault : [];
      for (const file of templateVault) {
        await client.query(
          `INSERT INTO template_vault_files (id, company, file_name, extension, content_data_url, file_size, mime_type, uploaded_at, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            file.id,
            'prime_fabric',
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
      return workspace;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createProject(project) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [710017]);
      await this.writeProjectGraph(client, project);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.readProjectById(project.id);
  }

  async updateProject(projectId, payload, authContext) {
    const nextProject = payload && payload.__nextProject ? payload.__nextProject : null;
    if (!nextProject) {
      throw new HttpError(400, 'Updated project payload is required.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [710017]);

      const existingProjectResult = await client.query('SELECT id FROM prime_fabric_projects WHERE id = $1', [projectId]);
      if (!existingProjectResult.rowCount) {
        throw new HttpError(404, 'Project not found.');
      }

      await client.query(
        'DELETE FROM prime_fabric_daily_entry_items WHERE header_id IN (SELECT id FROM prime_fabric_daily_entry_headers WHERE project_id = $1)',
        [projectId]
      );
      await client.query('DELETE FROM prime_fabric_daily_entry_headers WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_weekly_settlements WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_tailors WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_order_items WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_projects WHERE id = $1', [projectId]);

      await this.writeProjectGraph(client, nextProject);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.readProjectById(projectId);
  }

  async deleteProject(projectId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [710017]);
      await client.query(
        'DELETE FROM prime_fabric_daily_entry_items WHERE header_id IN (SELECT id FROM prime_fabric_daily_entry_headers WHERE project_id = $1)',
        [projectId]
      );
      await client.query('DELETE FROM prime_fabric_daily_entry_headers WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_weekly_settlements WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_tailors WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM prime_fabric_order_items WHERE project_id = $1', [projectId]);
      const result = await client.query('DELETE FROM prime_fabric_projects WHERE id = $1', [projectId]);

      if (!result.rowCount) {
        throw new HttpError(404, 'Project not found.');
      }

      await client.query('COMMIT');
      return { ok: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveDailyEntry(projectId, payload, authContext) {
    const project = payload && payload.__project ? payload.__project : null;
    const entry = payload && payload.__entry ? payload.__entry : null;

    if (!project || !entry) {
      throw new HttpError(400, 'Project and entry payload are required.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [710017]);
      const projectResult = await client.query('SELECT id FROM prime_fabric_projects WHERE id = $1', [projectId]);

      if (!projectResult.rowCount) {
        throw new HttpError(404, 'Project not found.');
      }

      await client.query(
        `UPDATE prime_fabric_projects
         SET status = $2, advance_payment_received = $3, team_locked = $4, updated_at = $5, updated_by = $6
         WHERE id = $1`,
        [
          projectId,
          project.status || 'not_started',
          toNumber(project.advancePaymentReceived),
          Boolean(project.teamLocked),
          project.updatedAt || new Date().toISOString(),
          project.updatedBy || authContext.email || '',
        ]
      );

      await client.query('DELETE FROM prime_fabric_daily_entry_items WHERE header_id IN (SELECT id FROM prime_fabric_daily_entry_headers WHERE project_id = $1 AND entry_date = $2)', [
        projectId,
        toDateOnlyString(entry.date),
      ]);
      await client.query('DELETE FROM prime_fabric_daily_entry_headers WHERE project_id = $1 AND entry_date = $2', [
        projectId,
        toDateOnlyString(entry.date),
      ]);

      await this.writeDailyEntry(client, project, entry);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.readProjectById(projectId);
  }

  async saveWeeklySettlement(projectId, payload, authContext) {
    const project = payload && payload.__project ? payload.__project : null;
    const record = payload && payload.__record ? payload.__record : null;

    if (!project || !record) {
      throw new HttpError(400, 'Project and weekly settlement payload are required.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [710017]);
      const projectResult = await client.query('SELECT id FROM prime_fabric_projects WHERE id = $1', [projectId]);

      if (!projectResult.rowCount) {
        throw new HttpError(404, 'Project not found.');
      }

      await client.query(
        `UPDATE prime_fabric_projects
         SET status = $2, advance_payment_received = $3, team_locked = $4, updated_at = $5, updated_by = $6
         WHERE id = $1`,
        [
          projectId,
          project.status || 'not_started',
          toNumber(project.advancePaymentReceived),
          Boolean(project.teamLocked),
          project.updatedAt || new Date().toISOString(),
          project.updatedBy || authContext.email || '',
        ]
      );

      await client.query('DELETE FROM prime_fabric_weekly_settlements WHERE project_id = $1 AND week_key = $2', [
        projectId,
        record.weekKey,
      ]);
      await client.query(
        `INSERT INTO prime_fabric_weekly_settlements (id, project_id, week_key, payment_status, created_at, created_by, updated_at, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          record.id || makeWeeklySettlementId(projectId, record.weekKey),
          projectId,
          record.weekKey,
          record.paymentStatus || 'not_paid',
          record.createdAt || record.updatedAt || new Date().toISOString(),
          record.createdBy || record.updatedBy || authContext.email || '',
          record.updatedAt || new Date().toISOString(),
          record.updatedBy || authContext.email || '',
        ]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.readProjectById(projectId);
  }
}

module.exports = {
  PostgresPrimeFabricRepository,
};
