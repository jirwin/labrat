var async = require('async');
var deasync = require('deasync');


function _convertToAsync(func) {
  return function() {
    var args = Array.prototype.slice.call(arguments),
        callback = args.pop();
    callback(null, func.apply(null, args));
  }
};

module.exports = function(name, control, candidate, options) {
  options = options || {};

  if (!options.publish) {
    options.publish = function() {};
  }

  return function() {
    var args, f1, f2, cb, ret, retSet;

    ret = {};

    args = Array.prototype.slice.call(arguments);

    if (options.sync) {
      f1 = _convertToAsync(control);
      f2 = _convertToAsync(candidate);
    } else {
      f1 = control;
      f2 = candidate;
      cb = args.pop();
    }

    async.auto({
      control: function controlFunc(callback) {
        var now = Date.now();
        f1.apply(null, args.concat(function() {
          var endTime = Date.now(),
              args = Array.prototype.slice.call(arguments);

          ret.control = {
            values: args,
            duration: endTime - now
          };

          callback();
        }));
      },

      candidate: function candidateFunc(callback) {
        var now = Date.now();

        f2.apply(null, args.concat(function() {
          var endTime = Date.now(),
              args = Array.prototype.slice.call(arguments);

          ret.candidate = {
            values: args,
            duration: endTime - now
          };

          callback();
        }));
      }
    }, function() {
      if (options.sync) {
        retSet = true;
        ret.control.values = ret.control.values.pop();
        ret.candidate.values = ret.candidate.values.pop();
      } else {
        cb.apply(null, ret.control.values);
      }

      options.publish(ret);
    });

    if (options.sync) {
      deasync.loopWhile(function() { return !retSet; });
      return ret.control.values;
    }
  };
};

