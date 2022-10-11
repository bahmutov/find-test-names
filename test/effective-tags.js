const { getTestNames, setEffectiveTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('visits each test with effective tags', (t) => {
  t.plan(3)
  const source = stripIndent`
    describe('parent', {tags: '@user'}, () => {
      describe('child', {tags: '@auth'}, () => {
        it('works a', {tags: '@one'}, () => {})
        it('works b', () => {})
      })
    })
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.testCount, 2)

  setEffectiveTags(result.structure)
  const tests = result.structure[0].suites[0].tests
  const firstTestTags = tests[0].effectiveTags
  t.deepEqual(firstTestTags, ['@auth', '@one', '@user'])
  const secondTestTags = tests[1].effectiveTags
  t.deepEqual(secondTestTags, ['@auth', '@user'])
})
