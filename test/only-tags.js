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
    // required tag is also an effective tag
    works: { effectiveTags: ['@one', '@special'], requiredTags: ['@special'] },
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
    'parent works': {
      // the required tag from the parent applies to the child test
      // as an effective tag
      effectiveTags: ['@one', '@special'],
      requiredTags: ['@special'],
    },
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
    'parent works': {
      // required tags also act as effective tags
      effectiveTags: ['@special', '@super'],
      requiredTags: ['@special', '@super'],
    },
  }
  t.deepEqual(result, expected)
})
