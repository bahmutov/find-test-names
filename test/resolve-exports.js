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

test('finds the default export with a literal', (t) => {
  t.plan(1)
  const source = stripIndent`
    export default 'foo'
  `
  const result = resolveExports(source)
  t.deepEqual(result, { default: 'foo' })
})

test('finds the default export with an object', (t) => {
  t.plan(1)
  const source = stripIndent`
    export default {
      foo: 'foo',
      bar: 'bar'
    }
  `
  const result = resolveExports(source)
  t.deepEqual(result, { default: { foo: 'foo', bar: 'bar' } })
})

test('finds the default export with an identifier', (t) => {
  t.plan(1)
  const source = stripIndent`
    const myValue = 'foo'
    export default myValue
  `
  const result = resolveExports(source)
  t.deepEqual(result, { default: 'myValue' })
})

test('finds both named and default exports', (t) => {
  t.plan(1)
  const source = stripIndent`
    export const named = 'namedValue'
    export default 'defaultValue'
  `
  const result = resolveExports(source)
  t.deepEqual(result, { named: 'namedValue', default: 'defaultValue' })
})

test('finds the exported TypeScript enum', (t) => {
  t.plan(1)
  const source = stripIndent`
    export enum Tags {
      smoke = '@smoke',
      regression = '@regression'
    }
  `
  const result = resolveExports(source)
  t.deepEqual(result, { Tags: { smoke: '@smoke', regression: '@regression' } })
})
