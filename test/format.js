const { stripIndent } = require('common-tags')
const test = require('ava')
const { formatTestList } = require('../src/format-test-list')

test('just tests', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'first',
    },
    {
      name: 'second',
    },
    {
      name: 'last',
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      ├─ first
      ├─ second
      └─ last
    `,
  )
})

test('suite with tests', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'parent suite',
      type: 'suite',
      tests: [
        {
          name: 'first',
        },
        {
          name: 'second',
        },
        {
          name: 'last',
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      └─ parent suite
        ├─ first
        ├─ second
        └─ last
    `,
  )
})

test('two suites', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'suite A',
      type: 'suite',
      tests: [
        {
          name: 'first',
        },
        {
          name: 'second',
        },
        {
          name: 'last',
        },
      ],
    },
    {
      name: 'suite B',
      type: 'suite',
      tests: [
        {
          name: 'first',
        },
        {
          name: 'second',
        },
        {
          name: 'last',
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      ├─ suite A
        ├─ first
        ├─ second
        └─ last
      └─ suite B
        ├─ first
        ├─ second
        └─ last
    `,
  )
})

test('nested suites', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'suite A',
      type: 'suite',
      tests: [
        {
          name: 'first',
        },
        {
          name: 'second',
        },
        {
          name: 'suite B',
          type: 'suite',
          tests: [
            {
              name: 'test a',
            },
            {
              name: 'test b',
            },
          ],
        },
        {
          name: 'last',
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      └─ suite A
        ├─ first
        ├─ second
        ├─ suite B
          ├─ test a
          └─ test b
        └─ last
    `,
  )
})

test('three suites', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'suite A',
      type: 'suite',
      tests: [
        {
          name: 'suite B',
          type: 'suite',
          tests: [
            {
              name: 'suite C',
              type: 'suite',
              tests: [
                {
                  name: 'test a',
                },
                {
                  name: 'test b',
                },
              ],
            },
          ],
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      └─ suite A
        └─ suite B
          └─ suite C
            ├─ test a
            └─ test b
    `,
  )
})

test('no tests', (t) => {
  t.plan(1)
  const tests = []
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      └─ (empty)
    `,
  )
})

test('no tests with indent 1', (t) => {
  t.plan(1)
  const tests = []
  const s = formatTestList(tests, 1)
  t.deepEqual(s, '└─ (empty)')
})

test('no tests with indent 2', (t) => {
  t.plan(1)
  const tests = []
  const s = formatTestList(tests, 2)
  t.deepEqual(s, '  └─ (empty)')
})

test('pending test', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'first',
    },
    {
      name: 'second',
      pending: true,
    },
    {
      name: 'last',
      pending: true,
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      ├─ first
      ├⊙ second
      └⊙ last
    `,
  )
})

test('pending suite', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'pending suite',
      type: 'suite',
      pending: true,
      tests: [
        {
          name: 'a test',
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      └⊙ pending suite
        └─ a test
    `,
  )
})

// https://github.com/bahmutov/find-test-names/issues/15
test('inner suite', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'parent suite',
      tags: ['@main'],
      pending: false,
      type: 'suite',
      tests: [{ name: 'works', tags: undefined, pending: false, type: 'test' }],
      suites: [
        {
          name: 'inner suite',
          tags: undefined,
          pending: false,
          type: 'suite',
          tests: [
            {
              name: 'shows something',
              tags: ['@user'],
              pending: false,
              type: 'test',
            },
          ],
          suites: [],
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
    └─ parent suite [@main]
      ├─ works
      └─ inner suite
        └─ shows something [@user]
    `,
  )
})

// https://github.com/bahmutov/find-test-names/issues/18
test('vertical bars', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'suite A',
      type: 'suite',
      suites: [
        {
          name: 'inner one',
          type: 'suite',
        },
        {
          name: 'inner two',
          type: 'suite',
        },
      ],
      tests: [
        {
          name: 'works',
          type: 'test',
        },
      ],
    },
  ]
  const s = formatTestList(tests)
  // console.log(s)
  t.deepEqual(
    s,
    stripIndent`
      └─ suite A
        ├─ works
        ├─ inner one
            └─ (empty)
        └─ inner two
            └─ (empty)
    `,
  )
})
