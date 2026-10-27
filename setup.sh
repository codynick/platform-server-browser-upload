#!/usr/bin/env bash
set -euo pipefail
trap 'echo "Setup/update failed at line $LINENO. Review the error above; fix it and rerun the same command." >&2' ERR
[[ ${EUID} -eq 0 ]] || { echo 'Run as root (sudo bash setup.sh).' >&2; exit 1; }
command -v apt-get >/dev/null || { echo 'This installer supports Debian/Ubuntu servers with apt-get.' >&2; exit 1; }
domain=code.codynick.com
repo=/root/platform-server-browser-upload
webroot=/var/www/$domain
export DEBIAN_FRONTEND=noninteractive
echo '[1/5] Installing server dependencies'
apt-get update
apt-get install -y git ca-certificates apache2 certbot python3-certbot-apache

echo '[2/5] Getting the latest CodyNick release'
if [[ -e "$repo" ]]; then
 [[ -d "$repo/.git" ]] || { echo "$repo exists but is not a Git checkout. Move it aside manually." >&2; exit 1; }
 [[ "$(git -C "$repo" remote get-url origin)" =~ ^https://github.com/codynick/platform-server-browser-upload(\.git)?$ ]] || { echo 'Unexpected repository origin; refusing to update.' >&2; exit 1; }
 [[ -z "$(git -C "$repo" status --porcelain)" ]] || { echo 'Server checkout has local changes. Commit or back them up before rerunning.' >&2; exit 1; }
 [[ "$(git -C "$repo" branch --show-current)" == main ]] || { echo 'Server checkout must be on main.' >&2; exit 1; }
 git -C "$repo" pull --ff-only origin main
else
 git clone --branch main --single-branch https://github.com/codynick/platform-server-browser-upload.git "$repo"
fi

echo '[3/5] Deploying website (with a rollback backup)'
mkdir -p "$webroot"
bash "$repo/install.sh"

echo '[4/5] Checking Apache website configuration'
# Reuse an existing domain configuration, including its SSL settings.
if ! apache2ctl -S 2>&1 | grep -F "$domain" >/dev/null; then
 config=/etc/apache2/sites-available/codynick-portal.conf
 [[ ! -e "$config" ]] || { echo "$config already exists but is not active. Review it and enable it manually." >&2; exit 1; }
 cat > "$config" <<EOF
<VirtualHost *:80>
    ServerName $domain
    DocumentRoot $webroot
    <Directory $webroot>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>
    ErrorLog \${APACHE_LOG_DIR}/codynick-error.log
    CustomLog \${APACHE_LOG_DIR}/codynick-access.log combined
</VirtualHost>
EOF
 a2ensite codynick-portal.conf
fi
apache2ctl configtest
systemctl enable --now apache2
systemctl reload apache2

echo '[5/5] Checking HTTPS'
if [[ -s "/etc/letsencrypt/live/$domain/fullchain.pem" ]] && apache2ctl -S 2>&1 | grep -E ':443|port 443' | grep -F "$domain" >/dev/null; then
 echo 'Existing HTTPS configuration retained.'
else
 getent ahosts "$domain" >/dev/null || { echo "DNS does not resolve $domain. Point its DNS to this server, then rerun." >&2; exit 1; }
 echo "Requesting HTTPS: $domain must point to this server; inbound TCP ports 80 and 443 must be open."
 certbot --apache --non-interactive --agree-tos --register-unsafely-without-email --redirect -d "$domain"
fi
apache2ctl configtest
systemctl reload apache2
printf '\nCodyNick %s is ready: https://%s/blocks/\nCheck Project > About for the installed version.\n' "$(cat "$repo/VERSION")" "$domain"
echo 'Certificate renewal is managed by Certbot. Rerun the same command for future updates.'
