const { getTestNames, visitEachTest } = require('../src')
const { stripIndent } = require('common-tags')
const test = require('ava')

test('visits two tests', (t) => {
  t.plan(2)
  const source = stripIndent`
    it('works a', () => {})
    it('works b', () => {})
  `
  const result = getTestNames(source, true)
  t.deepEqual(result.testCount, 2)

  let counter = 0
  visitEachTest(result.structure, (test) => {
    counter += 1
  })
  t.deepEqual(counter, 2)
})

test('visits the tests inside the suite', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', () => {
      it('works a', () => {})
      it('works b', () => {})
    })
  `
  const result = getTestNames(source, true)

  let counter = 0
  visitEachTest(result.structure, (test) => {
    counter += 1
  })
  t.deepEqual(counter, 2)
})

test('visits the tests inside the inner suite', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', () => {
      describe('inner', () => {
        it('works a', () => {})
        it('works b', () => {})
      })
    })
  `
  const result = getTestNames(source, true)

  let counter = 0
  visitEachTest(result.structure, (test) => {
    counter += 1
  })
  t.deepEqual(counter, 2)
})

test('visits each suite', (t) => {
  t.plan(1)
  const source = stripIndent`
    describe('parent', () => {
      describe('inner 1', () => {
        it('works a', () => {})
        it('works b', () => {})
      })

      describe('inner 2', () => {
        it('works a', () => {})
        it('works b', () => {})
      })
    })
  `
  const result = getTestNames(source, true)

  let counter = 0
  visitEachTest(result.structure, (test) => {
    counter += 1
  })
  t.deepEqual(counter, 4)
})

test('passes the test info to the callback', (t) => {
  t.plan(8)
  const source = stripIndent`
    describe('parent', () => {
      describe('inner 1', () => {
        it('works a', {tags: '@user'}, () => {})
      })

      describe('inner 2', () => {
        it('works b', () => {})
      })
    })
  `
  const result = getTestNames(source, true)

  let counter = 0
  visitEachTest(result.structure, (test) => {
    t.is(test.type, `test`)
    t.is(test.pending, false)
    if (test.name === 'works a') {
      t.deepEqual(test.tags, ['@user'])
    } else {
      t.is(test.name, 'works b')
      t.is(test.tags, undefined)
    }

    counter += 1
  })
  t.deepEqual(counter, 2)
})
