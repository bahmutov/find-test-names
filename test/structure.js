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
      fullName: 'will be added later',
      name: 'will be added later',
      pending: true,
      tags: undefined,
      requiredTags: undefined,
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
      fullName: 'works',
      name: 'works',
      pending: false,
      tags: undefined,
      requiredTags: undefined,
      type: 'test',
    },
  ])
})

test('extract complex structure', (t) => {
  t.plan(3)
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

  t.deepEqual(result.fullTestNames, [
    'baz',
    'foo blipp',
    'foo foobar bar',
    'foo foobar quox',
    'top',
  ])

  t.deepEqual(result.fullSuiteNames, ['foo', 'foo foobar'])

  t.deepEqual(result.structure, [
    {
      fullName: 'top',
      name: 'top',
      tags: undefined,
      requiredTags: undefined,
      type: 'test',
      pending: false,
    },
    {
      fullName: 'foo',
      name: 'foo',
      type: 'suite',
      pending: false,
      suiteCount: 1,
      testCount: 3,
      pendingTestCount: 0,
      suites: [
        {
          fullName: 'foo foobar',
          name: 'foobar',
          type: 'suite',
          pending: false,
          suiteCount: 0,
          testCount: 2,
          pendingTestCount: 0,
          suites: [],
          tests: [
            {
              fullName: 'foo foobar bar',
              name: 'bar',
              tags: ['@three'],
              requiredTags: undefined,
              type: 'test',
              pending: false,
            },
            {
              fullName: 'foo foobar quox',
              name: 'quox',
              tags: ['@five'],
              requiredTags: undefined,
              type: 'test',
              pending: false,
            },
          ],
          tags: ['@four'],
          requiredTags: undefined,
        },
      ],
      tests: [
        {
          fullName: 'foo blipp',
          name: 'blipp',
          tags: undefined,
          requiredTags: undefined,
          type: 'test',
          pending: false,
        },
      ],
      tags: ['@one', '@two'],
      requiredTags: undefined,
    },
    {
      fullName: 'baz',
      name: 'baz',
      tags: ['@one'],
      requiredTags: undefined,
      type: 'test',
      pending: false,
    },
  ])
})

test('structure with empty suites', (t) => {
  t.plan(3)
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

  t.deepEqual(result.fullTestNames, [
    'baz',
    'foo blipp',
    'foo foobar bar',
    'foo foobar quox',
    'top',
  ])

  t.deepEqual(result.fullSuiteNames, [
    'foo',
    'foo empty after',
    'foo empty after empty after nested',
    'foo empty before',
    'foo empty before empty before nested',
    'foo foobar',
  ])

  t.deepEqual(result.structure, [
    {
      fullName: 'top',
      name: 'top',
      type: 'test',
      pending: false,
      tags: undefined,
      requiredTags: undefined,
    },
    {
      fullName: 'foo',
      name: 'foo',
      type: 'suite',
      pending: false,
      tags: ['@one', '@two'],
      requiredTags: undefined,
      suiteCount: 5,
      testCount: 3,
      pendingTestCount: 0,
      suites: [
        {
          fullName: 'foo empty before',
          name: 'empty before',
          type: 'suite',
          pending: false,
          suiteCount: 1,
          testCount: 0,
          pendingTestCount: 0,
          suites: [
            {
              fullName: 'foo empty before empty before nested',
              name: 'empty before nested',
              type: 'suite',
              pending: false,
              suiteCount: 0,
              testCount: 0,
              pendingTestCount: 0,
              suites: [],
              tests: [],
              tags: undefined,
              requiredTags: undefined,
            },
          ],
          tests: [],
          tags: undefined,
          requiredTags: undefined,
        },
        {
          fullName: 'foo foobar',
          name: 'foobar',
          type: 'suite',
          pending: false,
          suiteCount: 0,
          testCount: 2,
          pendingTestCount: 0,
          suites: [],
          tests: [
            {
              fullName: 'foo foobar bar',
              name: 'bar',
              tags: ['@three'],
              requiredTags: undefined,
              type: 'test',
              pending: false,
            },
            {
              fullName: 'foo foobar quox',
              name: 'quox',
              tags: ['@five'],
              requiredTags: undefined,
              type: 'test',
              pending: false,
            },
          ],
          tags: ['@four'],
          requiredTags: undefined,
        },
        {
          fullName: 'foo empty after',
          name: 'empty after',
          type: 'suite',
          pending: false,
          testCount: 0,
          suiteCount: 1,
          pendingTestCount: 0,
          suites: [
            {
              fullName: 'foo empty after empty after nested',
              name: 'empty after nested',
              type: 'suite',
              pending: false,
              testCount: 0,
              pendingTestCount: 0,
              suiteCount: 0,
              suites: [],
              tests: [],
              tags: undefined,
              requiredTags: undefined,
            },
          ],
          tests: [],
          tags: undefined,
          requiredTags: undefined,
        },
      ],
      tests: [
        {
          fullName: 'foo blipp',
          name: 'blipp',
          tags: undefined,
          requiredTags: undefined,
          type: 'test',
          pending: false,
        },
      ],
    },
    {
      fullName: 'baz',
      name: 'baz',
      tags: ['@one'],
      requiredTags: undefined,
      type: 'test',
      pending: false,
    },
  ])
})
