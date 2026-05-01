/**
 * Storage Module Tests
 * Run in browser console or with a test runner
 * Usage: open index.html in browser, paste this in console, or load via script tag
 */
var TestStorage = (function () {
  var _passed = 0;
  var _failed = 0;

  function assert(condition, testName) {
    if (condition) {
      _passed++;
      console.log('  ✓ ' + testName);
    } else {
      _failed++;
      console.error('  ✗ ' + testName);
    }
  }

  function run() {
    console.log('═══ Storage Module Tests ═══');
    _passed = 0;
    _failed = 0;

    // Clean slate
    Storage.resetAll();

    // --- Setup ---
    assert(Storage.isSetupComplete() === false, 'Setup not complete initially');
    Storage.markSetupComplete();
    assert(Storage.isSetupComplete() === true, 'Setup marked complete');

    // --- Profiles ---
    assert(Storage.getProfiles().length === 0, 'No profiles initially');

    var p1 = Storage.addProfile({
      name: 'TestChild',
      avatar: 'bear',
      type: 'child',
      dailyLimitMinutes: 60,
      isActive: true,
    });
    assert(p1.id !== undefined, 'Profile gets an ID');
    assert(Storage.getProfiles().length === 1, 'One profile after add');
    assert(Storage.getProfiles()[0].name === 'TestChild', 'Profile name saved correctly');

    var p2 = Storage.addProfile({
      name: 'SecondChild',
      avatar: 'rocket',
      type: 'child',
      dailyLimitMinutes: 90,
      isActive: true,
    });
    assert(Storage.getProfiles().length === 2, 'Two profiles after second add');

    Storage.updateProfile(p1.id, { dailyLimitMinutes: 120 });
    var updated = Storage.getProfiles().find(function (p) { return p.id === p1.id; });
    assert(updated.dailyLimitMinutes === 120, 'Profile limit updated');

    Storage.deleteProfile(p2.id);
    assert(Storage.getProfiles().length === 1, 'One profile after delete');

    // --- Settings ---
    var settings = Storage.getSettings();
    assert(settings.warningBeforeMinutes === 5, 'Default warning minutes');
    assert(settings.extensionMinutes === 30, 'Default extension minutes');
    assert(settings.theme === 'dark', 'Default theme is dark');

    settings.warningBeforeMinutes = 10;
    Storage.saveSettings(settings);
    assert(Storage.getSettings().warningBeforeMinutes === 10, 'Settings saved');

    // --- Usage Log ---
    var usage = Storage.getTodayUsage(p1.id);
    assert(usage.minutesUsed === 0, 'Zero usage initially');
    assert(usage.sessions.length === 0, 'No sessions initially');

    Storage.updateTodayUsage(p1.id, 45);
    assert(Storage.getTodayUsage(p1.id).minutesUsed === 45, 'Usage updated to 45');

    Storage.updateTodayUsage(p1.id, 45, { start: '09:00', end: '09:45' });
    assert(Storage.getTodayUsage(p1.id).sessions.length === 1, 'Session logged');

    // --- Usage History ---
    var history = Storage.getUsageHistory(p1.id, 7);
    assert(history.length === 7, 'History returns 7 days');
    assert(history[6].minutesUsed === 45, 'Today shows 45 minutes in history');

    // --- Active Session ---
    assert(Storage.getActiveSession() === null, 'No active session initially');
    Storage.saveActiveSession({ profileId: p1.id, startTime: new Date().toISOString(), accumulatedMinutes: 0 });
    assert(Storage.getActiveSession() !== null, 'Active session saved');
    assert(Storage.getActiveSession().profileId === p1.id, 'Active session has correct profile');
    Storage.clearActiveSession();
    assert(Storage.getActiveSession() === null, 'Active session cleared');

    // --- Seed Data ---
    Storage.resetAll();
    Storage.loadSeedData();
    assert(Storage.isSetupComplete() === true, 'Seed data marks setup complete');
    assert(Storage.getProfiles().length === 2, 'Seed data creates 2 profiles');
    assert(Storage.getProfiles()[0].name === 'Riya', 'Seed profile 1 is Riya');
    assert(Storage.getProfiles()[1].name === 'Arjun', 'Seed profile 2 is Arjun');
    assert(Storage.getProfiles()[0].rules[0].startTime === '18:30', 'Seed profile gets 6:30 PM bedtime block');

    Storage.ensureDefaultBedtimeRule();
    assert(Storage.getProfiles()[0].rules.length === 1, 'Bedtime block is not duplicated');

    // --- Purge ---
    // Add old entry manually
    var log = Storage.getUsageLog() || {};
    log['2020-01-01'] = { profile_1: { minutesUsed: 100, sessions: [] } };
    Storage.saveUsageLog(log);
    Storage.purgeOldLogs();
    var purgedLog = Storage.getUsageLog();
    assert(!purgedLog['2020-01-01'], 'Old log entry purged');

    // --- Cleanup ---
    Storage.resetAll();

    // --- Report ---
    console.log('');
    console.log('Results: ' + _passed + ' passed, ' + _failed + ' failed');
    return { passed: _passed, failed: _failed };
  }

  return { run: run };
})();
