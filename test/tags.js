const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

test('test with tags', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it('bar', {tags: ['@one']}, () => {})
    })
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        name: 'bar',
        tags: ['@one'],
      },
      {
        name: 'foo',
      },
    ],
  })
})

test('describe with tags', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', {tags: ['@one', '@two']}, () => {
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
      },
      {
        name: 'foo',
        tags: ['@one', '@two'],
      },
    ],
  })
})
