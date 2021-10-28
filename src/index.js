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
      if (tags.value.type === 'ArrayExpression') {
        const tagsText = source.slice(tags.start, tags.end)
        return eval(tagsText)
      } else if (tags.value.type === 'Literal') {
        return [tags.value.value]
      }
    }
  }
}

// extracts the test name from the literal or template literal node
const extractTestName = (node) => {
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((q) => q.value.cooked.trim()).join(' ')
  } else if (node.type === 'Literal') {
    return node.value
  }
  throw new Error(`Unsupported node type: ${node.type}`)
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
        const name = extractTestName(node.arguments[0])
        const suiteInfo = {
          name,
        }

        const tags = getTags(source, node)
        if (Array.isArray(tags) && tags.length > 0) {
          suiteInfo.tags = tags
        }
        suiteNames.push(name)
        tests.push(suiteInfo)
      } else if (isIt(node)) {
        const name = extractTestName(node.arguments[0])
        const testInfo = {
          name,
        }

        const tags = getTags(source, node)
        if (Array.isArray(tags) && tags.length > 0) {
          testInfo.tags = tags
        }
        testNames.push(name)
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
