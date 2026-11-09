const {chromium}=require('../work/test-deps/playwright/driver/package');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'outputs/Earth_Legacy'),web=path.join(root,'work/earth-apk-test/web'),base='https://earth-legacy.test';
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const report={version:'0.5.0',apk_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'Earth-Legacy-0.5.0.apk'))).digest('hex'),testedAt:new Date().toISOString(),environment:'Chrome touch viewport, local files extracted from APK, no network server',passed:[],errors:[],screenshots:[]};
let browser,page;
const pass=s=>{report.passed.push(s);console.log('PASS',s)};
async function shot(name){await page.screenshot({path:path.join(out,'preview',name+'.png')});report.screenshots.push('preview/'+name+'.png')}
async function map(){await page.goto(base);await page.waitForFunction(()=>contentReady);await page.evaluate(()=>finishSplash());await page.getByRole('button',{name:/العربية/}).click()}
async function point(id,board=false){return page.evaluate(({id,board})=>{const b=$(board?'#board':'#tray').getBoundingClientRect();if(board)return {x:b.left+(id%columns+.5)*b.width/columns,y:b.top+(Math.floor(id/columns)+.5)*b.height/rows};const hit=trayHits.find(p=>p.id===id);return {x:b.left+hit.x+hit.w/2,y:b.top+hit.y+hit.h/2}},{id,board})}
async function tap(p){await page.touchscreen.tap(p.x,p.y)}
async function put(id,slot=id){await tap(await point(id));await tap(await point(slot,true))}
async function rawSave(){return page.evaluate(()=>localStorage.getItem('erth-progress-v1'))}
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();const file=path.resolve(web,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(web+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:mime[path.extname(file)]||'text/plain',body:fs.readFileSync(file)})});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await map();await page.locator('#playButton').click();await page.waitForFunction(()=>pieces.length===24);
 assert.equal(await page.locator('#puzzleToolbar button').count(),5);assert.equal(await page.locator('#puzzleTools').count(),0);
 const buttons=await page.locator('#puzzleToolbar button').evaluateAll(buttons=>buttons.map(b=>({label:b.getAttribute('aria-label'),top:b.getBoundingClientRect().top,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})));
 assert.ok(buttons.every(b=>b.label&&b.width>=44&&b.height>=44&&b.top===buttons[0].top));
 const first=await page.evaluate(()=>trayHits[0].id);await put(first);
 assert.equal(await page.evaluate(id=>isLocked(id)&&placementEffects.has(id),first),true);
 const glowing=await page.locator('#board').evaluate(c=>c.toDataURL());await shot('17-correct-piece-glow');await page.waitForFunction(()=>placementEffects.size===0);
 assert.notEqual(await page.locator('#board').evaluate(c=>c.toDataURL()),glowing);await shot('18-top-puzzle-toolbar');
 pass('Four labeled assistance icons beside Back, with touch targets; a newly correct piece gets a visible transient glow that expires');
 const locked=await point(first,true),empty=await point((first+1)%24,true);await page.mouse.move(locked.x,locked.y);await page.mouse.down();await page.mouse.move(empty.x,empty.y,{steps:8});await page.mouse.up();
 assert.equal(await page.evaluate(id=>boardSlots.get(id),first),first);assert.equal(await page.evaluate(()=>selectedPiece),null);assert.equal(await page.locator('#returnPiece').isDisabled(),true);
 const other=await page.evaluate(()=>trayHits[0].id);await put(other,first);assert.equal(await page.evaluate(()=>boardSlots.size),1);
 const free=await page.evaluate(ids=>Array.from({length:pieceCount},(_,i)=>i).find(i=>!ids.includes(i)),[first,other]);await tap(await point(free,true));assert.equal(await page.evaluate(id=>boardSlots.get(id),other),free);
 const wrong=await point(free,true);await page.mouse.move(wrong.x,wrong.y);await page.mouse.down();await page.mouse.move(locked.x,locked.y,{steps:8});await page.mouse.up();
 assert.deepEqual(await page.evaluate(ids=>ids.map(id=>boardSlots.get(id)),[first,other]),[first,free]);
 const guards=await page.evaluate(id=>{selectedPiece=id;const b=$('#board').getBoundingClientRect();return [returnSelectedPiece(),attemptPlace(b.left+b.width/2,b.top+b.height/2)]},first);assert.deepEqual(guards,[false,false]);
 await page.evaluate(()=>selectedPiece=null);await page.locator('#clearWrong').click();assert.deepEqual(await page.evaluate(()=>[...boardSlots]),[[first,first]]);
 pass('Correct pieces cannot be selected, dragged, returned, swapped or displaced by a tray piece; cleanup keeps them fixed');
 const pageIds=await page.evaluate(()=>visibleTrayIds());await page.locator('#placePage').click();assert.ok(await page.evaluate(ids=>ids.every(id=>isLocked(id)&&placementEffects.has(id)),pageIds));
 assert.equal(await page.evaluate(id=>placementEffects.has(id),first),false);await page.waitForFunction(()=>placementEffects.size===0);
 const state=await rawSave();await page.locator('#restart').click();await shot('19-resume-options-ar');assert.equal(await rawSave(),state);await page.locator('#cancelResume').click();assert.equal(await rawSave(),state);
 await page.locator('#restart').click();await page.locator('#continuePuzzle').click();assert.equal(await rawSave(),state);
 await page.evaluate(()=>leavePuzzle());await page.locator('#playButton').click();assert.equal(await page.locator('#resumeDialog').isVisible(),true);assert.equal(await page.evaluate(()=>activeScreen),'map');assert.equal(await rawSave(),state);
 await page.locator('#cancelResume').click();assert.equal(await page.evaluate(()=>activeScreen),'map');assert.equal(await rawSave(),state);
 await page.locator('#playButton').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#resumeDialog').isVisible(),false);assert.equal(await rawSave(),state);
 await page.locator('#playButton').click();await page.evaluate(()=>window.erthBack());assert.equal(await page.locator('#resumeDialog').isVisible(),false);assert.equal(await rawSave(),state);
 await page.locator('#playButton').click();await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length===24);
 assert.equal(await rawSave(),state);assert.equal(await page.evaluate(id=>isLocked(id),first),true);assert.equal(await page.evaluate(()=>placementEffects.size),0);
 pass('Page placement also locks and highlights only newly solved pieces; resume/cancel/Escape/Android Back never erase saved progress');
 await map();await page.locator('#playButton').click();assert.equal(await page.locator('#resumeDialog').isVisible(),true);await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length===24);assert.equal(await page.evaluate(id=>isLocked(id),first),true);
 await page.locator('#previewImage').click();await shot('20-picture-preview');assert.equal(await page.locator('#previewPicture').evaluate(im=>im.complete&&im.naturalWidth>0),true);await page.evaluate(()=>window.erthBack());assert.equal(await page.evaluate(()=>activeScreen),'puzzle');
 await page.locator('#hint').click();assert.equal(await page.locator('#hint').getAttribute('aria-pressed'),'true');await page.locator('#hint').click();assert.equal(await page.locator('#hint').getAttribute('aria-pressed'),'false');
 pass('Locked positions survive page reload and Continue; picture preview and hint work directly from the toolbar');
 await page.evaluate(()=>{saved._museum=['augustus'];persist()});await page.locator('#restart').click();await page.locator('#restartSaved').click();await page.waitForFunction(()=>pieces.length===24&&boardSlots.size===0);
 assert.deepEqual(await page.evaluate(()=>saved._museum),['augustus']);assert.equal(await page.evaluate(()=>placementEffects.size),0);await page.evaluate(()=>leavePuzzle());await page.locator('#playButton').click();assert.equal(await page.locator('#resumeDialog').isVisible(),false);await page.waitForFunction(()=>pieces.length===24);
 pass('Restart only clears this puzzle after the explicit red action; museum rewards remain; empty puzzles open directly');
 const wrongId=await page.evaluate(()=>trayHits[0].id);await put(wrongId,(wrongId+1)%24);await page.evaluate(()=>leavePuzzle());await page.locator('#playButton').click();assert.equal(await page.locator('#resumeDialog').isVisible(),true);
 await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length===24);assert.equal(await page.evaluate(()=>placed.size),0);assert.equal(await page.evaluate(()=>boardSlots.size),1);
 pass('A save containing only misplaced pieces also offers Continue, Restart and Cancel');
 const overflow=[];
 for(const [width,height] of [[360,800],[412,915],[768,1024],[915,412]])for(const language of ['ar','en']){
  await page.setViewportSize({width,height});await page.evaluate(l=>{lang=l;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';openPuzzle('continue')},language);await page.waitForFunction(()=>pieces.length===24);await page.locator('#restart').click();
  const bounds=await page.locator('#resumeDialog').evaluate(d=>{const buttons=[...d.querySelectorAll('button')].map(b=>b.getBoundingClientRect());return {overflow:d.scrollWidth>d.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,buttonsFit:buttons.every(b=>b.top>=0&&b.bottom<=innerHeight+1&&b.left>=0&&b.right<=innerWidth+1)}});
  if(bounds.overflow||!bounds.buttonsFit)overflow.push([width,height,language,bounds]);
  if(language==='en'){assert.equal(/[\u0600-\u06ff]/.test(await page.locator('#resumeDialog').innerText()),false);if(width===412)await shot('21-resume-options-en')}
  await page.locator('#cancelResume').click();
 }
 assert.deepEqual(overflow,[]);assert.deepEqual(report.errors,[]);pass('All three actions fit phone/tablet/landscape screens in Arabic and English; no JavaScript errors');
 report.status='passed';
})().catch(async e=>{report.status='failed';report.failure=e.stack;console.error(e);if(page)await shot('locking-options-failure').catch(()=>{});process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'locking-test-report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()});
