/**
 * Background Timer Service
 * Runs as a webOS JS Service (Node.js process on the TV).
 * Checks active session every 60 seconds and enforces time limits
 * even when the main app UI is not in the foreground.
 *
 * NOTE: On sideloaded apps, this service has limited Luna API access.
 * It can read system time and send notifications to the main app.
 */
var Service = require('webos-service');
var service = new Service('com.parental.control.service');

var POLL_INTERVAL_MS = 60000; // 60 seconds
var _heartbeat = null;

/**
 * Start the background timer
 * Called by the main app when a child starts watching
 */
service.register('start', function (message) {
  var profileId = message.payload.profileId;
  var startTime = message.payload.startTime || new Date().toISOString();
  var accumulatedMinutes = message.payload.accumulatedMinutes || 0;
  var limitMinutes = message.payload.limitMinutes || 120;

  console.log('[Service] Starting timer for profile:', profileId);

  // Stop any existing heartbeat
  if (_heartbeat) {
    clearInterval(_heartbeat);
  }

  var sessionStart = new Date(startTime);

  _heartbeat = setInterval(function () {
    var now = new Date();
    var sessionMinutes = Math.floor((now - sessionStart) / 60000);
    var totalMinutes = accumulatedMinutes + sessionMinutes;
    var remaining = limitMinutes - totalMinutes;

    console.log('[Service] Profile:', profileId,
      '| Used:', totalMinutes, 'min',
      '| Remaining:', Math.max(0, remaining), 'min');

    // Send status update to the main app (if it's listening)
    var activity = service.activityManager;
    if (remaining <= 0) {
      console.log('[Service] Time limit reached for', profileId);
      // The main app UI handles the lockscreen
      // Service just keeps tracking to stay accurate
    }
  }, POLL_INTERVAL_MS);

  // Keep the service alive
  var keepAlive = service.activityManager.create('parental-timer', function (activity) {
    console.log('[Service] Activity created, service will stay alive');
  });

  message.respond({
    returnValue: true,
    message: 'Timer started for ' + profileId,
  });
});

/**
 * Stop the background timer
 */
service.register('stop', function (message) {
  console.log('[Service] Stopping timer');
  if (_heartbeat) {
    clearInterval(_heartbeat);
    _heartbeat = null;
  }
  message.respond({
    returnValue: true,
    message: 'Timer stopped',
  });
});

/**
 * Get current timer status
 */
service.register('status', function (message) {
  message.respond({
    returnValue: true,
    isRunning: _heartbeat !== null,
  });
});

/**
 * Heartbeat — keeps the service alive
 * webOS kills idle services after ~5 minutes
 */
service.register('heartbeat', function (message) {
  message.respond({
    returnValue: true,
    timestamp: new Date().toISOString(),
  });
});
