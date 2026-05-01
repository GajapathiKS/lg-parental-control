/**
 * Navigation Module — D-pad focus management for TV remote
 * Handles: arrow keys (up/down/left/right), enter, back
 */
var Navigation = (function () {
  var _onBack = null;

  function init() {
    document.addEventListener('keydown', _handleKeyDown);
  }

  function _handleKeyDown(e) {
    var key = e.keyCode;

    switch (key) {
      case 37: // Left
        _moveFocus('left');
        e.preventDefault();
        break;
      case 38: // Up
        _moveFocus('up');
        e.preventDefault();
        break;
      case 39: // Right
        _moveFocus('right');
        e.preventDefault();
        break;
      case 40: // Down
        _moveFocus('down');
        e.preventDefault();
        break;
      case 13: // Enter / OK
        _activateFocused();
        e.preventDefault();
        break;
      case 461: // webOS Back button
      case 8:   // Backspace (browser fallback)
        if (_onBack) _onBack();
        e.preventDefault();
        break;
    }
  }

  /**
   * Move focus in a direction within the current screen
   */
  function _moveFocus(direction) {
    var current = document.activeElement;
    var focusables = _getVisibleFocusables();

    if (focusables.length === 0) return;

    // If nothing focused yet, focus the first element
    if (!current || !current.classList.contains('focusable')) {
      focusables[0].focus();
      return;
    }

    var currentRect = current.getBoundingClientRect();
    var best = null;
    var bestDist = Infinity;

    for (var i = 0; i < focusables.length; i++) {
      var el = focusables[i];
      if (el === current) continue;

      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var curCx = currentRect.left + currentRect.width / 2;
      var curCy = currentRect.top + currentRect.height / 2;

      var isInDirection = false;
      switch (direction) {
        case 'up':    isInDirection = cy < curCy - 5; break;
        case 'down':  isInDirection = cy > curCy + 5; break;
        case 'left':  isInDirection = cx < curCx - 5; break;
        case 'right': isInDirection = cx > curCx + 5; break;
      }

      if (!isInDirection) continue;

      // Distance calculation — prefer elements in the same row/column
      var dx = cx - curCx;
      var dy = cy - curCy;
      var dist;
      if (direction === 'up' || direction === 'down') {
        dist = Math.abs(dy) + Math.abs(dx) * 0.3; // slight penalty for horizontal offset
      } else {
        dist = Math.abs(dx) + Math.abs(dy) * 0.3;
      }

      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    }

    if (best) best.focus();
  }

  function _activateFocused() {
    var current = document.activeElement;
    if (current && current.classList.contains('focusable')) {
      current.click();
    }
  }

  function _getVisibleFocusables() {
    var all = document.querySelectorAll('.focusable');
    var visible = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].offsetParent !== null && !all[i].closest('.hidden')) {
        visible.push(all[i]);
      }
    }
    return visible;
  }

  /**
   * Set focus on the first focusable element in a container
   */
  function focusFirst(container) {
    var el = (container || document).querySelector('.focusable');
    if (el) {
      // Small delay to let the DOM settle after screen switch
      setTimeout(function () { el.focus(); }, 50);
    }
  }

  /**
   * Set the back button handler
   */
  function onBack(callback) {
    _onBack = callback;
  }

  return {
    init: init,
    focusFirst: focusFirst,
    onBack: onBack,
  };
})();
