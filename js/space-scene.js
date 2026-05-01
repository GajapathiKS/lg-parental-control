/**
 * Space Scene - immersive animated background for the TV UI.
 * Uses canvas instead of a remote dependency so the packaged webOS app stays offline-ready.
 */
var SpaceScene = (function () {
  var _canvas = null;
  var _ctx = null;
  var _stars = [];
  var _rings = [];
  var _width = 1920;
  var _height = 1080;
  var _raf = null;

  function init() {
    _canvas = document.getElementById('space-scene');
    if (!_canvas) return;
    _ctx = _canvas.getContext('2d');
    _resize();
    _seed();
    _animate();
  }

  function _resize() {
    _width = window.innerWidth || 1920;
    _height = window.innerHeight || 1080;
    _canvas.width = _width;
    _canvas.height = _height;
  }

  function _seed() {
    _stars = [];
    for (var i = 0; i < 220; i++) {
      _stars.push({
        x: Math.random() * _width,
        y: Math.random() * _height,
        z: 0.25 + Math.random() * 1.4,
        size: 0.6 + Math.random() * 2.4,
        drift: 0.08 + Math.random() * 0.45,
        alpha: 0.22 + Math.random() * 0.74,
      });
    }

    _rings = [
      { x: _width * 0.77, y: _height * 0.38, r: 190, tilt: -0.34, speed: 0.00012 },
      { x: _width * 0.22, y: _height * 0.72, r: 310, tilt: 0.2, speed: -0.00007 },
    ];
  }

  function _animate(time) {
    _draw(time || 0);
    _raf = requestAnimationFrame(_animate);
  }

  function _draw(time) {
    var gradient = _ctx.createLinearGradient(0, 0, _width, _height);
    gradient.addColorStop(0, '#03040b');
    gradient.addColorStop(0.48, '#07162a');
    gradient.addColorStop(1, '#210d33');
    _ctx.fillStyle = gradient;
    _ctx.fillRect(0, 0, _width, _height);

    _drawNebula(_width * 0.68, _height * 0.22, 560, 'rgba(95, 202, 255, 0.16)');
    _drawNebula(_width * 0.28, _height * 0.78, 620, 'rgba(178, 93, 255, 0.14)');
    _drawNebula(_width * 0.86, _height * 0.74, 360, 'rgba(255, 209, 102, 0.1)');

    _ctx.save();
    _ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < _stars.length; i++) {
      var s = _stars[i];
      s.x -= s.drift * s.z;
      s.y += Math.sin((time * 0.0003) + s.x) * 0.012;
      if (s.x < -10) s.x = _width + 10;
      _ctx.fillStyle = 'rgba(235, 249, 255, ' + s.alpha + ')';
      _ctx.beginPath();
      _ctx.arc(s.x, s.y, s.size * s.z, 0, Math.PI * 2);
      _ctx.fill();
    }
    _ctx.restore();

    _drawPlanet(time);
    _drawRings(time);
    _drawGrid(time);
  }

  function _drawNebula(x, y, radius, color) {
    var g = _ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    _ctx.fillStyle = g;
    _ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function _drawPlanet(time) {
    var x = _width * 0.79;
    var y = _height * 0.46;
    var r = 138;
    var g = _ctx.createRadialGradient(x - 42, y - 50, 12, x, y, r);
    g.addColorStop(0, '#dffbff');
    g.addColorStop(0.25, '#64e6ff');
    g.addColorStop(0.72, '#1b5b8a');
    g.addColorStop(1, '#061321');
    _ctx.fillStyle = g;
    _ctx.beginPath();
    _ctx.arc(x, y, r, 0, Math.PI * 2);
    _ctx.fill();

    _ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    _ctx.lineWidth = 2;
    for (var i = -2; i <= 2; i++) {
      _ctx.beginPath();
      _ctx.ellipse(x, y + i * 28 + Math.sin(time * 0.0004 + i) * 3, r * 0.86, 10, -0.15, 0, Math.PI * 2);
      _ctx.stroke();
    }
  }

  function _drawRings(time) {
    _ctx.save();
    _ctx.strokeStyle = 'rgba(100, 230, 255, 0.15)';
    _ctx.lineWidth = 2;
    for (var i = 0; i < _rings.length; i++) {
      var ring = _rings[i];
      _ctx.beginPath();
      _ctx.ellipse(
        ring.x,
        ring.y,
        ring.r,
        ring.r * 0.32,
        ring.tilt + time * ring.speed,
        0,
        Math.PI * 2
      );
      _ctx.stroke();
    }
    _ctx.restore();
  }

  function _drawGrid(time) {
    var yBase = _height * 0.84;
    _ctx.save();
    _ctx.strokeStyle = 'rgba(100, 230, 255, 0.08)';
    _ctx.lineWidth = 1;
    for (var y = yBase; y < _height; y += 34) {
      _ctx.beginPath();
      _ctx.moveTo(0, y + Math.sin(time * 0.0007 + y) * 3);
      _ctx.lineTo(_width, y);
      _ctx.stroke();
    }
    for (var x = -_width; x < _width * 2; x += 120) {
      _ctx.beginPath();
      _ctx.moveTo(_width * 0.5, yBase);
      _ctx.lineTo(x, _height);
      _ctx.stroke();
    }
    _ctx.restore();
  }

  return {
    init: init,
  };
})();
