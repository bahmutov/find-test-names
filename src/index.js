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
  node.type === 'CallExpression' &&
  (node.callee.name === 'it' || node.callee.name === 'specify')

const isItSkip = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  (node.callee.object.name === 'it' || node.callee.object.name === 'specify') &&
  node.callee.property.name === 'skip'

const isItOnly = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  (node.callee.object.name === 'it' || node.callee.object.name === 'specify') &&
  node.callee.property.name === 'only'

/**
 * Finds "tags" field in the test node.
 * Could be a single string or an array of strings.
 *
 * it('name', {tags: '@smoke'}, () => ...)
 */
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

/**
 * Finds the "requiredTags" field in the test node.
 * Could be a single string or an array of strings.
 *
 * it('name', {requiredTags: '@smoke'}, () => ...)
 */
const getRequiredTags = (source, node) => {
  if (node.arguments.length < 2) {
    // pending tests don't have tags
    return
  }

  if (node.arguments[1].type === 'ObjectExpression') {
    // extract any possible tags
    const tags = node.arguments[1].properties.find((node) => {
      return node.key.name === 'requiredTags'
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
// if the test name is a variable, returns undefined
const extractTestName = (node) => {
  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((q) => q.value.cooked.trim()).join(' ')
  } else if (node.type === 'Literal') {
    return node.value
  } else {
    debug('Not sure how to get the test name from this source node')
    debug(node)
    return undefined
  }
}

const plugins = [
  'jsx',
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
    type: 'suite',
    pending,
  }
  if (typeof name !== 'undefined') {
    suiteInfo.name = name
  }

  if (pending) {
    suiteInfo.pending = true
  }

  if (!pending) {
    // the suite might be pending by the virtue of only having the name
    // example: describe("is pending")
    if (node.arguments.length === 1) {
      suiteInfo.pending = true
    } else if (
      node.arguments.length === 2 &&
      node.arguments[1].type === 'ObjectExpression'
    ) {
      // the suite has a name and a config object
      // but now callback, thus it is pending
      suiteInfo.pending = true
    }
  }

  const tags = getTags(source, node)
  if (Array.isArray(tags) && tags.length > 0) {
    suiteInfo.tags = tags
  }

  const requiredTags = getRequiredTags(source, node)
  if (Array.isArray(requiredTags) && requiredTags.length > 0) {
    suiteInfo.requiredTags = requiredTags
  }

  const suite = {
    name,
    tags: suiteInfo.tags,
    requiredTags: suiteInfo.requiredTags,
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
    type: 'test',
    pending,
  }
  if (typeof name !== 'undefined') {
    testInfo.name = name
  }

  if (!pending) {
    // the test might be pending by the virtue of only having the name
    // example: it("is pending")
    if (node.arguments.length === 1) {
      testInfo.pending = true
    } else if (
      node.arguments.length === 2 &&
      node.arguments[1].type === 'ObjectExpression'
    ) {
      // the test has a name and a config object
      // but now callback, thus it is pending
      testInfo.pending = true
    }
  }

  const tags = getTags(source, node)
  if (Array.isArray(tags) && tags.length > 0) {
    testInfo.tags = tags
  }
  const requiredTags = getRequiredTags(source, node)
  if (Array.isArray(requiredTags) && requiredTags.length > 0) {
    testInfo.requiredTags = requiredTags
  }

  const test = {
    name,
    tags: testInfo.tags,
    requiredTags: testInfo.requiredTags,
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
 *   and a list of its ancestors. (other AST walkers traverse from the top)
 *
 *   Since the tree generation starts from it nodes, this function cannot find
 *   suites without tests.
 *   This is handled by getOrphanSuiteAncestorsForSuite
 *
 */
const getSuiteAncestorsForTest = (
  test,
  source,
  ancestors,
  nodes,
  fullSuiteNames,
) => {
  let knownNode = false
  let suiteBranches = []
  let prevSuite
  let directParentSuite = null
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

      if (!directParentSuite) {
        // found this test's direct parent suite
        directParentSuite = suite
      }

      suite.testCount++
      suite.suiteCount += suiteCount

      prevSuite = knownNode ? null : suite
      suiteBranches.unshift(suite)
    }
  }

  // walked tree to the top
  if (suiteBranches.length) {
    // Compute the full names of suite and test, i.e. prepend all parent suite names
    const suiteNameWithParentSuiteNames = computeParentSuiteNames(
      suiteBranches,
      fullSuiteNames,
    )

    test.fullName = `${suiteNameWithParentSuiteNames} ${test.name}`

    directParentSuite.tests.push(test)

    return {
      suite: !knownNode && prevSuite, // only return the suite if it hasn't been found before
      topLevelTest: false,
    }
  } else {
    // top level test
    test.fullName = test.name
    return { suite: null, topLevelTest: true }
  }
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
const getOrphanSuiteAncestorsForSuite = (
  ancestors,
  source,
  nodes,
  fullSuiteNames,
) => {
  let prevSuite
  let suiteBranches = []
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
        suiteBranches.unshift(suite)
      } else {
        const { suite } = getDescribe(ancestor, source, skip)

        if (prevSuite) {
          suite.suites.push(prevSuite)
          suite.suiteCount += suiteCount
        }

        suiteCount++

        nodes.set(ancestor.callee, suite)
        prevSuite = knownNode ? null : suite
        suiteBranches.unshift(suite)
      }
    }
  }

  computeParentSuiteNames(suiteBranches, fullSuiteNames)

  if (!knownNode) {
    // walked tree to the top and found new suite(s)
    return prevSuite
  }

  return null
}

