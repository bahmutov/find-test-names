const { findEffectiveTestTagsIn } = require('../src')
const test = require('ava')
const path = require('path')

test('individual tags imported from another file', (t) => {
  t.plan(0)

  const fullName = path.join(__dirname, './fixture1/spec1.cy.js')
  const result = findEffectiveTestTagsIn(fullName)
  console.log(result)
})
