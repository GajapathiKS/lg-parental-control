/**
 * Timer Module — screen time tracking, limit enforcement, warnings
 */
var Timer = (function () {
  var _interval = null;
  var _profileId = null;
  var _startTime = null;
  var _onWarning = null;
  var _onLimitReached = null;
  var _onTick = null;
  var _lastProfileId = null;
  var _milestonesFired = [];

  var TICK_MS = 60000; // check every 60 seconds

  /**
   * Start tracking time for a profile
   */
  function start(profileId, callbacks) {
    _profileId = profileId;
    _lastProfileId = profileId;
    _startTime = new Date();
    _onWarning = callbacks.onWarning || function () {};
    _onLimitReached = callbacks.onLimitReached || function () {};
    _onTick = callbacks.onTick || function () {};

    Storage.saveActiveSession({
      profileId: profileId,
      startTime: _startTime.toISOString(),
      accumulatedMinutes: Storage.getTodayUsage(profileId).minutesUsed,
      milestonesFired: [],
    });

    // Immediate check
    _tick();

    // Start interval
    _interval = setInterval(_tick, TICK_MS);
  }

  function resumeStoredSession(profileId, callbacks) {
    var session = Storage.getActiveSession();
    if (!session || session.profileId !== profileId || !session.startTime) {
      start(profileId, callbacks);
      return;
    }

    if (_interval) clearInterval(_interval);
    _profileId = profileId;
    _lastProfileId = profileId;
    _startTime = new Date(session.startTime);
    if (isNaN(_startTime.getTime())) _startTime = new Date();
    _onWarning = callbacks.onWarning || function () {};
    _onLimitReached = callbacks.onLimitReached || function () {};
    _onTick = callbacks.onTick || function () {};
    _milestonesFired = session.milestonesFired || [];

    _tick();
    _interval = setInterval(_tick, TICK_MS);
  }

  function reconcileStoredSession() {
    var session = Storage.getActiveSession();
    if (!session || !session.profileId || !session.startTime) return null;

    var start = new Date(session.startTime);
    if (isNaN(start.getTime())) {
      Storage.clearActiveSession();
      return null;
    }

    var now = new Date();
    if (_dateKey(start) !== _dateKey(now)) {
      Storage.clearActiveSession();
      return null;
    }

    var elapsedMinutes = Math.max(0, Math.floor((now - start) / 60000));
    var totalMinutes = (session.accumulatedMinutes || 0) + elapsedMinutes;
    var profile = _getProfile(session.profileId);
    if (!profile) {
      Storage.clearActiveSession();
      return null;
    }

    Storage.updateTodayUsage(session.profileId, totalMinutes);
    if (totalMinutes >= profile.dailyLimitMinutes) {
      Storage.clearActiveSession();
      return {
        profileId: session.profileId,
        profileName: profile.name,
        limitReached: true,
        minutesUsed: totalMinutes,
      };
    }

    return {
      profileId: session.profileId,
      profileName: profile.name,
      limitReached: false,
      minutesUsed: totalMinutes,
      minutesRemaining: profile.dailyLimitMinutes - totalMinutes,
    };
  }

  function _tick() {
    if (!_profileId) return;

    var now = new Date();
    var sessionMinutes = Math.floor((now - _startTime) / 60000);
    var previousMinutes = Storage.getTodayUsage(_profileId).minutesUsed;

    // If this is a resumed session, only count new time
    var session = Storage.getActiveSession();
    var baseMinutes = session ? session.accumulatedMinutes : previousMinutes;
    _milestonesFired = session && session.milestonesFired ? session.milestonesFired : _milestonesFired;
    var totalMinutes = baseMinutes + sessionMinutes;

    // Update storage
    Storage.updateTodayUsage(_profileId, totalMinutes);

    // Get profile limit
    var profile = _getProfile(_profileId);
    if (!profile) return;

    var remaining = profile.dailyLimitMinutes - totalMinutes;
    var settings = Storage.getSettings();

    // Fire tick callback with current state
    _onTick({
      profileId: _profileId,
      minutesUsed: totalMinutes,
      minutesRemaining: Math.max(0, remaining),
      limitMinutes: profile.dailyLimitMinutes,
      percentage: Math.min(100, Math.round((totalMinutes / profile.dailyLimitMinutes) * 100)),
    });

    var firedMilestone = _checkMilestones(settings, profile, sessionMinutes);

    // Warning check
    if (!firedMilestone && remaining <= settings.warningBeforeMinutes && remaining > 0) {
      _onWarning({
        minutesRemaining: remaining,
        profileName: profile.name,
        type: 'limit',
      });
    }

    // Limit reached
    if (remaining <= 0) {
      var lockedProfileId = _profileId;
      stop();
      _lastProfileId = lockedProfileId;
      _onLimitReached({
        profileName: profile.name,
        minutesUsed: totalMinutes,
      });
    }
  }

  /**
   * Stop tracking
   */
  function stop() {
    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }

    if (_profileId && _startTime) {
      var now = new Date();
      var sessionMinutes = Math.floor((now - _startTime) / 60000);
      if (sessionMinutes > 0) {
        var currentUsage = Storage.getTodayUsage(_profileId).minutesUsed;
        Storage.updateTodayUsage(_profileId, currentUsage, {
          start: _formatTime(_startTime),
          end: _formatTime(now),
        });
      }
    }

    Storage.clearActiveSession();
    if (_profileId) _lastProfileId = _profileId;
    _profileId = null;
    _startTime = null;
  }

  /**
   * Extend time for current profile (parent override)
   */
  function extendTime(extraMinutes) {
    var targetProfileId = _profileId || _lastProfileId;
    if (!targetProfileId) return false;

    var profiles = Storage.getProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === targetProfileId) {
        profiles[i].dailyLimitMinutes += extraMinutes;
        Storage.saveProfiles(profiles);

        // Restart tracking
        var callbacks = { onWarning: _onWarning, onLimitReached: _onLimitReached, onTick: _onTick };
        stop();
        start(targetProfileId, callbacks);
        return true;
      }
    }
    return false;
  }

  /**
   * Get current status without starting a timer
   */
  function getStatus(profileId) {
    var profiles = Storage.getProfiles();
    var profile = null;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === profileId) { profile = profiles[i]; break; }
    }
    if (!profile) return null;

    var usage = Storage.getTodayUsage(profileId);
    var remaining = profile.dailyLimitMinutes - usage.minutesUsed;
    var blockingRule = getBlockingRule(profileId, new Date());
    var activeSession = Storage.getActiveSession();
    var isStoredActive = !!(activeSession && activeSession.profileId === profileId);

    return {
      profileId: profileId,
      profileName: profile.name,
      minutesUsed: usage.minutesUsed,
      minutesRemaining: Math.max(0, remaining),
      limitMinutes: profile.dailyLimitMinutes,
      percentage: Math.min(100, Math.round((usage.minutesUsed / profile.dailyLimitMinutes) * 100)),
      isLimitReached: remaining <= 0,
      isActive: (_profileId === profileId && _interval !== null) || isStoredActive,
      isRunningInApp: _profileId === profileId && _interval !== null,
      hasStoredSession: isStoredActive,
      blockingRule: blockingRule,
      isBlockedByRule: !!blockingRule,
    };
  }

  function getBlockingRule(profileId, date) {
    var profiles = Storage.getProfiles();
    var profile = null;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === profileId) { profile = profiles[i]; break; }
    }
    if (!profile || !profile.rules) return null;

    for (var r = 0; r < profile.rules.length; r++) {
      var rule = profile.rules[r];
      if (rule.enabled === false) continue;
      if (rule.mode !== 'block') continue;
      if (!_isRuleActiveNow(rule, date)) continue;
      return rule;
    }
    return null;
  }

  function isRunning() {
    return _interval !== null;
  }

  function getCurrentProfileId() {
    return _profileId;
  }

  function _formatTime(date) {
    return String(date.getHours()).padStart(2, '0') + ':' +
           String(date.getMinutes()).padStart(2, '0');
  }

  function _dateKey(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function _getProfile(profileId) {
    var profiles = Storage.getProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === profileId) return profiles[i];
    }
    return null;
  }

  function _checkMilestones(settings, profile, sessionMinutes) {
    var milestones = settings.warningMilestones || [20, 40, 59];
    var fired = false;
    for (var i = 0; i < milestones.length; i++) {
      var milestone = milestones[i];
      if (sessionMinutes < milestone || _milestonesFired.indexOf(milestone) !== -1) continue;
      _milestonesFired.push(milestone);
      var session = Storage.getActiveSession();
      if (session) {
        session.milestonesFired = _milestonesFired.slice();
        Storage.saveActiveSession(session);
      }
      _onWarning({
        minutesRemaining: Math.max(0, profile.dailyLimitMinutes - Storage.getTodayUsage(_profileId).minutesUsed),
        profileName: profile.name,
        type: 'milestone',
        milestoneMinutes: milestone,
      });
      fired = true;
    }
    return fired;
  }

  function _isRuleActiveNow(rule, date) {
    var days = rule.days || [0, 1, 2, 3, 4, 5, 6];
    if (days.indexOf(date.getDay()) === -1) return false;
    var current = date.getHours() * 60 + date.getMinutes();
    var start = _minutesFromTime(rule.startTime);
    var end = _minutesFromTime(rule.endTime);
    if (start === null || end === null || start === end) return false;
    if (start < end) {
      return current >= start && current < end;
    }
    return current >= start || current < end;
  }

  function _minutesFromTime(time) {
    if (!/^\d{2}:\d{2}$/.test(time || '')) return null;
    var parts = time.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  return {
    start: start,
    resumeStoredSession: resumeStoredSession,
    reconcileStoredSession: reconcileStoredSession,
    stop: stop,
    extendTime: extendTime,
    getStatus: getStatus,
    getBlockingRule: getBlockingRule,
    isRunning: isRunning,
    getCurrentProfileId: getCurrentProfileId,
  };
})();
