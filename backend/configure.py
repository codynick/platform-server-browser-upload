"""Deployment configuration; all patching is scoped to the selected HTTPS site."""
import json,os,pathlib,re,shutil,sys
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode

def configure(domain,path):
 path=pathlib.Path(path)
 if path.exists():c=json.loads(path.read_text(encoding='utf-8'))
 else:
  cas=os.environ.get('CAS_BASE_URL','https://id.codynick.com/cas').rstrip('/')
  c={'CAS_BASE_URL':cas,'CAS_VALIDATE_URL':os.environ.get('CAS_VALIDATE_URL',cas+'/p3/serviceValidate'),'CAS_ID_ATTRIBUTE':os.environ.get('CAS_ID_ATTRIBUTE','__principal__'),'CAS_NAME_ATTRIBUTE':os.environ.get('CAS_NAME_ATTRIBUTE','name'),'CAS_EMAIL_ATTRIBUTE':os.environ.get('CAS_EMAIL_ATTRIBUTE','email')}
 c['DOMAIN']=domain;c['PUBLIC_ORIGIN']='https://'+domain
 for key in ('CAS_BASE_URL','CAS_VALIDATE_URL','CAS_LOGOUT_URL'):
  value=c.get(key)
  if not value:continue
  u=urlsplit(value)
  if u.scheme!='https' or not u.hostname or u.username or u.password or u.fragment:raise ValueError('CAS URLs must be HTTPS without userinfo or fragments')
 u=urlsplit(c.get('CAS_LOGOUT_URL') or c['CAS_BASE_URL'].rstrip('/')+'/logout');q=[(k,v)for k,v in parse_qsl(u.query,keep_blank_values=True)if k!='service'];q.append(('service',c['PUBLIC_ORIGIN']+'/blocks/'));c['CAS_LOGOUT_URL']=urlunsplit((u.scheme,u.netloc,u.path,urlencode(q),''))
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(c,indent=2)+'\n',encoding='utf-8');path.chmod(0o600)
 return c

def patch_apache(text,domain):
 found=False
 def edit(m):
  nonlocal found
  block=m.group()
  if not re.search(r'^\s*ServerName\s+'+re.escape(domain)+r'\s*$',block,re.M|re.I)or not re.search(r'<VirtualHost\s+[^>]*:443\s*>',block,re.I):return block
  found=True
  block=re.sub(r'\n\s*# BEGIN CodyNick CAS.*?# END CodyNick CAS\s*\n','\n',block,flags=re.S)
  block=re.sub(r'\n # CodyNick CAS integration.*?</FilesMatch>\n','\n',block,flags=re.S)
  block=re.sub(r'\n <Location "/auth/confirm">.*?</Location>\n','',block,flags=re.S)
  block=re.sub(r'(^\s*CustomLog\s+\S+)\s+\S+.*$',r'\1 codynick_private',block,flags=re.M)
  settings=r"""
 # BEGIN CodyNick CAS
 LogFormat "%h %l %u %t \"%m %U %H\" %>s %b" codynick_private
 ProxyPass /auth/ http://127.0.0.1:8791/auth/
 ProxyPassReverse /auth/ http://127.0.0.1:8791/auth/
 ProxyPass /api/ http://127.0.0.1:8791/api/
 ProxyPassReverse /api/ http://127.0.0.1:8791/api/
 <LocationMatch "^/(auth|api)/">
  Header always set Cache-Control "no-store"
  Header always set Referrer-Policy "no-referrer"
 </LocationMatch>
 <FilesMatch "^(index\.html|blocks\.js|accounts\.js|account-guard\.js|version\.js)$">
  Header always set Cache-Control "no-store"
 </FilesMatch>
 <Location "/auth/confirm">
  Header always set Referrer-Policy "same-origin"
 </Location>
 # END CodyNick CAS
"""
  return block.replace('</VirtualHost>',settings+'\n</VirtualHost>')
 return re.sub(r'<VirtualHost\b[^>]*>.*?</VirtualHost>',edit,text,flags=re.S|re.I),found

def apache(domain,backup,sites='/etc/apache2/sites-enabled',apply=False):
 backup=pathlib.Path(backup);folder=backup/'apache';folder.mkdir(exist_ok=True)
 manifest=[];seen=set()
 for entry in pathlib.Path(sites).glob('*'):
  path=entry.resolve()
  if path in seen or not path.is_file():continue
  seen.add(path);old=path.read_text(encoding='utf-8');new,found=patch_apache(old,domain)
  if not found:continue
  slot=str(len(manifest))+'.conf';shutil.copy2(path,folder/slot);manifest.append({'path':str(path),'copy':slot})
  if apply:path.write_text(new,encoding='utf-8')
 if not manifest:raise ValueError('No enabled HTTPS VirtualHost with exact ServerName '+domain)
 (backup/'apache-manifest.json').write_text(json.dumps(manifest),encoding='utf-8')

def restore(backup):
 backup=pathlib.Path(backup)
 for item in json.loads((backup/'apache-manifest.json').read_text(encoding='utf-8')):shutil.copy2(backup/'apache'/item['copy'],item['path'])

if __name__=='__main__':
 action=sys.argv[1]
 if action=='config':configure(sys.argv[2],sys.argv[3])
 elif action=='snapshot-apache':apache(sys.argv[2],sys.argv[3])
 elif action=='apply-apache':
  # Use the already snapshotted paths; never overwrite the rollback snapshot.
  for item in json.loads((pathlib.Path(sys.argv[3])/'apache-manifest.json').read_text(encoding='utf-8')):
   path=pathlib.Path(item['path']);new,_=patch_apache(path.read_text(encoding='utf-8'),sys.argv[2]);path.write_text(new,encoding='utf-8')
 elif action=='restore-apache':restore(sys.argv[2])
