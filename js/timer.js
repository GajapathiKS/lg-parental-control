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
    });

    // Immediate check
    _tick();

    // Start interval
    _interval = setInterval(_tick, TICK_MS);
  }

  function _tick() {
    if (!_profileId) return;

    var now = new Date();
    var sessionMinutes = Math.floor((now - _startTime) / 60000);
    var previousMinutes = Storage.getTodayUsage(_profileId).minutesUsed;

    // If this is a resumed session, only count new time
    var session = Storage.getActiveSession();
    var baseMinutes = session ? session.accumulatedMinutes : previousMinutes;
    var totalMinutes = baseMinutes + sessionMinutes;

    // Update storage
    Storage.updateTodayUsage(_profileId, totalMinutes);

    // Get profile limit
    var profiles = Storage.getProfiles();
    var profile = null;
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === _profileId) { profile = profiles[i]; break; }
    }
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

    // Warning check
    if (remaining <= settings.warningBeforeMinutes && remaining > 0) {
      _onWarning({
        minutesRemaining: remaining,
        profileName: profile.name,
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

    return {
      profileId: profileId,
      profileName: profile.name,
      minutesUsed: usage.minutesUsed,
      minutesRemaining: Math.max(0, remaining),
      limitMinutes: profile.dailyLimitMinutes,
      percentage: Math.min(100, Math.round((usage.minutesUsed / profile.dailyLimitMinutes) * 100)),
      isLimitReached: remaining <= 0,
      isActive: _profileId === profileId && _interval !== null,
    };
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

  return {
    start: start,
    stop: stop,
    extendTime: extendTime,
    getStatus: getStatus,
    isRunning: isRunning,
    getCurrentProfileId: getCurrentProfileId,
  };
})();
