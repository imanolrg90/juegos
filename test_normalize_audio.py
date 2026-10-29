from pathlib import Path
import tempfile
import unittest

import imageio_ffmpeg

from tools.normalize_audio import file_hash, normalize_one, run_ffmpeg, save_manifest


class NormalizeAudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)

    def create_tone(self, name, volume):
        source = self.root / name
        run_ffmpeg(self.ffmpeg, [
            '-f', 'lavfi', '-i', 'sine=frequency=440:duration=8',
            '-af', f'volume={volume}', '-c:a', 'libmp3lame', '-q:a', '2', str(source)
        ])
        return source

    def test_quiet_and_loud_audio_reach_same_loudness_and_backup_is_exact(self):
        results = []
        for name, volume in [('quiet.mp3', 0.1), ('loud.mp3', 2)]:
            source = self.create_tone(name, volume)
            original_hash = file_hash(source)
            backup = self.root / 'backups' / name
            staged, record = normalize_one(self.ffmpeg, source, backup, None)
            self.addCleanup(staged.unlink, missing_ok=True)
            self.assertEqual(file_hash(source), original_hash)
            self.assertEqual(file_hash(backup), original_hash)
            self.assertLessEqual(abs(record['after']['input_i'] + 16), 0.5)
            self.assertLessEqual(record['after']['input_tp'], -1)
            staged.replace(source)
            self.assertIsNone(normalize_one(self.ffmpeg, source, backup, record))
            results.append(record['after']['input_i'])
        self.assertLessEqual(abs(results[0] - results[1]), 0.5)

    def test_changed_source_is_not_overwritten(self):
        source = self.create_tone('source.mp3', 1)
        backup = self.root / 'backups' / source.name
        staged, record = normalize_one(self.ffmpeg, source, backup, None)
        self.addCleanup(staged.unlink, missing_ok=True)
        staged.replace(source)
        with source.open('ab') as changed:
            changed.write(b'changed')
        changed_hash = file_hash(source)
        with self.assertRaisesRegex(ValueError, 'no coinciden'):
            normalize_one(self.ffmpeg, source, backup, record)
        self.assertEqual(file_hash(source), changed_hash)

    def test_completed_audio_requires_an_intact_original_backup(self):
        source = self.create_tone('source.mp3', 1)
        backup = self.root / 'backups' / source.name
        staged, record = normalize_one(self.ffmpeg, source, backup, None)
        self.addCleanup(staged.unlink, missing_ok=True)
        staged.replace(source)
        backup.write_bytes(b'changed original')
        normalized_hash = file_hash(source)
        with self.assertRaisesRegex(ValueError, 'respaldo original'):
            normalize_one(self.ffmpeg, source, backup, record)
        self.assertEqual(file_hash(source), normalized_hash)

    def test_silence_is_reported_without_replacing_audio(self):
        source = self.root / 'silence.mp3'
        run_ffmpeg(self.ffmpeg, [
            '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
            '-t', '3', '-c:a', 'libmp3lame', str(source)
        ])
        original_hash = file_hash(source)
        with self.assertRaisesRegex(ValueError, 'silencioso'):
            normalize_one(self.ffmpeg, source, self.root / 'backup' / source.name, None)
        self.assertEqual(file_hash(source), original_hash)

    def test_manifest_is_valid_and_replaced(self):
        path = self.root / 'normalization.json'
        save_manifest(path, {'files': {}})
        save_manifest(path, {'files': {'song': {'value': 1}}})
        self.assertIn('"song"', path.read_text())
        self.assertEqual(list(self.root.iterdir()), [path])


if __name__ == '__main__':
    unittest.main()
