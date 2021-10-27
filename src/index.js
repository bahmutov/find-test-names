const acorn = require('acorn')
const walk = require('acorn-walk')

const isDescribe = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'describe'

const isIt = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'it'

function getTestNames(source) {
  // should we pass the ecma version here?
  const AST = acorn.parse(source, { ecmaVersion: 6 })

  const suiteNames = []
  const testNames = []

  walk.simple(AST, {
    CallExpression(node) {
      if (isDescribe(node)) {
        suiteNames.push(node.arguments[0].value)
      } else if (isIt(node)) {
        testNames.push(node.arguments[0].value)
      }
    },
  })

  const sortedSuiteNames = suiteNames.sort()
  const sortedTestNames = testNames.sort()
  return {
    suiteNames: sortedSuiteNames,
    testNames: sortedTestNames,
  }
}

module.exports = {
  getTestNames,
}
