const babel = require('@babel/parser')
const walk = require('acorn-walk')
const debug = require('debug')('find-test-names')
const { formatTestList } = require('./format-test-list')

const isDescribeName = (name) => name === 'describe' || name === 'context'

const isDescribe = (node) =>
  node.type === 'CallExpression' && isDescribeName(node.callee.name)

const isDescribeSkip = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  isDescribeName(node.callee.object.name) &&
  node.callee.property.name === 'skip'

const isIt = (node) =>
  node.type === 'CallExpression' && node.callee.name === 'it'

const isItSkip = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.object.name === 'it' &&
  node.callee.property.name === 'skip'

const getTags = (source, node) => {
  if (node.arguments.length < 2) {
    // pending tests don't have tags
    return
  }

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
    pending,
  }

  if (pending) {
    suiteInfo.pending = true
  }

  if (!pending) {
    // the suite might be pending by the virtue of only having the name
    // example: describe("is pending")
    if (node.arguments.length === 1) {
      suiteInfo.pending = true
    }
  }

  const tags = getTags(source, node)
  if (Array.isArray(tags) && tags.length > 0) {
    suiteInfo.tags = tags
  }

  const suite = {
    name,
    tags: suiteInfo.tags,
    pending: suiteInfo.pending,
    type: 'suite',
    tests: [],
    suites: [],
    testCount: 0,
    suiteCount: 0,
  }

  return { suiteInfo, suite }
}

const getIt = (node, source, pending = false) => {
  const name = extractTestName(node.arguments[0])
  const testInfo = {
    name,
    type: 'test',
    pending,
  }

  if (!pending) {
    // the test might be pending by the virtue of only having the name
    // example: it("is pending")
    if (node.arguments.length === 1) {
      testInfo.pending = true
    }
  }

  const tags = getTags(source, node)
  if (Array.isArray(tags) && tags.length > 0) {
    testInfo.tags = tags
  }

  const test = {
    name,
    tags: testInfo.tags,
    pending: testInfo.pending,
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
 * It uses a suite cache by node to make sure no tests / suites are added twice.
 * It still has to walk the whole tree for every test in order to aggregate the suite / test counts.
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
  let suiteCount = 0

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
        suiteCount++
        suite.suites.push(prevSuite)
      }

      if (!describeFound) {
        // found this test's describe
        suite.tests.push(test)

        describeFound = true
      }

      suite.testCount++
      suite.suiteCount += suiteCount

      prevSuite = knownNode ? null : suite
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
 * This function is used to find (nested) empty describes.
 *
 * Loops over the ancestor nodes of a describe / describe.skip node
 * and return a tree of unknown suites.
 *
 * It uses the same nodes cache as getSuiteAncestorsForTest to make sure
 * no suites are added twice / no unnecessary nodes are walked.
 */
const getOrphanSuiteAncestorsForSuite = (ancestors, source, nodes) => {
  let prevSuite
  let knownNode = false
  let suiteCount = 0

  for (var i = ancestors.length - 1; i >= 0; i--) {
    // in the first iteration the ancestor is identical to the node
    const ancestor = ancestors[i]

    const describe = isDescribe(ancestor)
    const skip = isDescribeSkip(ancestor)

    if (describe || skip) {
      if (nodes.has(ancestor.callee)) {
        if (i === 0) {
          // If the deepest node in the tree is known, we don't need to walk up
          break
        }

        // Reached an already known suite
        knownNode = true
        const suite = nodes.get(ancestor.callee)

        if (prevSuite) {
          // Add new child suite to suite
          suite.suites.push(prevSuite)
          prevSuite = null
        }

        suite.suiteCount += suiteCount
      } else {
        const { suite } = getDescribe(ancestor, source, skip)

        if (prevSuite) {
          suite.suites.push(prevSuite)
          suite.suiteCount += suiteCount
        }

        suiteCount++

        nodes.set(ancestor.callee, suite)
        prevSuite = knownNode ? null : suite
      }
    }
  }

  if (!knownNode) {
    // walked tree to the top and found new suite(s)
    return prevSuite
  }

  return null
}

function countPendingTests(suite) {
  if (!suite.type === 'suite') {
    throw new Error('Expected suite')
  }

  const pendingTestsN = suite.tests.reduce((count, test) => {
    if (test.type === 'test' && test.pending) {
      return count + 1
    }
    return count
  }, 0)

  const pendingTestsInSuitesN = suite.suites.reduce((count, suite) => {
    const pending = countPendingTests(suite)
    suite.pendingTestCount = pending
    return count + pending
  }, 0)

  return pendingTestsN + pendingTestsInSuitesN
}

/**
 * Looks at the tests and counts how many tests in each suite
 * are pending. The parent suites use the sum of the inner
 * suite counts.
 * Warning: modifies the input structure
 */
function countTests(structure) {
  let testCount = 0
  let pendingTestCount = 0
  structure.forEach((t) => {
    if (t.type === 'suite') {
      testCount += t.testCount
      const pending = countPendingTests(t)
      if (typeof pending !== 'number') {
        console.error(t)
        throw new Error('Could not count pending tests')
      }
      t.pendingTestCount = pending
      pendingTestCount += pending
    } else {
      testCount += 1
      if (t.pending) {
        pendingTestCount += 1
      }
    }
  })
  return { testCount, pendingTestCount }
}

/**
 * Synchronous tree walker, calls the given callback for each test.
 * @param {object} structure
 * @param {function} fn Receives the test as argument
 */
function visitEachTest(structure, fn) {
  structure.forEach((t) => {
    if (t.type === 'suite') {
      visitEachTest(t.tests, fn)
      visitEachTest(t.suites, fn)
    } else {
      fn(t)
    }
  })
}

/**
 * Counts the tags found on the tests.
 * @param {object} structure
 * @returns {object} with tags as keys and counts for each
 */
function countTags(structure) {
  const tags = {}
  visitEachTest(structure, (test) => {
    if (!test.tags) {
      return
    }
    // normalize the tags to be an array of strings
    const list = [].concat(test.tags)
    list.forEach((tag) => {
      if (!(tag in tags)) {
        tags[tag] = 1
      } else {
        tags[tag] += 1
      }
    })
  })

  return tags
}

/**
 * Returns all suite and test names found in the given JavaScript
 * source code (Mocha / Cypress syntax)
 * @param {string} source
 * @param {boolean} withStructure - return nested structure of suites and tests
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

          const suite = getOrphanSuiteAncestorsForSuite(
            ancestors,
            source,
            nodes,
          )

          if (suite) {
            structure.push(suite)
          }

          suiteNames.push(suiteInfo.name)
          tests.push(suiteInfo)
        } else if (isDescribeSkip(node)) {
          const { suiteInfo } = getDescribe(node, source, true)

          debug('found describe.skip "%s"', suiteInfo.name)

          const suite = getOrphanSuiteAncestorsForSuite(
            ancestors,
            source,
            nodes,
          )

          if (suite) {
            structure.push(suite)
          }

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
    const counts = countTests(structure)
    result.structure = structure
    result.testCount = counts.testCount
    result.pendingTestCount = counts.pendingTestCount
  }

  return result
}

module.exports = {
  getTestNames,
  formatTestList,
  countTests,
  visitEachTest,
  countTags,
}
