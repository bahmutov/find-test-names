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
  console.log(s)
  t.deepEqual(
    s,
    stripIndent`
      ├─ first
      ├─ second
      └─ last
    `,
  )
})
