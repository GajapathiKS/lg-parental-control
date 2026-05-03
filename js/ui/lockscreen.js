/**
 * Lockscreen Module - warning popup, blocked screen, and parent override.
 */
var Lockscreen = (function () {
  var _overlay = null;

  function init() {
    _overlay = document.getElementById('modal-overlay');
  }

  function showWarning(minutesLeft, profileName) {
    var title = 'Mission timer';
    var body = _escapeHtml(profileName) + ', your screen time is almost complete.';
    if (arguments.length > 2 && arguments[2] && arguments[2].type === 'milestone') {
      title = arguments[2].milestoneMinutes + ' minute checkpoint';
      body = _escapeHtml(profileName) + ', you have been watching for ' + arguments[2].milestoneMinutes + ' minutes.';
    }
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="modal" style="text-align: center;">' +
        '<div class="mission-kicker">Mission timer</div>' +
        '<div class="title" style="color: var(--warning);">' + title + '</div>' +
        '<div class="subtitle">' + body + '</div>' +
        '<button class="btn btn-primary focusable" tabindex="0" id="btn-dismiss-warning">OK</button>' +
      '</div>';

    document.getElementById('btn-dismiss-warning').addEventListener('click', function () {
      _overlay.classList.add('hidden');
    });
    Navigation.focusFirst(_overlay);
  }

  function showLockscreen(profileName, options) {
    options = options || {};
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="lockscreen-immersive">' +
        '<div id="screensaver-stage" class="screensaver-stage"></div>' +
        '<button class="screensaver-parent-button focusable" tabindex="0" id="btn-unlock" aria-label="' + (options.manual ? 'Home' : 'Parent') + '">' +
          '<span class="' + (options.manual ? 'icon-home' : 'icon-lock') + '"></span>' +
        '</button>' +
      '</div>';

    Screensaver.start(document.getElementById('screensaver-stage'), options);

    document.getElementById('btn-unlock').addEventListener('click', function () {
      hide();
      if (options.manual) {
        App.navigate('profile-select');
      } else {
        App.navigate('pin-entry', { next: 'extension-choice' });
      }
    });
    Navigation.focusFirst(_overlay);
  }

  function showScreensaverPicker() {
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="modal slideshow-picker">' +
        '<div class="mission-kicker red">Screensaver</div>' +
        '<div class="title">Choose Photo Folder</div>' +
        '<div class="subtitle">Pick a mood, then the TV goes into clean slideshow mode.</div>' +
        '<div id="slideshow-folder-list" class="slideshow-folder-list">' +
          '<button class="btn btn-primary focusable" tabindex="0" id="btn-slideshow-loading">Loading folders...</button>' +
        '</div>' +
        '<div class="row" style="justify-content: flex-end; margin-top: 28px;">' +
          '<button class="btn focusable" tabindex="0" id="btn-close-slideshow-picker">Cancel</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-close-slideshow-picker').addEventListener('click', function () {
      hide();
    });
    Screensaver.getFolders().then(function (folders) {
      if (!_overlay || _overlay.classList.contains('hidden')) return;
      var list = document.getElementById('slideshow-folder-list');
      if (!list) return;
      if (!folders.length) {
        list.innerHTML = '<button class="btn btn-primary focusable" tabindex="0" data-slideshow-folder="">Start Slideshow</button>';
      } else {
        list.innerHTML = folders.map(function (folder) {
          return '<button class="slideshow-folder focusable" tabindex="0" data-slideshow-folder="' + _escapeHtml(folder.id) + '">' +
            '<span class="icon-slideshow"></span>' +
            '<span>' + _escapeHtml(folder.name) + '</span>' +
            '<small>' + folder.count + ' photos</small>' +
          '</button>';
        }).join('');
      }
      list.querySelectorAll('[data-slideshow-folder]').forEach(function (button) {
        button.addEventListener('click', function () {
          showLockscreen('Slideshow', {
            manual: true,
            folderId: this.getAttribute('data-slideshow-folder'),
          });
        });
      });
      Navigation.focusFirst(list);
    });
    Navigation.focusFirst(_overlay);
  }

  function showExtensionChoice() {
    var settings = Storage.getSettings();
    _overlay.classList.remove('hidden');
    _overlay.innerHTML =
      '<div class="modal" style="text-align: center;">' +
        '<div class="mission-kicker">Parent override</div>' +
        '<div class="title">Choose Next Step</div>' +
        '<div class="subtitle">Approve a short extension or return to parent controls.</div>' +
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
    Screensaver.stop();
    _overlay.classList.add('hidden');
    _overlay.innerHTML = '';
  }

  function isVisible() {
    return !_overlay.classList.contains('hidden');
  }

  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    init: init,
    showWarning: showWarning,
    showLockscreen: showLockscreen,
    showScreensaverPicker: showScreensaverPicker,
    showExtensionChoice: showExtensionChoice,
    hide: hide,
    isVisible: isVisible,
  };
})();
