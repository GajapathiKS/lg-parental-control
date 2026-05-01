/**
 * PIN Module — SHA-256 hashing, salt generation, verification
 * Uses Web Crypto API (available in webOS browser engine)
 */
var Pin = (function () {
  var DAILY_ADMIN_CODES = [
    '814239', '527604', '936185', '240713', '681952', '395806', '752491', '168530',
    '409267', '823145', '571928', '046381', '692734', '315870', '784206', '209463',
    '638751', '951027', '472690', '806314', '193582', '560749', '724018', '389625',
    '015936', '647203', '258791', '970462', '431856', '709138', '586024',
  ];

  function generateSalt() {
    var array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  async function hashPin(pin, salt) {
    var data = new TextEncoder().encode(pin + salt);
    var hashBuffer = await crypto.subtle.digest('SHA-256', data);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  /**
   * Set a new PIN (first time or change)
   * @param {string} pin - 4-6 digit string
   */
  async function setPin(pin) {
    var salt = generateSalt();
    var hash = await hashPin(pin, salt);
    Storage.savePinHash(hash, salt);
    return true;
  }

  /**
   * Verify a PIN attempt
   * @param {string} attempt - the PIN the user entered
   * @returns {Promise<boolean>}
   */
  async function verify(attempt) {
    var stored = Storage.getPinHash();
    if (!stored.hash || !stored.salt) return false;
    var attemptHash = await hashPin(attempt, stored.salt);
    return attemptHash === stored.hash;
  }

  /**
   * Generate single-use parent unlock codes.
   * The clear codes are returned once so the parent can save them separately.
   */
  async function generateOneTimeCodes(count) {
    count = count || 30;
    var plainCodes = [];
    var storedCodes = [];
    var seen = {};

    while (plainCodes.length < count) {
      var code = _generateNumericCode(6);
      if (seen[code]) continue;
      seen[code] = true;

      var salt = generateSalt();
      var hash = await hashPin(code, salt);
      plainCodes.push(code);
      storedCodes.push({
        id: 'code_' + Date.now() + '_' + plainCodes.length,
        position: plainCodes.length,
        hash: hash,
        salt: salt,
        createdAt: new Date().toISOString(),
        usedAt: null,
      });
    }

    Storage.saveOneTimeCodes(storedCodes);
    return plainCodes;
  }

  /**
   * Verify and consume a one-time unlock code.
   */
  async function verifyOneTimeCode(attempt) {
    var codes = Storage.getOneTimeCodes();
    if (!codes.length) return false;

    var currentIndex = _getCurrentOneTimeCodeIndex(codes);
    var currentCode = codes[currentIndex];
    var attemptHash = await hashPin(attempt, currentCode.salt);
    if (attemptHash !== currentCode.hash) {
      return false;
    }

    currentCode.usedAt = new Date().toISOString();

    if (currentIndex === codes.length - 1) {
      for (var i = 0; i < codes.length; i++) {
        codes[i].usedAt = null;
      }
    }

    Storage.saveOneTimeCodes(codes);
    return true;
  }

  function getOneTimeCodeProgress() {
    var codes = Storage.getOneTimeCodes();
    if (!codes.length) {
      return {
        total: 0,
        nextPosition: 0,
        used: 0,
        unused: 0,
        isGenerated: false,
      };
    }

    var currentIndex = _getCurrentOneTimeCodeIndex(codes);
    var used = 0;
    for (var i = 0; i < codes.length; i++) {
      if (codes[i].usedAt) used++;
    }

    return {
      total: codes.length,
      nextPosition: currentIndex + 1,
      used: used,
      unused: codes.length - used,
      isGenerated: true,
    };
  }

  function verifyDailyAdminCode(attempt, date) {
    var info = getDailyAdminCodeInfo(date);
    return attempt === info.code;
  }

  function getDailyAdminCodeInfo(date) {
    var targetDate = date || new Date();
    var day = targetDate.getDate();
    return {
      day: day,
      code: DAILY_ADMIN_CODES[day - 1],
      total: DAILY_ADMIN_CODES.length,
    };
  }

  async function setProfileCode(profileId, code) {
    var profiles = Storage.getProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === profileId) {
        var salt = generateSalt();
        profiles[i].launchCodeHash = await hashPin(code, salt);
        profiles[i].launchCodeSalt = salt;
        profiles[i].launchCodeUpdatedAt = new Date().toISOString();
        Storage.saveProfiles(profiles);
        return true;
      }
    }
    return false;
  }

  async function verifyProfileCode(profileId, attempt) {
    var profiles = Storage.getProfiles();
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].id === profileId) {
        if (!profiles[i].launchCodeHash || !profiles[i].launchCodeSalt) return true;
        var attemptHash = await hashPin(attempt, profiles[i].launchCodeSalt);
        return attemptHash === profiles[i].launchCodeHash;
      }
    }
    return false;
  }

  function generateShareableCode() {
    return _generateNumericCode(6);
  }

  /**
   * Check if a PIN has been set
   */
  function isSet() {
    var stored = Storage.getPinHash();
    return !!(stored.hash && stored.salt);
  }

  /**
   * Validate PIN format (4-6 digits)
   */
  function isValidFormat(pin) {
    return /^\d{4,6}$/.test(pin);
  }

  function _generateNumericCode(length) {
    var bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, function (b) { return String(b % 10); }).join('');
  }

  function _getCurrentOneTimeCodeIndex(codes) {
    for (var i = 0; i < codes.length; i++) {
      if (!codes[i].usedAt) return i;
    }
    return 0;
  }

  return {
    setPin: setPin,
    verify: verify,
    generateOneTimeCodes: generateOneTimeCodes,
    verifyOneTimeCode: verifyOneTimeCode,
    getOneTimeCodeProgress: getOneTimeCodeProgress,
    verifyDailyAdminCode: verifyDailyAdminCode,
    getDailyAdminCodeInfo: getDailyAdminCodeInfo,
    setProfileCode: setProfileCode,
    verifyProfileCode: verifyProfileCode,
    generateShareableCode: generateShareableCode,
    isSet: isSet,
    isValidFormat: isValidFormat,
  };
})();
