/**
 * App Module — main entry point, router, initialization
 */
var App = (function () {
  var _currentScreen = null;
  var _history = [];

  /**
   * Initialize the app
   */
  function init() {
    console.info('[App] Initializing Parental Control v1.0.0');

    // Initialize modules
    Screens.init();
    Lockscreen.init();
    Navigation.init();
    SpaceScene.init();

    // Purge old usage logs on startup
    Storage.purgeOldLogs();

    // Always require profile selection on TV launch. This prevents a previous
    // session from bypassing the child/profile choice screen.
    Storage.clearActiveSession();

    // Route to appropriate first screen
    if (!Storage.isSetupComplete()) {
      navigate('welcome');
    } else {
      navigate('profile-select');
    }
  }

  /**
   * Navigate to a screen
   * @param {string} screen - screen name
   * @param {object} params - optional parameters
   */
  function navigate(screen, params) {
    params = params || {};

    // Track history for back navigation
    if (_currentScreen && _currentScreen !== screen) {
      _history.push({ screen: _currentScreen, params: {} });
      // Keep history manageable
      if (_history.length > 20) _history.shift();
    }

    _currentScreen = screen;
    console.info('[App] Navigating to:', screen);

    // Hide lockscreen if navigating away
    if (screen !== 'extension-choice' && Lockscreen.isVisible()) {
      Lockscreen.hide();
    }

    switch (screen) {
      case 'welcome':
        Screens.showWelcome();
        break;

      case 'setup-pin':
        Screens.showSetupPin(params.isChange || false);
        break;

      case 'create-profile':
        Screens.showCreateProfile();
        break;

      case 'profile-select':
        _history = []; // reset history at home
        Screens.showProfileSelect();
        break;

      case 'child-dashboard':
        Screens.showChildDashboard(params);
        break;

      case 'pin-entry':
        Screens.showPinEntry(params);
        break;

      case 'parent-dashboard':
        Screens.showParentDashboard();
        break;

      case 'profile-controls':
        Screens.showProfileControls(params.profileId);
        break;

      case 'profile-code-entry':
        Screens.showProfileCodeEntry(params);
        break;

      case 'settings':
        Screens.showSettings();
        break;

      case 'extension-choice':
        Lockscreen.showExtensionChoice();
        break;

      default:
        console.error('[App] Unknown screen:', screen);
        navigate('profile-select');
    }
  }

  /**
   * Go back to previous screen
   */
  function goBack() {
    if (_history.length > 0) {
      var prev = _history.pop();
      _currentScreen = prev.screen;
      navigate(prev.screen, prev.params);
    } else {
      // At root — use webOS platformBack to exit app
      if (typeof webOS !== 'undefined' && webOS.platformBack) {
        webOS.platformBack();
      }
    }
  }

  /**
   * Get current screen name
   */
  function getCurrentScreen() {
    return _currentScreen;
  }

  return {
    init: init,
    navigate: navigate,
    goBack: goBack,
    getCurrentScreen: getCurrentScreen,
  };
})();

// ─── BOOT ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
