const { stripIndent } = require('common-tags')
const { getTestNames } = require('..')
const test = require('ava')

// https://github.com/bahmutov/find-test-names/issues/64
test('jsx', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', () => {
      it('has jsx component', () => {
        cy.mount(<Counter />)
      })
    })
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['parent'],
    testNames: ['has jsx component'],
    tests: [
      { type: 'test', pending: false, name: 'has jsx component' },
      { type: 'suite', pending: false, name: 'parent' },
    ],
  })
})
