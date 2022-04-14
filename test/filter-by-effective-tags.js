const {
  getTestNames,
  setEffectiveTags,
  filterByEffectiveTags,
} = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('filters tests by effective tags', (t) => {
  t.plan(8)
  const source = stripIndent`
    describe('parent', {tags: '@user'}, () => {
      describe('parent', {tags: '@auth'}, () => {
        it('works a', {tags: '@one'}, () => {})
        it('works b', () => {})
      })
    })
    describe('outside', {tags: '@new'}, () => {
      it('works c', () => {})
    })
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.testCount, 3)

  setEffectiveTags(result.structure)
  const testsOne = filterByEffectiveTags(result.structure, ['@one'])
  // finds a single test
  t.deepEqual(testsOne.length, 1)
  t.deepEqual(testsOne[0].name, 'works a')

  const testsNew = filterByEffectiveTags(result.structure, ['@new'])
  // finds a single test
  t.deepEqual(testsNew.length, 1)
  t.deepEqual(testsNew[0].name, 'works c')

  const testsAuth = filterByEffectiveTags(result.structure, ['@auth'])
  t.deepEqual(testsAuth.length, 2)
  t.deepEqual(testsAuth[0].name, 'works a')
  t.deepEqual(testsAuth[1].name, 'works b')
})
