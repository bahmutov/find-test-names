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

test('ES6 modules with import keyword', (t) => {
  t.plan(1)
  const source = stripIndent`
    import {foo} from './foo'
    describe('foo', () => {
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
        pending: false,
      },
    ],
  })
})

test('context', (t) => {
  t.plan(1)
  const source = stripIndent`
    context('parent', () => {})
    context.skip('does not work', () => {})
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['does not work', 'parent'],
    testNames: [],
    tests: [
      { name: 'parent', type: 'suite', pending: false },
      { name: 'does not work', type: 'suite', pending: true },
    ],
  })
})

test('specify', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      specify('bar', () => {})
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
