#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }
[[ $# -eq 1 && -f $1 ]] || { echo 'Usage: bash restore-database.sh /root/backup/database.sqlite3' >&2; exit 1; }
was_active=false;systemctl is-active --quiet codynick-cas && was_active=true || true
systemctl stop codynick-cas || true
database=$(python3 - "$1" <<'PYPATH'
import pathlib,sys
metadata=pathlib.Path(sys.argv[1]).resolve().with_name('database-path')
print(metadata.read_text(encoding='utf-8') if metadata.exists() else '/var/lib/codynick-cas/projects.sqlite3')
PYPATH
)
safety=$(mktemp /root/codynick-database-before-restore-XXXXXXXX.sqlite3)
python3 - "$1" "$safety" "$database" <<'PY'
import sqlite3,sys
path=sys.argv[3]
with sqlite3.connect(path) as current,sqlite3.connect(sys.argv[2]) as backup:current.backup(backup)
with sqlite3.connect(sys.argv[1]) as snapshot,sqlite3.connect(path) as target:snapshot.backup(target)
PY
chown codynick-cas:codynick-cas "$database"
if $was_active; then systemctl start codynick-cas; fi
printf 'Database restored. Safety copy of the newer data: %s\n' "$safety"
