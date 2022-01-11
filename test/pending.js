const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('pending test', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('works')
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['works'],
    tests: [{ name: 'works', type: 'test', pending: true }],
  })
})

test('pending suite', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent')
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['parent'],
    testNames: [],
    tests: [{ name: 'parent', type: 'suite', pending: true }],
  })
})

test('skipped test', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it.skip('bar', () => {})
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
        pending: true,
      },
      {
        name: 'foo',
        type: 'suite',
        pending: false,
      },
    ],
  })
})

test('skipped suite', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe.skip('foo', () => {
      it('bar', () => {})
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
        pending: true,
      },
    ],
  })
})
