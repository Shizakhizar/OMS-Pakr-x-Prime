(function () {
  const sessionStorageKey = 'oms_auth_session';
  const activeCompany = document.body.dataset.company || 'prime_fabric';
  const backendUrl = Object.prototype.hasOwnProperty.call(document.body.dataset, 'backendUrl')
    ? document.body.dataset.backendUrl
    : 'http://localhost:4000';

  function getCompanyAssetBase(company) {
    if (company === 'pakrose') {
      return '/pakrose';
    }

    return '/prime-fabric';
  }

  const companyBranding = {
    prime_fabric: {
      pageTitle: 'Prime Fabric Pakistan Dashboard',
      companyName: 'Prime Fabric Pakistan',
      portalTitle: 'Industrial Stitching Portal',
      logo: 'PF',
      logoPath: '/public/plogo.jpeg',
      shellClass: 'bg-slate-900 text-slate-100',
      heroClass: 'from-indigo-500 to-blue-500',
      badgeClass: 'from-indigo-500 to-blue-500',
      accentTextClass: 'text-indigo-300',
      panelClass: 'border-slate-800/80 bg-slate-900/75',
      loginPath: '/prime-fabric/',
    },
    pakrose: {
      pageTitle: 'Pakrose Enterprises Dashboard',
      companyName: 'Pakrose Enterprises',
      portalTitle: 'B2B Global Supply Chain Portal',
      logo: 'PE',
      logoPath: '/public/oklogo.jpeg',
      shellClass: 'bg-slate-950 text-slate-100',
      heroClass: 'from-teal-500 to-emerald-500',
      badgeClass: 'from-teal-500 to-emerald-500',
      accentTextClass: 'text-teal-300',
      panelClass: 'border-teal-900/40 bg-slate-900/80',
      loginPath: '/pakrose/',
    },
  };

  const branding = companyBranding[activeCompany] || companyBranding.prime_fabric;
  const companyAssetBase = getCompanyAssetBase(activeCompany);

  function normalizePath(path) {
    return path.replace(/\/+$/, '') || '/';
  }

  function getRoutePrefix() {
    const currentPath = window.location.pathname.toLowerCase();

    if (currentPath.includes('/pakrose/')) {
      return '/pakrose';
    }

    if (currentPath.includes('/prime-fabric/')) {
      return '/prime-fabric';
    }

    return '';
  }

  function getLoginUrl() {
    const routePrefix = getRoutePrefix();
    return routePrefix ? routePrefix + '/' : '/';
  }

  function loadSession() {
    try {
      const rawSession = window.localStorage.getItem(sessionStorageKey);
      return rawSession ? JSON.parse(rawSession) : null;
    } catch (error) {
      return null;
    }
  }

  function clearSession() {
    window.localStorage.removeItem(sessionStorageKey);
  }

  function renderBrandBadge(element, brandingConfig) {
    if (!element) {
      return;
    }

    element.innerHTML = '';

    if (brandingConfig.logoPath) {
      element.className =
        'flex h-16 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white px-3 py-2 shadow-[0_14px_30px_rgba(15,23,42,0.28)]';
      const logoImage = document.createElement('img');
      logoImage.src = companyAssetBase + brandingConfig.logoPath;
      logoImage.alt = brandingConfig.companyName + ' logo';
      logoImage.className = 'h-full w-full object-contain';
      element.appendChild(logoImage);
      return;
    }

    element.className =
      'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg ' +
      brandingConfig.badgeClass;
    element.innerText = brandingConfig.logo;
  }

  function createEmptyWorkspaceData() {
    return {
      fundingHistory: [],
      government: [],
      ngos: [],
      private: [],
      dailyExpenses: [],
      store: [],
      templateVault: [],
    };
  }

  function redirectToLogin() {
    window.location.replace(getLoginUrl());
  }

  const session = loadSession();

  if (!session || session.company !== activeCompany) {
    redirectToLogin();
    return;
  }

  document.title = branding.pageTitle;
  document.getElementById('pageShell').className =
    'min-h-screen ' + branding.shellClass;
  document.getElementById('heroGlow').className =
    'absolute inset-x-0 top-0 h-64 bg-gradient-to-b opacity-20 blur-3xl ' + branding.heroClass;
  const summaryPanel = document.getElementById('summaryPanel');
  const activityPanel = document.getElementById('activityPanel');
  const accessPanel = document.getElementById('accessPanel');

  if (summaryPanel) {
    summaryPanel.className = 'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  }

  if (activityPanel) {
    activityPanel.className = 'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  }

  if (accessPanel) {
    accessPanel.className = 'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  }

  renderBrandBadge(document.getElementById('brandBadge'), branding);
  document.getElementById('companyName').innerText = branding.companyName;
  document.getElementById('portalTitle').innerText = branding.portalTitle;
  document.getElementById('welcomeUser').innerText = session.name || session.email;
  document.getElementById('userEmail').innerText = session.email;
  document.getElementById('activeCompanyText').innerText = branding.companyName;
  document.getElementById('accessStatus').innerText = 'Access granted';
  document.getElementById('accentText').className = 'text-sm font-medium ' + branding.accentTextClass;

  const loginTime = session.loginAt ? new Date(session.loginAt) : null;
  document.getElementById('lastLogin').innerText =
    loginTime && !Number.isNaN(loginTime.getTime())
      ? loginTime.toLocaleString()
      : 'Authenticated now';

  document.getElementById('signOutButton').addEventListener('click', function () {
    clearSession();

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    redirectToLogin();
  });

  function initializePrimeFabricWorkspace() {
    const workspaceStateKey = 'prime_fabric_workspace_ui_state';
    const projectsStorageKey = 'prime_fabric_projects';
    const attendanceStorageKey = 'prime_fabric_attendance_records';
    const storeStorageKey = 'prime_fabric_store_items';
    const machineStorageKey = 'prime_fabric_machine_records';
    const templateVaultStorageKey = 'prime_fabric_template_vault';
    const getInButton = document.getElementById('getInButton');
    const workspaceBackButton = document.getElementById('workspaceBackButton');
    const dashboardHome = document.getElementById('dashboardHome');
    const workspaceScreen = document.getElementById('primeFabricWorkspace');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const workspaceSubtitle = document.getElementById('workspaceSubtitle');
    const workspaceTitleWrapper = workspaceTitle ? workspaceTitle.closest('div') : null;
    const workspaceHeaderPanel = workspaceTitleWrapper ? workspaceTitleWrapper.parentElement : null;
    const workspaceContent = document.getElementById('primeFabricWorkspaceContent');
    const newProjectButton = document.getElementById('newProjectButton');
    const projectModal = document.getElementById('primeFabricProjectModal');
    const closeProjectModalButton = document.getElementById('closeProjectModalButton');
    const cancelProjectModalButton = document.getElementById('cancelProjectModalButton');
    const saveProjectButton = document.getElementById('saveProjectButton');
    const storeModal = document.getElementById('primeFabricStoreModal');
    const closeStoreModalButton = document.getElementById('closeStoreModalButton');
    const cancelStoreModalButton = document.getElementById('cancelStoreModalButton');
    const saveStoreModalButton = document.getElementById('saveStoreModalButton');
    const storeModalNameInput = document.getElementById('storeModalNameInput');
    const storeModalError = document.getElementById('storeModalError');
    const projectNameInput = document.getElementById('projectNameInput');
    const projectStartDateInput = document.getElementById('projectStartDateInput');
    const projectDeadlineInput = document.getElementById('projectDeadlineInput');
    const projectAdvancePaymentInput = document.getElementById('projectAdvancePaymentInput');
    const addProjectOrderItemButton = document.getElementById('addProjectOrderItemButton');
    const projectOrderItemsContainer = document.getElementById('projectOrderItemsContainer');
    const projectLockedAmountValue = document.getElementById('projectLockedAmountValue');
    const projectModalError = document.getElementById('projectModalError');

    if (
      activeCompany !== 'prime_fabric' ||
      !getInButton ||
      !workspaceBackButton ||
      !dashboardHome ||
      !workspaceScreen ||
      !workspaceTitle ||
      !workspaceSubtitle ||
      !workspaceContent ||
      !newProjectButton ||
      !projectModal ||
      !closeProjectModalButton ||
      !cancelProjectModalButton ||
      !saveProjectButton ||
      !storeModal ||
      !closeStoreModalButton ||
      !cancelStoreModalButton ||
      !saveStoreModalButton ||
      !storeModalNameInput ||
      !storeModalError ||
      !projectNameInput ||
      !projectStartDateInput ||
      !projectDeadlineInput ||
      !projectAdvancePaymentInput ||
      !addProjectOrderItemButton ||
      !projectOrderItemsContainer ||
      !projectLockedAmountValue ||
      !projectModalError
    ) {
      return;
    }

    let currentView = 'home';
    let activeProjectId = null;
    let primeFabricProjects = readLocalArray(projectsStorageKey);
    let primeFabricAttendanceRecords = readLocalObject(attendanceStorageKey);
    let primeFabricStoreItems = readLocalArray(storeStorageKey);
    let primeFabricMachineRecords = readLocalArray(machineStorageKey);
    let primeFabricTemplateVault = readLocalArray(templateVaultStorageKey);
    const primeFabricTemplateVaultInput = document.createElement('input');
    primeFabricTemplateVaultInput.type = 'file';
    primeFabricTemplateVaultInput.className = 'hidden';
    document.body.appendChild(primeFabricTemplateVaultInput);

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function readLocalArray(storageKey) {
      try {
        const rawValue = window.localStorage.getItem(storageKey);
        const parsedValue = rawValue ? JSON.parse(rawValue) : [];
        return Array.isArray(parsedValue) ? parsedValue : [];
      } catch (error) {
        return [];
      }
    }

    function readLocalObject(storageKey) {
      try {
        const rawValue = window.localStorage.getItem(storageKey);
        const parsedValue = rawValue ? JSON.parse(rawValue) : {};
        return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue) ? parsedValue : {};
      } catch (error) {
        return {};
      }
    }

    function saveLocalValue(storageKey, value) {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    }

    function getPrimeFabricRequestHeaders() {
      return {
        'Content-Type': 'application/json',
        'x-oms-user-email': session.email,
        'x-oms-user-name': session.name || '',
      };
    }

    function hasPrimeFabricLocalData() {
      return Boolean(
        primeFabricProjects.length ||
          Object.keys(primeFabricAttendanceRecords).length ||
          primeFabricStoreItems.length ||
          primeFabricMachineRecords.length ||
          primeFabricTemplateVault.length
      );
    }

    function isPrimeFabricWorkspaceEmpty(workspace) {
      return !(
        (workspace.projects && workspace.projects.length) ||
        (workspace.attendanceRecords && Object.keys(workspace.attendanceRecords).length) ||
        (workspace.storeItems && workspace.storeItems.length) ||
        (workspace.machineRecords && workspace.machineRecords.length) ||
        (workspace.templateVault && workspace.templateVault.length)
      );
    }

    function applyPrimeFabricWorkspace(workspace) {
      primeFabricProjects = Array.isArray(workspace.projects) ? workspace.projects : [];
      primeFabricAttendanceRecords =
        workspace.attendanceRecords && typeof workspace.attendanceRecords === 'object' && !Array.isArray(workspace.attendanceRecords)
          ? workspace.attendanceRecords
          : {};
      primeFabricStoreItems = Array.isArray(workspace.storeItems) ? workspace.storeItems : [];
      primeFabricMachineRecords = Array.isArray(workspace.machineRecords) ? workspace.machineRecords : [];
      primeFabricTemplateVault = Array.isArray(workspace.templateVault) ? workspace.templateVault : [];

      saveLocalValue(projectsStorageKey, primeFabricProjects);
      saveLocalValue(attendanceStorageKey, primeFabricAttendanceRecords);
      saveLocalValue(storeStorageKey, primeFabricStoreItems);
      saveLocalValue(machineStorageKey, primeFabricMachineRecords);
      saveLocalValue(templateVaultStorageKey, primeFabricTemplateVault);
    }

    function requestPrimeFabric(path, options) {
      const requestOptions = options || {};
      const method = requestOptions.method || 'GET';
      const headers = requestOptions.headers || {};

      return fetch(backendUrl + '/api/v1/prime-fabric' + path, {
        ...requestOptions,
        method: method,
        headers: {
          ...getPrimeFabricRequestHeaders(),
          ...headers,
        },
      }).then(function (response) {
        return response
          .json()
          .catch(function () {
            return null;
          })
          .then(function (body) {
            if (!response.ok) {
              throw new Error((body && body.message) || 'Prime Fabric request failed.');
            }

            return body;
          });
      });
    }

    function syncPrimeFabricSection(path, payload, options) {
      const requestOptions = options || {};
      return requestPrimeFabric(path, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
        .then(function (payloadBody) {
          if (payloadBody && payloadBody.workspace) {
            applyPrimeFabricWorkspace(payloadBody.workspace);
          }

          return payloadBody;
        })
        .catch(function (error) {
          if (requestOptions.silent) {
            console.warn(error);
            return null;
          }

          console.warn(error);
          throw error;
        });
    }

    function syncPrimeFabricWorkspaceFromLocal() {
      return syncPrimeFabricSection('/workspace/projects', { projects: primeFabricProjects }, { silent: true })
        .then(function () {
          return syncPrimeFabricSection(
            '/workspace/attendance',
            { attendanceRecords: primeFabricAttendanceRecords },
            { silent: true }
          );
        })
        .then(function () {
          return syncPrimeFabricSection('/workspace/store-items', { storeItems: primeFabricStoreItems }, { silent: true });
        })
        .then(function () {
          return syncPrimeFabricSection('/workspace/machines', { machineRecords: primeFabricMachineRecords }, { silent: true });
        })
        .then(function () {
          return syncPrimeFabricSection('/workspace/template-vault', { templateVault: primeFabricTemplateVault }, { silent: true });
        })
        .catch(function (error) {
          console.warn(error);
          return null;
        });
    }

    function setButtonPending(button, isPending, pendingText, defaultText) {
      if (!button) {
        return;
      }

      button.disabled = Boolean(isPending);
      button.innerText = isPending ? pendingText : defaultText;
    }

    function haveTailorAssignmentsChanged(currentTailors, nextTailors) {
      if (!Array.isArray(currentTailors) || !Array.isArray(nextTailors) || currentTailors.length !== nextTailors.length) {
        return true;
      }

      return currentTailors.some(function (tailor, index) {
        const nextTailor = nextTailors[index];
        return !nextTailor || String(tailor.assignedItemId || '') !== String(nextTailor.assignedItemId || '');
      });
    }

    function shouldDeferPrimeFabricRender() {
      const activeElement = document.activeElement;

      if (projectModal && !projectModal.classList.contains('hidden')) {
        return true;
      }

      if (storeModal && !storeModal.classList.contains('hidden')) {
        return true;
      }

      return Boolean(
        activeElement &&
          workspaceScreen.contains(activeElement) &&
          typeof activeElement.matches === 'function' &&
          activeElement.matches('input, textarea, select')
      );
    }

    function fetchPrimeFabricWorkspace(options) {
      const requestOptions = options || {};
      return requestPrimeFabric('/workspace')
        .then(function (payload) {
          const backendWorkspace = payload && payload.workspace ? payload.workspace : {};

          if (isPrimeFabricWorkspaceEmpty(backendWorkspace) && hasPrimeFabricLocalData()) {
            return syncPrimeFabricWorkspaceFromLocal();
          }

          applyPrimeFabricWorkspace(backendWorkspace);
          if (!workspaceScreen.classList.contains('hidden') && (!shouldDeferPrimeFabricRender() || requestOptions.forceRender)) {
            renderCurrentView();
          }
          return payload;
        })
        .catch(function (error) {
          console.warn(error);
          return null;
        });
    }

    function replaceProjectInState(project) {
      const existingIndex = primeFabricProjects.findIndex(function (item) {
        return item.id === project.id;
      });

      if (existingIndex >= 0) {
        primeFabricProjects[existingIndex] = project;
      } else {
        primeFabricProjects.unshift(project);
      }

      saveLocalValue(projectsStorageKey, primeFabricProjects);
    }

    function removeProjectFromState(projectId) {
      primeFabricProjects = primeFabricProjects.filter(function (item) {
        return item.id !== projectId;
      });
      saveLocalValue(projectsStorageKey, primeFabricProjects);
    }

    function createPrimeFabricProject(projectPayload) {
      return requestPrimeFabric('/projects', {
        method: 'POST',
        body: JSON.stringify(projectPayload),
      }).then(function (payload) {
        if (payload && payload.item) {
          replaceProjectInState(payload.item);
        }

        return payload;
      });
    }

    function updatePrimeFabricProject(projectId, projectPayload) {
      return requestPrimeFabric('/projects/' + projectId, {
        method: 'PATCH',
        body: JSON.stringify(projectPayload),
      }).then(function (payload) {
        if (payload && payload.item) {
          replaceProjectInState(payload.item);
        }

        return payload;
      });
    }

    function deletePrimeFabricProject(projectId) {
      return requestPrimeFabric('/projects/' + projectId, {
        method: 'DELETE',
      }).then(function (payload) {
        removeProjectFromState(projectId);
        return payload;
      });
    }

    function savePrimeFabricDailyEntry(projectId, entryPayload) {
      return requestPrimeFabric('/projects/' + projectId + '/daily-entries', {
        method: 'PUT',
        body: JSON.stringify(entryPayload),
      }).then(function (payload) {
        if (payload && payload.item) {
          replaceProjectInState(payload.item);
        }

        return payload;
      });
    }

    function savePrimeFabricWeeklySettlement(projectId, settlementPayload) {
      return requestPrimeFabric('/projects/' + projectId + '/weekly-settlements', {
        method: 'PUT',
        body: JSON.stringify(settlementPayload),
      }).then(function (payload) {
        if (payload && payload.item) {
          replaceProjectInState(payload.item);
        }

        return payload;
      });
    }

    function createId(prefix) {
      return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    }

    function createEmptyOrderItem() {
      return {
        id: createId('order'),
        itemType: '',
        targetPieces: '',
        ratePerStitch: '',
        clientAmount: '',
      };
    }

    function getProjectTailors(project) {
      const orderItems = getProjectOrderItems(project);
      const firstItemId = orderItems[0] ? orderItems[0].id : '';

      if (Array.isArray(project.tailors)) {
        return project.tailors.map(function (tailor, index) {
          if (tailor && typeof tailor === 'object') {
            return {
              id: tailor.id || 'tailor_' + (index + 1),
              name: String(tailor.name || '').trim() || 'Employee ' + (index + 1),
              assignedItemId: String(tailor.assignedItemId || firstItemId).trim() || firstItemId,
            };
          }

          return {
            id: 'tailor_' + (index + 1),
            name: String(tailor || '').trim() || 'Employee ' + (index + 1),
            assignedItemId: firstItemId,
          };
        });
      }

      return [];
    }

    function getTailorAssignedItemId(tailor, orderItems) {
      const itemIds = orderItems.map(function (item) {
        return item.id;
      });
      const assignedItemId = String((tailor && tailor.assignedItemId) || '').trim();

      if (assignedItemId && itemIds.indexOf(assignedItemId) !== -1) {
        return assignedItemId;
      }

      return orderItems[0] ? orderItems[0].id : '';
    }

    function getTailorAssignedItemIndex(tailor, orderItems) {
      const assignedItemId = getTailorAssignedItemId(tailor, orderItems);
      return orderItems.findIndex(function (item) {
        return item.id === assignedItemId;
      });
    }

    function closeStoreModal() {
      storeModal.classList.add('hidden');
      storeModal.classList.remove('flex');
      storeModalNameInput.value = '';
      storeModalError.classList.add('hidden');
      storeModalError.textContent = '';
    }

    function openStoreModal() {
      storeModal.classList.remove('hidden');
      storeModal.classList.add('flex');
      storeModalError.classList.add('hidden');
      storeModalError.textContent = '';
      storeModalNameInput.value = '';
      window.requestAnimationFrame(function () {
        storeModalNameInput.focus();
      });
    }

    function loadProjects() {
      return primeFabricProjects;
    }

    function saveProjects(projects) {
      primeFabricProjects = Array.isArray(projects) ? projects : [];
      saveLocalValue(projectsStorageKey, primeFabricProjects);
      return syncPrimeFabricSection('/workspace/projects', { projects: primeFabricProjects });
    }

    function getAttendanceStorageKey() {
      return attendanceStorageKey;
    }

    function loadAttendanceRecords() {
      return primeFabricAttendanceRecords;
    }

    function saveAttendanceRecords(records) {
      primeFabricAttendanceRecords =
        records && typeof records === 'object' && !Array.isArray(records) ? records : {};
      saveLocalValue(getAttendanceStorageKey(), primeFabricAttendanceRecords);
      return syncPrimeFabricSection('/workspace/attendance', { attendanceRecords: primeFabricAttendanceRecords });
    }

    function getStoreStorageKey() {
      return storeStorageKey;
    }

    function loadStoreItems() {
      return primeFabricStoreItems;
    }

    function saveStoreItems(items) {
      primeFabricStoreItems = Array.isArray(items) ? items : [];
      saveLocalValue(getStoreStorageKey(), primeFabricStoreItems);
      return syncPrimeFabricSection('/workspace/store-items', { storeItems: primeFabricStoreItems });
    }

    function getMachineStorageKey() {
      return machineStorageKey;
    }

    function getTemplateVaultStorageKey() {
      return templateVaultStorageKey;
    }

    function getDefaultMachines() {
      return [
        { id: createId('machine'), type: 'Single Needle Machine', status: 'working' },
        { id: createId('machine'), type: 'Overlock Machine', status: 'working' },
        { id: createId('machine'), type: 'Button Stitch Machine', status: 'faulty' },
        { id: createId('machine'), type: 'Cutting Machine', status: 'working' },
      ];
    }

    function loadMachineRecords() {
      return Array.isArray(primeFabricMachineRecords) && primeFabricMachineRecords.length
        ? primeFabricMachineRecords
        : getDefaultMachines();
    }

    function saveMachineRecords(machines) {
      primeFabricMachineRecords = Array.isArray(machines) ? machines : [];
      saveLocalValue(getMachineStorageKey(), primeFabricMachineRecords);
      return syncPrimeFabricSection('/workspace/machines', { machineRecords: primeFabricMachineRecords });
    }

    function loadTemplateVault() {
      return primeFabricTemplateVault;
    }

    function saveTemplateVault(files) {
      primeFabricTemplateVault = Array.isArray(files) ? files : [];
      saveLocalValue(getTemplateVaultStorageKey(), primeFabricTemplateVault);
      return syncPrimeFabricSection('/workspace/template-vault', { templateVault: primeFabricTemplateVault });
    }

    function loadWorkspaceState() {
      try {
        const rawState = window.sessionStorage.getItem(workspaceStateKey);
        return rawState ? JSON.parse(rawState) : null;
      } catch (error) {
        return null;
      }
    }

    function saveWorkspaceState(isOpen) {
      window.sessionStorage.setItem(
        workspaceStateKey,
        JSON.stringify({
          isOpen: isOpen,
          currentView: currentView,
          activeProjectId: activeProjectId,
        })
      );
    }

    function setWorkspaceHeaderVisible(isVisible) {
      if (!workspaceHeaderPanel) {
        return;
      }

      workspaceHeaderPanel.classList.toggle('hidden', !isVisible);
      workspaceContent.classList.toggle('mt-6', isVisible);
      workspaceContent.classList.toggle('mt-0', !isVisible);
    }

    function clearWorkspaceState() {
      window.sessionStorage.removeItem(workspaceStateKey);
    }

    function getDateOnlyValue(value) {
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

      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const day = String(value.getUTCDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
      }

      return null;
    }

    function formatDate(value) {
      if (!value) {
        return '-';
      }

      const dateOnlyValue = getDateOnlyValue(value);
      if (dateOnlyValue) {
        const parts = dateOnlyValue.split('-');
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        const dateOnly = new Date(year, month, day);
        return Number.isNaN(dateOnly.getTime()) ? value : dateOnly.toLocaleDateString();
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
    }

    function formatCurrency(amount) {
      return Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    function getLockedAmount(clientAmount) {
      const amount = Number(clientAmount);
      return Number.isFinite(amount) ? amount : 0;
    }

    function getCurrentDate() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function getDaysRemaining(project) {
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
      const today = getCurrentDate();
      const diffMs = dueDate.getTime() - today.getTime();
      return Math.ceil(diffMs / 86400000);
    }

    function getProjectById(projectId) {
      return loadProjects().find(function (project) {
        return project.id === projectId;
      }) || null;
    }

    function getProjectOrderItems(project) {
      if (Array.isArray(project.orderItems) && project.orderItems.length) {
        return project.orderItems;
      }

      if (project.itemType || project.targetPieces || project.ratePerStitch || project.clientAmount || project.lockedAmount) {
        return [
          {
            id: createId('legacy_order'),
            itemType: project.itemType || '',
            targetPieces: project.targetPieces || '',
            ratePerStitch: project.ratePerStitch || '',
            clientAmount:
              project.clientAmount !== null && project.clientAmount !== undefined
                ? project.clientAmount
                : project.lockedAmount || '',
          },
        ];
      }

      return [];
    }

    function remapDailyEntriesForTailors(project, nextTailors) {
      const currentTailors = getProjectTailors(project);
      const itemCount = getProjectOrderItems(project).length;

      return (project.dailyEntries || []).map(function (entry) {
        const currentQuantities = getEntryTailorItemQuantities(entry, itemCount, currentTailors.length);
        const nextQuantities = nextTailors.map(function (tailor) {
          const currentIndex = currentTailors.findIndex(function (currentTailor) {
            return currentTailor.id === tailor.id;
          });

          if (currentIndex === -1) {
            return Array.from({ length: itemCount }, function () {
              return 0;
            });
          }

          return currentQuantities[currentIndex] || Array.from({ length: itemCount }, function () {
            return 0;
          });
        });

        return Object.assign({}, entry, {
          quantities: nextQuantities.map(function (tailorRow) {
            return tailorRow.reduce(function (sum, value) {
              return sum + value;
            }, 0);
          }),
          tailorItemQuantities: nextQuantities,
        });
      });
    }

    function getTotalsByTailor(project) {
      const projectTailors = getProjectTailors(project);
      const totals = projectTailors.map(function () {
        return 0;
      });

      (project.dailyEntries || []).forEach(function (entry) {
        if (Array.isArray(entry.tailorItemQuantities)) {
          entry.tailorItemQuantities.forEach(function (tailorRow, tailorIndex) {
            (tailorRow || []).forEach(function (quantity) {
              const parsedQuantity = Number(quantity);
              totals[tailorIndex] += Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
            });
          });
          return;
        }

        (entry.quantities || []).forEach(function (quantity, index) {
          const parsedQuantity = Number(quantity);
          totals[index] += Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
        });
      });

      return totals;
    }

    function getProjectTotalPieces(project) {
      return getTotalsByTailor(project).reduce(function (sum, quantity) {
        return sum + quantity;
      }, 0);
    }

    function createEmptyTailorItemQuantities(itemCount, tailorCount) {
      return Array.from({ length: tailorCount }, function () {
        return Array.from({ length: itemCount }, function () {
          return 0;
        });
      });
    }

    function getEntryTailorItemQuantities(entry, itemCount, tailorCount) {
      if (Array.isArray(entry.tailorItemQuantities)) {
        return Array.from({ length: tailorCount }, function (_, tailorIndex) {
          const savedRow = Array.isArray(entry.tailorItemQuantities[tailorIndex])
            ? entry.tailorItemQuantities[tailorIndex]
            : [];

          return Array.from({ length: itemCount }, function (_, itemIndex) {
            const parsedQuantity = Number(savedRow[itemIndex]);
            return Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
          });
        });
      }

      if (Array.isArray(entry.quantities)) {
        return Array.from({ length: tailorCount }, function (_, tailorIndex) {
          const parsedQuantity = Number(entry.quantities[tailorIndex]);
          return Array.from({ length: itemCount }, function (_, itemIndex) {
            if (itemIndex === 0) {
              return Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
            }

            return 0;
          });
        });
      }

      return createEmptyTailorItemQuantities(itemCount, tailorCount);
    }

    function getTotalPiecesForTailorItem(project, tailorIndex, itemIndex, itemCount) {
      const tailorCount = getProjectTailors(project).length;
      return (project.dailyEntries || []).reduce(function (sum, entry) {
        const quantities = getEntryTailorItemQuantities(entry, itemCount, tailorCount);
        const parsedQuantity = Number(
          quantities[tailorIndex] && quantities[tailorIndex][itemIndex] !== undefined
            ? quantities[tailorIndex][itemIndex]
            : 0
        );
        return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
      }, 0);
    }

    function getProjectCompletedPiecesByItem(project) {
      const orderItems = getProjectOrderItems(project);
      const tailorCount = getProjectTailors(project).length;

      return orderItems.map(function (item, itemIndex) {
        const completedPieces = (project.dailyEntries || []).reduce(function (sum, entry) {
          const quantities = getEntryTailorItemQuantities(entry, orderItems.length, tailorCount);
          return (
            sum +
            quantities.reduce(function (rowSum, tailorRow) {
              const parsedQuantity = Number(tailorRow && tailorRow[itemIndex] !== undefined ? tailorRow[itemIndex] : 0);
              return rowSum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
            }, 0)
          );
        }, 0);
        const targetPieces = Number(item.targetPieces || 0);

        return {
          id: item.id,
          itemType: item.itemType || 'Order item',
          completedPieces: completedPieces,
          remainingPieces: Math.max(targetPieces - completedPieces, 0),
          targetPieces: targetPieces,
        };
      });
    }

    function getEntryItemTotals(entry, itemCount, tailorCount) {
      const quantities = getEntryTailorItemQuantities(entry, itemCount, tailorCount);

      return Array.from({ length: itemCount }, function (_, itemIndex) {
        return quantities.reduce(function (sum, tailorRow) {
          const parsedQuantity = Number(tailorRow && tailorRow[itemIndex] !== undefined ? tailorRow[itemIndex] : 0);
          return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
        }, 0);
      });
    }

    function getPayForTailorRow(quantities, orderItems) {
      return quantities.reduce(function (sum, quantity, itemIndex) {
        const rate = Number(orderItems[itemIndex] && orderItems[itemIndex].ratePerStitch);
        const parsedQuantity = Number(quantity);
        return (
          sum +
          (Number.isFinite(parsedQuantity) ? parsedQuantity : 0) * (Number.isFinite(rate) ? rate : 0)
        );
      }, 0);
    }

    function getSavedTailorItemsForEntry(tailorRow, orderItems) {
      const savedItems = orderItems
        .map(function (item, itemIndex) {
          const pieces = Number(tailorRow && tailorRow[itemIndex] !== undefined ? tailorRow[itemIndex] : 0);
          return {
            itemType: item.itemType || 'Order item',
            pieces: Number.isFinite(pieces) ? pieces : 0,
          };
        })
        .filter(function (item) {
          return item.pieces > 0;
        });

      if (savedItems.length) {
        return savedItems;
      }

      return [
        {
          itemType: orderItems[0] ? orderItems[0].itemType || 'Order item' : '-',
          pieces: 0,
        },
      ];
    }

    function getTotalPayForTailor(project, tailorIndex, orderItems) {
      const tailorCount = getProjectTailors(project).length;
      return (project.dailyEntries || []).reduce(function (sum, entry) {
        const quantities = getEntryTailorItemQuantities(entry, orderItems.length, tailorCount);
        const tailorRow = quantities[tailorIndex] || [];
        return sum + getPayForTailorRow(tailorRow, orderItems);
      }, 0);
    }

    function getOrderItemsTargetPieces(project) {
      return getProjectOrderItems(project).reduce(function (sum, item) {
        const targetPieces = Number(item.targetPieces);
        return sum + (Number.isFinite(targetPieces) ? targetPieces : 0);
      }, 0);
    }

    function getProjectLockedAmount(project) {
      const orderItems = getProjectOrderItems(project);

      if (orderItems.length) {
        return orderItems.reduce(function (sum, item) {
          return sum + getLockedAmount(item.clientAmount);
        }, 0);
      }

      return getLockedAmount(project.lockedAmount);
    }

    function getProjectAdvancePayment(project) {
      return getLockedAmount(project.advancePaymentReceived);
    }

    function getProjectCreditBalance(project) {
      if (project.creditBalance !== null && project.creditBalance !== undefined) {
        const balance = Number(project.creditBalance);
        return Number.isFinite(balance) ? balance : 0;
      }

      return getProjectAdvancePayment(project);
    }

    function getProjectTotalTailorPayment(project) {
      const orderItems = getProjectOrderItems(project);
      return getProjectTailors(project).reduce(function (sum, _, tailorIndex) {
        return sum + getTotalPayForTailor(project, tailorIndex, orderItems);
      }, 0);
    }

    function getAdvanceBalanceRemaining(project) {
      return getProjectAdvancePayment(project) - getProjectTotalTailorPayment(project);
    }

    function getProjectTargetPieces(project) {
      return getOrderItemsTargetPieces(project);
    }

    function getEntryTotalPieces(entry) {
      if (Array.isArray(entry.quantities)) {
        return entry.quantities.reduce(function (sum, quantity) {
          const parsedQuantity = Number(quantity);
          return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
        }, 0);
      }

      return 0;
    }

    function getProjectRemainingPieces(project) {
      return Math.max(getProjectTargetPieces(project) - getProjectTotalPieces(project), 0);
    }

    function getProjectProductionDays(project) {
      const deadlineDays = Number(project.deadlineDays);

      if (!Number.isFinite(deadlineDays) || deadlineDays <= 0) {
        return 0;
      }

      return deadlineDays;
    }

    function getProjectDailyTarget(project) {
      const totalTarget = getProjectTargetPieces(project);
      const productionDays = getProjectProductionDays(project);

      if (!totalTarget || !productionDays) {
        return 0;
      }

      return Math.ceil(totalTarget / productionDays);
    }

    function getProjectDailyTargetsByItem(project) {
      const productionDays = getProjectProductionDays(project);

      if (!productionDays) {
        return [];
      }

      return getProjectOrderItems(project).map(function (item) {
        const targetPieces = Number(item.targetPieces);
        const normalizedTarget = Number.isFinite(targetPieces) ? targetPieces : 0;

        return {
          itemType: item.itemType || 'Order item',
          targetPieces: normalizedTarget,
          dailyTarget: normalizedTarget > 0 ? Math.ceil(normalizedTarget / productionDays) : 0,
        };
      });
    }

    function getTailorDailyTargets(project) {
      const tailors = getProjectTailors(project);
      const orderItems = getProjectOrderItems(project);
      const itemTargets = getProjectDailyTargetsByItem(project);
      const targets = tailors.map(function () {
        return 0;
      });

      orderItems.forEach(function (item, itemIndex) {
        const assignedTailorIndexes = tailors
          .map(function (tailor, tailorIndex) {
            return getTailorAssignedItemId(tailor, orderItems) === item.id ? tailorIndex : -1;
          })
          .filter(function (tailorIndex) {
            return tailorIndex !== -1;
          });
        const dailyTarget = Number(itemTargets[itemIndex] && itemTargets[itemIndex].dailyTarget);

        if (!assignedTailorIndexes.length || !Number.isFinite(dailyTarget) || dailyTarget <= 0) {
          return;
        }

        const baseTarget = Math.floor(dailyTarget / assignedTailorIndexes.length);
        const remainder = dailyTarget % assignedTailorIndexes.length;

        assignedTailorIndexes.forEach(function (tailorIndex, assignedIndex) {
          targets[tailorIndex] =
            baseTarget +
            (assignedIndex >= assignedTailorIndexes.length - remainder && remainder > 0 ? 1 : 0);
        });
      });

      return targets;
    }

    function getProjectDueDate(project) {
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

    function getProjectProductionDueDate(project) {
      const productionDays = getProjectProductionDays(project);

      if (!project.startDate || !productionDays) {
        return null;
      }

      const startDate = new Date(project.startDate + 'T00:00:00');
      if (Number.isNaN(startDate.getTime())) {
        return null;
      }

      const productionDueDate = new Date(startDate);
      productionDueDate.setDate(productionDueDate.getDate() + productionDays - 1);
      return productionDueDate;
    }

    function countScheduledDaysInWeek(project, weekStart, weekEnd) {
      const startDate = project.startDate ? new Date(project.startDate + 'T00:00:00') : null;
      const dueDate = getProjectProductionDueDate(project);

      if (!startDate || Number.isNaN(startDate.getTime()) || !dueDate) {
        return 0;
      }

      const effectiveStart = new Date(Math.max(startDate.getTime(), weekStart.getTime()));
      const effectiveEnd = new Date(Math.min(dueDate.getTime(), weekEnd.getTime()));

      if (effectiveEnd < effectiveStart) {
        return 0;
      }

      return Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 86400000) + 1;
    }

    function formatDateInputValue(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    function getProjectProductionWeeks(project) {
      const dailyEntries = Array.isArray(project.dailyEntries) ? project.dailyEntries.slice() : [];
      const sortedEntries = dailyEntries.sort(function (left, right) {
        return String(left.date || '').localeCompare(String(right.date || ''));
      });
      const weeks = [];

      for (let index = 0; index < sortedEntries.length; index += 7) {
        const chunk = sortedEntries.slice(index, index + 7);
        const weekNumber = Math.floor(index / 7) + 1;
        const firstDate = chunk[0] ? chunk[0].date : '';
        const lastDate = chunk[chunk.length - 1] ? chunk[chunk.length - 1].date : firstDate;
        const weekStart = firstDate ? new Date(firstDate + 'T00:00:00') : null;
        const weekEnd = lastDate ? new Date(lastDate + 'T00:00:00') : weekStart;

        weeks.push({
          key: 'production_week_' + weekNumber + '_' + firstDate,
          weekNumber: weekNumber,
          weekStart: weekStart,
          weekEnd: weekEnd,
          dates: chunk.map(function (entry) {
            return entry.date;
          }),
          entries: chunk,
          totalAmount: chunk.reduce(function (sum, entry) {
            return sum + Number(entry.dailyPayout || 0);
          }, 0),
        });
      }

      return weeks;
    }

    function getWeeklyPayoutSummaries(project) {
      return getProjectProductionWeeks(project)
        .slice()
        .reverse()
        .map(function (week) {
          return {
            key: week.key,
            weekNumber: week.weekNumber,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            dates: week.dates,
            totalAmount: week.totalAmount,
            entries: week.entries,
          };
        });
    }

    function getWeeklySettlementRecords(project) {
      return Array.isArray(project.weeklySettlements) ? project.weeklySettlements : [];
    }

    function getWeeklySettlementRecord(project, weekKey) {
      return getWeeklySettlementRecords(project).find(function (record) {
        return record.weekKey === weekKey;
      }) || null;
    }

    function getProjectPaidWeeklyTotal(project) {
      const weeklySummaries = getWeeklyPayoutSummaries(project);

      return weeklySummaries.reduce(function (sum, week) {
        const settlement = getWeeklySettlementRecord(project, week.key);
        return sum + (settlement && settlement.paymentStatus === 'paid' ? week.totalAmount : 0);
      }, 0);
    }

    function getProjectAvailableCreditBalance(project) {
      return getProjectCreditBalance(project) - getProjectPaidWeeklyTotal(project);
    }

    function getProjectWeeklyProgressSummaries(project) {
      const dailyTarget = getProjectDailyTarget(project);
      const weeklyPayouts = getWeeklyPayoutSummaries(project);
      const chronologicalWeeks = weeklyPayouts
        .slice()
        .sort(function (left, right) {
          return left.weekNumber - right.weekNumber;
        });
      let cumulativePieces = 0;

      const summaries = chronologicalWeeks.map(function (week) {
        const actualPieces = week.entries.reduce(function (sum, entry) {
          return sum + getEntryTotalPieces(entry);
        }, 0);
        const weeklyTarget = Math.min(
          getProjectTargetPieces(project) - cumulativePieces > 0
            ? getProjectTargetPieces(project) - cumulativePieces
            : 0,
          week.dates.length * dailyTarget
        );

        cumulativePieces += actualPieces;

        return {
          key: week.key,
          weekNumber: week.weekNumber,
          weekStart: week.weekStart,
          weekEnd: week.weekEnd,
          actualPieces: actualPieces,
          weeklyTarget: weeklyTarget,
          weeklyPayout: week.totalAmount,
          dates: week.dates,
          entries: week.entries,
          remainingPiecesAfterWeek: Math.max(getProjectTargetPieces(project) - cumulativePieces, 0),
          paymentStatus: (getWeeklySettlementRecord(project, week.key) || {}).paymentStatus || 'not_paid',
        };
      });

      return summaries.sort(function (left, right) {
        return right.weekNumber - left.weekNumber;
      });
    }

    function getTailorRateSummary(project) {
      const rates = getProjectOrderItems(project)
        .map(function (item) {
          const rate = Number(item.ratePerStitch);
          return Number.isFinite(rate) ? rate : null;
        })
        .filter(function (rate) {
          return rate !== null;
        })
        .filter(function (rate, index, list) {
          return list.indexOf(rate) === index;
        });

      if (!rates.length) {
        return '-';
      }

      if (rates.length === 1) {
        return 'Rs ' + formatCurrency(rates[0]);
      }

      return 'Mixed';
    }

    function getOrderItemsSummary(project) {
      const orderItems = getProjectOrderItems(project);

      if (!orderItems.length) {
        return '-';
      }

      return orderItems
        .map(function (item) {
          return item.itemType || 'Order item';
        })
        .join(', ');
    }

    function getProjectStatus(project) {
      const totalTarget = getProjectTargetPieces(project);
      const completedPieces = getProjectTotalPieces(project);
      const dueDate = getProjectDueDate(project);
      const today = getCurrentDate();

      if (totalTarget > 0 && completedPieces >= totalTarget) {
        return 'completed';
      }

      if (totalTarget > 0 && completedPieces < totalTarget && dueDate && today.getTime() > dueDate.getTime()) {
        return 'failed';
      }

      if (project && project.teamLocked) {
        return 'active';
      }

      return 'not_started';
    }

    function getProjectStatusMeta(status) {
      if (status === 'active') {
        return {
          label: 'Active',
          buttonClass: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
        };
      }

      if (status === 'completed') {
        return {
          label: 'Completed',
          buttonClass: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
        };
      }

      if (status === 'failed') {
        return {
          label: 'Failed',
          buttonClass: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
        };
      }

      return {
        label: 'Not Yet Started',
        buttonClass: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
      };
    }

    function getDailyEntryByDate(project, date) {
      return (project.dailyEntries || []).find(function (entry) {
        return entry.date === date;
      }) || null;
    }

    function renderProjectOrderItems(orderItems) {
      projectOrderItemsContainer.innerHTML = orderItems
        .map(function (item, index) {
          return `
            <div class="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.24),rgba(15,23,42,0.42))] p-3 shadow-[0_10px_22px_rgba(2,6,23,0.16)]" data-order-item-id="${item.id}">
              <div class="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Order ${index + 1}</p>
                  <p class="mt-0.5 text-xs text-slate-400">Quantity, tailor rate, and client value.</p>
                </div>
                ${
                  index > 0
                    ? '<button type="button" class="remove-project-order-item rounded-lg border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20">Remove</button>'
                    : ''
                }
              </div>
              <div class="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                <label>
                  <span class="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Article</span>
                  <input
                    type="text"
                    value="${escapeHtml(item.itemType || '')}"
                    data-field="itemType"
                    placeholder="Bedsheets"
                    class="project-order-item-input w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                  />
                </label>
                <label>
                  <span class="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Pieces</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value="${escapeHtml(item.targetPieces || '')}"
                    data-field="targetPieces"
                    placeholder="100"
                    class="project-order-item-input w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                  />
                </label>
                <label>
                  <span class="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Tailor rate</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value="${escapeHtml(item.ratePerStitch || '')}"
                    data-field="ratePerStitch"
                    placeholder="10"
                    class="project-order-item-input w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                  />
                </label>
                <label>
                  <span class="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Client amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value="${escapeHtml(item.clientAmount || '')}"
                    data-field="clientAmount"
                    placeholder="10000"
                    class="project-order-item-input w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/60"
                  />
                </label>
              </div>
            </div>
          `;
        })
        .join('');
    }

    function getProjectOrderItemsFromInputs() {
      return Array.from(projectOrderItemsContainer.querySelectorAll('[data-order-item-id]')).map(function (row) {
        const getValue = function (fieldName) {
          const input = row.querySelector('[data-field="' + fieldName + '"]');
          return input ? input.value : '';
        };

        return {
          id: row.dataset.orderItemId,
          itemType: getValue('itemType'),
          targetPieces: getValue('targetPieces'),
          ratePerStitch: getValue('ratePerStitch'),
          clientAmount: getValue('clientAmount'),
        };
      });
    }

    function closeProjectModal() {
      projectModal.classList.add('hidden');
      projectModal.classList.remove('flex');
      projectNameInput.value = '';
      projectStartDateInput.value = formatDateInputValue(getCurrentDate());
      projectDeadlineInput.value = '';
      projectAdvancePaymentInput.value = '';
      renderProjectOrderItems([createEmptyOrderItem()]);
      projectLockedAmountValue.innerText = 'Rs 0';
      projectModalError.classList.add('hidden');
      projectModalError.innerText = '';
    }

    function openProjectModal() {
      projectModal.classList.remove('hidden');
      projectModal.classList.add('flex');
      projectStartDateInput.value = formatDateInputValue(getCurrentDate());
      projectAdvancePaymentInput.value = '';
      renderProjectOrderItems([createEmptyOrderItem()]);
      projectLockedAmountValue.innerText = 'Rs 0';
      projectModalError.classList.add('hidden');
      projectModalError.innerText = '';
      window.setTimeout(function () {
        projectNameInput.focus();
      }, 0);
    }

    function updateLockedAmountPreview() {
      const lockedAmount = getProjectOrderItemsFromInputs().reduce(function (sum, item) {
        return sum + getLockedAmount(item.clientAmount);
      }, 0);
      projectLockedAmountValue.innerText = 'Rs ' + formatCurrency(lockedAmount);
    }

    function showProjectModalError(message) {
      projectModalError.innerText = message;
      projectModalError.classList.remove('hidden');
      projectModalError.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function getAttendanceMeta(records) {
      const meta = records && typeof records.__meta === 'object' && !Array.isArray(records.__meta) ? records.__meta : {};
      return meta;
    }

    function normalizeAttendanceDateValue(value) {
      const rawValue = String(value || '').trim();

      if (!rawValue) {
        return '';
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        return rawValue;
      }

      const slashMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
        const day = slashMatch[1].padStart(2, '0');
        const month = slashMatch[2].padStart(2, '0');
        const year = slashMatch[3];
        return year + '-' + month + '-' + day;
      }

      const parsedDate = new Date(rawValue);
      if (Number.isNaN(parsedDate.getTime())) {
        return '';
      }

      return formatDateInputValue(parsedDate);
    }

    function normalizeAttendanceTeam(team) {
      if (!Array.isArray(team)) {
        return [];
      }

      return team
        .map(function (member, index) {
          if (member && typeof member === 'object') {
            const name = String(member.name || '').trim();
            if (!name) {
              return null;
            }

            return {
              id: String(member.id || 'attendance_tailor_' + (index + 1)).trim() || 'attendance_tailor_' + (index + 1),
              name: name,
            };
          }

          const name = String(member || '').trim();
          if (!name) {
            return null;
          }

          return {
            id: 'attendance_tailor_' + (index + 1),
            name: name,
          };
        })
        .filter(Boolean);
    }

    function getAttendanceDateKeys(records) {
      return Object.keys(records || {}).filter(function (key) {
        return /^\d{4}-\d{2}-\d{2}$/.test(key);
      });
    }

    function getAttendanceTeamFromSavedRows(records) {
      const latestDate = getAttendanceDateKeys(records)
        .sort(function (left, right) {
          return right.localeCompare(left);
        })[0];
      const rows = latestDate && Array.isArray(records[latestDate]) ? records[latestDate] : [];

      return rows
        .map(function (row, index) {
          const name = String((row && row.tailorName) || '').trim();
          if (!name) {
            return null;
          }

          return {
            id: String((row && row.tailorId) || 'attendance_tailor_' + (index + 1)).trim() || 'attendance_tailor_' + (index + 1),
            name: name,
          };
        })
        .filter(Boolean);
    }

    function getAttendanceTeam(records) {
      const savedTeam = normalizeAttendanceTeam(getAttendanceMeta(records).team);

      if (savedTeam.length) {
        return savedTeam;
      }

      return getAttendanceTeamFromSavedRows(records || {});
    }

    function saveAttendanceTeam(team) {
      const records = loadAttendanceRecords();
      const meta = getAttendanceMeta(records);
      records.__meta = Object.assign({}, meta, {
        team: normalizeAttendanceTeam(team),
      });
      return saveAttendanceRecords(records);
    }

    function getEmptyAttendanceRows() {
      return getAttendanceTeam(loadAttendanceRecords()).map(function (member) {
        return {
          tailorId: member.id,
          tailorName: member.name,
          status: 'absent',
          checkIn: '',
          checkOut: '',
        };
      });
    }

    function getAttendanceRowsForDate(date) {
      const records = loadAttendanceRecords();
      const savedRows = Array.isArray(records[date]) ? records[date] : [];
      const team = getAttendanceTeam(records);

      return team.map(function (member, index) {
        const savedRowById = savedRows.find(function (row) {
          return row && String(row.tailorId || '').trim() === member.id;
        });
        const savedRow = savedRowById || savedRows[index] || {};

        return {
          tailorId: member.id,
          tailorName: member.name,
          status: savedRow.status === 'present' ? 'present' : 'absent',
          checkIn: savedRow.checkIn || '',
          checkOut: savedRow.checkOut || '',
        };
      });
    }

    function renderEmployeeRecord() {
      workspaceTitle.innerText = 'Employee record';
      workspaceSubtitle.innerText = '';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      const todayDate = formatDateInputValue(getCurrentDate());

      workspaceContent.innerHTML = `
        <div class="space-y-4">
          <section>
            <div class="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.8))] p-3.5 shadow-[0_16px_42px_rgba(2,6,23,0.32)]">
              <div class="flex flex-col gap-3 border-b border-white/10 pb-3">
                <div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Attendance operations</p>
                    <h3 class="mt-1.5 text-[1.8rem] font-semibold tracking-tight text-white">Daily workforce register</h3>
                  </div>
                </div>

                <div class="grid gap-2.5 lg:grid-cols-4">
                  <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Selected date</p>
                    <p id="attendanceSelectedDateLabel" class="mt-1.5 text-lg font-semibold text-white"></p>
                    <p class="mt-0.5 text-[11px] text-slate-400">Current sheet</p>
                  </div>
                  <div class="rounded-xl border border-emerald-400/15 bg-emerald-500/10 px-3 py-2.5">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-emerald-200/80">Present</p>
                    <p id="attendancePresentCount" class="mt-1.5 text-[1.75rem] font-semibold leading-none text-white">0</p>
                    <p id="attendanceCoverageText" class="mt-1 text-[11px] text-emerald-100/80">0% coverage</p>
                  </div>
                  <div class="rounded-xl border border-rose-400/15 bg-rose-500/10 px-3 py-2.5">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-rose-200/80">Absent</p>
                    <p id="attendanceAbsentCount" class="mt-1.5 text-[1.75rem] font-semibold leading-none text-white">0</p>
                    <p class="mt-1 text-[11px] text-rose-100/80">Off shift</p>
                  </div>
                  <div class="rounded-xl border border-amber-400/15 bg-amber-500/10 px-3 py-2.5">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">Incomplete</p>
                    <p id="attendanceIncompleteCount" class="mt-1.5 text-[1.75rem] font-semibold leading-none text-white">0</p>
                    <p class="mt-1 text-[11px] text-amber-100/80">Missing timings</p>
                  </div>
                </div>
              </div>

              <div class="mt-3 flex flex-col gap-2.5 xl:flex-row xl:items-end xl:justify-between">
                <label class="max-w-xs flex-1">
                  <span class="mb-1 block text-[11px] font-medium text-slate-300">Attendance date</span>
                  <input
                    id="attendanceDateInput"
                    type="date"
                    value="${escapeHtml(todayDate)}"
                    class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60"
                  />
                </label>
                <div class="grid gap-2 lg:grid-cols-3 xl:w-[27rem]">
                  <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Team size</p>
                    <p id="attendanceTeamSize" class="mt-1 text-[13px] font-semibold text-white">0 employees</p>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Complete logs</p>
                    <p id="attendanceCompletedLogs" class="mt-1 text-[13px] font-semibold text-white">0 entries</p>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                    <p id="attendanceStatusSignal" class="mt-1 text-[13px] font-semibold text-white">Needs review</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] p-4 shadow-[0_18px_52px_rgba(2,6,23,0.3)]">
            <div class="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Attendance team</p>
                <h3 class="mt-2 text-xl font-semibold text-white">Add tailors and save roster</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  id="addAttendanceTailorButton"
                  type="button"
                  class="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25"
                >
                  + Add Tailor
                </button>
                <button
                  id="saveAttendanceTeamButton"
                  type="button"
                  class="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                >
                  Save Team
                </button>
              </div>
            </div>

            <div id="attendanceTeamEditor" class="mt-4 grid gap-3 md:grid-cols-2"></div>
            <p id="attendanceTeamMessage" class="mt-4 text-sm text-slate-400">Saved team will be used for daily attendance and monthly history.</p>
          </section>

          <section class="rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] p-4 shadow-[0_18px_52px_rgba(2,6,23,0.3)]">
            <div class="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">Employee register</p>
                <h3 class="mt-2 text-xl font-semibold text-white">Roster and shift capture</h3>
              </div>
            </div>

            <div class="mt-4 overflow-x-auto">
              <table class="mx-auto min-w-[980px] divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    <th class="px-3 py-2.5 font-medium">Employee</th>
                    <th class="px-3 py-2.5 font-medium">ID</th>
                    <th class="px-3 py-2.5 font-medium">Status</th>
                    <th class="px-3 py-2.5 font-medium">Check In</th>
                    <th class="px-3 py-2.5 font-medium">Check Out</th>
                    <th class="px-3 py-2.5 font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody id="attendanceTableBody" class="divide-y divide-white/10"></tbody>
              </table>
            </div>

            <div class="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p id="attendanceMessage" class="hidden text-xs leading-5 text-slate-300"></p>
              <button
                id="saveAttendanceButton"
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 sm:min-w-[12rem]"
              >
                Save Attendance
              </button>
            </div>
          </section>

          <section class="rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] p-4 shadow-[0_18px_52px_rgba(2,6,23,0.3)]">
            <div class="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex items-center gap-3">
                <span class="h-px w-8 bg-violet-300/60"></span>
                <p class="text-[12px] font-semibold uppercase tracking-[0.24em] text-violet-200">Attendance history</p>
              </div>
              <div class="grid gap-2.5 sm:grid-cols-3">
                <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Saved days</p>
                  <p id="attendanceHistoryDays" class="mt-1.5 text-sm font-semibold text-white">0</p>
                </div>
                <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Latest</p>
                  <p id="attendanceHistoryLatest" class="mt-1.5 text-sm font-semibold text-white">Not saved</p>
                </div>
                <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Average</p>
                  <p id="attendanceHistoryAverage" class="mt-1.5 text-sm font-semibold text-white">0%</p>
                </div>
              </div>
            </div>

            <div id="attendanceHistoryTable" class="mt-4 space-y-4"></div>
          </section>
        </div>
      `;

      const attendanceDateInput = document.getElementById('attendanceDateInput');
      const attendanceTeamEditor = document.getElementById('attendanceTeamEditor');
      const addAttendanceTailorButton = document.getElementById('addAttendanceTailorButton');
      const saveAttendanceTeamButton = document.getElementById('saveAttendanceTeamButton');
      const attendanceTeamMessage = document.getElementById('attendanceTeamMessage');
      const attendanceTableBody = document.getElementById('attendanceTableBody');
      const attendanceMessage = document.getElementById('attendanceMessage');
      const saveAttendanceButton = document.getElementById('saveAttendanceButton');
      const attendanceHistoryTable = document.getElementById('attendanceHistoryTable');
      const attendanceSelectedDateLabel = document.getElementById('attendanceSelectedDateLabel');
      const attendancePresentCount = document.getElementById('attendancePresentCount');
      const attendanceAbsentCount = document.getElementById('attendanceAbsentCount');
      const attendanceIncompleteCount = document.getElementById('attendanceIncompleteCount');
      const attendanceCoverageText = document.getElementById('attendanceCoverageText');
      const attendanceTeamSize = document.getElementById('attendanceTeamSize');
      const attendanceCompletedLogs = document.getElementById('attendanceCompletedLogs');
      const attendanceStatusSignal = document.getElementById('attendanceStatusSignal');
      const attendanceHistoryDays = document.getElementById('attendanceHistoryDays');
      const attendanceHistoryLatest = document.getElementById('attendanceHistoryLatest');
      const attendanceHistoryAverage = document.getElementById('attendanceHistoryAverage');

      function formatShortDate(date) {
        return new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }

      function setAttendanceTeamMessage(message, tone) {
        attendanceTeamMessage.innerText = message;
        attendanceTeamMessage.className =
          tone === 'success'
            ? 'mt-4 text-sm text-emerald-300'
            : tone === 'error'
              ? 'mt-4 text-sm text-rose-300'
              : 'mt-4 text-sm text-slate-400';
      }

      function renderAttendanceTeamEditor() {
        const team = getAttendanceTeam(loadAttendanceRecords());

        attendanceTeamEditor.innerHTML = team.length
          ? team
              .map(function (member, index) {
                return `
                  <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3" data-attendance-team-id="${escapeHtml(member.id)}">
                    <div class="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
                      <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">${index + 1}</div>
                      <div>
                        <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tailor name</p>
                        <input
                          type="text"
                          value="${escapeHtml(member.name)}"
                          class="attendance-team-name-input mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60"
                        />
                      </div>
                      ${
                        index > 0
                          ? '<button type="button" class="remove-attendance-team-member rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20">Remove</button>'
                          : ''
                      }
                    </div>
                  </div>
                `;
              })
              .join('')
          : `
              <div class="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-5 py-8 text-sm text-slate-400 md:col-span-2">
                No attendance tailors added yet. Add your team here, then save it once.
              </div>
            `;
      }

      function readAttendanceTeamEditorRows() {
        return Array.from(attendanceTeamEditor.querySelectorAll('[data-attendance-team-id]'))
          .map(function (row, index) {
            const input = row.querySelector('.attendance-team-name-input');
            return {
              id: row.dataset.attendanceTeamId || 'attendance_tailor_' + (index + 1),
              name: input ? input.value.trim() : '',
            };
          })
          .filter(function (member) {
            return member.name;
          });
      }

      function getAttendanceSummary(rows) {
        const totalEmployees = rows.length;
        const presentCount = rows.filter(function (row) {
          return row.status === 'present';
        }).length;
        const absentCount = totalEmployees - presentCount;
        const completedLogs = rows.filter(function (row) {
          return row.status === 'present' && row.checkIn && row.checkOut;
        }).length;
        const incompleteLogs = presentCount - completedLogs;
        const coverage = totalEmployees ? Math.round((presentCount / totalEmployees) * 100) : 0;

        return {
          totalEmployees: totalEmployees,
          presentCount: presentCount,
          absentCount: absentCount,
          completedLogs: completedLogs,
          incompleteLogs: incompleteLogs,
          coverage: coverage,
        };
      }

      function updateAttendanceInsights(date) {
        const rows = collectAttendanceRows();
        const summary = getAttendanceSummary(rows);
        const statusSignal =
          summary.presentCount === 0
            ? 'No active shift marked'
            : summary.incompleteLogs === 0
              ? 'Ready for final save'
              : 'Needs timing review';

        attendanceSelectedDateLabel.innerText = formatShortDate(date);
        attendancePresentCount.innerText = String(summary.presentCount);
        attendanceAbsentCount.innerText = String(summary.absentCount);
        attendanceIncompleteCount.innerText = String(summary.incompleteLogs);
        attendanceCoverageText.innerText = summary.coverage + '% workforce available';
        attendanceTeamSize.innerText = summary.totalEmployees + ' employees';
        attendanceCompletedLogs.innerText = summary.completedLogs + ' complete logs';
        attendanceStatusSignal.innerText = statusSignal;
      }

      function syncAttendanceRowState(row, isPresent) {
        const checkInInput = row.querySelector('input[data-field="checkIn"]');
        const checkOutInput = row.querySelector('input[data-field="checkOut"]');
        const qualityCell = row.querySelector('[data-attendance-quality]');
        const statusBadge = row.querySelector('[data-attendance-status-badge]');
        const rowSurface = row.querySelector('[data-attendance-surface]');
        const hasCompleteLog = isPresent && checkInInput.value && checkOutInput.value;

        checkInInput.disabled = !isPresent;
        checkOutInput.disabled = !isPresent;

        if (!isPresent) {
          checkInInput.value = '';
          checkOutInput.value = '';
        }

        statusBadge.className = isPresent
          ? 'inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200'
          : 'inline-flex rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200';
        statusBadge.innerText = isPresent ? 'Present' : 'Absent';

        qualityCell.innerHTML = isPresent
          ? hasCompleteLog
              ? '<span class="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Complete</span>'
              : '<span class="inline-flex rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">Missing timing</span>'
          : '<span class="inline-flex rounded-full border border-slate-500/30 bg-slate-700/40 px-3 py-1 text-xs font-semibold text-slate-300">Not scheduled</span>';

        rowSurface.className = isPresent
          ? 'rounded-[1.4rem] border border-emerald-400/12 bg-emerald-500/[0.04]'
          : 'rounded-[1.4rem] border border-white/8 bg-white/[0.03]';
      }

      function downloadAttendanceMonth(group, records) {
        const attendanceTeam = getAttendanceTeam(records);
        const presentInMonth = group.dates.reduce(function (sum, date) {
          const rows = Array.isArray(records[date]) ? records[date] : [];
          return (
            sum +
            rows.filter(function (row) {
              return row.status === 'present';
            }).length
          );
        }, 0);
        const monthlyPresenceRate = Math.round(
          presentInMonth / Math.max(group.dates.length * Math.max(attendanceTeam.length, 1), 1) * 100
        );
        const safeMonthName = group.monthLabel.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
        const workbookHtml =
          '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">' +
          '<head>' +
          '<meta charset="UTF-8">' +
          '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
          '<style>' +
          'body{font-family:Calibri,Segoe UI,Arial,sans-serif;padding:20px;color:#0f172a;background:#ffffff;}' +
          'table{border-collapse:collapse;width:auto;table-layout:fixed;}' +
          'td,th{border:1px solid #cbd5e1;padding:8px 10px;vertical-align:middle;}' +
          '.title{background:#14213d;color:#ffffff;font-size:17pt;font-weight:700;text-align:center;padding:16px 12px;letter-spacing:0.4px;}' +
          '.subtitle{background:#e2e8f0;color:#334155;font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;padding:10px 12px;}' +
          '.metric-label{background:#f8fafc;color:#64748b;font-size:8.5pt;font-weight:700;text-transform:uppercase;text-align:left;}' +
          '.metric-value{background:#ffffff;color:#0f172a;font-size:10.5pt;font-weight:700;text-align:left;}' +
          '.header{background:#0f172a;color:#ffffff;font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;padding:9px 8px;white-space:nowrap;}' +
          '.employee{background:#f8fafc;color:#0f172a;min-width:180px;padding:9px 12px;}' +
          '.employee-name{display:block;font-size:10.5pt;font-weight:700;line-height:1.15;}' +
          '.employee-id{display:block;color:#64748b;font-size:8pt;font-weight:700;margin-top:4px;letter-spacing:1px;}' +
          '.present,.absent,.neutral{font-size:9pt;font-weight:700;text-align:center;padding:8px 6px;line-height:1.15;white-space:nowrap;}' +
          '.present{background:#dcfce7;color:#166534;}' +
          '.absent{background:#ffe4e6;color:#9f1239;}' +
          '.neutral{background:#f8fafc;color:#475569;}' +
          '.time{display:block;font-size:7.5pt;color:#475569;font-weight:600;margin-top:4px;line-height:1.1;white-space:nowrap;}' +
          '</style>' +
          '</head><body>' +
          '<table>' +
          '<tr><td class="title" colspan="' + String(group.dates.length + 1) + '">Employee Attendance Report - ' + escapeHtml(group.monthLabel) + '</td></tr>' +
          '<tr><td class="subtitle" colspan="' + String(group.dates.length + 1) + '">Monthly attendance register exported from Prime Fabric workspace</td></tr>' +
          '<tr>' +
          '<td class="metric-label">Month</td>' +
          '<td class="metric-value" colspan="' + String(group.dates.length) + '">' + escapeHtml(group.monthLabel) + '</td>' +
          '</tr>' +
          '<tr>' +
          '<td class="metric-label">Saved Days</td>' +
          '<td class="metric-value">' + String(group.dates.length) + '</td>' +
          '<td class="metric-label">Presence Rate</td>' +
          '<td class="metric-value">' + String(monthlyPresenceRate) + '%</td>' +
          '<td class="metric-label">Exported On</td>' +
          '<td class="metric-value" colspan="' + String(Math.max(group.dates.length - 4, 1)) + '">' + escapeHtml(new Date().toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })) + '</td>' +
          '</tr>' +
          '</table>' +
          '<table style="margin-top:18px;" width="' + String(700 + (group.dates.length * 260)) + '">' +
          '<colgroup>' +
          '<col width="440" style="width:440px;mso-width-source:userset;">' +
          group.dates
            .map(function () {
              return '<col width="300" style="width:300px;mso-width-source:userset;">';
            })
            .join('') +
          '</colgroup>' +
          '<thead><tr>' +
          '<th class="header">Employee</th>' +
          group.dates
            .map(function (date) {
              return '<th class="header">' + escapeHtml(new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
              })) + '</th>';
            })
            .join('') +
          '</tr></thead><tbody>' +
          attendanceTeam
            .map(function (member, tailorIndex) {
              return (
                '<tr>' +
                '<td class="employee"><span class="employee-name">' + escapeHtml(member.name) + '</span><span class="employee-id">EMP-' + String(tailorIndex + 1).padStart(3, '0') + '</span></td>' +
                group.dates
                  .map(function (date) {
                    const rows = Array.isArray(records[date]) ? records[date] : [];
                    const row =
                      rows.find(function (savedRow) {
                        return savedRow && String(savedRow.tailorId || '').trim() === member.id;
                      }) || rows[tailorIndex] || null;

                    if (!row) {
                      return '<td class="neutral">No record</td>';
                    }

                    if (row.status !== 'present') {
                      return '<td class="absent">Absent</td>';
                    }

                    return (
                      '<td class="present">Present' +
                      '<span class="time">' + escapeHtml((row.checkIn || '--:--') + ' - ' + (row.checkOut || '--:--')) + '</span>' +
                      '</td>'
                    );
                  })
                  .join('') +
                '</tr>'
              );
            })
            .join('') +
          '</tbody></table></body></html>';
        const blob = new Blob(['\ufeff' + workbookHtml], {
          type: 'application/vnd.ms-excel;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = safeMonthName + '_attendance_report.xls';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      function renderAttendanceRows(date) {
        const rows = getAttendanceRowsForDate(date);

        if (!rows.length) {
          attendanceTableBody.innerHTML =
            '<tr><td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">Add and save attendance tailors first to start this register.</td></tr>';
          updateAttendanceInsights(date);
          return;
        }

        attendanceTableBody.innerHTML = rows
          .map(function (row, index) {
            const isPresent = row.status === 'present';
            const employeeCode = 'EMP-' + String(index + 1).padStart(3, '0');
            const logQuality = isPresent
              ? row.checkIn && row.checkOut
                ? '<span class="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Complete</span>'
                : '<span class="inline-flex rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">Missing timing</span>'
              : '<span class="inline-flex rounded-full border border-slate-500/30 bg-slate-700/40 px-3 py-1 text-xs font-semibold text-slate-300">Not scheduled</span>';
            return `
              <tr data-attendance-row-index="${index}" data-attendance-tailor-id="${escapeHtml(row.tailorId)}">
                <td colspan="6" class="px-0 py-2">
                  <div data-attendance-surface class="${isPresent ? 'rounded-[1.1rem] border border-emerald-400/12 bg-emerald-500/[0.04]' : 'rounded-[1.1rem] border border-white/8 bg-white/[0.03]'}">
                    <table class="min-w-full text-xs text-slate-200">
                      <tbody>
                        <tr>
                          <td class="px-3 py-3">
                            <div>
                              <p data-attendance-tailor-name class="font-semibold text-sm text-white">${escapeHtml(row.tailorName)}</p>
                              <p class="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">Tailoring unit</p>
                            </div>
                          </td>
                          <td class="px-3 py-3">
                            <span class="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">${employeeCode}</span>
                          </td>
                          <td class="px-3 py-3">
                            <select
                              data-field="status"
                              class="attendance-field w-36 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400/60"
                            >
                              <option value="absent" ${row.status === 'absent' ? 'selected' : ''}>Absent</option>
                              <option value="present" ${row.status === 'present' ? 'selected' : ''}>Present</option>
                            </select>
                            <div class="mt-1.5">
                              <span data-attendance-status-badge class="${isPresent ? 'inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200' : 'inline-flex rounded-full border border-rose-400/25 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-200'}">${isPresent ? 'Present' : 'Absent'}</span>
                            </div>
                          </td>
                          <td class="px-3 py-3">
                            <input
                              type="time"
                              data-field="checkIn"
                              value="${escapeHtml(row.checkIn)}"
                              ${isPresent ? '' : 'disabled'}
                              class="attendance-field w-32 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400/60"
                            />
                          </td>
                          <td class="px-3 py-3">
                            <input
                              type="time"
                              data-field="checkOut"
                              value="${escapeHtml(row.checkOut)}"
                              ${isPresent ? '' : 'disabled'}
                              class="attendance-field w-32 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400/60"
                            />
                          </td>
                          <td class="px-3 py-3">
                            <div data-attendance-quality>${logQuality}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            `;
          })
          .join('');

        Array.from(attendanceTableBody.querySelectorAll('select[data-field="status"]')).forEach(function (select) {
          select.addEventListener('change', function () {
            const row = select.closest('[data-attendance-row-index]');
            if (!row) {
              return;
            }

            syncAttendanceRowState(row, select.value === 'present');
            updateAttendanceInsights(attendanceDateInput.value);
          });
        });

        Array.from(attendanceTableBody.querySelectorAll('input[data-field="checkIn"], input[data-field="checkOut"]')).forEach(function (input) {
          input.addEventListener('input', function () {
            const row = input.closest('[data-attendance-row-index]');
            if (!row) {
              return;
            }

            const statusField = row.querySelector('[data-field="status"]');
            syncAttendanceRowState(row, statusField && statusField.value === 'present');
            updateAttendanceInsights(attendanceDateInput.value);
          });
        });

        updateAttendanceInsights(date);
      }

      function collectAttendanceRows() {
        return Array.from(attendanceTableBody.querySelectorAll('[data-attendance-row-index]')).map(function (row) {
          const statusField = row.querySelector('[data-field="status"]');
          const checkInField = row.querySelector('[data-field="checkIn"]');
          const checkOutField = row.querySelector('[data-field="checkOut"]');
          const isPresent = statusField && statusField.value === 'present';
          const nameElement = row.querySelector('[data-attendance-tailor-name]');

          return {
            tailorId: row.dataset.attendanceTailorId || '',
            tailorName: nameElement ? nameElement.innerText.trim() : '',
            status: isPresent ? 'present' : 'absent',
            checkIn: isPresent && checkInField ? checkInField.value : '',
            checkOut: isPresent && checkOutField ? checkOutField.value : '',
          };
        });
      }

      function renderAttendanceHistory() {
        const records = loadAttendanceRecords();
        const attendanceTeam = getAttendanceTeam(records);
        const dates = getAttendanceDateKeys(records).sort(function (left, right) {
          return left.localeCompare(right);
        });
        const monthlyGroups = dates.reduce(function (groups, date) {
          const dateObject = new Date(date + 'T00:00:00');
          const monthKey = date.slice(0, 7);
          const existingGroup = groups.find(function (group) {
            return group.key === monthKey;
          });

          if (existingGroup) {
            existingGroup.dates.push(date);
            return groups;
          }

          groups.push({
            key: monthKey,
            monthLabel: dateObject.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            }),
            dates: [date],
          });
          return groups;
        }, []);
        const totalPresent = dates.reduce(function (sum, date) {
          const rows = Array.isArray(records[date]) ? records[date] : [];
          return (
            sum +
            rows.filter(function (row) {
              return row.status === 'present';
            }).length
          );
        }, 0);
        const averagePresence = dates.length
          ? Math.round(totalPresent / Math.max(dates.length * Math.max(attendanceTeam.length, 1), 1) * 100)
          : 0;
        const latestMonthKey = monthlyGroups.length ? monthlyGroups[monthlyGroups.length - 1].key : '';

        attendanceHistoryDays.innerText = String(dates.length);
        attendanceHistoryLatest.innerText = dates.length ? formatShortDate(dates[dates.length - 1]) : 'Not saved';
        attendanceHistoryAverage.innerText = averagePresence + '%';

        attendanceHistoryTable.innerHTML = dates.length
          ? monthlyGroups
              .map(function (group) {
                const presentInMonth = group.dates.reduce(function (sum, date) {
                  const rows = Array.isArray(records[date]) ? records[date] : [];
                  return (
                    sum +
                    rows.filter(function (row) {
                      return row.status === 'present';
                    }).length
                  );
                }, 0);
                const monthlyPresenceRate = Math.round(
                  presentInMonth / Math.max(group.dates.length * Math.max(attendanceTeam.length, 1), 1) * 100
                );
                const isLatestMonth = group.key === latestMonthKey;

                return `
                  <section class="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-3.5 shadow-[0_14px_32px_rgba(2,6,23,0.16)]">
                    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div class="min-w-0">
                        <p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">Attendance month</p>
                        <h4 class="mt-1 text-[1.55rem] font-semibold leading-none text-white">${escapeHtml(group.monthLabel)}</h4>
                        <p class="mt-2 text-[12px] leading-5 text-slate-400">
                          ${isLatestMonth ? 'Current visible attendance block.' : 'Past month record stored in summary mode.'}
                        </p>
                      </div>
                      <div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[11rem_11rem_12rem_12rem]">
                        <div class="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                          <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Saved days</p>
                          <p class="mt-1 text-base font-semibold text-white">${group.dates.length}</p>
                        </div>
                        <div class="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                          <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Presence rate</p>
                          <p class="mt-1 text-base font-semibold text-white">${monthlyPresenceRate}%</p>
                        </div>
                        <button
                          type="button"
                          data-history-download="${escapeHtml(group.key)}"
                          class="inline-flex items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/12 px-3 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                        >
                          Download Excel
                        </button>
                        <button
                          type="button"
                          data-history-toggle="${escapeHtml(group.key)}"
                          data-expanded="${isLatestMonth ? 'true' : 'false'}"
                          class="inline-flex items-center justify-center rounded-xl border ${isLatestMonth ? 'border-cyan-400/30 bg-cyan-500/12 text-cyan-100' : 'border-white/10 bg-slate-950/40 text-slate-200'} px-3 py-2.5 text-sm font-semibold transition hover:bg-white/10"
                        >
                          ${isLatestMonth ? 'Hide details' : 'View details'}
                        </button>
                      </div>
                    </div>

                    <div
                      data-history-panel="${escapeHtml(group.key)}"
                      class="${isLatestMonth ? 'mt-3 overflow-x-auto' : 'mt-3 hidden overflow-x-auto'}"
                    >
                      <table class="min-w-[1200px] divide-y divide-white/10 text-left">
                        <thead>
                          <tr class="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            <th class="px-3 py-2.5 font-medium">Employee</th>
                            ${group.dates
                              .map(function (date) {
                                const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                                  day: 'numeric',
                                  month: 'short',
                                });
                                return '<th class="px-3 py-2.5 font-medium">' + escapeHtml(formattedDate) + '</th>';
                              })
                              .join('')}
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-white/10">
                          ${attendanceTeam
                            .map(function (member, tailorIndex) {
                              return `
                                <tr class="text-xs text-slate-200">
                                  <td class="px-3 py-3 font-medium text-white">
                                    <div>
                                      <p class="font-semibold text-sm text-white">${escapeHtml(member.name)}</p>
                                      <p class="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">EMP-${String(tailorIndex + 1).padStart(3, '0')}</p>
                                    </div>
                                  </td>
                                  ${group.dates
                                    .map(function (date) {
                                      const rows = Array.isArray(records[date]) ? records[date] : [];
                                      const row =
                                        rows.find(function (savedRow) {
                                          return savedRow && String(savedRow.tailorId || '').trim() === member.id;
                                        }) || rows[tailorIndex] || null;

                                      if (!row) {
                                        return '<td class="px-4 py-4 text-slate-500">-</td>';
                                      }

                                      if (row.status !== 'present') {
                                        return '<td class="px-4 py-4"><span class="rounded-full border border-rose-400/20 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200">A</span></td>';
                                      }

                                      const timeText =
                                        (row.checkIn || '--:--') + ' - ' + (row.checkOut || '--:--');

                                      return (
                                        '<td class="px-4 py-4">' +
                                        '<div class="flex flex-col gap-1">' +
                                        '<span class="inline-flex w-fit rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">P</span>' +
                                        '<span class="text-xs text-slate-300">' + escapeHtml(timeText) + '</span>' +
                                        '</div>' +
                                        '</td>'
                                      );
                                    })
                                    .join('')}
                                </tr>
                              `;
                            })
                            .join('')}
                        </tbody>
                      </table>
                    </div>
                  </section>
                `;
              })
              .join('')
          : `
              <div class="rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-slate-400">
                No attendance saved yet. Mark the first daily attendance above.
              </div>
            `;

        Array.from(attendanceHistoryTable.querySelectorAll('[data-history-toggle]')).forEach(function (button) {
          button.addEventListener('click', function () {
            const monthKey = button.getAttribute('data-history-toggle');
            const panel = attendanceHistoryTable.querySelector('[data-history-panel="' + monthKey + '"]');
            const isExpanded = button.getAttribute('data-expanded') === 'true';

            if (!panel) {
              return;
            }

            panel.classList.toggle('hidden', isExpanded);
            button.setAttribute('data-expanded', isExpanded ? 'false' : 'true');
            button.innerText = isExpanded ? 'View details' : 'Hide details';
            button.className = isExpanded
              ? 'inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
              : 'inline-flex items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/12 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-white/10';
          });
        });

        Array.from(attendanceHistoryTable.querySelectorAll('[data-history-download]')).forEach(function (button) {
          button.addEventListener('click', function () {
            const monthKey = button.getAttribute('data-history-download');
            const group = monthlyGroups.find(function (entry) {
              return entry.key === monthKey;
            });

            if (!group) {
              return;
            }

            downloadAttendanceMonth(group, records);
          });
        });
      }

      attendanceDateInput.addEventListener('change', function () {
        const normalizedDate = normalizeAttendanceDateValue(attendanceDateInput.value);

        if (normalizedDate && normalizedDate !== attendanceDateInput.value) {
          attendanceDateInput.value = normalizedDate;
        }

        renderAttendanceRows(normalizedDate);
        attendanceMessage.innerText = 'Attendance loaded for ' + formatDate(normalizedDate) + '.';
        attendanceMessage.className = 'text-sm text-slate-400';
      });

      addAttendanceTailorButton.addEventListener('click', function () {
        const card = document.createElement('div');
        card.className = 'rounded-2xl border border-white/10 bg-white/[0.04] p-3';
        card.setAttribute('data-attendance-team-id', createId('attendance_tailor'));
        card.innerHTML =
          '<div class="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">' +
          '<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">+</div>' +
          '<div>' +
          '<p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tailor name</p>' +
          '<input type="text" class="attendance-team-name-input mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60" />' +
          '</div>' +
          '<button type="button" class="remove-attendance-team-member rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20">Remove</button>' +
          '</div>';
        attendanceTeamEditor.appendChild(card);
        const input = card.querySelector('.attendance-team-name-input');
        if (input) {
          input.focus();
        }
        setAttendanceTeamMessage('Add names, then click Save Team.', 'default');
      });

      attendanceTeamEditor.addEventListener('click', function (event) {
        if (!event.target || !event.target.classList.contains('remove-attendance-team-member')) {
          return;
        }

        const row = event.target.closest('[data-attendance-team-id]');
        if (!row) {
          return;
        }

        row.remove();
      });

      saveAttendanceTeamButton.addEventListener('click', function () {
        const nextTeam = readAttendanceTeamEditorRows();

        if (!nextTeam.length) {
          setAttendanceTeamMessage('Please add at least one tailor before saving the attendance team.', 'error');
          return;
        }

        saveAttendanceTeamButton.disabled = true;
        setAttendanceTeamMessage('Saving attendance team...', 'default');
        renderAttendanceTeamEditor();
        renderAttendanceRows(attendanceDateInput.value);
        renderAttendanceHistory();
        saveAttendanceTeam(nextTeam)
          .then(function () {
            setAttendanceTeamMessage('Attendance team saved successfully.', 'success');
            renderAttendanceTeamEditor();
            renderAttendanceRows(attendanceDateInput.value);
            renderAttendanceHistory();
          })
          .catch(function (error) {
            setAttendanceTeamMessage(error.message || 'Unable to save attendance team.', 'error');
          })
          .finally(function () {
            saveAttendanceTeamButton.disabled = false;
          });
      });

      saveAttendanceButton.addEventListener('click', function () {
        const selectedDate = normalizeAttendanceDateValue(attendanceDateInput.value);

        if (!selectedDate) {
          attendanceMessage.innerText = 'Please select a date before saving attendance.';
          attendanceMessage.className = 'text-sm text-rose-300';
          return;
        }

        if (selectedDate !== attendanceDateInput.value) {
          attendanceDateInput.value = selectedDate;
        }

        const rows = collectAttendanceRows();
        if (!rows.length) {
          attendanceMessage.innerText = 'Please add and save attendance tailors first.';
          attendanceMessage.className = 'text-sm text-rose-300';
          return;
        }
        const records = loadAttendanceRecords();
        records[selectedDate] = rows;
        saveAttendanceButton.disabled = true;
        attendanceMessage.innerText = 'Saving attendance for ' + formatDate(selectedDate) + '...';
        attendanceMessage.className = 'text-sm text-slate-300';
        renderAttendanceHistory();
        saveAttendanceRecords(records)
          .then(function () {
            attendanceMessage.innerText = 'Attendance saved for ' + formatDate(selectedDate) + '.';
            attendanceMessage.className = 'text-sm text-emerald-300';
            renderAttendanceHistory();
          })
          .catch(function (error) {
            attendanceMessage.innerText = error.message || 'Unable to save attendance.';
            attendanceMessage.className = 'text-sm text-rose-300';
          })
          .finally(function () {
            saveAttendanceButton.disabled = false;
          });
      });

      renderAttendanceTeamEditor();
      renderAttendanceRows(todayDate);
      renderAttendanceHistory();
    }

    function renderMachineRecord() {
      workspaceTitle.innerText = 'Machine record';
      workspaceSubtitle.innerText =
        'Keep a simple list of machine types and whether each machine is working or faulty.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      const machines = loadMachineRecords();

      workspaceContent.innerHTML = `
        <div class="space-y-6">
          <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">Machine sheet</p>
                <h3 class="mt-1 text-xl font-semibold text-white">Machine type and status</h3>
              </div>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <th class="px-4 py-3 font-medium">Machine type</th>
                    <th class="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody id="machineRecordTable" class="divide-y divide-white/10">
                  ${machines
                    .map(function (machine) {
                      return `
                        <tr class="text-sm text-slate-200" data-machine-id="${machine.id}">
                          <td class="px-4 py-4 font-medium text-white">${escapeHtml(machine.type)}</td>
                          <td class="px-4 py-4">
                            <select
                              class="machine-status-select w-44 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                              data-machine-id="${machine.id}"
                            >
                              <option value="working" ${machine.status === 'working' ? 'selected' : ''}>Working</option>
                              <option value="faulty" ${machine.status === 'faulty' ? 'selected' : ''}>Faulty</option>
                            </select>
                          </td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      Array.from(document.querySelectorAll('.machine-status-select')).forEach(function (select) {
        select.addEventListener('change', function () {
          const previousValue = loadMachineRecords().find(function (machine) {
            return machine.id === select.dataset.machineId;
          });
          select.disabled = true;
          const updatedMachines = loadMachineRecords().map(function (machine) {
            if (machine.id === select.dataset.machineId) {
              return {
                id: machine.id,
                type: machine.type,
                status: select.value,
              };
            }

            return machine;
          });

          saveMachineRecords(updatedMachines)
            .catch(function (error) {
              if (previousValue) {
                select.value = previousValue.status;
              }
              window.alert(error.message || 'Unable to update machine status.');
            })
            .finally(function () {
              select.disabled = false;
            });
        });
      });
    }

    function renderStoreRecord() {
      workspaceTitle.innerText = 'Store Items';
      workspaceSubtitle.innerText =
        'Add store items and update the available quantity whenever stock changes.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.remove('hidden');
      newProjectButton.innerText = 'Add Item';

      const items = loadStoreItems();

      workspaceContent.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10 text-left">
              <thead>
                <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-4 py-3 font-medium">Item name</th>
                  <th class="px-4 py-3 font-medium">No of item available</th>
                  <th class="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody id="primeFabricStoreTable" class="divide-y divide-white/10">
                ${
                  items.length
                    ? items
                        .map(function (item) {
                          return `
                            <tr class="text-sm text-slate-200">
                              <td class="px-4 py-4">${escapeHtml(item.name || '-')}</td>
                              <td class="px-4 py-4">
                                <div class="flex items-center gap-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value="${escapeHtml(String(item.quantity || 0))}"
                                    disabled
                                    class="store-quantity-input w-32 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/60 disabled:cursor-not-allowed disabled:opacity-80"
                                    data-store-item-id="${item.id}"
                                  />
                                  <button
                                    type="button"
                                    class="edit-store-item inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                                    data-store-item-id="${item.id}"
                                    aria-label="Edit item quantity"
                                  >
                                    &#9998;
                                  </button>
                                  <button
                                    type="button"
                                    class="save-store-item hidden rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                                    data-store-item-id="${item.id}"
                                  >
                                    Save
                                  </button>
                                </div>
                              </td>
                              <td class="px-4 py-4">
                                <button
                                  type="button"
                                  class="delete-store-item rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                  data-store-item-id="${item.id}"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')
                    : `
                      <tr>
                        <td colspan="3" class="px-4 py-10 text-center text-sm text-slate-400">
                          No items added yet. Use Add Item to create the first store entry.
                        </td>
                      </tr>
                    `
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      Array.from(document.querySelectorAll('.edit-store-item')).forEach(function (button) {
        button.addEventListener('click', function () {
          const itemId = button.dataset.storeItemId;
          const input = document.querySelector('.store-quantity-input[data-store-item-id="' + itemId + '"]');
          const saveButton = document.querySelector('.save-store-item[data-store-item-id="' + itemId + '"]');

          if (!input || !saveButton) {
            return;
          }

          input.disabled = false;
          input.classList.remove('bg-slate-950/50');
          input.classList.add('bg-slate-950/80');
          button.classList.add('hidden');
          saveButton.classList.remove('hidden');
          input.focus();
        });
      });

      Array.from(document.querySelectorAll('.save-store-item')).forEach(function (button) {
        button.addEventListener('click', function () {
          const itemId = button.dataset.storeItemId;
          const input = document.querySelector('.store-quantity-input[data-store-item-id="' + itemId + '"]');
          const editButton = document.querySelector('.edit-store-item[data-store-item-id="' + itemId + '"]');

          if (!input || !editButton) {
            return;
          }

          const parsedQuantity = Number(input.value);
          if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
            window.alert('Please enter a valid item quantity.');
            return;
          }

          const updatedItems = loadStoreItems().map(function (item) {
            if (item.id === itemId) {
              return {
                id: item.id,
                name: item.name,
                quantity: parsedQuantity,
              };
            }

            return item;
          });

          saveStoreItems(updatedItems)
            .then(function () {
              input.disabled = true;
              input.classList.remove('bg-slate-950/80');
              input.classList.add('bg-slate-950/50');
              button.classList.add('hidden');
              editButton.classList.remove('hidden');
            })
            .catch(function (error) {
              window.alert(error.message || 'Unable to save store item.');
            });
        });
      });

      Array.from(document.querySelectorAll('.delete-store-item')).forEach(function (button) {
        button.addEventListener('click', function () {
          const updatedItems = loadStoreItems().filter(function (item) {
            return item.id !== button.dataset.storeItemId;
          });
          saveStoreItems(updatedItems)
            .then(function () {
              renderStoreRecord();
            })
            .catch(function (error) {
              window.alert(error.message || 'Unable to delete store item.');
            });
        });
      });
    }

    function formatFileSize(bytes) {
      const parsedBytes = Number(bytes);

      if (!Number.isFinite(parsedBytes) || parsedBytes <= 0) {
        return '0 B';
      }

      const units = ['B', 'KB', 'MB', 'GB'];
      const unitIndex = Math.min(Math.floor(Math.log(parsedBytes) / Math.log(1024)), units.length - 1);
      const normalizedSize = parsedBytes / Math.pow(1024, unitIndex);
      return normalizedSize.toFixed(unitIndex === 0 ? 0 : 1) + ' ' + units[unitIndex];
    }

    function renderTemplateVaultRecord() {
      setWorkspaceHeaderVisible(false);
      workspaceTitle.innerText = '';
      workspaceSubtitle.innerText = '';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      const files = loadTemplateVault();

      workspaceContent.innerHTML = `
        <section class="space-y-6">
          <div class="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Prime Fabric Workspace</p>
              <h3 class="mt-1 text-[2.15rem] font-semibold tracking-tight text-white">Template Vault</h3>
              <p class="mt-1.5 max-w-3xl text-[13px] leading-7 text-slate-400">
                Store files and templates here so they can be uploaded and downloaded from one place.
              </p>
            </div>
            <button
              id="primeFabricTemplateVaultUploadButton"
              type="button"
              class="inline-flex items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/12 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Upload File
            </button>
          </div>

          <div class="mt-6 rounded-[1.8rem] border border-white/10 bg-slate-950/28 p-5">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    <th class="px-4 py-4 font-medium">File name</th>
                    <th class="px-4 py-4 font-medium">Type</th>
                    <th class="px-4 py-4 font-medium">Uploaded</th>
                    <th class="px-4 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10">
                  ${
                    files.length
                      ? files
                          .map(function (file) {
                            return `
                              <tr class="text-sm text-slate-200">
                                <td class="px-4 py-4 font-medium text-white">${escapeHtml(file.name || '-')}</td>
                                <td class="px-4 py-4">${escapeHtml(file.extension || '-')}</td>
                                <td class="px-4 py-4">${escapeHtml(file.uploadedAt || '-')}</td>
                                <td class="px-4 py-4">
                                  <div class="flex flex-wrap items-center gap-3">
                                    <button
                                      type="button"
                                      class="download-template-file rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                                      data-template-file-id="${file.id}"
                                    >
                                      Download
                                    </button>
                                    <button
                                      type="button"
                                      class="delete-template-file rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                      data-template-file-id="${file.id}"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          })
                          .join('')
                      : `
                        <tr>
                          <td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400">
                            No templates uploaded yet. Use Upload File to add files to the vault.
                          </td>
                        </tr>
                      `
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      `;

      const uploadButton = document.getElementById('primeFabricTemplateVaultUploadButton');
      if (uploadButton) {
        uploadButton.addEventListener('click', function () {
          primeFabricTemplateVaultInput.value = '';
          primeFabricTemplateVaultInput.click();
        });
      }

      Array.from(document.querySelectorAll('.download-template-file')).forEach(function (button) {
        button.addEventListener('click', function () {
          const targetFile = loadTemplateVault().find(function (file) {
            return file.id === button.dataset.templateFileId;
          });

          if (!targetFile || !targetFile.contentDataUrl) {
            return;
          }

          const downloadLink = document.createElement('a');
          downloadLink.href = targetFile.contentDataUrl;
          downloadLink.download = targetFile.name || 'download';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });
      });

      Array.from(document.querySelectorAll('.delete-template-file')).forEach(function (button) {
        button.addEventListener('click', function () {
          const nextFiles = loadTemplateVault().filter(function (file) {
            return file.id !== button.dataset.templateFileId;
          });

          saveTemplateVault(nextFiles)
            .then(function () {
              renderTemplateVaultRecord();
            })
            .catch(function (error) {
              window.alert(error.message || 'Unable to delete template file.');
            });
        });
      });
    }

    function renderWorkspaceHome() {
      setWorkspaceHeaderVisible(true);
      workspaceTitle.innerText = 'Records';
      workspaceSubtitle.innerText =
        'Choose which Prime Fabric record area you want to open.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      workspaceContent.innerHTML = `
        <div class="grid gap-5 lg:grid-cols-2">
          <button
            type="button"
            class="workspace-home-card rounded-3xl border border-white/10 bg-black/20 p-6 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-indigo-500/10"
            data-workspace-target="employees"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Prime Fabric</p>
            <h3 class="mt-4 text-3xl font-semibold text-white">Employee record</h3>
            <p class="mt-4 text-sm leading-6 text-slate-400">
              Open employee and tailor records. This section is ready for the next step.
            </p>
          </button>

          <button
            type="button"
            class="workspace-home-card rounded-3xl border border-white/10 bg-black/20 p-6 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-indigo-500/10"
            data-workspace-target="projects"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Prime Fabric</p>
            <h3 class="mt-4 text-3xl font-semibold text-white">Project record</h3>
            <p class="mt-4 text-sm leading-6 text-slate-400">
              Open all stitching projects, create new ones, and track tailor production by day.
            </p>
          </button>

          <button
            type="button"
            class="workspace-home-card rounded-3xl border border-white/10 bg-black/20 p-6 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-indigo-500/10"
            data-workspace-target="machines"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Prime Fabric</p>
            <h3 class="mt-4 text-3xl font-semibold text-white">Machine record</h3>
            <p class="mt-4 text-sm leading-6 text-slate-400">
              Track machine types and mark machines as working or faulty.
            </p>
          </button>

          <button
            type="button"
            class="workspace-home-card rounded-3xl border border-white/10 bg-black/20 p-6 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-indigo-500/10"
            data-workspace-target="store"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Prime Fabric</p>
            <h3 class="mt-4 text-3xl font-semibold text-white">Store</h3>
            <p class="mt-4 text-sm leading-6 text-slate-400">
              Manage store items with item name and item quantity in a simple sheet.
            </p>
          </button>

          <button
            type="button"
            class="workspace-home-card rounded-3xl border border-white/10 bg-black/20 p-6 text-left transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-indigo-500/10"
            data-workspace-target="templateVault"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Prime Fabric</p>
            <h3 class="mt-4 text-3xl font-semibold text-white">Template vault</h3>
            <p class="mt-4 text-sm leading-6 text-slate-400">
              Upload and download any file format from one managed template library.
            </p>
          </button>
        </div>
      `;

      Array.from(workspaceContent.querySelectorAll('.workspace-home-card')).forEach(function (button) {
        button.addEventListener('click', function () {
          if (button.dataset.workspaceTarget === 'projects') {
            currentView = 'list';
            saveWorkspaceState(true);
            renderCurrentView();
            return;
          }

          if (button.dataset.workspaceTarget === 'employees') {
            currentView = 'employees';
            saveWorkspaceState(true);
            renderCurrentView();
            return;
          }

          if (button.dataset.workspaceTarget === 'machines') {
            currentView = 'machines';
            saveWorkspaceState(true);
            renderCurrentView();
            return;
          }

          if (button.dataset.workspaceTarget === 'templateVault') {
            currentView = 'templateVault';
            saveWorkspaceState(true);
            renderCurrentView();
            return;
          }

          currentView = 'store';
          saveWorkspaceState(true);
          renderCurrentView();
        });
      });
    }

    function renderProjectCards() {
      const projects = loadProjects();
      workspaceTitle.innerText = 'Projects';
      workspaceSubtitle.innerText =
        'Create structured project workspaces with assigned employees, order items, production, and payment tracking.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.remove('hidden');
      newProjectButton.innerText = 'New Project';

      workspaceContent.innerHTML = projects.length
        ? `
          <div class="grid gap-5 xl:grid-cols-2">
            ${projects
              .map(function (project) {
                const statusMeta = getProjectStatusMeta(getProjectStatus(project));
                const projectTailors = getProjectTailors(project);
                const orderItems = getProjectOrderItems(project);
                const totalPieces = getProjectTotalPieces(project);

                return `
                  <div class="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.78))] p-6 shadow-[0_20px_50px_rgba(2,6,23,0.26)] transition hover:border-indigo-400/40 hover:bg-indigo-500/10">
                    <div class="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Project</p>
                        <button
                          type="button"
                          class="project-card mt-3 text-left text-2xl font-semibold text-white transition hover:text-indigo-200"
                          data-project-id="${project.id}"
                        >
                          ${escapeHtml(project.name)}
                        </button>
                      </div>
                      <div
                        class="rounded-full border px-3 py-1 text-xs font-semibold transition ${statusMeta.buttonClass}"
                      >
                        ${escapeHtml(statusMeta.label)}
                      </div>
                    </div>
                    <div class="mt-4 flex justify-end">
                      <button
                        type="button"
                        class="project-delete rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                        data-project-id="${project.id}"
                      >
                        Delete Project
                      </button>
                    </div>
                    <div class="mt-5 grid gap-3 sm:grid-cols-3">
                      <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Employees</p>
                        <p class="mt-1.5 text-lg font-semibold text-white">${projectTailors.length}</p>
                      </div>
                      <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Order items</p>
                        <p class="mt-1.5 text-lg font-semibold text-white">${orderItems.length}</p>
                      </div>
                      <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Completed pieces</p>
                        <p class="mt-1.5 text-lg font-semibold text-white">${totalPieces}</p>
                      </div>
                    </div>
                    <p class="mt-4 text-sm leading-6 text-slate-400">Open this workspace to manage assigned employees, production progress, and payment deductions professionally.</p>
                  </div>
                `;
              })
              .join('')}
          </div>
        `
        : `
          <div class="rounded-3xl border border-dashed border-white/15 bg-black/20 px-6 py-14 text-center">
            <p class="text-sm font-medium uppercase tracking-[0.24em] text-indigo-300">No projects yet</p>
            <h3 class="mt-3 text-2xl font-semibold text-white">Create the first stitching order card</h3>
            <p class="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Start with one organization, then add multiple items like bedsheets, caps, bags, jackets, or shoes under the same project.
            </p>
          </div>
        `;

      Array.from(workspaceContent.querySelectorAll('.project-card')).forEach(function (button) {
        button.addEventListener('click', function () {
          activeProjectId = button.dataset.projectId;
          currentView = 'project';
          saveWorkspaceState(true);
          renderCurrentView();
        });
      });

      Array.from(workspaceContent.querySelectorAll('.project-delete')).forEach(function (button) {
        button.addEventListener('click', function () {
          const confirmed = window.confirm('Delete this project permanently?');

          if (!confirmed) {
            return;
          }

          deletePrimeFabricProject(button.dataset.projectId)
            .then(function () {
              if (activeProjectId === button.dataset.projectId) {
                activeProjectId = null;
              }
              renderProjectCards();
            })
            .catch(function (error) {
              window.alert(error.message || 'Unable to delete project.');
            });
        });
      });
    }

    function renderProjectDetail() {
      const project = getProjectById(activeProjectId);

      if (!project) {
        currentView = 'list';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      const projectTailors = getProjectTailors(project);
      const orderItems = getProjectOrderItems(project);
      const totalPieces = getProjectTotalPieces(project);
      const targetPieces = getProjectTargetPieces(project);
      const remainingPieces = getProjectRemainingPieces(project);
      const completedPiecesByItem = getProjectCompletedPiecesByItem(project);
      const dailyTarget = getProjectDailyTarget(project);
      const daysRemaining = getDaysRemaining(project);
      const dueDate = getProjectDueDate(project);
      const projectStatus = getProjectStatus(project);
      const statusMeta = getProjectStatusMeta(projectStatus);
      const advancePayment = getProjectAdvancePayment(project);
      const totalTailorPayment = getProjectTotalTailorPayment(project);
      const weeklyProgressSummaries = getProjectWeeklyProgressSummaries(project);
      const latestWeekKey = weeklyProgressSummaries.length ? weeklyProgressSummaries[0].key : '';
      const dailyTargetsByItem = getProjectDailyTargetsByItem(project);
      const tailorRateSummary = getTailorRateSummary(project);
      const lockedAmount = getProjectLockedAmount(project);
      const productionDays = getProjectProductionDays(project);
      const isTeamLocked = !!project.teamLocked;
      const isFailedProject = projectStatus === 'failed';
      const todayDateValue = formatDateInputValue(getCurrentDate());
      const deadlineLabel =
        projectStatus === 'failed'
          ? 'Failed project completion on time. This project is now locked.'
          : daysRemaining === null
          ? 'Add timeline dates to calculate remaining days.'
          : daysRemaining >= 0
            ? daysRemaining + ' day' + (daysRemaining === 1 ? '' : 's') + ' remaining'
            : Math.abs(daysRemaining) + ' day' + (Math.abs(daysRemaining) === 1 ? '' : 's') + ' overdue';

      workspaceTitle.innerText = project.name;
      workspaceSubtitle.innerText =
        'Handle assigned tailors, weekly production progress, piece-based payout, and project budget tracking.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      workspaceContent.innerHTML = `
        <div class="space-y-5">
          <section class="space-y-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article class="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.78))] p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                <p class="text-[11px] uppercase tracking-[0.24em] text-slate-400">Assigned tailors</p>
                <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml(String(projectTailors.length))}</p>
                <p class="mt-2 text-sm text-slate-400">${escapeHtml(isFailedProject ? 'Project missed the final deadline and is now locked.' : isTeamLocked ? 'Finalized tailor team for this order' : 'Set the working tailor team for this order')}</p>
              </article>
              <article class="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                <p class="text-[11px] uppercase tracking-[0.24em] text-indigo-200">Daily target</p>
                <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml(String(dailyTarget || 0))}</p>
                <p class="mt-2 text-sm text-slate-300">${escapeHtml(String(productionDays || 0))} production day${productionDays === 1 ? '' : 's'} planned</p>
                <p class="mt-1 text-xs text-slate-400">Daily target is now calculated across the full project deadline.</p>
                <div class="mt-3 space-y-2">
                  ${dailyTargetsByItem
                    .map(function (item, index) {
                      return `
                        <div class="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                          <div class="flex items-center justify-between gap-3">
                            <div>
                              <p class="text-[10px] uppercase tracking-[0.14em] text-indigo-100">Item ${index + 1}</p>
                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(item.itemType)}</p>
                            </div>
                            <div class="text-right">
                              <p class="text-[10px] uppercase tracking-[0.14em] text-slate-400">Daily target</p>
                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item.dailyTarget))} pcs</p>
                            </div>
                          </div>
                          <p class="mt-2 text-xs text-slate-300">From ${escapeHtml(String(item.targetPieces))} total pieces</p>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </article>
              <article class="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                <p class="text-[11px] uppercase tracking-[0.24em] text-emerald-200">Pieces completed</p>
                <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml(String(totalPieces))}</p>
                <p class="mt-2 text-sm text-slate-300">Remaining ${escapeHtml(String(remainingPieces))} pieces</p>
                <div class="mt-3 space-y-2">
                  ${completedPiecesByItem
                    .map(function (item, index) {
                      return `
                        <div class="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                          <div class="flex items-center justify-between gap-3">
                            <div>
                              <p class="text-[10px] uppercase tracking-[0.14em] text-emerald-100">Item ${index + 1}</p>
                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(item.itemType)}</p>
                            </div>
                            <div class="text-right">
                              <p class="text-[10px] uppercase tracking-[0.14em] text-slate-400">Completed</p>
                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item.completedPieces))} / ${escapeHtml(String(item.targetPieces))}</p>
                            </div>
                          </div>
                          <p class="mt-2 text-xs text-slate-300">${escapeHtml(String(item.remainingPieces))} pieces remaining</p>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </article>
              <article class="rounded-3xl border ${statusMeta.buttonClass} p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                <p class="text-[11px] uppercase tracking-[0.24em] text-slate-300">Project status</p>
                <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml(statusMeta.label)}</p>
                <p class="mt-2 text-sm text-slate-300">${escapeHtml(deadlineLabel)}</p>
                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Start date</p>
                    <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(project.startDate ? formatDate(project.startDate) : '-')}</p>
                  </div>
                  <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                    <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Due date</p>
                    <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(dueDate ? formatDate(dueDate) : '-')}</p>
                  </div>
                </div>
              </article>
            </div>

            <div class="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
              <article class="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-[11px] uppercase tracking-[0.24em] text-cyan-200">Target pieces</p>
                    <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml(String(targetPieces || 0))}</p>
                    <p class="mt-2 text-sm text-slate-300">${escapeHtml(String(orderItems.length))} item${orderItems.length === 1 ? '' : 's'} in this order</p>
                  </div>
                </div>
                <div class="mt-3 grid gap-2 md:grid-cols-2">
                  ${orderItems
                    .map(function (item, index) {
                      return `
                        <div class="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                          <div class="flex items-start justify-between gap-3">
                            <div>
                              <p class="text-[10px] uppercase tracking-[0.14em] text-cyan-100">Item ${index + 1}</p>
                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(item.itemType || 'Order item')}</p>
                            </div>
                            <div class="text-right">
                              <p class="text-[10px] uppercase tracking-[0.14em] text-slate-400">Pieces</p>
                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item.targetPieces || 0))}</p>
                            </div>
                          </div>
                          <div class="mt-2 flex items-center justify-between gap-3">
                            <p class="text-[10px] uppercase tracking-[0.14em] text-slate-400">Locked budget</p>
                            <p class="text-sm font-semibold text-cyan-50">${escapeHtml('Rs ' + formatCurrency(item.clientAmount || 0))}</p>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </article>

              <div class="grid gap-3 sm:grid-cols-2">
                <article class="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                  <p class="text-[11px] uppercase tracking-[0.24em] text-amber-200">Total locked amount</p>
                  <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(lockedAmount))}</p>
                  <p class="mt-2 text-sm text-slate-300">Total locked amount for this project</p>
                </article>
                <article class="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                  <p class="text-[11px] uppercase tracking-[0.24em] text-violet-200">Advance payment</p>
                  <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(advancePayment))}</p>
                  <p class="mt-2 text-sm text-slate-300">Advance received for this project</p>
                </article>
                <article class="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                  <p class="text-[11px] uppercase tracking-[0.24em] text-sky-200">Weekly payment of tailors</p>
                  <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(totalTailorPayment))}</p>
                  <p class="mt-2 text-sm text-slate-300">Total payout created from saved production</p>
                </article>
                <article class="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4 shadow-[0_20px_48px_rgba(2,6,23,0.24)]">
                  <p class="text-[11px] uppercase tracking-[0.24em] text-fuchsia-200">Tailor per piece rate</p>
                  <p class="mt-3 text-2xl font-semibold text-white">${escapeHtml(tailorRateSummary)}</p>
                  <p class="mt-2 text-sm text-slate-300">Rate summary from current order items</p>
                </article>
              </div>
            </div>
          </section>

          <section class="grid gap-5">
            <div class="space-y-5">
              <section class="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.26)]">
                <div class="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p class="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">Step 1</p>
                    <h3 class="mt-1 text-xl font-semibold text-white">Finalize tailor team</h3>
                    <p class="mt-1 text-sm text-slate-400">${escapeHtml(isFailedProject ? 'Project failed to complete on time. Team changes are locked.' : isTeamLocked ? 'Tailor team has been finalized and locked for this project.' : 'Add the tailors once, then finalize the team for this project.')}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    ${
                      isFailedProject
                        ? '<div class="rounded-xl border border-rose-400/30 bg-rose-500/12 px-4 py-2 text-sm font-semibold text-rose-100">Project Locked</div>'
                        : isTeamLocked
                        ? '<div class="rounded-xl border border-emerald-400/30 bg-emerald-500/12 px-4 py-2 text-sm font-semibold text-emerald-100">Team Locked</div>'
                        : `
                          <button
                            id="addProjectTeamMemberButton"
                            type="button"
                            class="rounded-xl border border-cyan-400/30 bg-cyan-500/12 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/22"
                          >
                            + Add Tailor
                          </button>
                          <button
                            id="saveProjectTeamButton"
                            type="button"
                            class="rounded-xl border border-emerald-400/30 bg-emerald-500/12 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/22"
                          >
                            Finalize Team
                          </button>
                        `
                    }
                  </div>
                </div>

                <div id="projectTeamEditor" class="mt-4 grid gap-3 md:grid-cols-2">
                  ${projectTailors
                    .map(function (tailor, index) {
                      return `
                        <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3" data-project-team-id="${tailor.id}">
                          <div class="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
                            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">${index + 1}</div>
                            <div>
                              <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tailor name</p>
                              <input
                                type="text"
                                value="${escapeHtml(tailor.name)}"
                                class="project-team-name-input mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60"
                                ${isTeamLocked || isFailedProject ? 'disabled' : ''}
                              />
                            </div>
                            ${
                              !isTeamLocked && !isFailedProject && index > 0
                                ? '<button type="button" class="remove-project-team-member rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20">Remove</button>'
                                : ''
                            }
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </section>

              <section class="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.26)]">
                <div class="flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div class="flex-1">
                    <p class="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300">Step 2</p>
                    <h3 class="mt-1 text-xl font-semibold text-white">Enter today pieces</h3>
                    <p class="mt-1 text-sm text-slate-400">Choose a date, fill piece counts, then click save once.</p>
                  </div>
                  <label class="max-w-xs flex-1">
                    <span class="mb-2 block text-sm font-medium text-slate-300">Entry date</span>
                    <input
                      id="primeFabricEntryDate"
                      type="date"
                      value="${escapeHtml(todayDateValue)}"
                      class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60"
                      ${isFailedProject ? 'disabled' : ''}
                    />
                  </label>
                </div>

                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <article class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Today target</p>
                    <p class="mt-2 text-xl font-semibold text-white">${escapeHtml(String(dailyTarget || 0))}</p>
                    <div id="primeFabricTodayTarget" class="mt-3 space-y-2">
                      ${dailyTargetsByItem
                        .map(function (item, index) {
                          return `
                            <div class="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                              <div class="flex items-center justify-between gap-3">
                                <div>
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Item ${index + 1}</p>
                                  <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(item.itemType)}</p>
                                </div>
                                <div class="text-right">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-slate-400">Target</p>
                                  <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(item.dailyTarget || 0))} pcs</p>
                                </div>
                              </div>
                            </div>
                          `;
                        })
                        .join('')}
                    </div>
                    <p class="mt-3 text-xs text-slate-400">Daily target split by item</p>
                  </article>
                  <article class="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-cyan-200">Today actual</p>
                    <p id="primeFabricTodayActualTotal" class="mt-2 text-xl font-semibold text-white">0</p>
                    <div id="primeFabricTodayActual" class="mt-3 space-y-2"></div>
                    <p class="mt-3 text-xs text-slate-300">Current day split by item</p>
                  </article>
                  <article class="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-emerald-200">Target status</p>
                    <p id="primeFabricTodayStatus" class="mt-2 text-base font-semibold text-white">Pending</p>
                    <p class="mt-1 text-xs text-slate-300">Shows if today target is met</p>
                  </article>
                  <article class="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <p class="text-[10px] uppercase tracking-[0.18em] text-amber-200">Today earning</p>
                    <p id="primeFabricDailyPayout" class="mt-2 text-xl font-semibold text-white">Rs 0</p>
                    <p class="mt-1 text-xs text-slate-300">This day amount will join the current week</p>
                  </article>
                </div>

                <div class="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Assigned tailors</p>
                      <h4 class="mt-1 text-lg font-semibold text-white">Daily tailor production sheet</h4>
                    </div>
                    <div class="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                      <p class="text-[10px] uppercase tracking-[0.14em] text-amber-200">Running amount</p>
                      <p id="primeFabricSharedDailyPayout" class="mt-1 text-lg font-semibold text-white">Rs 0</p>
                    </div>
                  </div>

                  <div class="mt-4 space-y-3">
                    ${projectTailors
                      .map(function (tailor, tailorIndex) {
                        const assignedItemId = getTailorAssignedItemId(tailor, orderItems);
                        const assignedItemIndex = getTailorAssignedItemIndex(tailor, orderItems);
                        const assignedItem = assignedItemIndex >= 0 ? orderItems[assignedItemIndex] : null;
                        const totalPay = getTotalPayForTailor(project, tailorIndex, orderItems);
                        const totalTailorPieces =
                          assignedItemIndex >= 0
                            ? getTotalPiecesForTailorItem(project, tailorIndex, assignedItemIndex, orderItems.length)
                            : 0;

                        return `
                          <div class="rounded-2xl border border-white/10 bg-slate-950/35 p-4" data-tailor-card="${tailorIndex}">
                            <div class="grid gap-3 lg:grid-cols-[1fr_1fr_0.85fr_0.85fr] lg:items-end">
                              <div>
                                <p class="text-[10px] uppercase tracking-[0.16em] text-slate-500">Assigned tailor</p>
                                <h5 class="mt-1 text-lg font-semibold text-white">${escapeHtml(tailor.name)}</h5>
                                <p class="mt-1 text-sm text-slate-300" data-tailor-done-pieces="${tailorIndex}">Done ${escapeHtml(String(totalTailorPieces))} pieces</p>
                              </div>
                              <label>
                                <span class="text-[10px] uppercase tracking-[0.16em] text-slate-500">Assigned item</span>
                                <select
                                  data-live-tailor-item-select="${tailorIndex}"
                                  class="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60"
                                  ${isFailedProject ? 'disabled' : ''}
                                >
                                  ${orderItems
                                    .map(function (item) {
                                      return '<option value="' + escapeHtml(item.id) + '" ' + (assignedItemId === item.id ? 'selected' : '') + '>' + escapeHtml(item.itemType || 'Order item') + '</option>';
                                    })
                                    .join('')}
                                </select>
                              </label>
                              <label>
                                <span class="mb-1 block text-[10px] uppercase tracking-[0.14em] text-slate-500">Today pieces</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value="0"
                                  data-tailor-index="${tailorIndex}"
                                  data-item-index="${assignedItemIndex}"
                                  data-assigned-item-id="${escapeHtml(assignedItemId)}"
                                  class="tailor-item-quantity-input w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                                  ${assignedItemIndex === -1 || isFailedProject ? 'disabled' : ''}
                                />
                              </label>
                              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                <div class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Total pieces</p>
                                  <p class="mt-1 text-sm font-semibold text-white" data-tailor-total-pieces="${tailorIndex}">${escapeHtml(String(totalTailorPieces))}</p>
                                </div>
                                <div class="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-emerald-200">Per piece</p>
                                  <p class="mt-1 text-sm font-semibold text-white" data-tailor-rate="${tailorIndex}">${escapeHtml(assignedItem && assignedItem.ratePerStitch ? 'Rs ' + formatCurrency(assignedItem.ratePerStitch) : '-')}</p>
                                </div>
                              </div>
                            </div>

                            <div class="mt-3 flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                              <div>
                                <p class="text-[10px] uppercase tracking-[0.16em] text-amber-200">Tailor amount</p>
                                <p class="mt-1 text-xs text-slate-300">Total earned: ${escapeHtml('Rs ' + formatCurrency(totalPay))}</p>
                              </div>
                              <p class="text-base font-semibold text-white" data-today-pay-for-tailor="${tailorIndex}">Rs 0</p>
                            </div>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>

                  <div class="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <p id="primeFabricEntryMessage" class="text-sm text-slate-400">No row saved yet for today.</p>
                    <button
                      id="saveAllTailorsDayButton"
                      type="button"
                      class="rounded-xl border border-emerald-400/30 bg-emerald-500/12 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/22"
                      ${isFailedProject ? 'disabled' : ''}
                    >
                      Close Card
                    </button>
                  </div>
                </div>
              </section>
            </div>

          </section>

          <section class="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(15,23,42,0.8))] p-5 shadow-[0_22px_56px_rgba(2,6,23,0.26)]">
            <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.22em] text-amber-300">Step 4</p>
                <h3 class="mt-1 text-xl font-semibold text-white">Weekly payment and saved weeks</h3>
                <p class="mt-1 text-sm text-slate-400">After daily entries are saved, each 7-day block appears here automatically.</p>
              </div>
            </div>

            <div class="mt-5 space-y-4">
              ${
                weeklyProgressSummaries.length
                  ? weeklyProgressSummaries
                      .map(function (week) {
                        const isOpen = week.key === latestWeekKey;
                        const isWeekComplete = week.dates.length >= 7;
                        return `
                          <article class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <p class="text-[10px] uppercase tracking-[0.18em] text-amber-200">Production week ${escapeHtml(String(week.weekNumber))}</p>
                                <h4 class="mt-1 text-xl font-semibold text-white">${escapeHtml(formatDate(week.weekStart))} - ${escapeHtml(formatDate(week.weekEnd))}</h4>
                                <p class="mt-2 text-sm text-slate-400">${escapeHtml(isWeekComplete ? (week.paymentStatus === 'paid' ? 'This 7-day block is closed and paid.' : 'This 7-day block is complete. Mark payment as paid to unlock the next week.') : 'Keep saving daily records until this block reaches 7 entries.')}</p>
                              </div>
                              <div class="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                <div class="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Saved days</p>
                                  <p class="mt-1 text-lg font-semibold text-white">${escapeHtml(String(week.dates.length))}</p>
                                </div>
                                <div class="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Week target</p>
                                  <p class="mt-1 text-lg font-semibold text-white">${escapeHtml(String(week.weeklyTarget))}</p>
                                </div>
                                <div class="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-cyan-200">Pieces made</p>
                                  <p class="mt-1 text-lg font-semibold text-white">${escapeHtml(String(week.actualPieces))}</p>
                                </div>
                                <div class="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-amber-200">Week payout</p>
                                  <p class="mt-1 text-lg font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(week.weeklyPayout))}</p>
                                </div>
                                <div class="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                                  <p class="text-[10px] uppercase tracking-[0.14em] text-emerald-200">Pieces left</p>
                                  <p class="mt-1 text-lg font-semibold text-white">${escapeHtml(String(week.remainingPiecesAfterWeek))}</p>
                                </div>
                              </div>
                            </div>

                            <div class="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
                              <label class="max-w-xs flex-1">
                                <span class="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Payment status</span>
                                <select
                                  data-weekly-payment-status="${week.key}"
                                  ${isWeekComplete && !isFailedProject ? '' : 'disabled'}
                                  class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white outline-none transition focus:border-amber-400/60"
                                >
                                  <option value="not_paid" ${week.paymentStatus === 'not_paid' ? 'selected' : ''}>Not paid</option>
                                  <option value="paid" ${week.paymentStatus === 'paid' ? 'selected' : ''}>Paid</option>
                                </select>
                              </label>
                              <button
                                type="button"
                                data-project-week-toggle="${week.key}"
                                class="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
                              >
                                ${isOpen ? 'Hide details' : 'View details'}
                              </button>
                            </div>

                            <div data-project-week-panel="${week.key}" class="${isOpen ? 'mt-4' : 'mt-4 hidden'}">
                              <div class="grid gap-3">
                                ${week.dates
                                  .slice()
                                  .sort(function (left, right) {
                                    return left.localeCompare(right);
                                  })
                                  .map(function (dateValue) {
                                    const entry = getDailyEntryByDate(project, dateValue);
                                    const entryQuantities = entry
                                      ? getEntryTailorItemQuantities(entry, orderItems.length, projectTailors.length)
                                      : createEmptyTailorItemQuantities(orderItems.length, projectTailors.length);
                                    return `
                                      <article class="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                        <div class="flex flex-col gap-3 border-b border-white/10 pb-3 lg:flex-row lg:items-center lg:justify-between">
                                          <div>
                                            <p class="text-[10px] uppercase tracking-[0.16em] text-slate-500">Saved day</p>
                                            <h5 class="mt-1 text-lg font-semibold text-white">${escapeHtml(formatDate(dateValue))}</h5>
                                          </div>
                                          <div class="flex flex-wrap items-center gap-3">
                                            <div class="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                                              <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Pieces made</p>
                                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(String(entry ? getEntryTotalPieces(entry) : 0))}</p>
                                            </div>
                                            <div class="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                                              <p class="text-[10px] uppercase tracking-[0.14em] text-amber-200">Payout value</p>
                                              <p class="mt-1 text-sm font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(entry ? entry.dailyPayout || 0 : 0))}</p>
                                            </div>
                                          </div>
                                        </div>

                                        <div class="mt-4 grid gap-3 xl:grid-cols-2">
                                          ${projectTailors
                                            .map(function (tailor, tailorIndex) {
                                              const tailorRow = entryQuantities[tailorIndex] || [];
                                              const savedItems = getSavedTailorItemsForEntry(tailorRow, orderItems);
                                              return `
                                                <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                                  <div class="flex items-center justify-between gap-3">
                                                    <h6 class="text-sm font-semibold text-white">${escapeHtml(tailor.name)}</h6>
                                                    <span class="text-xs font-semibold text-emerald-200">Rs ${escapeHtml(formatCurrency(getPayForTailorRow(tailorRow, orderItems)))}</span>
                                                  </div>
                                                  <div class="mt-3 space-y-2">
                                                    ${savedItems
                                                      .map(function (item) {
                                                        return `
                                                          <div class="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5">
                                                            <p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Saved item</p>
                                                            <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(item.itemType)}</p>
                                                            <p class="mt-2 text-sm text-slate-300">${escapeHtml(String(item.pieces))} pcs on this day</p>
                                                          </div>
                                                        `;
                                                      })
                                                      .join('')}
                                                  </div>
                                                </div>
                                              `;
                                            })
                                            .join('')}
                                        </div>
                                      </article>
                                    `;
                                  })
                                  .join('')}
                              </div>
                            </div>
                          </article>
                        `;
                      })
                      .join('')
                  : `
                    <div class="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center text-sm text-slate-400">
                      No weekly history yet. Start saving daily piece entries to build weekly cards automatically.
                    </div>
                  `
              }
            </div>
          </section>
        </div>
      `;

      const projectTeamEditor = document.getElementById('projectTeamEditor');
      const addProjectTeamMemberButton = document.getElementById('addProjectTeamMemberButton');
      const saveProjectTeamButton = document.getElementById('saveProjectTeamButton');
      const entryDateInput = document.getElementById('primeFabricEntryDate');
      const entryMessage = document.getElementById('primeFabricEntryMessage');
      const todayTargetElement = document.getElementById('primeFabricTodayTarget');
      const todayActualElement = document.getElementById('primeFabricTodayActual');
      const todayActualTotalElement = document.getElementById('primeFabricTodayActualTotal');
      const todayStatusElement = document.getElementById('primeFabricTodayStatus');
      const dailyPayoutElement = document.getElementById('primeFabricDailyPayout');
      const sharedDailyPayoutElement = document.getElementById('primeFabricSharedDailyPayout');
      const saveAllTailorsDayButton = document.getElementById('saveAllTailorsDayButton');
      const quantityInputs = Array.from(document.querySelectorAll('.tailor-item-quantity-input'));
      const liveTailorItemSelects = Array.from(document.querySelectorAll('[data-live-tailor-item-select]'));
      const todayPayElements = Array.from(document.querySelectorAll('[data-today-pay-for-tailor]'));
      const weeklyStatusSelects = Array.from(document.querySelectorAll('[data-weekly-payment-status]'));
      const weekToggleButtons = Array.from(document.querySelectorAll('[data-project-week-toggle]'));

      function readProjectTeamEditorRows() {
        return Array.from(projectTeamEditor.querySelectorAll('[data-project-team-id]'))
          .map(function (row) {
            const input = row.querySelector('.project-team-name-input');
            return {
              id: row.dataset.projectTeamId,
              name: input ? input.value.trim() : '',
            };
          })
          .filter(function (tailor) {
            return tailor.name;
          });
      }

      function setEntryMessage(message, tone) {
        entryMessage.innerText = message;
        entryMessage.className =
          tone === 'success'
            ? 'text-sm text-emerald-300'
            : tone === 'error'
              ? 'text-sm text-rose-300'
              : 'text-sm text-slate-400';
      }

      if (!isTeamLocked && !isFailedProject && addProjectTeamMemberButton && saveProjectTeamButton) {
        addProjectTeamMemberButton.addEventListener('click', function () {
          const card = document.createElement('div');
          card.className = 'rounded-2xl border border-white/10 bg-white/[0.04] p-3';
          card.setAttribute('data-project-team-id', createId('tailor'));
          card.innerHTML =
            '<div class="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">' +
            '<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">+</div>' +
            '<div>' +
            '<p class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tailor name</p>' +
            '<input type="text" class="project-team-name-input mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/60" />' +
            '</div>' +
            '<button type="button" class="remove-project-team-member rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20">Remove</button>' +
            '</div>';
          projectTeamEditor.appendChild(card);
          const input = card.querySelector('.project-team-name-input');
          if (input) {
            input.focus();
          }
        });

        projectTeamEditor.addEventListener('click', function (event) {
          if (!event.target || !event.target.classList.contains('remove-project-team-member')) {
            return;
          }

          const row = event.target.closest('[data-project-team-id]');
          if (!row) {
            return;
          }

          row.remove();
        });

        saveProjectTeamButton.addEventListener('click', function () {
          const nextTailors = readProjectTeamEditorRows();

          if (!nextTailors.length) {
            window.alert('Please keep at least one tailor in this project.');
            return;
          }

          setButtonPending(saveProjectTeamButton, true, 'Saving Team...', 'Finalize Team');
        updatePrimeFabricProject(project.id, {
          tailors: nextTailors,
          dailyEntries: remapDailyEntriesForTailors(project, nextTailors),
          teamLocked: true,
        })
          .then(function () {
            renderProjectDetail();
          })
          .catch(function (error) {
              window.alert(error.message || 'Unable to finalize team.');
            })
            .finally(function () {
              setButtonPending(saveProjectTeamButton, false, 'Saving Team...', 'Finalize Team');
            });
        });
      }

      liveTailorItemSelects.forEach(function (select) {
        select.addEventListener('change', function () {
          if (isFailedProject) {
            return;
          }

          const tailorIndex = Number(select.dataset.liveTailorItemSelect);
          const selectedItemIndex = orderItems.findIndex(function (item) {
            return item.id === select.value;
          });
          const selectedItem = selectedItemIndex >= 0 ? orderItems[selectedItemIndex] : null;
          const input = document.querySelector('.tailor-item-quantity-input[data-tailor-index="' + tailorIndex + '"]');
          const doneLabel = document.querySelector('[data-tailor-done-pieces="' + tailorIndex + '"]');
          const totalPiecesLabel = document.querySelector('[data-tailor-total-pieces="' + tailorIndex + '"]');
          const rateLabel = document.querySelector('[data-tailor-rate="' + tailorIndex + '"]');
          const savedEntry = getDailyEntryByDate(project, entryDateInput.value);
          const savedQuantities = savedEntry
            ? getEntryTailorItemQuantities(savedEntry, orderItems.length, projectTailors.length)
            : createEmptyTailorItemQuantities(orderItems.length, projectTailors.length);
          const selectedItemPieces =
            selectedItemIndex >= 0
              ? getTotalPiecesForTailorItem(project, tailorIndex, selectedItemIndex, orderItems.length)
              : 0;

          if (input) {
            input.dataset.itemIndex = String(selectedItemIndex);
            input.dataset.assignedItemId = select.value;
            input.disabled = selectedItemIndex === -1;
            input.value =
              selectedItemIndex >= 0 &&
              savedQuantities[tailorIndex] &&
              savedQuantities[tailorIndex][selectedItemIndex] !== undefined
                ? String(savedQuantities[tailorIndex][selectedItemIndex])
                : '0';
          }

          if (doneLabel) {
            doneLabel.innerText = 'Done ' + selectedItemPieces + ' pieces';
          }

          if (totalPiecesLabel) {
            totalPiecesLabel.innerText = String(selectedItemPieces);
          }

          if (rateLabel) {
            rateLabel.innerText =
              selectedItem && selectedItem.ratePerStitch ? 'Rs ' + formatCurrency(selectedItem.ratePerStitch) : '-';
          }

          updateTodayPayPreview();
        });
      });

      function updateTodayPayPreview() {
        let totalDailyPayout = 0;
        let totalActualPieces = 0;
        const todayActualByItem = orderItems.map(function () {
          return 0;
        });

        todayPayElements.forEach(function (element) {
          const tailorIndex = Number(element.dataset.todayPayForTailor);
          const tailorQuantities = orderItems.map(function () {
            return 0;
          });
          const input = document.querySelector('.tailor-item-quantity-input[data-tailor-index="' + tailorIndex + '"]');
          const assignedItemIndex = input ? Number(input.dataset.itemIndex) : -1;
          const parsedValue = Number(input ? input.value : 0);

          if (assignedItemIndex >= 0) {
            tailorQuantities[assignedItemIndex] = Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
            todayActualByItem[assignedItemIndex] += tailorQuantities[assignedItemIndex];
          }

          const tailorPay = getPayForTailorRow(tailorQuantities, orderItems);
          const tailorPieces = tailorQuantities.reduce(function (sum, value) {
            return sum + value;
          }, 0);
          totalDailyPayout += tailorPay;
          totalActualPieces += tailorPieces;
          element.innerText = 'Rs ' + formatCurrency(tailorPay);
        });

        todayActualTotalElement.innerText = String(totalActualPieces);
        todayActualElement.innerHTML = todayActualByItem
          .map(function (pieces, index) {
            const item = dailyTargetsByItem[index];
            return (
              '<div class="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2.5">' +
              '<div class="flex items-center justify-between gap-3">' +
              '<div>' +
              '<p class="text-[10px] uppercase tracking-[0.14em] text-cyan-200">Item ' +
              (index + 1) +
              '</p>' +
              '<p class="mt-1 text-sm font-semibold text-white">' +
              escapeHtml(item ? item.itemType : 'Order item') +
              '</p>' +
              '</div>' +
              '<div class="text-right">' +
              '<p class="text-[10px] uppercase tracking-[0.14em] text-slate-300">Actual</p>' +
              '<p class="mt-1 text-sm font-semibold text-white">' +
              escapeHtml(String(pieces)) +
              ' pcs</p>' +
              '</div>' +
              '</div>' +
              '</div>'
            );
          })
          .join('');
        todayTargetElement.innerHTML = dailyTargetsByItem
          .map(function (item, index) {
            return (
              '<div class="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5">' +
              '<div class="flex items-center justify-between gap-3">' +
              '<div>' +
              '<p class="text-[10px] uppercase tracking-[0.14em] text-slate-500">Item ' +
              (index + 1) +
              '</p>' +
              '<p class="mt-1 text-sm font-semibold text-white">' +
              escapeHtml(item.itemType) +
              '</p>' +
              '</div>' +
              '<div class="text-right">' +
              '<p class="text-[10px] uppercase tracking-[0.14em] text-slate-400">Target</p>' +
              '<p class="mt-1 text-sm font-semibold text-white">' +
              escapeHtml(String(item.dailyTarget || 0)) +
              ' pcs</p>' +
              '</div>' +
              '</div>' +
              '</div>'
            );
          })
          .join('');
        dailyPayoutElement.innerText = 'Rs ' + formatCurrency(totalDailyPayout);
        if (sharedDailyPayoutElement) {
          sharedDailyPayoutElement.innerText = 'Rs ' + formatCurrency(totalDailyPayout);
        }

        if (!dailyTarget) {
          todayStatusElement.innerText = 'No target set';
        } else if (totalActualPieces >= dailyTarget) {
          todayStatusElement.innerText = 'Met';
        } else if (totalActualPieces > 0) {
          todayStatusElement.innerText = 'Not met';
        } else {
          todayStatusElement.innerText = 'Pending';
        }
      }

      function applySavedDateValues() {
        const savedEntry = getDailyEntryByDate(project, entryDateInput.value);
        const savedQuantities = savedEntry
          ? getEntryTailorItemQuantities(savedEntry, orderItems.length, projectTailors.length)
          : createEmptyTailorItemQuantities(orderItems.length, projectTailors.length);

        quantityInputs.forEach(function (input) {
          const tailorIndex = Number(input.dataset.tailorIndex);
          const itemIndex = Number(input.dataset.itemIndex);

          if (itemIndex < 0) {
            input.value = '0';
            return;
          }

          input.value = String(
            savedQuantities[tailorIndex] && savedQuantities[tailorIndex][itemIndex] !== undefined
              ? savedQuantities[tailorIndex][itemIndex]
              : 0
          );
        });

        setEntryMessage(
          savedEntry
            ? 'Saved row loaded for ' + formatDate(savedEntry.date) + '. Saving again will update it.'
            : 'No row saved yet for ' + formatDate(entryDateInput.value) + '.',
          'default'
        );
        updateTodayPayPreview();
      }

      entryDateInput.addEventListener('change', applySavedDateValues);
      quantityInputs.forEach(function (input) {
        input.addEventListener('input', updateTodayPayPreview);
      });
      applySavedDateValues();

      function saveAllTailorsDay() {
        const selectedDate = entryDateInput.value;
        const latestProject = getProjectById(activeProjectId) || project;

        if (!selectedDate) {
          setEntryMessage('Please choose a date before saving the row.', 'error');
          return;
        }

        if (isFailedProject) {
          setEntryMessage('Project is locked because it failed to complete on time.', 'error');
          return;
        }

        const productionWeeksAsc = getProjectProductionWeeks(latestProject);
        const latestProductionWeek =
          productionWeeksAsc.length > 0 ? productionWeeksAsc[productionWeeksAsc.length - 1] : null;
        const selectedDateAlreadySaved = !!getDailyEntryByDate(latestProject, selectedDate);
        const latestWeekSettlement = latestProductionWeek
          ? getWeeklySettlementRecord(latestProject, latestProductionWeek.key)
          : null;

        if (
          !selectedDateAlreadySaved &&
          latestProductionWeek &&
          latestProductionWeek.dates.length >= 7 &&
          (!latestWeekSettlement || latestWeekSettlement.paymentStatus !== 'paid')
        ) {
          setEntryMessage(
            'This 7-day week is complete. Mark weekly payment as paid before adding the next entry.',
            'error'
          );
          return;
        }

        const savedEntry = getDailyEntryByDate(latestProject, selectedDate);
        const quantities = savedEntry
          ? getEntryTailorItemQuantities(savedEntry, orderItems.length, projectTailors.length)
          : createEmptyTailorItemQuantities(orderItems.length, projectTailors.length);
        const nextTailors = getProjectTailors(latestProject).map(function (tailor, index) {
          const currentSelect = document.querySelector('[data-live-tailor-item-select="' + index + '"]');
          return Object.assign({}, tailor, {
            assignedItemId: currentSelect ? currentSelect.value : getTailorAssignedItemId(tailor, orderItems),
          });
        });
        const assignmentsChanged = haveTailorAssignmentsChanged(getProjectTailors(latestProject), nextTailors);

        if (!quantityInputs.length) {
          setEntryMessage('No tailor rows are available for saving.', 'error');
          return;
        }

        quantityInputs.forEach(function (input) {
          const currentTailorIndex = Number(input.dataset.tailorIndex);
          const itemIndex = Number(input.dataset.itemIndex);
          const parsedValue = Number(input.value);

          if (itemIndex >= 0) {
            quantities[currentTailorIndex][itemIndex] =
              Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
          }
        });

        const currentProject = latestProject;
        const existingEntryIndex = (latestProject.dailyEntries || []).findIndex(function (entry) {
          return entry.date === selectedDate;
        });
        const nextEntry = {
          id:
            existingEntryIndex >= 0
              ? latestProject.dailyEntries[existingEntryIndex].id
              : createId('entry'),
          date: selectedDate,
          quantities: quantities.map(function (tailorRow) {
            return tailorRow.reduce(function (sum, value) {
              return sum + value;
            }, 0);
          }),
          tailorItemQuantities: quantities,
          dailyPayout: quantities.reduce(function (sum, tailorRow) {
            return sum + getPayForTailorRow(tailorRow, orderItems);
          }, 0),
        };

        const targetLimit = getProjectTargetPieces(currentProject);
        const nextEntryTotalPieces = getEntryTotalPieces(nextEntry);
        const existingEntryPieces =
          existingEntryIndex >= 0
            ? getEntryTotalPieces(latestProject.dailyEntries[existingEntryIndex])
            : 0;
        const totalPiecesAfterSave =
          getProjectTotalPieces(currentProject) - existingEntryPieces + nextEntryTotalPieces;

        if (targetLimit > 0 && totalPiecesAfterSave > targetLimit) {
          const piecesLeftBeforeThisSave = Math.max(targetLimit - (getProjectTotalPieces(currentProject) - existingEntryPieces), 0);
          setEntryMessage(
            'Only ' +
              piecesLeftBeforeThisSave +
              ' pieces can be saved for this order. Total target is ' +
              targetLimit +
              ' pieces.',
            'error'
          );
          return;
        }

        const itemTotalsAfterSave = orderItems.map(function (_, itemIndex) {
          return quantities.reduce(function (sum, tailorRow) {
            const parsedQuantity = Number(tailorRow && tailorRow[itemIndex] !== undefined ? tailorRow[itemIndex] : 0);
            return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
          }, 0);
        });
        const existingItemTotals =
          existingEntryIndex >= 0
            ? getEntryItemTotals(latestProject.dailyEntries[existingEntryIndex], orderItems.length, projectTailors.length)
            : orderItems.map(function () {
                return 0;
              });

        const exceedsItemTarget = orderItems.find(function (item, itemIndex) {
          const currentSavedTotal = completedPiecesByItem[itemIndex] ? completedPiecesByItem[itemIndex].completedPieces : 0;
          const nextItemTotal = currentSavedTotal - existingItemTotals[itemIndex] + itemTotalsAfterSave[itemIndex];
          return nextItemTotal > Number(item.targetPieces || 0);
        });

        if (exceedsItemTarget) {
          const itemIndex = orderItems.findIndex(function (item) {
            return item.id === exceedsItemTarget.id;
          });
          const currentSavedTotal = completedPiecesByItem[itemIndex] ? completedPiecesByItem[itemIndex].completedPieces : 0;
          const piecesLeftForItem = Math.max(
            Number(exceedsItemTarget.targetPieces || 0) - (currentSavedTotal - existingItemTotals[itemIndex]),
            0
          );
          setEntryMessage(
            exceedsItemTarget.itemType +
              ' can save only ' +
              piecesLeftForItem +
              ' more piece' +
              (piecesLeftForItem === 1 ? '' : 's') +
              '.',
            'error'
          );
          return;
        }

        setButtonPending(saveAllTailorsDayButton, true, 'Saving...', 'Close Card');
        setEntryMessage('Saving daily production for ' + formatDate(selectedDate) + '...', 'default');

        const saveAssignmentsPromise = assignmentsChanged
          ? updatePrimeFabricProject(project.id, {
              tailors: nextTailors,
              dailyEntries: remapDailyEntriesForTailors(latestProject, nextTailors),
            })
          : Promise.resolve();

        saveAssignmentsPromise
          .then(function () {
            return savePrimeFabricDailyEntry(project.id, {
              date: selectedDate,
              tailorItemQuantities: quantities,
            });
          })
          .then(function () {
            setEntryMessage(
              'Closed all tailor data for ' + formatDate(selectedDate) + '.',
              'success'
            );
            renderProjectDetail();
          })
          .catch(function (error) {
            setEntryMessage(error.message || 'Unable to save daily entry.', 'error');
          })
          .finally(function () {
            setButtonPending(saveAllTailorsDayButton, false, 'Saving...', 'Close Card');
          });
      }

      if (saveAllTailorsDayButton) {
        if (isFailedProject) {
          saveAllTailorsDayButton.classList.add('cursor-not-allowed', 'opacity-60');
        }

        saveAllTailorsDayButton.addEventListener('click', function () {
          saveAllTailorsDay();
        });
      }

      weeklyStatusSelects.forEach(function (select) {
        select.addEventListener('change', function () {
          const weekKey = select.dataset.weeklyPaymentStatus;
          const nextStatus = select.value;
          const previousStatus = select.dataset.previousStatus || '';
          select.disabled = true;

          savePrimeFabricWeeklySettlement(project.id, {
            weekKey: weekKey,
            paymentStatus: nextStatus,
          })
            .then(function () {
              renderProjectDetail();
            })
            .catch(function (error) {
              select.value = previousStatus || 'not_paid';
              window.alert(error.message || 'Unable to save weekly payment status.');
            })
            .finally(function () {
              select.disabled = false;
            });
        });
        select.dataset.previousStatus = select.value;
      });

      weekToggleButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          const weekKey = button.dataset.projectWeekToggle;
          const panel = document.querySelector('[data-project-week-panel="' + weekKey + '"]');

          if (!panel) {
            return;
          }

          panel.classList.toggle('hidden');
          button.innerText = panel.classList.contains('hidden') ? 'View details' : 'Hide details';
        });
      });
    }

    function renderCurrentView() {
      setWorkspaceHeaderVisible(currentView !== 'templateVault');

      if (currentView === 'home') {
        renderWorkspaceHome();
        return;
      }

      if (currentView === 'employees') {
        renderEmployeeRecord();
        return;
      }

      if (currentView === 'machines') {
        renderMachineRecord();
        return;
      }

      if (currentView === 'store') {
        renderStoreRecord();
        return;
      }

      if (currentView === 'templateVault') {
        renderTemplateVaultRecord();
        return;
      }

      if (currentView === 'project' && activeProjectId) {
        renderProjectDetail();
        return;
      }

      currentView = 'list';
      renderProjectCards();
    }

    function openWorkspace() {
      dashboardHome.classList.add('hidden');
      workspaceScreen.classList.remove('hidden');
      getInButton.classList.add('hidden');
      workspaceBackButton.classList.remove('hidden');
      saveWorkspaceState(true);
      renderCurrentView();
    }

    function restoreWorkspace(savedState) {
      currentView = savedState && savedState.currentView ? savedState.currentView : 'home';
      activeProjectId = savedState && savedState.activeProjectId ? savedState.activeProjectId : null;
      openWorkspace();
    }

    function closeWorkspace() {
      workspaceScreen.classList.add('hidden');
      dashboardHome.classList.remove('hidden');
      getInButton.classList.remove('hidden');
      workspaceBackButton.classList.add('hidden');
      currentView = 'home';
      activeProjectId = null;
      clearWorkspaceState();
    }

    getInButton.addEventListener('click', function () {
      currentView = 'home';
      activeProjectId = null;
      openWorkspace();
    });

    primeFabricTemplateVaultInput.addEventListener('change', function (event) {
      const selectedFile = event.target.files && event.target.files[0];
      const maxTemplateVaultFileSizeBytes = 10 * 1024 * 1024;

      if (!selectedFile) {
        return;
      }

      if (selectedFile.size > maxTemplateVaultFileSizeBytes) {
        window.alert('Please upload a file smaller than 10 MB in Prime Fabric template vault.');
        primeFabricTemplateVaultInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function () {
        const nextFiles = loadTemplateVault().slice();
        const uploadedAt = new Date().toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const extension = selectedFile.name && selectedFile.name.includes('.')
          ? selectedFile.name.split('.').pop().toUpperCase()
          : 'FILE';

        nextFiles.unshift({
          id: createId('template_file'),
          name: selectedFile.name || 'uploaded-file',
          extension: extension,
          mimeType: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size || 0,
          uploadedAt: uploadedAt,
          contentDataUrl: reader.result,
        });

        saveTemplateVault(nextFiles)
          .then(function () {
            primeFabricTemplateVaultInput.value = '';

            if (currentView === 'templateVault') {
              renderTemplateVaultRecord();
            }
          })
          .catch(function (error) {
            primeFabricTemplateVaultInput.value = '';
            window.alert(error.message || 'Unable to upload the file to Prime Fabric template vault.');
          });
      };

      reader.readAsDataURL(selectedFile);
    });

    workspaceBackButton.addEventListener('click', function () {
      if (currentView === 'project') {
        currentView = 'list';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      if (currentView === 'list') {
        currentView = 'home';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      if (currentView === 'employees') {
        currentView = 'home';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      if (currentView === 'machines') {
        currentView = 'home';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      if (currentView === 'store') {
        currentView = 'home';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      if (currentView === 'templateVault') {
        currentView = 'home';
        activeProjectId = null;
        saveWorkspaceState(true);
        renderCurrentView();
        return;
      }

      closeWorkspace();
    });

    newProjectButton.addEventListener('click', function () {
      if (currentView === 'store') {
        openStoreModal();
        return;
      }

      if (currentView === 'templateVault') {
        primeFabricTemplateVaultInput.value = '';
        primeFabricTemplateVaultInput.click();
        return;
      }

      openProjectModal();
    });
    closeStoreModalButton.addEventListener('click', closeStoreModal);
    cancelStoreModalButton.addEventListener('click', closeStoreModal);
    saveStoreModalButton.addEventListener('click', function () {
      const name = storeModalNameInput.value.trim();

      if (!name) {
        storeModalError.textContent = 'Please enter an item name before adding.';
        storeModalError.classList.remove('hidden');
        storeModalNameInput.focus();
        return;
      }

      const nextItems = loadStoreItems();
      nextItems.push({
        id: createId('store_item'),
        name: name,
        quantity: 0,
      });
      storeModalError.classList.add('hidden');
      setButtonPending(saveStoreModalButton, true, 'Saving...', 'Add Item');
      saveStoreItems(nextItems)
        .then(function () {
          closeStoreModal();

          if (currentView === 'store') {
            renderStoreRecord();
          }
        })
        .catch(function (error) {
          storeModalError.textContent = error.message || 'Unable to save the store item.';
          storeModalError.classList.remove('hidden');
        })
        .finally(function () {
          setButtonPending(saveStoreModalButton, false, 'Saving...', 'Add Item');
        });
    });
    closeProjectModalButton.addEventListener('click', closeProjectModal);
    cancelProjectModalButton.addEventListener('click', closeProjectModal);

    addProjectOrderItemButton.addEventListener('click', function () {
      const orderItems = getProjectOrderItemsFromInputs();
      orderItems.push(createEmptyOrderItem());
      renderProjectOrderItems(orderItems);
      updateLockedAmountPreview();
    });

    projectOrderItemsContainer.addEventListener('input', function (event) {
      if (event.target && event.target.classList.contains('project-order-item-input')) {
        updateLockedAmountPreview();
      }
    });

    projectOrderItemsContainer.addEventListener('click', function (event) {
      if (!event.target || !event.target.classList.contains('remove-project-order-item')) {
        return;
      }

      const row = event.target.closest('[data-order-item-id]');

      if (!row) {
        return;
      }

      const remainingItems = getProjectOrderItemsFromInputs().filter(function (item) {
        return item.id !== row.dataset.orderItemId;
      });

      renderProjectOrderItems(remainingItems.length ? remainingItems : [createEmptyOrderItem()]);
      updateLockedAmountPreview();
    });

    projectModal.addEventListener('click', function (event) {
      if (event.target === projectModal) {
        closeProjectModal();
      }
    });

    storeModal.addEventListener('click', function (event) {
      if (event.target === storeModal) {
        closeStoreModal();
      }
    });

    saveProjectButton.addEventListener('click', function () {
      const name = projectNameInput.value.trim();
      const startDate = projectStartDateInput.value.trim();
      const deadlineDays = projectDeadlineInput.value.trim();
      const advancePaymentReceived = projectAdvancePaymentInput.value.trim();
      projectModalError.classList.add('hidden');
      projectModalError.innerText = '';
      const orderItems = getProjectOrderItemsFromInputs()
        .map(function (item) {
          return {
            id: item.id,
            itemType: item.itemType.trim(),
            targetPieces: item.targetPieces.trim() ? Number(item.targetPieces.trim()) : null,
            ratePerStitch: item.ratePerStitch.trim() ? Number(item.ratePerStitch.trim()) : null,
            clientAmount: item.clientAmount.trim() ? Number(item.clientAmount.trim()) : null,
          };
        })
        .filter(function (item) {
          return item.itemType || item.targetPieces !== null || item.ratePerStitch !== null || item.clientAmount !== null;
        });

      if (!name || !startDate || !deadlineDays) {
        showProjectModalError('Please fill organization name, start date, and deadline days.');
        return;
      }

      if (!orderItems.length) {
        showProjectModalError('Please add at least one order item for this organization.');
        return;
      }

      if (
        orderItems.some(function (item) {
          return !item.itemType;
        })
      ) {
        showProjectModalError('Each order item needs an article type, like bedsheets or caps.');
        return;
      }

      if (
        orderItems.some(function (item) {
          return item.targetPieces === null || item.targetPieces <= 0;
        })
      ) {
        showProjectModalError('Each order item needs a valid pieces value greater than 0.');
        return;
      }

      if (
        orderItems.some(function (item) {
          return item.ratePerStitch === null || item.ratePerStitch < 0;
        })
      ) {
        showProjectModalError('Each order item needs a valid tailor rate.');
        return;
      }

      if (
        orderItems.some(function (item) {
          return item.clientAmount === null || item.clientAmount < 0;
        })
      ) {
        showProjectModalError('Each order item needs a valid client amount.');
        return;
      }

      const lockedAmount = orderItems.reduce(function (sum, item) {
        return sum + getLockedAmount(item.clientAmount);
      }, 0);
      const parsedAdvancePayment = advancePaymentReceived ? Number(advancePaymentReceived) : 0;

      if (!Number.isFinite(parsedAdvancePayment) || parsedAdvancePayment < 0) {
        showProjectModalError('Please enter a valid advance payment amount.');
        return;
      }

      saveProjectButton.disabled = true;
      saveProjectButton.innerText = 'Creating...';
      createPrimeFabricProject({
        name: name,
        startDate: startDate,
        deadlineDays: Number(deadlineDays),
        status: 'not_started',
        orderItems: orderItems.map(function (item) {
          return {
            id: item.id,
            itemType: item.itemType,
            targetPieces: Number(item.targetPieces || 0),
            ratePerStitch: Number(item.ratePerStitch || 0),
            clientAmount: Number(item.clientAmount || 0),
          };
        }),
        advancePaymentReceived: parsedAdvancePayment,
        clientAmount: lockedAmount,
        lockedAmount: lockedAmount,
        tailors: [],
        dailyEntries: [],
        weeklySettlements: [],
      })
        .then(function () {
          closeProjectModal();
          currentView = 'list';
          saveWorkspaceState(true);
          renderCurrentView();
        })
        .catch(function (error) {
          const errorMessage =
            error && error.message && error.message.toLowerCase().includes('tailor')
              ? 'Unable to create project. Refresh the page and restart the backend once, then try again.'
              : error.message ||
                'Unable to create project. If the backend was changed recently, restart it and try again.';
          showProjectModalError(
            errorMessage
          );
        })
        .finally(function () {
          saveProjectButton.disabled = false;
          saveProjectButton.innerText = 'Create Project';
        });
    });

    projectNameInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveProjectButton.click();
      }
    });

    const savedWorkspaceState = loadWorkspaceState();

    if (savedWorkspaceState && savedWorkspaceState.isOpen) {
      restoreWorkspace(savedWorkspaceState);
    }

    fetchPrimeFabricWorkspace();
  }

  function initializePakroseWorkspace() {
    const workspaceUiStateKey = 'pakrose_workspace_ui_state';
    const getInButton = document.getElementById('getInButton');
    const dashboardHome = document.getElementById('dashboardHome');
    const managementScreen = document.getElementById('pakroseManagementScreen');
    const managementTitle = document.getElementById('managementTitle');
    const managementSubtitle = document.getElementById('managementSubtitle');
    const managementContent = document.getElementById('managementContent');
    const createOrganizationButton = document.getElementById('createOrganizationButton');
    const totalAmountButton = document.getElementById('totalAmountButton');
    const workspaceBackButton = document.getElementById('workspaceBackButton');
    const fundingModal = document.getElementById('fundingModal');
    const closeFundingModalButton = document.getElementById('closeFundingModalButton');
    const fundingAccountTotal = document.getElementById('fundingAccountTotal');
    const fundingSpentTotal = document.getElementById('fundingSpentTotal');
    const fundingLeftTotal = document.getElementById('fundingLeftTotal');
    const fundingDateInput = document.getElementById('fundingDateInput');
    const fundingAmountInput = document.getElementById('fundingAmountInput');
    const fundingNoteInput = document.getElementById('fundingNoteInput');
    const addFundingButton = document.getElementById('addFundingButton');
    const fundingHistoryTable = document.getElementById('fundingHistoryTable');
    const createEntryModal = document.getElementById('createEntryModal');
    const closeCreateEntryModalButton = document.getElementById('closeCreateEntryModalButton');
    const cancelCreateEntryModalButton = document.getElementById('cancelCreateEntryModalButton');
    const submitCreateEntryModalButton = document.getElementById('submitCreateEntryModalButton');
    const createEntryModalTitle = document.getElementById('createEntryModalTitle');
    const createEntryModalDescription = document.getElementById('createEntryModalDescription');
    const createEntryModalLabel = document.getElementById('createEntryModalLabel');
    const createEntryModalInput = document.getElementById('createEntryModalInput');
    const createEntryModalError = document.getElementById('createEntryModalError');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteConfirmMessage = document.getElementById('deleteConfirmMessage');
    const cancelDeleteConfirmButton = document.getElementById('cancelDeleteConfirmButton');
    const confirmDeleteConfirmButton = document.getElementById('confirmDeleteConfirmButton');

    if (
      activeCompany !== 'pakrose' ||
      !getInButton ||
      !dashboardHome ||
      !managementScreen ||
      !managementTitle ||
      !managementSubtitle ||
      !managementContent ||
      !createOrganizationButton ||
      !totalAmountButton ||
      !workspaceBackButton ||
      !fundingModal ||
      !closeFundingModalButton ||
      !fundingAccountTotal ||
      !fundingSpentTotal ||
      !fundingLeftTotal ||
      !fundingDateInput ||
      !fundingAmountInput ||
      !fundingNoteInput ||
      !addFundingButton ||
      !fundingHistoryTable ||
      !createEntryModal ||
      !closeCreateEntryModalButton ||
      !cancelCreateEntryModalButton ||
      !submitCreateEntryModalButton ||
      !createEntryModalTitle ||
      !createEntryModalDescription ||
      !createEntryModalLabel ||
      !createEntryModalInput ||
      !createEntryModalError ||
      !deleteConfirmModal ||
      !deleteConfirmMessage ||
      !cancelDeleteConfirmButton ||
      !confirmDeleteConfirmButton
    ) {
      return;
    }

    const sectorLabels = {
      government: 'Government',
      ngos: 'NGOs',
      private: 'Private',
      dailyExpenses: 'Daily Expenses',
      store: 'Store',
      templateVault: 'Template Vault',
    };

    let workspaceData = createEmptyWorkspaceData();
    let currentView = 'home';
    let activeSector = null;
    let activeOrganizationId = null;
    let createEntryModalMode = null;
    let pendingDeleteResolver = null;
    let isManagementOpen = false;
    const templateVaultInput = document.createElement('input');
    templateVaultInput.type = 'file';
    templateVaultInput.accept = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    templateVaultInput.className = 'hidden';
    document.body.appendChild(templateVaultInput);

    function getApiCompanyId() {
      return activeCompany === 'pakrose' ? 'pakrose' : 'prime_fabric';
    }

    function saveWorkspaceUiState() {
      window.sessionStorage.setItem(
        workspaceUiStateKey,
        JSON.stringify({
          isManagementOpen: isManagementOpen,
          currentView: currentView,
          activeSector: activeSector,
          activeOrganizationId: activeOrganizationId,
        })
      );
    }

    function clearWorkspaceUiState() {
      window.sessionStorage.removeItem(workspaceUiStateKey);
    }

    function loadWorkspaceUiState() {
      try {
        const rawState = window.sessionStorage.getItem(workspaceUiStateKey);
        return rawState ? JSON.parse(rawState) : null;
      } catch (error) {
        return null;
      }
    }

    function getAuthHeaders() {
      return {
        'Content-Type': 'application/json',
        'x-oms-user-email': session.email || '',
        'x-oms-user-name': session.name || '',
      };
    }

    async function apiRequest(path, options) {
      const response = await fetch(backendUrl + path, {
        method: options && options.method ? options.method : 'GET',
        headers: getAuthHeaders(),
        body:
          options && Object.prototype.hasOwnProperty.call(options, 'body')
            ? JSON.stringify(options.body)
            : undefined,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Request failed.');
      }

      return payload;
    }

    async function refreshWorkspaceData() {
      const payload = await apiRequest('/api/v1/companies/' + getApiCompanyId() + '/workspace');
      workspaceData = payload.workspace || createEmptyWorkspaceData();
      return workspaceData;
    }

    function applyWorkspacePayload(payload) {
      workspaceData = payload.workspace || createEmptyWorkspaceData();
      updateTotalAmountButton();
    }

    function getOrganizationById(sectorKey, organizationId) {
      const sectorOrganizations = workspaceData[sectorKey] || [];
      return sectorOrganizations.find(function (organization) {
        return organization.id === organizationId;
      }) || null;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function getTotalSpentAmount() {
      const organizationSpent = ['government', 'ngos', 'private'].reduce(function (sum, sectorKey) {
        return (
          sum +
          (workspaceData[sectorKey] || []).reduce(function (sectorSum, organization) {
            return (
              sectorSum +
              (organization.entries || []).reduce(function (entrySum, entry) {
                const amount = Number(entry.amountSpent);
                return entrySum + (Number.isFinite(amount) ? amount : 0);
              }, 0)
            );
          }, 0)
        );
      }, 0);

      const dailySpent = (workspaceData.dailyExpenses || []).reduce(function (sum, entry) {
        const amount = Number(entry.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);

      return organizationSpent + dailySpent;
    }

    function getFundingHistory() {
      return Array.isArray(workspaceData.fundingHistory) ? workspaceData.fundingHistory : [];
    }

    function getAccountTotalAmount() {
      return getFundingHistory().reduce(function (sum, entry) {
        const amount = Number(entry.amount);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
    }

    function formatAmount(amount) {
      return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }

    function setButtonPending(button, isPending, pendingText, defaultText) {
      if (!button) {
        return;
      }

      button.disabled = Boolean(isPending);
      button.innerText = isPending ? pendingText : defaultText;
    }

    function updateTotalAmountButton() {
      const totalAvailable = getAccountTotalAmount();
      const remainingAmount = totalAvailable - getTotalSpentAmount();
      totalAmountButton.innerText =
        'Account Total: ' +
        formatAmount(totalAvailable) +
        ' | Left: ' +
        formatAmount(remainingAmount);
      totalAmountButton.title = 'Click to view funding history and add new money';
    }

    function renderFundingModal() {
      const totalAvailable = getAccountTotalAmount();
      const spentAmount = getTotalSpentAmount();
      const remainingAmount = totalAvailable - spentAmount;
      const fundingHistory = getFundingHistory();

      fundingAccountTotal.innerText = formatAmount(totalAvailable);
      fundingSpentTotal.innerText = formatAmount(spentAmount);
      fundingLeftTotal.innerText = formatAmount(remainingAmount);

      fundingHistoryTable.innerHTML = fundingHistory.length
        ? fundingHistory
            .slice()
            .reverse()
            .map(function (entry) {
              return `
                <tr class="text-sm text-slate-200">
                  <td class="px-4 py-4">${escapeHtml(entry.date || '-')}</td>
                  <td class="px-4 py-4">${escapeHtml(formatAmount(entry.amount || 0))}</td>
                  <td class="px-4 py-4">${escapeHtml(entry.note || '-')}</td>
                </tr>
              `;
            })
            .join('')
        : `
            <tr>
              <td colspan="3" class="px-4 py-10 text-center text-sm text-slate-400">
                No money history yet. Add the first account entry above.
              </td>
            </tr>
          `;
    }

    function closeCreateEntryModal() {
      createEntryModal.classList.add('hidden');
      createEntryModal.classList.remove('flex');
      createEntryModalInput.value = '';
      createEntryModalError.innerText = '';
      createEntryModalError.classList.add('hidden');
      createEntryModalMode = null;
    }

    function openCreateEntryModal(config) {
      createEntryModalMode = config.mode;
      createEntryModalTitle.innerText = config.title;
      createEntryModalDescription.innerText = config.description;
      createEntryModalLabel.innerText = config.label;
      createEntryModalInput.placeholder = config.placeholder;
      createEntryModalInput.value = '';
      createEntryModalError.innerText = '';
      createEntryModalError.classList.add('hidden');
      submitCreateEntryModalButton.innerText = config.submitLabel || 'Save';
      createEntryModal.classList.remove('hidden');
      createEntryModal.classList.add('flex');
      window.setTimeout(function () {
        createEntryModalInput.focus();
      }, 0);
    }

    function showCreateEntryError(message) {
      createEntryModalError.innerText = message;
      createEntryModalError.classList.remove('hidden');
    }

    function closeDeleteConfirmModal() {
      deleteConfirmModal.classList.add('hidden');
      deleteConfirmModal.classList.remove('flex');
      deleteConfirmMessage.innerText = '';
    }

    function resolveDeleteConfirmation(confirmed) {
      if (pendingDeleteResolver) {
        pendingDeleteResolver(confirmed);
        pendingDeleteResolver = null;
      }

      closeDeleteConfirmModal();
    }

    function confirmDeletion(itemLabel) {
      deleteConfirmMessage.innerText = 'Are you sure you want to delete this ' + itemLabel + '?';
      deleteConfirmModal.classList.remove('hidden');
      deleteConfirmModal.classList.add('flex');

      return new Promise(function (resolve) {
        pendingDeleteResolver = resolve;
      });
    }

    function renderSectorCards() {
      saveWorkspaceUiState();
      managementTitle.innerText = 'Funding sources';
      managementSubtitle.innerText =
        'Choose a card to open its organizations. You can then create a new organization manually and manage entries like a sheet.';
      totalAmountButton.classList.remove('hidden');
      createOrganizationButton.classList.add('hidden');
      createOrganizationButton.innerText = 'Create New Organization';
      workspaceBackButton.classList.remove('hidden');
      workspaceBackButton.innerText = 'Back';
      updateTotalAmountButton();

      managementContent.innerHTML = `
        <div class="grid gap-5 lg:grid-cols-3">
          ${Object.keys(sectorLabels)
            .map(function (sectorKey) {
              const totalOrganizations = (workspaceData[sectorKey] || []).length;
              const itemLabel =
                sectorKey === 'store'
                  ? 'item'
                  : sectorKey === 'dailyExpenses'
                    ? 'item'
                  : sectorKey === 'templateVault'
                    ? 'template'
                    : 'organization';
              return `
                <button
                  type="button"
                  class="sector-card rounded-2xl border border-white/10 bg-black/20 p-6 text-left transition hover:-translate-y-1 hover:border-teal-400/40 hover:bg-teal-500/10"
                  data-sector="${sectorKey}"
                >
                  <p class="text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">${sectorLabels[sectorKey]}</p>
                  <h3 class="mt-4 text-2xl font-semibold text-white">${sectorLabels[sectorKey]}</h3>
                  <p class="mt-3 text-sm leading-6 text-slate-400">
                    ${totalOrganizations} ${itemLabel}${totalOrganizations === 1 ? '' : 's'} available in this section.
                  </p>
                  <span class="mt-6 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                    Open section
                  </span>
                </button>
              `;
            })
            .join('')}
        </div>
      `;

      Array.from(managementContent.querySelectorAll('.sector-card')).forEach(function (button) {
        button.addEventListener('click', function () {
          activeSector = button.dataset.sector;
          currentView =
            activeSector === 'store'
              ? 'store'
              : activeSector === 'dailyExpenses'
                ? 'dailyExpenses'
              : activeSector === 'templateVault'
                ? 'templateVault'
                : 'sector';
          renderCurrentView();
        });
      });
    }

    function renderOrganizationCards() {
      saveWorkspaceUiState();
      const organizations = workspaceData[activeSector] || [];
      managementTitle.innerText = sectorLabels[activeSector] + ' Organizations';
      managementSubtitle.innerText =
        'Create organizations manually for this category, then open any card to manage date, description, amount spent, and paid by details.';
      totalAmountButton.classList.add('hidden');
      createOrganizationButton.classList.remove('hidden');
      createOrganizationButton.innerText = 'Create New Organization';
      workspaceBackButton.classList.remove('hidden');
      workspaceBackButton.innerText = 'Back';
      updateTotalAmountButton();

      managementContent.innerHTML = `
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          ${
            organizations.length
              ? organizations
                  .map(function (organization) {
                    return `
                      <button
                        type="button"
                        class="organization-card rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:-translate-y-1 hover:border-teal-400/40 hover:bg-teal-500/10"
                        data-organization-id="${organization.id}"
                      >
                        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">${sectorLabels[activeSector]}</p>
                        <h3 class="mt-4 text-xl font-semibold text-white">${escapeHtml(organization.name)}</h3>
                        <p class="mt-3 text-sm leading-6 text-slate-400">
                          ${organization.entries.length} entr${organization.entries.length === 1 ? 'y' : 'ies'} available.
                        </p>
                        <span class="mt-6 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                          Open sheet
                        </span>
                      </button>
                    `;
                  })
                  .join('')
              : `
                <div class="rounded-2xl border border-dashed border-white/15 bg-black/10 p-8 text-center md:col-span-2 xl:col-span-3">
                  <p class="text-lg font-semibold text-white">No organizations yet</p>
                  <p class="mt-3 text-sm leading-6 text-slate-400">
                    Use the Create New Organization button to add the first card in this category.
                  </p>
                </div>
              `
          }
        </div>
      `;

      Array.from(managementContent.querySelectorAll('.organization-card')).forEach(function (button) {
        button.addEventListener('click', function () {
          activeOrganizationId = button.dataset.organizationId;
          currentView = 'organization';
          renderCurrentView();
        });
      });
    }

    function renderStoreSheet() {
      saveWorkspaceUiState();
      const items = workspaceData.store || [];

      managementTitle.innerText = 'Store Items';
      managementSubtitle.innerText =
        'Add store items and update the available quantity whenever stock changes.';
      totalAmountButton.classList.add('hidden');
      createOrganizationButton.classList.remove('hidden');
      createOrganizationButton.innerText = 'Add Item';
      workspaceBackButton.classList.remove('hidden');
      workspaceBackButton.innerText = 'Back';
      updateTotalAmountButton();

      managementContent.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10 text-left">
              <thead>
                <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-4 py-3 font-medium">Item name</th>
                  <th class="px-4 py-3 font-medium">No of item available</th>
                  <th class="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                ${
                  items.length
                    ? items
                        .map(function (item) {
                          return `
                            <tr class="text-sm text-slate-200">
                              <td class="px-4 py-4">${escapeHtml(item.name || '-')}</td>
                              <td class="px-4 py-4">
                                <div class="flex items-center gap-3">
                                  <input
                                    type="number"
                                    min="0"
                                    value="${escapeHtml(item.quantity || '0')}"
                                    disabled
                                    class="store-quantity w-32 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none transition focus:border-teal-400/60 disabled:cursor-not-allowed disabled:opacity-80"
                                    data-item-id="${item.id}"
                                  />
                                  <button
                                    type="button"
                                    class="edit-store-item inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                                    data-item-id="${item.id}"
                                    aria-label="Edit item quantity"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    class="save-store-item hidden rounded-xl border border-teal-400/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-100 transition hover:bg-teal-500/20"
                                    data-item-id="${item.id}"
                                  >
                                    Save
                                  </button>
                                </div>
                              </td>
                              <td class="px-4 py-4">
                                <button
                                  type="button"
                                  class="delete-store-item rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                  data-item-id="${item.id}"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')
                    : `
                      <tr>
                        <td colspan="3" class="px-4 py-10 text-center text-sm text-slate-400">
                          No items added yet. Use Add Item to create the first store entry.
                        </td>
                      </tr>
                    `
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      Array.from(managementContent.querySelectorAll('.edit-store-item')).forEach(function (button) {
        button.addEventListener('click', function () {
          const itemId = button.dataset.itemId;
          const input = managementContent.querySelector('.store-quantity[data-item-id="' + itemId + '"]');
          const saveButton = managementContent.querySelector('.save-store-item[data-item-id="' + itemId + '"]');

          if (!input || !saveButton) {
            return;
          }

          input.disabled = false;
          input.classList.remove('bg-slate-950/50');
          input.classList.add('bg-slate-950/80');
          button.classList.add('hidden');
          saveButton.classList.remove('hidden');
          input.focus();
        });
      });

      Array.from(managementContent.querySelectorAll('.save-store-item')).forEach(function (button) {
        button.addEventListener('click', async function () {
          const itemId = button.dataset.itemId;
          const input = managementContent.querySelector('.store-quantity[data-item-id="' + itemId + '"]');
          const editButton = managementContent.querySelector('.edit-store-item[data-item-id="' + itemId + '"]');

          if (!input || !editButton) {
            return;
          }

          try {
            const payload = await apiRequest(
              '/api/v1/companies/' + getApiCompanyId() + '/store-items/' + itemId,
              {
                method: 'PATCH',
                body: {
                  quantity: input.value.trim() || '0',
                },
              }
            );

            applyWorkspacePayload(payload);
            renderCurrentView();
          } catch (error) {
            window.alert(error.message);
          }
        });
      });

      Array.from(managementContent.querySelectorAll('.delete-store-item')).forEach(function (button) {
        button.addEventListener('click', async function () {
          if (!(await confirmDeletion('store item'))) {
            return;
          }

          try {
            const payload = await apiRequest(
              '/api/v1/companies/' + getApiCompanyId() + '/store-items/' + button.dataset.itemId,
              {
                method: 'DELETE',
              }
            );

            applyWorkspacePayload(payload);
            renderCurrentView();
          } catch (error) {
            window.alert(error.message);
          }
        });
      });
    }

    function renderDailyExpensesSheet() {
      saveWorkspaceUiState();
      const items = workspaceData.dailyExpenses || [];

      managementTitle.innerText = 'Daily Expenses';
      managementSubtitle.innerText =
        'Add daily expense items here with date, description, and amount.';
      totalAmountButton.classList.add('hidden');
      createOrganizationButton.classList.remove('hidden');
      createOrganizationButton.innerText = 'Add';
      workspaceBackButton.classList.remove('hidden');
      workspaceBackButton.innerText = 'Back';
      updateTotalAmountButton();

      managementContent.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div class="grid gap-4 border-b border-white/10 pb-5 lg:grid-cols-[1fr_2fr_1fr]">
            <label>
              <span class="mb-2 block text-sm font-medium text-slate-300">Date</span>
              <input
                id="dailyExpenseDate"
                type="date"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
            <label>
              <span class="mb-2 block text-sm font-medium text-slate-300">Description</span>
              <input
                id="dailyExpenseDescription"
                type="text"
                placeholder="Add expense detail"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
            <label>
              <span class="mb-2 block text-sm font-medium text-slate-300">Amount</span>
              <input
                id="dailyExpenseAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
          </div>

          <div class="mt-5 overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10 text-left">
              <thead>
                <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-4 py-3 font-medium">Date</th>
                  <th class="px-4 py-3 font-medium">Description</th>
                  <th class="px-4 py-3 font-medium">Amount</th>
                  <th class="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                ${
                  items.length
                    ? items
                        .map(function (item) {
                          return `
                            <tr class="text-sm text-slate-200">
                              <td class="px-4 py-4">${escapeHtml(item.date || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(item.description || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(item.amount || '-')}</td>
                              <td class="px-4 py-4">
                                <button
                                  type="button"
                                  class="delete-daily-expense rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                  data-item-id="${item.id}"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')
                    : `
                      <tr>
                        <td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400">
                          No daily expenses added yet. Fill the fields above and click Add.
                        </td>
                      </tr>
                    `
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      Array.from(managementContent.querySelectorAll('.delete-daily-expense')).forEach(function (button) {
        button.addEventListener('click', async function () {
          if (!(await confirmDeletion('daily expense'))) {
            return;
          }

          try {
            const payload = await apiRequest(
              '/api/v1/companies/' + getApiCompanyId() + '/daily-expenses/' + button.dataset.itemId,
              {
                method: 'DELETE',
              }
            );

            applyWorkspacePayload(payload);
            renderCurrentView();
          } catch (error) {
            window.alert(error.message);
          }
        });
      });
    }

    function renderTemplateVaultSheet() {
      saveWorkspaceUiState();
      const files = workspaceData.templateVault || [];

      managementTitle.innerText = 'Template Vault';
      managementSubtitle.innerText =
        'Store PDF and Word templates here so they can be uploaded and downloaded from one place.';
      totalAmountButton.classList.add('hidden');
      createOrganizationButton.classList.remove('hidden');
      createOrganizationButton.innerText = 'Upload File';
      workspaceBackButton.classList.remove('hidden');
      workspaceBackButton.innerText = 'Back';

      managementContent.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10 text-left">
              <thead>
                <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-4 py-3 font-medium">File name</th>
                  <th class="px-4 py-3 font-medium">Type</th>
                  <th class="px-4 py-3 font-medium">Uploaded</th>
                  <th class="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                ${
                  files.length
                    ? files
                        .map(function (file) {
                          return `
                            <tr class="text-sm text-slate-200">
                              <td class="px-4 py-4">${escapeHtml(file.name || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(file.extension || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(file.uploadedAt || '-')}</td>
                              <td class="px-4 py-4">
                                <div class="flex flex-wrap items-center gap-3">
                                  <button
                                    type="button"
                                    class="download-template rounded-lg border border-teal-400/30 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-100 transition hover:bg-teal-500/20"
                                    data-file-id="${file.id}"
                                  >
                                    Download
                                  </button>
                                  <button
                                    type="button"
                                    class="delete-template rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                    data-file-id="${file.id}"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')
                    : `
                      <tr>
                        <td colspan="4" class="px-4 py-10 text-center text-sm text-slate-400">
                          No templates uploaded yet. Use Upload File to add PDF or Word templates.
                        </td>
                      </tr>
                    `
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      Array.from(managementContent.querySelectorAll('.download-template')).forEach(function (button) {
        button.addEventListener('click', function () {
          const targetFile = (workspaceData.templateVault || []).find(function (file) {
            return file.id === button.dataset.fileId;
          });

          if (!targetFile || !targetFile.contentDataUrl) {
            return;
          }

          const downloadLink = document.createElement('a');
          downloadLink.href = targetFile.contentDataUrl;
          downloadLink.download = targetFile.name;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });
      });

      Array.from(managementContent.querySelectorAll('.delete-template')).forEach(function (button) {
        button.addEventListener('click', async function () {
          if (!(await confirmDeletion('template file'))) {
            return;
          }

          try {
            const payload = await apiRequest(
              '/api/v1/companies/' + getApiCompanyId() + '/template-files/' + button.dataset.fileId,
              {
                method: 'DELETE',
              }
            );

            applyWorkspacePayload(payload);
            renderCurrentView();
          } catch (error) {
            window.alert(error.message);
          }
        });
      });
    }

    function renderOrganizationSheet() {
      const organization = getOrganizationById(activeSector, activeOrganizationId);

      if (!organization) {
        currentView = 'sector';
        saveWorkspaceUiState();
        renderCurrentView();
        return;
      }

      saveWorkspaceUiState();
      managementTitle.innerText = organization.name;
      managementSubtitle.innerText =
        'Maintain entries in a sheet-style table. The fifth column is reserved for row actions so you can manage each line easily.';
      totalAmountButton.classList.add('hidden');
      createOrganizationButton.classList.add('hidden');
      createOrganizationButton.innerText = 'Create New Organization';
      workspaceBackButton.classList.remove('hidden');
      workspaceBackButton.innerText = 'Back';
      updateTotalAmountButton();

      managementContent.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div class="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
            <label class="flex-1">
              <span class="mb-2 block text-sm font-medium text-slate-300">Date</span>
              <input
                id="entryDate"
                type="date"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
            <label class="flex-[2]">
              <span class="mb-2 block text-sm font-medium text-slate-300">Description</span>
              <input
                id="entryDescription"
                type="text"
                placeholder="Add expense details"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
            <label class="flex-1">
              <span class="mb-2 block text-sm font-medium text-slate-300">Amount spent</span>
              <input
                id="entryAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
            <label class="flex-1">
              <span class="mb-2 block text-sm font-medium text-slate-300">Paid by</span>
              <input
                id="entryPaidBy"
                type="text"
                placeholder="Name"
                class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/60"
              />
            </label>
            <button
              id="addEntryButton"
              type="button"
              class="rounded-xl border border-teal-400/30 bg-teal-500/10 px-5 py-3 text-sm font-semibold text-teal-100 transition hover:bg-teal-500/20"
            >
              Add Entry
            </button>
          </div>

          <div class="mt-5 overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10 text-left">
              <thead>
                <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th class="px-4 py-3 font-medium">Date</th>
                  <th class="px-4 py-3 font-medium">Description</th>
                  <th class="px-4 py-3 font-medium">Amount spent</th>
                  <th class="px-4 py-3 font-medium">Paid by</th>
                  <th class="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                ${
                  organization.entries.length
                    ? organization.entries
                        .map(function (entry) {
                          return `
                            <tr class="text-sm text-slate-200">
                              <td class="px-4 py-4">${escapeHtml(entry.date || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(entry.description || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(entry.amountSpent || '-')}</td>
                              <td class="px-4 py-4">${escapeHtml(entry.paidBy || '-')}</td>
                              <td class="px-4 py-4">
                                <button
                                  type="button"
                                  class="delete-entry rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                  data-entry-id="${entry.id}"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          `;
                        })
                        .join('')
                    : `
                      <tr>
                        <td colspan="5" class="px-4 py-10 text-center text-sm text-slate-400">
                          No entries added yet. Add the first row above to start this sheet.
                        </td>
                      </tr>
                    `
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      const addEntryButton = document.getElementById('addEntryButton');
      const entryDate = document.getElementById('entryDate');
      const entryDescription = document.getElementById('entryDescription');
      const entryAmount = document.getElementById('entryAmount');
      const entryPaidBy = document.getElementById('entryPaidBy');

      addEntryButton.addEventListener('click', async function () {
        const date = entryDate.value.trim();
        const description = entryDescription.value.trim();
        const amountSpent = entryAmount.value.trim();
        const paidBy = entryPaidBy.value.trim();

        if (!date || !description || !amountSpent || !paidBy) {
          window.alert('Please fill date, description, amount spent, and paid by before adding the entry.');
          return;
        }

        try {
          setButtonPending(addEntryButton, true, 'Saving...', 'Add Entry');
          const payload = await apiRequest(
            '/api/v1/companies/' + getApiCompanyId() + '/organizations/' + activeOrganizationId + '/expenses',
            {
              method: 'POST',
              body: {
                date: date,
                description: description,
                amountSpent: amountSpent,
                paidBy: paidBy,
              },
            }
          );

          applyWorkspacePayload(payload);
          entryDescription.value = '';
          entryAmount.value = '';
          entryPaidBy.value = '';
          renderCurrentView();
        } catch (error) {
          window.alert(error.message);
        } finally {
          setButtonPending(addEntryButton, false, 'Saving...', 'Add Entry');
        }
      });

      [entryDate, entryDescription, entryAmount, entryPaidBy].forEach(function (field) {
        field.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            addEntryButton.click();
          }
        });
      });

      Array.from(managementContent.querySelectorAll('.delete-entry')).forEach(function (button) {
        button.addEventListener('click', async function () {
          if (!(await confirmDeletion('expense entry'))) {
            return;
          }

          try {
            const payload = await apiRequest(
              '/api/v1/companies/' + getApiCompanyId() + '/organizations/' + activeOrganizationId + '/expenses/' + button.dataset.entryId,
              {
                method: 'DELETE',
              }
            );

            applyWorkspacePayload(payload);
            renderCurrentView();
          } catch (error) {
            window.alert(error.message);
          }
        });
      });
    }

    function renderCurrentView() {
      if (currentView === 'home') {
        renderSectorCards();
        return;
      }

      if (currentView === 'sector') {
        renderOrganizationCards();
        return;
      }

      if (currentView === 'store') {
        renderStoreSheet();
        return;
      }

      if (currentView === 'dailyExpenses') {
        renderDailyExpensesSheet();
        return;
      }

      if (currentView === 'templateVault') {
        renderTemplateVaultSheet();
        return;
      }

      renderOrganizationSheet();
    }

    async function showManagementScreen() {
      try {
        await refreshWorkspaceData();
      } catch (error) {
        window.alert(error.message);
        return;
      }

      isManagementOpen = true;
      getInButton.classList.add('hidden');
      workspaceBackButton.classList.remove('hidden');
      dashboardHome.classList.add('hidden');
      managementScreen.classList.remove('hidden');
      currentView = 'home';
      activeSector = null;
      activeOrganizationId = null;
      saveWorkspaceUiState();
      renderCurrentView();
    }

    async function restoreManagementScreen(savedState) {
      try {
        await refreshWorkspaceData();
      } catch (error) {
        window.alert(error.message);
        return;
      }

      isManagementOpen = true;
      getInButton.classList.add('hidden');
      workspaceBackButton.classList.remove('hidden');
      dashboardHome.classList.add('hidden');
      managementScreen.classList.remove('hidden');
      currentView = savedState && savedState.currentView ? savedState.currentView : 'home';
      activeSector = savedState && savedState.activeSector ? savedState.activeSector : null;
      activeOrganizationId =
        savedState && savedState.activeOrganizationId ? savedState.activeOrganizationId : null;

      if (currentView === 'organization' && (!activeSector || !activeOrganizationId)) {
        currentView = 'home';
      }

      if (
        (currentView === 'sector' || currentView === 'store' || currentView === 'dailyExpenses' || currentView === 'templateVault') &&
        !activeSector
      ) {
        currentView = 'home';
      }

      saveWorkspaceUiState();
      renderCurrentView();
    }

    async function createOrganization() {
      if (activeSector === 'templateVault') {
        templateVaultInput.value = '';
        templateVaultInput.click();
        return;
      }

      if (activeSector === 'dailyExpenses') {
        const expenseDateElement = document.getElementById('dailyExpenseDate');
        const expenseDescriptionElement = document.getElementById('dailyExpenseDescription');
        const expenseAmountElement = document.getElementById('dailyExpenseAmount');
        const expenseDate = expenseDateElement ? expenseDateElement.value.trim() : '';
        const expenseDescription = expenseDescriptionElement ? expenseDescriptionElement.value.trim() : '';
        const expenseAmount = expenseAmountElement ? expenseAmountElement.value.trim() : '';

        if (!expenseDate || !expenseDescription || !expenseAmount) {
          window.alert('Please fill date, description, and amount before adding the item.');
          return;
        }

        try {
          const payload = await apiRequest(
            '/api/v1/companies/' + getApiCompanyId() + '/daily-expenses',
            {
              method: 'POST',
              body: {
                date: expenseDate,
                description: expenseDescription,
                amount: expenseAmount,
              },
            }
          );

          applyWorkspacePayload(payload);
          renderCurrentView();
        } catch (error) {
          window.alert(error.message);
        }
        return;
      }

      if (activeSector === 'store') {
        openCreateEntryModal({
          mode: 'store',
          title: 'Add Store Item',
          description: 'Add a new item name for the store inventory list.',
          label: 'Item name',
          placeholder: 'Enter item name',
          submitLabel: 'Add Item',
        });
        return;
      }

      if (!activeSector) {
        return;
      }

      openCreateEntryModal({
        mode: 'organization',
        title: 'Create New Organization',
        description: 'Add a new organization to this funding section.',
        label: 'Organization name',
        placeholder: 'Enter organization name',
        submitLabel: 'Create',
      });
    }

    getInButton.addEventListener('click', showManagementScreen);

    createOrganizationButton.addEventListener('click', createOrganization);

    templateVaultInput.addEventListener('change', function (event) {
      const selectedFile = event.target.files && event.target.files[0];

      if (!selectedFile) {
        return;
      }

      const fileName = selectedFile.name || '';
      const extension = fileName.includes('.') ? fileName.split('.').pop().toUpperCase() : '';
      const allowedExtensions = ['PDF', 'DOC', 'DOCX'];

      if (allowedExtensions.indexOf(extension) === -1) {
        window.alert('Please upload only PDF, DOC, or DOCX files.');
        templateVaultInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async function () {
        try {
          const payload = await apiRequest(
            '/api/v1/companies/' + getApiCompanyId() + '/template-files',
            {
              method: 'POST',
              body: {
                name: fileName,
                extension: extension,
                mimeType: selectedFile.type || 'application/octet-stream',
                contentDataUrl: reader.result,
              },
            }
          );

          applyWorkspacePayload(payload);
          renderCurrentView();
          templateVaultInput.value = '';
        } catch (error) {
          window.alert(error.message);
        }
      };

      reader.readAsDataURL(selectedFile);
    });

    totalAmountButton.addEventListener('click', function () {
      fundingDateInput.value = formatDateInputValue(new Date());
      fundingAmountInput.value = '';
      fundingNoteInput.value = '';
      renderFundingModal();
      fundingModal.classList.remove('hidden');
      fundingModal.classList.add('flex');
    });

    closeFundingModalButton.addEventListener('click', function () {
      fundingModal.classList.add('hidden');
      fundingModal.classList.remove('flex');
    });

    fundingModal.addEventListener('click', function (event) {
      if (event.target === fundingModal) {
        fundingModal.classList.add('hidden');
        fundingModal.classList.remove('flex');
      }
    });

    addFundingButton.addEventListener('click', async function () {
      const fundingDate = fundingDateInput.value.trim();
      const fundingAmount = Number(fundingAmountInput.value.trim());
      const fundingNote = fundingNoteInput.value.trim();

      if (!fundingDate || !Number.isFinite(fundingAmount) || fundingAmount <= 0) {
        window.alert('Please enter a valid date and amount received.');
        return;
      }

      try {
        const payload = await apiRequest(
          '/api/v1/companies/' + getApiCompanyId() + '/funding-entries',
          {
            method: 'POST',
            body: {
              date: fundingDate,
              amount: fundingAmount,
              note: fundingNote,
            },
          }
        );

        applyWorkspacePayload(payload);
        renderFundingModal();
        fundingAmountInput.value = '';
        fundingNoteInput.value = '';
      } catch (error) {
        window.alert(error.message);
      }
    });

    async function submitCreateEntryModal() {
      const rawValue = createEntryModalInput.value.trim();

      if (!rawValue) {
        showCreateEntryError(
          createEntryModalMode === 'store' ? 'Item name cannot be empty.' : 'Organization name cannot be empty.'
        );
        return;
      }

      try {
        let payload = null;

        if (createEntryModalMode === 'store') {
          payload = await apiRequest('/api/v1/companies/' + getApiCompanyId() + '/store-items', {
            method: 'POST',
            body: {
              name: rawValue,
              quantity: 0,
            },
          });
        } else if (createEntryModalMode === 'organization') {
          payload = await apiRequest(
            '/api/v1/companies/' + getApiCompanyId() + '/sectors/' + activeSector + '/organizations',
            {
              method: 'POST',
              body: {
                name: rawValue,
              },
            }
          );
        }

        if (!payload) {
          return;
        }

        applyWorkspacePayload(payload);
        closeCreateEntryModal();
        renderCurrentView();
      } catch (error) {
        showCreateEntryError(error.message);
      }
    }

    closeCreateEntryModalButton.addEventListener('click', closeCreateEntryModal);
    cancelCreateEntryModalButton.addEventListener('click', closeCreateEntryModal);
    submitCreateEntryModalButton.addEventListener('click', submitCreateEntryModal);

    createEntryModalInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitCreateEntryModal();
      }
    });

    createEntryModal.addEventListener('click', function (event) {
      if (event.target === createEntryModal) {
        closeCreateEntryModal();
      }
    });

    cancelDeleteConfirmButton.addEventListener('click', function () {
      resolveDeleteConfirmation(false);
    });

    confirmDeleteConfirmButton.addEventListener('click', function () {
      resolveDeleteConfirmation(true);
    });

    deleteConfirmModal.addEventListener('click', function (event) {
      if (event.target === deleteConfirmModal) {
        resolveDeleteConfirmation(false);
      }
    });

    workspaceBackButton.addEventListener('click', function () {
      if (currentView === 'organization') {
        currentView = 'sector';
        activeOrganizationId = null;
        renderCurrentView();
        return;
      }

      if (currentView === 'sector') {
        currentView = 'home';
        activeSector = null;
        saveWorkspaceUiState();
        renderCurrentView();
        return;
      }

      if (currentView === 'store') {
        currentView = 'home';
        activeSector = null;
        saveWorkspaceUiState();
        renderCurrentView();
        return;
      }

      if (currentView === 'dailyExpenses') {
        currentView = 'home';
        activeSector = null;
        saveWorkspaceUiState();
        renderCurrentView();
        return;
      }

      if (currentView === 'templateVault') {
        currentView = 'home';
        activeSector = null;
        saveWorkspaceUiState();
        renderCurrentView();
        return;
      }

      isManagementOpen = false;
      managementScreen.classList.add('hidden');
      dashboardHome.classList.remove('hidden');
      getInButton.classList.remove('hidden');
      workspaceBackButton.classList.add('hidden');
      currentView = 'home';
      activeSector = null;
      activeOrganizationId = null;
      clearWorkspaceUiState();
    });

    const savedWorkspaceState = loadWorkspaceUiState();

    if (savedWorkspaceState && savedWorkspaceState.isManagementOpen) {
      restoreManagementScreen(savedWorkspaceState);
    }
  }

  initializePrimeFabricWorkspace();
  initializePakroseWorkspace();

  window.addEventListener('pageshow', function () {
    const activeSession = loadSession();

    if (!activeSession || activeSession.company !== activeCompany) {
      redirectToLogin();
    }
  });
})();
