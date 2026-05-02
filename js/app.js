/**
 * App Module - main entry point, router, initialization
 */
var App = (function () {
  var _currentScreen = null;
  var _history = [];

  function init() {
    console.info('[App] Initializing Parental Control v1.0.0');

    Viewport.init();
    Screens.init();
    Lockscreen.init();
    Navigation.init();

    Storage.purgeOldLogs();
    Storage.ensureDefaultBedtimeRule();
    Storage.clearActiveSession();

    if (!Storage.isSetupComplete()) {
      navigate('welcome');
    } else {
      navigate('profile-select');
    }
  }

  function navigate(screen, params) {
    params = params || {};

    if (_currentScreen && _currentScreen !== screen) {
      _history.push({ screen: _currentScreen, params: {} });
      if (_history.length > 20) _history.shift();
    }

    _currentScreen = screen;
    console.info('[App] Navigating to:', screen);

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
        _history = [];
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

  function goBack() {
    if (_history.length > 0) {
      var prev = _history.pop();
      _currentScreen = prev.screen;
      navigate(prev.screen, prev.params);
      return;
    }
    navigate('profile-select');
  }

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

document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
