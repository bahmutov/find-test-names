#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

require('simple-bin-help')({
  minArguments: 3,
  packagePath: path.join(__dirname, '..', 'package.json'),
  help: 'use: npx find-test-names <spec file name>',
})

const filename = process.argv[2]
const { getTestNames } = require('..')
const source = fs.readFileSync(filename, 'utf8')
const result = getTestNames(source)
console.log('describe names:', result.suiteNames.join(', '))
console.log('test names:', result.testNames.join(', '))
