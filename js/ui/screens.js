/**
 * Screens Module — renders each screen into #screen-container
 */
var Screens = (function () {
  var _container = null;

  function init() {
    _container = document.getElementById('screen-container');
  }

  function _render(html) {
    _container.innerHTML = html;
    Navigation.focusFirst(_container);
  }

  // ─── WELCOME / SETUP ─────────────────────────────

  function showWelcome() {
    _render(
      '<div class="screen landing-screen">' +
        '<div class="top-nav">' +
          '<div class="brand-mark">ORBIT</div>' +
          '<div class="nav-links"><span>Missions</span><span>Profiles</span><span>Limits</span><span>Logs</span></div>' +
        '</div>' +
        '<div class="hero-copy">' +
          '<div class="mission-kicker red">Family mission control</div>' +
          '<div class="hero-title">Explore the<br>next horizon</div>' +
          '<div class="hero-subtitle">A cinematic control deck for screen time, launch windows, and calm TV downtime.</div>' +
          '<div class="row" style="margin-top: 34px;">' +
            '<button class="btn btn-primary btn-large focusable" tabindex="0" id="btn-start-setup">Launch Setup</button>' +
            '<button class="btn btn-ghost btn-large focusable" tabindex="0" id="btn-preview-lock">Preview Clock</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.getElementById('btn-start-setup').addEventListener('click', function () {
      App.navigate('setup-pin');
    });
    document.getElementById('btn-preview-lock').addEventListener('click', function () {
      Lockscreen.showLockscreen('Preview');
    });
  }

  function showSetupPin(isChange) {
    var title = isChange ? 'Change Your PIN' : 'Set a Parent PIN';
    var subtitle = isChange ? 'Enter your new 4-6 digit PIN' : 'This PIN protects your settings. Kids won\'t be able to change limits.';
    var pinDigits = [];

    _render(
      '<div class="screen center">' +
        '<div class="col" style="align-items: center;">' +
          '<div class="title">' + title + '</div>' +
          '<div class="subtitle" style="text-align: center;">' + subtitle + '</div>' +
          '<div id="pin-dots">' + Components.renderPinDots(6, 0) + '</div>' +
          '<div id="pin-error" style="color: var(--danger); height: 32px;"></div>' +
          Components.renderNumpad(Components.getRandomizedNumpadKeys()) +
        '</div>' +
      '</div>'
    );

    Components.attachNumpadListeners(_container,
      function onDigit(d) {
        if (pinDigits.length < 6) {
          pinDigits.push(d);
          document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, pinDigits.length);
        }
      },
      function onClear() {
        pinDigits = [];
        document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, 0);
        document.getElementById('pin-error').textContent = '';
      },
      function onSubmit() {
        var pin = pinDigits.join('');
        if (!Pin.isValidFormat(pin)) {
          document.getElementById('pin-error').textContent = 'PIN must be 4-6 digits';
          return;
        }
        // Confirm PIN
        showConfirmPin(pin, isChange);
      }
    );
  }

  function showConfirmPin(firstPin, isChange) {
    var pinDigits = [];

    _render(
      '<div class="screen center">' +
        '<div class="col" style="align-items: center;">' +
          '<div class="title">Confirm Your PIN</div>' +
          '<div class="subtitle">Enter the same PIN again</div>' +
          '<div id="pin-dots">' + Components.renderPinDots(6, 0) + '</div>' +
          '<div id="pin-error" style="color: var(--danger); height: 32px;"></div>' +
          Components.renderNumpad(Components.getRandomizedNumpadKeys()) +
        '</div>' +
      '</div>'
    );

    Components.attachNumpadListeners(_container,
      function onDigit(d) {
        if (pinDigits.length < 6) {
          pinDigits.push(d);
          document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, pinDigits.length);
        }
      },
      function onClear() {
        pinDigits = [];
        document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, 0);
        document.getElementById('pin-error').textContent = '';
      },
      async function onSubmit() {
        var confirmPin = pinDigits.join('');
        if (confirmPin !== firstPin) {
          document.getElementById('pin-error').textContent = 'PINs don\'t match. Try again.';
          pinDigits = [];
          document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, 0);
          return;
        }
        await Pin.setPin(firstPin);
        if (isChange) {
          App.navigate('parent-dashboard');
        } else {
          App.navigate('create-profile');
        }
      }
    );
  }

  // ─── PROFILE CREATION ────────────────────────────

  function showCreateProfile() {
    var selectedAvatar = 'bear';
    var name = '';
    var limit = 120;

    _render(
      '<div class="screen">' +
        '<div class="title">Create a Child Profile</div>' +
        '<div class="subtitle">Who will be using this TV?</div>' +
        '<div class="row" style="gap: 48px; margin-top: 24px;">' +
          '<div class="col" style="flex: 1;">' +
            '<div class="label">Name</div>' +
            '<input id="profile-name" class="focusable" tabindex="0" type="text" ' +
              'style="background: var(--bg-card); border: 2px solid var(--border); color: var(--text-primary); ' +
              'padding: 16px 24px; font-size: 28px; border-radius: var(--radius); width: 100%;" ' +
              'placeholder="Child\'s name" maxlength="20">' +
            '<div class="label" style="margin-top: 24px;">Daily Limit</div>' +
            '<div class="row">' +
              '<button class="btn focusable" tabindex="0" id="limit-down">−</button>' +
              '<div id="limit-display" style="font-size: 40px; min-width: 150px; text-align: center;">' + limit + ' min</div>' +
              '<button class="btn focusable" tabindex="0" id="limit-up">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="col" style="flex: 1;">' +
            '<div class="label">Avatar</div>' +
            '<div id="avatar-grid">' + Components.renderAvatarGrid(selectedAvatar) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="row" style="margin-top: auto; justify-content: flex-end; gap: 24px;">' +
          '<button class="btn btn-primary btn-large focusable" tabindex="0" id="btn-save-profile">Save Profile</button>' +
        '</div>' +
      '</div>'
    );

    // Avatar selection
    _container.querySelectorAll('.avatar-option').forEach(function (el) {
      el.addEventListener('click', function () {
        selectedAvatar = this.getAttribute('data-avatar');
        document.getElementById('avatar-grid').innerHTML = Components.renderAvatarGrid(selectedAvatar);
      });
    });

    // Limit controls
    document.getElementById('limit-down').addEventListener('click', function () {
      limit = Math.max(15, limit - 15);
      document.getElementById('limit-display').textContent = limit + ' min';
    });
    document.getElementById('limit-up').addEventListener('click', function () {
      limit = Math.min(480, limit + 15);
      document.getElementById('limit-display').textContent = limit + ' min';
    });

    // Save
    document.getElementById('btn-save-profile').addEventListener('click', function () {
      name = document.getElementById('profile-name').value.trim();
      if (!name) {
        document.getElementById('profile-name').style.borderColor = 'var(--danger)';
        return;
      }
      Storage.addProfile({
        name: name,
        avatar: selectedAvatar,
        type: 'child',
        dailyLimitMinutes: limit,
        isActive: true,
      });

      if (!Storage.isSetupComplete()) {
        Storage.markSetupComplete();
      }
      App.navigate('profile-select');
    });
  }

  // ─── PROFILE SELECTION (Home Screen) ─────────────

  function showProfileSelect() {
    var profiles = Storage.getProfiles();
    var html = '<div class="screen mission-screen">' +
      '<div class="top-nav">' +
        '<div class="brand-mark">ORBIT</div>' +
        '<div class="nav-links"><span>Mission crew</span><span>Daily windows</span><span>Parent deck</span></div>' +
      '</div>' +
      '<div class="mission-kicker red">Select active mission</div>' +
      '<div class="hero-title compact">Who is<br>watching?</div>' +
      '<div class="row profile-row">';

    profiles.forEach(function (p) {
      html += Components.renderProfileCard(p);
    });

    // Add profile button
    html += '<div class="profile-card focusable" tabindex="0" id="btn-add-profile" style="border: 2px dashed var(--border);">' +
      '<div class="profile-avatar" style="font-size: 48px;">+</div>' +
      '<div class="profile-name">Add Child</div>' +
      '</div>';

    html += '</div>' +
      '<div class="row mission-actions">' +
        '<div class="spacer"></div>' +
        '<button class="btn focusable" tabindex="0" id="btn-parent-access">Parent Settings</button>' +
      '</div>' +
      '</div>';

    _render(html);

    // Profile card clicks
    _container.querySelectorAll('.profile-card[data-profile-id]').forEach(function (card) {
      card.addEventListener('click', function () {
        var profileId = this.getAttribute('data-profile-id');
        App.navigate('child-dashboard', { profileId: profileId });
      });
    });

    // Add profile
    var addBtn = document.getElementById('btn-add-profile');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        App.navigate('create-profile');
      });
    }

    // Parent settings
    document.getElementById('btn-parent-access').addEventListener('click', function () {
      App.navigate('pin-entry', { next: 'parent-dashboard' });
    });
  }

  // ─── CHILD DASHBOARD ─────────────────────────────

  function showChildDashboard(params) {
    var status = Timer.getStatus(params.profileId);
    if (!status) { App.navigate('profile-select'); return; }

    var profile = Storage.getProfiles().find(function (p) { return p.id === params.profileId; });

    _render(
      '<div class="screen">' +
        '<div class="row">' +
          '<div style="font-size: 64px;">' + Components.getAvatarEmoji(profile.avatar) + '</div>' +
          '<div class="col" style="gap: 4px;">' +
            '<div class="title" style="margin: 0;">Hi, ' + profile.name + '!</div>' +
            '<div class="subtitle" style="margin: 0;">Here\'s your screen time for today</div>' +
          '</div>' +
        '</div>' +
        '<div class="center" style="flex: 1;">' +
          '<div class="col" style="align-items: center; gap: 24px;">' +
            '<div id="time-remaining">' +
              Components.renderTimeDisplay(status.minutesRemaining, 'remaining today') +
            '</div>' +
            '<div style="width: 500px;">' + Components.renderProgressBar(status.percentage) + '</div>' +
            '<div style="color: var(--text-muted);">' + status.minutesUsed + ' of ' + status.limitMinutes + ' minutes used</div>' +
            (status.isLimitReached
              ? '<div style="color: var(--danger); font-size: 32px; font-weight: 600;">Time\'s up for today!</div>'
              : '<button class="btn btn-primary btn-large focusable" tabindex="0" id="btn-start-watching">' +
                (status.isActive ? 'Watching...' : 'Start Watching') + '</button>'
            ) +
          '</div>' +
        '</div>' +
      '</div>'
    );

    var startBtn = document.getElementById('btn-start-watching');
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        if (!Timer.isRunning()) {
          Timer.start(params.profileId, {
            onTick: function (state) {
              var timeEl = document.getElementById('time-remaining');
              if (timeEl) {
                timeEl.innerHTML = Components.renderTimeDisplay(state.minutesRemaining, 'remaining today');
              }
            },
            onWarning: function (data) {
              Lockscreen.showWarning(data.minutesRemaining, data.profileName);
            },
            onLimitReached: function (data) {
              Lockscreen.showLockscreen(data.profileName);
            },
          });
          startBtn.textContent = 'Watching...';
          startBtn.classList.remove('btn-primary');
        }
      });
    }

    Navigation.onBack(function () {
      Timer.stop();
      App.navigate('profile-select');
    });
  }

  // ─── PIN ENTRY (reusable) ────────────────────────

  function showPinEntry(params) {
    var pinDigits = [];

    _render(
      '<div class="screen center">' +
        '<div class="col" style="align-items: center;">' +
          '<div style="font-size: 64px;">🔒</div>' +
          '<div class="title">Enter Parent PIN</div>' +
          '<div id="pin-dots">' + Components.renderPinDots(6, 0) + '</div>' +
          '<div id="pin-error" style="color: var(--danger); height: 32px;"></div>' +
          Components.renderNumpad() +
        '</div>' +
      '</div>'
    );

    Components.attachNumpadListeners(_container,
      function onDigit(d) {
        if (pinDigits.length < 6) {
          pinDigits.push(d);
          document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, pinDigits.length);
        }
      },
      function onClear() {
        pinDigits = [];
        document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, 0);
        document.getElementById('pin-error').textContent = '';
      },
      async function onSubmit() {
        var pin = pinDigits.join('');
        var valid = await Pin.verify(pin);
        if (!valid) {
          valid = await Pin.verifyOneTimeCode(pin);
        }
        if (valid) {
          App.navigate(params.next || 'parent-dashboard', params.nextParams || {});
        } else {
          document.getElementById('pin-error').textContent = 'Wrong PIN. Try again.';
          pinDigits = [];
          document.getElementById('pin-dots').innerHTML = Components.renderPinDots(6, 0);
        }
      }
    );

    Navigation.onBack(function () { App.navigate('profile-select'); });
  }

  // ─── PARENT DASHBOARD ────────────────────────────

  function showParentDashboard() {
    var profiles = Storage.getProfiles();
    var html = '<div class="screen">' +
      '<div class="row">' +
        '<div class="title">Parent Dashboard</div>' +
        '<div class="spacer"></div>' +
        '<button class="btn focusable" tabindex="0" id="btn-back-home">← Back</button>' +
      '</div>' +
      '<div class="subtitle">Today\'s screen time summary</div>';

    // Per-profile summary
    html += '<div class="row" style="gap: 32px; flex-wrap: wrap; margin-bottom: 32px;">';
    profiles.forEach(function (p) {
      var status = Timer.getStatus(p.id);
      html += '<div class="card" style="min-width: 350px;">' +
        '<div class="row" style="margin-bottom: 16px;">' +
          '<div style="font-size: 48px;">' + Components.getAvatarEmoji(p.avatar) + '</div>' +
          '<div class="col" style="gap: 2px;">' +
            '<div style="font-size: 28px; font-weight: 600;">' + p.name + '</div>' +
            '<div style="color: var(--text-muted);">' + status.minutesUsed + ' / ' + status.limitMinutes + ' min</div>' +
          '</div>' +
        '</div>' +
        Components.renderProgressBar(status.percentage) +
        '</div>';
    });
    html += '</div>';

    // Weekly chart for first profile
    if (profiles.length > 0) {
      html += '<div class="label">Weekly Usage — ' + profiles[0].name + '</div>' +
        Components.renderWeeklyChart(profiles[0].id, profiles[0].dailyLimitMinutes);
    }

    // Action buttons
    html += '<div class="row" style="margin-top: auto; gap: 24px;">' +
      '<button class="btn focusable" tabindex="0" id="btn-edit-profiles">Edit Profiles</button>' +
      '<button class="btn focusable" tabindex="0" id="btn-settings">Settings</button>' +
      '<button class="btn focusable" tabindex="0" id="btn-change-pin">Change PIN</button>' +
      '</div></div>';

    _render(html);

    document.getElementById('btn-back-home').addEventListener('click', function () { App.navigate('profile-select'); });
    document.getElementById('btn-edit-profiles').addEventListener('click', function () { App.navigate('create-profile'); });
    document.getElementById('btn-settings').addEventListener('click', function () { App.navigate('settings'); });
    document.getElementById('btn-change-pin').addEventListener('click', function () { App.navigate('setup-pin', { isChange: true }); });

    Navigation.onBack(function () { App.navigate('profile-select'); });
  }

  // ─── SETTINGS ────────────────────────────────────

  function showSettings() {
    var settings = Storage.getSettings();
    var unusedCodes = Storage.getUnusedOneTimeCodeCount();

    _render(
      '<div class="screen">' +
        '<div class="row">' +
          '<div class="title">Settings</div>' +
          '<div class="spacer"></div>' +
          '<button class="btn focusable" tabindex="0" id="btn-back">← Back</button>' +
        '</div>' +
        '<div class="col" style="gap: 32px; margin-top: 32px;">' +
          '<div class="card row">' +
            '<div class="col" style="flex: 1;"><div style="font-weight: 600;">Warning before limit</div>' +
            '<div style="color: var(--text-muted);">Show a warning X minutes before time runs out</div></div>' +
            '<div class="row">' +
              '<button class="btn focusable" tabindex="0" id="warn-down">−</button>' +
              '<div id="warn-val" style="min-width: 80px; text-align: center; font-size: 32px;">' + settings.warningBeforeMinutes + '</div>' +
              '<button class="btn focusable" tabindex="0" id="warn-up">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="card row">' +
            '<div class="col" style="flex: 1;"><div style="font-weight: 600;">Extension amount</div>' +
            '<div style="color: var(--text-muted);">How many minutes to add when parent extends</div></div>' +
            '<div class="row">' +
              '<button class="btn focusable" tabindex="0" id="ext-down">−</button>' +
              '<div id="ext-val" style="min-width: 80px; text-align: center; font-size: 32px;">' + settings.extensionMinutes + '</div>' +
              '<button class="btn focusable" tabindex="0" id="ext-up">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="card row">' +
            '<div class="col" style="flex: 1;"><div style="font-weight: 600;">One-time TV passwords</div>' +
            '<div style="color: var(--text-muted);">' + unusedCodes + ' unused codes available. Each code works once.</div></div>' +
            '<button class="btn focusable" tabindex="0" id="btn-generate-codes">Generate 30</button>' +
          '</div>' +
          '<button class="btn btn-danger focusable" tabindex="0" id="btn-reset" style="align-self: flex-start;">Reset All Data</button>' +
        '</div>' +
      '</div>'
    );

    document.getElementById('warn-down').addEventListener('click', function () {
      settings.warningBeforeMinutes = Math.max(1, settings.warningBeforeMinutes - 1);
      document.getElementById('warn-val').textContent = settings.warningBeforeMinutes;
      Storage.saveSettings(settings);
    });
    document.getElementById('warn-up').addEventListener('click', function () {
      settings.warningBeforeMinutes = Math.min(30, settings.warningBeforeMinutes + 1);
      document.getElementById('warn-val').textContent = settings.warningBeforeMinutes;
      Storage.saveSettings(settings);
    });
    document.getElementById('ext-down').addEventListener('click', function () {
      settings.extensionMinutes = Math.max(5, settings.extensionMinutes - 5);
      document.getElementById('ext-val').textContent = settings.extensionMinutes;
      Storage.saveSettings(settings);
    });
    document.getElementById('ext-up').addEventListener('click', function () {
      settings.extensionMinutes = Math.min(120, settings.extensionMinutes + 5);
      document.getElementById('ext-val').textContent = settings.extensionMinutes;
      Storage.saveSettings(settings);
    });
    document.getElementById('btn-reset').addEventListener('click', function () {
      Storage.resetAll();
      App.navigate('welcome');
    });
    document.getElementById('btn-generate-codes').addEventListener('click', async function () {
      var codes = await Pin.generateOneTimeCodes(30);
      showOneTimeCodes(codes);
    });
    document.getElementById('btn-back').addEventListener('click', function () { App.navigate('parent-dashboard'); });
    Navigation.onBack(function () { App.navigate('parent-dashboard'); });
  }

  function showOneTimeCodes(codes) {
    var overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
    overlay.innerHTML =
      '<div class="modal" style="min-width: 760px;">' +
        '<div class="title">One-time TV passwords</div>' +
        '<div class="subtitle">These 30 codes are shown once. After a code unlocks parent access, it is consumed.</div>' +
        '<textarea readonly class="focusable" tabindex="0" style="width: 100%; height: 260px; resize: none; font-size: 28px; line-height: 1.5; padding: 20px; color: var(--text-primary); background: var(--bg-primary); border: 2px solid var(--border); border-radius: var(--radius);">' +
          codes.map(function (code, index) {
            return String(index + 1).padStart(2, '0') + '. ' + code;
          }).join('\\n') +
        '</textarea>' +
        '<div class="row" style="justify-content: flex-end; margin-top: 24px;">' +
          '<button class="btn btn-primary focusable" tabindex="0" id="btn-close-codes">Done</button>' +
        '</div>' +
      '</div>';

    document.getElementById('btn-close-codes').addEventListener('click', function () {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      App.navigate('settings');
    });
    Navigation.focusFirst(overlay);
  }

  return {
    init: init,
    showWelcome: showWelcome,
    showSetupPin: showSetupPin,
    showConfirmPin: showConfirmPin,
    showCreateProfile: showCreateProfile,
    showProfileSelect: showProfileSelect,
    showChildDashboard: showChildDashboard,
    showPinEntry: showPinEntry,
    showParentDashboard: showParentDashboard,
    showSettings: showSettings,
    showOneTimeCodes: showOneTimeCodes,
  };
})();
