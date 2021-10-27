const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('basic', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it('bar', () => {})
    })
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
  })
})
