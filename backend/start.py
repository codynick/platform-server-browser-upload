import json,os
with open('/etc/codynick-cas/config.json',encoding='utf-8') as f:config=json.load(f)
for k,v in config.items():os.environ[k]=str(v)
os.umask(0o077)
os.execv('/opt/codynick-cas/venv/bin/gunicorn',['gunicorn','--bind','127.0.0.1:8791','--workers','2','--user','codynick-cas','--group','codynick-cas','--chdir','/opt/codynick-cas','--error-logfile','-','--timeout','30','app:app'])
