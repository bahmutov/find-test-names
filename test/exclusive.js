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
