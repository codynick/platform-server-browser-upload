"""Package a CodyPi release: python update.py PATH_TO_HEX VERSION"""
from pathlib import Path
import hashlib,json,re,sys
if len(sys.argv)!=3 or not re.fullmatch(r"\d+\.\d+\.\d+",sys.argv[2]):
    raise SystemExit("Usage: python update.py PATH_TO_HEX VERSION")
data=Path(sys.argv[1]).read_bytes().replace(b'\r\n',b'\n')
sha=hashlib.sha256(data).hexdigest()
folder=Path(__file__).resolve().parent
name=f"CodyPi.{sha}.hex"
(folder/name).write_bytes(data)
(folder/"manifest.json").write_text(json.dumps(dict(version=sys.argv[2],board="arduino-uno",file=name,sha256=sha),indent=2)+"\n")
print("Packaged",sys.argv[2],name)
