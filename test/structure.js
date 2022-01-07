const { stripIndent } = require('common-tags')
const test = require('ava')
const { getTestNames } = require('../src')

test('extract complex structure', (t) => {
  t.plan(1)
  const source = stripIndent`
    it('top', () => {})

    describe('foo', {tags: ['@one', '@two']}, () => {

      describe('foobar', {tags: ['@four']}, () => {
        it('bar', {tags: ['@three']}, () => {})

        it('quox', {tags: ['@five']}, () => {})
      });

      it('blipp', {tags: []}, () => {})
    })

    it('baz', {tags: ['@one']}, () => {})
  `
  const result = getTestNames(source, true)

  t.deepEqual(result.structure, [
    {
      name: 'top',
      tags: undefined,
      type: 'test',
      pending: false,
    },
    {
      name: 'foo',
      type: 'suite',
      pending: false,
      suites: [
        {
          name: 'foobar',
          type: 'suite',
          pending: false,
          suites: [],
          tests: [
            {
              name: 'bar',
              tags: ['@three'],
              type: 'test',
              pending: false,
            },
            {
              name: 'quox',
              tags: ['@five'],
              type: 'test',
              pending: false,
            },
          ],
          tags: ['@four'],
        },
      ],
      tests: [
        {
          name: 'blipp',
          tags: undefined,
          type: 'test',
          pending: false,
        },
      ],
      tags: ['@one', '@two'],
    },
    {
      name: 'baz',
      tags: ['@one'],
      type: 'test',
      pending: false,
    },
  ])
})
