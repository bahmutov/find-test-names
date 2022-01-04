const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('template literal test title', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it(\`bar\`, () => {})
    })
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        name: 'bar',
        type: 'test',
      },
      {
        name: 'foo',
        type: 'suite',
      },
    ],
  })
})

test('template literal suite title', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe(\`foo\`, () => {
      it("bar", () => {})
    })
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        name: 'bar',
        type: 'test',
      },
      {
        name: 'foo',
        type: 'suite',
      },
    ],
  })
})

test('template literal test title with variables', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it(\`bar \${k + 1} the end\`, () => {})
    })
  `
  const result = getTestNames(source)
  // the test name should skip all variables and expressions
  // and just concatenate the literal parts
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar the end'],
    tests: [
      {
        name: 'bar the end',
        type: 'test',
      },
      {
        name: 'foo',
        type: 'suite',
      },
    ],
  })
})
