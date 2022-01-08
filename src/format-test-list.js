// @ts-check
const spacer = '  '
const spacerNeighbour = '│ '
const lastSpacer = '└─ '
const middleSpacer = '├─ '

function formatTestList(tests, indent = 0) {
  const myIndent = spacer.repeat(indent)
  const innerIndent = myIndent + spacer
  const lastIndex = tests.length - 1
  if (!tests.length) {
    return `${myIndent}└─ (empty)`
  }

  const lines = tests.map((test, k) => {
    let spacer
    if (k === lastIndex) {
      spacer = lastSpacer
    } else {
      spacer = middleSpacer
    }

    if (test.type === 'suite') {
      const nested = formatTestList(test.tests || [], indent + 1)
      const nestedLines = nested.split('\n')
      const nestedLinesWithIndent = nestedLines.map((s) => {
        return innerIndent + s
      })
      const suiteLines =
        `${spacer}${test.name}` + '\n' + nestedLinesWithIndent.join('\n')
      return suiteLines
    } else {
      return `${spacer}${test.name}`
    }
  })

  return lines.flat(1).join('\n')
}

module.exports = { formatTestList }
