var async = require('async');
var deepEqual = require('deep-equal');
var uuid = require('node-uuid');


/**
 * Returns a labrat function.
 * @param {String} name The name of the experiment.
 * @param {Function} control The control function.
 * @param {Function} candidate The candidate function.
 * @param {Writable} publishStream A Writable object stream to publish results to.
 * @param {Object} options An options object.
 * @returns {Function}
 */
var LabRat = function(name, control, candidate, publishStream, options) {
  this.name = name;
  this.control = control;
  this.candidate = candidate;
  this.publishStream = publishStream;
  this.options = options;

  if (this.publishStream && !this.publishStream.writable && !this.publishStream._writeableState) {
    this.options = publishStream;
    this.publishStream = null;
  }

  this.options = this.options || {};
};

/**
 * Takes an asynchronous function and reports the amount of time it takes to run, as well as values it returns.
 * @param func The function to observe.
 * @param args The arguments to call the function with.
 * @returns {Function} The function to call.
 */
LabRat.prototype.observeFunction = function(func, args) {
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
 * Publish observations to the provided publish stream.
 * @param observations
 */
LabRat.prototype.publish = function(observations) {
  if (this.publishStream) {
    this.publishStream.write(observations);
  }
};

/**
 * Returns true if the candidate should be run.
 * @return {Boolean}
 */
LabRat.prototype.isEnabled = function() {
  var enabled = this.options.enabled;

  if (enabled === undefined || enabled === null) {
    enabled = true;
  }

  if (typeof enabled === 'function') {
    console.log('Checking if enabled', enabled());
    return enabled();
  }

  if (typeof enabled === 'number') {
    return enabled > Math.random() * 100;

  }

  return enabled;
};

LabRat.prototype.get = function() {
  var self = this;

  return function() {
    var args, cb;

    args = Array.prototype.slice.call(arguments);
    cb = args.pop();
    async.auto({
      control: self.observeFunction(self.control, args),
      candidate: ['control', function(callback) {
        if (self.isEnabled()) {
          self.observeFunction(self.candidate, args)(callback);
        } else {
          callback(null, {});
        }
      }]
    }, function(err, results) {
      var observations = {
        control: results.control,
        candidate: results.candidate,
        name: self.name,
        id: uuid.v1(),
        mismatch: false
      };

      if (observations.control.hasOwnProperty('values') && observations.candidate.hasOwnProperty('values')) {
        observations.mismatch = !deepEqual(observations.control.values, observations.candidate.values);
      }

      self.publish(observations);

      cb.apply(null, observations.control.values);
    });
  };
};


module.exports = function(name, control, candidate, publishStream, options) {
  var labrat = new LabRat(name, control, candidate, publishStream, options);

  return labrat.get();
};

