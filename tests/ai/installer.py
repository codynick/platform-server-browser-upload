import contextlib,hashlib,importlib.util,io,json,pathlib,shutil,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patch',ROOT/'apply.py');patch=importlib.util.module_from_spec(spec);spec.loader.exec_module(patch)
BASE=pathlib.Path(__file__).resolve().parents[3]/'latest/platform-server-browser-upload'
class Installer(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);self.site=self.root/'site';self.site.mkdir();self.backups=self.root/'backups';self.manifest=json.loads((ROOT/'PATCH_MANIFEST.json').read_text())
  for n,e in self.manifest['files'].items():
   if e['before'] is not None:
    p=self.site/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(BASE/n,p)
  (self.site/'account-data-sentinel').write_text('unchanged')
 def tearDown(self):self.tmp.cleanup()
 def apply(self):
  with contextlib.redirect_stdout(io.StringIO()):return patch.apply(self.site,self.backups)
 def snapshot(self):return {str(p.relative_to(self.site)):hashlib.sha256(p.read_bytes()).hexdigest() for p in self.site.rglob('*') if p.is_file()}
 def test_apply_repeat_rollback(self):
  original=self.snapshot();backup=self.apply();self.assertIsNone(self.apply());self.assertEqual((self.site/'account-data-sentinel').read_text(),'unchanged')
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_preserve_documentation(self):
  for n in ('README.md','RELEASE_NOTES.md','START_HERE.txt'):(self.site/n).write_text('Deployed custom notes: '+n)
  original=self.snapshot();backup=self.apply()
  for n in ('README.md','RELEASE_NOTES.md','START_HERE.txt'):self.assertEqual((self.site/n).read_text(),'Deployed custom notes: '+n)
  self.assertIsNone(self.apply())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_verified_deployed_index(self):
  supplied=BASE.parents[1]/'upload/codynick-server-index.html'
  shutil.copy2(supplied,self.site/'blocks/index.html');original=self.snapshot();backup=self.apply()
  self.assertIn('/blocks/accounts.js?v=3.21.0',(self.site/'blocks/index.html').read_text())
  self.assertIn('/blocks/accounts.css?v=3.21.0',(self.site/'blocks/index.html').read_text())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_unverified_index_change_rejected(self):
  p=self.site/'blocks/index.html';p.write_text(p.read_text().replace('CodyNick Block IDE','Changed editor'))
  with self.assertRaisesRegex(RuntimeError,'blocks/index.html'):self.apply()
  self.assertFalse(self.backups.exists())
 def test_line_endings(self):
  for n,e in self.manifest['files'].items():
   if e.get('before_lf'):
    p=self.site/n;p.write_bytes(p.read_bytes().replace(b'\r\n',b'\n'))
  original=self.snapshot();backup=self.apply()
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_reports_all_code_mismatches(self):
  for n in ('blocks/runtime.js','blocks/blocks.js'):(self.site/n).write_text('different')
  with self.assertRaisesRegex(RuntimeError,'blocks/blocks.js.*blocks/runtime.js'):self.apply()
  self.assertFalse(self.backups.exists())
 def test_mismatch(self):
  (self.site/'blocks/runtime.js').write_text('different');s=self.snapshot()
  with self.assertRaisesRegex(RuntimeError,'Baseline mismatch'):self.apply()
  self.assertEqual(s,self.snapshot());self.assertFalse(self.backups.exists())
 def test_upgrade_previous_ai_trial(self):
  previous=BASE.parents[1]/'build/previous-ai/payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/ai/workbench.js').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_previous_workbench(self):
  previous=BASE.parents[1]/'build/previous-workbench/payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertIn('Speed and detail',(self.site/'blocks/index.html').read_text())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_speed_patch(self):
  previous=BASE.parents[1]/'build/previous-speed/payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/ai/ocr/host.js').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_ocr_patch(self):
  previous=BASE.parents[1]/'build/previous-ocr-payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/ai/ocr/image.js').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_accuracy_patch(self):
  previous=BASE.parents[1]/'build/previous-accuracy-payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/ai/speech/english-small-0.15.tar.gz').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_voice_patch(self):
  previous=BASE.parents[1]/'build/previous-voice-payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/examples/ai-speech-transcription.codynick').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_speech_patch(self):
  previous=BASE.parents[1]/'build/previous-speech-payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/ai/tts.js').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_upgrade_tts_patch(self):
  previous=BASE.parents[1]/'build/previous-tts-payload'
  for src in previous.rglob('*'):
   if src.is_file():
    dst=self.site/src.relative_to(previous);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
  original=self.snapshot();backup=self.apply()
  self.assertEqual((self.site/'VERSION').read_text().strip(),'3.21.1-ai.9')
  self.assertTrue((self.site/'blocks/ai/llm.js').is_file())
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_cas_deployed_pages(self):
  for name in ('blocks/index.html','dashboard/index.html','simulator/index.html'):
   p=self.site/name;s=p.read_text();s=s.replace('/blocks/accounts.js?v=3.20.4','/blocks/accounts.js?v=3.21.0').replace('/blocks/accounts.css?v=3.20.4','/blocks/accounts.css?v=3.21.0');p.write_text(s)
  original=self.snapshot();backup=self.apply()
  with contextlib.redirect_stdout(io.StringIO()):patch.rollback(backup)
  self.assertEqual(original,self.snapshot())
 def test_version(self):
  (self.site/'VERSION').write_text('3.20.4')
  with self.assertRaisesRegex(RuntimeError,'Expected uploaded snapshot'):self.apply()
 def test_corrupt_payload(self):
  alternate=self.root/'package';alternate.mkdir();shutil.copy2(ROOT/'PATCH_MANIFEST.json',alternate/'PATCH_MANIFEST.json');(alternate/'payload/blocks').mkdir(parents=True)
  (alternate/'payload/VERSION').write_text('bad')
  old=patch.ROOT;patch.ROOT=alternate
  try:
   with self.assertRaisesRegex(RuntimeError,'integrity failure'):self.apply()
  finally:patch.ROOT=old
  self.assertFalse(self.backups.exists())
 def test_symlink(self):
  p=self.site/'blocks/runtime.js';p.unlink();p.symlink_to(self.site/'VERSION')
  with self.assertRaisesRegex(RuntimeError,'symbolic link'):self.apply()
 def test_rollback_refuses_later_edits(self):
  backup=self.apply();(self.site/'blocks/runtime.js').write_text('later edit')
  with self.assertRaisesRegex(RuntimeError,'changed after patch'):patch.rollback(backup)
  self.assertEqual((self.site/'blocks/runtime.js').read_text(),'later edit')
 def test_partial_failure_recovers(self):
  original=self.snapshot();old=patch.atomic_copy;calls=0
  def fail_once(src,dst):
   nonlocal calls
   calls+=1
   if calls==4:raise OSError('Injected write failure')
   old(src,dst)
  patch.atomic_copy=fail_once
  try:
   with self.assertRaisesRegex(OSError,'Injected'):self.apply()
  finally:patch.atomic_copy=old
  self.assertEqual(original,self.snapshot())
if __name__=='__main__':unittest.main(verbosity=2)
