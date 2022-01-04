const babel = require('@babel/parser')
const walk = require('acorn-walk')
const debug = require('debug')('find-test-names')

const isDescribe = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'describe'

const isDescribeSkip = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.object.name === 'describe' &&
  node.callee.property.name === 'skip'

const isIt = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'it'

const isItSkip = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.object.name === 'it' &&
  node.callee.property.name === 'skip'

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

const plugins = [
  'estree', // To generate estree compatible AST
  'typescript',
]

function ignore(_node, _st, _c) {}

const base = walk.make({})

/**
 * The proxy ignores all AST nodes for which acorn has no base visitor.
 * This includes TypeScript specific nodes like TSInterfaceDeclaration,
 * but also babel-specific nodes like ClassPrivateProperty.
 *
 * Since describe / it are CallExpressions, ignoring nodes should not affect
 * the test name extraction.
 */
const proxy = new Proxy(base, {
  get: function (target, prop) {
    if (target[prop]) {
      return Reflect.get(...arguments)
    }

    return ignore
  },
})

/**
 * Returns all suite and test names found in the given JavaScript
 * source code (Mocha / Cypress syntax)
 * @param {string} source
 */
function getTestNames(source) {
  // should we pass the ecma version here?
  let AST
  try {
    debug('parsing source as a script')
    AST = babel.parse(source, {
      plugins,
      sourceType: 'script',
    }).program
    debug('success!')
  } catch (e) {
    debug('parsing source as a module')
    AST = babel.parse(source, {
      plugins,
      sourceType: 'module',
    }).program
    debug('success!')
  }

  const suiteNames = []
  const testNames = []
  // mixed entries for describe and tests
  // each entry has name and possibly a list of tags
  const tests = []

  walk.simple(
    AST,
    {
      CallExpression(node) {
        if (isDescribe(node)) {
          const name = extractTestName(node.arguments[0])
          debug('found describe "%s"', name)
          const suiteInfo = {
            name,
            type: 'suite',
          }

          const tags = getTags(source, node)
          if (Array.isArray(tags) && tags.length > 0) {
            suiteInfo.tags = tags
          }
          suiteNames.push(name)
          tests.push(suiteInfo)
        } else if (isDescribeSkip(node)) {
          const name = extractTestName(node.arguments[0])
          debug('found describe.skip "%s"', name)
          const suiteInfo = {
            name,
            type: 'suite',
            pending: true,
          }

          const tags = getTags(source, node)
          if (Array.isArray(tags) && tags.length > 0) {
            suiteInfo.tags = tags
          }
          suiteNames.push(name)
          tests.push(suiteInfo)
        } else if (isIt(node)) {
          const name = extractTestName(node.arguments[0])
          debug('found test "%s"', name)
          const testInfo = {
            type: 'test',
            name,
          }

          const tags = getTags(source, node)
          if (Array.isArray(tags) && tags.length > 0) {
            testInfo.tags = tags
          }
          testNames.push(name)
          tests.push(testInfo)
        } else if (isItSkip(node)) {
          const name = extractTestName(node.arguments[0])
          debug('found it.skip "%s"', name)

          const testInfo = {
            name,
            type: 'test',
            pending: true,
          }

          const tags = getTags(source, node)
          if (Array.isArray(tags) && tags.length > 0) {
            testInfo.tags = tags
          }
          testNames.push(name)
          tests.push(testInfo)
        }
        //  else {
        //   console.log(node)
        // }
      },
    },
    proxy,
  )

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
