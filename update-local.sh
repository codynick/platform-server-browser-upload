#!/usr/bin/env bash
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo 'Run: sudo bash update-local.sh'; exit 1; }
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
command -v python3 >/dev/null || { echo 'Python 3 is required on the existing server.'; exit 1; }

echo 'Checking the extracted package before changing the website...'
python3 - "$source_dir" <<'PY'
import hashlib,json,pathlib,sys
root=pathlib.Path(sys.argv[1]).resolve()
manifest=json.loads((root/'PACKAGE_CHECKSUMS.json').read_text())
for name,digest in manifest.items():
    file=(root/name).resolve()
    try:file.relative_to(root)
    except ValueError:raise SystemExit('Invalid package path: '+name)
    if not file.is_file():raise SystemExit('Missing package file: '+name)
    if hashlib.sha256(file.read_bytes()).hexdigest()!=digest:
        raise SystemExit('Package checksum mismatch: '+name+'; extract a fresh copy of the ZIP.')
firmware=root/'blocks/firmware'
m=json.loads((firmware/'manifest.json').read_text())
if hashlib.sha256((firmware/m['file']).read_bytes()).hexdigest()!=m['sha256']:
    raise SystemExit('Packaged firmware checksum mismatch; nothing was installed.')
print('Package integrity verified.')
PY

domain=${CODYNICK_DOMAIN:-}
if [[ -z $domain && -f /etc/codynick/domain ]]; then domain=$(cat /etc/codynick/domain); fi
if [[ -z $domain && -f /etc/codynick-cas/config.json ]]; then
 domain=$(python3 - <<'PY'
import json
from urllib.parse import urlsplit
with open('/etc/codynick-cas/config.json') as f:c=json.load(f)
print(c.get('DOMAIN') or urlsplit(c.get('PUBLIC_ORIGIN','')).hostname or '')
PY
 )
fi
if [[ -z $domain ]]; then
 [[ -t 0 ]] || { echo 'Set CODYNICK_DOMAIN to your existing website domain.'; exit 1; }
 read -rp 'Existing CodyNick website domain (for example ide.codynick.com): ' domain
fi
domain=${domain,,}
[[ ${#domain} -le 253 && $domain == *.* && $domain != *. && ! $domain =~ ^[0-9.]+$ ]] || { echo 'Invalid website domain.'; exit 1; }
IFS='.' read -r -a labels <<< "$domain"
for label in "${labels[@]}"; do
 [[ ${#label} -le 63 && $label =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || { echo 'Invalid website domain.'; exit 1; }
done
[[ -f /var/www/$domain/blocks/index.html ]] || { echo "Existing CodyNick editor not found at /var/www/$domain/blocks/. This package updates an existing installation."; exit 1; }

log=$(mktemp /root/codynick-python-update-XXXXXXXX.log)
echo "Updating https://$domain from this extracted package. No GitHub download is used."
CODYNICK_DOMAIN=$domain bash "$source_dir/install.sh" | tee "$log"
backup=$(sed -n 's/^Backup: //p' "$log" | tail -n 1)
[[ $backup =~ ^/root/codynick-portal-backup-[A-Za-z0-9]+$ && -f $backup/rollback.sh ]] || { echo "Could not locate rollback script. Read the backup path in $log."; exit 1; }
rollback=$(mktemp /root/codynick-python-rollback-XXXXXXXX)
printf '#!/usr/bin/env bash\nset -euo pipefail\nexec bash %q\n' "$backup/rollback.sh" > "$rollback"
install -m 700 -- "$rollback" /root/codynick-python-rollback.sh
rm -f -- "$rollback"
printf '\nCodyNick platform upgrade complete.\nOpen: https://%s/blocks/\nClose old tabs, reopen, and press Ctrl+F5.\nRollback this update: sudo bash /root/codynick-python-rollback.sh\nBackup: %s\n' "$domain" "$backup"
echo 'CAS configuration, account backend, private projects, and CJP firmware were not changed by this installer.'
