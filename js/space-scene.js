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
      { x: _width * 0.76, y: _height * 0.46, r: 430, tilt: -0.28, speed: 0.00006 },
      { x: _width * 0.76, y: _height * 0.46, r: 540, tilt: -0.19, speed: -0.00004 },
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

    _drawEarth(time);
    _drawOrbiter(time);
    _drawRings(time);
  }

  function _drawNebula(x, y, radius, color) {
    var g = _ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    _ctx.fillStyle = g;
    _ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function _drawEarth(time) {
    var x = _width * 0.84;
    var y = _height * 0.48;
    var r = Math.min(_width, _height) * 0.34;
    var g = _ctx.createRadialGradient(x - r * 0.34, y - r * 0.38, r * 0.05, x, y, r);
    g.addColorStop(0, '#eef4ef');
    g.addColorStop(0.18, '#b6c7b1');
    g.addColorStop(0.42, '#49674f');
    g.addColorStop(0.62, '#263b42');
    g.addColorStop(0.82, '#111923');
    g.addColorStop(1, '#02050a');
    _ctx.fillStyle = g;
    _ctx.beginPath();
    _ctx.arc(x, y, r, 0, Math.PI * 2);
    _ctx.fill();

    _ctx.save();
    _ctx.clip();
    _ctx.globalAlpha = 0.28;
    _ctx.fillStyle = '#d7c59a';
    for (var i = 0; i < 8; i++) {
      _ctx.beginPath();
      _ctx.ellipse(
        x - r * 0.35 + i * r * 0.16 + Math.sin(time * 0.00015 + i) * 8,
        y - r * 0.24 + Math.sin(i) * r * 0.32,
        r * (0.16 + (i % 3) * 0.05),
        r * 0.045,
        -0.35 + i * 0.18,
        0,
        Math.PI * 2
      );
      _ctx.fill();
    }
    _ctx.globalAlpha = 0.22;
    _ctx.fillStyle = '#ffffff';
    for (var c = 0; c < 11; c++) {
      _ctx.beginPath();
      _ctx.ellipse(
        x - r * 0.5 + c * r * 0.12,
        y - r * 0.36 + Math.sin(time * 0.00025 + c) * r * 0.42,
        r * 0.18,
        r * 0.025,
        0.2,
        0,
        Math.PI * 2
      );
      _ctx.fill();
    }
    _ctx.restore();

    _ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    _ctx.lineWidth = 2;
    _ctx.beginPath();
    _ctx.arc(x, y, r + 1, Math.PI * 1.02, Math.PI * 1.8);
    _ctx.stroke();
  }

  function _drawOrbiter(time) {
    var x = _width * 0.63 + Math.sin(time * 0.00035) * 28;
    var y = _height * 0.52 + Math.cos(time * 0.00025) * 18;
    _ctx.save();
    _ctx.translate(x, y);
    _ctx.rotate(-0.18);
    _ctx.fillStyle = 'rgba(210, 214, 218, 0.86)';
    _ctx.fillRect(-38, -16, 76, 32);
    _ctx.fillStyle = 'rgba(44, 49, 57, 0.95)';
    _ctx.fillRect(-70, -5, 32, 10);
    _ctx.fillRect(38, -5, 32, 10);
    _ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    _ctx.strokeRect(-38, -16, 76, 32);
    _ctx.restore();
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
