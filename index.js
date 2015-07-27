var async = require('async');
var deepEqual = require('deep-equal');
var uuid = require('node-uuid');

/**
 * Takes an asynchronous function and reports the amount of time it takes to run, as well as values it returns.
 * @param func The function to observe.
 * @param args The arguments to call the function with.
 * @returns {Function} The function to call.
 */
var observeFunction = function(func, args) {
  return function(callback) {
    var now = Date.now();
    func.apply(null, args.concat(function() {
      var endTime = Date.now(),
        innerArgs = Array.prototype.slice.call(arguments);

      callback(null, {values: innerArgs, duration: endTime - now});
    }));
  }
};

/**
 * Returns a labrat function.
 * @param {String} name The name of the experiment.
 * @param {Function} control The control function.
 * @param {Function} candidate The candidate function.
 * @param {Writable} publishStream A Writable object stream to publish results to.
 * @param {Object} options An options object.
 * @returns {Function}
 */
module.exports = function(name, control, candidate, publishStream, options) {
  if (publishStream && !publishStream.writable && !publishStream._writeableState) {
    options = publishStream;
    publishStream = null;
  }

  options = options || {};

  return function() {
    var args, cb;

    args = Array.prototype.slice.call(arguments);
    cb = args.pop();
    async.auto({
      control: observeFunction(control, args),
      candidate: ['control', function(callback) {
        if (options.enabled === false) {
          callback(null, {});
        } else {
          observeFunction(candidate, args)(callback);
        }
      }]
    }, function(err, results) {
      var observations = {
        control: results.control,
        candidate: results.candidate,
        name: name,
        id: uuid.v1(),
        mismatch: false
      };

      if (observations.control.hasOwnProperty('values') && observations.candidate.hasOwnProperty('values')) {
        observations.mismatch = !deepEqual(observations.control.values, observations.candidate.values);
      }

      // If a publishStream is provided, write the observations to it
      if (publishStream) {
        publishStream.write(observations);
      }

      cb.apply(null, observations.control.values);
    });
  };
};

