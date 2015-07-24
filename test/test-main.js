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
    t.ok(oneRan, 'Function one ran.');
    t.ok(twoRan, 'Function two ran.');
    t.equal(results, 4, 'The resulting function returned 4.');
    t.end();
  });
});

test('async experiment with multiple return values', function(t) {
  var oneRan = false,
    twoRan = false,
    run;

  function one(val, callback) {
    oneRan = true;
    callback(null, val, 1 + val);
  }

  function two(val, callback) {
    twoRan = true;
    callback(null, val, 2 + val);
  }

  run = labrat('test', one, two);

  run(3, function(err, results1, results2) {
    t.error(err, 'No error while running.');
    t.ok(oneRan, 'Function one ran.');
    t.ok(twoRan, 'Function two ran.');
    t.equal(results1, 3, 'The resulting function returned 3 as the first argument');
    t.equal(results2, 4, 'The resulting function returned 4 as the second argument.');
    t.end();
  });
});

test('async experiment with publish', function(t) {
  var oneRan = false,
      twoRan = false,
      options = {},
      run;

  function one(val, callback) {
    oneRan = true;
    setTimeout(function() {
      callback(null, 1 + val);
    }, 5000);
  }

  function two(val, callback) {
    twoRan = true;
    setTimeout(function() {
      callback(null, 2 + val);
    }, 2000);
  }

  t.plan(13);

  options.publish = function(results) {
    t.ok(results, 'A results object was returned');
    t.ok(results.control, 'A control observation was returned');
    t.ok(results.control.hasOwnProperty('duration'), 'The control observation has a duration');
    t.ok(results.control.duration > 5000, 'The control duration took at least 5 seconds');
    t.deepEqual(results.control.values, [null, 4], 'The control observation has the expected results');
    t.ok(results.candidate, 'A candidate observation was returned');
    t.ok(results.candidate.hasOwnProperty('duration'), 'The candidate observation has a duration');
    t.ok(results.candidate.duration > 2000, 'The candidate duration took at least 2 seconds');
    t.deepEqual(results.candidate.values, [null, 5], 'The candidate observation has the expected results');
  };

  run = labrat('test', one, two, options);
  run(3, function(err, results) {
    t.error(err, 'No error while running.');
    t.ok(oneRan, 'Function one ran.');
    t.ok(twoRan, 'Function two ran.');
    t.equal(results, 4, 'The resulting function returned 4.');
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
  t.ok(oneRan, 'Function one ran.');
  t.ok(twoRan, 'Function two ran.');
  t.equal(result, 4, 'The resulting function returned 4.');
  t.end();
});

test('sync experiment with publish', function(t) {
  var oneRan = false,
    twoRan = false,
    options = {},
    run,
    result;

  function one(val) {
    oneRan = true;
    return 1 + val;
  }

  function two(val) {
    twoRan = true;
    return 2 + val;
  }

  t.plan(10);

  options.sync = true;
  options.publish = function(results) {
    console.dir(results);
    t.ok(results, 'A results object was returned');
    t.ok(results.control, 'A control observation was returned');
    t.ok(results.control.hasOwnProperty('duration'), 'The control observation has a duration');
    t.deepEqual(results.control.values, 4, 'The control observation has the expected results');
    t.ok(results.candidate, 'A candidate observation was returned');
    t.ok(results.candidate.hasOwnProperty('duration'), 'The candidate observation has a duration');
    t.deepEqual(results.candidate.values, 5, 'The candidate observation has the expected results');
  };

  run = labrat('test', one, two, options);
  result = run(3);
  t.ok(oneRan, 'Function one ran.');
  t.ok(twoRan, 'Function two ran.');
  t.equal(result, 4, 'The resulting function returned 4.');
});
