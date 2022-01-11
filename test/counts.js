const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

// common structure for two tests we expect to find
const twoTests = [
  {
    name: 'works a',
    type: 'test',
    pending: false,
    tags: undefined,
  },
  {
    name: 'works b',
    type: 'test',
    pending: false,
    tags: undefined,
  },
]

test('just tests have no count', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('works a', () => {})
    it('works b', () => {})
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.structure, twoTests)
})

test('suite counts the tests inside', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('loads', () => {
      it('works a', () => {})
      it('works b', () => {})
    })
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.structure, [
    {
      name: 'loads',
      type: 'suite',
      pending: false,
      tags: undefined,
      suites: [],
      suiteCount: 0,
      // counts all tests inside
      testCount: 2,
      tests: twoTests,
    },
  ])
})

test('suite counts the tests inside inner suites', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', () => {
      describe('inner1', () => {
        it('works a', () => {})
        it('works b', () => {})
      })
      describe('inner2', () => {
        it('works a', () => {})
        it('works b', () => {})
      })
    })
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.structure, [
    {
      name: 'parent',
      type: 'suite',
      pending: false,
      tags: undefined,
      suites: [
        {
          name: 'inner1',
          type: 'suite',
          pending: false,
          tags: undefined,
          suites: [],
          suiteCount: 0,
          testCount: 2,
          tests: twoTests,
        },
        {
          name: 'inner2',
          type: 'suite',
          pending: false,
          tags: undefined,
          suites: [],
          suiteCount: 0,
          testCount: 2,
          tests: twoTests,
        },
      ],
      suiteCount: 2,
      // counts all the test inside
      testCount: 4,
      tests: [],
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
