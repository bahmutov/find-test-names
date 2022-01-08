// @ts-check
const spacer = '  '
const spacerNeighbour = '│ '
const lastSpacer = '└─ '
const middleSpacer = '├─ '

function formatTestList(tests, indent = 0) {
  const myIndent = spacer.repeat(indent)
  const lastIndex = tests.length - 1
  if (!tests.length) {
    return `${myIndent}└─ (empty)`
  }

  const lines = tests.map((test, k) => {
    let start
    if (k === lastIndex) {
      start = lastSpacer
    } else {
      start = middleSpacer
    }

    if (test.type === 'suite') {
      const nested = formatTestList(test.tests || [], indent + 1)
      const nestedLines = nested.split('\n')
      const nestedLinesWithIndent = nestedLines.map((s) => {
        return spacer + s
      })
      const suiteLines =
        `${start}${test.name}` + '\n' + nestedLinesWithIndent.join('\n')
      return suiteLines
    } else {
      return `${start}${test.name}`
    }
  })

  return lines.flat(1).join('\n')
}

module.exports = { formatTestList }
