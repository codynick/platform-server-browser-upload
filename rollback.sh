#!/usr/bin/env bash
set -euo pipefail
[[ ${EUID} -eq 0 ]] || { echo 'Run this script as root.' >&2; exit 1; }
backup_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
domain=code.codynick.com
if [[ -f "$backup_dir/deploy-domain" ]]; then domain=$(cat "$backup_dir/deploy-domain"); fi
[[ ${#domain} -le 253 && "$domain" == *.* ]] || { echo 'Enter a valid domain name, without https://, a path, or a port.' >&2; exit 1; }
IFS='.' read -r -a labels <<< "$domain"
for label in "${labels[@]}"; do
 [[ ${#label} -le 63 && "$label" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] || { echo "Invalid domain name: $domain" >&2; exit 1; }
done
[[ "$domain" != *. && ! "$domain" =~ ^[0-9.]+$ ]] || { echo 'Use a DNS domain name, not an IP address.' >&2; exit 1; }
target_dir=/var/www/$domain
[[ -d "$target_dir" ]] || { echo 'Website directory not found.' >&2; exit 1; }
if [[ -f "$backup_dir/full-release" ]]; then systemctl stop codynick-cas 2>/dev/null || true; fi
# Keep a recoverable copy of the version being rolled back.
current_dir="$(mktemp -d /root/codynick-before-rollback-XXXXXXXX)"
for name in index.html landing.css blocks simulator dashboard app.js style.css hardware.js runtime.js block-specs.js blocks.js; do
 if [[ -e "$target_dir/$name" || -L "$target_dir/$name" ]]; then mv -- "$target_dir/$name" "$current_dir/$name"; fi
 if [[ -e "$backup_dir/$name" || -L "$backup_dir/$name" ]]; then cp -a -- "$backup_dir/$name" "$target_dir/$name"; fi
done
if [[ -d "$backup_dir/vendor/blockly" ]]; then mkdir -p "$target_dir/vendor"; cp -a -- "$backup_dir/vendor/blockly" "$target_dir/vendor/"; fi
mkdir -p "$current_dir/assets" "$target_dir/assets"
for name in tool-navigation.css favicon.ico codynick-logo.png; do
 if [[ -e "$target_dir/assets/$name" ]]; then mv -- "$target_dir/assets/$name" "$current_dir/assets/$name"; fi
 if [[ -e "$backup_dir/assets/$name" ]]; then cp -a -- "$backup_dir/assets/$name" "$target_dir/assets/$name"; fi
done
if [[ -f "$backup_dir/full-release" ]]; then
 for kind in backend config; do
  path=/opt/codynick-cas
  if [[ $kind == config ]]; then path=/etc/codynick-cas; fi
  if [[ -e "$path" ]]; then mv -- "$path" "$current_dir/$kind"; fi
  if [[ -d "$backup_dir/$kind-previous" ]]; then cp -a -- "$backup_dir/$kind-previous" "$path"; fi
 done
 if [[ -f /etc/systemd/system/codynick-cas.service ]]; then cp -a /etc/systemd/system/codynick-cas.service "$current_dir/service"; fi
 if [[ -f "$backup_dir/service-previous" ]]; then cp -a "$backup_dir/service-previous" /etc/systemd/system/codynick-cas.service; else systemctl disable codynick-cas 2>/dev/null || true; rm -f /etc/systemd/system/codynick-cas.service; fi
 python3 "$backup_dir/configure.py" restore-apache "$backup_dir"
 systemctl daemon-reload
 if [[ -f "$backup_dir/service-previous" ]]; then
  if [[ -f "$backup_dir/service-was-enabled" ]]; then systemctl enable codynick-cas; else systemctl disable codynick-cas; fi
  if [[ -f "$backup_dir/service-was-active" ]]; then systemctl start codynick-cas; fi
 fi
 apache2ctl configtest
 systemctl reload apache2
 echo 'Previous CAS code/configuration restored. The latest private projects database was retained.'
fi
printf 'Previous website restored. Replaced version saved in %s\nRefresh your browser with Ctrl+F5.\n' "$current_dir"
