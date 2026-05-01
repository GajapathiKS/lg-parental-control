/**
 * Lockscreen Module — "Time's up" overlay and warning popup
 */
var Lockscreen = (function () {
  var _overlay = null;

  function init() {
    _overlay = document.getElementById('modal-overlay');
  }

  /**
   * Show warning popup (X minutes remaining)
   */
  function showWarning(minutesLeft, profileName) {
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="modal" style="text-align: center;">' +
        '<div style="font-size: 72px; margin-bottom: 16px;">⏰</div>' +
        '<div class="title" style="color: var(--warning);">' + minutesLeft + ' minutes left!</div>' +
        '<div class="subtitle">' + profileName + ', your screen time is almost up.</div>' +
        '<button class="btn btn-primary focusable" tabindex="0" id="btn-dismiss-warning">OK, got it!</button>' +
      '</div>';

    document.getElementById('btn-dismiss-warning').addEventListener('click', function () {
      _overlay.classList.add('hidden');
    });
    Navigation.focusFirst(_overlay);
  }

  /**
   * Show lockscreen (time limit reached — blocks everything)
   */
  function showLockscreen(profileName) {
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="modal" style="text-align: center; min-width: 700px;">' +
        '<div style="font-size: 96px; margin-bottom: 16px;">🛑</div>' +
        '<div class="title" style="color: var(--danger);">Time\'s Up!</div>' +
        '<div class="subtitle">' + profileName + ', you\'ve used all your screen time for today.<br>Come back tomorrow!</div>' +
        '<div style="margin-top: 40px;">' +
          '<button class="btn focusable" tabindex="0" id="btn-unlock">🔒 Unlock with Parent PIN</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-unlock').addEventListener('click', function () {
      hide();
      App.navigate('pin-entry', { next: 'extension-choice' });
    });
    Navigation.focusFirst(_overlay);
  }

  /**
   * Show extension choice (after PIN unlock from lockscreen)
   */
  function showExtensionChoice() {
    var settings = Storage.getSettings();
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="modal" style="text-align: center;">' +
        '<div class="title">Parent Override</div>' +
        '<div class="subtitle">What would you like to do?</div>' +
        '<div class="col" style="gap: 16px; margin-top: 24px;">' +
          '<button class="btn btn-primary focusable" tabindex="0" id="btn-extend">Extend time by ' + settings.extensionMinutes + ' minutes</button>' +
          '<button class="btn focusable" tabindex="0" id="btn-switch">Switch to another profile</button>' +
          '<button class="btn focusable" tabindex="0" id="btn-dashboard">Go to Parent Dashboard</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-extend').addEventListener('click', function () {
      Timer.extendTime(settings.extensionMinutes);
      hide();
    });
    document.getElementById('btn-switch').addEventListener('click', function () {
      hide();
      Timer.stop();
      App.navigate('profile-select');
    });
    document.getElementById('btn-dashboard').addEventListener('click', function () {
      hide();
      Timer.stop();
      App.navigate('parent-dashboard');
    });
    Navigation.focusFirst(_overlay);
  }

  function hide() {
    _overlay.classList.add('hidden');
    _overlay.innerHTML = '';
  }

  function isVisible() {
    return !_overlay.classList.contains('hidden');
  }

  return {
    init: init,
    showWarning: showWarning,
    showLockscreen: showLockscreen,
    showExtensionChoice: showExtensionChoice,
    hide: hide,
    isVisible: isVisible,
  };
})();
