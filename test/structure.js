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
      suites: [
        {
          name: 'foobar',
          type: 'suite',
          pending: false,
          suiteCount: 0,
          testCount: 2,
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
      suites: [
        {
          name: 'empty before',
          type: 'suite',
          pending: false,
          suiteCount: 1,
          testCount: 0,
          suites: [
            {
              name: 'empty before nested',
              type: 'suite',
              pending: false,
              suiteCount: 0,
              testCount: 0,
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
          suites: [
            {
              name: 'empty after nested',
              type: 'suite',
              pending: false,
              testCount: 0,
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

test('handles counts in deeply nested structure', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {

      describe('child1', () => {
        it('bar', () => {})

        it('quox', () => {})
      });

      describe('child2', () => {
        it('baz', () => {})

        describe('grandchild1', () => {
          it('grandchild1-test', () => {})

          describe('greatgrandchild1', () => {
            it('greatgrandchild1-test', () => {})
          });
        });

      });

      it('blipp', () => {})
    })
  `
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [
    {
      name: 'foo',
      type: 'suite',
      pending: false,
      tags: undefined,
      testCount: 6,
      suiteCount: 4,
      suites: [
        {
          name: 'child1',
          type: 'suite',
          pending: false,
          suites: [],
          testCount: 2,
          suiteCount: 0,
          tests: [
            {
              name: 'bar',
              tags: undefined,
              type: 'test',
              pending: false,
            },
            {
              name: 'quox',
              tags: undefined,
              type: 'test',
              pending: false,
            },
          ],
          tags: undefined,
        },
        {
          name: 'child2',
          type: 'suite',
          pending: false,
          suiteCount: 2,
          testCount: 3,
          tags: undefined,
          suites: [
            {
              name: 'grandchild1',
              type: 'suite',
              pending: false,
              suiteCount: 1,
              tags: undefined,
              testCount: 2,
              suites: [
                {
                  name: 'greatgrandchild1',
                  type: 'suite',
                  pending: false,
                  suiteCount: 0,
                  tags: undefined,
                  testCount: 1,
                  suites: [],
                  tests: [
                    {
                      name: 'greatgrandchild1-test',
                      pending: false,
                      tags: undefined,
                      type: 'test',
                    },
                  ],
                },
              ],
              tests: [
                {
                  name: 'grandchild1-test',
                  pending: false,
                  tags: undefined,
                  type: 'test',
                },
              ],
            },
          ],
          tests: [
            {
              name: 'baz',
              pending: false,
              tags: undefined,
              type: 'test',
            },
          ],
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
  ])
})
