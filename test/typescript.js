const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('typescript', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it('bar', () => {
        const typed: string = 'abc';
      })
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        name: 'bar',
      },
      {
        name: 'foo',
      },
    ],
  })
})
