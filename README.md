# find-test-names [![ci](https://github.com/bahmutov/find-test-names/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bahmutov/find-test-names/actions/workflows/ci.yml)

> Given a Mocha / Cypress spec file, returns the list of suite and test names

## Install

```shell
# install using NPM, probably as a dev dependency
$ npm i -D find-test-names
# install using Yarn
$ yarn add -D find-test-names
```

## Use

```js
const { getTestNames } = require('find-test-names')
const result = getTestNames(specSourceCode)
// { "suiteNames": [], "testNames": [], "tests": [] }
```

The `tests` is a list with each test and suite name, and optional list of tags.

```js
// spec.js
it('works', {tags: ['@user']}, () => { ... })
// found test names
// { tests: [{ name: 'works', tags: ['@user'] }] }
```

### withStructure

You can get the entire structure of suites and tests by passing `true` argument

```js
const result = getTestNames(specSourceCode, true)
// use the result.structure array
```

To view this in action, use `npm run demo-structure` which points at [bin/find-tests.js](./bin/find-tests.js)

### Pending tests

The tests `it.skip` are extracted and have the property `pending: true`

### setEffectiveTags

Often, you want to have each test and see which tags it has and what parent tags apply to it. You can compute for each test a list of _effective_ tags and set it for each test.

```js
// example spec code
describe('parent', { tags: '@user' }, () => {
  describe('parent', { tags: '@auth' }, () => {
    it('works a', { tags: '@one' }, () => {})
    it('works b', () => {})
  })
})
```

```js
const { getTestNames, setEffectiveTags } = require('find-test-names')
const result = getTestNames(source, true)
setEffectiveTags(result.structure)
```

If you traverse the `result.structure`, the test "works a" will have the `effectiveTags` list with `@user, @auth, @one`, and the test "works b" will have the `effectiveTags` list with `@user, @auth, @one`.

### filterByEffectiveTags

Once you `setEffectiveTags`, you can filter all tests by an effective tag. For example, to fid all tests with the given tag:

```js
const {
  getTestNames,
  setEffectiveTags,
  filterByEffectiveTags,
} = require('find-test-names')
const result = getTestNames(source, true)
setEffectiveTags(result.structure)
const tests = filterByEffectiveTags(result.structure, ['@one'])
```

Returns individual test objects.

Tip: you can pass the source code and the tags to the `filterByEffectiveTags` function and let it parse it

```js
const filtered = filterByEffectiveTags(source, ['@user'])
```

### Bin

This package includes [bin/find-test-names.js](./bin/find-test-names.js) that you can use from the command line

```shell
$ npx find-test-names <path to the spec file>
# prints the describe and test names found in the spec file
```

### print-tests

Print found suites an tests

```shell
$ npx print-tests <spec pattern>
```

For example, in this repo

```
$ npx print-tests 'test-cy/**/*.js'

test-cy/spec-a.js
└─ Suite A
  ├─ works 1
  └─ works 2

test-cy/spec-b.js
└─ Suite B
  ├─ works 1
  └─ works 2
```

Pending tests and suites are marked with `⊙` character like this:

```
├─ first
├⊙ second
└⊙ last
```

If there are tags, they are shown after the name

```
├─ first [tag1, tag2]
├─ second [@sanity]
└─ last
```

### Unknown test names

Sometimes a test name comes from a variable, not from a literal string.

```js
// test name is a variable, not a literal string
const testName = 'nice'
it(testName, () => {})
```

In that case, the tags are still extracted. When printing, such tests have name `<unknown test>`.

## Debugging

Run with the environment variable `DEBUG=find-test-names` to see verbose logs

## Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2021

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/find-test-names/issues) on Github

## MIT License

Copyright (c) 2021 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
