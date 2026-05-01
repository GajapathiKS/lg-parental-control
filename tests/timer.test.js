/**
 * Timer Module Tests
 * Tests timer logic, status reporting, and extension
 */
var TestTimer = (function () {
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
    console.log('═══ Timer Module Tests ═══');
    _passed = 0;
    _failed = 0;

    // Setup test data
    Storage.resetAll();
    Storage.markSetupComplete();
    Storage.addProfile({
      name: 'TestKid',
      avatar: 'bear',
      type: 'child',
      dailyLimitMinutes: 60,
      isActive: true,
    });
    Storage.saveSettings({
      warningBeforeMinutes: 5,
      allowExtension: true,
      extensionMinutes: 30,
      lockAfterLimit: true,
      theme: 'dark',
    });

    var profiles = Storage.getProfiles();
    var testProfileId = profiles[0].id;

    // --- Status (no active timer) ---
    var status = Timer.getStatus(testProfileId);
    assert(status !== null, 'getStatus returns object');
    assert(status.minutesUsed === 0, 'Zero minutes used initially');
    assert(status.minutesRemaining === 60, '60 minutes remaining');
    assert(status.limitMinutes === 60, 'Limit is 60 minutes');
    assert(status.percentage === 0, 'Percentage is 0');
    assert(status.isLimitReached === false, 'Limit not reached');
    assert(status.isActive === false, 'Timer not active');

    // --- Status after manual usage update ---
    Storage.updateTodayUsage(testProfileId, 45);
    status = Timer.getStatus(testProfileId);
    assert(status.minutesUsed === 45, '45 minutes used');
    assert(status.minutesRemaining === 15, '15 minutes remaining');
    assert(status.percentage === 75, 'Percentage is 75');
    assert(status.isLimitReached === false, 'Limit not yet reached');

    // --- Status at limit ---
    Storage.updateTodayUsage(testProfileId, 60);
    status = Timer.getStatus(testProfileId);
    assert(status.minutesRemaining === 0, '0 minutes remaining at limit');
    assert(status.isLimitReached === true, 'Limit reached');
    assert(status.percentage === 100, 'Percentage is 100');

    // --- Status over limit ---
    Storage.updateTodayUsage(testProfileId, 75);
    status = Timer.getStatus(testProfileId);
    assert(status.minutesRemaining === 0, 'Remaining capped at 0');
    assert(status.percentage === 100, 'Percentage capped at 100');

    // --- Timer start/stop ---
    Storage.updateTodayUsage(testProfileId, 0); // reset usage
    assert(Timer.isRunning() === false, 'Timer not running before start');

    var tickCount = 0;
    var warningFired = false;
    var limitFired = false;

    Timer.start(testProfileId, {
      onTick: function () { tickCount++; },
      onWarning: function () { warningFired = true; },
      onLimitReached: function () { limitFired = true; },
    });

    assert(Timer.isRunning() === true, 'Timer running after start');
    assert(Timer.getCurrentProfileId() === testProfileId, 'Correct profile tracked');

    // Active session should be saved
    var session = Storage.getActiveSession();
    assert(session !== null, 'Active session saved on start');
    assert(session.profileId === testProfileId, 'Session has correct profile');

    Timer.stop();
    assert(Timer.isRunning() === false, 'Timer stopped');
    assert(Storage.getActiveSession() === null, 'Active session cleared on stop');

    // --- Extension ---
    Storage.updateTodayUsage(testProfileId, 0); // reset
    Timer.start(testProfileId, {
      onTick: function () {},
      onWarning: function () {},
      onLimitReached: function () {},
    });

    var beforeLimit = Storage.getProfiles().find(function (p) { return p.id === testProfileId; }).dailyLimitMinutes;
    Timer.extendTime(30);
    var afterLimit = Storage.getProfiles().find(function (p) { return p.id === testProfileId; }).dailyLimitMinutes;
    assert(afterLimit === beforeLimit + 30, 'Extension adds 30 minutes to limit');

    Timer.stop();

    // --- Invalid profile ---
    var badStatus = Timer.getStatus('nonexistent_profile');
    assert(badStatus === null, 'Null status for nonexistent profile');

    // --- Cleanup ---
    Storage.resetAll();

    // --- Report ---
    console.log('');
    console.log('Results: ' + _passed + ' passed, ' + _failed + ' failed');
    return { passed: _passed, failed: _failed };
  }

  return { run: run };
})();
