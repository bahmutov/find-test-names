const { resolveImports } = require('../src/resolve-imports')
const { stripIndent } = require('common-tags')
const test = require('ava')

const fileProvider = (relativePath) => {
  if (relativePath === './file-a') {
    return stripIndent`
      export const foo = 'foo'
      export const bar = 'bar'
    `
  }

  if (relativePath === './file-b') {
    return stripIndent`
      export const TAGS = {
        user: '@user',
        sanity: '@sanity',
      }
    `
  }

  if (relativePath === './file-c') {
    return stripIndent`
      export default '@smoke'
    `
  }

  if (relativePath === './file-d') {
    return stripIndent`
      export default {
        env: 'production',
        debug: 'false'
      }
    `
  }

  if (relativePath === './file-e') {
    return stripIndent`
      export const named = 'namedValue'
      export default 'defaultValue'
    `
  }
}

test('finds the imports', (t) => {
  t.plan(1)
  const source = stripIndent`
    import { foo } from './file-a'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { foo: 'foo' })
})

test('renames the import', (t) => {
  t.plan(1)
  const source = stripIndent`
    import { foo as FOOBAR } from './file-a'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { FOOBAR: 'foo' })
})

test('two imports', (t) => {
  t.plan(1)
  const source = stripIndent`
    import { foo, bar } from './file-a'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { foo: 'foo', bar: 'bar' })
})

test('non-existent import', (t) => {
  t.plan(1)
  const source = stripIndent`
    import { quux } from './file-a'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, {})
})

test('finds the exported object', (t) => {
  t.plan(1)
  const source = stripIndent`
    import { TAGS } from './file-b'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { TAGS: { user: '@user', sanity: '@sanity' } })
})

test('imports default export with literal', (t) => {
  t.plan(1)
  const source = stripIndent`
    import defaultTag from './file-c'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { defaultTag: '@smoke' })
})

test('imports default export with object', (t) => {
  t.plan(1)
  const source = stripIndent`
    import config from './file-d'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { config: { env: 'production', debug: 'false' } })
})

test('imports both named and default exports', (t) => {
  t.plan(1)
  const source = stripIndent`
    import defaultValue, { named } from './file-e'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { defaultValue: 'defaultValue', named: 'namedValue' })
})

test('imports namespace', (t) => {
  t.plan(1)
  const source = stripIndent`
    import * as allExports from './file-a'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { allExports: { foo: 'foo', bar: 'bar' } })
})

test('imports namespace with default export', (t) => {
  t.plan(1)
  const source = stripIndent`
    import * as allExports from './file-e'
  `

  const result = resolveImports(source, fileProvider)
  t.deepEqual(result, { allExports: { named: 'namedValue', default: 'defaultValue' } })
})
