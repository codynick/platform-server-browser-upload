"""Versioned overrides for the installed catalogue of complete examples."""

import hashlib
import io
import json
import re
import time
import zipfile
import zlib
from pathlib import Path
from urllib.parse import urlsplit

from flask import Response, abort, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge


MB = 1024 * 1024
FILES = {
    'programs/blocks.json', 'programs/main.py', 'state/editor.json',
    'state/live.json', 'state/sprite.json', 'state/dashboard-layout.json',
    'state/simulator-view.json',
}


def validate_archive(data):
    if not data or len(data) > 8 * MB:
        raise ValueError('Invalid package size.')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) != len(FILES) + 1 or set(archive.namelist()) != FILES | {'manifest.json'}:
            raise ValueError('Unexpected files in the example package.')
        if sum(entry.file_size for entry in entries) > 8 * MB:
            raise ValueError('Expanded example package exceeds 8 MB.')
        for entry in entries:
            if (entry.file_size > 4 * MB or entry.flag_bits & 1
                    or entry.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)):
                raise ValueError('Unsupported example package entry.')
        manifest = json.loads(archive.read('manifest.json').decode('utf-8'))
        if (not isinstance(manifest, dict) or manifest.get('format') != 'codynick-project'
                or manifest.get('version') != 1 or not isinstance(manifest.get('files'), dict)
                or manifest['files'].keys() != FILES):
            raise ValueError('Invalid example package manifest.')
        for name in FILES:
            content = archive.read(name)
            if hashlib.sha256(content).hexdigest() != manifest['files'][name]:
                raise ValueError('Example package checksum mismatch.')
            source = content.decode('utf-8')
            if name == 'programs/main.py':
                if len(source) > 100_000:
                    raise ValueError('Python source is too long.')
            else:
                value = json.loads(source)
                if not isinstance(value, dict) and (name != 'state/simulator-view.json' or value is not None):
                    raise ValueError('Invalid example project state.')


def register_example_packages(app, database, admin_user, origin, webroot=None):
    root = Path(webroot) if webroot is not None else Path('/var/www') / urlsplit(origin).hostname
    with database() as db:
        db.execute('''
            CREATE TABLE IF NOT EXISTS example_package_revisions (
                example TEXT NOT NULL,
                revision INTEGER NOT NULL,
                actor TEXT NOT NULL,
                created INTEGER NOT NULL,
                source_revision INTEGER,
                package BLOB,
                PRIMARY KEY (example, revision)
            )
        ''')

    def bundled(example):
        if not re.fullmatch(r'[A-Za-z0-9-]+', example):
            abort(404)
        catalog = json.loads((root / 'blocks/python-examples.json').read_text(encoding='utf-8'))
        entry = catalog.get(example)
        if not isinstance(entry, dict):
            abort(404)
        archive = entry.get('archive', '')
        if not re.fullmatch(r'examples/[A-Za-z0-9-]+\.codynick', archive):
            abort(404)
        try:
            return (root / 'blocks' / archive).read_bytes(), (root / 'VERSION').read_text().strip()
        except FileNotFoundError:
            abort(404)

    def latest(db, example):
        return db.execute('''
            SELECT revision, package FROM example_package_revisions
            WHERE example=? ORDER BY revision DESC LIMIT 1
        ''', (example,)).fetchone()

    def version_token(row, original):
        revision = row['revision'] if row else 0
        if row and row['package'] is not None:
            return f'"published-{revision}"'
        checksum = hashlib.sha256(original).hexdigest()
        return f'"bundled-{revision}-{checksum}"'

    @app.get('/api/examples/<example>/package')
    def example_package(example):
        original, release = bundled(example)
        with database() as db:
            row = latest(db, example)
        published = row is not None and row['package'] is not None
        response = Response(row['package'] if published else original, mimetype='application/zip')
        response.set_etag(version_token(row, original).strip('"'))
        response.headers['Content-Disposition'] = f'attachment; filename="{example}.codynick"'
        response.headers['X-CodyNick-Example-Version'] = f'Revision {row["revision"]}' if published else f'Bundled {release}'
        return response

    @app.get('/api/admin/examples/<example>/revisions')
    def example_revisions(example):
        admin_user()
        _, release = bundled(example)
        with database() as db:
            rows = db.execute('''
                SELECT revision, created, source_revision, package IS NOT NULL AS published
                FROM example_package_revisions WHERE example=?
                ORDER BY revision DESC LIMIT 20
            ''', (example,)).fetchall()
        return jsonify(bundled_release=release, revisions=[dict(row) for row in rows])

    @app.put('/api/admin/examples/<example>/package')
    def put_example_package(example):
        actor = admin_user(True)
        original, release = bundled(example)
        previous = None
        if request.mimetype == 'application/zip':
            request.max_content_length = 8 * MB
            try:
                package = request.get_data()
                validate_archive(package)
            except RequestEntityTooLarge:
                return jsonify(error='The example package exceeds 8 MB.'), 413
            except (ValueError, RuntimeError, zipfile.BadZipFile, EOFError, zlib.error):
                return jsonify(error='Invalid or oversized .codynick example package.'), 400
        else:
            restore = request.get_json(silent=True)
            if not isinstance(restore, dict) or restore.keys() != {'restore'}:
                abort(400)
            previous = restore['restore']
            if previous != 'bundled' and (type(previous) is not int or not 0 < previous < 2**63):
                abort(400)
            package = None
        with database() as db:
            db.execute('BEGIN IMMEDIATE')
            row = latest(db, example)
            if request.headers.get('If-Match') != version_token(row, original):
                return jsonify(error='The published example changed. Download your edits as a project and reload the example before publishing.'), 409
            if type(previous) is int:
                revision = db.execute('''
                    SELECT package FROM example_package_revisions
                    WHERE example=? AND revision=? AND package IS NOT NULL
                ''', (example, previous)).fetchone()
                if revision is None:
                    abort(404)
                package = revision['package']
            current = row['revision'] if row else 0
            if previous == 'bundled' and (row is None or row['package'] is None):
                return jsonify(revision=current, version=f'Bundled {release}')
            current += 1
            db.execute('INSERT INTO example_package_revisions VALUES(?,?,?,?,?,?)',
                       (example, current, actor['user_id'], int(time.time()),
                        previous if type(previous) is int else None, package))
        token = version_token({'revision': current, 'package': package}, original)
        return jsonify(revision=current, token=token,
                       version=f'Revision {current}' if package is not None else f'Bundled {release}')
