import os
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import unquote

from app import app


class BingoSponsorsTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.images_path = os.path.join(self.directory.name, 'assets', 'img')
        os.makedirs(os.path.join(self.images_path, 'estandar'))
        self.root_patch = patch.object(app, 'root_path', self.directory.name)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.client = app.test_client()

    def create_file(self, *parts):
        filename = os.path.join(self.images_path, *parts)
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'wb') as image:
            image.write(b'test')

    def test_discovers_folders_and_images_without_song_metadata(self):
        self.create_file('Halloween', 'Pe\u00f1a #1.PNG')
        self.create_file('Halloween', 'Logo.webp')
        self.create_file('Halloween', 'notes.txt')
        self.create_file('Halloween', 'nested', 'Ignored.jpg')
        self.create_file('Loose.jpg')
        response = self.client.get('/api/bingo/sponsors')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')
        catalog = response.get_json()
        self.assertEqual(catalog['defaultFolder'], 'estandar')
        self.assertEqual([folder['name'] for folder in catalog['folders']], ['estandar', 'Halloween'])
        self.assertEqual(catalog['folders'][0]['sponsors'], [])
        sponsors = catalog['folders'][1]['sponsors']
        self.assertEqual({sponsor['name'] for sponsor in sponsors}, {'Logo', 'Pe\u00f1a #1'})
        encoded = next(sponsor['img'] for sponsor in sponsors if sponsor['name'] != 'Logo')
        self.assertEqual(unquote(encoded), 'img/Halloween/Pe\u00f1a #1.PNG')
        self.assertNotIn('#', encoded)

    def test_refresh_detects_new_folders_and_all_images_above_90(self):
        for index in range(95):
            self.create_file('Fiesta', f'{index}.jpg')
        first = self.client.get('/api/bingo/sponsors').get_json()
        self.assertEqual(len(first['folders'][1]['sponsors']), 95)
        self.create_file('Nueva', 'Sponsor.avif')
        second = self.client.get('/api/bingo/sponsors').get_json()
        self.assertEqual([folder['name'] for folder in second['folders']], ['estandar', 'Fiesta', 'Nueva'])

    def test_missing_required_default_reports_error(self):
        os.rmdir(os.path.join(self.images_path, 'estandar'))
        with self.assertLogs(app.logger, level='ERROR'):
            response = self.client.get('/api/bingo/sponsors')
        self.assertEqual(response.status_code, 500)
        self.assertIn('estandar', response.get_json()['error'])

    def test_read_error_is_reported(self):
        with patch('app.os.scandir', side_effect=PermissionError('denied')):
            with self.assertLogs(app.logger, level='ERROR'):
                response = self.client.get('/api/bingo/sponsors')
        self.assertEqual(response.status_code, 500)
        self.assertIn('error', response.get_json())


if __name__ == '__main__':
    unittest.main()
