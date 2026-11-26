#!/usr/bin/env python3
"""Copy the selected recordings to an EMPTY directory for a matching SD card."""
from pathlib import Path
import json,shutil,sys
if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 tools/prepare-dfplayer-sd.py EMPTY_OUTPUT_DIRECTORY')
root=Path(__file__).resolve().parents[1]/'simulator/dfplayer'
target=Path(sys.argv[1]).resolve()
if target.exists() and (not target.is_dir() or any(target.iterdir())):
    raise SystemExit('Output must be an empty directory; nothing was changed.')
catalog=json.loads((root/'catalog.json').read_text(encoding='utf-8'))
for item in catalog['tracks']:
    if Path(item['source']).name!=item['source'] or not (root/item['file']).is_file():
        raise SystemExit('Invalid audio catalogue; nothing was changed.')
target.mkdir(parents=True,exist_ok=True)
for item in catalog['tracks']:
    folder=target/('%02d'%item['folder']);folder.mkdir(exist_ok=True)
    shutil.copy2(root/item['file'],folder/item['source'])
print('Prepared',len(catalog['tracks']),'recordings in',target)
print('Hafez and folder 16 are excluded; each folder/track prefix is unique.')
