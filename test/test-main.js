var test = require('tape');
var labrat = require('../index');

test('async experiment', function(t) {
  var oneRan = false,
      twoRan = false;

  function one(val, callback) {
    oneRan = true;
    callback(null, 1 + val);
  }

  function two(val, callback) {
    twoRan = true;
    callback(null, 2 + val);
  }

  var run = labrat('test', one, two);

  run(3, function(err, results) {
    t.error(err, 'No error while running.');
    t.ok(oneRan, "Function one ran.");
    t.ok(twoRan, "Function two ran.");
    t.equal(results, 4, 'The resulting function returned 4.');
    t.end();
  });

});

test('sync experiment', function(t) {
  var oneRan = false,
      twoRan = false,
      result;

  function one(val) {
    oneRan = true;
    return 1 + val;
  }

  function two(val) {
    twoRan = true;
    return 2 + val;
  }

  var run = labrat('test', one, two, {sync: true});

  result = run(3);
  t.ok(oneRan, "Function one ran.");
  t.ok(twoRan, "Function two ran.");
  t.equal(result, 4, 'The resulting function returned 4.');
  t.end();
});