var test = require('tape');
var through2 = require('through2');

var labrat = require('../index');

test('experiment', function(t) {
  var oneRan = false,
      twoRan = false,
      publishStream = through2.obj();

  function one(val, callback) {
    oneRan = Date.now();
    setTimeout(function() {
      callback(null, val, 1 + val);
    }, 100);
  }

  function two(val, callback) {
    twoRan = Date.now();
    setTimeout(function() {
      callback(null, val, 2 + val);
    }, 200);
  }

  publishStream.on('data', function(obj) {
    t.ok(obj, 'A results object was returned');
    t.equal(obj.name, 'test', 'The experiment name was properly set.');
    t.ok(obj.hasOwnProperty('id'), 'The experiment was assigned an id');
    t.ok(obj.control, 'A control observation was returned');
    t.ok(obj.control.hasOwnProperty('duration'), 'The control observation has a duration');
    t.ok(obj.control.duration >= 100, 'The control duration took at least 5 seconds');
    t.deepEqual(obj.control.values, [null, 3, 4], 'The control observation has the expected results');
    t.ok(obj.candidate, 'A candidate observation was returned');
    t.ok(obj.candidate.hasOwnProperty('duration'), 'The candidate observation has a duration');
    t.ok(obj.candidate.duration >= 200, 'The candidate duration took at least 2 seconds');
    t.deepEqual(obj.candidate.values, [null, 3, 5], 'The candidate observation has the expected results');
    t.equal(obj.mismatch, true, 'The results have mismatched values as expected.');
  });

  labrat('test', one, two, publishStream)(3, function(err, res1, res2) {
    t.error(err, 'No error while running.');
    t.ok(oneRan, 'Function one ran.');
    t.ok(twoRan, 'Function two ran.');
    t.ok(oneRan < twoRan, 'Function one ran before function two.');
    t.equal(res1, 3, 'The resulting function returned 3 as its second argument.');
    t.equal(res2, 4, 'The resulting function returned 4 as its third argument.');
    t.end();
  });
});
