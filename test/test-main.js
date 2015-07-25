var test = require('tape');
var through2 = require('through2');

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
    publishStream,
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

  t.plan(15);

  publishStream = through2.obj();

  publishStream.on('data', function(chunk) {
    t.ok(chunk, 'A results object was returned');
    t.equal(chunk.name, 'test', 'The experiment name was properly set.');
    t.ok(chunk.hasOwnProperty('id'), 'The experiment was assigned an id');
    t.ok(chunk.control, 'A control observation was returned');
    t.ok(chunk.control.hasOwnProperty('duration'), 'The control observation has a duration');
    t.ok(chunk.control.duration > 5000, 'The control duration took at least 5 seconds');
    t.deepEqual(chunk.control.values, [null, 4], 'The control observation has the expected results');
    t.ok(chunk.candidate, 'A candidate observation was returned');
    t.ok(chunk.candidate.hasOwnProperty('duration'), 'The candidate observation has a duration');
    t.ok(chunk.candidate.duration > 2000, 'The candidate duration took at least 2 seconds');
    t.deepEqual(chunk.candidate.values, [null, 5], 'The candidate observation has the expected results');
  });

  run = labrat('test', one, two, publishStream);
  run(3, function(err, results) {
    t.error(err, 'No error while running.');
    t.ok(oneRan, 'Function one ran.');
    t.ok(twoRan, 'Function two ran.');
    t.equal(results, 4, 'The resulting function returned 4.');
  });
});

test('results mismatch', function(t) {
  var oneRan = false,
    twoRan = false,
    publishStream = through2.obj(),
    run;

  function one(val, callback) {
    oneRan = true;
    callback(null, val + 1);
  }

  function two(val, callback) {
    twoRan = true;
    callback(null, val + 2);
  }

  t.plan(9);

  publishStream.on('data', function(results) {
    t.equal(results.mismatch, true, 'The results have mismatched values as expected.');
    t.ok(results.control, 'A control observation was returned');
    t.deepEqual(results.control.values, [null, 4], 'The control observation has the expected results');
    t.ok(results.candidate, 'A candidate observation was returned');
    t.deepEqual(results.candidate.values, [null, 5], 'The candidate observation has the expected results');
  });

  run = labrat('test', one, two, publishStream);
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
    publishStream = through2.obj(),
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

  t.plan(12);

  options.sync = true;
  publishStream.on('data', function(results) {
    t.ok(results, 'A results object was returned');
    t.equal(results.name, 'test', 'The experiment name was properly set.');
    t.ok(results.hasOwnProperty('id'), 'The experiment was assigned an id');
    t.ok(results.control, 'A control observation was returned');
    t.ok(results.control.hasOwnProperty('duration'), 'The control observation has a duration');
    t.deepEqual(results.control.values, 4, 'The control observation has the expected results');
    t.ok(results.candidate, 'A candidate observation was returned');
    t.ok(results.candidate.hasOwnProperty('duration'), 'The candidate observation has a duration');
    t.deepEqual(results.candidate.values, 5, 'The candidate observation has the expected results');
  });

  run = labrat('test', one, two, publishStream, options);
  result = run(3);
  t.ok(oneRan, 'Function one ran.');
  t.ok(twoRan, 'Function two ran.');
  t.equal(result, 4, 'The resulting function returned 4.');
});
