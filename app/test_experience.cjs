const {chromium}=require('../work/test-deps/playwright/driver/package');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'outputs/Earth_Legacy'),web=path.join(root,'work/earth-apk-test/web'),base='https://earth-legacy.test';
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const report={version:'0.5.0',apk_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'Earth-Legacy-0.5.0.apk'))).digest('hex'),testedAt:new Date().toISOString(),environment:'Chrome mobile/touch, local assets extracted from signed APK; no network server',passed:[],errors:[],screenshots:[]};
let browser,page;
const pass=s=>{report.passed.push(s);console.log('PASS',s)};
async function shot(name){await page.screenshot({path:path.join(out,'preview',name+'.png')});report.screenshots.push('preview/'+name+'.png')}
async function ready(){await page.goto(base);await page.waitForFunction(()=>contentReady);await page.evaluate(()=>finishSplash());await page.getByRole('button',{name:/العربية/}).click()}
async function fresh(n=1){await page.evaluate(n=>{if($('#card').open)closeCard();saved={_museum:data.slice(0,n-1).map(r=>r.entry_id)};persist();selected=n-1;openPuzzle('continue')},n);await page.waitForFunction(()=>pieces.length>0)}
async function trayPoint(id){return page.evaluate(id=>{const t=$('#tray').getBoundingClientRect(),p=trayHits.find(x=>x.id===id);return {x:t.left+p.x+p.w/2,y:t.top+p.y+p.h/2}},id)}
async function boardPoint(slot){return page.evaluate(slot=>{const b=$('#board').getBoundingClientRect();return {x:b.left+(slot%columns+.5)*b.width/columns,y:b.top+(Math.floor(slot/columns)+.5)*b.height/rows}},slot)}
async function dragPiece(id,slot){const a=await trayPoint(id),b=await boardPoint(slot);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up()}
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await context.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();const f=path.resolve(web,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!f.startsWith(web+path.sep)||!fs.existsSync(f))return route.fulfill({status:404,body:''});return route.fulfill({contentType:mime[path.extname(f)]||'text/plain',body:fs.readFileSync(f)})});
 page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await ready();
 assert.equal(await page.locator('.destination').evaluate(e=>e.classList.contains('is-mystery')),true);assert.equal(await page.locator('#personName').innerText(),'المستوى 1');await shot('22-journey-design');
 await page.evaluate(()=>{saved.akbar_grid6x4=[0,5];persist();showMap()});assert.equal(await page.locator('#playButton').innerText(),'تابع');assert.ok((await page.locator('#destinationState').innerText()).includes('2 / 24'));
 await page.locator('#playButton').click();await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length===24);assert.equal(await page.evaluate(()=>placed.size),2);
 pass('Map keeps the discovery secret and accurately resumes a legacy partial puzzle');
 for(const n of [1,6,10]){
  await fresh(n);await page.locator('#edgePieces').click();let rounds=0;
  while(await page.evaluate(()=>filteredTrayPieces().length)>0){const snapshot=await page.evaluate(()=>visibleTrayIds());assert.ok(await page.evaluate(ids=>ids.every(isEdgePiece),snapshot));await page.locator('#placePage').click();assert.ok(await page.evaluate(ids=>ids.every(isLocked),snapshot));assert.ok(++rounds<8)}
  assert.equal(await page.evaluate(()=>placed.size),n===1?16:n===6?22:28);assert.equal(await page.locator('#trayEmpty').isVisible(),true);assert.equal(await page.locator('#placePage').isDisabled(),true);assert.equal(await page.evaluate(()=>done(data[selected])),false);
  await page.locator('#showAllPieces').click();assert.ok(await page.evaluate(()=>visibleTrayIds().every(id=>!isEdgePiece(id))));
 }
 pass('Edge filter works for 24/40/60 pieces; page assistance places only visible edges, then offers the remaining center pieces');
 await fresh();await page.locator('#edgePieces').click();await page.locator('#placePage').click();await page.waitForFunction(()=>placementEffects.size===0);await shot('23-edges-progress');
 const savedBefore=await page.evaluate(()=>saved[positionsKey()]);await ready();await page.locator('#playButton').click();await page.locator('#continuePuzzle').click();await page.waitForFunction(()=>pieces.length===24);assert.equal(await page.evaluate(()=>trayFilter),'edges');assert.deepEqual(await page.evaluate(()=>saved[positionsKey()]),savedBefore);
 await page.locator('#allPieces').click();const interior=await page.evaluate(()=>trayHits.find(p=>!isEdgePiece(p.id))?.id);
 if(interior!==undefined){const target=await page.evaluate(id=>Array.from({length:pieceCount},(_,i)=>i).find(slot=>slot!==id&&![...boardSlots.values()].includes(slot)),interior);await dragPiece(interior,target);await page.locator('#edgePieces').click();const b=await boardPoint(target);await page.touchscreen.tap(b.x,b.y);await page.locator('#returnPiece').click();assert.equal(await page.evaluate(()=>trayFilter),'all');assert.ok(await page.evaluate(id=>visibleTrayIds().includes(id),interior))}
 pass('Tray filter, page and positions survive resume; returning an interior piece reveals it in the All pieces tray');
 await fresh(10);await page.locator('#zoomInBoard').click();await page.locator('#zoomInBoard').click();assert.equal(await page.evaluate(()=>boardZoom),2);assert.equal(await page.locator('#zoomInBoard').isDisabled(),true);
 const beforePan=await page.evaluate(()=>({left:$('#boardViewport').scrollLeft,top:$('#boardViewport').scrollTop,save:localStorage.getItem('erth-progress-v1')}));await page.locator('#panBoard').click();
 const v=await page.locator('#boardViewport').boundingBox();await page.mouse.move(v.x+v.width*.7,v.y+v.height*.7);await page.mouse.down();await page.mouse.move(v.x+v.width*.3,v.y+v.height*.3,{steps:8});await page.mouse.up();
 assert.ok(await page.evaluate(p=>$('#boardViewport').scrollLeft>p.left||$('#boardViewport').scrollTop>p.top,beforePan));assert.equal(await page.evaluate(()=>localStorage.getItem('erth-progress-v1')),beforePan.save);await page.locator('#panBoard').click();
 const id=await page.evaluate(()=>trayHits[0].id);await page.evaluate(id=>{const b=$('#board'),v=$('#boardViewport'),w=b.getBoundingClientRect().width,h=b.getBoundingClientRect().height;v.scrollLeft=(id%columns+.5)*w/columns-v.clientWidth/2;v.scrollTop=(Math.floor(id/columns)+.5)*h/rows-v.clientHeight/2},id);
 await dragPiece(id,id);assert.equal(await page.evaluate(id=>isLocked(id),id),true);await page.waitForFunction(()=>placementEffects.size===0);await shot('24-zoomed-puzzle');
 const rejected=await page.evaluate(()=>{selectedPiece=trayHits[0].id;const v=$('#boardViewport').getBoundingClientRect(),before=boardSlots.size;const result=attemptPlace(v.left+v.width/2,v.bottom+8);selectedPiece=null;return {result,unchanged:before===boardSlots.size}});assert.deepEqual(rejected,{result:false,unchanged:true});
 await page.locator('#zoomResetBoard').click();assert.equal(await page.evaluate(()=>boardZoom),1);assert.equal(await page.evaluate(()=>panMode),false);assert.equal(await page.evaluate(()=>$('#boardViewport').scrollLeft+$('#boardViewport').scrollTop),0);
 pass('Board zooms to 200%, pans without changing progress, accepts real drops after scrolling, rejects drops outside the viewport, and resets to fit');
 await fresh();while(await page.evaluate(()=>remainingPieces().length)>0)await page.locator('#placePage').click();await page.waitForFunction(()=>$('#card').open);assert.equal(await page.locator('.card-field').count(),7);assert.equal(await page.locator('.card-facts .card-field').count(),4);assert.equal(await page.locator('#cardMuseum').isVisible(),true);await shot('25-discovery-design');
 await page.locator('#cardMuseum').click();assert.equal(await page.evaluate(()=>activeScreen),'collection');assert.equal(await page.locator('#museumGrid button').count(),1);await page.locator('#tabMuseum').click();assert.equal(await page.locator('#recentCards button').count(),1);assert.equal(await page.locator('#museumWelcome').isVisible(),false);await shot('26-museum-discoveries');
 await page.locator('#ownedCollections').click();assert.equal(await page.locator('.civ-card').count(),1);await page.locator('#museumSearch').fill('nonexistent');assert.equal(await page.locator('.civ-card').count(),0);assert.equal(await page.locator('#museumNoResults').isVisible(),true);await page.locator('#museumSearch').fill('');await page.locator('#recentCards button').click();assert.equal(await page.locator('#card').isVisible(),true);await page.locator('#nextLevel').click();await page.locator('#allCollections').click();assert.equal(await page.locator('.civ-card').count(),30);
 pass('Discovery preserves all seven sourced fields and opens the earned museum collection; recent discoveries and owned-only search never reveal locked cards');
 const overflow=[];for(const [width,height] of [[360,800],[412,915],[768,1024],[915,412]])for(const l of ['ar','en']){
  await page.setViewportSize({width,height});await page.evaluate(l=>{lang=l;document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';selected=0;openPuzzle('continue')},l);await page.waitForFunction(()=>pieces.length>0);await page.locator('#zoomInBoard').click();await page.locator('#edgePieces').click();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))overflow.push([width,l,'puzzle']);
  const rect=await page.locator('#boardViewport').boundingBox();assert.ok(rect.width<=width&&rect.height<height);
  if(width===915&&l==='en')await shot('27-landscape-workspace');
  await page.evaluate(()=>leavePuzzle());await page.locator('#tabMuseum').click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))overflow.push([width,l,'museum']);
 }
 assert.deepEqual(overflow,[]);assert.deepEqual(report.errors,[]);pass('Zoomed/filtered gameplay and museum fit Arabic and English at phone, tablet and landscape sizes with no script errors');
 report.status='passed';
})().catch(async e=>{report.status='failed';report.failure=e.stack;console.error(e);if(page)await shot('experience-failure').catch(()=>{});process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'experience-test-report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()});
