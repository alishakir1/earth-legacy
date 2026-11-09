from pathlib import Path
import subprocess,zipfile,os,shutil,hashlib,json
R=Path(__file__).resolve().parent;tools=R.parent/'work/android-tools';build=R/'build/earth_legacy_050';build.mkdir(exist_ok=True,parents=True)
jdk=next((tools/'jdk').glob('*/bin'));bt=next((tools/'build-tools').glob('*/aapt2.exe')).parent;platform=next((tools/'platform').glob('*/android.jar'))
env=os.environ.copy();env['JAVA_HOME']=str(jdk.parent);env['PATH']=str(jdk)+os.pathsep+env.get('PATH','')
def run(*args):subprocess.run([str(x) for x in args],check=True,env=env,cwd=R)
res=build/'resources.zip';run(bt/'aapt2.exe','compile','--dir',R/'android/res','-o',res)
assets=build/'assets/web';shutil.copytree(R/'web',assets,dirs_exist_ok=True)
unsigned=build/'unsigned.apk';run(bt/'aapt2.exe','link','-o',unsigned,'--manifest',R/'android/AndroidManifest.xml','-I',platform,'-A',build/'assets',res)
classes=build/'classes';classes.mkdir(exist_ok=True)
run(jdk/'javac.exe','-encoding','UTF-8','--release','8','-classpath',platform,'-d',classes,*list((R/'android/src').rglob('*.java')))
run(jdk/'java.exe','-cp',bt/'lib/d8.jar','com.android.tools.r8.D8','--lib',platform,'--min-api','26','--output',build,*list(classes.rglob('*.class')))
repacked=build/'repacked.apk'
with zipfile.ZipFile(unsigned) as source,zipfile.ZipFile(repacked,'w') as z:
 for entry in source.infolist():z.writestr(entry.filename,source.read(entry.filename),compress_type=entry.compress_type)
 z.write(build/'classes.dex','classes.dex',compress_type=zipfile.ZIP_DEFLATED)
aligned=build/'aligned.apk';run(bt/'zipalign.exe','-f','4',repacked,aligned)
key=R/'build/prototype.keystore'
if not key.exists():raise RuntimeError('Original prototype signing key is required to preserve update compatibility')
out=R.parent/'outputs/Earth_Legacy/Earth-Legacy-0.5.0.apk'
out.parent.mkdir(exist_ok=True,parents=True)
run(jdk/'java.exe','-jar',bt/'lib/apksigner.jar','sign','--ks',key,'--ks-pass','env:EARTH_KEYSTORE_PASSWORD','--key-pass','env:EARTH_KEY_PASSWORD','--out',out,aligned)
run(jdk/'java.exe','-jar',bt/'lib/apksigner.jar','verify','--verbose',out)
run(bt/'aapt2.exe','dump','badging',out)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert len([x for x in z.namelist() if x.startswith('assets/web/images/') and x.endswith('.webp')])==115
 assert len(json.loads(z.read('assets/web/content.json')))==115
 assert len(json.loads(z.read('assets/web/civilizations.json')))==30
assert all((R/'web'/r['image']).exists() for r in json.loads((R/'web/content.json').read_text(encoding='utf-8')))
(out.parent/'SHA256.txt').write_text(hashlib.sha256(out.read_bytes()).hexdigest()+'  '+out.name+'\n')
print('APK ready',out,round(out.stat().st_size/1024/1024,2),'MiB')
