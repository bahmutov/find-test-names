const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

test('handles empty string', (t) => {
  t.plan(1)
  const source = ''
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [])
})

test('handles pending test', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('will be added later')
  `
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [
    {
      name: 'will be added later',
      pending: true,
      tags: undefined,
      type: 'test',
    },
  ])
})

test('handles a single test', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('works', () => {})
  `
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [
    {
      name: 'works',
      pending: false,
      tags: undefined,
      type: 'test',
    },
  ])
})

test('extract complex structure', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('top', () => {})

    describe('foo', {tags: ['@one', '@two']}, () => {

      describe('foobar', {tags: ['@four']}, () => {
        it('bar', {tags: ['@three']}, () => {})

        it('quox', {tags: ['@five']}, () => {})
      });

      it('blipp', {tags: []}, () => {})
    })

    it('baz', {tags: ['@one']}, () => {})
  `
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [
    {
      name: 'top',
      tags: undefined,
      type: 'test',
      pending: false,
    },
    {
      name: 'foo',
      type: 'suite',
      pending: false,
      suiteCount: 1,
      testCount: 3,
      pendingTestCount: 0,
      suites: [
        {
          name: 'foobar',
          type: 'suite',
          pending: false,
          suiteCount: 0,
          testCount: 2,
          pendingTestCount: 0,
          suites: [],
          tests: [
            {
              name: 'bar',
              tags: ['@three'],
              type: 'test',
              pending: false,
            },
            {
              name: 'quox',
              tags: ['@five'],
              type: 'test',
              pending: false,
            },
          ],
          tags: ['@four'],
        },
      ],
      tests: [
        {
          name: 'blipp',
          tags: undefined,
          type: 'test',
          pending: false,
        },
      ],
      tags: ['@one', '@two'],
    },
    {
      name: 'baz',
      tags: ['@one'],
      type: 'test',
      pending: false,
    },
  ])
})

test('structure with empty suites', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('top', () => {})

    describe('foo', {tags: ['@one', '@two']}, () => {
      describe('empty before', () => {
        describe('empty before nested', () => {})
      })

      describe('foobar', {tags: ['@four']}, () => {
        it('bar', {tags: ['@three']}, () => {})

        it('quox', {tags: ['@five']}, () => {})
      });

      it('blipp', {tags: []}, () => {})

      describe('empty after', () => {
        describe('empty after nested', () => {})
      })

    })

    it('baz', {tags: ['@one']}, () => {})
  `
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [
    {
      name: 'top',
      type: 'test',
      pending: false,
      tags: undefined,
    },
    {
      name: 'foo',
      type: 'suite',
      pending: false,
      tags: ['@one', '@two'],
      suiteCount: 5,
      testCount: 3,
      pendingTestCount: 0,
      suites: [
        {
          name: 'empty before',
          type: 'suite',
          pending: false,
          suiteCount: 1,
          testCount: 0,
          pendingTestCount: 0,
          suites: [
            {
              name: 'empty before nested',
              type: 'suite',
              pending: false,
              suiteCount: 0,
              testCount: 0,
              pendingTestCount: 0,
              suites: [],
              tests: [],
              tags: undefined,
            },
          ],
          tests: [],
          tags: undefined,
        },
        {
          name: 'foobar',
          type: 'suite',
          pending: false,
          suiteCount: 0,
          testCount: 2,
          pendingTestCount: 0,
          suites: [],
          tests: [
            {
              name: 'bar',
              tags: ['@three'],
              type: 'test',
              pending: false,
            },
            {
              name: 'quox',
              tags: ['@five'],
              type: 'test',
              pending: false,
            },
          ],
          tags: ['@four'],
        },
        {
          name: 'empty after',
          type: 'suite',
          pending: false,
          testCount: 0,
          suiteCount: 1,
          pendingTestCount: 0,
          suites: [
            {
              name: 'empty after nested',
              type: 'suite',
              pending: false,
              testCount: 0,
              pendingTestCount: 0,
              suiteCount: 0,
              suites: [],
              tests: [],
              tags: undefined,
            },
          ],
          tests: [],
          tags: undefined,
        },
      ],
      tests: [
        {
          name: 'blipp',
          tags: undefined,
          type: 'test',
          pending: false,
        },
      ],
    },
    {
      name: 'baz',
      tags: ['@one'],
      type: 'test',
      pending: false,
    },
  ])
})
