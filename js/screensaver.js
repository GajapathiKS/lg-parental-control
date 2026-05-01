/**
 * Screensaver - rotates local family photos during blocked time.
 * Images are listed in assets/screensaver/manifest.json.
 */
var Screensaver = (function () {
  var _photos = [];
  var _index = 0;
  var _interval = null;
  var _clockInterval = null;
  var _stage = null;

  function start(stage) {
    stop();
    _stage = stage;
    _startClock();
    var settings = Storage.getSettings();
    if (!settings.screensaverEnabled || !_stage) {
      _renderFallback();
      return;
    }

    _loadPhotos(settings.screensaverManifest).then(function (photos) {
      _photos = photos;
      _index = 0;
      _renderCurrent();
      if (_photos.length > 1) {
        _interval = setInterval(function () {
          _index = (_index + 1) % _photos.length;
          _renderCurrent();
        }, Math.max(5, settings.screensaverIntervalSeconds || 12) * 1000);
      }
    });
  }

  function stop() {
    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }
    if (_clockInterval) {
      clearInterval(_clockInterval);
      _clockInterval = null;
    }
    _stage = null;
  }

  function _loadPhotos(manifestPath) {
    return fetch(manifestPath, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) return [];
        return response.json();
      })
      .then(function (manifest) {
        var basePath = manifest.basePath || 'assets/screensaver/';
        return (manifest.photos || []).map(function (photo) {
          if (typeof photo === 'string') {
            return { src: basePath + photo, alt: '' };
          }
          return {
            src: photo.src.indexOf('/') === -1 ? basePath + photo.src : photo.src,
            alt: photo.alt || '',
          };
        });
      })
      .catch(function () {
        return [];
      });
  }

  function _renderCurrent() {
    if (!_stage) return;
    if (!_photos.length) {
      _renderFallback();
      return;
    }

    var photo = _photos[_index];
    _stage.innerHTML =
      '<div class="screensaver-photo-frame">' +
        '<img class="screensaver-photo-bg" src="' + _escapeAttr(photo.src) + '" alt="">' +
        '<img class="screensaver-photo-main" src="' + _escapeAttr(photo.src) + '" alt="' + _escapeAttr(photo.alt) + '">' +
      '</div>' +
      _renderClock();
    _updateClock();
  }

  function _renderFallback() {
    if (!_stage) return;
    _stage.innerHTML =
      '<div class="screensaver-fallback">' +
        '<div class="orbit orbit-a"></div>' +
        '<div class="orbit orbit-b"></div>' +
        '<div class="fallback-planet"></div>' +
      '</div>' +
      _renderClock();
    _updateClock();
  }

  function _renderClock() {
    return '<div class="space-clock">' +
      '<div class="space-clock-orbit"><div class="space-clock-dot"></div></div>' +
      '<div class="space-clock-kicker">Earth local time</div>' +
      '<div id="space-clock-time" class="space-clock-time">--:--</div>' +
      '<div id="space-clock-date" class="space-clock-date">Preparing orbit</div>' +
      '<div class="space-clock-next">Next launch window: tomorrow</div>' +
      '</div>';
  }

  function _startClock() {
    if (_clockInterval) clearInterval(_clockInterval);
    _clockInterval = setInterval(_updateClock, 1000);
  }

  function _updateClock() {
    var timeEl = document.getElementById('space-clock-time');
    var dateEl = document.getElementById('space-clock-date');
    if (!timeEl || !dateEl) return;

    var now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    dateEl.textContent = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  function _escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  return {
    start: start,
    stop: stop,
  };
})();
