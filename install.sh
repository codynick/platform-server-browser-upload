#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo 'Run as root: bash install.sh' >&2; exit 1; fi
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
target_dir=/var/www/code.codynick.com
for name in index.html landing.css blocks/index.html blocks/editor.css blocks/serial.js blocks/blocks.js blocks/hardware.js blocks/runtime.js blocks/block-specs.js blocks/vendor/blockly/blockly.min.js blocks/stage.css blocks/webserial.css blocks/python-preview.js blocks/project-menu.js blocks/ch340-usb.js blocks/linux-help.js assets/tool-navigation.css assets/favicon.ico; do
 [[ -f "$source_dir/$name" ]] || { echo "Missing package file: $name" >&2; exit 1; }
done
[[ -d "$target_dir" ]] || { echo "Website directory does not exist: $target_dir" >&2; exit 1; }
backup_dir="$(mktemp -d /root/codynick-portal-backup-XXXXXXXX)"
staging_dir="$(mktemp -d "$target_dir/.codynick-install-XXXXXXXX")"
trap 'rm -rf -- "$staging_dir"' EXIT
cp -a -- "$source_dir/blocks" "$staging_dir/blocks"
chmod -R u+rwX,go+rX "$staging_dir/blocks"
chown -R root:root "$staging_dir/blocks"
# Preserve the old root page and all obsolete assets from our earlier releases.
for name in index.html landing.css app.js style.css hardware.js runtime.js block-specs.js blocks.js; do
 if [[ -e "$target_dir/$name" || -L "$target_dir/$name" ]]; then cp -a -- "$target_dir/$name" "$backup_dir/$name"; fi
done
if [[ -e "$target_dir/blocks" || -L "$target_dir/blocks" ]]; then mv -- "$target_dir/blocks" "$backup_dir/blocks"; fi
if ! mv -- "$staging_dir/blocks" "$target_dir/blocks"; then
 if [[ -e "$backup_dir/blocks" || -L "$backup_dir/blocks" ]]; then mv -- "$backup_dir/blocks" "$target_dir/blocks"; fi
 echo 'Could not install editor. Previous editor restored.' >&2; exit 1
fi
mkdir -p "$target_dir/assets" "$backup_dir/assets"
for name in tool-navigation.css favicon.ico; do
 if [[ -e "$target_dir/assets/$name" ]]; then cp -a -- "$target_dir/assets/$name" "$backup_dir/assets/$name"; fi
 install -m 644 -o root -g root -- "$source_dir/assets/$name" "$target_dir/assets/"
done
install -m 644 -o root -g root -- "$source_dir/index.html" "$source_dir/landing.css" "$target_dir/"
for name in app.js style.css hardware.js runtime.js block-specs.js blocks.js; do rm -f -- "$target_dir/$name"; done
# Remove only the old root-level Blockly directory, preserving other vendor assets.
if [[ -e "$target_dir/vendor/blockly" || -L "$target_dir/vendor/blockly" ]]; then
 mkdir -p "$backup_dir/vendor"
 mv -- "$target_dir/vendor/blockly" "$backup_dir/vendor/blockly"
fi
cp -- "$source_dir/rollback.sh" "$backup_dir/rollback.sh"
printf '\nInstalled CodyNick Portal 3.4 — Linux connection help\nHome: https://code.codynick.com/\nEditor: https://code.codynick.com/blocks/\nBackup: %s\nRollback: bash %s/rollback.sh\n\nOpen the site and press Ctrl+F5. Apache and SSL were not changed.\n' "$backup_dir" "$backup_dir"
