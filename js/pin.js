/**
 * PIN Module — SHA-256 hashing, salt generation, verification
 * Uses Web Crypto API (available in webOS browser engine)
 */
var Pin = (function () {

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
    isSet: isSet,
    isValidFormat: isValidFormat,
  };
})();
