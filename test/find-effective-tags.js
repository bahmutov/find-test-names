const { findEffectiveTestTags, findEffectiveTestTagsIn } = require('../src')
const { stripIndent } = require('common-tags')
const { join } = require('path')
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
    'sits at the top': { effectiveTags: ['@root'] },
    'parent child works a': { effectiveTags: ['@auth', '@one', '@user'] },
    'parent child works b': { effectiveTags: ['@auth', '@user'] },
    'has no tags': { effectiveTags: [] },
  }
  t.deepEqual(result, expected)
})

test('finds effective test tags in a file', (t) => {
  t.plan(1)
  const specFilename = join(__dirname, '..', 'test-cy', 'spec-a.js')
  const result = findEffectiveTestTagsIn(specFilename)
  const expected = {
    'Suite A works 1': { effectiveTags: [] },
    'Suite A works 2': { effectiveTags: ['A'] },
  }
  t.deepEqual(result, expected)
})
