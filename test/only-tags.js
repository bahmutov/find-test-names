const { findEffectiveTestTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('finds only tags in a single test', (t) => {
  t.plan(1)
  // confirm "onlyTags" works
  const source = stripIndent`
    it('works', {tags: '@one', onlyTags: '@special'}, () => {})
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    works: { effectiveTags: ['@one'], onlyTags: ['@special'] },
  }
  t.deepEqual(result, expected)
})

test('applies suite only tags to the tests', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {onlyTags: '@special'}, () => {
      it('works', {tags: '@one'}, () => {})
    })
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    'parent works': { effectiveTags: ['@one'], onlyTags: ['@special'] },
  }
  t.deepEqual(result, expected)
})

test('combines suite and test only tags', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {onlyTags: '@special'}, () => {
      it('works', {onlyTags: '@super'}, () => {})
    })
  `
  const result = findEffectiveTestTags(source)
  const expected = {
    'parent works': { effectiveTags: [], onlyTags: ['@special', '@super'] },
  }
  t.deepEqual(result, expected)
})
