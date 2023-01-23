const { findEffectiveTestTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('finds only tags in a single test', (t) => {
  t.plan(1)
  // confirm "requiredTags" works
  const source = stripIndent`
    it('works', {tags: '@one', requiredTags: '@special'}, () => {})
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    works: { effectiveTags: ['@one'], requiredTags: ['@special'] },
  }
  t.deepEqual(result, expected)
})

test('applies suite only tags to the tests', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {requiredTags: '@special'}, () => {
      it('works', {tags: '@one'}, () => {})
    })
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    'parent works': { effectiveTags: ['@one'], requiredTags: ['@special'] },
  }
  t.deepEqual(result, expected)
})

test('combines suite and test only tags', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {requiredTags: '@special'}, () => {
      it('works', {requiredTags: '@super'}, () => {})
    })
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    'parent works': { effectiveTags: [], requiredTags: ['@special', '@super'] },
  }
  t.deepEqual(result, expected)
})
