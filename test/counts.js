const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

// common structure for two tests we expect to find
const twoTests = [
  {
    fullName: 'works a',
    name: 'works a',
    type: 'test',
    pending: false,
    tags: undefined,
    requiredTags: undefined,
  },
  {
    fullName: 'works b',
    name: 'works b',
    type: 'test',
    pending: false,
    tags: undefined,
    requiredTags: undefined,
  },
]

test('just tests have no count', (t) => {
  t.plan(3)
  const source = stripIndent`
    it('works a', () => {})
    it('works b', () => {})
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.structure, twoTests)
  t.deepEqual(result.testCount, 2)
  t.deepEqual(result.pendingTestCount, 0)
})

test('tests with pending', (t) => {
  t.plan(2)
  const source = stripIndent`
    it('works a', () => {})
    it('works b')
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.testCount, 2)
  t.deepEqual(result.pendingTestCount, 1)
})

test('suite counts the tests inside', (t) => {
  t.plan(3)
  const source = stripIndent`
    describe('loads', () => {
      it('works a', () => {})
      it('works b', () => {})
    })
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.structure, [
    {
      fullName: 'loads',
      name: 'loads',
      type: 'suite',
      pending: false,
      tags: undefined,
      requiredTags: undefined,
      suites: [],
      suiteCount: 0,
      // counts all tests inside
      testCount: 2,
      tests: twoTests.map((test) => ({
        ...test,
        fullName: `loads ${test.name}`,
      })),
      pendingTestCount: 0,
    },
  ])
  t.deepEqual(result.testCount, 2)
  t.deepEqual(result.pendingTestCount, 0)
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
      fullName: 'parent',
      name: 'parent',
      type: 'suite',
      pending: false,
      tags: undefined,
      requiredTags: undefined,
      pendingTestCount: 0,
      suites: [
        {
          fullName: 'parent inner1',
          name: 'inner1',
          type: 'suite',
          pending: false,
          tags: undefined,
          requiredTags: undefined,
          suites: [],
          suiteCount: 0,
          testCount: 2,
          tests: twoTests.map((test) => ({
            ...test,
            fullName: `parent inner1 ${test.name}`,
          })),
          pendingTestCount: 0,
        },
        {
          fullName: 'parent inner2',
          name: 'inner2',
          type: 'suite',
          pending: false,
          tags: undefined,
          requiredTags: undefined,
          suites: [],
          suiteCount: 0,
          testCount: 2,
          tests: twoTests.map((test) => ({
            ...test,
            fullName: `parent inner2 ${test.name}`,
          })),
          pendingTestCount: 0,
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
      fullName: 'foo',
      type: 'suite',
      pending: false,
      tags: undefined,
      requiredTags: undefined,
      testCount: 6,
      pendingTestCount: 0,
      suiteCount: 4,
      suites: [
        {
          name: 'child1',
          fullName: 'foo child1',
          type: 'suite',
          pending: false,
          suites: [],
          testCount: 2,
          pendingTestCount: 0,
          suiteCount: 0,
          tests: [
            {
              name: 'bar',
              fullName: 'foo child1 bar',
              tags: undefined,
              requiredTags: undefined,
              type: 'test',
              pending: false,
            },
            {
              name: 'quox',
              fullName: 'foo child1 quox',
              tags: undefined,
              requiredTags: undefined,
              type: 'test',
              pending: false,
            },
          ],
          tags: undefined,
          requiredTags: undefined,
        },
        {
          name: 'child2',
          fullName: 'foo child2',
          type: 'suite',
          pending: false,
          suiteCount: 2,
          testCount: 3,
          pendingTestCount: 0,
          tags: undefined,
          requiredTags: undefined,
          suites: [
            {
              name: 'grandchild1',
              fullName: 'foo child2 grandchild1',
              type: 'suite',
              pending: false,
              suiteCount: 1,
              tags: undefined,
              requiredTags: undefined,
              testCount: 2,
              pendingTestCount: 0,
              suites: [
                {
                  name: 'greatgrandchild1',
                  fullName: 'foo child2 grandchild1 greatgrandchild1',
                  type: 'suite',
                  pending: false,
                  suiteCount: 0,
                  tags: undefined,
                  requiredTags: undefined,
                  testCount: 1,
                  pendingTestCount: 0,
                  suites: [],
                  tests: [
                    {
                      name: 'greatgrandchild1-test',
                      fullName:
                        'foo child2 grandchild1 greatgrandchild1 greatgrandchild1-test',
                      pending: false,
                      tags: undefined,
                      requiredTags: undefined,
                      type: 'test',
                    },
                  ],
                },
              ],
              tests: [
                {
                  name: 'grandchild1-test',
                  fullName: 'foo child2 grandchild1 grandchild1-test',
                  pending: false,
                  tags: undefined,
                  requiredTags: undefined,
                  type: 'test',
                },
              ],
            },
          ],
          tests: [
            {
              name: 'baz',
              fullName: 'foo child2 baz',
              pending: false,
              tags: undefined,
              requiredTags: undefined,
              type: 'test',
            },
          ],
        },
      ],
      tests: [
        {
          name: 'blipp',
          fullName: 'foo blipp',
          tags: undefined,
          requiredTags: undefined,
          type: 'test',
          pending: false,
        },
      ],
    },
  ])
})

test('counts pending tests', (t) => {
  t.plan(3)
  const source = stripIndent`
    describe('foo', () => {
      it.skip('bar', () => {})
    })
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.structure, [
    {
      fullName: 'foo',
      name: 'foo',
      type: 'suite',
      pending: false,
      tags: undefined,
      requiredTags: undefined,
      suiteCount: 0,
      suites: [],
      testCount: 1,
      pendingTestCount: 1,
      tests: [
        {
          fullName: 'foo bar',
          name: 'bar',
          type: 'test',
          pending: true,
          tags: undefined,
          requiredTags: undefined,
        },
      ],
    },
  ])

  t.deepEqual(result.testCount, 1)
  t.deepEqual(result.pendingTestCount, 1)
})
