// @ts-check
const spacer = '  '
const spacerNeighbour = '│ '
const lastSpacer = '└─ '
const middleSpacer = '├─ '

function formatTestList(tests, indent = 0) {
  const lastIndex = tests.length - 1
  const lines = tests.map((test, k) => {
    let spacer
    if (k === lastIndex) {
      spacer = lastSpacer
    } else {
      spacer = middleSpacer
    }
    return `${spacer}${test.name}`
  })

  return lines.join('\n')
}

module.exports = { formatTestList }
