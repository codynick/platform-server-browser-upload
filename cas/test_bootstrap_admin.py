import importlib.util,io,json,os,sqlite3,subprocess,sys,tempfile,unittest
from contextlib import closing
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('bootstrap',HERE/'bootstrap_admin.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Terminal(io.StringIO):
 def isatty(self):return True
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.db=self.root/'private.sqlite3'
 def schema(self):
  with closing(sqlite3.connect(self.db)) as db,db:
   db.executescript("CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT,email TEXT);CREATE TABLE sessions(token TEXT PRIMARY KEY,user_id TEXT,csrf TEXT,expires INTEGER);CREATE TABLE projects(id TEXT PRIMARY KEY,owner TEXT,body TEXT);CREATE TABLE account_access(user_id TEXT PRIMARY KEY,role TEXT NOT NULL DEFAULT 'user',seconds INTEGER NOT NULL DEFAULT 20,plan TEXT NOT NULL DEFAULT '',starts INTEGER,ends INTEGER);CREATE TABLE access_audit(id INTEGER PRIMARY KEY,actor TEXT,target TEXT,at INTEGER,before_json TEXT,after_json TEXT);")
 def test_fresh_prompt_does_not_create_database(self):
  out=io.StringIO();self.assertEqual(m.select_id(self.db,reader=Terminal('teacher-123\n'),writer=out),'teacher-123');self.assertEqual(out.getvalue().count('First admin CodyNick ID:'),1);self.assertFalse(self.db.exists())
 def test_prompt_retries_blank(self):
  out=io.StringIO();self.assertEqual(m.select_id(self.db,reader=Terminal('\n  teacher  \n'),writer=out),'teacher');self.assertEqual(out.getvalue().count('First admin CodyNick ID:'),2)
 def test_no_tty_requires_explicit_id(self):
  with self.assertRaisesRegex(ValueError,'interactive'):m.select_id(self.db,reader=io.StringIO('teacher\n'))
  self.assertFalse(self.db.exists());self.assertEqual(m.select_id(self.db,'teacher',reader=io.StringIO()),'teacher')
 def test_eof_aborts(self):
  with self.assertRaisesRegex(ValueError,'Nothing deployed'):m.select_id(self.db,reader=Terminal(),writer=io.StringIO())
 def test_invalid_ids(self):
  for value in ['', ' ', 'x'*256, 'x\ny', 'x\x00y']:
   with self.assertRaises(ValueError):m.valid_id(value)
 def test_old_database_select_is_readonly(self):
  with closing(sqlite3.connect(self.db)) as db,db:db.executescript("CREATE TABLE users(id TEXT PRIMARY KEY);INSERT INTO users VALUES('old');")
  before=self.db.read_bytes();self.assertEqual(m.select_id(self.db,'teacher'),'teacher');self.assertEqual(self.db.read_bytes(),before)
 def test_pending_admin_skips_prompt_on_repeat(self):
  self.schema();m.apply_id(self.db,'not-signed-in-yet');before=self.db.read_bytes();self.assertEqual(m.select_id(self.db,reader=io.StringIO()),'');self.assertEqual(m.select_id(self.db,'different'),'');self.assertEqual(self.db.read_bytes(),before)
 def test_reserved_id_does_not_create_account_or_session(self):
  self.schema();self.assertTrue(m.apply_id(self.db,'teacher'))
  with closing(sqlite3.connect(self.db)) as db:
   self.assertEqual(db.execute('SELECT count(*) FROM users').fetchone()[0],0);self.assertEqual(db.execute('SELECT count(*) FROM sessions').fetchone()[0],0);self.assertEqual(db.execute("SELECT role FROM account_access WHERE user_id='teacher'").fetchone()[0],'admin');self.assertEqual(db.execute('SELECT count(*) FROM access_audit').fetchone()[0],1)
 def test_existing_settings_and_projects_preserved(self):
  self.schema()
  with closing(sqlite3.connect(self.db)) as db,db:
   db.execute("INSERT INTO users VALUES('teacher','Teacher','t@test')");db.execute("INSERT INTO projects VALUES('project','teacher','keep')");db.execute("INSERT INTO account_access VALUES('teacher','user',7,'Unlimited',1,NULL)")
  m.apply_id(self.db,'teacher')
  with closing(sqlite3.connect(self.db)) as db:
   self.assertEqual(db.execute("SELECT role,seconds,plan FROM account_access WHERE user_id='teacher'").fetchone(),('admin',7,'Unlimited'));self.assertEqual(db.execute('SELECT body FROM projects').fetchone()[0],'keep')
 def test_repeat_apply_cannot_add_another_admin(self):
  self.schema();m.apply_id(self.db,'first');self.assertFalse(m.apply_id(self.db,'second'))
  with closing(sqlite3.connect(self.db)) as db:self.assertEqual(db.execute('SELECT user_id FROM account_access').fetchall(),[('first',)])
 def test_concurrent_bootstrap_creates_only_one_admin(self):
  self.schema()
  with ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda uid:m.apply_id(self.db,uid),['first','second']))
  self.assertEqual(sorted(results),[False,True])
 def test_select_cli_stdout_contains_only_id(self):
  result=subprocess.run([sys.executable,str(HERE/'bootstrap_admin.py'),'--select','--database',str(self.db)],env=dict(os.environ,CODYNICK_ADMIN_ID='teacher'),capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(result.stdout,'teacher\n');self.assertFalse(self.db.exists())
 def test_explicit_database_does_not_read_private_config(self):
  self.schema();config=self.root/'private-config.json';config.write_text('not JSON')
  result=subprocess.run([sys.executable,str(HERE/'bootstrap_admin.py'),'--apply','--database',str(self.db),'--config',str(config),'--admin-id','teacher'],capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stderr);self.assertTrue(m.configured(self.db))
 def test_installer_order_and_admin_static_rollback(self):
  root=HERE.parent;setup=(root/'setup.sh').read_text();cas=(HERE/'update.sh').read_text()
  self.assertLess(setup.index('bootstrap_admin.py\" --select'),setup.index('bash "$repo/install.sh"'));self.assertIn('export CODYNICK_ADMIN_ID',setup)
  self.assertLess(cas.index('bootstrap_admin.py --select'),cas.index('apt-get update'));self.assertGreater(cas.index('bootstrap_admin.py --database'),cas.index('curl --fail --silent'))
  self.assertIn('runuser -u codynick-cas',cas)
  for name in ['install.sh','rollback.sh','cas/rollback.sh']:self.assertIn('dashboard admin',(root/name).read_text())
if __name__=='__main__':unittest.main(verbosity=2)
