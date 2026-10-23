import { test } from 'node:test'
import assert from 'node:assert/strict'
import { storyProgress, chapterProgress, worldVisibility } from '../../src/lib/story.mjs'

test('story normalizes document scroll and clamps interruption/overscroll', () => {
  assert.equal(storyProgress(0, 7000, 1000), 0)
  assert.equal(storyProgress(-3000, 7000, 1000), .5)
  assert.equal(storyProgress(-9000, 7000, 1000), 1)
  assert.equal(storyProgress(300, 7000, 1000), 0)
  assert.equal(storyProgress(-100, 900, 1000), 0)
  assert.equal(storyProgress(NaN, 7000, 1000), 0)
})
test('portal enters and leaves cleanly in either scroll direction', () => {
  assert.equal(worldVisibility(0), 0)
  assert.equal(worldVisibility(.68), 1)
  assert.equal(worldVisibility(1), 0)
  const positions = [.5, .55, .6, .65, .7, .75, .8, .9]
  assert.deepEqual(positions.map(worldVisibility), positions.toReversed().map(worldVisibility).reverse())
  for (const p of positions) assert.ok(worldVisibility(p) >= 0 && worldVisibility(p) <= 1)
})
test('short landscape chapters retain camera stops despite expanded content height', () => {
  const anchors = [
    {top:0,progress:0},{top:600,progress:.24},{top:1190,progress:.44},
    {top:1790,progress:.58},{top:2350,progress:.7},{top:3110,progress:.87},{top:3830,progress:1},
  ]
  assert.equal(chapterProgress(3110,anchors),.87)
  assert.equal(chapterProgress(2350,anchors),.7)
  assert.equal(chapterProgress(300,anchors),.12)
  assert.equal(chapterProgress(-100,anchors),0)
  assert.equal(chapterProgress(9999,anchors),1)
  assert.equal(chapterProgress(NaN,anchors),0)
})
