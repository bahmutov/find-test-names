const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

test('for of loop', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it('bar', () => {
        for (const c of []);
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
        type: 'test',
        pending: false,
      },
      {
        name: 'foo',
        type: 'suite',
        pending: false,
      },
    ],
  })
})
