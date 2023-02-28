const babel = require('@babel/parser')

const source = `
  /**
   * beginning
   */

  // this is a comment
  const foo = 'bar'

  // JSX
  const Coounter = () => <div>Count</div>
`

const plugins = [
  'estree', // To generate estree compatible AST
  'jsx',
]

const AST = babel.parse(source, {
  plugins,
  sourceType: 'script',
}).program

console.log(AST.body[0].leadingComments)
