#!/usr/bin/env node
'use strict';

var execFile = require('child_process').execFile;
var sep = require('path').sep;
var eol = require('os').EOL;

function normalize(path) {
  return path
    .replace(new RegExp(sep, 'g'), '/')
    .replace(new RegExp('^.*?/((?:@[^/]+/)?[^/]*)$'), '$1');
}

function match(strings, patterns) {
  var regExps = patterns.map(function(pattern) {
    return new RegExp('^' + pattern.replace(/\*+/g, '.*') + '$');
  });
  return strings.filter(function(string) {
    for (var i = 0; i < regExps.length; i++) {
      if (regExps[i].test(string)) return true;
    }
  });
}

function getAllDependencies() {
  return new Promise(function(resolve, reject) {
    execFile('npm', ['ls', '--parseable'], function(error, stdout, stderr) {
      if (stdout) {
        resolve(stdout.split(eol).map(normalize));
      } else if (stderr) {
        reject(new Error(stderr));
      } else {
        reject(error);
      }
    });
  });
}

function getAllDuplicates() {
  return getAllDependencies().then(function(dependencies) {
    return dependencies
      .filter(function(curr, index) {
        return dependencies.indexOf(curr) !== index;
      })
      .filter(function(curr, index, self) {
        return self.indexOf(curr) === index;
      });
  });
}

function getDuplicates() {
  var args = Array.prototype.slice.call(arguments);
  var patterns = args.length ? args : ['**'];
  return getAllDuplicates().then(function(duplicates) {
    return match(duplicates, patterns).sort();
  });
}

if (require.main === module) {
  getDuplicates
    .apply(null, process.argv.slice(2))
    .then(function(duplicates) {
      duplicates.forEach(function(duplicate) {
        // eslint-disable-next-line no-console
        console.warn('Duplicate: %s', duplicate);
      });
    })
    .catch(function(error) {
      // eslint-disable-next-line no-console
      console.error(error);
    });
} else {
  module.exports = getDuplicates;
}
