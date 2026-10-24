"""Reversible local promotion of the independently reviewed material candidate."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import uuid

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = ROOT / 'assets/blender/checkpoints/pre-baffle-iteration05'
ARCHIVE = ROOT / 'assets/blender/checkpoints/adopted-baffle'
MASTER = ROOT / 'assets/blender/lucent-projector.blend'
MODEL = ROOT / 'public/models/lucent-projector.glb'
CANDIDATE_MASTER = ROOT / 'assets/blender/lucent-projector-baffle-preview.blend'
CANDIDATE_MODEL = ROOT / 'public/models/lucent-projector-baffle-preview.glb'
EXPECTED_OLD_MASTER = '1043de7ae3447ce04867419b695bb5fd72f4e4b1e6396c38fc54c63d8351e287'
EXPECTED_OLD_MODEL = '2483e1d2150c0bc37e3d39e58e10063cd93be95acf85e0b43604f645be6c751a'
EXPECTED_CANDIDATE = '915b50699e81734415d378b99ddac8f1a90e28d12b97aa04c0a9696f83626295'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def local(path):
    path = path.resolve()
    if not path.is_relative_to(ROOT):
        raise RuntimeError('Refusing a file operation outside this project')
    return path


def preserve(source, target):
    source, target = local(source), local(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if digest(target) != digest(source):
            raise RuntimeError('Existing checkpoint differs; preserve it for inspection')
    else:
        shutil.copy2(source, target)
    if digest(source) != digest(target):
        raise RuntimeError('Checkpoint copy verification failed')


def atomic_copy(source, target):
    source, target = local(source), local(target)
    temporary = local(target.with_name(target.name + '.promotion-' + uuid.uuid4().hex))
    shutil.copyfile(source, temporary)
    if digest(source) != digest(temporary):
        raise RuntimeError('Staged promotion bytes differ')
    os.replace(temporary, target)


def main():
    if digest(MASTER) != EXPECTED_OLD_MASTER or digest(MODEL) != EXPECTED_OLD_MODEL:
        raise RuntimeError('Current master/model no longer match the reviewed pre-promotion checkpoint')
    if digest(CANDIDATE_MODEL) != EXPECTED_CANDIDATE:
        raise RuntimeError('Candidate GLB differs from the reviewed artifact')
    preserve(MASTER, CHECKPOINT / 'master.blend')
    preserve(MODEL, CHECKPOINT / 'model.glb')
    preserve(ROOT / 'assets/blender/build_projector.py', CHECKPOINT / 'build_projector.py')
    preserve(ROOT / 'evidence/remodel/model-metadata.json', CHECKPOINT / 'model-metadata.json')
    for name in ['neutral-front.png', 'neutral-three-quarter.png', 'neutral-rear-side.png',
                 'neutral-optical-detail.png', 'warm-hero.png', 'product-fallback.png',
                 'product-fallback-silver.png', 'product-fallback-copper.png']:
        preserve(ROOT / 'evidence/remodel' / name, CHECKPOINT / 'renders' / name)
    preserve(CANDIDATE_MASTER, ARCHIVE / 'master.blend')
    preserve(CANDIDATE_MODEL, ARCHIVE / 'model.glb')
    preserve(ROOT / 'evidence/remodel/baffle-preview-metadata.json', ARCHIVE / 'candidate-metadata.json')
    atomic_copy(CANDIDATE_MASTER, MASTER)
    atomic_copy(CANDIDATE_MODEL, MODEL)
    report = {
        'action': 'Local material-only promotion approved by parent after independent visual review',
        'checkpoint': str(CHECKPOINT), 'candidate_archive': str(ARCHIVE),
        'old_master_sha256': EXPECTED_OLD_MASTER, 'old_model_sha256': EXPECTED_OLD_MODEL,
        'adopted_master_sha256': digest(MASTER), 'adopted_model_sha256': digest(MODEL),
        'adopted_model_bytes': MODEL.stat().st_size,
        'rollback': 'Copy checkpoints/pre-baffle-iteration05/master.blend and model.glb back to their explicit original paths; prior source and renders are in the same checkpoint.',
        'publication': False,
    }
    (ROOT / 'evidence/remodel/baffle-promotion.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('LOCAL_PROMOTION ' + json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
