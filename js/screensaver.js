/**
 * Screensaver - rotates local family photos during blocked time.
 * Images are listed in assets/screensaver/manifest.json.
 */
var Screensaver = (function () {
  var DEFAULT_FOLDERS = [
    {
      id: 'space-dreams',
      name: 'Space Dreams',
      basePath: 'assets/screensaver/',
      photos: ['space-01.png', 'space-02.png', 'space-03.png', 'space-04.png', 'space-05.png', 'space-06.png', 'space-07.png', 'space-08.png', 'space-09.png'],
    },
    {
      id: 'mission-deck',
      name: 'Mission Deck',
      basePath: 'assets/space/',
      photos: ['earth-hero.png', 'mars-bg.png', 'moon-bg.png', 'nebula-bg.png', 'orbit-station-bg.png', 'solar-system-bg.png', 'spacewalk-bg.png'],
    },
  ];
  var _photos = [];
  var _index = 0;
  var _interval = null;
  var _clockInterval = null;
  var _stage = null;
  var _photoSlidesShown = 0;

  function start(stage, options) {
    options = options || {};
    stop();
    _stage = stage;
    _startClock();
    var settings = Storage.getSettings();
    if (!settings.screensaverEnabled || !_stage) {
      _renderFallback();
      return;
    }

    _loadPhotos(options.manifestPath || settings.screensaverManifest, options.folderId).then(function (photos) {
      _photos = photos;
      _index = 0;
      _photoSlidesShown = 0;
      _renderCurrent();
      if (_photos.length > 1) {
        _interval = setInterval(_advance, Math.max(5, settings.screensaverIntervalSeconds || 12) * 1000);
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

  function _loadPhotos(manifestPath, folderId) {
    return fetch(manifestPath, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) return [];
        return response.json();
      })
      .then(function (manifest) {
        var folder = _selectFolder(manifest, folderId);
        return _mapPhotos(folder.photos || [], folder.basePath || manifest.basePath || 'assets/screensaver/');
      })
      .catch(function () {
        var folder = _selectFolder({ folders: DEFAULT_FOLDERS }, folderId);
        return _mapPhotos(folder.photos || [], folder.basePath || 'assets/screensaver/');
      });
  }

  function getFolders(manifestPath) {
    return fetch(manifestPath || Storage.getSettings().screensaverManifest, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) return [];
        return response.json();
      })
      .then(function (manifest) {
        return _normalizeFolders(manifest).map(function (folder) {
          return {
            id: folder.id,
            name: folder.name,
            count: (folder.photos || []).length,
          };
        });
      })
      .catch(function () {
        return DEFAULT_FOLDERS.map(function (folder) {
          return {
            id: folder.id,
            name: folder.name,
            count: (folder.photos || []).length,
          };
        });
      });
  }

  function _selectFolder(manifest, folderId) {
    var folders = _normalizeFolders(manifest);
    if (!folders.length) return { id: 'default', name: 'Default', basePath: manifest.basePath, photos: [] };
    for (var i = 0; i < folders.length; i++) {
      if (folders[i].id === folderId) return folders[i];
    }
    return folders[0];
  }

  function _normalizeFolders(manifest) {
    if (manifest.folders && manifest.folders.length) return manifest.folders;
    return [{
      id: 'default',
      name: 'Default',
      basePath: manifest.basePath || 'assets/screensaver/',
      photos: manifest.photos || [],
    }];
  }

  function _mapPhotos(photos, basePath) {
    return photos.map(function (photo) {
      if (typeof photo === 'string') {
        return { src: _resolveSrc(photo, basePath), alt: '' };
      }
      return {
        src: _resolveSrc(photo.src || '', basePath),
        alt: photo.alt || '',
      };
    });
  }

  function _resolveSrc(src, basePath) {
    if (!src) return '';
    if (/^(https?:|data:|assets\/|\/)/.test(src)) return src;
    return basePath + src;
  }

  function _renderCurrent() {
    if (!_stage) return;
    if (!_photos.length) {
      _renderFallback();
      return;
    }

    var photo = _photos[_index];
    _photoSlidesShown++;
    _stage.innerHTML =
      '<div class="screensaver-photo-frame">' +
        '<img class="screensaver-photo-bg" src="' + _escapeAttr(photo.src) + '" alt="">' +
        '<img class="screensaver-photo-main" src="' + _escapeAttr(photo.src) + '" alt="' + _escapeAttr(photo.alt) + '">' +
      '</div>' +
      _renderMiniClock();
    _wirePhotoFallbacks();
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
      _renderGiantClock();
    _updateClock();
  }

  function _advance() {
    if (!_stage) return;
    if (_photos.length && _photoSlidesShown > 0 && _photoSlidesShown % 6 === 0) {
      _renderClockBreak();
      _photoSlidesShown++;
      return;
    }
    if (_photos.length) {
      _index = (_index + 1) % _photos.length;
    }
    _renderCurrent();
  }

  function _renderClockBreak() {
    var photo = _photos.length ? _photos[Math.floor(Math.random() * _photos.length)] : null;
    _stage.innerHTML =
      '<div class="screensaver-photo-frame">' +
        (photo
          ? '<img class="screensaver-photo-bg" src="' + _escapeAttr(photo.src) + '" alt="">'
          : '<div class="screensaver-fallback"></div>') +
      '</div>' +
      _renderGiantClock();
    _wirePhotoFallbacks();
    _updateClock();
  }

  function _wirePhotoFallbacks() {
    if (!_stage) return;
    var imgs = _stage.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].onerror = function () {
        this.onerror = null;
        if (_photos.length > 1) {
          setTimeout(_advance, 250);
        } else {
          _renderFallback();
        }
      };
    }
  }

  function _renderMiniClock() {
    return '<div class="screensaver-mini-clock">' +
      '<div id="space-clock-time" class="mini-clock-time">--:--</div>' +
      '</div>';
  }

  function _renderGiantClock() {
    return '<div class="space-wheel-clock">' +
      '<div class="wheel-rim">' + _renderTicks(72) + '</div>' +
      '<div class="wheel-ring ring-one"></div>' +
      '<div class="wheel-ring ring-two"></div>' +
      '<div class="station-spoke spoke-a"></div>' +
      '<div class="station-spoke spoke-b"></div>' +
      '<div class="station-core">' +
        '<div id="space-clock-time" class="space-clock-time">--:--</div>' +
      '</div>' +
      '</div>';
  }

  function _renderTicks(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
      var major = i % 6 === 0 ? ' major' : '';
      html += '<span class="wheel-tick' + major + '" style="transform: rotate(' + (i * (360 / count)) + 'deg);"></span>';
    }
    return html;
  }

  function _startClock() {
    if (_clockInterval) clearInterval(_clockInterval);
    _clockInterval = setInterval(_updateClock, 1000);
  }

  function _updateClock() {
    var timeEl = document.getElementById('space-clock-time');
    var dateEl = document.getElementById('space-clock-date');
    if (!timeEl) return;

    var now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  function _escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  return {
    getFolders: getFolders,
    start: start,
    stop: stop,
  };
})();