/**
 * Compute the full names of suites in an array of branches, i.e. prepend all parent suite names
 */
function computeParentSuiteNames(suiteBranches, fullSuiteNames) {
  let suiteNameWithParentSuiteNames = ''

  suiteBranches.forEach((suite) => {
    suite.fullName = `${suiteNameWithParentSuiteNames} ${suite.name}`.trim()
    fullSuiteNames.add(suite.fullName)

    suiteNameWithParentSuiteNames = suite.fullName
  })

  return suiteNameWithParentSuiteNames
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

function collectSuiteTagsUp(suite) {
  const tags = []
  while (suite) {
    tags.push(...(suite.tags || []))
    suite = suite.parent
  }
  return tags
}

function collectSuiteRequiredTagsUp(suite) {
  const tags = []
  while (suite) {
    tags.push(...(suite.requiredTags || []))
    suite = suite.parent
  }
  return tags
}

/**
 * Synchronous tree walker, calls the given callback for each test.
 * @param {object} structure
 * @param {function} fn Receives the test as argument
 */
function visitEachTest(structure, fn, parentSuite) {
  structure.forEach((t) => {
    if (t.type === 'suite') {
      visitEachTest(t.tests, fn, t)
      visitEachTest(t.suites, fn)
    } else {
      fn(t, parentSuite)
    }
  })
}

function visitEachNode(structure, fn, parentSuite) {
  structure.forEach((t) => {
    fn(t, parentSuite)
    if (t.type === 'suite') {
      visitEachNode(t.tests, fn, t)
      visitEachNode(t.suites, fn, t)
    }
  })
}

function concatTags(tags, requiredTags) {
  return [].concat(tags || []).concat(requiredTags || [])
}

/**
 * Counts the tags found on the tests.
 * @param {object} structure
 * @returns {object} with tags as keys and counts for each
 */
function countTags(structure) {
  setParentSuite(structure)

  const tags = {}
  visitEachTest(structure, (test, parentSuite) => {
    // normalize the tags to be an array of strings
    const list = concatTags(test.tags, test.requiredTags)
    list.forEach((tag) => {
      if (!(tag in tags)) {
        tags[tag] = 1
      } else {
        tags[tag] += 1
      }
    })

    // also consider the effective tags by traveling up
    // the parent chain of suites
    const suiteTags = collectSuiteTagsUp(parentSuite)
    suiteTags.forEach((tag) => {
      if (!(tag in tags)) {
        tags[tag] = 1
      } else {
        tags[tag] += 1
      }
    })

    // plus the required tag up the chain of parents
    const suiteRequiredTags = collectSuiteRequiredTagsUp(parentSuite)
    suiteRequiredTags.forEach((tag) => {
      if (!(tag in tags)) {
        tags[tag] = 1
      } else {
        tags[tag] += 1
      }
    })
  })

  return tags
}

function combineTags(tags, suiteTags) {
  // normalize the tags to be an array of strings
  const ownTags = [].concat(tags || [])
  const allTags = [...ownTags, ...suiteTags]
  const uniqueTags = [...new Set(allTags)]
  const sortedTags = [...new Set(uniqueTags)].sort()
  return sortedTags
}

/**
 * Visits each test and counts its tags and its parents' tags
 * to compute the "effective" tags list.
 */
function setEffectiveTags(structure) {
  setParentSuite(structure)

  visitEachTest(structure, (test, parentSuite) => {
    // also consider the effective tags by traveling up
    // the parent chain of suites
    const suiteTags = collectSuiteTagsUp(parentSuite)
    test.effectiveTags = combineTags(test.tags, suiteTags)

    // collect the required tags up the suite parents
    const suiteRequiredTags = collectSuiteRequiredTagsUp(parentSuite)
    test.requiredTags = combineTags(test.requiredTags, suiteRequiredTags)

    // note, the required tags are also EFFECTIVE tags, so combine them
    test.effectiveTags = [...test.effectiveTags, ...test.requiredTags].sort()
  })

  return structure
}

/**
 * Visits each individual test in the structure and checks if it
 * has any effective tags from the given list.
 */
function filterByEffectiveTags(structure, tags) {
  if (typeof structure === 'string') {
    // we got passed the input source code
    // so let's parse it first
    const result = getTestNames(structure, true)
    setEffectiveTags(result.structure)
    return filterByEffectiveTags(result.structure, tags)
  }

  const filteredTests = []
  visitEachTest(structure, (test) => {
    const hasTag = tags.some((tag) => test.effectiveTags.includes(tag))
    if (hasTag) {
      filteredTests.push(test)
    }
  })
  return filteredTests
}

function setParentSuite(structure) {
  visitEachNode(structure, (test, parentSuite) => {
    if (parentSuite) {
      test.parent = parentSuite
    }
  })
}

function getLeadingComment(ancestors) {
  if (ancestors.length > 1) {
    const a = ancestors[ancestors.length - 2]
    if (a.leadingComments && a.leadingComments.length) {
      // grab the last comment line
      const firstComment = a.leadingComments[a.leadingComments.length - 1]
      if (firstComment.type === 'CommentLine') {
        const leadingComment = firstComment.value
        if (leadingComment.trim()) {
          return leadingComment.trim()
        }
      }
    }
  }
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
  // suite names with parent suite names prepended
  const fullSuiteNames = new Set()
  // test names with parent suite names prepended
  const fullTestNames = []
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
            fullSuiteNames,
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
            fullSuiteNames,
          )

          if (suite) {
            structure.push(suite)
          }

          suiteNames.push(suiteInfo.name)
          tests.push(suiteInfo)
        } else if (isIt(node)) {
          const { testInfo, test } = getIt(node, source)

          debug('found test "%s"', testInfo.name)
          const comment = getLeadingComment(ancestors)
          if (comment) {
            testInfo.comment = comment
            debug('found leading test comment "%s", comment')
          }

          const { suite, topLevelTest } = getSuiteAncestorsForTest(
            test,
            source,
            ancestors,
            nodes,
            fullSuiteNames,
          )

          if (suite) {
            structure.push(suite)
          } else if (topLevelTest) {
            structure.push(test)
          }

          if (typeof testInfo.name !== 'undefined') {
            testNames.push(testInfo.name)
            fullTestNames.push(test.fullName)
          }

          tests.push(testInfo)
        } else if (isItSkip(node)) {
          const { testInfo, test } = getIt(node, source, true)
          debug('found it.skip "%s"', testInfo.name)

          const comment = getLeadingComment(ancestors)
          if (comment) {
            testInfo.comment = comment
            debug('found leading skipped test comment "%s", comment')
          }

          const { suite, topLevelTest } = getSuiteAncestorsForTest(
            test,
            source,
            ancestors,
            nodes,
            fullSuiteNames,
          )

          if (suite) {
            structure.push(suite)
          } else if (topLevelTest) {
            structure.push(test)
          }

          if (typeof testInfo.name !== 'undefined') {
            testNames.push(testInfo.name)
            fullTestNames.push(test.fullName)
          }

          tests.push(testInfo)
        } else if (isItOnly(node)) {
          const { testInfo, test } = getIt(node, source, false)
          testInfo.exclusive = true
          test.exclusive = true
          debug('found it.only "%s"', testInfo.name)

          const comment = getLeadingComment(ancestors)
          if (comment) {
            testInfo.comment = comment
            debug('found leading only test comment "%s", comment')
          }

          const { suite, topLevelTest } = getSuiteAncestorsForTest(
            test,
            source,
            ancestors,
            nodes,
            fullSuiteNames,
          )

          if (suite) {
            structure.push(suite)
          } else if (topLevelTest) {
            structure.push(test)
          }

          if (typeof testInfo.name !== 'undefined') {
            testNames.push(testInfo.name)
            fullTestNames.push(test.fullName)
          }

          tests.push(testInfo)
        }
      },
    },
    proxy,
  )

  const sortedSuiteNames = suiteNames.sort()
  const sortedTestNames = testNames.sort()
  const sortedFullTestNames = [...fullTestNames].sort()
  const sortedFullSuiteNames = [...fullSuiteNames].sort()
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
    result.fullTestNames = sortedFullTestNames
    result.fullSuiteNames = sortedFullSuiteNames
  }

  return result
}

