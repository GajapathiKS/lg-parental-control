/**
 * UI Components — reusable rendering functions
 */
var Components = (function () {

  var AVATARS = [
    { id: 'bear', emoji: '🐻' },
    { id: 'rocket', emoji: '🚀' },
    { id: 'star', emoji: '⭐' },
    { id: 'dino', emoji: '🦕' },
    { id: 'rainbow', emoji: '🌈' },
    { id: 'robot', emoji: '🤖' },
    { id: 'cat', emoji: '🐱' },
    { id: 'fish', emoji: '🐠' },
  ];

  function getAvatarEmoji(id) {
    for (var i = 0; i < AVATARS.length; i++) {
      if (AVATARS[i].id === id) return AVATARS[i].emoji;
    }
    return '👤';
  }

  /**
   * Render a number pad for PIN entry
   * @param {function} onDigit - called with digit string ('0'-'9')
   * @param {function} onClear - called when clear is pressed
   * @param {function} onSubmit - called when OK is pressed
   */
  function renderNumpad(onDigit, onClear, onSubmit) {
    var keys = ['1','2','3','4','5','6','7','8','9','CLR','0','OK'];
    var html = '<div class="numpad">';
    keys.forEach(function (key) {
      var cls = 'numpad-key focusable';
      if (key === 'CLR' || key === 'OK') cls += ' wide';
      html += '<button class="' + cls + '" data-key="' + key + '" tabindex="0">' + key + '</button>';
    });
    html += '</div>';
    return html;
  }

  function attachNumpadListeners(container, onDigit, onClear, onSubmit) {
    var keys = container.querySelectorAll('.numpad-key');
    keys.forEach(function (key) {
      key.addEventListener('click', function () {
        var val = this.getAttribute('data-key');
        if (val === 'CLR') onClear();
        else if (val === 'OK') onSubmit();
        else onDigit(val);
      });
    });
  }

  /**
   * Render PIN dots display
   */
  function renderPinDots(length, filled) {
    var html = '<div class="pin-display">';
    for (var i = 0; i < length; i++) {
      html += '<div class="pin-dot ' + (i < filled ? 'filled' : '') + '"></div>';
    }
    html += '</div>';
    return html;
  }

  /**
   * Render a progress bar
   */
  function renderProgressBar(percentage) {
    var cls = 'safe';
    if (percentage >= 90) cls = 'danger';
    else if (percentage >= 70) cls = 'warning';

    return '<div class="progress-bar">' +
      '<div class="progress-bar-fill ' + cls + '" style="width: ' + percentage + '%;"></div>' +
      '</div>';
  }

  /**
   * Render profile card
   */
  function renderProfileCard(profile, onClick) {
    var status = Timer.getStatus(profile.id);
    var remaining = status ? status.minutesRemaining : profile.dailyLimitMinutes;
    var html = '<div class="profile-card focusable" tabindex="0" data-profile-id="' + profile.id + '">' +
      '<div class="profile-avatar">' + getAvatarEmoji(profile.avatar) + '</div>' +
      '<div class="profile-name">' + _escapeHtml(profile.name) + '</div>' +
      '<div class="profile-limit">' + remaining + ' min left today</div>' +
      '</div>';
    return html;
  }

  /**
   * Render time display (mm:ss or Xh Ym format)
   */
  function renderTimeDisplay(minutes, label) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    var timeStr = h > 0 ? h + 'h ' + m + 'm' : m + 'm';
    var cls = 'time-display';
    if (minutes <= 5) cls += ' danger';
    else if (minutes <= 15) cls += ' warning';

    return '<div class="' + cls + '">' + timeStr + '</div>' +
      (label ? '<div class="time-label">' + _escapeHtml(label) + '</div>' : '');
  }

  /**
   * Render weekly bar chart
   */
  function renderWeeklyChart(profileId, limitMinutes) {
    var history = Storage.getUsageHistory(profileId, 7);
    var maxVal = Math.max(limitMinutes, Math.max.apply(null, history.map(function (d) { return d.minutesUsed; })));

    var html = '<div class="chart-container">';
    history.forEach(function (day) {
      var height = maxVal > 0 ? Math.round((day.minutesUsed / maxVal) * 250) : 0;
      var barCls = day.minutesUsed > limitMinutes ? 'over-limit' : '';
      html += '<div class="chart-bar-wrapper">' +
        '<div class="chart-value">' + day.minutesUsed + 'm</div>' +
        '<div class="chart-bar ' + barCls + '" style="height: ' + Math.max(4, height) + 'px;"></div>' +
        '<div class="chart-label">' + day.day + '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  /**
   * Render avatar selection grid
   */
  function renderAvatarGrid(selectedId) {
    var html = '<div class="avatar-grid">';
    AVATARS.forEach(function (av) {
      var cls = 'avatar-option focusable' + (av.id === selectedId ? ' selected' : '');
      html += '<button class="' + cls + '" data-avatar="' + av.id + '" tabindex="0">' + av.emoji + '</button>';
    });
    html += '</div>';
    return html;
  }

  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    AVATARS: AVATARS,
    getAvatarEmoji: getAvatarEmoji,
    renderNumpad: renderNumpad,
    attachNumpadListeners: attachNumpadListeners,
    renderPinDots: renderPinDots,
    renderProgressBar: renderProgressBar,
    renderProfileCard: renderProfileCard,
    renderTimeDisplay: renderTimeDisplay,
    renderWeeklyChart: renderWeeklyChart,
    renderAvatarGrid: renderAvatarGrid,
  };
})();
