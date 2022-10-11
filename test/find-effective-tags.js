const { findEffectiveTestTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('finds effective test tags for each test', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {tags: '@user'}, () => {
      describe('child', {tags: '@auth'}, () => {
        it('works a', {tags: '@one'}, () => {})
        it('works b', () => {})
      })
    })
    it('sits at the top', {tags: '@root'}, () => {})
    it.skip('has no tags')
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    'sits at the top': ['@root'],
    'parent child works a': ['@auth', '@one', '@user'],
    'parent child works b': ['@auth', '@user'],
    'has no tags': [],
  }
  t.deepEqual(result, expected)
})
