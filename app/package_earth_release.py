from pathlib import Path
import json,subprocess,zipfile,hashlib,shutil
r=Path(__file__).resolve().parent;root=r.parent;out=root/'outputs/Earth_Legacy';tools=root/'work/android-tools'
jdk=next((tools/'jdk').glob('*/bin'));bt=next((tools/'build-tools').glob('*/aapt2.exe')).parent
new=out/'Earth-Legacy-0.5.0.apk';old=root/'outputs/ERTH_APK/ERTH-0.2.1.apk'
def cert(p):
 result=subprocess.run([str(jdk/'java.exe'),'-jar',str(bt/'lib/apksigner.jar'),'verify','--print-certs',str(p)],capture_output=True,text=True,check=True)
 return next(x.split(': ',1)[1] for x in result.stdout.splitlines() if x.startswith('Signer #1 certificate SHA-256 digest:'))
newcert,oldcert=cert(new),cert(old)
assert newcert==oldcert,'Upgrade signing certificate changed'
data=json.loads((r/'web/content.json').read_text(encoding='utf-8'))
legacy=json.loads((r/'legacy_content_v021.json').read_text(encoding='utf-8'))
assert [x['entry_id'] for x in data[:44]]==[x['entry_id'] for x in legacy]
with zipfile.ZipFile(new) as apk:
 for p in (r/'web').rglob('*'):
  if p.is_file():assert apk.read('assets/web/'+p.relative_to(r/'web').as_posix())==p.read_bytes(),str(p)
report=json.loads((out/'test-report.json').read_text(encoding='utf-8'))
assert report['status']=='passed'
native=json.loads((out/'android-test/native-test-report.json').read_text(encoding='utf-8'))
apk_hash=hashlib.sha256(new.read_bytes()).hexdigest()
assert report['apk_sha256']==apk_hash
puzzle_report=json.loads((out/'puzzle-test-report.json').read_text(encoding='utf-8'))
assert puzzle_report['status']=='passed' and puzzle_report['apk_sha256']==apk_hash
locking_report=json.loads((out/'locking-test-report.json').read_text(encoding='utf-8'))
assert locking_report['status']=='passed' and locking_report['apk_sha256']==apk_hash
experience_report=json.loads((out/'experience-test-report.json').read_text(encoding='utf-8'))
assert experience_report['status']=='passed' and experience_report['apk_sha256']==apk_hash
chronicle_report=json.loads((out/'chronicle-test-report.json').read_text(encoding='utf-8'))
assert chronicle_report['status']=='passed' and chronicle_report['apk_sha256']==apk_hash
native_matches=native['apk_sha256']==apk_hash
metadata={'name':'Earth Legacy','version':'0.5.0','version_code':10,'package':'com.erth.jigsaw','min_android':'8.0','target_sdk':35,'levels':len(data),'historical_people':sum(x['entry_type']=='historical_person' for x in data),'mythical_creatures':sum(x['entry_type']=='mythical_creature' for x in data),'civilization_collections':len(json.loads((r/'web/civilizations.json').read_text(encoding='utf-8'))),'apk_size_bytes':new.stat().st_size,'apk_sha256':hashlib.sha256(new.read_bytes()).hexdigest(),'signer_sha256':newcert,'matches_021_signer':True,'first_44_levels_preserved':True,'packaged_assets_match_source':True,'contains_ads':False,'contains_paid_purchases':False,'runtime_permissions':[],'automated_ui_test':'passed; packaged web assets; see test-report.json','puzzle_assistance_test':'passed; see puzzle-test-report.json','piece_locking_and_resume_test':'passed; see locking-test-report.json','experience_test':'passed; see experience-test-report.json','chronicle_test':'passed; see chronicle-test-report.json','research_content_changed':False,'native_device_test':native['status'] if native_matches else 'not performed for 0.5.0; emulator not running','previous_native_test':{'version':native['version'],'report':'android-test/native-test-report.json'},'physical_device_test':'not performed','status':'local preview; not a store release'}
(out/'release.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
readme=(r/'RELEASE_NOTES_050_AR.md').read_text(encoding='utf-8')
(out/'README_AR.md').write_text(readme,encoding='utf-8')
(r/'README_AR.md').write_text(readme,encoding='utf-8')
with zipfile.ZipFile(out/'Earth-Legacy-0.5.0-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for directory in ['web','android']:
  for p in (r/directory).rglob('*'):
   if p.is_file():z.write(p,'app/'+p.relative_to(r).as_posix())
 for filename in ['build_apk.py','english_cards.json','english_birthdates.json','legacy_content_v021.json','test_earth_legacy.cjs','test_puzzle_assistance.cjs','test_locked_pieces.cjs','test_experience.cjs','test_chronicle.cjs','package_earth_release.py','RELEASE_NOTES_050_AR.md','extract_apk_for_test.py','README_AR.md']:
  z.write(r/filename,'app/'+filename)
 for filename in ['test-report.json','puzzle-test-report.json','locking-test-report.json','experience-test-report.json','chronicle-test-report.json','release.json','android-test/native-test-report.json','android-test/native-puzzle-report.json']:
  z.write(out/filename,'verification/'+filename)
print(json.dumps(metadata,ensure_ascii=False,indent=2))
