/**
 * Storage Module — localStorage wrapper for parental control data
 * All keys prefixed with "pc_" to avoid conflicts with other apps
 */
var Storage = (function () {
  var KEYS = {
    SETUP_COMPLETE: 'pc_setup_complete',
    PIN_HASH: 'pc_pin_hash',
    PIN_SALT: 'pc_pin_salt',
    PROFILES: 'pc_profiles',
    USAGE_LOG: 'pc_usage_log',
    ACTIVE_SESSION: 'pc_active_session',
    SETTINGS: 'pc_settings',
    ONE_TIME_CODES: 'pc_one_time_codes',
  };

  var DEFAULT_SETTINGS = {
    warningBeforeMinutes: 5,
    allowExtension: true,
    extensionMinutes: 30,
    lockAfterLimit: true,
    theme: 'dark',
  };

  function get(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[Storage] Failed to read ' + key, e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] Failed to write ' + key, e);
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // --- Public API ---

  function isSetupComplete() {
    return get(KEYS.SETUP_COMPLETE) === true;
  }

  function markSetupComplete() {
    set(KEYS.SETUP_COMPLETE, true);
  }

  function savePinHash(hash, salt) {
    set(KEYS.PIN_HASH, hash);
    set(KEYS.PIN_SALT, salt);
  }

  function getPinHash() {
    return { hash: get(KEYS.PIN_HASH), salt: get(KEYS.PIN_SALT) };
  }

  function getProfiles() {
    return get(KEYS.PROFILES) || [];
  }

  function saveProfiles(profiles) {
    set(KEYS.PROFILES, profiles);
  }

  function addProfile(profile) {
    var profiles = getProfiles();
    profile.id = 'profile_' + Date.now();
    profiles.push(profile);
    saveProfiles(profiles);
    return profile;
  }

  function updateProfile(id, updates) {
    var profiles = getProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === id) {
        for (var key in updates) {
          profiles[i][key] = updates[key];
        }
        break;
      }
    }
    saveProfiles(profiles);
  }

  function deleteProfile(id) {
    var profiles = getProfiles().filter(function (p) { return p.id !== id; });
    saveProfiles(profiles);
  }

  function getSettings() {
    return get(KEYS.SETTINGS) || Object.assign({}, DEFAULT_SETTINGS);
  }

  function saveSettings(settings) {
    set(KEYS.SETTINGS, settings);
  }

  function getUsageLog() {
    return get(KEYS.USAGE_LOG) || {};
  }

  function saveUsageLog(log) {
    set(KEYS.USAGE_LOG, log);
  }

  function getTodayKey() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getTodayUsage(profileId) {
    var log = getUsageLog();
    var today = getTodayKey();
    if (!log[today] || !log[today][profileId]) {
      return { minutesUsed: 0, sessions: [] };
    }
    return log[today][profileId];
  }

  function updateTodayUsage(profileId, minutesUsed, session) {
    var log = getUsageLog();
    var today = getTodayKey();
    if (!log[today]) log[today] = {};
    if (!log[today][profileId]) {
      log[today][profileId] = { minutesUsed: 0, sessions: [] };
    }
    log[today][profileId].minutesUsed = minutesUsed;
    if (session) {
      log[today][profileId].sessions.push(session);
    }
    saveUsageLog(log);
  }

  function getActiveSession() {
    return get(KEYS.ACTIVE_SESSION);
  }

  function saveActiveSession(session) {
    set(KEYS.ACTIVE_SESSION, session);
  }

  function clearActiveSession() {
    remove(KEYS.ACTIVE_SESSION);
  }

  function getOneTimeCodes() {
    return get(KEYS.ONE_TIME_CODES) || [];
  }

  function saveOneTimeCodes(codes) {
    set(KEYS.ONE_TIME_CODES, codes);
  }

  function getUnusedOneTimeCodeCount() {
    return getOneTimeCodes().filter(function (code) { return !code.usedAt; }).length;
  }

  /**
   * Purge usage logs older than 30 days
   */
  function purgeOldLogs() {
    var log = getUsageLog();
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    var cutoffKey = cutoff.toISOString().slice(0, 10);
    var cleaned = {};
    for (var dateKey in log) {
      if (dateKey >= cutoffKey) {
        cleaned[dateKey] = log[dateKey];
      }
    }
    saveUsageLog(cleaned);
  }

  /**
   * Get usage for last N days for a profile (for weekly chart)
   */
  function getUsageHistory(profileId, days) {
    var log = getUsageLog();
    var result = [];
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      result.push({
        date: key,
        day: dayNames[d.getDay()],
        minutesUsed: (log[key] && log[key][profileId]) ? log[key][profileId].minutesUsed : 0,
      });
    }
    return result;
  }

  /**
   * Load seed data for testing
   */
  function loadSeedData() {
    // PIN: 1234
    savePinHash(
      'a]test_hash_for_seed_data', // replaced by real hash at runtime
      'test_salt_seed'
    );
    markSetupComplete();

    saveProfiles([
      { id: 'profile_1', name: 'Riya', avatar: '🐻', type: 'child', dailyLimitMinutes: 120, isActive: true },
      { id: 'profile_2', name: 'Arjun', avatar: '🚀', type: 'child', dailyLimitMinutes: 90, isActive: true },
    ]);

    saveSettings(Object.assign({}, DEFAULT_SETTINGS));

    // 3 days of realistic usage
    var log = {};
    var today = getTodayKey();
    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yKey = yesterday.toISOString().slice(0, 10);
    var dayBefore = new Date(); dayBefore.setDate(dayBefore.getDate() - 2);
    var dbKey = dayBefore.toISOString().slice(0, 10);

    log[today] = {
      profile_1: { minutesUsed: 45, sessions: [{ start: '09:00', end: '09:45' }] },
      profile_2: { minutesUsed: 0, sessions: [] },
    };
    log[yKey] = {
      profile_1: { minutesUsed: 120, sessions: [{ start: '10:00', end: '11:30' }, { start: '16:00', end: '16:30' }] },
      profile_2: { minutesUsed: 85, sessions: [{ start: '14:00', end: '15:25' }] },
    };
    log[dbKey] = {
      profile_1: { minutesUsed: 90, sessions: [{ start: '09:00', end: '10:30' }] },
      profile_2: { minutesUsed: 60, sessions: [{ start: '17:00', end: '18:00' }] },
    };
    saveUsageLog(log);
  }

  /**
   * Reset all data
   */
  function resetAll() {
    Object.keys(KEYS).forEach(function (k) { remove(KEYS[k]); });
  }

  return {
    KEYS: KEYS,
    isSetupComplete: isSetupComplete,
    markSetupComplete: markSetupComplete,
    savePinHash: savePinHash,
    getPinHash: getPinHash,
    getProfiles: getProfiles,
    saveProfiles: saveProfiles,
    addProfile: addProfile,
    updateProfile: updateProfile,
    deleteProfile: deleteProfile,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getUsageLog: getUsageLog,
    saveUsageLog: saveUsageLog,
    getTodayUsage: getTodayUsage,
    updateTodayUsage: updateTodayUsage,
    getActiveSession: getActiveSession,
    saveActiveSession: saveActiveSession,
    clearActiveSession: clearActiveSession,
    getOneTimeCodes: getOneTimeCodes,
    saveOneTimeCodes: saveOneTimeCodes,
    getUnusedOneTimeCodeCount: getUnusedOneTimeCodeCount,
    getUsageHistory: getUsageHistory,
    purgeOldLogs: purgeOldLogs,
    loadSeedData: loadSeedData,
    resetAll: resetAll,
  };
})();
