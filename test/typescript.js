const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('typescript annotation', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('TypeScript spec', () => {
      it('works', () => {
        const person = {
          name: 'Joe',
        }

        cy.wrap(person).should('have.property', 'name', 'Joe')
      })

      it('loads', () => {
        const n: number = 1
        cy.wrap(n).should('eq', 1)
      })
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['TypeScript spec'],
    testNames: ['loads', 'works'],
    tests: [
      {
        name: 'works',
        type: 'test',
        pending: false,
      },
      {
        name: 'loads',
        type: 'test',
        pending: false,
      },
      {
        name: 'TypeScript spec',
        type: 'suite',
        pending: false,
      },
    ],
  })
})

test('typescript interface', (t) => {
  t.plan(1)
  const source = stripIndent`
    interface Person {
      name: string
    }

    describe('TypeScript spec', () => {
      it('works', () => {})
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['TypeScript spec'],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        type: 'test',
        pending: false,
      },
      {
        name: 'TypeScript spec',
        type: 'suite',
        pending: false,
      },
    ],
  })
})

test('typescript type', (t) => {
  t.plan(1)
  const source = stripIndent`
    type Person = {
      name: string
    }

    describe('TypeScript spec', () => {
      it('works', () => {})
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['TypeScript spec'],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        type: 'test',
        pending: false,
      },
      {
        name: 'TypeScript spec',
        type: 'suite',
        pending: false,
      },
    ],
  })
})

test('typescript enum', (t) => {
  t.plan(1)
  const source = stripIndent`
    enum Person {
      name = 'name',
      age = 'age'
    }

    describe('TypeScript spec', () => {
      it('works', () => {})
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['TypeScript spec'],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        type: 'test',
        pending: false,
      },
      {
        name: 'TypeScript spec',
        type: 'suite',
        pending: false,
      },
    ],
  })
})

test('typescript class with field modifiers', (t) => {
  t.plan(1)
  const source = stripIndent`
    class Test {
      private foo = 'private'

      public bar = 'public'

      protected baz = 'protected'

      public createSuite() {
        it('loads', () => {})
      }
    }

    describe('TypeScript spec', () => {
      it('works', () => {})
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['TypeScript spec'],
    testNames: ['loads', 'works'],
    tests: [
      {
        name: 'loads',
        type: 'test',
        pending: false,
      },
      {
        name: 'works',
        type: 'test',
        pending: false,
      },
      {
        name: 'TypeScript spec',
        type: 'suite',
        pending: false,
      },
    ],
  })
})

test('typescript pending test', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('TypeScript spec', () => {
      it('needs to be added')
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['TypeScript spec'],
    testNames: ['needs to be added'],
    tests: [
      {
        name: 'needs to be added',
        type: 'test',
        pending: true,
      },
      {
        name: 'TypeScript spec',
        type: 'suite',
        pending: false,
      },
    ],
  })
})
