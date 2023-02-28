const { stripIndent } = require('common-tags')
const { getTestNames } = require('..')
const test = require('ava')

// https://github.com/bahmutov/find-test-names/issues/64
test.skip('jsx', (t) => {
  t.plan(0)
  const source = stripIndent`
    describe('parent', () => {
      it('has jsx component', () => {
        cy.mount(<Counter />)
      })
    })
  `
  const result = getTestNames(source)
  console.log(result)
})
