/**
 * webOSTV.js Stub — for browser testing only
 * On a real LG TV, this file is replaced by the actual webOSTV.js library.
 * This stub provides no-op implementations so the app doesn't crash in a browser.
 */
(function () {
  if (typeof window.webOS !== 'undefined') {
    // Real webOS environment — don't override
    return;
  }

  console.info('[webOSTV Stub] Running in browser mode (not on a real TV)');

  window.webOS = {
    platform: { tv: false },

    platformBack: function () {
      console.info('[webOSTV Stub] platformBack() called — would exit app on TV');
      window.history.back();
    },

    fetchAppRootPath: function () {
      return window.location.pathname.replace(/\/[^/]*$/, '/');
    },

    fetchAppInfo: function (callback, path) {
      // Return mock app info
      callback({
        id: 'com.parental.control',
        version: '1.0.0',
        title: 'Parental Control',
      });
    },

    deviceInfo: function (callback) {
      callback({
        modelName: 'Browser Test',
        version: '0.0.0',
        versionMajor: 0,
        versionMinor: 0,
        versionDot: 0,
        sdkVersion: '0.0.0',
        screenWidth: 1920,
        screenHeight: 1080,
        uhd: false,
      });
    },

    service: {
      request: function (uri, params) {
        console.info('[webOSTV Stub] Luna service call:', uri, params.method);
        // Simulate success response
        if (params.onSuccess) {
          setTimeout(function () {
            params.onSuccess({ returnValue: true });
          }, 100);
        }
        return { cancel: function () {} };
      },
    },

    keyboard: {
      isShowing: function () { return false; },
    },
  };

  // Also mock webOSTV namespace
  window.webOSTV = window.webOS;
})();
