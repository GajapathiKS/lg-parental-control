/**
 * PIN Module Tests
 * Tests hashing, verification, and format validation
 * NOTE: Pin uses async Web Crypto API, so tests are async
 */
var TestPin = (function () {
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

  async function run() {
    console.log('═══ PIN Module Tests ═══');
    _passed = 0;
    _failed = 0;

    Storage.resetAll();

    // --- Format validation ---
    assert(Pin.isValidFormat('1234') === true, '4 digits valid');
    assert(Pin.isValidFormat('12345') === true, '5 digits valid');
    assert(Pin.isValidFormat('123456') === true, '6 digits valid');
    assert(Pin.isValidFormat('123') === false, '3 digits too short');
    assert(Pin.isValidFormat('1234567') === false, '7 digits too long');
    assert(Pin.isValidFormat('abcd') === false, 'Letters invalid');
    assert(Pin.isValidFormat('12 34') === false, 'Spaces invalid');
    assert(Pin.isValidFormat('') === false, 'Empty string invalid');

    // --- PIN not set initially ---
    assert(Pin.isSet() === false, 'No PIN set initially');

    // --- Set PIN ---
    await Pin.setPin('1234');
    assert(Pin.isSet() === true, 'PIN is set after setPin');

    // --- Verify correct PIN ---
    var correct = await Pin.verify('1234');
    assert(correct === true, 'Correct PIN verifies');

    // --- Verify wrong PIN ---
    var wrong = await Pin.verify('9999');
    assert(wrong === false, 'Wrong PIN rejected');

    var wrongLength = await Pin.verify('123');
    assert(wrongLength === false, 'Short PIN rejected');

    var empty = await Pin.verify('');
    assert(empty === false, 'Empty PIN rejected');

    // --- Change PIN ---
    await Pin.setPin('5678');
    var oldPin = await Pin.verify('1234');
    assert(oldPin === false, 'Old PIN no longer works after change');

    var newPin = await Pin.verify('5678');
    assert(newPin === true, 'New PIN works after change');

    // --- Hash uniqueness (different salts) ---
    var stored1 = Storage.getPinHash();
    await Pin.setPin('1234'); // set same PIN again
    var stored2 = Storage.getPinHash();
    assert(stored1.hash !== stored2.hash || stored1.salt !== stored2.salt,
      'Same PIN produces different hash/salt pair (randomized salt)');

    // --- One-time unlock codes ---
    var codes = await Pin.generateOneTimeCodes(30);
    assert(codes.length === 30, 'Generates 30 one-time codes');
    assert(Storage.getUnusedOneTimeCodeCount() === 30, 'All generated codes start unused');

    var firstCodeWorks = await Pin.verifyOneTimeCode(codes[0]);
    assert(firstCodeWorks === true, 'One-time code works once');
    assert(Storage.getUnusedOneTimeCodeCount() === 29, 'Used one-time code is consumed');

    var firstCodeAgain = await Pin.verifyOneTimeCode(codes[0]);
    assert(firstCodeAgain === false, 'Consumed one-time code cannot be reused');

    // --- Cleanup ---
    Storage.resetAll();

    // --- Report ---
    console.log('');
    console.log('Results: ' + _passed + ' passed, ' + _failed + ' failed');
    return { passed: _passed, failed: _failed };
  }

  return { run: run };
})();