/** Given the test source code, finds all tests
 * and returns a single object with all test titles.
 * Each key is the full test title.
 * The value is a list of effective tags for this test.
 */
function findEffectiveTestTags(source) {
  if (typeof source !== 'string') {
    throw new Error('Expected a string source')
  }

  const result = getTestNames(source, true)
  setEffectiveTags(result.structure)

  const testTags = {}
  visitEachTest(result.structure, (test, parentSuite) => {
    // console.log(test)
    if (typeof test.fullName !== 'string') {
      console.error(test)
      throw new Error('Cannot find the full name for test')
    }
    testTags[test.fullName] = {
      effectiveTags: test.effectiveTags,
      requiredTags: test.requiredTags,
    }
  })

  // console.log(testTags)
  return testTags
}

/**
 * Reads the source code of the given spec file from disk
 * and finds all tests and their effective tags
 */
function findEffectiveTestTagsIn(specFilename) {
  const { readFileSync } = require('fs')
  const source = readFileSync(specFilename, 'utf8')
  return findEffectiveTestTags(source)
}

module.exports = {
  getTestNames,
  formatTestList,
  countTests,
  visitEachTest,
  countTags,
  visitEachNode,
  setParentSuite,
  setEffectiveTags,
  filterByEffectiveTags,
  findEffectiveTestTags,
  findEffectiveTestTagsIn,
}
