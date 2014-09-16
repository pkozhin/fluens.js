'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.fluens = {
  setUp: function (done) {
    // setup here if necessary
    done();
  },
  result_html: function (test) {
    test.expect(1);

    var actual = grunt.file.read('test/src/example/src/result.html'),
        expected = grunt.file.read('test/expected/result.html');

    test.equal(actual, expected, 'should process result.html correctly');
    test.done();
  },
  result_js: function (test) {
    test.expect(1);

    var actual = grunt.file.read('test/src/example/src/result.js'),
        expected = grunt.file.read('test/expected/result.js');

    test.equal(actual, expected, 'should process result.js correctly');
    test.done();
  },
  CommandLocator_js: function (test) {
      test.expect(1);

      var actual = grunt.file.read('test/src/example/src/command/CommandLocator.js'),
          expected = grunt.file.read('test/expected/CommandLocator.js');

      test.equal(actual, expected, 'should process result.js correctly');
      test.done();
    }
};
