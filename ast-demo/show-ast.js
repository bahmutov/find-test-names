const babel = require('@babel/parser')

const source = `
  /**
   * beginning
   */

  // this is a comment
  const foo = 'bar'
`

const plugins = [
  'estree', // To generate estree compatible AST
]

const AST = babel.parse(source, {
  plugins,
  sourceType: 'script',
}).program

console.log(AST.body[0].leadingComments)
