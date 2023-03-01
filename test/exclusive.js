const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('exclusive test', (t) => {
  t.plan(1)
  const source = stripIndent`
    it.only('bar', () => {})
  `
  const result = getTestNames(source)
  // console.log(result)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['bar'],
    tests: [{ type: 'test', pending: false, exclusive: true, name: 'bar' }],
  })
})

test('exclusive test flag in the structure', (t) => {
  t.plan(1)
  const source = stripIndent`
    it.only('bar', () => {})
  `
  const result = getTestNames(source, true)
  console.log(result)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['bar'],
    tests: [{ type: 'test', pending: false, exclusive: true, name: 'bar' }],
    structure: [
      {
        name: 'bar',
        tags: undefined,
        requiredTags: undefined,
        pending: false,
        exclusive: true,
        type: 'test',
        fullName: 'bar',
      },
    ],
    testCount: 1,
    pendingTestCount: 0,
    fullTestNames: ['bar'],
    fullSuiteNames: [],
  })
})
