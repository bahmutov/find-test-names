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
      },
      {
        name: 'foo',
        type: 'suite',
      },
    ],
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
      },
      {
        name: 'foo',
        type: 'suite',
        pending: true,
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
      },
      {
        name: 'foo',
        type: 'suite',
      },
    ],
  })
})
