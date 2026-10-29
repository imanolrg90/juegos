import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


TARGET_LUFS = -16.0
TARGET_PEAK = -2.0
LOUDNESS_TOLERANCE = 0.5
MAX_TRUE_PEAK = -1.0
REPO = Path(__file__).resolve().parents[1]


def file_hash(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def run_ffmpeg(ffmpeg, arguments):
    result = subprocess.run(
        [ffmpeg, '-hide_banner', '-nostdin', '-nostats', *arguments],
        capture_output=True, encoding='utf-8', errors='replace', timeout=900
    )
    if result.returncode:
        raise RuntimeError(f'FFmpeg fallo ({result.returncode}):\n{result.stderr[-4000:]}')
    return result.stderr


def measure(ffmpeg, path):
    output = run_ffmpeg(ffmpeg, [
        '-i', str(path), '-map', '0:a:0', '-vn',
        '-af', f'loudnorm=I={TARGET_LUFS}:TP={TARGET_PEAK}:LRA=11:print_format=json',
        '-f', 'null', '-'
    ])
    blocks = re.findall(r'\{\s*"input_i".*?\}', output, re.DOTALL)
    if len(blocks) != 1:
        raise ValueError(f'No se pudo medir la sonoridad: {path.name}')
    fields = json.loads(blocks[0])
    stats = {key: float(fields[key]) for key in
             ('input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset')}
    if not all(math.isfinite(value) for value in stats.values()):
        raise ValueError(f'Audio silencioso o medicion no valida: {path.name}')
    duration = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', output)
    if not duration:
        raise ValueError(f'No se pudo medir la duracion: {path.name}')
    hours, minutes, seconds = map(float, duration.groups())
    stats['duration'] = hours * 3600 + minutes * 60 + seconds
    return stats


def normalize_one(ffmpeg, source, backup, previous):
    current_hash = file_hash(source)
    if previous and current_hash == previous['normalized_sha256']:
        if not backup.is_file() or file_hash(backup) != previous['original_sha256']:
            raise ValueError(f'Falta el respaldo original o ha cambiado: {source.name}')
        return None
    backup.parent.mkdir(parents=True, exist_ok=True)
    if backup.exists():
        if file_hash(backup) != current_hash:
            raise ValueError(f'El audio y su respaldo no coinciden: {source.name}')
    else:
        descriptor, copy_path = tempfile.mkstemp(dir=backup.parent, suffix='.copy')
        os.close(descriptor)
        try:
            shutil.copy2(source, copy_path)
            if file_hash(Path(copy_path)) != current_hash:
                raise ValueError(f'Copia original incompleta: {source.name}')
            os.replace(copy_path, backup)
        finally:
            if os.path.exists(copy_path):
                os.unlink(copy_path)

    before = measure(ffmpeg, backup)
    filter_text = (
        f'loudnorm=I={TARGET_LUFS}:TP={TARGET_PEAK}:LRA=11'
        f':measured_I={before["input_i"]}:measured_TP={before["input_tp"]}'
        f':measured_LRA={before["input_lra"]}:measured_thresh={before["input_thresh"]}'
        f':offset={before["target_offset"]}:linear=true:print_format=json'
    )
    descriptor, output_path = tempfile.mkstemp(dir=source.parent, suffix='.normalized.mp3')
    os.close(descriptor)
    output_path = Path(output_path)
    try:
        run_ffmpeg(ffmpeg, [
            '-y', '-i', str(backup), '-map', '0:a:0', '-map', '0:v?',
            '-map_metadata', '0', '-c:v', 'copy', '-af', filter_text,
            '-c:a', 'libmp3lame', '-q:a', '2', '-ar', '44100',
            '-id3v2_version', '3', str(output_path)
        ])
        after = measure(ffmpeg, output_path)
        if abs(after['input_i'] - TARGET_LUFS) > LOUDNESS_TOLERANCE:
            raise ValueError(f'Sonoridad fuera del objetivo: {source.name}: {after["input_i"]} LUFS')
        if after['input_tp'] > MAX_TRUE_PEAK:
            raise ValueError(f'Pico demasiado alto: {source.name}: {after["input_tp"]} dBTP')
        if abs(after['duration'] - before['duration']) > 0.15:
            raise ValueError(f'La duracion ha cambiado: {source.name}')
        if file_hash(source) != current_hash:
            raise ValueError(f'El audio cambio durante el proceso: {source.name}')
        return output_path, {
            'original_sha256': current_hash,
            'normalized_sha256': file_hash(output_path),
            'before': before,
            'after': after
        }
    except BaseException:
        output_path.unlink(missing_ok=True)
        raise


def save_manifest(path, data):
    descriptor, temporary = tempfile.mkstemp(dir=path.parent, suffix='.json.tmp')
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
            json.dump(data, output, ensure_ascii=False, indent=2)
            output.write('\n')
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description='Normaliza MP3 a -16 LUFS con respaldo y verificacion.')
    parser.add_argument('--category', required=True, help='Carpeta directa dentro de assets\\songs')
    parser.add_argument('--backup-dir', type=Path, default=REPO / 'audio-originals')
    parser.add_argument('--workers', type=int, default=2)
    parser.add_argument('--ffmpeg', help='Ruta al ejecutable FFmpeg')
    args = parser.parse_args()
    category = args.category
    if not category or Path(category).name != category or category in {'.', '..'}:
        parser.error('La categoria debe ser una carpeta directa.')
    if args.workers < 1 or args.workers > 4:
        parser.error('Usa entre 1 y 4 procesos.')
    source_dir = REPO / 'assets' / 'songs' / category
    backup_root = args.backup_dir.resolve()
    if backup_root == source_dir or source_dir in backup_root.parents:
        parser.error('La copia de seguridad no puede estar dentro de la lista.')
    files = sorted(source_dir.glob('*.mp3'))
    if not files:
        parser.error('La lista no contiene MP3.')
    ffmpeg = args.ffmpeg or shutil.which('ffmpeg')
    if not ffmpeg:
        try:
            import imageio_ffmpeg
        except ImportError:
            parser.error('Instala FFmpeg o ejecuta: python -m pip install imageio-ffmpeg')
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    backup_dir = backup_root / category
    backup_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = backup_dir / 'normalization.json'
    if manifest_path.exists():
        with manifest_path.open(encoding='utf-8') as saved:
            manifest = json.load(saved)
        if manifest['target_lufs'] != TARGET_LUFS or manifest['target_peak'] != TARGET_PEAK:
            parser.error('El respaldo corresponde a otro objetivo de normalizacion.')
    else:
        manifest = {'target_lufs': TARGET_LUFS, 'target_peak': TARGET_PEAK, 'files': {}}
    print(f'Lista: {category}. Archivos: {len(files)}. Respaldo: {backup_dir}', flush=True)
    failures = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(normalize_one, ffmpeg, file, backup_dir / file.name,
                            manifest['files'].get(file.name)): file for file in files
        }
        for count, future in enumerate(as_completed(futures), 1):
            source = futures[future]
            staged = None
            try:
                result = future.result()
                if result is None:
                    print(f'[{count}/{len(files)}] YA NORMALIZADO: {source.name}', flush=True)
                    continue
                staged, record = result
                manifest['files'][source.name] = record
                save_manifest(manifest_path, manifest)
                os.replace(staged, source)
                print(f'[{count}/{len(files)}] OK {record["before"]["input_i"]} -> '
                      f'{record["after"]["input_i"]} LUFS: {source.name}', flush=True)
            except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
                failures.append(source.name)
                print(f'[{count}/{len(files)}] ERROR {source.name}: {error}', flush=True)
            finally:
                if staged is not None:
                    staged.unlink(missing_ok=True)
    if failures:
        raise SystemExit(f'No se pudieron normalizar {len(failures)} archivos. Revisa los errores y reintenta.')
    print(f'COMPLETADO: {len(files)} canciones verificadas. Originales en {backup_dir}', flush=True)


if __name__ == '__main__':
    main()
