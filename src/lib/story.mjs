export const finishes = Object.freeze([
  { id: 'graphite', name: 'Obsidian', description: 'Quiet. Precise. Unmistakable.', color: '#343b42' },
  { id: 'silver', name: 'Lunar', description: 'A softer kind of brilliance.', color: '#bdc6cc' },
  { id: 'copper', name: 'Ember', description: 'Warmth, in its purest form.', color: '#bd7953' },
])

export const worlds = Object.freeze([
  { id: 'aurora', name: 'Blue hour', description: 'Somewhere between the last light and the first star.' },
  { id: 'dune', name: 'Afterglow', description: 'A quiet world, carved by light.' },
  { id: 'orbit', name: 'Far beyond', description: 'Let the everyday fall out of orbit.' },
])

/** Clamp document scroll into a stable story range, including invalid dimensions.
 * @param {number} top @param {number} height @param {number} viewport
 */
export function storyProgress(top, height, viewport) {
  const distance = height - viewport
  if (!Number.isFinite(top) || !Number.isFinite(distance) || distance <= 0) return 0
  return Math.max(0, Math.min(1, -top / distance))
}

/** Map actual chapter positions to camera stops, independent of wrapping/viewport height.
 * @param {number} position
 * @param {{top:number, progress:number}[]} anchors
 */
export function chapterProgress(position, anchors) {
  if (!Number.isFinite(position) || anchors.length < 2 || position <= anchors[0].top) return 0
  for (let index = 1; index < anchors.length; index++) {
    const end = anchors[index]
    const start = anchors[index - 1]
    if (position <= end.top) {
      const distance = end.top - start.top
      if (distance <= 0) return start.progress
      const ratio = Math.max(0, Math.min(1, (position - start.top) / distance))
      return start.progress + (end.progress - start.progress) * ratio
    }
  }
  return 1
}

/** Portal opacity is bounded and reversible during interrupted or reverse scrolling.
 * @param {number} progress
 */
export function worldVisibility(progress) {
  const enter = Math.max(0, Math.min(1, (progress - 0.54) / 0.09))
  const leave = Math.max(0, Math.min(1, (0.81 - progress) / 0.07))
  return Math.min(enter, leave)
}
