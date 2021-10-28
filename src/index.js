const acorn = require('acorn')
const walk = require('acorn-walk')

const isDescribe = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'describe'

const isIt = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'it'

const getTags = (source, node) => {
  if (node.arguments[1].type === 'ObjectExpression') {
    // extract any possible tags
    const tags = node.arguments[1].properties.find((node) => {
      return node.key.name === 'tags'
    })
    if (tags) {
      const tagsText = source.slice(tags.start, tags.end)
      return eval(tagsText)
    }
  }
}

/**
 * Returns all suite and test names found in the given JavaScript
 * source code (Mocha / Cypress syntax)
 * @param {string} source
 */
function getTestNames(source) {
  // should we pass the ecma version here?
  let AST
  try {
    AST = acorn.parse(source, { ecmaVersion: 2022, sourceType: 'script' })
  } catch (e) {
    AST = acorn.parse(source, { ecmaVersion: 2022, sourceType: 'module' })
  }

  const suiteNames = []
  const testNames = []
  // mixed entries for describe and tests
  // each entry has name and possibly a list of tags
  const tests = []

  walk.simple(AST, {
    CallExpression(node) {
      if (isDescribe(node)) {
        const suiteInfo = {
          name: node.arguments[0].value,
        }

        const tags = getTags(source, node)
        if (Array.isArray(tags) && tags.length > 0) {
          suiteInfo.tags = tags
        }
        suiteNames.push(suiteInfo.name)
        tests.push(suiteInfo)
      } else if (isIt(node)) {
        const testInfo = {
          name: node.arguments[0].value,
        }

        const tags = getTags(source, node)
        if (Array.isArray(tags) && tags.length > 0) {
          testInfo.tags = tags
        }
        testNames.push(testInfo.name)
        tests.push(testInfo)
      }
    },
  })

  const sortedSuiteNames = suiteNames.sort()
  const sortedTestNames = testNames.sort()
  return {
    suiteNames: sortedSuiteNames,
    testNames: sortedTestNames,
    tests,
  }
}

module.exports = {
  getTestNames,
}
