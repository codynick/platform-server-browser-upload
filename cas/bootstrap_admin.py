#!/usr/bin/env python3
"""Select and reserve the first CAS administrator; never creates a login/session."""
import argparse
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import sys
import time
import unicodedata

def valid_id(value):
    if not isinstance(value,str):raise ValueError('Enter the exact CodyNick ID.')
    value=value.strip()
    if not value or len(value)>255 or any(unicodedata.category(c).startswith('C') for c in value):
        raise ValueError('Enter a non-empty CodyNick ID (up to 255 characters).')
    return value

def configured(path):
    if not path.is_file():return False
    with closing(sqlite3.connect(path.resolve().as_uri()+'?mode=ro',uri=True,timeout=15)) as db:
        exists=db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='account_access'").fetchone()
        return bool(exists and db.execute("SELECT 1 FROM account_access WHERE role='admin' LIMIT 1").fetchone())

def select_id(path, supplied=None, reader=None, writer=None):
    if configured(path):return ''
    if supplied:return valid_id(supplied)
    reader=reader or sys.stdin;writer=writer or sys.stderr
    if not reader.isatty():
        raise ValueError('First admin required. Rerun from an interactive terminal or set CODYNICK_ADMIN_ID.')
    print('No admin configured. Use the exact CodyNick ID from CAS sign-in.',file=writer,flush=True)
    while True:
        print('First admin CodyNick ID: ',end='',file=writer,flush=True)
        value=reader.readline()
        if not value:raise ValueError('No admin ID entered. Nothing deployed; rerun the installer.')
        try:return valid_id(value)
        except ValueError as exc:print(str(exc),file=writer,flush=True)

def apply_id(path, uid):
    uid=valid_id(uid)
    if not path.is_file():raise ValueError('Account database is not ready. Rerun the installer.')
    with closing(sqlite3.connect(path,timeout=15)) as db, db:
        db.row_factory=sqlite3.Row;db.execute('BEGIN IMMEDIATE')
        if db.execute("SELECT 1 FROM account_access WHERE role='admin' LIMIT 1").fetchone():return False
        before=db.execute('SELECT * FROM account_access WHERE user_id=?',(uid,)).fetchone()
        db.execute("INSERT INTO account_access(user_id,role) VALUES(?,'admin') ON CONFLICT(user_id) DO UPDATE SET role='admin'",(uid,))
        db.execute('INSERT INTO access_audit(actor,target,at,before_json,after_json) VALUES(?,?,?,?,?)',('installer',uid,int(time.time()),json.dumps(dict(before) if before else {}),json.dumps({'role':'admin'})))
    return True

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=Path,default=Path('/etc/codynick-cas/config.json'));p.add_argument('--database',type=Path)
    modes=p.add_mutually_exclusive_group(required=True);modes.add_argument('--select',action='store_true');modes.add_argument('--apply',action='store_true');p.add_argument('--admin-id')
    a=p.parse_args()
    if a.database:path=a.database
    else:
        config=json.loads(a.config.read_text()) if a.config.is_file() else {};path=Path(config.get('DATABASE','/var/lib/codynick-cas/projects.sqlite3'))
    uid=a.admin_id or os.environ.get('CODYNICK_ADMIN_ID')
    if a.select:
        selected=select_id(path,uid)
        if selected:print(selected)
    else:
        if not uid:raise ValueError('First admin ID is missing.')
        changed=apply_id(path,uid)
        print('First admin configured. Access activates for the matching CAS identity.' if changed else 'Admin already configured; unchanged.')

if __name__=='__main__':
    try:main()
    except (ValueError,OSError,sqlite3.Error) as exc:print('ERROR: '+str(exc),file=sys.stderr);sys.exit(1)
