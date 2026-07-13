(function () {
  const sessionStorageKey = 'oms_auth_session';
  const pakroseWorkspaceStorageKey = 'pakrose_workspace_data';
  const activeCompany = document.body.dataset.company || 'prime_fabric';

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

  function loadWorkspaceData() {
    try {
      const rawData = window.localStorage.getItem(pakroseWorkspaceStorageKey);
      const parsed = rawData ? JSON.parse(rawData) : null;

      if (!parsed || typeof parsed !== 'object') {
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

      const legacyTotal = Number(parsed.totalAvailable) || 0;
      const fundingHistory = Array.isArray(parsed.fundingHistory)
        ? parsed.fundingHistory
        : legacyTotal > 0
          ? [
              {
                id: 'funding_initial_' + legacyTotal,
                date: '',
                amount: legacyTotal,
                note: 'Opening balance',
              },
            ]
          : [];

      return {
        fundingHistory: fundingHistory,
        government: Array.isArray(parsed.government) ? parsed.government : [],
        ngos: Array.isArray(parsed.ngos) ? parsed.ngos : [],
        private: Array.isArray(parsed.private) ? parsed.private : [],
        dailyExpenses: Array.isArray(parsed.dailyExpenses) ? parsed.dailyExpenses : [],
        store: Array.isArray(parsed.store) ? parsed.store : [],
        templateVault: Array.isArray(parsed.templateVault) ? parsed.templateVault : [],
      };
    } catch (error) {
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
  }

  function saveWorkspaceData(data) {
    window.localStorage.setItem(pakroseWorkspaceStorageKey, JSON.stringify(data));
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
  document.getElementById('summaryPanel').className =
    'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  document.getElementById('activityPanel').className =
    'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  document.getElementById('accessPanel').className =
    'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;

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

  function initializePakroseWorkspace() {
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
      !fundingHistoryTable
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

    let workspaceData = loadWorkspaceData();
    let currentView = 'home';
    let activeSector = null;
    let activeOrganizationId = null;
    const templateVaultInput = document.createElement('input');
    templateVaultInput.type = 'file';
    templateVaultInput.accept = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    templateVaultInput.className = 'hidden';
    document.body.appendChild(templateVaultInput);

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

    function renderSectorCards() {
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
        button.addEventListener('click', function () {
          const itemId = button.dataset.itemId;
          const input = managementContent.querySelector('.store-quantity[data-item-id="' + itemId + '"]');
          const editButton = managementContent.querySelector('.edit-store-item[data-item-id="' + itemId + '"]');
          const targetItem = (workspaceData.store || []).find(function (item) {
            return item.id === itemId;
          });

          if (!input || !editButton || !targetItem) {
            return;
          }

          targetItem.quantity = input.value.trim() || '0';
          saveWorkspaceData(workspaceData);
          input.disabled = true;
          input.classList.remove('bg-slate-950/80');
          input.classList.add('bg-slate-950/50');
          button.classList.add('hidden');
          editButton.classList.remove('hidden');
        });
      });

      Array.from(managementContent.querySelectorAll('.delete-store-item')).forEach(function (button) {
        button.addEventListener('click', function () {
          workspaceData.store = (workspaceData.store || []).filter(function (item) {
            return item.id !== button.dataset.itemId;
          });

          saveWorkspaceData(workspaceData);
          renderCurrentView();
        });
      });
    }

    function renderDailyExpensesSheet() {
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
        button.addEventListener('click', function () {
          workspaceData.dailyExpenses = (workspaceData.dailyExpenses || []).filter(function (item) {
            return item.id !== button.dataset.itemId;
          });

          saveWorkspaceData(workspaceData);
          renderCurrentView();
        });
      });
    }

    function renderTemplateVaultSheet() {
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

          if (!targetFile || !targetFile.content) {
            return;
          }

          const downloadLink = document.createElement('a');
          downloadLink.href = targetFile.content;
          downloadLink.download = targetFile.name;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });
      });

      Array.from(managementContent.querySelectorAll('.delete-template')).forEach(function (button) {
        button.addEventListener('click', function () {
          workspaceData.templateVault = (workspaceData.templateVault || []).filter(function (file) {
            return file.id !== button.dataset.fileId;
          });

          saveWorkspaceData(workspaceData);
          renderCurrentView();
        });
      });
    }

    function renderOrganizationSheet() {
      const organization = getOrganizationById(activeSector, activeOrganizationId);

      if (!organization) {
        currentView = 'sector';
        renderCurrentView();
        return;
      }

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

      addEntryButton.addEventListener('click', function () {
        const date = entryDate.value.trim();
        const description = entryDescription.value.trim();
        const amountSpent = entryAmount.value.trim();
        const paidBy = entryPaidBy.value.trim();

        if (!date || !description || !amountSpent || !paidBy) {
          window.alert('Please fill date, description, amount spent, and paid by before adding the entry.');
          return;
        }

        const targetOrganization = getOrganizationById(activeSector, activeOrganizationId);

        if (!targetOrganization) {
          return;
        }

        targetOrganization.entries.unshift({
          id: 'entry_' + Date.now(),
          date: date,
          description: description,
          amountSpent: amountSpent,
          paidBy: paidBy,
        });

        saveWorkspaceData(workspaceData);
        renderCurrentView();
      });

      Array.from(managementContent.querySelectorAll('.delete-entry')).forEach(function (button) {
        button.addEventListener('click', function () {
          const targetOrganization = getOrganizationById(activeSector, activeOrganizationId);

          if (!targetOrganization) {
            return;
          }

          targetOrganization.entries = targetOrganization.entries.filter(function (entry) {
            return entry.id !== button.dataset.entryId;
          });

          saveWorkspaceData(workspaceData);
          renderCurrentView();
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

    function showManagementScreen() {
      workspaceData = loadWorkspaceData();
      getInButton.classList.add('hidden');
      workspaceBackButton.classList.remove('hidden');
      dashboardHome.classList.add('hidden');
      managementScreen.classList.remove('hidden');
      currentView = 'home';
      activeSector = null;
      activeOrganizationId = null;
      renderCurrentView();
    }

    function createOrganization() {
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

        workspaceData.dailyExpenses.unshift({
          id: 'daily_' + Date.now(),
          date: expenseDate,
          description: expenseDescription,
          amount: expenseAmount,
        });

        saveWorkspaceData(workspaceData);
        renderCurrentView();
        return;
      }

      if (activeSector === 'store') {
        const itemName = window.prompt('Enter the item name:');

        if (!itemName) {
          return;
        }

        const trimmedItemName = itemName.trim();

        if (!trimmedItemName) {
          window.alert('Item name cannot be empty.');
          return;
        }

        workspaceData.store.unshift({
          id: 'store_' + Date.now(),
          name: trimmedItemName,
          quantity: '0',
        });

        saveWorkspaceData(workspaceData);
        renderCurrentView();
        return;
      }

      if (!activeSector) {
        return;
      }

      const organizationName = window.prompt('Enter the new organization name:');

      if (!organizationName) {
        return;
      }

      const trimmedName = organizationName.trim();

      if (!trimmedName) {
        window.alert('Organization name cannot be empty.');
        return;
      }

      workspaceData[activeSector].unshift({
        id: 'org_' + Date.now(),
        name: trimmedName,
        entries: [],
      });

      saveWorkspaceData(workspaceData);
      renderCurrentView();
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
      reader.onload = function () {
        workspaceData.templateVault = workspaceData.templateVault || [];
        workspaceData.templateVault.unshift({
          id: 'template_' + Date.now(),
          name: fileName,
          extension: extension,
          uploadedAt: new Date().toLocaleDateString(),
          content: reader.result,
        });

        saveWorkspaceData(workspaceData);
        renderCurrentView();
        templateVaultInput.value = '';
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

    addFundingButton.addEventListener('click', function () {
      const fundingDate = fundingDateInput.value.trim();
      const fundingAmount = Number(fundingAmountInput.value.trim());
      const fundingNote = fundingNoteInput.value.trim();

      if (!fundingDate || !Number.isFinite(fundingAmount) || fundingAmount <= 0) {
        window.alert('Please enter a valid date and amount received.');
        return;
      }

      workspaceData.fundingHistory = getFundingHistory();
      workspaceData.fundingHistory.push({
        id: 'funding_' + Date.now(),
        date: fundingDate,
        amount: fundingAmount,
        note: fundingNote,
      });

      saveWorkspaceData(workspaceData);
      updateTotalAmountButton();
      renderFundingModal();
      fundingAmountInput.value = '';
      fundingNoteInput.value = '';
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
        renderCurrentView();
        return;
      }

      if (currentView === 'store') {
        currentView = 'home';
        activeSector = null;
        renderCurrentView();
        return;
      }

      if (currentView === 'dailyExpenses') {
        currentView = 'home';
        activeSector = null;
        renderCurrentView();
        return;
      }

      if (currentView === 'templateVault') {
        currentView = 'home';
        activeSector = null;
        renderCurrentView();
        return;
      }

      managementScreen.classList.add('hidden');
      dashboardHome.classList.remove('hidden');
      getInButton.classList.remove('hidden');
      workspaceBackButton.classList.add('hidden');
    });
  }

  initializePakroseWorkspace();

  window.addEventListener('pageshow', function () {
    const activeSession = loadSession();

    if (!activeSession || activeSession.company !== activeCompany) {
      redirectToLogin();
    }
  });
})();
