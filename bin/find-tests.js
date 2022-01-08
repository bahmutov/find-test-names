#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const globby = require('globby')
const debug = require('debug')('find-test-names')

require('simple-bin-help')({
  minArguments: 3,
  packagePath: path.join(__dirname, '..', 'package.json'),
  help: "use: npx find-tests 'spec file pattern'",
})

const pattern = process.argv[2]
debug('using pattern "%s"', pattern)

const filenames = globby.sync(pattern)
debug('found %d files', filenames.length)
debug(filenames)

const { getTestNames } = require('../src')

const allTests = []
filenames.forEach((filename) => {
  const source = fs.readFileSync(filename, 'utf8')
  const result = getTestNames(source, true)
  console.log('=== %s ===', filename)
  // console.log(JSON.stringify(result.structure, null, 2))
  console.dir(result.structure, { depth: 5 })
  // console.log('%j', result.structure)
  // const s = treeify(result.structure)
  // console.log(s)
  allTests.push(...result.tests)
})

// debug('found %d tests', allTests.length)
// debug(allTests)

// console.log('describe names:', result.suiteNames.join(', '))
// console.log('test names:', result.testNames.join(', '))

// TODO: write the tests into the Markdown file
