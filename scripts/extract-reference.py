"""Extract actual MP4 pixels with the already installed Blender decoder.

Run: blender --background --factory-startup --python scripts/extract-reference.py --
     --source reference/66716.mp4 --output reference/frames-1 --interval 1
Optional: --times 1.1,1.2,1.3 for denser transition sampling.
This script never overwrites or publishes the input video.
"""
import argparse
import json
import math
import os
from pathlib import Path
import sys

import bpy
import numpy as np


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--interval', type=float, default=1.0)
    parser.add_argument('--times', default='')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:])


DIGITS = {
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'],
    '.': ['000', '000', '000', '000', '010'],
    's': ['111', '100', '111', '001', '111'],
}


def label(canvas, value, x, y, scale=3):
    for character in value:
        for row, pixels in enumerate(DIGITS.get(character, DIGITS['0'])):
            for column, pixel in enumerate(pixels):
                if pixel == '1':
                    canvas[y + row * scale:y + (row + 1) * scale,
                           x + column * scale:x + (column + 1) * scale, :3] = 0.94
        x += 4 * scale


def make_sheets(files, destination):
    columns, rows, width, label_height = 4, 6, 320, 26
    sheets = []
    for start in range(0, len(files), columns * rows):
        page = files[start:start + columns * rows]
        if not page:
            continue
        first = bpy.data.images.load(page[0]['path'], check_existing=False)
        height = max(1, round(width * first.size[1] / first.size[0]))
        bpy.data.images.remove(first)
        tile_height = height + label_height
        actual_rows = math.ceil(len(page) / columns)
        canvas = np.zeros((actual_rows * tile_height, columns * width, 4), dtype=np.float32)
        canvas[:, :, :3] = 0.025
        canvas[:, :, 3] = 1
        for index, frame in enumerate(page):
            image = bpy.data.images.load(frame['path'], check_existing=False)
            image.scale(width, height)
            pixels = np.empty(width * height * 4, dtype=np.float32)
            image.pixels.foreach_get(pixels)
            pixels = np.flipud(pixels.reshape(height, width, 4))
            bpy.data.images.remove(image)
            x, y = index % columns * width, index // columns * tile_height
            canvas[y:y + height, x:x + width] = pixels
            label(canvas, f"{frame['seconds']:.3f}s", x + 10, y + height + 5)
        sheet = bpy.data.images.new('Reference contact sheet', width=canvas.shape[1], height=canvas.shape[0], alpha=True)
        sheet.pixels.foreach_set(np.flipud(canvas).ravel())
        path = destination / f'contact-{start // (columns * rows) + 1:02d}.png'
        sheet.filepath_raw = str(path)
        sheet.file_format = 'PNG'
        sheet.save()
        bpy.data.images.remove(sheet)
        sheets.append(str(path))
    return sheets


def main():
    args = arguments()
    source = Path(args.source).resolve(strict=True)
    destination = Path(args.output).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    if args.interval <= 0:
        raise ValueError('interval must be positive')
    clip = bpy.data.movieclips.load(str(source))
    fps = float(clip.fps)
    duration_frames = int(clip.frame_duration)
    width, height = map(int, clip.size)
    if not fps or not duration_frames or not width or not height:
        raise RuntimeError('Blender did not resolve readable movie metadata')
    duration = duration_frames / fps
    scene = bpy.context.scene
    scene.render.fps = round(fps)
    scene.render.fps_base = round(fps) / fps
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.film_transparent = False
    scene.render.use_sequencer = True
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    editor = scene.sequence_editor_create()
    strips = editor.strips if hasattr(editor, 'strips') else editor.sequences
    strips.new_movie('Original video', str(source), channel=1, frame_start=1)
    if args.times:
        times = [float(item) for item in args.times.split(',') if item.strip()]
    else:
        times = list(np.arange(0, duration, args.interval)) + [(duration_frames - 1) / fps]
    selected_frames = sorted({max(1, min(duration_frames, round(seconds * fps) + 1)) for seconds in times})
    files = []
    for frame in selected_frames:
        seconds = (frame - 1) / fps
        path = destination / f'frame-{frame:06d}-{seconds:08.3f}s.png'
        scene.frame_set(frame)
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        files.append({'frame': frame, 'seconds': seconds, 'path': str(path)})
    sheets = make_sheets(files, destination)
    report = {'source': str(source), 'fps': fps, 'duration_frames': duration_frames,
              'duration_seconds': duration, 'width': width, 'height': height,
              'coverage': 'complete duration sampled' if not args.times else 'specified transition samples',
              'sampling_interval_seconds': args.interval if not args.times else None,
              'files': files, 'contact_sheets': sheets}
    (destination / 'metadata.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('REFERENCE_EXTRACTION ' + json.dumps(report))


if __name__ == '__main__':
    main()
