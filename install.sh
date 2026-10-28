#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo 'Run as root: bash install.sh' >&2; exit 1; fi
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
version="$(cat "$source_dir/VERSION")"
domain=${CODYNICK_DOMAIN:-code.codynick.com}
domain=${domain,,}
[[ ${#domain} -le 253 && "$domain" == *.* ]] || { echo 'Enter a valid domain name, without https://, a path, or a port.' >&2; exit 1; }
IFS='.' read -r -a labels <<< "$domain"
for label in "${labels[@]}"; do
 [[ ${#label} -le 63 && "$label" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || { echo "Invalid domain name: $domain" >&2; exit 1; }
done
[[ "$domain" != *. && ! "$domain" =~ ^[0-9.]+$ ]] || { echo 'Use a DNS domain name, not an IP address.' >&2; exit 1; }
target_dir=/var/www/$domain
for name in VERSION index.html landing.css blocks/version.js blocks/accounts.js blocks/accounts.css blocks/account-guard.js backend/app.py backend/requirements.txt backend/configure.py backend/install.sh backend/start.py backend/restore-database.sh backend/codynick-cas.service blocks/index.html blocks/editor.css blocks/serial.js blocks/blocks.js blocks/hardware.js blocks/runtime.js blocks/block-specs.js blocks/vendor/blockly/blockly.min.js blocks/stage.css blocks/webserial.css blocks/python-preview.js blocks/project-menu.js blocks/ch340-usb.js blocks/linux-help.js blocks/live-store.js blocks/live-scheduler.js blocks/live-timer-worker.js blocks/live-router.js blocks/dashboard-blocks.js blocks/examples/Real-temperature-Sim-distance.codynick simulator/index.html simulator/app.js simulator/viewport.js dashboard/index.html dashboard/layout.js dashboard/layout-ui.js assets/tool-navigation.css assets/favicon.ico assets/codynick-logo.png; do
 [[ -f "$source_dir/$name" ]] || { echo "Missing package file: $name" >&2; exit 1; }
done
[[ -d "$target_dir" ]] || { echo "Website directory does not exist: $target_dir" >&2; exit 1; }
umask 077
backup_dir="$(mktemp -d /root/codynick-portal-backup-XXXXXXXX)"
printf '%s\n' "$domain" > "$backup_dir/deploy-domain"
cp -- "$source_dir/rollback.sh" "$backup_dir/rollback.sh"
cp -- "$source_dir/backend/restore-database.sh" "$backup_dir/restore-database.sh"
cp -- "$source_dir/backend/configure.py" "$backup_dir/configure.py"
for section in blocks simulator dashboard; do if [[ -e "$target_dir/$section" ]]; then cp -a -- "$target_dir/$section" "$backup_dir/$section"; fi; done
mkdir -p "$backup_dir/assets"
for name in index.html landing.css app.js style.css hardware.js runtime.js block-specs.js blocks.js; do if [[ -e "$target_dir/$name" ]]; then cp -a -- "$target_dir/$name" "$backup_dir/$name"; fi; done
for name in tool-navigation.css favicon.ico codynick-logo.png; do if [[ -e "$target_dir/assets/$name" ]]; then cp -a -- "$target_dir/assets/$name" "$backup_dir/assets/$name"; fi; done
if [[ -d /opt/codynick-cas ]]; then cp -a /opt/codynick-cas "$backup_dir/backend-previous"; fi
if [[ -d /etc/codynick-cas ]]; then cp -a /etc/codynick-cas "$backup_dir/config-previous"; fi
if [[ -f /etc/systemd/system/codynick-cas.service ]]; then cp -a /etc/systemd/system/codynick-cas.service "$backup_dir/service-previous"; fi
systemctl is-active --quiet codynick-cas && touch "$backup_dir/service-was-active" || true
systemctl is-enabled --quiet codynick-cas && touch "$backup_dir/service-was-enabled" || true
python3 "$source_dir/backend/configure.py" snapshot-apache "$domain" "$backup_dir"
python3 - "$backup_dir/database.sqlite3" <<'PYDB'
import json,os,pathlib,sqlite3,sys
path='/var/lib/codynick-cas/projects.sqlite3'
if os.path.isfile('/etc/codynick-cas/config.json'):
 with open('/etc/codynick-cas/config.json',encoding='utf-8') as f:path=json.load(f).get('DATABASE',path)
pathlib.Path(sys.argv[1]).with_name('database-path').write_text(path,encoding='utf-8')
if os.path.isfile(path):
 with sqlite3.connect(path) as src,sqlite3.connect(sys.argv[1]) as dst:src.backup(dst)
PYDB
touch "$backup_dir/full-release"
echo "Release backup: $backup_dir"
echo "Rollback: bash $backup_dir/rollback.sh"
trap 'rc=$?; trap - ERR; echo "Deployment failed. Restoring the previous release." >&2; bash "$backup_dir/rollback.sh" || echo "Automatic rollback failed; use the printed backup path." >&2; exit "$rc"' ERR
ln -sfnT -- "$backup_dir" /root/codynick-last-backup
staging_dir="$(mktemp -d "$target_dir/.codynick-install-XXXXXXXX")"
trap 'rm -rf -- "$staging_dir"' EXIT
for section in blocks simulator dashboard; do cp -a -- "$source_dir/$section" "$staging_dir/$section"; done
chmod -R u+rwX,go+rX "$staging_dir"
chown -R root:root "$staging_dir"
for section in blocks simulator dashboard; do
 rm -rf -- "$target_dir/$section"
 mv -- "$staging_dir/$section" "$target_dir/$section"
done
mkdir -p "$backup_dir/assets"
install -d -m 755 -o root -g root "$target_dir/assets"
for name in tool-navigation.css favicon.ico codynick-logo.png; do
 install -m 644 -o root -g root -- "$source_dir/assets/$name" "$target_dir/assets/"
done
install -m 644 -o root -g root -- "$source_dir/index.html" "$source_dir/landing.css" "$target_dir/"
for name in app.js style.css hardware.js runtime.js block-specs.js blocks.js; do rm -f -- "$target_dir/$name"; done
# Remove only the old root-level Blockly directory, preserving other vendor assets.
if [[ -e "$target_dir/vendor/blockly" || -L "$target_dir/vendor/blockly" ]]; then
 mkdir -p "$backup_dir/vendor"
 mv -- "$target_dir/vendor/blockly" "$backup_dir/vendor/blockly"
fi
CODYNICK_DOMAIN="$domain" CODYNICK_BACKUP="$backup_dir" bash "$source_dir/backend/install.sh"
trap - ERR
printf '\nInstalled CodyNick Portal %s\nEditor: https://%s/blocks/\nBackup: %s\nRollback: bash %s/rollback.sh\nDatabase snapshot: %s/database.sqlite3 (when a database existed)\n\nClose old tabs, reopen the editor and press Ctrl+F5.\n' "$version" "$domain" "$backup_dir" "$backup_dir" "$backup_dir"
printf 'CAS login callback: https://%s/auth/callback\nCAS logout return: https://%s/blocks/\n' "$domain" "$domain"
