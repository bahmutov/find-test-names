const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

test('variable as test name', (t) => {
  t.plan(1)
  // instead of a string, this test's name is a variable
  const source = stripIndent`
    const name = 'works'
    it(name, () => {})
  `
  const result = getTestNames(source)
  // the result should have a test without a name
  t.deepEqual(result, {
    suiteNames: [],
    testNames: [],
    tests: [{ type: 'test', pending: false }],
  })
})

test('variable as test name then tags', (t) => {
  t.plan(1)
  // instead of a string, this test's name is a variable
  const source = stripIndent`
    const name = 'works'
    it(name, { tags: ['@first', '@second'] }, () => {})
  `
  const result = getTestNames(source)
  // console.dir(result, { depth: null })
  // the result should have a test without a name
  // and have the list of tags
  t.deepEqual(result, {
    suiteNames: [],
    testNames: [],
    tests: [{ type: 'test', pending: false, tags: ['@first', '@second'] }],
  })
})
