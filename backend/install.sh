#!/usr/bin/env bash
set -euo pipefail
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
: "${CODYNICK_DOMAIN:?}" "${CODYNICK_BACKUP:?}"
systemctl stop codynick-cas 2>/dev/null || true
id codynick-cas >/dev/null 2>&1 || useradd --system --home-dir /var/lib/codynick-cas --shell /usr/sbin/nologin codynick-cas
install -d -m 750 -o codynick-cas -g codynick-cas /var/lib/codynick-cas
install -d -m 755 /opt/codynick-cas
install -d -m 700 /etc/codynick-cas
python3 "$source_dir/configure.py" config "$CODYNICK_DOMAIN" /etc/codynick-cas/config.json
install -m 644 "$source_dir/app.py" "$source_dir/start.py" "$source_dir/requirements.txt" /opt/codynick-cas/
python3 -m venv /opt/codynick-cas/venv
/opt/codynick-cas/venv/bin/pip install --disable-pip-version-check -r /opt/codynick-cas/requirements.txt
install -m 644 "$source_dir/codynick-cas.service" /etc/systemd/system/codynick-cas.service
a2enmod proxy proxy_http headers
python3 "$source_dir/configure.py" apply-apache "$CODYNICK_DOMAIN" "$CODYNICK_BACKUP"
apache2ctl configtest
systemctl daemon-reload
systemctl enable --now codynick-cas
systemctl restart codynick-cas
curl --fail --silent --connect-timeout 2 --max-time 10 --retry 10 --retry-connrefused --retry-delay 1 http://127.0.0.1:8791/api/me
systemctl reload apache2
