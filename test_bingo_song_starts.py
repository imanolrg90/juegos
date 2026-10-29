import json
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

from app import app
from bingo_song_starts import START_MARKER, save_song_start


class BingoSongStartsTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        os.makedirs(os.path.join(self.directory.name, 'js'))
        self.path = os.path.join(self.directory.name, 'js', 'songs.js')
        self.song = 'Halloween/Pe\u00f1a - "Luz".mp3'
        self.original = (
            'const sourceSongs = [\r\n'
            f'    {{ file: {json.dumps(self.song, ensure_ascii=False)}, title: "Luz", startTime: 3 }},\r\n'
            '    { file: "Normal/ABBA.mp3", title: "Queen" }\r\n'
            '];\r\n'
        )
        with open(self.path, 'w', encoding='utf-8', newline='') as catalog:
            catalog.write(self.original)
        self.root_patch = patch.object(app, 'root_path', self.directory.name)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.client = app.test_client()

    def read_catalog(self):
        with open(self.path, encoding='utf-8', newline='') as catalog:
            return catalog.read()

    def saved_starts(self):
        text = self.read_catalog().replace('\r\n', '\n')
        return json.loads(text.split('const BINGO_SONG_START_TIMES = ')[1].split(';\n')[0])

    def test_saves_and_replaces_start_preserving_original_catalog(self):
        for seconds in (24.125, 45.75, 0):
            response = self.client.post('/api/bingo/song-start', json={'file': self.song, 'startTime': seconds})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), {'file': self.song, 'startTime': seconds})
            self.assertEqual(self.saved_starts(), {self.song: seconds})
            text = self.read_catalog()
            self.assertTrue(text.startswith(self.original))
            self.assertEqual(text.replace('\r\n', '\n').count(START_MARKER), 1)
            self.assertNotIn('\n', text.replace('\r\n', ''))

    def test_other_songs_and_concurrent_saves_are_preserved(self):
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(save_song_start, self.path, self.song, 10),
                executor.submit(save_song_start, self.path, 'Normal/ABBA.mp3', 20)
            ]
            for future in futures:
                future.result()
        self.assertEqual(self.saved_starts(), {self.song: 10, 'Normal/ABBA.mp3': 20})

    def test_rounds_to_milliseconds(self):
        response = self.client.post('/api/bingo/song-start', json={'file': self.song, 'startTime': 12.34567})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['startTime'], 12.346)
        self.assertEqual(self.saved_starts()[self.song], 12.346)

    def test_invalid_requests_do_not_modify_file(self):
        for value in (-1, True, None, '12', float('inf'), float('nan'), {}, []):
            with self.subTest(value=value):
                response = self.client.post('/api/bingo/song-start', json={'file': self.song, 'startTime': value})
                self.assertEqual(response.status_code, 400)
                self.assertEqual(self.read_catalog(), self.original)
        response = self.client.post('/api/bingo/song-start', json=[])
        self.assertEqual(response.status_code, 400)

    def test_unknown_song_and_cross_origin_are_rejected(self):
        response = self.client.post('/api/bingo/song-start', json={'file': '../app.py', 'startTime': 10})
        self.assertEqual(response.status_code, 404)
        response = self.client.post('/api/bingo/song-start', json={'file': self.song, 'startTime': 10},
                                    headers={'Origin': 'https://other.example'})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.read_catalog(), self.original)

    def test_write_failure_reports_error_and_preserves_catalog(self):
        with patch('bingo_song_starts.os.replace', side_effect=PermissionError('denied')):
            with self.assertLogs(app.logger, level='ERROR'):
                response = self.client.post('/api/bingo/song-start', json={'file': self.song, 'startTime': 10})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(self.read_catalog(), self.original)
        self.assertEqual(os.listdir(os.path.dirname(self.path)), ['songs.js'])

    def test_malformed_block_reports_error_without_overwriting(self):
        with open(self.path, 'a', encoding='utf-8') as catalog:
            catalog.write(START_MARKER + 'broken\n// END BINGO SONG START TIMES\n')
        before = self.read_catalog()
        with self.assertLogs(app.logger, level='ERROR'):
            response = self.client.post('/api/bingo/song-start', json={'file': self.song, 'startTime': 10})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(self.read_catalog(), before)


if __name__ == '__main__':
    unittest.main()
