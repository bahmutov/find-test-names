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
