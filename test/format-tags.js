const { stripIndent } = require('common-tags')
const test = require('ava')
const { formatTestList } = require('../src/format-test-list')

test('tests with tags', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'first',
      tags: ['tag1', 'tag2'],
    },
    {
      name: 'second',
      tags: ['@sanity'],
    },
    {
      name: 'last',
      tags: undefined,
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      ├─ first [tag1, tag2]
      ├─ second [@sanity]
      └─ last
    `,
  )
})

test('suite with tags', (t) => {
  t.plan(1)
  const tests = [
    {
      name: 'parent suite',
      tags: ['@user'],
      type: 'suite',
    },
  ]
  const s = formatTestList(tests)
  t.deepEqual(
    s,
    stripIndent`
      └─ parent suite [@user]
        └─ (empty)
    `,
  )
})
