const { findEffectiveTestTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('applies required tags to the tests inside the suite', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {requiredTags: '@top'}, () => {
      describe('child', () => {
        it('works a', () => {})
        it('works b', () => {})
      })
    })
  `
  const result = findEffectiveTestTags(source)
  // the required tags ARE effective tags too
  const expected = {
    'parent child works a': {
      effectiveTags: ['@top'],
      requiredTags: ['@top'],
    },
    'parent child works b': {
      effectiveTags: ['@top'],
      requiredTags: ['@top'],
    },
  }
  t.deepEqual(result, expected)
})
