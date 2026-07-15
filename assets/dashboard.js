(function () {
  const sessionStorageKey = 'oms_auth_session';
  const activeCompany = document.body.dataset.company || 'prime_fabric';
  const backendUrl = document.body.dataset.backendUrl || 'http://localhost:4000';

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
    const tailorNames = Array.from({ length: 15 }, function (_, index) {
      return 'Tailor ' + (index + 1);
    });
    const getInButton = document.getElementById('getInButton');
    const workspaceBackButton = document.getElementById('workspaceBackButton');
    const dashboardHome = document.getElementById('dashboardHome');
    const workspaceScreen = document.getElementById('primeFabricWorkspace');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const workspaceSubtitle = document.getElementById('workspaceSubtitle');
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

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
      try {
        const rawProjects = window.localStorage.getItem(projectsStorageKey);
        const parsedProjects = rawProjects ? JSON.parse(rawProjects) : [];
        return Array.isArray(parsedProjects) ? parsedProjects : [];
      } catch (error) {
        return [];
      }
    }

    function saveProjects(projects) {
      window.localStorage.setItem(projectsStorageKey, JSON.stringify(projects));
    }

    function getAttendanceStorageKey() {
      return 'prime_fabric_attendance_records';
    }

    function loadAttendanceRecords() {
      try {
        const rawRecords = window.localStorage.getItem(getAttendanceStorageKey());
        const parsedRecords = rawRecords ? JSON.parse(rawRecords) : {};
        return parsedRecords && typeof parsedRecords === 'object' ? parsedRecords : {};
      } catch (error) {
        return {};
      }
    }

    function saveAttendanceRecords(records) {
      window.localStorage.setItem(getAttendanceStorageKey(), JSON.stringify(records));
    }

    function getStoreStorageKey() {
      return 'prime_fabric_store_items';
    }

    function loadStoreItems() {
      try {
        const rawItems = window.localStorage.getItem(getStoreStorageKey());
        const parsedItems = rawItems ? JSON.parse(rawItems) : [];
        return Array.isArray(parsedItems) ? parsedItems : [];
      } catch (error) {
        return [];
      }
    }

    function saveStoreItems(items) {
      window.localStorage.setItem(getStoreStorageKey(), JSON.stringify(items));
    }

    function getMachineStorageKey() {
      return 'prime_fabric_machine_records';
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
      try {
        const rawMachines = window.localStorage.getItem(getMachineStorageKey());
        const parsedMachines = rawMachines ? JSON.parse(rawMachines) : null;
        return Array.isArray(parsedMachines) && parsedMachines.length ? parsedMachines : getDefaultMachines();
      } catch (error) {
        return getDefaultMachines();
      }
    }

    function saveMachineRecords(machines) {
      window.localStorage.setItem(getMachineStorageKey(), JSON.stringify(machines));
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

    function clearWorkspaceState() {
      window.sessionStorage.removeItem(workspaceStateKey);
    }

    function formatDate(value) {
      if (!value) {
        return '-';
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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

    function getTotalsByTailor(project) {
      const totals = tailorNames.map(function () {
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

    function createEmptyTailorItemQuantities(itemCount) {
      return tailorNames.map(function () {
        return Array.from({ length: itemCount }, function () {
          return 0;
        });
      });
    }

    function getEntryTailorItemQuantities(entry, itemCount) {
      if (Array.isArray(entry.tailorItemQuantities)) {
        return tailorNames.map(function (_, tailorIndex) {
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
        return tailorNames.map(function (_, tailorIndex) {
          const parsedQuantity = Number(entry.quantities[tailorIndex]);
          return Array.from({ length: itemCount }, function (_, itemIndex) {
            if (itemIndex === 0) {
              return Number.isFinite(parsedQuantity) ? parsedQuantity : 0;
            }

            return 0;
          });
        });
      }

      return createEmptyTailorItemQuantities(itemCount);
    }

    function getTotalPiecesForTailorItem(project, tailorIndex, itemIndex, itemCount) {
      return (project.dailyEntries || []).reduce(function (sum, entry) {
        const quantities = getEntryTailorItemQuantities(entry, itemCount);
        const parsedQuantity = Number(
          quantities[tailorIndex] && quantities[tailorIndex][itemIndex] !== undefined
            ? quantities[tailorIndex][itemIndex]
            : 0
        );
        return sum + (Number.isFinite(parsedQuantity) ? parsedQuantity : 0);
      }, 0);
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

    function getTotalPayForTailor(project, tailorIndex, orderItems) {
      return (project.dailyEntries || []).reduce(function (sum, entry) {
        const quantities = getEntryTailorItemQuantities(entry, orderItems.length);
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

    function getProjectTotalTailorPayment(project) {
      const orderItems = getProjectOrderItems(project);
      return tailorNames.reduce(function (sum, _, tailorIndex) {
        return sum + getTotalPayForTailor(project, tailorIndex, orderItems);
      }, 0);
    }

    function getAdvanceBalanceRemaining(project) {
      return getProjectAdvancePayment(project) - getProjectTotalTailorPayment(project);
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
      return project.status || 'not_started';
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

      return {
        label: 'Not Yet Started',
        buttonClass: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
      };
    }

    function getNextProjectStatus(status) {
      if (status === 'not_started') {
        return 'active';
      }

      if (status === 'active') {
        return 'completed';
      }

      return 'not_started';
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
      projectStartDateInput.value = new Date().toISOString().slice(0, 10);
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
      projectStartDateInput.value = new Date().toISOString().slice(0, 10);
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
    }

    function getEmptyAttendanceRows() {
      return tailorNames.map(function (tailorName, index) {
        return {
          tailorId: 'tailor_' + (index + 1),
          tailorName: tailorName,
          status: 'absent',
          checkIn: '',
          checkOut: '',
        };
      });
    }

    function getAttendanceRowsForDate(date) {
      const records = loadAttendanceRecords();
      const savedRows = Array.isArray(records[date]) ? records[date] : [];

      return tailorNames.map(function (tailorName, index) {
        const savedRow = savedRows[index] || {};
        return {
          tailorId: 'tailor_' + (index + 1),
          tailorName: tailorName,
          status: savedRow.status === 'present' ? 'present' : 'absent',
          checkIn: savedRow.checkIn || '',
          checkOut: savedRow.checkOut || '',
        };
      });
    }

    function renderEmployeeRecord() {
      workspaceTitle.innerText = 'Employee record';
      workspaceSubtitle.innerText =
        'Keep daily attendance for each tailor with present or absent status and time tracking.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      const todayDate = new Date().toISOString().slice(0, 10);

      workspaceContent.innerHTML = `
        <div class="space-y-6">
          <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div class="flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <label class="max-w-xs flex-1">
                <span class="mb-2 block text-sm font-medium text-slate-300">Attendance date</span>
                <input
                  id="attendanceDateInput"
                  type="date"
                  value="${escapeHtml(todayDate)}"
                  class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60"
                />
              </label>
              <div class="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
                Mark each tailor present or absent. If present, fill check in and check out times.
              </div>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <th class="px-4 py-3 font-medium">Tailor</th>
                    <th class="px-4 py-3 font-medium">Status</th>
                    <th class="px-4 py-3 font-medium">Check In</th>
                    <th class="px-4 py-3 font-medium">Check Out</th>
                  </tr>
                </thead>
                <tbody id="attendanceTableBody" class="divide-y divide-white/10"></tbody>
              </table>
            </div>

            <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p id="attendanceMessage" class="text-sm text-slate-400">Attendance is ready to save for the selected date.</p>
              <button
                id="saveAttendanceButton"
                type="button"
                class="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
              >
                Save Attendance
              </button>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">Attendance history</p>
                <h3 class="mt-1 text-xl font-semibold text-white">Saved daily attendance record</h3>
              </div>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-[1200px] divide-y divide-white/10 text-left">
                <thead>
                  <tr id="attendanceHistoryHead" class="text-xs uppercase tracking-[0.2em] text-slate-400"></tr>
                </thead>
                <tbody id="attendanceHistoryTable" class="divide-y divide-white/10"></tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      const attendanceDateInput = document.getElementById('attendanceDateInput');
      const attendanceTableBody = document.getElementById('attendanceTableBody');
      const attendanceMessage = document.getElementById('attendanceMessage');
      const saveAttendanceButton = document.getElementById('saveAttendanceButton');
      const attendanceHistoryHead = document.getElementById('attendanceHistoryHead');
      const attendanceHistoryTable = document.getElementById('attendanceHistoryTable');

      function renderAttendanceRows(date) {
        const rows = getAttendanceRowsForDate(date);

        attendanceTableBody.innerHTML = rows
          .map(function (row, index) {
            const isPresent = row.status === 'present';
            return `
              <tr class="text-sm text-slate-200" data-attendance-row-index="${index}">
                <td class="px-4 py-4 font-medium text-white">${escapeHtml(row.tailorName)}</td>
                <td class="px-4 py-4">
                  <select
                    data-field="status"
                    class="attendance-field w-40 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                  >
                    <option value="absent" ${row.status === 'absent' ? 'selected' : ''}>Absent</option>
                    <option value="present" ${row.status === 'present' ? 'selected' : ''}>Present</option>
                  </select>
                </td>
                <td class="px-4 py-4">
                  <input
                    type="time"
                    data-field="checkIn"
                    value="${escapeHtml(row.checkIn)}"
                    ${isPresent ? '' : 'disabled'}
                    class="attendance-field w-40 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-indigo-400/60"
                  />
                </td>
                <td class="px-4 py-4">
                  <input
                    type="time"
                    data-field="checkOut"
                    value="${escapeHtml(row.checkOut)}"
                    ${isPresent ? '' : 'disabled'}
                    class="attendance-field w-40 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-indigo-400/60"
                  />
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

            const isPresent = select.value === 'present';
            const checkInInput = row.querySelector('input[data-field="checkIn"]');
            const checkOutInput = row.querySelector('input[data-field="checkOut"]');

            checkInInput.disabled = !isPresent;
            checkOutInput.disabled = !isPresent;

            if (!isPresent) {
              checkInInput.value = '';
              checkOutInput.value = '';
            }
          });
        });
      }

      function collectAttendanceRows() {
        return Array.from(attendanceTableBody.querySelectorAll('[data-attendance-row-index]')).map(function (row, index) {
          const statusField = row.querySelector('[data-field="status"]');
          const checkInField = row.querySelector('[data-field="checkIn"]');
          const checkOutField = row.querySelector('[data-field="checkOut"]');
          const isPresent = statusField && statusField.value === 'present';

          return {
            tailorId: 'tailor_' + (index + 1),
            tailorName: tailorNames[index],
            status: isPresent ? 'present' : 'absent',
            checkIn: isPresent && checkInField ? checkInField.value : '',
            checkOut: isPresent && checkOutField ? checkOutField.value : '',
          };
        });
      }

      function renderAttendanceHistory() {
        const records = loadAttendanceRecords();
        const dates = Object.keys(records).sort(function (left, right) {
          return left.localeCompare(right);
        });

        attendanceHistoryHead.innerHTML = dates.length
          ? `
              <th class="px-4 py-3 font-medium">Tailor</th>
              ${dates
                .map(function (date) {
                  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  });
                  return '<th class="px-4 py-3 font-medium">' + escapeHtml(formattedDate) + '</th>';
                })
                .join('')}
            `
          : '<th class="px-4 py-3 font-medium">Tailor</th>';

        attendanceHistoryTable.innerHTML = dates.length
          ? tailorNames
              .map(function (tailorName, tailorIndex) {
                return `
                  <tr class="text-sm text-slate-200">
                    <td class="px-4 py-4 font-medium text-white">${escapeHtml(tailorName)}</td>
                    ${dates
                      .map(function (date) {
                        const rows = Array.isArray(records[date]) ? records[date] : [];
                        const row = rows[tailorIndex] || null;

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
              .join('')
          : `
              <tr>
                <td colspan="1" class="px-4 py-10 text-center text-sm text-slate-400">
                  No attendance saved yet. Mark the first daily attendance above.
                </td>
              </tr>
            `;
      }

      attendanceDateInput.addEventListener('change', function () {
        renderAttendanceRows(attendanceDateInput.value);
        attendanceMessage.innerText = 'Attendance loaded for ' + formatDate(attendanceDateInput.value) + '.';
        attendanceMessage.className = 'text-sm text-slate-400';
      });

      saveAttendanceButton.addEventListener('click', function () {
        const selectedDate = attendanceDateInput.value;

        if (!selectedDate) {
          attendanceMessage.innerText = 'Please select a date before saving attendance.';
          attendanceMessage.className = 'text-sm text-rose-300';
          return;
        }

        const rows = collectAttendanceRows();
        const records = loadAttendanceRecords();
        records[selectedDate] = rows;
        saveAttendanceRecords(records);

        attendanceMessage.innerText = 'Attendance saved for ' + formatDate(selectedDate) + '.';
        attendanceMessage.className = 'text-sm text-emerald-300';
        renderAttendanceHistory();
      });

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

          saveMachineRecords(updatedMachines);
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

          saveStoreItems(updatedItems);
          input.disabled = true;
          input.classList.remove('bg-slate-950/80');
          input.classList.add('bg-slate-950/50');
          button.classList.add('hidden');
          editButton.classList.remove('hidden');
        });
      });

      Array.from(document.querySelectorAll('.delete-store-item')).forEach(function (button) {
        button.addEventListener('click', function () {
          const updatedItems = loadStoreItems().filter(function (item) {
            return item.id !== button.dataset.storeItemId;
          });
          saveStoreItems(updatedItems);
          renderStoreRecord();
        });
      });
    }

    function renderWorkspaceHome() {
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
        'Create a project card for each stitching order, then open it to record daily output for all 15 tailors.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.remove('hidden');
      newProjectButton.innerText = 'New Project';

      workspaceContent.innerHTML = projects.length
        ? `
          <div class="grid gap-5 xl:grid-cols-2">
            ${projects
              .map(function (project) {
                const statusMeta = getProjectStatusMeta(getProjectStatus(project));

                return `
                  <div class="rounded-3xl border border-white/10 bg-black/20 p-6 transition hover:border-indigo-400/40 hover:bg-indigo-500/10">
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
                      <button
                        type="button"
                        class="project-status-toggle rounded-full border px-3 py-1 text-xs font-semibold transition ${statusMeta.buttonClass}"
                        data-project-id="${project.id}"
                        data-project-status="${escapeHtml(getProjectStatus(project))}"
                      >
                        ${escapeHtml(statusMeta.label)}
                      </button>
                    </div>
                    <p class="mt-4 text-sm leading-6 text-slate-400">Open this card to view all project details, order items, and tailor tracking.</p>
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

      Array.from(workspaceContent.querySelectorAll('.project-status-toggle')).forEach(function (button) {
        button.addEventListener('click', function () {
          const projects = loadProjects();
          const projectIndex = projects.findIndex(function (project) {
            return project.id === button.dataset.projectId;
          });

          if (projectIndex === -1) {
            return;
          }

          projects[projectIndex].status = getNextProjectStatus(getProjectStatus(projects[projectIndex]));
          saveProjects(projects);
          renderProjectCards();
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

      const totals = getTotalsByTailor(project);
      const totalPieces = getProjectTotalPieces(project);
      const daysRemaining = getDaysRemaining(project);
      const orderItems = getProjectOrderItems(project);
      const statusMeta = getProjectStatusMeta(getProjectStatus(project));
      const totalTailorPayment = getProjectTotalTailorPayment(project);
      const advanceReceived = getProjectAdvancePayment(project);
      const remainingAdvanceBalance = getAdvanceBalanceRemaining(project);

      workspaceTitle.innerText = project.name;
      workspaceSubtitle.innerText =
        'Select a date, enter how many pieces each tailor completed, and save the daily row for this project.';
      workspaceBackButton.classList.remove('hidden');
      newProjectButton.classList.add('hidden');

      workspaceContent.innerHTML = `
        <div class="space-y-6">
          <div class="grid gap-4 xl:grid-cols-5">
            <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Order items</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml(String(orderItems.length || 0))}</p>
            </div>
            <div class="rounded-2xl border ${statusMeta.buttonClass} p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-slate-300">Project status</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml(statusMeta.label)}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Deadline</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml(project.deadlineDays ? project.deadlineDays + ' days' : '-')}</p>
              <p class="mt-2 text-sm text-slate-400">${escapeHtml(
                daysRemaining === null
                  ? 'Set the project dates to monitor the deadline.'
                  : daysRemaining >= 0
                    ? daysRemaining + ' day' + (daysRemaining === 1 ? '' : 's') + ' left'
                    : Math.abs(daysRemaining) + ' day' + (Math.abs(daysRemaining) === 1 ? '' : 's') + ' overdue'
              )}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Total pieces completed</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml(String(totalPieces))}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Tailor rate per stitch</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml(getTailorRateSummary(project))}</p>
            </div>
            <div class="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-emerald-300">Locked amount with client</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(getProjectLockedAmount(project)))}</p>
            </div>
            <div class="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-cyan-200">Advance payment received</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(advanceReceived))}</p>
            </div>
            <div class="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
              <p class="text-xs uppercase tracking-[0.22em] text-amber-200">Total paid to tailors</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(totalTailorPayment))}</p>
            </div>
            <div class="rounded-2xl border ${remainingAdvanceBalance >= 0 ? 'border-indigo-400/20 bg-indigo-500/10' : 'border-rose-400/20 bg-rose-500/10'} p-5">
              <p class="text-xs uppercase tracking-[0.22em] ${remainingAdvanceBalance >= 0 ? 'text-indigo-200' : 'text-rose-200'}">Advance balance remaining</p>
              <p class="mt-3 text-xl font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(remainingAdvanceBalance))}</p>
              <p class="mt-2 text-sm text-slate-300">Daily tailor payments are deducted from advance received only.</p>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">Order breakdown</p>
                <h3 class="mt-1 text-xl font-semibold text-white">All items from this organization</h3>
              </div>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <th class="px-4 py-3 font-medium">Article type</th>
                    <th class="px-4 py-3 font-medium">Target pieces</th>
                    <th class="px-4 py-3 font-medium">Tailor rate</th>
                    <th class="px-4 py-3 font-medium">Client total amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10">
                  ${orderItems
                    .map(function (item) {
                      return `
                        <tr class="text-sm text-slate-200">
                          <td class="px-4 py-4 font-medium text-white">${escapeHtml(item.itemType || '-')}</td>
                          <td class="px-4 py-4">${escapeHtml(item.targetPieces ? String(item.targetPieces) : '-')}</td>
                          <td class="px-4 py-4">${escapeHtml(item.ratePerStitch ? 'Rs ' + formatCurrency(item.ratePerStitch) : '-')}</td>
                          <td class="px-4 py-4">${escapeHtml(item.clientAmount ? 'Rs ' + formatCurrency(item.clientAmount) : '-')}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div class="flex flex-col gap-3 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
              <label class="max-w-xs flex-1">
                <span class="mb-2 block text-sm font-medium text-slate-300">Entry date</span>
                <input
                  id="primeFabricEntryDate"
                  type="date"
                  value="${escapeHtml(new Date().toISOString().slice(0, 10))}"
                  class="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400/60"
                />
              </label>
              <div class="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
                Fill separate item counts for the selected date, then save.
              </div>
              <div class="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <span class="block text-xs uppercase tracking-[0.2em] text-amber-200">Daily salary given</span>
                <span id="primeFabricDailyPayout" class="mt-1 block text-base font-semibold text-white">Rs 0</span>
              </div>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-[1500px] divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <th class="px-4 py-3 font-medium">Tailor</th>
                    ${orderItems
                      .map(function (item) {
                        return '<th class="px-4 py-3 font-medium">' + escapeHtml(item.itemType || 'Item') + ' today</th>';
                      })
                      .join('')}
                    ${orderItems
                      .map(function (item) {
                        return '<th class="px-4 py-3 font-medium">' + escapeHtml(item.itemType || 'Item') + ' total</th>';
                      })
                      .join('')}
                    <th class="px-4 py-3 font-medium">Today pay</th>
                    <th class="px-4 py-3 font-medium">Total pay</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10">
                  ${tailorNames
                    .map(function (tailorName, index) {
                      const totalPay = getTotalPayForTailor(project, index, orderItems);
                      return `
                        <tr class="text-sm text-slate-200">
                          <td class="px-4 py-4 font-medium text-white">${escapeHtml(tailorName)}</td>
                          ${orderItems
                            .map(function (_, itemIndex) {
                              return `
                                <td class="px-4 py-4">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value="0"
                                    data-tailor-index="${index}"
                                    data-item-index="${itemIndex}"
                                    class="tailor-item-quantity-input w-24 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-400/60"
                                  />
                                </td>
                              `;
                            })
                            .join('')}
                          ${orderItems
                            .map(function (_, itemIndex) {
                              return '<td class="px-4 py-4">' + escapeHtml(String(getTotalPiecesForTailorItem(project, index, itemIndex, orderItems.length))) + '</td>';
                            })
                            .join('')}
                          <td class="px-4 py-4 font-semibold text-emerald-200" data-today-pay-for-tailor="${index}">Rs 0</td>
                          <td class="px-4 py-4 font-semibold text-white">${escapeHtml('Rs ' + formatCurrency(totalPay))}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>

            <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p id="primeFabricEntryMessage" class="text-sm text-slate-400">No row saved yet for today.</p>
              <button
                id="saveDailyEntryButton"
                type="button"
                class="rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
              >
                Save Day Record
              </button>
            </div>
          </div>

          <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">Daily history</p>
                <h3 class="mt-1 text-xl font-semibold text-white">Saved date-wise tailor sheet</h3>
              </div>
            </div>

            <div class="mt-5 overflow-x-auto">
              <table class="min-w-[1600px] divide-y divide-white/10 text-left">
                <thead>
                  <tr class="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <th class="px-4 py-3 font-medium">Date</th>
                    <th class="px-4 py-3 font-medium">Item</th>
                    <th class="px-4 py-3 font-medium">Daily tailor payment</th>
                    ${tailorNames
                      .map(function (tailorName) {
                        return '<th class="px-4 py-3 font-medium">' + escapeHtml(tailorName) + '</th>';
                      })
                      .join('')}
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10">
                  ${
                    (project.dailyEntries || []).length
                      ? project.dailyEntries
                          .slice()
                          .sort(function (left, right) {
                            return right.date.localeCompare(left.date);
                          })
                          .map(function (entry) {
                            const entryQuantities = getEntryTailorItemQuantities(entry, orderItems.length);

                            return orderItems
                              .map(function (item, itemIndex) {
                                return `
                                  <tr class="text-sm text-slate-200">
                                    <td class="px-4 py-4 font-medium text-white">${escapeHtml(formatDate(entry.date))}</td>
                                    <td class="px-4 py-4">${escapeHtml(item.itemType || 'Item')}</td>
                                    <td class="px-4 py-4 font-semibold text-amber-200">${itemIndex === 0 ? escapeHtml('Rs ' + formatCurrency(entry.dailyPayout || 0)) : '-'}</td>
                                    ${tailorNames
                                      .map(function (_, tailorIndex) {
                                        return '<td class="px-4 py-4">' + escapeHtml(String((entryQuantities[tailorIndex] && entryQuantities[tailorIndex][itemIndex]) || 0)) + '</td>';
                                      })
                                      .join('')}
                                  </tr>
                                `;
                              })
                              .join('');
                          })
                          .join('')
                      : `
                        <tr>
                          <td colspan="${tailorNames.length + 3}" class="px-4 py-10 text-center text-sm text-slate-400">
                            No date-wise entries saved yet. Add the first day record above.
                          </td>
                        </tr>
                      `
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      const entryDateInput = document.getElementById('primeFabricEntryDate');
      const saveDailyEntryButton = document.getElementById('saveDailyEntryButton');
      const entryMessage = document.getElementById('primeFabricEntryMessage');
      const dailyPayoutElement = document.getElementById('primeFabricDailyPayout');
      const quantityInputs = Array.from(document.querySelectorAll('.tailor-item-quantity-input'));
      const todayPayElements = Array.from(document.querySelectorAll('[data-today-pay-for-tailor]'));

      function applySavedDateValues() {
        const savedEntry = getDailyEntryByDate(project, entryDateInput.value);
        const savedQuantities = savedEntry
          ? getEntryTailorItemQuantities(savedEntry, orderItems.length)
          : createEmptyTailorItemQuantities(orderItems.length);

        quantityInputs.forEach(function (input) {
          const tailorIndex = Number(input.dataset.tailorIndex);
          const itemIndex = Number(input.dataset.itemIndex);
          input.value = String(
            savedQuantities[tailorIndex] && savedQuantities[tailorIndex][itemIndex] !== undefined
              ? savedQuantities[tailorIndex][itemIndex]
              : 0
          );
        });
        entryMessage.innerText = savedEntry
          ? 'An existing row was loaded for ' + formatDate(savedEntry.date) + '. Saving again will update it.'
          : 'No row saved yet for ' + formatDate(entryDateInput.value) + '.';
        updateTodayPayPreview();
      }

      function updateTodayPayPreview() {
        let totalDailyPayout = 0;
        todayPayElements.forEach(function (element) {
          const tailorIndex = Number(element.dataset.todayPayForTailor);
          const tailorQuantities = orderItems.map(function (_, itemIndex) {
            const input = document.querySelector(
              '.tailor-item-quantity-input[data-tailor-index="' +
                tailorIndex +
                '"][data-item-index="' +
                itemIndex +
                '"]'
            );
            const parsedValue = Number(input ? input.value : 0);
            return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
          });

          const tailorPay = getPayForTailorRow(tailorQuantities, orderItems);
          totalDailyPayout += tailorPay;
          element.innerText = 'Rs ' + formatCurrency(tailorPay);
        });
        dailyPayoutElement.innerText = 'Rs ' + formatCurrency(totalDailyPayout);
      }

      entryDateInput.addEventListener('change', applySavedDateValues);
      quantityInputs.forEach(function (input) {
        input.addEventListener('input', updateTodayPayPreview);
      });
      applySavedDateValues();

      saveDailyEntryButton.addEventListener('click', function () {
        const selectedDate = entryDateInput.value;

        if (!selectedDate) {
          entryMessage.innerText = 'Please choose a date before saving the row.';
          entryMessage.className = 'text-sm text-rose-300';
          return;
        }

        const quantities = createEmptyTailorItemQuantities(orderItems.length);
        quantityInputs.forEach(function (input) {
          const tailorIndex = Number(input.dataset.tailorIndex);
          const itemIndex = Number(input.dataset.itemIndex);
          const parsedValue = Number(input.value);
          quantities[tailorIndex][itemIndex] =
            Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
        });

        const projects = loadProjects();
        const projectIndex = projects.findIndex(function (item) {
          return item.id === project.id;
        });

        if (projectIndex === -1) {
          return;
        }

        const existingEntryIndex = (projects[projectIndex].dailyEntries || []).findIndex(function (entry) {
          return entry.date === selectedDate;
        });

        const nextEntry = {
          id:
            existingEntryIndex >= 0
              ? projects[projectIndex].dailyEntries[existingEntryIndex].id
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

        if (!Array.isArray(projects[projectIndex].dailyEntries)) {
          projects[projectIndex].dailyEntries = [];
        }

        if (existingEntryIndex >= 0) {
          projects[projectIndex].dailyEntries[existingEntryIndex] = nextEntry;
        } else {
          projects[projectIndex].dailyEntries.push(nextEntry);
        }

        saveProjects(projects);
        entryMessage.innerText = 'Saved daily record for ' + formatDate(selectedDate) + '.';
        entryMessage.className = 'text-sm text-emerald-300';
        renderProjectDetail();
      });
    }

    function renderCurrentView() {
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

      closeWorkspace();
    });

    newProjectButton.addEventListener('click', function () {
      if (currentView === 'store') {
        openStoreModal();
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
      saveStoreItems(nextItems);
      closeStoreModal();

      if (currentView === 'store') {
        renderStoreRecord();
      }
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

      const lockedAmount = orderItems.reduce(function (sum, item) {
        return sum + getLockedAmount(item.clientAmount);
      }, 0);
      const parsedAdvancePayment = advancePaymentReceived ? Number(advancePaymentReceived) : 0;

      if (!Number.isFinite(parsedAdvancePayment) || parsedAdvancePayment < 0) {
        showProjectModalError('Please enter a valid advance payment amount.');
        return;
      }

      const projects = loadProjects();
      projects.unshift({
        id: createId('project'),
        name: name,
        startDate: startDate,
        deadlineDays: Number(deadlineDays),
        status: 'not_started',
        orderItems: orderItems,
        targetPieces: orderItems.reduce(function (sum, item) {
          return sum + (Number.isFinite(item.targetPieces) ? item.targetPieces : 0);
        }, 0),
        advancePaymentReceived: parsedAdvancePayment,
        clientAmount: lockedAmount,
        lockedAmount: lockedAmount,
        tailors: tailorNames,
        dailyEntries: [],
        createdAt: new Date().toISOString(),
      });
      saveProjects(projects);
      closeProjectModal();
      currentView = 'list';
      saveWorkspaceState(true);
      renderCurrentView();
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
          renderCurrentView();
        } catch (error) {
          window.alert(error.message);
        }
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
      fundingDateInput.value = new Date().toISOString().slice(0, 10);
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
