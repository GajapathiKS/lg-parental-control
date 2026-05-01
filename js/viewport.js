/**
 * Keeps the app authored at 1920x1080 while fitting browser/emulator viewports.
 */
var Viewport = (function () {
  var BASE_WIDTH = 1920;
  var BASE_HEIGHT = 1080;

  function init() {
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
  }

  function fit() {
    var width = window.innerWidth || BASE_WIDTH;
    var height = window.innerHeight || BASE_HEIGHT;
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
})();
