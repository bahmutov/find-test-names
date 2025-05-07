#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const tinyglobby = require('tinyglobby')
const debug = require('debug')('find-test-names')

require('simple-bin-help')({
  minArguments: 4,
  packagePath: path.join(__dirname, '..', 'package.json'),
  help: "use: npx update-test-count filename.md 'file pattern'",
})

const filename = process.argv[2]
const pattern = process.argv[3]
debug('using pattern "%s"', pattern)

const filenames = tinyglobby.globSync(pattern)
debug('found %d files', filenames.length)
debug(filenames)

const { getTestNames } = require('../src')

const allTests = []
filenames.forEach((filename) => {
  const source = fs.readFileSync(filename, 'utf8')
  const result = getTestNames(source)
  console.log(result)
  allTests.push(...result.tests)
})

debug('found %d tests', allTests.length)
debug(allTests)

// console.log('describe names:', result.suiteNames.join(', '))
// console.log('test names:', result.testNames.join(', '))

// TODO: write the tests into the Markdown file
