// @ts-check
const spacer = '  '
const spacerNeighbour = '│ '
const lastSpacer = '└─ '
const middleSpacer = '├─ '
const pendingLastSpacer = '└⊙ '
const pendingMiddleSpacer = '├⊙ '

function formatTestList(tests, indent = 0) {
  const lastIndex = tests.length - 1
  if (!tests.length) {
    return `${spacer.repeat(indent > 0 ? indent - 1 : 0)}└─ (empty)`
  }

  const testsN = tests.length
  const lines = tests.map((test, k) => {
    let start
    if (k === lastIndex) {
      start = test.pending ? pendingLastSpacer : lastSpacer
    } else {
      start = test.pending ? pendingMiddleSpacer : middleSpacer
    }

    let nameLine = test.name ? `${start}${test.name}` : `${start}<unknown test>`
    if (Array.isArray(test.tags)) {
      nameLine += ` [${test.tags.join(', ')}]`
    }

    if (test.type === 'suite') {
      const children = [].concat(test.tests, test.suites).filter(Boolean)
      const nested = formatTestList(children, indent + 1)
      const nestedLines = nested.split('\n')
      const includeSpacer = k < testsN - 1 ? spacerNeighbour : spacer
      const nestedLinesWithIndent = nestedLines.map((s) => {
        return includeSpacer + s
      })

      const suiteLines = `${nameLine}` + '\n' + nestedLinesWithIndent.join('\n')
      return suiteLines
    } else {
      return nameLine
    }
  })

  return lines.flat(1).join('\n')
}

module.exports = { formatTestList }
