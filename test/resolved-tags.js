const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

test('resolves a single local constant tag', (t) => {
  t.plan(1)
  const source = stripIndent`
    const foo = '@foo';

    it('works', { tags: foo }, () => {})
  `
  const result = getTestNames(source)
  // console.log(result)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        tags: ['@foo'],
        type: 'test',
        pending: false,
      },
    ],
  })
})

test('resolves a single local constant required tag', (t) => {
  t.plan(1)
  const source = stripIndent`
    const foo = '@foo';

    it('works', { requiredTags: foo }, () => {})
  `
  const result = getTestNames(source)
  // console.log(result)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        requiredTags: ['@foo'],
        type: 'test',
        pending: false,
      },
    ],
  })
})

test('resolves a list of tags with a local constant', (t) => {
  t.plan(1)
  const source = stripIndent`
    const bar = '@bar';

    it('works', { tags: ['@foo', bar] }, () => {})
  `
  const result = getTestNames(source)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        tags: ['@foo', '@bar'],
        type: 'test',
        pending: false,
      },
    ],
  })
})

test('resolves a property of an object as a single tag', (t) => {
  t.plan(1)
  const source = stripIndent`
    const TAGS = {
      foo: '@foo',
    }

    it('works', { tags: TAGS.foo }, () => {})
  `
  const result = getTestNames(source)
  // console.log(result)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        tags: ['@foo'],
        type: 'test',
        pending: false,
      },
    ],
  })
})

test('resolves a property of an object from an array', (t) => {
  t.plan(1)
  const source = stripIndent`
    const TAGS = {
      foo: '@foo',
    }

    it('works', { tags: ['@sanity', TAGS.foo] }, () => {})
  `
  const result = getTestNames(source)
  // console.log(result)
  t.deepEqual(result, {
    suiteNames: [],
    testNames: ['works'],
    tests: [
      {
        name: 'works',
        tags: ['@sanity', '@foo'],
        type: 'test',
        pending: false,
      },
    ],
  })
})
