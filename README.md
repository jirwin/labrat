# labrat

![](https://img.shields.io/travis/jirwin/labrat.svg?style=flat) ![](https://img.shields.io/npm/v/labrat.svg?style=flat) ![](https://img.shields.io/npm/l/labrat.svg?style=flat)

Labrat a tool to let you run two blocks of code and compare their output while capturing metrics about runtime
performance. The hope is that this enables you to refactor code and gain confidence by testing it against a production
load.

Heavily inpsired from Github's [Scientist](https://github.com/github/scientist).

# Install
`$ npm install labrat`

# Example
```javascript
var labrat = require('labrat');

function oldCode(val, callback) {
  setTimeout(function() {
    callback(null, val);
  }, 1000);
}

function newCode(val, callback) {
  betterThanATimeout(val, callback);
}

run = labrat('better than a timeout', oldCode, newCode);

run(3, function(err, results) {
  console.log(results); // prints 3 after 1 second
});
```

# Usage
Labrat works by returning a new function that runs your existing code(control) and new code(candidate) in parallel, and
recording the returned values of each function along with the runtime duration of each function. The labrat function
will always return the values from the control function ensuring that functionality doesn't change.

Labrat works with asynchronous functions:
```javascript
var labrat = require('labrat');

function oldCode(val, callback) {
  setTimeout(function() {
    callback(null, val);
  }, 1000);
}

function newCode(val, callback) {
  betterThanATimeout(val, callback);
}

run = labrat('better than a timeout', oldCode, newCode);

run(3, function(err, results) {
  console.log(results); // prints 3 after 1 second
});
```

Labrat also works with synchronous functions by setting the `sync` option:
```javascript
var labrat = require('labrat');

function oldCode(val) {
  return val;
}

function newCode(val) {
  return extraStuff(val);
}

run = labrat('extra stuff', oldCode, newCode, {sync: true});
console.log(run(3)); // prints 3
```

The whole point of labrat is to run both code paths to measure the difference between the two. So it is important to
look at the results! The results that are published include the name of the experiment, and observations for the control
and the candidate. An observation includes the duration(in milliseconds), and the values returned. For asynchronous
functions, this is an `Array` of arguments that were passed to the resulting callback. For synchronous functions, it is
the value returned by each function.

You can(and should) specify a `publish` function to accomplish this:
```javascript
var labrat = require('labrat');

var options = {
  publish: function(results) {
    console.dir(results); // prints the experiment results
  }
};

function oldCode(val, callback) {
  setTimeout(function() {
    callback(null, val);
  }, 1000);
}

function newCode(val, callback) {
  betterThanATimeout(val, callback);
}

run = labrat('better than a timeout', oldCode, newCode);

run(3, function(err, results) {
  console.log(results); // prints 3 after ~1 second has passed
});
```

# labrat(name, control, candidate[, options])
The labrat function returns a new function that runs both the control and candidate and returns the value(s) from the
`control`.

### name
A unique name to track the experiment

### control
The `control` function is your existing code that you are planning on refactoring. The results of `control` are always
returned when you call the labrat function.

### candidate
The `candidate` function is your new code that you'd like to compare against the `control`.

### options
The `options` object is optional. It currently supports:
* sync (defaults to false)
  * If true, labrat will treat this as a synchronous function
* publish
  * A function that receives a `results` object that contains experiment observations. Typically you'd want to emit
    these observations to something like [statsd](https://github.com/etsy/statsd).
   
# Test and Lint
`$ npm test && npm run-script lint`

# Contribute
Submit pull requests against the master branch. Make sure tests and lint pass.

# Maintainers
[@jirwin](https://github.com/jirwin)