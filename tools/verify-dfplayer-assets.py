#!/usr/bin/env python3
"""Validate the complete DFPlayer media package before any deployment writes."""
from pathlib import Path
import hashlib,json,sys
def verify(root):
    root=Path(root)
    catalog=json.loads((root/'catalog.json').read_text(encoding='utf-8'))
    tracks=catalog.get('tracks')
    if catalog.get('version')!=1 or not isinstance(tracks,list) or not tracks:
        raise ValueError('Invalid DFPlayer audio catalogue')
    seen=set()
    for track in tracks:
        folder,index=track['folder'],track['track']
        if type(folder) is not int or type(index) is not int or not 1<=folder<=99 or not 1<=index<=1000 or folder in (7,16):
            raise ValueError('Invalid or excluded DFPlayer folder/track')
        if (folder,index) in seen:raise ValueError('Duplicate DFPlayer folder/track')
        seen.add((folder,index))
        expected='audio/f%02d-t%04d.mp3'%(folder,index)
        if track['file']!=expected:raise ValueError('Invalid DFPlayer audio filename')
        file=root/expected
        if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest()!=track['sha256']:
            raise ValueError('Missing or modified DFPlayer recording: '+expected)
    return len(tracks)
if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: python3 verify-dfplayer-assets.py AUDIO_ROOT')
    try:count=verify(sys.argv[1])
    except (OSError,ValueError,KeyError,TypeError) as error:raise SystemExit(str(error))
    print('Verified %d DFPlayer recordings.'%count)
