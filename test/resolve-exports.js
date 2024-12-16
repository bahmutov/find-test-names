const { resolveExports } = require('../src/resolve-exports')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('finds the named exports', (t) => {
  t.plan(1)
  const source = stripIndent`
    export const foo = 'foo'
    export const bar = 'bar'
  `
  const result = resolveExports(source)
  t.deepEqual(result, { foo: 'foo', bar: 'bar' })
})

test('finds the named exported object', (t) => {
  t.plan(1)
  const source = stripIndent`
    export const TAGS = {
      foo: 'foo',
      bar: 'bar'
    }
  `
  const result = resolveExports(source)
  t.deepEqual(result, { TAGS: { foo: 'foo', bar: 'bar' } })
})
