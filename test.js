var test = require('ava');

var execFile = require('child_process').execFile;

var getDuplicates = require('./index');

test('export test', function(t) {
  t.is(typeof getDuplicates, 'function', 'main export is a function');
});

test('basic API function test', function(t) {
  return getDuplicates('debug').then(function(duplicates) {
    t.truthy(duplicates.length, 'duplicate detected');
    t.is(duplicates[0], 'debug', 'expected duplicate found');
  });
});

test('basic CLI function test', function(t) {
  return new Promise(function(resolve, reject) {
    execFile('./index.js', ['debug'], function(error, stdout, stderr) {
      if (stderr) {
        t.truthy(stderr.length, 'duplicate detected');
        t.regex(stderr, /debug/, 'expected duplicate found');
        resolve();
      } else {
        reject(error);
      }
    });
  });
});
