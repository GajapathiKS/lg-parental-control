/**
 * UI Components - reusable rendering functions
 */
var Components = (function () {

  var AVATARS = [
    { id: 'bear', label: 'Astronaut', name: 'Astronaut' },
    { id: 'rocket', label: 'Rocket', name: 'Rocket' },
    { id: 'star', label: 'Star', name: 'Star' },
    { id: 'dino', label: 'Rover', name: 'Rover' },
    { id: 'rainbow', label: 'Orbit', name: 'Orbit' },
    { id: 'robot', label: 'Probe', name: 'Probe' },
    { id: 'cat', label: 'Satellite', name: 'Satellite' },
    { id: 'fish', label: 'Comet', name: 'Comet' },
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

  function renderAvatarIcon(id, fallbackName) {
    var knownId = _knownAvatarId(id);
    if (knownId === 'crew') {
      return '<span class="avatar-initials">' + _escapeHtml(_initials(fallbackName)) + '</span>';
    }
    return '<span class="avatar-icon avatar-icon-' + knownId + '">' + _renderSpaceSvg(knownId) + '</span>';
  }

  function _renderSpaceSvg(id) {
    var paths = {
      bear: '<circle cx="32" cy="26" r="13"></circle><path d="M21 51c3-8 8-12 11-12s8 4 11 12"></path><path d="M23 26h18"></path><path d="M18 20l-7-5M46 20l7-5"></path>',
      rocket: '<path d="M34 8c10 8 11 22 4 36l-13-13C28 20 31 12 34 8z"></path><path d="M25 31l-10 3 4-12"></path><path d="M38 44l-3 10 12-4"></path><circle cx="35" cy="22" r="4"></circle><path d="M22 42l-9 9"></path>',
      star: '<path d="M32 7l7 17 18 2-14 11 4 18-15-10-15 10 4-18L7 26l18-2 7-17z"></path>',
      dino: '<path d="M13 41h31c6 0 10-4 10-9v-4"></path><path d="M20 41v8M43 41v8"></path><circle cx="50" cy="22" r="5"></circle><path d="M45 27l-8 6M21 34l-8-8"></path><path d="M18 49h10M39 49h10"></path>',
      rainbow: '<circle cx="32" cy="32" r="9"></circle><path d="M7 32c8-14 16-21 25-21s17 7 25 21"></path><path d="M13 39c6-10 12-15 19-15s13 5 19 15"></path><path d="M32 4v7M32 53v7M4 32h7M53 32h7"></path>',
      robot: '<path d="M20 20h24v24H20z"></path><path d="M32 10v10M25 10h14"></path><circle cx="27" cy="30" r="2"></circle><circle cx="37" cy="30" r="2"></circle><path d="M27 38h10"></path><path d="M16 28h4M44 28h4"></path>',
      cat: '<rect x="15" y="28" width="34" height="15" rx="3"></rect><path d="M12 43h40"></path><path d="M19 28l-6-10M45 28l6-10"></path><path d="M25 43l-5 9M39 43l5 9"></path><circle cx="53" cy="18" r="4"></circle>',
      fish: '<path d="M10 37c14-15 29-15 44-3"></path><path d="M10 37c13 3 25 8 37 17"></path><circle cx="47" cy="23" r="5"></circle><path d="M18 35l-9-9M25 31l-8-14"></path>',
    };
    return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      (paths[id] || paths.rocket) +
      '</svg>';
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
      '<div class="profile-avatar avatar-' + _escapeHtml(_knownAvatarId(avatarId)) + '">' + renderAvatarIcon(avatarId, profile.name) + '</div>' +
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
        renderAvatarIcon(av.id) + '<small>' + av.name + '</small></button>';
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
    renderAvatarIcon: renderAvatarIcon,
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
