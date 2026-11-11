"""Explicit public/unlisted snapshots. Private projects and account identity stay private."""
import copy
import json
import math
import re
import secrets
import time
from flask import request, jsonify, abort


def snapshot(value, selection):
    if selection not in ('both', 'blocks', 'python') or not isinstance(value, dict):
        abort(400)
    if value.get('format') != 'codynick-webserial' or value.get('version') != 3 or value.get('projectSchema') != 'codynick-project/1':
        abort(400)
    # Never publish hidden top-level/account fields, console output, leases or Wi-Fi credentials.
    try:
        editor, state = value['editor'], value['state']
        live = state['live']
        clean = dict(format=value['format'], version=3, projectSchema=value['projectSchema'],
                     applicationVersion=str(value.get('applicationVersion', ''))[:80],
                     workspace=copy.deepcopy(value['workspace']) if selection != 'python' else {'blocks': {'languageVersion': 0, 'blocks': []}},
                     python=value['python'] if selection != 'blocks' else '',
                     editor={k: copy.deepcopy(editor[k]) for k in ('names', 'language', 'space', 'collapsed')},
                     state=dict(live={k: copy.deepcopy(live[k]) for k in ('scene', 'leds', 'matrix', 'seven_segment', 'ultra_segment', 'widgets')},
                                sprite=copy.deepcopy(state['sprite']), layout=copy.deepcopy(state['layout']), simulatorView=None))
        clean['editor'].update(help='', console='', cursorStart=0, cursorEnd=0, scrollTop=0, scrollLeft=0)
        clean['editor']['names'] = {'blocks': '', 'python': ''}
        if selection != 'both': clean['editor']['language'] = selection
        if clean['editor']['language'] not in ('blocks', 'python'): abort(400)
        if clean['editor']['space'] not in ('simulator', 'dashboard', 'sprites') or not isinstance(clean['editor']['collapsed'], bool): abort(400)
        if not isinstance(clean['python'], str) or len(clean['python']) > 100000: abort(400)
        if not isinstance(clean['workspace']['blocks']['blocks'], list): abort(400)
        blocks = 0
        def check_block(block, depth=0):
            nonlocal blocks
            if block is None: return
            blocks += 1
            if depth > 150 or blocks > 2000 or not isinstance(block, dict) or not isinstance(block.get('type'), str): abort(400)
            inputs = block.get('inputs', {})
            if not isinstance(inputs, dict): abort(400)
            for value in inputs.values():
                if not isinstance(value, dict): abort(400)
                check_block(value.get('block'), depth+1)
                check_block(value.get('shadow'), depth+1)
            following = block.get('next', {})
            if not isinstance(following, dict): abort(400)
            check_block(following.get('block'), depth+1)
        for block in clean['workspace']['blocks']['blocks']: check_block(block)
        if not isinstance(live['scene']['gadgets'], dict) or 'cjp' not in live['scene']['gadgets']: abort(400)
        if not isinstance(live['widgets'], dict) or len(live['widgets']) > 100: abort(400)
        if not isinstance(state['layout'], dict) or not isinstance(state['sprite'], dict): abort(400)
        # Saved input ownership and button taps must not be replayed.
        for widget in clean['state']['live']['widgets'].values():
            if not isinstance(widget, dict) or not isinstance(widget.get('history', []), list) or len(widget.get('history', [])) > 1000: abort(400)
            for key in ('inputAt', 'inputOwner', 'clicks'): widget.pop(key, None)
            if widget.get('type') == 'button': widget['value'] = False
    except (KeyError, TypeError, AttributeError):
        abort(400)
    count = 0
    def check(node, depth=0, container=''):
        nonlocal count
        count += 1
        if depth > 160 or count > 150000: abort(400)
        if isinstance(node, dict):
            # Drop unexpected sensitive metadata throughout the saved snapshot.
            for key in list(node):
                if key in ('__proto__', 'prototype', 'constructor'): abort(400)
                if container not in ('widgets', 'layout', 'gadgets', 'inputs') and re.search(r'password|credential|secret|access.?token|csrf|session|ssid|inputOwner', key, re.I):
                    del node[key]
                else: check(node[key], depth + 1, key)
        elif isinstance(node, list):
            for item in node: check(item, depth + 1)
        elif isinstance(node, float) and not math.isfinite(node): abort(400)
        elif node is not None and not isinstance(node, (str, int, float, bool)): abort(400)
    check(clean)
    body = json.dumps(clean, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    if len(body.encode('utf-8')) > 1800000: abort(413)
    return body


def register_sharing(app, database, authenticated, access_for, origin):
    with database() as db:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS published_shares(
            id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, owner TEXT NOT NULL,
            title TEXT NOT NULL, description TEXT NOT NULL, display_name TEXT NOT NULL,
            selection TEXT NOT NULL, body TEXT NOT NULL, revision INTEGER NOT NULL,
            created INTEGER NOT NULL, updated INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS published_shares_owner ON published_shares(owner);
        CREATE TABLE IF NOT EXISTS share_reports(
            share_id TEXT PRIMARY KEY, reason TEXT NOT NULL, count INTEGER NOT NULL, updated INTEGER NOT NULL);
        ''')
        # Serialize schema checks across Gunicorn workers; older snapshots stay unlisted.
        db.execute('BEGIN IMMEDIATE')
        columns = {row['name'] for row in db.execute('PRAGMA table_info(published_shares)')}
        if 'visibility' not in columns:
            db.execute("ALTER TABLE published_shares ADD COLUMN visibility TEXT NOT NULL DEFAULT 'unlisted' CHECK(visibility IN ('unlisted','public'))")
        if 'search_text' not in columns:
            db.execute("ALTER TABLE published_shares ADD COLUMN search_text TEXT NOT NULL DEFAULT ''")
        db.execute('CREATE INDEX IF NOT EXISTS published_shares_gallery ON published_shares(visibility,updated DESC,id)')
        # Bring existing designer credits into line with verified SSO names.
        if db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'").fetchone():
            rows=db.execute('SELECT p.id,p.title,p.description,p.display_name,u.name AS sso_name FROM published_shares p JOIN users u ON u.id=p.owner').fetchall()
            for row in rows:
                name=(row['sso_name'] or 'Student').strip()[:120] or 'Student'
                if name!=row['display_name']:
                    text='\n'.join((row['title'],row['description'],name)).casefold()
                    db.execute('UPDATE published_shares SET display_name=?,search_text=? WHERE id=?',(name,text,row['id']))

    def metadata(row):
        return {k: row[k] for k in ('id', 'token', 'title', 'description', 'display_name', 'selection', 'visibility', 'revision', 'created', 'updated')}

    def visibility(data, publishing=True):
        value = data.get('visibility', 'unlisted')
        if value not in ('unlisted', 'public'): abort(400)
        if publishing and value == 'public' and data.get('public_confirmed') is not True: abort(400)
        return value

    def search_text(data):
        return '\n'.join(data[key] for key in ('title', 'description', 'display_name')).casefold()

    def payload(user, publishing=True):
        data = request.get_json()
        if not isinstance(data, dict) or data.get('reviewed') is not True: abort(400)
        for key, limit in (('title', 120), ('description', 2000)):
            if not isinstance(data.get(key), str) or len(data[key]) > limit: abort(400)
            data[key] = data[key].strip()
        if not data['title']: abort(400)
        data['display_name']=(user.get('name') or 'Student').strip()[:120] or 'Student'
        data['visibility'] = visibility(data, publishing)
        body = snapshot(data.get('project'), data.get('selection'))
        clean = json.loads(body)
        clean['editor']['names'] = {'blocks': data['title'], 'python': data['title']}
        body = json.dumps(clean, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
        return data, body

    @app.post('/api/shares/preview')
    def preview_share():
        user=authenticated(True)
        _, body = payload(user,publishing=False)
        return jsonify(project=json.loads(body))

    @app.get('/api/gallery')
    def gallery():
        query = request.args.get('q', '').strip()
        language = request.args.get('language', 'all')
        sort = request.args.get('sort', 'updated')
        page = request.args.get('page', '1')
        if len(query) > 120 or language not in ('all', 'blocks', 'python') or sort not in ('updated', 'newest'): abort(400)
        if not re.fullmatch(r'[0-9]{1,6}', page) or not 1 <= int(page) <= 100000: abort(400)
        terms = query.casefold().split()
        if len(terms) > 12: abort(400)
        where, params = ["visibility='public'"], []
        if language != 'all':
            where.append('selection IN (?,?)')
            params.extend((language, 'both'))
        for term in terms:
            where.append("search_text LIKE ? ESCAPE '\\'")
            params.append('%'+term.replace('\\','\\\\').replace('%','\\%').replace('_','\\_')+'%')
        condition = ' AND '.join(where)
        ordering = 'updated DESC,id DESC' if sort == 'updated' else 'created DESC,id DESC'
        page, size = int(page), 20
        with database() as db:
            db.execute('BEGIN')
            total = db.execute('SELECT count(*) FROM published_shares WHERE '+condition, params).fetchone()[0]
            pages = max(1, (total+size-1)//size)
            page = min(page, pages)
            rows = db.execute('SELECT token,title,description,display_name,selection,revision,created,updated FROM published_shares WHERE '+condition+' ORDER BY '+ordering+' LIMIT ? OFFSET ?',
                              [*params, size, (page-1)*size]).fetchall()
        response = jsonify(projects=[dict(row) for row in rows], page=page, page_size=size, total=total, pages=pages)
        response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
        response.headers['X-Robots-Tag'] = 'noindex, nofollow'
        return response

    @app.get('/api/shares')
    def list_shares():
        user = authenticated()
        with database() as db:
            rows = db.execute('SELECT * FROM published_shares WHERE owner=? ORDER BY updated DESC', (user['user_id'],)).fetchall()
        return jsonify(shares=[metadata(row) for row in rows])

    @app.post('/api/shares')
    def publish_share():
        user = authenticated(True)
        data, body = payload(user)
        now = int(time.time())
        sid, token = secrets.token_urlsafe(18), secrets.token_urlsafe(32)
        with database() as db:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT count(*) FROM published_shares WHERE owner=?', (user['user_id'],)).fetchone()[0] >= 50:
                return jsonify(error='You can publish up to 50 projects. Unpublish an older project first.'), 409
            db.execute('INSERT INTO published_shares(id,token,owner,title,description,display_name,selection,body,revision,created,updated,visibility,search_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
                       (sid, token, user['user_id'], data['title'], data['description'], data['display_name'], data['selection'], body, 1, now, now, data['visibility'], search_text(data)))
            row = db.execute('SELECT * FROM published_shares WHERE id=?', (sid,)).fetchone()
        return jsonify(metadata(row)), 201

    @app.put('/api/shares/<sid>')
    def update_share(sid):
        user = authenticated(True)
        data, body = payload(user)
        if type(data.get('revision')) is not int: abort(400)
        with database() as db:
            row = db.execute('UPDATE published_shares SET title=?,description=?,display_name=?,selection=?,body=?,visibility=?,search_text=?,revision=revision+1,updated=? WHERE id=? AND owner=? AND revision=? RETURNING *',
                             (data['title'], data['description'], data['display_name'], data['selection'], body, data['visibility'], search_text(data), int(time.time()), sid, user['user_id'], data['revision'])).fetchone()
            if not row:
                if not db.execute('SELECT id FROM published_shares WHERE id=? AND owner=?', (sid, user['user_id'])).fetchone(): abort(404)
                abort(409)
        return jsonify(metadata(row))

    @app.patch('/api/shares/<sid>/visibility')
    def change_visibility(sid):
        user = authenticated(True)
        data = request.get_json()
        if not isinstance(data, dict) or type(data.get('revision')) is not int: abort(400)
        value = visibility(data)
        with database() as db:
            db.execute('BEGIN IMMEDIATE')
            old = db.execute('SELECT * FROM published_shares WHERE id=? AND owner=?', (sid, user['user_id'])).fetchone()
            if not old: abort(404)
            if old['revision'] != data['revision']: abort(409)
            row = db.execute('UPDATE published_shares SET visibility=?,search_text=?,revision=revision+1,updated=? WHERE id=? RETURNING *',
                             (value, search_text(old), int(time.time()), sid)).fetchone()
        return jsonify(metadata(row))

    @app.delete('/api/shares/<sid>')
    def unpublish_share(sid):
        user = authenticated(True)
        with database() as db:
            if not db.execute('DELETE FROM published_shares WHERE id=? AND owner=?', (sid, user['user_id'])).rowcount: abort(404)
            db.execute('DELETE FROM share_reports WHERE share_id=?', (sid,))
        return jsonify(ok=True)

    @app.get('/api/shared/<token>')
    def public_share(token):
        if not re.fullmatch(r'[A-Za-z0-9_-]{43}', token): abort(404)
        with database() as db:
            row = db.execute('SELECT * FROM published_shares WHERE token=?', (token,)).fetchone()
        if not row: abort(404)
        out = {k: row[k] for k in ('title', 'description', 'display_name', 'selection', 'visibility', 'revision', 'updated')}
        out['project'] = json.loads(row['body'])
        response = jsonify(out)
        response.headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
        response.headers['Cross-Origin-Resource-Policy'] = 'same-origin'
        return response

    @app.post('/api/shared/<token>/report')
    def report_share(token):
        if request.headers.get('Origin') != origin: abort(403)
        data = request.get_json()
        if not isinstance(data, dict) or not isinstance(data.get('reason'), str) or not 1 <= len(data['reason'].strip()) <= 500: abort(400)
        with database() as db:
            row = db.execute('SELECT id FROM published_shares WHERE token=?', (token,)).fetchone()
            if not row: abort(404)
            # One bounded report row per publication; repeated reports cannot grow storage.
            db.execute('INSERT INTO share_reports VALUES(?,?,1,?) ON CONFLICT(share_id) DO UPDATE SET count=min(count+1,1000000),updated=excluded.updated',
                       (row['id'], data['reason'].strip(), int(time.time())))
        return jsonify(ok=True)

    def admin():
        user = authenticated()
        if access_for(user['user_id'])['role'] != 'admin': abort(403)

    @app.get('/api/admin/shares')
    def admin_shares():
        admin()
        with database() as db:
            rows = db.execute('SELECT p.*,r.reason,r.count AS reports FROM published_shares p LEFT JOIN share_reports r ON r.share_id=p.id ORDER BY coalesce(r.updated,p.updated) DESC LIMIT 200').fetchall()
        return jsonify(shares=[dict(metadata(row), reports=row['reports'] or 0, reason=row['reason'] or '') for row in rows])

    @app.delete('/api/admin/shares/<sid>')
    def admin_unpublish(sid):
        authenticated(True)
        admin()
        with database() as db:
            if not db.execute('DELETE FROM published_shares WHERE id=?', (sid,)).rowcount: abort(404)
            db.execute('DELETE FROM share_reports WHERE share_id=?', (sid,))
        return jsonify(ok=True)
