var async = require('async');
var deasync = require('deasync');


function _convertToAsync(func) {
  return function() {
    var args = Array.prototype.slice.call(arguments),
        callback = args.pop();
    callback(null, func.apply(null, args));
  }
};

module.exports = function(name, legacy, shiny, options) {
  options = options || {};

  return function() {
    var args, f1, f2, cb, ret, retSet;

    args = Array.prototype.slice.call(arguments);

    if (options.sync) {
      f1 = _convertToAsync(legacy);
      f2 = _convertToAsync(shiny);
    } else {
      f1 = legacy;
      f2 = shiny;
      cb = args.pop();
    }

    async.auto({
      legacy: function legacyFunc(callback) {
        f1.apply(null, args.concat(callback));
      },
      shiny: function shinyFunc(callback) {
        f2.apply(null, args.concat(callback));
      }
    }, function(err, results) {
      if (options.sync) {
        ret = results.legacy;
        retSet = true;
      } else {
        cb(null, results.legacy);
      }
    });

    if (options.sync) {
      deasync.loopWhile(function() { return !retSet; });
      return ret;
    }
  };
};

