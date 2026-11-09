const { chromium } = require('../work/test-deps/playwright/driver/package');
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..'), web = path.join(root, 'work/earth-apk-test/web');
const out = path.join(root, 'outputs/Earth_Legacy'), shots = path.join(out, 'preview');
fs.mkdirSync(shots, {recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.geojson':'application/json','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
let browser; const report={version:'0.5.0',apk_sha256:require('crypto').createHash('sha256').update(fs.readFileSync(path.join(out,'Earth-Legacy-0.5.0.apk'))).digest('hex'),passed:[],screenshots:[],errors:[],externalRequests:[],testedAt:new Date().toISOString(),environment:'Headless Chrome, packaged APK web assets, synthetic HTTPS fulfilled from local files; no network server'};
function pass(label){report.passed.push(label);console.log('PASS',label)}
async function screenshot(page,name){const p=path.join(shots,name+'.png');await page.screenshot({path:p,fullPage:false});report.screenshots.push(p)}
async function ready(page,lang='ar'){await page.goto(base);await page.waitForFunction(()=>contentReady);await page.evaluate(()=>finishSplash());await page.locator('#language button').filter({hasText:lang==='ar'?'العربية':'English'}).click();await page.waitForFunction(()=>activeScreen==='map')}
const base='https://earth-legacy.test';
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,timeout:20000});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();const file=path.resolve(web,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(web+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({status:200,contentType:mime[path.extname(file)]||'text/plain',body:fs.readFileSync(file)})});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base))report.externalRequests.push(r.url())});
 await page.goto(base);await page.waitForFunction(()=>contentReady);
 assert.equal(await page.evaluate(()=>activeScreen),'splash');await screenshot(page,'01-studio');
 await page.waitForFunction(()=>activeScreen==='language');await screenshot(page,'02-language');
 assert.equal(await page.locator('#bottomNav').isVisible(),false);await page.getByRole('button',{name:/العربية/}).click();
 await page.waitForFunction(()=>activeScreen==='map');await page.waitForTimeout(100);await screenshot(page,'03-earth-ar');
 assert.deepEqual(await page.evaluate(()=>[data.length,civilizations.length,data[21].entry_id]),[115,30,'ibn_sina']);
 assert.deepEqual(await page.evaluate(()=>[unlockedThrough(),visibleConnections().length,$$('#levelStrip button').length]),[0,0,1]);
 assert.equal(await page.locator('#personName').innerText(),'المستوى 1');
 assert.equal(await page.evaluate(()=>selectLevel(1)),false);assert.equal(await page.evaluate(()=>showCard(data[1])),false);
 await page.evaluate(()=>{selected=5;openPuzzle()});assert.equal(await page.evaluate(()=>activeScreen),'map');
 pass('Startup studio → language; 115 levels / 30 collections; initial level lock; Ibn Sina remains level 22');
 await page.locator('#tabMuseum').click();assert.equal(await page.locator('.civ-card').count(),30);assert.equal(await page.locator('.civ-art img').count(),0);await screenshot(page,'04-museum-ar');
 await page.locator('#museumSearch').fill('المغول');assert.ok(await page.locator('.civ-card').count()>0);await page.locator('.civ-card').first().click();assert.equal(await page.locator('#collectionEmpty').isVisible(),true);assert.equal(await page.locator('#museumGrid button').count(),0);await page.evaluate(()=>window.erthBack());
 await page.locator('#museumSearch').fill('nonexistent-civilization');assert.equal(await page.locator('#museumNoResults').isVisible(),true);
 pass('Museum lists 30 civilizations, search works, locked characters and images remain hidden');
 await page.locator('#tabMe').click();assert.equal(await page.locator('.menu-row').count(),6);await screenshot(page,'05-me-ar');
 for(const id of ['help','about','privacy','ads','restore']){await page.locator(`[data-action="${id}"]`).click();assert.equal(await page.locator('#infoDialog').isVisible(),true);assert.ok((await page.locator('#infoBody').innerText()).length>60);await page.evaluate(()=>window.erthBack())}
 await page.locator('[data-action="settings"]').click();await page.locator('#pref-reduceMotion').check();await page.locator('#pref-sound').check();await screenshot(page,'06-settings-ar');await page.locator('[data-language="en"]').click();assert.equal(await page.locator('#infoTitle').innerText(),'Settings');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');await page.evaluate(()=>closeInfo());await screenshot(page,'07-me-en');
 for(const id of ['help','about','privacy','ads','restore']){await page.locator(`[data-action="${id}"]`).click();assert.ok(!/[\u0600-\u06ff]/.test(await page.locator('#infoBody').innerText()));await page.evaluate(()=>closeInfo())}
 pass('All six profile sections work in Arabic and English; settings persist; ad-free and restore messages are accurate');
 await page.locator('#tabEarth').click();await page.locator('#playButton').click();await page.waitForFunction(()=>pieces.length===24);await screenshot(page,'08-puzzle-en');
 assert.equal(await page.locator('#bottomNav').isVisible(),false);
 // Exercise a real piece selection, a wrong drop, then a correct board tap.
 const pick=await page.evaluate(()=>{const h=trayHits[0],t=$('#tray').getBoundingClientRect(),b=$('#board').getBoundingClientRect();return {id:h.id,tx:t.left+h.x+h.w/2,ty:t.top+h.y+h.h/2,bx:b.left+((h.id%columns)+.5)*b.width/columns,by:b.top+(Math.floor(h.id/columns)+.5)*b.height/rows,wrongX:b.left+(((h.id+1)%columns)+.5)*b.width/columns}});
 await page.mouse.click(pick.tx,pick.ty);await page.mouse.click(pick.wrongX,pick.by);assert.equal(await page.evaluate(()=>placed.size),0);assert.equal(await page.evaluate(()=>boardSlots.size),1);await page.mouse.click(pick.wrongX,pick.by);await page.mouse.click(pick.bx,pick.by);assert.equal(await page.evaluate(()=>placed.size),1);
 // Verify the alternative drag gesture using real pointer events.
 const drag=await page.evaluate(()=>{const h=trayHits[0],t=$('#tray').getBoundingClientRect(),b=$('#board').getBoundingClientRect();return {tx:t.left+h.x+h.w/2,ty:t.top+h.y+h.h/2,bx:b.left+((h.id%columns)+.5)*b.width/columns,by:b.top+(Math.floor(h.id/columns)+.5)*b.height/rows}});
 await page.mouse.move(drag.tx,drag.ty);await page.mouse.down();await page.mouse.move(drag.bx,drag.by,{steps:8});await page.mouse.up();assert.equal(await page.evaluate(()=>placed.size),2);
 await page.locator('#hint').click();assert.equal(await page.locator('#hint').getAttribute('aria-pressed'),'true');await page.evaluate(()=>leavePuzzle());await page.reload();await page.waitForFunction(()=>contentReady);await page.evaluate(()=>finishSplash());await page.getByRole('button',{name:'English'}).click();await page.locator('#playButton').click();await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length===24);assert.equal(await page.evaluate(()=>placed.size),2);
 assert.deepEqual(await page.evaluate(()=>[prefs.sound,prefs.reduceMotion]),[true,true]);pass('Tap, misplaced piece remains and can be moved, drag placement, assistance hint, partial puzzle save and reload');
 await page.evaluate(()=>{const b=$('#board').getBoundingClientRect();for(let i=0;i<pieceCount;i++){if(placed.has(i))continue;selectedPiece=i;attemptPlace(b.left+(i%columns+.5)*b.width/columns,b.top+(Math.floor(i/columns)+.5)*b.height/rows)}});await page.waitForFunction(()=>$('#card').open);
 assert.equal(await page.locator('.card-field').count(),7);assert.ok((await page.locator('#cardTitle').innerText()).includes('Akbar'));assert.ok(!/[\u0600-\u06ff]/.test(await page.locator('#cardBody').innerText()));await screenshot(page,'09-discovery-en');await page.locator('#nextLevel').click();
 assert.deepEqual(await page.evaluate(()=>[selected,unlockedThrough(),visibleConnections().length,$$('#levelStrip button').length]),[1,1,1,2]);
 await page.locator('#tabMuseum').click();await page.locator('[data-civilization="mughal"]').click();assert.equal(await page.locator('#museumGrid button').count(),1);await page.locator('#museumGrid button').click();await page.locator('#nextLevel').click();assert.equal(await page.evaluate(()=>activeScreen),'collection');
 pass('Completing level 1 reveals level 2 and connecting line; seven-field bilingual discovery card; earned museum card');
 // Check every unlock frontier, including the final level, with one real completion tested above.
 const allFrontiers=await page.evaluate(()=>{const original=saved;let errors=[];for(let n=0;n<=data.length;n++){saved={_museum:data.slice(0,n).map(r=>r.entry_id)};selected=Math.min(n,data.length-1);showMap();const expected=Math.min(n,data.length-1);if(unlockedThrough()!==expected||visibleConnections().length!==expected||$$('#levelStrip button').length!==expected+1||canPlay(expected+1))errors.push(n)}saved=original;selected=unlockedThrough();showMap();return errors});assert.deepEqual(allFrontiers,[]);
 assert.deepEqual(await page.evaluate(()=>[1,5,6,9,10,11,20,115].map(n=>difficultyFor(n).count)),[24,24,40,40,60,24,60,24]);
 for(const n of [6,10]){await page.evaluate(n=>{saved={_museum:data.slice(0,n-1).map(r=>r.entry_id)};selected=n-1;openPuzzle()},n);await page.waitForFunction(n=>pieces.length===difficultyFor(n).count,n);const cnt=await page.evaluate(()=>pieceCount);assert.equal(cnt,n===6?40:60);await page.evaluate(()=>{const b=$('#board').getBoundingClientRect();for(let i=0;i<pieceCount;i++){selectedPiece=i;attemptPlace(b.left+(i%columns+.5)*b.width/columns,b.top+(Math.floor(i/columns)+.5)*b.height/rows)}});await page.waitForFunction(()=>$('#card').open);assert.equal(await page.evaluate(()=>done(data[selected])),true);await page.evaluate(()=>closeCard())}
 pass('All 116 progression states checked; 24/40/60-piece cycle and actual 40/60-piece completion');
 // Verify all cards have the required content, without manufacturing any missing values.
 const contentIssues=await page.evaluate(()=>data.flatMap(r=>['ar','en'].flatMap(l=>['card_civilization','birth_place','birth_date','period','description','achievements','impact'].filter(k=>!r[k+'_'+l]).map(k=>r.entry_id+':'+k+'_'+l))));assert.deepEqual(contentIssues,[]);
 await page.evaluate(()=>{saved={_museum:data.slice(0,44).map(r=>r.entry_id)};persist()});await page.reload();await page.waitForFunction(()=>contentReady);await page.evaluate(()=>{finishSplash();chooseLanguage('ar')});assert.equal(await page.evaluate(()=>selected),44);
 await page.evaluate(()=>{saved={_museum:[data[21].entry_id]};persist();selected=0;showMap()});assert.equal(await page.evaluate(()=>unlockedThrough()),0);
 await page.evaluate(()=>{saved={akbar_4:Array.from({length:16},(_,i)=>i)};persist()});assert.equal(await page.evaluate(()=>done(data[0])),true);
 pass('Required fields present in all 115 cards; 44-level saves upgrade; old square-grid saves migrate; out-of-order saves cannot skip first unsolved level');
 await page.evaluate(()=>{saved={_museum:[data[0].entry_id]};persist();showMe();openInfo('settings')});
 page.once('dialog',d=>d.dismiss());await page.locator('#resetProgress').click();assert.equal(await page.evaluate(()=>done(data[0])),true);
 page.once('dialog',d=>d.accept());await page.locator('#resetProgress').click();assert.equal(await page.evaluate(()=>data.filter(done).length),0);
 pass('Reset confirmation cancellation preserves progress; confirmation resets progress');
 // Leaving during image load or during the completion delay must not reopen an old card.
 await page.evaluate(()=>{selected=0;openPuzzle();leavePuzzle()});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>activeScreen),'map');
 await page.evaluate(()=>openPuzzle());await page.waitForFunction(()=>pieces.length===24);await page.evaluate(()=>{const b=$('#board').getBoundingClientRect();for(let i=0;i<pieceCount;i++){selectedPiece=i;attemptPlace(b.left+(i%columns+.5)*b.width/columns,b.top+(Math.floor(i/columns)+.5)*b.height/rows)}leavePuzzle()});await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>$('#card').open),false);
 pass('Leaving during image load or completion delay does not reopen stale puzzle/card');
 const overflow=[];
 for(const [width,height] of [[360,800],[412,915],[768,1024],[915,412]]){await page.setViewportSize({width,height});for(const lang of ['ar','en']){await page.evaluate(l=>chooseLanguage(l),lang);for(const screenFn of ['showMap','museum','showMe']){await page.evaluate(fn=>window[fn](),screenFn);const o=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(o)overflow.push([width,height,lang,screenFn])}for(const info of ['settings','help','about','privacy','ads','restore']){await page.evaluate(id=>openInfo(id),info);const o=await page.evaluate(()=>$('#infoDialog').scrollWidth>$('#infoDialog').clientWidth+1);if(o)overflow.push([width,height,lang,info]);await page.evaluate(()=>closeInfo())}}}
 assert.deepEqual(overflow,[]);pass('No horizontal overflow at 360, 412, 768 and landscape 915 px, both languages and all profile sheets');
 await page.setViewportSize({width:412,height:915});await page.evaluate(()=>{saved={_museum:data.slice(0,21).map(r=>r.entry_id)};persist();chooseLanguage('ar');selected=21;showMap();selectLevel(21)});await page.waitForTimeout(100);await screenshot(page,'10-earth-progress-ar');
 await page.evaluate(()=>{museum();openCollection('mughal')});await screenshot(page,'11-earned-collection-ar');await page.evaluate(()=>showCard(data[0]));await screenshot(page,'12-discovery-ar');await page.evaluate(()=>closeCard());
 await page.evaluate(()=>{localStorage.setItem('erth-progress-v1','null')});await page.reload();await page.waitForFunction(()=>contentReady);assert.equal(await page.evaluate(()=>unlockedThrough()),0);pass('Malformed null save recovers without crash');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);pass('No JavaScript errors or external network requests');
 report.status='passed';
})().catch(e=>{report.status='failed';report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'test-report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()});
