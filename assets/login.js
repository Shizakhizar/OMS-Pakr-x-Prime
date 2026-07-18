(function () {
  const backendUrl = Object.prototype.hasOwnProperty.call(document.body.dataset, 'backendUrl')
    ? document.body.dataset.backendUrl
    : 'http://localhost:4000';
  const sessionStorageKey = 'oms_auth_session';

  function getCompanyAssetBase(company) {
    if (company === 'pakrose') {
      return '/pakrose';
    }

    return '/prime-fabric';
  }

  const companyBranding = {
    prime_fabric: {
      pageTitle: 'Prime Fabric Pakistan Login',
      logo: 'PF',
      logoPath: '/public/plogo.jpeg',
      companyName: 'Prime Fabric Pakistan',
      welcomeTitle: 'Industrial Stitching Portal',
      welcomeText:
        'Sign in to access production workflows, order visibility, and internal operational tools.',
      shellClass: 'bg-slate-900 text-slate-100',
      panelClass: 'border-slate-800/80 bg-slate-900/75',
      glowClass: 'from-indigo-500 to-blue-500',
      logoClass: 'from-indigo-500 to-blue-500',
      dashboardPath: '/prime-fabric/dashboard/',
    },
    pakrose: {
      pageTitle: 'Pakrose Enterprises Login',
      logo: 'PE',
      logoPath: '/public/oklogo.jpeg',
      companyName: 'Pakrose Enterprises',
      welcomeTitle: 'B2B Global Supply Chain Portal',
      welcomeText:
        'Sign in to manage partner access, streamline procurement, and track global supply operations.',
      shellClass: 'bg-slate-950 text-slate-100',
      panelClass: 'border-teal-900/40 bg-slate-900/80',
      glowClass: 'from-teal-500 to-emerald-500',
      logoClass: 'from-teal-500 to-emerald-500',
      dashboardPath: '/pakrose/dashboard/',
    },
  };

  const activeCompany = document.body.dataset.company || 'prime_fabric';
  const branding = companyBranding[activeCompany] || companyBranding.prime_fabric;
  const companyAssetBase = getCompanyAssetBase(activeCompany);

  const elements = {
    companyName: document.getElementById('companyName'),
    welcomeTitle: document.getElementById('welcomeTitle'),
    welcomeText: document.getElementById('welcomeText'),
    logoBadge: document.getElementById('logoBadge'),
    pageShell: document.getElementById('pageShell'),
    loginPanel: document.getElementById('loginPanel'),
    heroGlow: document.getElementById('heroGlow'),
    googleButtonWrap: document.getElementById('googleButtonWrap'),
    accessMessage: document.getElementById('accessMessage'),
  };

  document.title = branding.pageTitle;
  elements.companyName.innerText = branding.companyName;
  elements.welcomeTitle.innerText = branding.welcomeTitle;
  elements.welcomeText.innerText = '';
  elements.welcomeText.classList.add('hidden');

  elements.pageShell.className =
    'relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 ' +
    branding.shellClass;
  elements.loginPanel.className =
    'relative z-10 w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-sm sm:p-10 ' +
    branding.panelClass;
  elements.heroGlow.className =
    'absolute inset-x-0 top-0 h-64 bg-gradient-to-b opacity-15 blur-3xl ' + branding.glowClass;
  function renderLogoBadge() {
    elements.logoBadge.innerHTML = '';

    if (branding.logoPath) {
      elements.logoBadge.className =
        'mb-8 flex h-24 w-40 items-center justify-center rounded-3xl border border-white/10 bg-white px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.35)]';
      const logoImage = document.createElement('img');
      logoImage.src = companyAssetBase + branding.logoPath;
      logoImage.alt = branding.companyName + ' logo';
      logoImage.className = 'h-full w-full object-contain';
      elements.logoBadge.appendChild(logoImage);
      return;
    }

    elements.logoBadge.className =
      'mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold tracking-wide text-white shadow-lg ' +
      branding.logoClass;
    elements.logoBadge.innerText = branding.logo;
  }

  renderLogoBadge();

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

  function getDashboardUrl() {
    return getRoutePrefix() + '/dashboard/';
  }

  function loadStoredSession() {
    try {
      const rawSession = window.localStorage.getItem(sessionStorageKey);
      return rawSession ? JSON.parse(rawSession) : null;
    } catch (error) {
      return null;
    }
  }

  function storeSession(authData) {
    window.localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({
        email: authData.email,
        name: authData.name || '',
        picture: authData.picture || '',
        company: activeCompany,
        loginAt: new Date().toISOString(),
      })
    );
  }

  function clearStoredSession() {
    window.localStorage.removeItem(sessionStorageKey);
  }

  function redirectToDashboard() {
    window.location.replace(getDashboardUrl());
  }

  const existingSession = loadStoredSession();

  if (existingSession && existingSession.company === activeCompany) {
    redirectToDashboard();
    return;
  }

  function showMessage(message, type) {
    elements.accessMessage.innerText = message;
    elements.accessMessage.className =
      type === 'success'
        ? 'rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200'
        : 'rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200';
  }

  function renderGoogleButton(config) {
    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    window.google.accounts.id.renderButton(elements.googleButtonWrap, {
      theme: 'outline',
      size: 'large',
      width: 320,
      shape: 'pill',
      text: 'signin_with',
      logo_alignment: 'left',
    });
  }

  function waitForGoogleLibrary(timeoutMs) {
    return new Promise(function (resolve, reject) {
      const startTime = Date.now();

      function checkLibrary() {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          resolve();
          return;
        }

        if (Date.now() - startTime >= timeoutMs) {
          reject(new Error('Google Sign-In library failed to load.'));
          return;
        }

        window.setTimeout(checkLibrary, 100);
      }

      checkLibrary();
    });
  }

  async function loadAuthConfig() {
    const response = await fetch(backendUrl + '/api/config');

    if (!response.ok) {
      throw new Error('Unable to load authentication configuration.');
    }

    return response.json();
  }

  async function handleGoogleCredential(response) {
    if (!response || !response.credential) {
      showMessage('Google sign-in did not return a valid credential.', 'error');
      return;
    }

    showMessage('Verifying Google account access...', 'success');

    try {
      const authResponse = await fetch(backendUrl + '/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        showMessage(authData.message || 'No access for this Google account.', 'error');
        return;
      }

      storeSession(authData);
      showMessage('Access granted for ' + authData.email + '. Redirecting to dashboard...', 'success');
      window.setTimeout(function () {
        redirectToDashboard();
      }, 700);
    } catch (error) {
      showMessage(
        'Authentication service is unavailable. Start the backend and try again.',
        'error'
      );
    }
  }

  loadAuthConfig()
    .then(function (config) {
      if (!config.googleClientId) {
        showMessage(
          'Google auth is not configured yet. Add GOOGLE_CLIENT_ID in backend/.env and restart the backend.',
          'error'
        );
        return;
      }

      waitForGoogleLibrary(8000)
        .then(function () {
          renderGoogleButton(config);
        })
        .catch(function () {
          showMessage('Google Sign-In library failed to load. Refresh and try again.', 'error');
        });
    })
    .catch(function () {
      showMessage(
        'Cannot reach the backend. Please check the live server connection.',
        'error'
      );
    });

  window.addEventListener('pageshow', function () {
    const session = loadStoredSession();

    if (session && session.company === activeCompany) {
      redirectToDashboard();
    }
  });
})();
