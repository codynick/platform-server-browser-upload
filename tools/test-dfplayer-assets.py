from pathlib import Path
import hashlib,importlib.util,json,tempfile,unittest
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('media',Path(__file__).with_name('verify-dfplayer-assets.py'));media=importlib.util.module_from_spec(spec);spec.loader.exec_module(media)
class MediaTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.base=Path(self.temp.name);(self.base/'audio').mkdir();self.file=self.base/'audio/f01-t0001.mp3';self.file.write_bytes(b'unchanged media\r\n\0bytes');self.track={'folder':1,'track':1,'file':'audio/f01-t0001.mp3','sha256':hashlib.sha256(self.file.read_bytes()).hexdigest()}
 def catalogue(self,tracks):
  (self.base/'catalog.json').write_text(json.dumps({'version':1,'tracks':tracks}),encoding='utf-8')
 def test_exact_bytes(self):
  self.catalogue([self.track]);self.assertEqual(media.verify(self.base),1)
 def test_modified_media(self):
  self.catalogue([self.track]);self.file.write_bytes(b'changed');self.assertRaises(ValueError,media.verify,self.base)
 def test_missing_media(self):
  self.catalogue([self.track]);self.file.unlink();self.assertRaises(ValueError,media.verify,self.base)
 def test_duplicate_tracks(self):
  self.catalogue([self.track,self.track]);self.assertRaises(ValueError,media.verify,self.base)
 def test_invalid_paths(self):
  self.catalogue([{**self.track,'file':'../outside.mp3'}]);self.assertRaises(ValueError,media.verify,self.base)
 def test_excluded_folders(self):
  for folder in [7,16]:
   self.catalogue([{**self.track,'folder':folder}]);self.assertRaises(ValueError,media.verify,self.base)
if __name__=='__main__':unittest.main(verbosity=2)
