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
