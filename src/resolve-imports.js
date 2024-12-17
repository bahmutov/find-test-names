const babel = require('@babel/parser')
const walk = require('acorn-walk')
const debug = require('debug')('find-test-names')
const { resolveExports } = require('./resolve-exports')

const base = walk.make({})

const plugins = [
  'jsx',
  'estree', // To generate estree compatible AST
  'typescript',
]

function ignore(_node, _st, _c) {}

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

function resolveImportsInAst(AST, fileProvider) {
  const importedValues = {}

  // console.dir(AST, { depth: null })

  walk.ancestor(
    AST,
    {
      ImportDeclaration(node) {
        // console.log(node)
        // from where...
        const fromWhere = node.source?.value
        if (!fromWhere) {
          return
        }
        debug('importing from "%s"', fromWhere)
        const source = fileProvider(fromWhere)
        if (!source) {
          debug('could not find source for "%s"', fromWhere)
          return
        }
        const exportedValues = resolveExports(source)
        if (!exportedValues) {
          debug('could not find any exports in "%s"', fromWhere)
          return
        }

        node.specifiers.forEach((specifier) => {
          const importedName = specifier.imported.name
          const localName = specifier.local.name
          debug('importing "%s" as "%s"', importedName, localName)
          if (!exportedValues[importedName]) {
            debug('could not find export "%s" in "%s"', importedName, fromWhere)
            return
          }
          importedValues[localName] = exportedValues[importedName]
        })
      },
    },
    proxy,
  )

  return importedValues
}

function resolveImports(source, fileProvider) {
  let AST
  try {
    debug('parsing source as a script for imports')
    AST = babel.parse(source, {
      plugins,
      sourceType: 'script',
    }).program
    debug('success!')
  } catch (e) {
    debug('parsing source as a module for imports')
    AST = babel.parse(source, {
      plugins,
      sourceType: 'module',
    }).program
    debug('success!')
  }

  return resolveImportsInAst(AST, fileProvider)
}

module.exports = {
  resolveImports,
  resolveImportsInAst,
}
