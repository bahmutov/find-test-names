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

const getDescribe = (node, source, pending = false) => {
  const name = extractTestName(node.arguments[0])
  const suiteInfo = {
    name,
    type: 'suite',
  }

  if (pending) {
    suiteInfo.pending = true
  }

  const tags = getTags(source, node)
  if (Array.isArray(tags) && tags.length > 0) {
    suiteInfo.tags = tags
  }

  const suite = {
    name,
    tags: suiteInfo.tags,
    pending,
    type: 'suite',
    tests: [],
    suites: [],
  }

  return { suiteInfo, suite }
}

const getIt = (node, source, pending = false) => {
  const name = extractTestName(node.arguments[0])
  const testInfo = {
    name,
    type: 'test',
  }

  if (pending) {
    testInfo.pending = true
  }

  const tags = getTags(source, node)
  if (Array.isArray(tags) && tags.length > 0) {
    testInfo.tags = tags
  }

  const test = {
    name,
    tags: testInfo.tags,
    pending,
    type: 'test',
  }

  return { testInfo, test }
}

/**
 * This function returns a tree structure which contains the test and all of its new suite parents.
 *
 * Loops over the ancestor nodes of a it / it.skip node
 * until it finds an already known suite node or the top of the tree.
 *
 * It uses a suite cache by node to make sure
 * subsequently found tests will stop traversing at already known suites.
 *
 * Technical details:
 *   acorn-walk does depth first traversal,
 *   i.e. walk.ancestor is called with the deepest node first, usually an "it",
 *   and a list of its ancestors. (other AST walkers travserse from the top)
 *
 *   Since the tree generation starts from it nodes, this function cannot find
 *   suites without tests.
 *   This is handled by getOrphanSuiteAncestorsForSuite
 *
 */
const getSuiteAncestorsForTest = (test, source, ancestors, nodes) => {
  let knownNode = false
  let prevSuite
  let describeFound = false

  for (var i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i]
    const describe = isDescribe(node)
    const skip = isDescribeSkip(node)

    if (describe || skip) {
      let suite

      knownNode = nodes.has(node.callee)

      if (knownNode) {
        suite = nodes.get(node.callee)
      } else {
        const result = getDescribe(node, source, skip)
        suite = result.suite
        nodes.set(node.callee, suite)
      }

      if (prevSuite) {
        suite.suites.push(prevSuite)
      }

      if (!describeFound) {
        // found this test's describe
        suite.tests.push(test)

        describeFound = true
      }

      if (knownNode) {
        break
      }

      prevSuite = suite
    }
  }

  if (!knownNode) {
    // walked tree to the top
    if (describeFound) {
      return prevSuite
    } else {
      // top level test
      return test
    }
  }

  return null
}

/**
 * Returns all suite and test names found in the given JavaScript
 * source code (Mocha / Cypress syntax)
 * @param {string} source
 */
function getTestNames(source, withStructure) {
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

  // Map of known nodes keyed: callee => value: suite
  let nodes = new Map()

  // Tree of describes and tests
  let structure = []

  walk.ancestor(
    AST,
    {
      CallExpression(node, ancestors) {
        if (isDescribe(node)) {
          const { suiteInfo } = getDescribe(node, source)

          debug('found describe "%s"', suiteInfo.name)

          suiteNames.push(suiteInfo.name)
          tests.push(suiteInfo)
        } else if (isDescribeSkip(node)) {
          const { suiteInfo } = getDescribe(node, source, true)

          debug('found describe.skip "%s"', suiteInfo.name)

          suiteNames.push(suiteInfo.name)
          tests.push(suiteInfo)
        } else if (isIt(node)) {
          const { testInfo, test } = getIt(node, source)

          debug('found test "%s"', testInfo.name)

          const suiteOrTest = getSuiteAncestorsForTest(
            test,
            source,
            ancestors,
            nodes,
          )

          if (suiteOrTest) {
            structure.push(suiteOrTest)
          }

          testNames.push(testInfo.name)
          tests.push(testInfo)
        } else if (isItSkip(node)) {
          const { testInfo, test } = getIt(node, source, true)
          debug('found it.skip "%s"', testInfo.name)

          const suiteOrTest = getSuiteAncestorsForTest(
            test,
            source,
            ancestors,
            nodes,
          )

          if (suiteOrTest) {
            structure.push(suiteOrTest)
          }

          testNames.push(testInfo.name)
          tests.push(testInfo)
        }
      },
    },
    proxy,
  )

  const sortedSuiteNames = suiteNames.sort()
  const sortedTestNames = testNames.sort()
  const result = {
    suiteNames: sortedSuiteNames,
    testNames: sortedTestNames,
    tests,
  }

  if (withStructure) {
    result.structure = structure
  }

  return result
}

module.exports = {
  getTestNames,
}
