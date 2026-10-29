import json
import math
import os
import re
import tempfile
from threading import Lock


START_MARKER = '// BEGIN BINGO SONG START TIMES\n'
END_MARKER = '// END BINGO SONG START TIMES'
catalog_lock = Lock()


class SongNotFoundError(LookupError):
    pass


def save_song_start(catalog_path, song_file, seconds):
    with catalog_lock:
        with open(catalog_path, encoding='utf-8', newline='') as catalog:
            source = catalog.read()
        newline = '\r\n' if '\r\n' in source else '\n'
        normalized = source.replace('\r\n', '\n')
        marker_index = normalized.find(START_MARKER)
        base = normalized if marker_index == -1 else normalized[:marker_index]
        files = {
            json.loads(match.group(1))
            for match in re.finditer(r'\bfile\s*:\s*("(?:\\.|[^"\\])*")', base)
        }
        if song_file not in files:
            raise SongNotFoundError('La cancion no existe en el catalogo.')
        starts = {}
        if marker_index != -1:
            block = normalized[marker_index + len(START_MARKER):]
            if not block.endswith(END_MARKER + '\n'):
                raise ValueError('El bloque de inicios de canciones no es valido.')
            json_text = block.split('const BINGO_SONG_START_TIMES = ', 1)[1].split(';\n', 1)[0]
            starts = json.loads(json_text)
            if not isinstance(starts, dict) or any(
                not isinstance(value, (int, float)) or isinstance(value, bool)
                or not math.isfinite(value) or value < 0 for value in starts.values()
            ):
                raise ValueError('Los inicios guardados no son validos.')
        starts[song_file] = seconds
        block = (
            START_MARKER
            + 'const BINGO_SONG_START_TIMES = '
            + json.dumps(starts, ensure_ascii=False, indent=4, sort_keys=True)
            + ';\n'
            + 'sourceSongs.forEach(song => {\n'
            + '    if (Object.prototype.hasOwnProperty.call(BINGO_SONG_START_TIMES, song.file)) {\n'
            + '        song.startTime = BINGO_SONG_START_TIMES[song.file];\n'
            + '    }\n'
            + '});\n'
            + END_MARKER + '\n'
        )
        updated = (base + ('' if base.endswith('\n') else '\n') + block).replace('\n', newline)
        descriptor, temporary_path = tempfile.mkstemp(dir=os.path.dirname(catalog_path), suffix='.tmp')
        try:
            with os.fdopen(descriptor, 'w', encoding='utf-8', newline='') as output:
                output.write(updated)
            os.replace(temporary_path, catalog_path)
        finally:
            if os.path.exists(temporary_path):
                os.unlink(temporary_path)
