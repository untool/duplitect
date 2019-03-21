#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

function getDependencies(dir) {
  if (fs.existsSync(dir)) {
    var dependencies = fs
      .readdirSync(dir)
      .filter(function(curr) {
        return !/^\./.test(curr);
      })
      .reduce(function(acc, curr) {
        var currDir = path.join(dir, curr);
        if (/^@/.test(curr)) {
          acc.push(getDependencies(currDir));
        } else {
          acc.push(currDir);
          if (fs.statSync(currDir).isDirectory()) {
            var nextDir = path.join(currDir, 'node_modules');
            acc.push(getDependencies(nextDir));
          }
        }
        return acc;
      }, []);
    return [].concat.apply([], dependencies);
  } else {
    return [];
  }
}

function getAllDuplicates(cwd) {
  return getDependencies(cwd)
    .map(function(curr) {
      return curr
        .replace(/\\/g, '/')
        .replace(new RegExp('^.*?/((?:@[^/]+/)?[^/]*)$'), '$1');
    })
    .filter(function(curr, index, self) {
      return self.indexOf(curr) !== index;
    })
    .filter(function(curr, index, self) {
      return self.indexOf(curr) === index;
    })
    .sort();
}

function getDuplicates(cwd) {
  var dir = path.join(cwd, 'node_modules');
  var patterns = Array.prototype.slice.call(arguments, 1);
  var regExps = patterns.map(function(pattern) {
    return new RegExp('^' + pattern.replace(/\*+/g, '.*') + '$');
  });
  var duplicates = getAllDuplicates(dir);
  if (regExps.length) {
    return duplicates.filter(function(curr) {
      for (var i = 0; i < regExps.length; i++) {
        if (regExps[i].test(curr)) return true;
      }
    });
  }
  return duplicates;
}

if (require.main === module) {
  var cwd = process.env.INIT_CWD || process.cwd();
  var argv = process.argv.slice(2);
  try {
    var duplicates = getDuplicates.apply(null, [cwd].concat(argv));
    duplicates.forEach(function(duplicate) {
      // eslint-disable-next-line no-console
      console.warn('Duplicate: %s', duplicate);
    });
    if (duplicates.length) {
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
} else {
  module.exports = getDuplicates;
}
