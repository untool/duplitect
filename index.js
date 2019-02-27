#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

var cwd = process.env.INIT_CWD || process.cwd();

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
      .map(function(curr) {
        return curr
          .replace(new RegExp(path.sep, 'g'), '/')
          .replace(new RegExp('^.*?/((?:@[^/]+/)?[^/]*)$'), '$1');
      })
      .filter(function(curr, index, self) {
        return self.indexOf(curr) !== index;
      })
      .filter(function(curr, index, self) {
        return self.indexOf(curr) === index;
      })
      .sort();
  });
}

function getDuplicates() {
  var regExps = Array.prototype.map.call(arguments, function(pattern) {
    return new RegExp('^' + pattern.replace(/\*+/g, '.*') + '$');
  });
  return getAllDuplicates().then(function(duplicates) {
    if (regExps.length) {
      return duplicates.filter(function(curr) {
        for (var i = 0; i < regExps.length; i++) {
          if (regExps[i].test(curr)) return true;
        }
      });
    }
    return duplicates;
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
