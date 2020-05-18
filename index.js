#!/usr/bin/env node
'use strict';

const {
  existsSync: exists,
  readdirSync: readdir,
  statSync: stat,
  readFile: readFileCb,
} = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(readFileCb);

function getDependencies(dir) {
  if (exists(dir)) {
    const dependencies = readdir(dir)
      .filter((curr) => !/^\./.test(curr))
      .reduce((acc, curr) => {
        const currDir = path.join(dir, curr);
        if (/^@/.test(curr)) {
          acc.push(getDependencies(currDir));
        } else {
          acc.push(currDir);
          if (stat(currDir).isDirectory()) {
            var nextDir = path.join(currDir, 'node_modules');
            acc.push(getDependencies(nextDir));
          }
        }
        return acc;
      }, []);
    return [].concat(...dependencies);
  } else {
    return [];
  }
}

function getAllDuplicates(cwd, getFullPaths = false) {
  const dependencies = getDependencies(cwd);
  const duplicates = dependencies
    .map((curr) =>
      curr
        .replace(/\\/g, '/')
        .replace(new RegExp('^.*?/((?:@[^/]+/)?[^/]*)$'), '$1')
    )
    .filter((curr, index, self) => self.indexOf(curr) !== index)
    .filter((curr, index, self) => self.indexOf(curr) === index)
    .sort();

  if (!getFullPaths) {
    return duplicates;
  }

  return dependencies.filter((dep) =>
    duplicates.some((dup) => dep.endsWith(dup))
  );
}

function getDuplicates(cwd, ...patterns) {
  const dir = path.join(cwd, 'node_modules');
  const regExps = patterns.map(
    (pattern) => new RegExp(`^${pattern.replace(/\*+/g, '.*')}$`)
  );
  const duplicates = getAllDuplicates(dir);
  if (regExps.length) {
    return duplicates.filter((curr) => {
      for (let i = 0; i < regExps.length; i++) {
        if (regExps[i].test(curr)) return true;
      }
    });
  }
  return duplicates;
}

async function getPackageVersion({ pathName, ...rest }) {
  const pkg = await readFile(path.join(pathName, 'package.json'), 'utf8');
  const { version } = JSON.parse(pkg);
  return { pathName, version, ...rest };
}

async function getDuplicatesDetails(cwd, ...patterns) {
  const dir = path.join(cwd, 'node_modules');
  const regExps = patterns.map(
    (pattern) => new RegExp(`node_modules\\/${pattern.replace(/\*+/g, '.*')}$`)
  );
  let duplicates = getAllDuplicates(dir, true);
  if (regExps.length) {
    duplicates = duplicates.filter((curr) => {
      for (let i = 0; i < regExps.length; i++) {
        if (regExps[i].test(curr)) return true;
      }
    });
  }
  const duplictesWithVersions = await Promise.all(
    duplicates
      .map((pathName) => ({
        name: path.basename(pathName),
        pathName,
      }))
      .map(getPackageVersion)
  );
  return duplictesWithVersions;
}

if (require.main === module) {
  const cwd = process.env.INIT_CWD || process.cwd();
  const argv = process.argv.slice(2);
  try {
    const duplicates = getDuplicates(cwd, ...argv);
    duplicates.forEach((duplicate) =>
      // eslint-disable-next-line no-console
      console.warn('Duplicate: %s', duplicate)
    );
    if (duplicates.length) {
      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
} else {
  module.exports = { getDuplicates, getDuplicatesDetails };
}
