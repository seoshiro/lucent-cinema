import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stageVisibility, finaleVisibility } from '../../src/lib/story.mjs'

test('visual stage exits before details appear, and restores on reverse scroll', () => {
  assert.equal(stageVisibility(1400, 1000), 1)
  assert.equal(stageVisibility(1180, 1000), 1)
  assert.equal(stageVisibility(1090, 1000), .5)
  assert.equal(stageVisibility(1000, 1000), 0)
  assert.equal(stageVisibility(300, 1000), 0)
  assert.equal(stageVisibility(1090, 1000), .5)
  assert.equal(stageVisibility(1400, 1000), 1)
})

test('stage ownership is recalculated for resize and invalid dimensions', () => {
  assert.equal(stageVisibility(900, 1000), 0)
  assert.equal(stageVisibility(900, 700), 1)
  assert.equal(stageVisibility(NaN, 700), 0)
  assert.equal(stageVisibility(900, 0), 0)
})

test('phone finale clears the product before copy reaches its vertical band', () => {
  assert.equal(finaleVisibility(700, 1000), 1)
  assert.equal(finaleVisibility(550, 1000), 1)
  assert.ok(Math.abs(finaleVisibility(475, 1000) - .5) < 1e-12)
  assert.equal(finaleVisibility(400, 1000), 0)
  assert.equal(finaleVisibility(200, 1000), 0)
  assert.ok(Math.abs(finaleVisibility(475, 1000) - .5) < 1e-12)
  assert.equal(finaleVisibility(700, 1000), 1)
  assert.equal(finaleVisibility(NaN, 1000), 0)
  assert.equal(finaleVisibility(400, 0), 0)
})
