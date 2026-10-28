"""Exercise real website deploy/rollback with OS service operations mocked."""
import os,pathlib,shutil,sqlite3,subprocess,sys,tempfile,unittest
REPO=pathlib.Path(__file__).resolve().parents[1]
BASH=shutil.which('bash') if os.name!='nt' else r'C:\Program Files\Git\bin\bash.exe'

@unittest.skipUnless(BASH and pathlib.Path(BASH).exists(),'Bash required')
class DeployTests(unittest.TestCase):
 def run_case(self,old=True,fail=False,blank=False):
  # Every path the adapted shell scripts can mutate is confined to this fixture.
  root=pathlib.Path(tempfile.mkdtemp(prefix='codynick-deploy-test-')).resolve();prefix=root.as_posix()
  source=root/'source';shutil.copytree(REPO,source,ignore=shutil.ignore_patterns('.git','__pycache__','.venv'))
  for file in list(source.glob('*.sh'))+list((source/'backend').glob('*.sh'))+[source/'backend/configure.py']:
   text=file.read_text(encoding='utf-8-sig')
   text='\n'.join(line for line in text.splitlines() if not line.startswith(('if [[ ${EUID}','[[ ${EUID}','[[ $EUID')))+'\n'
   for name in ['root','var','etc','opt']:text=text.replace('/'+name+'/',prefix+'/'+name+'/')
   file.write_text(text,encoding='utf-8',newline='\n')
  site=root/'var/www/ide.codynick.com';site.mkdir(parents=True)
  for section in ([] if blank else ['blocks','simulator','dashboard','assets']):(site/section).mkdir();(site/section/'old.txt').write_text('old-'+section)
  for name in ([] if blank else ['index.html','landing.css']):(site/name).write_text('old-'+name)
  for name in ([] if blank else ['tool-navigation.css','favicon.ico','codynick-logo.png']):(site/'assets'/name).write_text('old-'+name)
  (root/'root').mkdir();(root/'opt').mkdir();(root/'etc/systemd/system').mkdir(parents=True);enabled=root/'etc/apache2/sites-enabled';enabled.mkdir(parents=True)
  apache=enabled/'site.conf';old_apache='<VirtualHost *:443>\n ServerName ide.codynick.com\n CustomLog log combined\n</VirtualHost>\n';apache.write_text(old_apache)
  data=root/'var/lib/codynick-cas';data.mkdir(parents=True);database=data/'projects.sqlite3'
  if old:
   (root/'opt/codynick-cas').mkdir();(root/'opt/codynick-cas/app.py').write_text('old backend')
   (root/'etc/codynick-cas').mkdir();(root/'etc/codynick-cas/config.json').write_text('{"CAS_BASE_URL":"https://id.codynick.com/cas","CAS_VALIDATE_URL":"https://id.codynick.com/cas/p3/serviceValidate","CAS_ID_ATTRIBUTE":"uid"}')
   (root/'etc/systemd/system/codynick-cas.service').write_text('old unit');(root/'active').touch();(root/'enabled').touch()
   with sqlite3.connect(database) as db:db.execute('CREATE TABLE items(value TEXT)');db.execute("INSERT INTO items VALUES('old project')")
  bin=root/'bin';bin.mkdir()
  def executable(name,text):
   file=bin/name;file.write_text(text,encoding='utf-8',newline='\n');file.chmod(0o755)
  executable('python3','#!/bin/bash\nexec "'+pathlib.Path(sys.executable).as_posix()+'" "$@"\n')
  for name in ['chmod','chown','apache2ctl']:executable(name,'#!/bin/bash\nexit 0\n')
  executable('systemctl','#!/bin/bash\nroot="'+prefix+'"\ncase "$1" in\nis-active) [[ -f "$root/active" ]];;\nis-enabled) [[ -f "$root/enabled" ]];;\nstop) rm -f "$root/active";;\nstart|restart) touch "$root/active";;\nenable) touch "$root/enabled";;\ndisable) rm -f "$root/enabled";;\n*) exit 0;;\nesac\n')
  executable('install','#!/bin/bash\nargs=();directory=false\nwhile (($#)); do case "$1" in --) shift;; -m|-o|-g) shift 2;; -d) directory=true;shift;; *) args+=("$1");shift;; esac;done\nif $directory; then mkdir -p -- "${args[@]}";else cp -- "${args[@]}";fi\n')
  stub=r"""#!/bin/bash
set -euo pipefail
root='@ROOT@'
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$root/opt/codynick-cas" "$root/etc/codynick-cas"
echo 'new backend' > "$root/opt/codynick-cas/app.py"
python3 "$source_dir/configure.py" config "$CODYNICK_DOMAIN" "$root/etc/codynick-cas/config.json"
python3 "$source_dir/configure.py" apply-apache "$CODYNICK_DOMAIN" "$CODYNICK_BACKUP"
echo 'new unit' > "$root/etc/systemd/system/codynick-cas.service"
python3 - "$root/var/lib/codynick-cas/projects.sqlite3" <<'PY'
import sqlite3,sys
with sqlite3.connect(sys.argv[1]) as db:
 db.execute('CREATE TABLE IF NOT EXISTS items(value TEXT)')
 db.execute("INSERT INTO items VALUES('new project')")
PY
if [[ ${FAIL_DEPLOY:-0} == 1 ]];then exit 42;fi
""".replace('@ROOT@',prefix)
  (source/'backend/install.sh').write_text(stub,encoding='utf-8',newline='\n')
  env={**os.environ,'PATH':str(bin)+os.pathsep+os.environ['PATH'],'PYTHONUTF8':'1','CODYNICK_DOMAIN':'ide.codynick.com','FAIL_DEPLOY':'1' if fail else '0'}
  mock_path=bin.as_posix()
  if os.name=='nt':mock_path='/'+mock_path[0].lower()+mock_path[2:]
  def command(script):return [BASH,'-c','export PATH="'+mock_path+':$PATH"; script=$1; shift; exec bash "$script" "$@"','fixture',script.as_posix()]
  run=subprocess.run(command(source/'install.sh'),env=env,capture_output=True,text=True)
  self.assertEqual(run.returncode,42 if fail else 0,run.stdout+'\n'+run.stderr)
  backup=next((root/'root').glob('codynick-portal-backup-*'))
  if not fail:
   self.assertIn('new backend',(root/'opt/codynick-cas/app.py').read_text())
   restored=subprocess.run(command(backup/'rollback.sh'),env=env,capture_output=True,text=True);self.assertEqual(restored.returncode,0,restored.stdout+'\n'+restored.stderr)
  if not blank:self.assertEqual((site/'index.html').read_text(),'old-index.html');self.assertEqual((site/'blocks/old.txt').read_text(),'old-blocks');self.assertEqual((site/'assets/codynick-logo.png').read_text(),'old-codynick-logo.png');self.assertEqual(apache.read_text(),old_apache)
  if blank:self.assertFalse((site/'index.html').exists());self.assertFalse((site/'blocks').exists())
  if old:
   self.assertEqual((root/'opt/codynick-cas/app.py').read_text(),'old backend');self.assertEqual((root/'etc/systemd/system/codynick-cas.service').read_text(),'old unit')
   with sqlite3.connect(backup/'database.sqlite3') as db:self.assertEqual(db.execute('SELECT count(*) FROM items').fetchone()[0],1)
  else:self.assertFalse((root/'opt/codynick-cas').exists());self.assertFalse((root/'etc/systemd/system/codynick-cas.service').exists())
  with sqlite3.connect(database) as db:self.assertEqual(db.execute('SELECT count(*) FROM items').fetchone()[0],2 if old else 1)
  if old and not fail:
   restore=subprocess.run(command(backup/'restore-database.sh')+[(backup/'database.sqlite3').as_posix()],env=env,capture_output=True,text=True)
   self.assertEqual(restore.returncode,0,restore.stdout+'\n'+restore.stderr)
   with sqlite3.connect(database) as db:self.assertEqual(db.execute('SELECT count(*) FROM items').fetchone()[0],1)
   safety=next((root/'root').glob('codynick-database-before-restore-*.sqlite3'))
   with sqlite3.connect(safety) as db:self.assertEqual(db.execute('SELECT count(*) FROM items').fetchone()[0],2)
  # No recursive deletion is used here; keep the isolated fixture for inspection.
 def test_success_then_rollback(self):self.run_case()
 def test_failure_auto_rollback(self):self.run_case(fail=True)
 def test_first_cas_install_rollback(self):self.run_case(old=False)
 def test_blank_website_rollback(self):self.run_case(old=False,blank=True)
if __name__=='__main__':unittest.main()
