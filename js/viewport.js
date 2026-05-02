/**
 * Keeps the app authored at 1920x1080 while fitting browser/emulator viewports.
 */
var Viewport = (function () {
  var BASE_WIDTH = 1920;
  var BASE_HEIGHT = 1080;

  function init() {
    if (_isWebOsTv()) return;
    document.documentElement.className += ' viewport-scaled';
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
  }

  function fit() {
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || BASE_WIDTH;
    var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || BASE_HEIGHT;
    if (width < 320 || height < 240) {
      width = BASE_WIDTH;
      height = BASE_HEIGHT;
    }
    var scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    var left = Math.max(0, (width - BASE_WIDTH * scale) / 2);
    var top = Math.max(0, (height - BASE_HEIGHT * scale) / 2);
    var root = document.documentElement;

    root.style.setProperty('--stage-scale', String(scale));
    root.style.setProperty('--stage-left', left + 'px');
    root.style.setProperty('--stage-top', top + 'px');
  }

  return {
    init: init,
    fit: fit,
  };

  function _isWebOsTv() {
    if (window.PalmSystem) return true;
    return !!(window.webOS && window.webOS.platform && window.webOS.platform.tv);
  }
})();
