#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

var cwd = process.env.INIT_CWD || process.cwd();
var event = process.env.npm_lifecycle_event;

function normalize(module) {
  return module
    .replace(new RegExp(path.sep, 'g'), '/')
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
  function walk(dir) {
    return new Promise(function(resolve) {
      fs.readdir(dir, function(error, contents) {
        error ? resolve([]) : resolve(contents);
      });
    }).then(function(contents) {
      return Promise.all(
        contents
          .filter(function(curr) {
            return !/^\./.test(curr);
          })
          .reduce(function(acc, curr) {
            var module = path.join(dir, curr);
            if (/^@/.test(curr)) {
              acc.push(walk(module));
            } else {
              acc.push(Promise.resolve(module));
              acc.push(
                new Promise(function(resolve, reject) {
                  fs.stat(module, function(error, stats) {
                    error ? reject(error) : resolve(stats);
                  });
                }).then(function(stats) {
                  if (stats.isDirectory()) {
                    return walk(path.join(module, 'node_modules'));
                  }
                  return [];
                })
              );
            }
            return acc;
          }, [])
      ).then(function(results) {
        return [].concat.apply([], results);
      });
    });
  }
  return walk(path.join(cwd, 'node_modules'));
}

function getAllDuplicates() {
  return getAllDependencies().then(function(dependencies) {
    return dependencies
      .map(normalize)
      .filter(function(curr, index, self) {
        return self.indexOf(curr) !== index;
      })
      .filter(function(curr, index, self) {
        return self.indexOf(curr) === index;
      });
  });
}

function getDuplicates() {
  var patterns = Array.prototype.slice.call(arguments);
  if (!patterns.length && /install/.test(event)) {
    patterns.push(normalize(process.cwd()));
  }
  return getAllDuplicates().then(function(all) {
    var duplicates = patterns.length ? match(all, patterns) : all;
    return duplicates.sort();
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
      if (duplicates.length) {
        process.exit(1);
      }
    })
    .catch(function(error) {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    });
} else {
  module.exports = getDuplicates;
}
