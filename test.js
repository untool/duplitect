const test = require('ava');
const { execFile } = require('child_process');

const { getDuplicates, getDuplicatesDetails } = require('./index');

test('export test', (t) => {
  t.is(typeof getDuplicates, 'function', 'main export is a function');
});

test('#getDuplicates: basic API function test', (t) => {
  const duplicates = getDuplicates(__dirname, 'supports-color');
  t.truthy(duplicates.length, 'duplicate detected');
  t.is(duplicates[0], 'supports-color', 'expected duplicate found');
});

test('#getDuplicatesDetails: basic API function test', async (t) => {
  const duplicates = await getDuplicatesDetails(__dirname, 'supports-color');
  const [{ name: nameOne }, { name: nameTwo }] = duplicates;
  const [lowerVersion, higherVersion] = duplicates
    .map(({ version }) => parseInt(version, 10))
    .sort();
  t.truthy(duplicates.length, 'duplicate detected');
  t.is(nameOne, nameTwo, 'expected duplicate found');
  t.true(lowerVersion < higherVersion, 'different major versions');
});

test('basic CLI function test', (t) =>
  new Promise((resolve, reject) =>
    execFile('./index.js', ['supports-color'], (error, _, stderr) => {
      if (stderr) {
        t.truthy(stderr.length, 'duplicate detected');
        t.regex(stderr, /supports-color/, 'expected duplicate found');
        resolve();
      } else {
        reject(error);
      }
    })
  ));
