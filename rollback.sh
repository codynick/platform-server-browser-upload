#!/usr/bin/env bash
set -euo pipefail
[[ ${EUID} -eq 0 ]] || { echo 'Run this script as root.' >&2; exit 1; }
backup_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
target_dir=/var/www/code.codynick.com
[[ -d "$target_dir" ]] || { echo 'Website directory not found.' >&2; exit 1; }
# Keep a recoverable copy of the version being rolled back.
current_dir="$(mktemp -d /root/codynick-before-rollback-XXXXXXXX)"
for name in index.html landing.css blocks simulator dashboard app.js style.css hardware.js runtime.js block-specs.js blocks.js; do
 if [[ -e "$target_dir/$name" || -L "$target_dir/$name" ]]; then mv -- "$target_dir/$name" "$current_dir/$name"; fi
 if [[ -e "$backup_dir/$name" || -L "$backup_dir/$name" ]]; then cp -a -- "$backup_dir/$name" "$target_dir/$name"; fi
done
if [[ -d "$backup_dir/vendor/blockly" ]]; then mkdir -p "$target_dir/vendor"; cp -a -- "$backup_dir/vendor/blockly" "$target_dir/vendor/"; fi
mkdir -p "$current_dir/assets" "$target_dir/assets"
for name in tool-navigation.css favicon.ico; do
 if [[ -e "$target_dir/assets/$name" ]]; then mv -- "$target_dir/assets/$name" "$current_dir/assets/$name"; fi
 if [[ -e "$backup_dir/assets/$name" ]]; then cp -a -- "$backup_dir/assets/$name" "$target_dir/assets/$name"; fi
done
printf 'Previous website restored. Replaced version saved in %s\nRefresh your browser with Ctrl+F5.\n' "$current_dir"
