const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('includes the comment', (t) => {
  t.plan(1)
  const source = stripIndent`
    // this is a suite called foo
    describe('foo', () => {
      // this is the test comment
      it('bar', () => {})
    })
  `
  const result = getTestNames(source)
  // the leading comment before the test is extracted
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        type: 'test',
        pending: false,
        name: 'bar',
        comment: 'this is the test comment',
      },
      { type: 'suite', pending: false, name: 'foo' },
    ],
  })
})
