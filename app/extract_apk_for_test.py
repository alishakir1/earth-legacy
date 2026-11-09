from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
target=root/'work/earth-apk-test'
target.mkdir(exist_ok=True)
with zipfile.ZipFile(root/'outputs/Earth_Legacy/Earth-Legacy-0.5.0.apk') as z:
 for name in z.namelist():
  if name.startswith('assets/web/') and not name.endswith('/'):
   dest=target/name.removeprefix('assets/')
   dest.parent.mkdir(parents=True,exist_ok=True)
   dest.write_bytes(z.read(name))
print('Extracted packaged assets for UI tests')
