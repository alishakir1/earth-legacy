const {chromium}=require('../work/test-deps/playwright/driver/package');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'outputs/Earth_Legacy'),web=path.join(root,'work/earth-apk-test/web'),base='https://earth-legacy.test';
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const report={version:'0.5.0',apk_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'Earth-Legacy-0.5.0.apk'))).digest('hex'),testedAt:new Date().toISOString(),environment:'Headless Chrome touch viewport, assets extracted from signed APK, synthetic HTTPS served from local files without a network server',passed:[],errors:[],screenshots:[]};
let browser,page;
const pass=s=>{report.passed.push(s);console.log('PASS',s)};
async function shot(name){const file=path.join(out,'preview',name+'.png');await page.screenshot({path:file});report.screenshots.push('preview/'+name+'.png')}
async function open(){await page.goto(base);await page.waitForFunction(()=>contentReady);await page.evaluate(()=>finishSplash());await page.getByRole('button',{name:/العربية/}).click();await page.locator('#playButton').click();if(await page.locator('#resumeDialog').isVisible())await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length>0)}
async function cell(slot){return page.evaluate(slot=>{const b=$('#board').getBoundingClientRect();return {x:b.left+(slot%columns+.5)*b.width/columns,y:b.top+(Math.floor(slot/columns)+.5)*b.height/rows}},slot)}
async function tray(id){return page.evaluate(id=>{const h=trayHits.find(p=>p.id===id),b=$('#tray').getBoundingClientRect();if(!h)throw Error('Piece is not on the visible page');return {x:b.left+h.x+h.w/2,y:b.top+h.y+h.h/2}},id)}
async function tapAt(p){await page.touchscreen.tap(p.x,p.y)}
async function put(id,slot){await tapAt(await tray(id));await tapAt(await cell(slot))}
async function assist(id){await page.locator('#'+id).click()}
async function fresh(n=1){await page.evaluate(n=>{if($('#card').open)closeCard();saved={_museum:data.slice(0,n-1).map(r=>r.entry_id)};persist();selected=n-1;openPuzzle()},n);await page.waitForFunction(()=>pieces.length>0)}
async function uniformBoard(){return page.evaluate(()=>{const c=$('#board'),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<pixels.length;i+=4)if(pixels[i]!==17||pixels[i+1]!==40||pixels[i+2]!==50||pixels[i+3]!==255)return false;return true})}
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();const file=path.resolve(web,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(web+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});return route.fulfill({contentType:mime[path.extname(file)]||'text/plain',body:fs.readFileSync(file)})});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await open();
 assert.equal(await uniformBoard(),true);await shot('13-blank-board-ar');
 await assist('hint');assert.equal(await uniformBoard(),false);await assist('hint');assert.equal(await uniformBoard(),true);
 await page.locator('#previewImage').click();await page.evaluate(()=>window.erthBack());assert.equal(await page.locator('#imagePreview').isVisible(),false);assert.equal(await page.evaluate(()=>activeScreen),'puzzle');
 pass('Every pixel of the empty board is uniform; preview is opt-in; Back closes the picture preview without leaving the puzzle');
 const id=await page.evaluate(()=>trayHits[0].id),wrong=(id+1)%24;await put(id,wrong);
 assert.deepEqual(await page.evaluate(id=>[boardSlots.get(id),placed.size,remainingPieces().some(p=>p.id===id)],id),[wrong,0,false]);await shot('14-misplaced-piece-ar');
 const savedState=await page.evaluate(()=>saved[positionsKey()]);await open();assert.deepEqual(await page.evaluate(()=>saved[positionsKey()]),savedState);
 pass('Touch placement in a wrong cell stays on the board and persists after reload with tray order/page');
 const next=(id+2)%24,from=await cell(wrong),to=await cell(next);
 await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:10});await page.mouse.up();assert.equal(await page.evaluate(id=>boardSlots.get(id),id),next);
 const drop=await page.locator('#tray').boundingBox();await page.mouse.move(to.x,to.y);await page.mouse.down();await page.mouse.move(drop.x+drop.width/2,drop.y+drop.height/2,{steps:10});await page.mouse.up();assert.equal(await page.evaluate(id=>boardSlots.has(id),id),false);
 await put(id,wrong);await tapAt(await cell(wrong));await page.locator('#returnPiece').click();assert.equal(await page.evaluate(id=>boardSlots.has(id),id),false);
 await put(id,wrong);await tapAt(await cell(wrong));const trayArea=await page.locator('#tray').boundingBox();await tapAt({x:trayArea.x+20,y:trayArea.y+20});assert.equal(await page.evaluate(id=>boardSlots.has(id),id),false);
 pass('A board piece can be dragged elsewhere, dragged back, returned by button, or returned by tapping the tray');
 await fresh();const order=await page.evaluate(()=>pieces.map(p=>p.id));await put(order[0],order[8]);await put(order[1],order[3]);
 // Moving between occupied cells swaps both pieces instead of losing either one.
 await tapAt(await cell(order[8]));await tapAt(await cell(order[3]));
 assert.deepEqual(await page.evaluate(ids=>ids.map(id=>boardSlots.get(id)),order.slice(0,2)),[order[3],order[8]]);
 await tapAt(await cell(order[3]));await tapAt(await cell(order[8]));
 const third=await page.evaluate(()=>trayHits[0].id);await tapAt(await tray(third));await tapAt(await cell(order[8]));assert.equal(await page.evaluate(()=>boardSlots.size),2);assert.equal(await page.evaluate(id=>boardSlots.has(id),third),false);
 await page.locator('.tray-controls button').last().click();const visible=await page.evaluate(()=>visibleTrayIds());assert.equal(visible.length,6);assert.ok(visible.includes(order[8]));
 await shot('15-assistance-page-two-ar');await page.locator('#placePage').click();
 assert.deepEqual(await page.evaluate(()=>[...placed].sort((a,b)=>a-b)),[...visible].sort((a,b)=>a-b));
 assert.equal(await page.evaluate(id=>boardSlots.has(id),order[0]),false);assert.equal(await page.evaluate(id=>boardSlots.get(id),order[1]),order[3]);
 assert.equal(await page.evaluate(()=>boardSlots.size),7);await shot('16-page-two-placed-ar');
 pass('Occupied cells preserve pieces; board-to-board movement swaps; page helper snapshots only page 2, returns its blocker, and leaves unrelated wrong pieces untouched');
 await assist('clearWrong');assert.equal(await page.evaluate(()=>boardSlots.size),6);assert.equal(await page.evaluate(()=>placed.size),6);
 assert.equal(await page.locator('#clearWrong').isDisabled(),true);
 pass('Clear misplaced returns only incorrect pieces and preserves every correct piece');
 // Every difficulty, including a partial final page (40 pieces leaves 4).
 for(const n of [1,6,10]){
  await fresh(n);const count=await page.evaluate(()=>pieceCount);let rounds=0;
  while(await page.evaluate(()=>remainingPieces().length)>0){
   const snapshot=await page.evaluate(()=>({ids:visibleTrayIds(),before:[...placed]}));await assist('placePage');
   assert.deepEqual(await page.evaluate(()=>[...placed].sort((a,b)=>a-b)),[...snapshot.before,...snapshot.ids].sort((a,b)=>a-b));
   assert.ok(++rounds<=Math.ceil(count/6));
  }
  await page.waitForFunction(()=>$('#card').open);assert.equal(await page.evaluate(()=>placed.size),count);assert.equal(await page.evaluate(()=>done(data[selected])),true);
  await page.locator('#nextLevel').click();assert.equal(await page.evaluate(()=>unlockedThrough()),n);
 }
 pass('Visible-page assistance completes 24/40/60-piece puzzles across multiple pages, handles the 4-piece final page and unlocks only the next level');
 await page.evaluate(()=>{saved={_museum:[],akbar_grid6x4:[0,5]};persist();selected=0;openPuzzle('continue')});await page.waitForFunction(()=>pieces.length===24);
 assert.deepEqual(await page.evaluate(()=>[...boardSlots]),[[0,0],[5,5]]);
 await page.locator('#restart').click();await page.locator('#restartSaved').click();await page.waitForFunction(()=>pieces.length===24&&placed.size===0);assert.equal(await page.evaluate(()=>boardSlots.size),0);
 await open();assert.equal(await page.evaluate(()=>boardSlots.size),0);
 pass('0.3.1 partial saves migrate; confirmed restart clears correct and incorrect positions and stays cleared after reopening');
 // All-wrong full board must never complete or reveal the next level.
 await fresh();await page.evaluate(()=>{const b=$('#board').getBoundingClientRect();for(let id=0;id<pieceCount;id++){selectedPiece=id;const slot=(id+1)%pieceCount;attemptPlace(b.left+(slot%columns+.5)*b.width/columns,b.top+(Math.floor(slot/columns)+.5)*b.height/rows)}});
 assert.deepEqual(await page.evaluate(()=>[boardSlots.size,placed.size,done(data[0]),remainingPieces().length]),[24,0,false,0]);
 assert.equal(await page.locator('#placePage').isDisabled(),true);await page.locator('#clearWrong').click();assert.equal(await uniformBoard(),true);
 pass('A full board of wrong pieces does not complete the level; empty-page assistance is disabled and cleanup restores all pieces');
 const overflow=[];for(const [width,height] of [[360,800],[412,915],[768,1024],[915,412]])for(const language of ['ar','en']){
  await page.setViewportSize({width,height});await page.evaluate(l=>{lang=l;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';openPuzzle('continue')},language);await page.waitForFunction(()=>pieces.length>0);
  await page.locator('#previewImage').click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||$('#imagePreview').scrollWidth>$('#imagePreview').clientWidth+1))overflow.push([width,language]);
  if(language==='en')assert.equal(/[\u0600-\u06ff]/.test(await page.locator('#imagePreview').innerText()),false);await page.evaluate(()=>window.erthBack());
 }
 assert.deepEqual(overflow,[]);assert.deepEqual(report.errors,[]);pass('Assistance fits mobile/tablet/landscape in Arabic and English with no JavaScript errors');
 report.status='passed';
})().catch(async e=>{report.status='failed';report.failure=e.stack;console.error(e);if(page)await shot('assistance-failure').catch(()=>{});process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'puzzle-test-report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()});
