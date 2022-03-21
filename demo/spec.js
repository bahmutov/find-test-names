// example Mocha / Cypress spec
describe('first describe', () => {
  it('works 1', () => {})
})

it('works 2', () => {})

describe('parent suite', () => {
  describe('inner suite', () => {
    it('loads', () => {})
  })
})

it.skip('pending test', () => {})

// test name is a variable, not a literal string
const testName = 'nice'
it(testName, () => {})
