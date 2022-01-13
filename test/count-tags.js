const { getTestNames, visitEachTest, countTags } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('tags apply from the suite to the tests', (t) => {
  t.plan(0)
  const source = stripIndent`
    describe('parent', {tags: '@basic'}, () => {
      it('works a', () => {})
      it('works b', () => {})
    })
  `
  const result = getTestNames(source, true)
  const counts = countTags(result.structure)
  console.log(counts)
})
