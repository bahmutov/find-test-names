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

### Bin

This package includes [bin/find-test-names.js](./bin/find-test-names.js) that you can use from the command line

```shell
$ npx find-test-names <path to the spec file>
# prints the describe and test names found in the spec file
```

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
