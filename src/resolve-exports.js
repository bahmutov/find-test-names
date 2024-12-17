const babel = require('@babel/parser')
const walk = require('acorn-walk')
const debug = require('debug')('find-test-names')

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

function resolveExportsInAst(AST, proxy) {
  const exportedValues = {}

  walk.ancestor(
    AST,
    {
      ExportNamedDeclaration(node) {
        // console.log(node)
        if (node.declaration.type === 'VariableDeclaration') {
          node.declaration.declarations.forEach((declaration) => {
            const { id, init } = declaration
            if (id.type === 'Identifier') {
              if (init?.type === 'Literal') {
                exportedValues[id.name] = init.value
              } else if (init?.type === 'ObjectExpression') {
                const obj = {}
                init.properties.forEach((prop) => {
                  const value = prop.value
                  if (value.type === 'Literal') {
                    obj[prop.key.name] = value.value
                  }
                })

                exportedValues[id.name] = obj
              }
            }
          })
        }
      },
    },
    proxy,
  )

  return exportedValues
}

function resolveExports(source) {
  let AST
  try {
    debug('parsing source as a script for exports')
    AST = babel.parse(source, {
      plugins,
      sourceType: 'script',
    }).program
    debug('success!')
  } catch (e) {
    debug('parsing source as a module for exports')

    try {
      AST = babel.parse(source, {
        plugins,
        sourceType: 'module',
      }).program
      debug('success for exports!')
    } catch (e) {
      console.error(e)
      console.error(source)
    }
  }

  return resolveExportsInAst(AST, proxy)
}

module.exports = {
  resolveExports,
}
