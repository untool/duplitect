# duplitect

[![travis](https://img.shields.io/travis/untool/duplitect/master.svg)](https://travis-ci.org/untool/duplitect)&nbsp;[![npm](https://img.shields.io/npm/v/duplitect.svg)](https://www.npmjs.com/package/duplitect) <br/>

`duplitect` is a simple tool to detect duplicate versions of installed packages. JavaScript package managers such as [NPM](https://www.npmjs.com/get-npm) and [Yarn](https://yarnpkg.com/en/) habitually allow you to install multiple versions of (transient) dependencies. This works most of the time - for certain kinds of packages, it does not.

`untool` happens to be among these packages that have to be installed exactly once inside any given project, which is why we built this module.

### Installation

Using [NPM](https://www.npmjs.com/get-npm):

```text
npm install -S duplitect
```

Using [Yarn](https://yarnpkg.com/en/):

```text
yarn add duplitect
```

### CLI

Usually, you will want to use `duplitect` as a CLI tool. Since most typical Node.js projects contain a significant number of (unproblematic) duplicates, you will probably want to limit `duplitect`'s output by passing one or more patterns.

##### Example

```text
$ duplitect untool @untool*
Duplicate: untool
Duplicate: @untool/core
```

`duplitect` supports the wildcard character `*` as shown above. This allows you to match multiple, possibly scoped, packages at once.

### API

You can also use `duplitect` in your own tools - it exposes two functions: one, that mimics the CLI functionality. And a second one, that additionally provides the versions of the duplicates.

#### `getDuplicates(cwd, [pattern, pattern, ...])`

```javascript
const { getDuplicates } = require('duplitect');

const duplicates = getDuplicates(process.cwd(), 'untool', '@untool*');
duplicates.forEach((duplicate) => console.log(`Duplicate: ${duplicate}`));
```

#### `getDuplicatesDetails(cwd, [pattern, pattern, ...])`

```javascript
const { getDuplicatesDetails } = require('duplitect');

getDuplicatesDetails(process.cwd(), 'untool', '@untool*').then((duplicates) =>
  duplicates.forEach(({ name, version, pathName }) =>
    console.log('name: %s, version: %s, pathName: %s', name, version, pathName)
  )
);
```
