const { findEffectiveTestTagsIn } = require('../src')
const test = require('ava')
const path = require('path')

test('individual tags imported from another file', (t) => {
  t.plan(2)

  const fullName = path.join(__dirname, './fixture1/spec1.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['works 1'].effectiveTags, ['@user'])
  t.deepEqual(result['works 2'].effectiveTags, ['@user'])
})

test('imports without file extension (.js)', (t) => {
  t.plan(2)

  const fullName = path.join(__dirname, './fixture-extensions/spec2.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['test 1'].effectiveTags, ['@smoke'])
  t.deepEqual(result['test 2'].effectiveTags, ['@regression'])
})

test('imports without file extension (.ts)', (t) => {
  t.plan(2)

  const fullName = path.join(__dirname, './fixture-extensions/spec3.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['test with ts import 1'].effectiveTags, ['@production'])
  t.deepEqual(result['test with ts import 2'].effectiveTags, ['@debug'])
})

test('imports from TypeScript enum', (t) => {
  t.plan(3)

  const fullName = path.join(__dirname, './fixture-enum/spec.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['enum test 1'].effectiveTags, ['@smoke-enum'])
  t.deepEqual(result['enum test 2'].effectiveTags, ['@regression-enum'])
  t.deepEqual(result['enum test 3'].effectiveTags, ['@sanity-enum'])
})

test('default import with string', (t) => {
  t.plan(1)

  const fullName = path.join(__dirname, './fixture-default/spec.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['default import test'].effectiveTags, ['@default-tag'])
})

test('default import with object', (t) => {
  t.plan(3)

  const fullName = path.join(__dirname, './fixture-default/spec-object.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['default object test 1'].effectiveTags, ['@admin'])
  t.deepEqual(result['default object test 2'].effectiveTags, ['@user-obj'])
  t.deepEqual(result['default object test 3'].effectiveTags, ['@guest'])
})

test('namespace import', (t) => {
  t.plan(3)

  const fullName = path.join(__dirname, './fixture-namespace/spec.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['namespace test 1'].effectiveTags, ['@smoke'])
  t.deepEqual(result['namespace test 2'].effectiveTags, ['@regression'])
  t.deepEqual(result['namespace test 3'].effectiveTags, ['@user'])
})

test('namespace import with enum', (t) => {
  t.plan(2)

  const fullName = path.join(__dirname, './fixture-namespace/spec-enum.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['namespace enum test 1'].effectiveTags, ['@smoke-ns-enum'])
  t.deepEqual(result['namespace enum test 2'].effectiveTags, ['@regression-ns-enum'])
})

test('mixed default and named imports', (t) => {
  t.plan(2)

  const fullName = path.join(__dirname, './fixture-mixed/spec.cy.js')
  const result = findEffectiveTestTagsIn(fullName)

  t.deepEqual(result['mixed default test'].effectiveTags, ['@default-mixed'])
  t.deepEqual(result['mixed named test'].effectiveTags, ['@named'])
})
