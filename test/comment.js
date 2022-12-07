const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('..')

test('includes the comment', (t) => {
  t.plan(1)
  const source = stripIndent`
    // this is a suite called foo
    describe('foo', () => {
      // this is the test comment
      it('bar', () => {})
    })
  `
  const result = getTestNames(source)
  // the leading comment before the test is extracted
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        type: 'test',
        pending: false,
        name: 'bar',
        comment: 'this is the test comment',
      },
      { type: 'suite', pending: false, name: 'foo' },
    ],
  })
})

test('skipped test includes the comment', (t) => {
  t.plan(1)
  const source = stripIndent`
    // this is a suite called foo
    describe('foo', () => {
      // this test is skipped
      it.skip('bar', () => {})
    })
  `
  const result = getTestNames(source)
  // the leading comment before the test is extracted
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar'],
    tests: [
      {
        type: 'test',
        pending: true,
        name: 'bar',
        comment: 'this test is skipped',
      },
      { type: 'suite', pending: false, name: 'foo' },
    ],
  })
})

test('includes the comment for several tests', (t) => {
  t.plan(1)
  const source = stripIndent`
    // this is a suite called foo
    describe('foo', () => {

      // test foo
      it('foo', () => {})

      // test bar
      it('bar', () => {})

      // something here
      // skipped test baz
      it.skip('baz', () => {})
    })
  `
  const result = getTestNames(source)
  // the leading comment before the test is extracted
  t.deepEqual(result, {
    suiteNames: ['foo'],
    testNames: ['bar', 'baz', 'foo'],
    tests: [
      {
        type: 'test',
        pending: false,
        name: 'foo',
        comment: 'test foo',
      },
      {
        type: 'test',
        pending: false,
        name: 'bar',
        comment: 'test bar',
      },
      {
        comment: 'skipped test baz',
        type: 'test',
        pending: true,
        name: 'baz',
      },
      { type: 'suite', pending: false, name: 'foo' },
    ],
  })
})
