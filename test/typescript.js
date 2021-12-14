const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('typescript', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('foo', () => {
      it('bar', () => {
        const typed: string = 'abc';
      })
    })
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        name: 'bar',
      },
      {
        name: 'foo',
      },
    ],
  })
})

test('typescript 2', (t) => {
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
      },
      {
        name: 'loads',
      },
      {
        name: 'TypeScript spec',
      },
    ],
  })
})

// SKIP: https://github.com/bahmutov/find-test-names/issues/8
test.skip('typescript interface', (t) => {
  t.plan(1)
  const source = stripIndent`
    interface Person {
      name: string
    }
  `
  const result = getTestNames(source)

  t.deepEqual(result, {})
})

// SKIP: https://github.com/bahmutov/find-test-names/issues/8
test.skip('typescript type', (t) => {
  t.plan(1)
  const source = stripIndent`
    type Person = {
      name: string
    }
  `
  const result = getTestNames(source)

  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        name: 'bar',
      },
      {
        name: 'foo',
      },
    ],
  })
})
