/**
 * UI Components - reusable rendering functions
 */
var Components = (function () {

  var AVATARS = [
    { id: 'bear', label: 'BE', name: 'Bear' },
    { id: 'rocket', label: 'RK', name: 'Rocket' },
    { id: 'star', label: 'ST', name: 'Star' },
    { id: 'dino', label: 'DN', name: 'Dino' },
    { id: 'rainbow', label: 'RB', name: 'Rainbow' },
    { id: 'robot', label: 'RO', name: 'Robot' },
    { id: 'cat', label: 'CT', name: 'Cat' },
    { id: 'fish', label: 'FS', name: 'Fish' },
  ];

  function getAvatarEmoji(id, fallbackName) {
    return getAvatarLabel(id, fallbackName);
  }

  function getAvatarLabel(id, fallbackName) {
    for (var i = 0; i < AVATARS.length; i++) {
      if (AVATARS[i].id === id) return AVATARS[i].label;
    }
    if (fallbackName) return _initials(fallbackName);
    return 'CR';
  }

  function renderNumpad(keys) {
    keys = keys || ['1','2','3','4','5','6','7','8','9','CLR','0','OK'];
    var html = '<div class="numpad">';
    keys.forEach(function (key) {
      var cls = 'numpad-key focusable';
      if (key === 'CLR' || key === 'OK') cls += ' wide';
      html += '<button class="' + cls + '" data-key="' + key + '" tabindex="0">' + key + '</button>';
    });
    html += '</div>';
    return html;
  }

  function getRandomizedNumpadKeys() {
    var digits = ['0','1','2','3','4','5','6','7','8','9'];
    for (var i = digits.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = digits[i];
      digits[i] = digits[j];
      digits[j] = tmp;
    }
    return digits.slice(0, 9).concat(['CLR', digits[9], 'OK']);
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

  function renderPinDots(length, filled) {
    var html = '<div class="pin-display">';
    for (var i = 0; i < length; i++) {
      html += '<div class="pin-dot ' + (i < filled ? 'filled' : '') + '"></div>';
    }
    html += '</div>';
    return html;
  }

  function renderProgressBar(percentage) {
    var cls = 'safe';
    if (percentage >= 90) cls = 'danger';
    else if (percentage >= 70) cls = 'warning';

    return '<div class="progress-bar">' +
      '<div class="progress-bar-fill ' + cls + '" style="width: ' + percentage + '%;"></div>' +
      '</div>';
  }

  function renderProfileCard(profile) {
    var status = Timer.getStatus(profile.id);
    var remaining = status ? status.minutesRemaining : profile.dailyLimitMinutes;
    var avatarId = profile.avatar || 'crew';
    var html = '<div class="profile-card focusable" tabindex="0" data-profile-id="' + profile.id + '">' +
      '<div class="profile-avatar avatar-' + _escapeHtml(_knownAvatarId(avatarId)) + '">' + getAvatarLabel(avatarId, profile.name) + '</div>' +
      '<div class="profile-name">' + _escapeHtml(profile.name) + '</div>' +
      '<div class="profile-limit">' + remaining + ' min left today</div>' +
      '</div>';
    return html;
  }

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

  function renderAvatarGrid(selectedId) {
    var html = '<div class="avatar-grid">';
    AVATARS.forEach(function (av) {
      var cls = 'avatar-option focusable' + (av.id === selectedId ? ' selected' : '');
      html += '<button class="' + cls + ' avatar-' + av.id + '" data-avatar="' + av.id + '" tabindex="0">' +
        '<span>' + av.label + '</span><small>' + av.name + '</small></button>';
    });
    html += '</div>';
    return html;
  }

  function _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function _knownAvatarId(id) {
    for (var i = 0; i < AVATARS.length; i++) {
      if (AVATARS[i].id === id) return id;
    }
    return 'crew';
  }

  function _initials(name) {
    var parts = String(name || 'Crew').trim().split(/\s+/);
    var first = parts[0] ? parts[0].charAt(0) : 'C';
    var second = parts.length > 1 ? parts[1].charAt(0) : (parts[0] && parts[0].length > 1 ? parts[0].charAt(1) : 'R');
    return (first + second).toUpperCase();
  }

  return {
    AVATARS: AVATARS,
    getAvatarEmoji: getAvatarEmoji,
    getAvatarLabel: getAvatarLabel,
    renderNumpad: renderNumpad,
    getRandomizedNumpadKeys: getRandomizedNumpadKeys,
    attachNumpadListeners: attachNumpadListeners,
    renderPinDots: renderPinDots,
    renderProgressBar: renderProgressBar,
    renderProfileCard: renderProfileCard,
    renderTimeDisplay: renderTimeDisplay,
    renderWeeklyChart: renderWeeklyChart,
    renderAvatarGrid: renderAvatarGrid,
  };
})();
