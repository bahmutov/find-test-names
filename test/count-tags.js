const { getTestNames, visitEachTest, countTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('tags apply from the suite to the tests', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {tags: '@basic'}, () => {
      it('works a', () => {})
      it('works b', () => {})
    })
  `
  const result = getTestNames(source, true)
  const counts = countTags(result.structure)
  t.deepEqual(counts, { '@basic': 2 })
})

test('tags apply from all parent suites', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {tags: '@basic'}, () => {
      describe('inner', () => {
        it('works a', () => {})
        it('works b', () => {})
      })
    })
  `
  const result = getTestNames(source, true)
  const counts = countTags(result.structure)
  t.deepEqual(counts, { '@basic': 2 })
})

test('combines all tags', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', {tags: '@one'}, () => {
      describe('inner', {tags: ['@two', '@three'] }, () => {
        it('works a', {tags: '@four' }, () => {})
        it('works b', {tags: '@five' }, () => {})
      })
    })
  `
  const result = getTestNames(source, true)
  const counts = countTags(result.structure)
  t.deepEqual(counts, {
    '@one': 2,
    '@two': 2,
    '@three': 2,
    '@four': 1,
    '@five': 1,
  })
})
