(function () {
  const sessionStorageKey = 'oms_auth_session';
  const activeCompany = document.body.dataset.company || 'prime_fabric';

  const companyBranding = {
    prime_fabric: {
      pageTitle: 'Prime Fabric Pakistan Dashboard',
      companyName: 'Prime Fabric Pakistan',
      portalTitle: 'Industrial Stitching Portal',
      logo: 'PF',
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
      shellClass: 'bg-slate-950 text-slate-100',
      heroClass: 'from-teal-500 to-emerald-500',
      badgeClass: 'from-teal-500 to-emerald-500',
      accentTextClass: 'text-teal-300',
      panelClass: 'border-teal-900/40 bg-slate-900/80',
      loginPath: '/pakrose/',
    },
  };

  const branding = companyBranding[activeCompany] || companyBranding.prime_fabric;

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
  document.getElementById('brandBadge').className =
    'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg ' +
    branding.badgeClass;
  document.getElementById('summaryPanel').className =
    'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  document.getElementById('activityPanel').className =
    'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;
  document.getElementById('accessPanel').className =
    'rounded-2xl border p-6 shadow-2xl ' + branding.panelClass;

  document.getElementById('brandBadge').innerText = branding.logo;
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

  window.addEventListener('pageshow', function () {
    const activeSession = loadSession();

    if (!activeSession || activeSession.company !== activeCompany) {
      redirectToLogin();
    }
  });
})();
