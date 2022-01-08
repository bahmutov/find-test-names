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
  t.deepEqual(s, '  └─ (empty)')
})

test('no tests with indent 2', (t) => {
  t.plan(1)
  const tests = []
  const s = formatTestList(tests, 2)
  t.deepEqual(s, '    └─ (empty)')
})
