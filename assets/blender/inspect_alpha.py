"""Read original PNG alpha and write diagnostic profiles/masks, never edits PNGs."""
import json
from pathlib import Path
import sys
import bpy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'evidence/remodel/alpha-analysis'
OUT.mkdir(parents=True, exist_ok=True)
LABEL = sys.argv[sys.argv.index('--label') + 1] if '--label' in sys.argv else 'original'


def runs(values):
    result = []
    begin = 0
    for index in range(1, len(values) + 1):
        if index == len(values) or values[index] != values[begin]:
            result.append({'start': int(begin), 'length': int(index - begin), 'value': int(values[begin])})
            begin = index
    return result


def save_mask(name, pixels):
    height, width = pixels.shape
    output = bpy.data.images.new(name, width=width, height=height, alpha=False)
    rgba = np.ones((height, width, 4), dtype=np.float32)
    rgba[:, :, :3] = pixels[:, :, None]
    output.pixels.foreach_set(np.flipud(rgba).ravel())
    output.filepath_raw = str(OUT / (name + '.png'))
    output.file_format = 'PNG'
    output.save()
    bpy.data.images.remove(output)


results = []
for name in ['product-fallback.png', 'product-fallback-silver.png', 'product-fallback-copper.png']:
    image = bpy.data.images.load(str(ROOT / 'evidence/remodel' / name), check_existing=False)
    width, height = image.size
    values = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(values)
    alpha = np.flipud(values.reshape(height, width, 4)[:, :, 3])
    byte_alpha = np.round(alpha * 255).astype(np.uint8)
    top = np.argmax(alpha > 0.5, axis=0)
    segment = top[300:560]
    ys, xs = np.nonzero(alpha > 0.5)
    result = {
        'file': name, 'dimensions': [width, height],
        'alpha_levels': len(np.unique(byte_alpha)),
        'partial_alpha_pixels': int(np.count_nonzero((byte_alpha > 0) & (byte_alpha < 255))),
        'bounds_at_alpha_half': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
        'top_edge_x_range': [300, 559],
        'top_edge_y_values': segment.tolist(),
        'top_edge_plateaus': runs(segment),
    }
    results.append(result)
    if name == 'product-fallback.png':
        save_mask(LABEL + '-alpha-full', alpha)
        save_mask(LABEL + '-alpha-top-edge-8x', np.repeat(np.repeat(alpha[255:395, 300:560], 8, axis=0), 8, axis=1))
    bpy.data.images.remove(image)

(OUT / (LABEL + '-alpha-profiles.json')).write_text(json.dumps(results, indent=2), encoding='utf-8')
print('ALPHA_PROFILES ' + json.dumps([{key: value for key, value in result.items() if key not in {'top_edge_y_values', 'top_edge_plateaus'}} for result in results]), flush=True)
print('TOP_EDGE_PLATEAUS ' + json.dumps({'min_pixels': min(run['length'] for run in results[0]['top_edge_plateaus']), 'max_pixels': max(run['length'] for run in results[0]['top_edge_plateaus'])}), flush=True)
