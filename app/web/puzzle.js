'use strict';
// A piece can occupy any board cell. Only matching piece/cell pairs count as solved.
let boardSlots=new Map();
let placementEffects=new Map(),effectFrame=0,resumeChoice=null;
let trayFilter='all',boardZoom=1,boardPan=null,panMode=false;
const isLocked=id=>boardSlots.get(id)===id;
// Connected pieces share the same displacement from their final image positions.
// Groups are derived from saved cells, so old saves need no conversion.
function pieceGroup(id){
 if(!boardSlots.has(id)||isLocked(id))return [id];const found=new Set([id]),queue=[id];
 for(let n=0;n<queue.length;n++){
  const a=queue[n],cell=boardSlots.get(a),ar=Math.floor(a/columns),ac=a%columns,cr=Math.floor(cell/columns),cc=cell%columns;
  for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const nr=ar+dr,nc=ac+dc;if(nr<0||nr>=rows||nc<0||nc>=columns)continue;
   const other=nr*columns+nc,otherCell=boardSlots.get(other);
   if(otherCell!==undefined&&!isLocked(other)&&!found.has(other)&&Math.floor(otherCell/columns)===cr+dr&&otherCell%columns===cc+dc){found.add(other);queue.push(other)}
  }
 }
 return [...found];
}
const positionsKey=()=>puzzleKey()+'_positions';
const validPiece=id=>Number.isInteger(id)&&id>=0&&id<pieceCount;
const remainingPieces=()=>pieces.filter(p=>!boardSlots.has(p.id));
const isEdgePiece=id=>id<columns||id>=pieceCount-columns||id%columns===0||id%columns===columns-1;
const filteredTrayPieces=()=>remainingPieces().filter(p=>trayFilter!=='edges'||isEdgePiece(p.id));
const visibleTrayIds=()=>trayHits.map(p=>p.id);
function updateCorrectPieces(){placed=new Set([...boardSlots].filter(([id,slot])=>id===slot).map(([id])=>id))}
function restoreBoard(){
 boardSlots=new Map();const state=saved[positionsKey()],occupied=new Set();
 if(state?.version===1&&Array.isArray(state.slots)){
  for(const pair of state.slots){if(!Array.isArray(pair))continue;const [id,slot]=pair;if(validPiece(id)&&validPiece(slot)&&!boardSlots.has(id)&&!occupied.has(slot)){boardSlots.set(id,slot);occupied.add(slot)}}
 }else for(const id of Array.isArray(saved[puzzleKey()])?saved[puzzleKey()]:[]){if(validPiece(id))boardSlots.set(id,id)}
 updateCorrectPieces();if(placed.size===pieceCount){boardSlots.clear();placed.clear();return null}return state;
}
function savePuzzle(){
 saved[puzzleKey()]=[...placed];
 saved[positionsKey()]={version:1,slots:[...boardSlots],order:pieces.map(p=>p.id),page:trayPage,filter:trayFilter};
 persist();
}
function hasSavedPuzzle(){
 const entry=data[selected],d=difficultyFor(entry.number),key=puzzleKeyFor(entry),state=saved[key+'_positions'];
 const valid=id=>Number.isInteger(id)&&id>=0&&id<d.count;
 const occupied=new Set(),ids=new Set();let correct=0;
 if(state?.version===1&&Array.isArray(state.slots)){
  for(const pair of state.slots){if(!Array.isArray(pair))continue;const [id,slot]=pair;if(valid(id)&&valid(slot)&&!ids.has(id)&&!occupied.has(slot)){ids.add(id);occupied.add(slot);if(id===slot)correct++}}
 }else for(const id of Array.isArray(saved[key])?saved[key]:[]){if(valid(id))ids.add(id)}
 if(!(state?.version===1&&Array.isArray(state.slots)))correct=ids.size;
 return ids.size>0&&correct<d.count;
}
function showResumeOptions(){
 cancelPieceDrag();resumeChoice={index:selected,inside:activeScreen==='puzzle'};
 const entry=data[selected],d=difficultyFor(entry.number);
 $('#resumeTitle').textContent=levelTitle(entry);$('#resumeImage').src=entry.image;$('#resumeImage').alt=levelTitle(entry);
 $('#resumePieceCount').textContent=txt(`${d.count} قطعة`,`${d.count} pieces`);
 $('#resumeWarning').textContent=txt('سيُفقد تقدم هذه الأحجية إذا اخترت إعادة البدء.','Current progress will be lost if you restart this puzzle.');
 $('#continuePuzzle').textContent=txt('متابعة الحل','Continue Solving');$('#restartSaved').textContent=txt('إعادة البدء','Restart');$('#cancelResume').textContent=txt('إلغاء','Cancel');
 if(!$('#resumeDialog').open)$('#resumeDialog').showModal();
}
function cancelResume(exitDaily=true){const outside=resumeChoice&&!resumeChoice.inside;if($('#resumeDialog').open)$('#resumeDialog').close();resumeChoice=null;if(exitDaily&&outside&&dailySession)showMap()}
function continueSavedPuzzle(){const choice=resumeChoice;cancelResume(false);if(!choice||choice.index!==selected)return;if(choice.inside&&activeScreen==='puzzle')return;openPuzzle('continue')}
function restartSavedPuzzle(){const choice=resumeChoice;cancelResume(false);if(!choice||choice.index!==selected)return;openPuzzle('restart')}
async function openPuzzle(mode=null){
 if(!data.length)return;if(!canPlay(selected)){selected=unlockedThrough();showMap();return}
 if(mode!=='continue'&&mode!=='restart'&&hasSavedPuzzle()){showResumeOptions();return}
 clearTimeout(completionTimer);closeImagePreview();cancelResume(false);cancelPieceDrag();clearPlacementEffects();revealStarted=0;const request=++puzzleRequest;
 applyDifficulty();screen('puzzle');pieces=[];trayHits=[];puzzleImage=null;
 if(mode==='restart'){delete saved[puzzleKey()];delete saved[positionsKey()];persist()}
 const entry=data[selected],previous=restoreBoard();selectedPiece=null;trayPage=0;hint=false;
 trayFilter=previous?.filter==='edges'?'edges':'all';boardZoom=1;panMode=false;boardPan=null;$('#boardViewport').scrollTo(0,0);
 $('#puzzleTitle').textContent=dailySession?txt('أحجية اليوم','Daily puzzle'):levelTitle(entry);
 for(const [id,ar,en] of [['backPuzzle','العودة إلى الأرض','Back to Earth'],['clearWrong','إرجاع القطع الخاطئة','Return misplaced pieces'],['placePage','وضع قطع الصفحة الحالية في أماكنها الصحيحة','Place current page correctly'],['hint','إظهار أو إخفاء التلميح','Show or hide hint'],['previewImage','عرض الصورة','View picture']]){const b=$('#'+id);b.setAttribute('aria-label',txt(ar,en));b.title=txt(ar,en);if(id!=='backPuzzle')b.disabled=true}
 $('#puzzleToolbar').setAttribute('aria-label',txt('أدوات الأحجية','Puzzle tools'));
 $('#closeImagePreview').setAttribute('aria-label',txt('إغلاق الصورة','Close picture'));$('#imagePreviewTitle').textContent=txt('الصورة','Picture');
 $('#returnPiece').textContent=txt('إرجاع القطعة المحددة','Return selected piece');
 $('#restart').textContent=txt('خيارات الأحجية','Puzzle options');
 $('#puzzleHelp').textContent=txt('ابدأ بالحواف. اسحب القطعة أو اخترها ثم المس مكانها.','Start with the edges. Drag a piece, or select it and tap its place.');
 for(const [id,ar,en] of [['backPuzzle','الأرض','Earth'],['clearWrong','إرجاع','Clear'],['placePage','وضع الصفحة','Place page'],['hint','تلميح','Hint'],['previewImage','الصورة','Picture']])$('#'+id+' span').textContent=txt(ar,en);
 $('#allPieces').textContent=txt('كل القطع','All pieces');$('#edgePieces').textContent=txt('الحواف','Edges');$('#trayEmptyText').textContent=txt('أكملت الحواف. بقيت القطع الداخلية.','Edges complete. The center pieces are waiting.');$('#showAllPieces').textContent=txt('عرض كل القطع','Show all pieces');
 $('#zoomOutBoard').setAttribute('aria-label',txt('تصغير اللوحة','Zoom board out'));$('#zoomInBoard').setAttribute('aria-label',txt('تكبير اللوحة','Zoom board in'));$('#zoomResetBoard').setAttribute('aria-label',txt('إعادة حجم اللوحة','Reset board zoom'));$('#boardViewport').setAttribute('aria-label',txt('مساحة اللوحة القابلة للتكبير','Zoomable puzzle area'));
 $('#board').setAttribute('aria-label',txt('لوحة الأحجية','Jigsaw puzzle board'));$('#tray').setAttribute('aria-label',txt('قائمة القطع','Puzzle pieces'));
 $('#puzzleStatus').textContent=txt('جارٍ تجهيز الأحجية…','Preparing your puzzle…');$('#trayPage').textContent='';$('#returnPiece').disabled=true;
 for(const id of ['#board','#tray']){const canvas=$(id);canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)}
 const image=new Image();image.onload=()=>{
  if(request!==puzzleRequest||data[selected]!==entry||activeScreen!=='puzzle')return;
  puzzleImage=image;pieces=Array.from({length:pieceCount},(_,id)=>({id,...sprite(id)}));
  if(Array.isArray(previous?.order)&&previous.order.length===pieceCount&&new Set(previous.order).size===pieceCount&&previous.order.every(validPiece)){
   const byId=new Map(pieces.map(p=>[p.id,p]));pieces=previous.order.map(id=>byId.get(id));
  }else for(let i=pieces.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]]}
  trayPage=Number.isInteger(previous?.page)?Math.max(0,previous.page):0;drawPuzzle();savePuzzle();
 };
 image.onerror=()=>{if(request===puzzleRequest)toast(txt('تعذر فتح الصورة','Could not load image'))};image.src=entry.image;
}
function drawPuzzle(){
 if(!puzzleImage?.complete||!pieces.length||activeScreen!=='puzzle')return;
 const board=$('#board');fitBoard();
 const {ctx,w,h}=canvasSize(board);ctx.scale(w/BW,h/BH);ctx.fillStyle='#112832';ctx.fillRect(0,0,BW,BH);
 if(hint){ctx.globalAlpha=.24;ctx.drawImage(puzzleImage,0,0,BW,BH);ctx.globalAlpha=1}
 // Draw only pieces that are on the board. Empty cells have no outline or guide.
 const selectedGroup=new Set(selectedPiece===null?[]:pieceGroup(selectedPiece));
 const visible=[...boardSlots].sort(([a],[b])=>Number(selectedGroup.has(a))-Number(selectedGroup.has(b)));
 for(const [id,slot] of visible){const p=pieces.find(piece=>piece.id===id);if(!p)continue;const x=slot%columns*BW/columns,y=Math.floor(slot/columns)*BH/rows;
  ctx.save();if(selectedGroup.has(id)){ctx.shadowColor=selectedGroup.size>1?'#8ae4d0':'#f5cd87';ctx.shadowBlur=12}ctx.drawImage(p.canvas,x-p.pad,y-p.pad);ctx.restore();
 }
 drawPlacementEffects(ctx);drawCompletionReveal(ctx);
 $('#puzzleStatus').textContent=txt(`${placed.size} من ${pieceCount} في المكان الصحيح`,`${placed.size} / ${pieceCount} correctly placed`);
 $('#puzzleProgressFill').style.width=100*placed.size/pieceCount+'%';$('#puzzleProgress').setAttribute('aria-valuenow',placed.size);$('#puzzleProgress').setAttribute('aria-valuemax',pieceCount);$('#puzzleProgress').setAttribute('aria-label',txt('تقدم الأحجية','Puzzle progress'));
 drawTray();$('#returnPiece').disabled=selectedPiece===null||!boardSlots.has(selectedPiece)||isLocked(selectedPiece)||placed.size===pieceCount;
 $('#returnPiece').textContent=selectedGroup.size>1?txt(`إرجاع المجموعة (${selectedGroup.size})`,`Return group (${selectedGroup.size})`):txt('إرجاع القطعة المحددة','Return selected piece');updatePuzzleTools();
}
function clearPlacementEffects(){cancelAnimationFrame(effectFrame);effectFrame=0;placementEffects.clear()}
function drawPlacementEffects(ctx){
 const now=performance.now(),duration=prefs.reduceMotion?180:650;
 for(const [id,start] of placementEffects){const phase=(now-start)/duration;if(phase>=1||!isLocked(id)){placementEffects.delete(id);continue}
  ctx.save();ctx.translate(id%columns*BW/columns,Math.floor(id/columns)*BH/rows);
  const path=piecePath(id);ctx.globalAlpha=1-phase;ctx.shadowColor='#ffe6a2';ctx.shadowBlur=prefs.reduceMotion?0:16;ctx.strokeStyle='#ffe6a2';ctx.lineWidth=prefs.reduceMotion?2:2+3*phase;ctx.stroke(path);
  ctx.shadowBlur=0;ctx.globalAlpha=.2*(1-phase);ctx.fillStyle='#fff3c9';ctx.fill(path);ctx.restore();
 }
 if(placementEffects.size&&!effectFrame)effectFrame=requestAnimationFrame(()=>{effectFrame=0;drawPuzzle()});
}
let trayHits=[];
function fitBoard(){
 const v=$('#boardViewport'),b=$('#board'),landscape=innerWidth>innerHeight&&innerHeight<650;
 const base=Math.max(1,Math.min(v.clientWidth,landscape?Math.max(140,innerHeight-218)/.75:650));
 v.style.height=Math.ceil(base*.75)+'px';b.style.width=base*boardZoom+'px';b.style.height=base*.75*boardZoom+'px';
 $('#zoomResetBoard').textContent=Math.round(boardZoom*100)+'%';$('#zoomOutBoard').disabled=boardZoom===1;$('#zoomInBoard').disabled=boardZoom===2;
 $('#panBoard').disabled=boardZoom===1;$('#panBoard').setAttribute('aria-pressed',String(panMode));$('#panBoard').textContent=panMode?txt('وضع القطع','Place pieces'):txt('تحريك اللوحة','Move board');
}
function changeBoardZoom(delta){
 if(!pieces.length)return;const v=$('#boardViewport'),before=boardZoom,centerX=v.scrollLeft+v.clientWidth/2,centerY=v.scrollTop+v.clientHeight/2;
 cancelPieceDrag();boardZoom=Math.max(1,Math.min(2,delta===0?1:boardZoom+delta));if(boardZoom===1)panMode=false;drawPuzzle();
 if(boardZoom===1){v.scrollTo(0,0);return}
 v.scrollLeft=centerX*boardZoom/before-v.clientWidth/2;v.scrollTop=centerY*boardZoom/before-v.clientHeight/2;
}
function toggleBoardPan(){if(boardZoom===1)return;cancelPieceDrag();selectedPiece=null;panMode=!panMode;drawPuzzle()}
function setTrayFilter(filter){trayFilter=filter==='edges'?'edges':'all';selectedPiece=null;trayPage=0;cancelPieceDrag();drawPuzzle();savePuzzle()}
function drawTray(){
 const {ctx,w,h}=canvasSize($('#tray'));ctx.clearRect(0,0,w,h);
 const left=filteredTrayPieces(),pages=Math.max(1,Math.ceil(left.length/6));trayPage=Math.max(0,Math.min(pages-1,trayPage));
 $('#allPieces').setAttribute('aria-pressed',String(trayFilter==='all'));$('#edgePieces').setAttribute('aria-pressed',String(trayFilter==='edges'));
 $('#trayEmpty').classList.toggle('hidden',trayFilter!=='edges'||left.length>0||remainingPieces().length===0);
 $$('.tray-controls button').forEach(b=>b.disabled=pages===1);
 $('#trayPage').textContent=txt(`الصفحة \u2066${trayPage+1} / ${pages}\u2069`,`Page ${trayPage+1} / ${pages}`);trayHits=[];
 left.slice(trayPage*6,trayPage*6+6).forEach((p,k)=>{const cw=w/3,ch=h/2,sc=Math.min((cw-20)/p.canvas.width,(ch-15)/p.canvas.height),pw=p.canvas.width*sc,ph=p.canvas.height*sc,x=k%3*cw+(cw-pw)/2,y=Math.floor(k/3)*ch+(ch-ph)/2;
  if(selectedPiece===p.id){ctx.fillStyle='#d9b87533';ctx.fillRect(k%3*cw+3,Math.floor(k/3)*ch+3,cw-6,ch-6)}ctx.drawImage(p.canvas,x,y,pw,ph);trayHits.push({id:p.id,x:k%3*cw,y:Math.floor(k/3)*ch,w:cw,h:ch});
 });
}
function pageTray(delta){if(!pieces.length)return;const pages=Math.max(1,Math.ceil(filteredTrayPieces().length/6));trayPage=(trayPage+delta+pages)%pages;selectedPiece=null;drawPuzzle();savePuzzle()}
function updatePuzzleTools(){
 $('#hint').disabled=!pieces.length;$('#previewImage').disabled=!pieces.length;
 $('#hint').setAttribute('aria-pressed',String(hint));
 $('#clearWrong').disabled=![...boardSlots].some(([id,slot])=>id!==slot);
 $('#placePage').disabled=visibleTrayIds().length===0;
 $('#placePage').title=txt(`وضع قطع الصفحة ${trayPage+1} الحالية (${visibleTrayIds().length}) في أماكنها الصحيحة`,`Place the ${visibleTrayIds().length} pieces on current page ${trayPage+1} correctly`);
}
function showImagePreview(){if(!pieces.length||activeScreen!=='puzzle')return;cancelPieceDrag();$('#previewPicture').src=data[selected].image;$('#previewPicture').alt=levelTitle(data[selected]);if(!$('#imagePreview').open)$('#imagePreview').showModal()}
function closeImagePreview(){if($('#imagePreview').open)$('#imagePreview').close()}
function toggleHint(){if(!pieces.length)return;hint=!hint;drawPuzzle()}
function clearWrongPieces(){
 if(!pieces.length||activeScreen!=='puzzle')return;cancelPieceDrag();
 for(const [id,slot] of boardSlots)if(id!==slot)boardSlots.delete(id);
 selectedPiece=null;commitBoard();
}
function placeVisiblePage(){
 if(!pieces.length||activeScreen!=='puzzle')return;
 // Snapshot first: refilling the tray must never expand this operation to another page.
 const ids=visibleTrayIds();cancelPieceDrag();if(!ids.length)return;
 const targets=new Set(ids);for(const [id,slot] of boardSlots)if(targets.has(slot)&&id!==slot)boardSlots.delete(id);
 for(const id of ids)boardSlots.set(id,id);selectedPiece=null;commitBoard(true);
}
function restartPuzzle(){if(activeScreen==='puzzle'&&pieces.length)showResumeOptions()}
function cancelPieceDrag(){drag=null;boardPan=null;$('#dragGhost').classList.add('hidden')}
function leavePuzzle(){clearTimeout(completionTimer);puzzleRequest++;closeImagePreview();cancelResume();clearPlacementEffects();cancelPieceDrag();showMap()}
function commitBoard(sound=false){
 clearTimeout(completionTimer);const before=placed;updateCorrectPieces();const complete=placed.size===pieceCount,newlyCorrect=[...placed].filter(id=>!before.has(id));
 for(const id of newlyCorrect)placementEffects.set(id,performance.now());
 if(complete)recordCompletion(data[selected]);
 drawPuzzle();savePuzzle();if(sound)playTone(complete);
 if(complete){const entry=data[selected],request=puzzleRequest;completionTimer=setTimeout(()=>{if(activeScreen==='puzzle'&&data[selected]===entry&&request===puzzleRequest&&placed.size===pieceCount){closeImagePreview();cancelResume(false);showCard(entry,true)}},prefs.reduceMotion?300:1300)}
}
function cellAt(clientX,clientY){
 const v=$('#boardViewport').getBoundingClientRect();if(clientX<v.left||clientX>=v.right||clientY<v.top||clientY>=v.bottom)return null;
 const b=$('#board').getBoundingClientRect();if(clientX<b.left||clientX>=b.right||clientY<b.top||clientY>=b.bottom)return null;
 return Math.floor((clientY-b.top)/b.height*rows)*columns+Math.floor((clientX-b.left)/b.width*columns);
}
function attemptPlace(clientX,clientY){
 if(selectedPiece===null||!pieces.length||placed.size===pieceCount||isLocked(selectedPiece))return false;
 const slot=cellAt(clientX,clientY);if(slot===null)return false;
 const id=selectedPiece,origin=boardSlots.get(id),occupant=[...boardSlots].find(([other,cell])=>cell===slot&&other!==id);
 const group=pieceGroup(id);
 if(origin!==undefined&&group.length>1){
  const dr=Math.floor(slot/columns)-Math.floor(origin/columns),dc=slot%columns-origin%columns,targets=new Map();
  for(const member of group){const old=boardSlots.get(member),r=Math.floor(old/columns)+dr,c=old%columns+dc;if(r<0||r>=rows||c<0||c>=columns){toast(txt('المجموعة تحتاج مساحة داخل اللوحة.','Keep the whole group inside the board.'));return false}targets.set(member,r*columns+c)}
  const cells=new Set(targets.values());if([...boardSlots].some(([other,cell])=>!targets.has(other)&&cells.has(cell))){toast(txt('اختر مساحة فارغة تكفي المجموعة.','Choose a clear space for the whole group.'));return false}
  for(const [member,target] of targets)boardSlots.set(member,target);selectedPiece=null;commitBoard(id===slot);return true;
 }
 if(occupant){
  if(isLocked(occupant[0])){toast(txt('هذه القطعة صحيحة وثابتة في مكانها.','This correct piece is locked in place.'));return false}
  if(origin===undefined){toast(txt('هذا المكان مشغول. انقل القطعة الموجودة أو اختر مكاناً فارغاً.','This position is occupied. Move its piece or choose an empty position.'));return false}
  if(pieceGroup(occupant[0]).length>1){toast(txt('هذه القطعة متصلة بمجموعة. انقل المجموعة أولاً.','That piece belongs to a group. Move the group first.'));return false}
  boardSlots.set(occupant[0],origin);
 }
 boardSlots.set(id,slot);selectedPiece=null;commitBoard(id===slot);const joined=pieceGroup(id).length;if(joined>1&&!isLocked(id))toast(txt(`اتصلت ${joined} قطع — حرّكها كمجموعة`,`${joined} pieces joined — move them as a group`));return true;
}
function returnSelectedPiece(){
 if(selectedPiece===null||!boardSlots.has(selectedPiece)||isLocked(selectedPiece)||placed.size===pieceCount)return false;
 const id=selectedPiece,group=pieceGroup(id);for(const member of group)boardSlots.delete(member);selectedPiece=null;
 if(trayFilter==='edges'&&group.some(member=>!isEdgePiece(member)))trayFilter='all';trayPage=Math.floor(filteredTrayPieces().findIndex(p=>p.id===id)/6);commitBoard();return true;
}
function startPieceDrag(e,id){
 if(drag||placed.size===pieceCount||isLocked(id))return;selectedPiece=id;const p=pieces.find(piece=>piece.id===id);if(!p)return;
 const scale=$('#board').getBoundingClientRect().width/BW,group=pieceGroup(id);let canvas=p.canvas,anchorX=p.canvas.width/2,anchorY=p.canvas.height/2;
 if(group.length>1){const cells=group.map(member=>boardSlots.get(member)),minC=Math.min(...cells.map(c=>c%columns)),maxC=Math.max(...cells.map(c=>c%columns)),minR=Math.min(...cells.map(c=>Math.floor(c/columns))),maxR=Math.max(...cells.map(c=>Math.floor(c/columns)));
  canvas=document.createElement('canvas');canvas.width=(maxC-minC+1)*p.w+p.pad*2;canvas.height=(maxR-minR+1)*p.h+p.pad*2;const ctx=canvas.getContext('2d');
  for(const member of group){const cell=boardSlots.get(member),part=pieces.find(x=>x.id===member);ctx.drawImage(part.canvas,(cell%columns-minC)*p.w,(Math.floor(cell/columns)-minR)*p.h)}
  const origin=boardSlots.get(id);anchorX=(origin%columns-minC+.5)*p.w+p.pad;anchorY=(Math.floor(origin/columns)-minR+.5)*p.h+p.pad;
 }
 $('#dragGhost').src=canvas.toDataURL();$('#dragGhost').style.width=canvas.width*scale+'px';
 drag={pointerId:e.pointerId,x:e.clientX,y:e.clientY,moved:false,width:canvas.width*scale,height:canvas.height*scale,anchorX:anchorX*scale,anchorY:anchorY*scale};
 e.target.setPointerCapture(e.pointerId);drawPuzzle();e.preventDefault();
}
$('#tray').addEventListener('pointerdown',e=>{
 if(drag||!pieces.length)return;
 if(selectedPiece!==null&&boardSlots.has(selectedPiece)){returnSelectedPiece();e.preventDefault();return}
 const b=e.target.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,hit=trayHits.find(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h);
 if(hit)startPieceDrag(e,hit.id);
});
$('#board').addEventListener('pointerdown',e=>{
 if(boardZoom>1&&panMode){const v=$('#boardViewport');boardPan={pointerId:e.pointerId,x:e.clientX,y:e.clientY,left:v.scrollLeft,top:v.scrollTop};e.target.setPointerCapture(e.pointerId);e.preventDefault();return}
 if(drag||!pieces.length||placed.size===pieceCount)return;const slot=cellAt(e.clientX,e.clientY);if(slot===null)return;
 const hit=[...boardSlots].find(([,cell])=>cell===slot);
 if(selectedPiece!==null&&hit?.[0]!==selectedPiece){attemptPlace(e.clientX,e.clientY);e.preventDefault();return}
 if(hit)startPieceDrag(e,hit[0]);
});
window.addEventListener('pointermove',e=>{
 if(boardPan&&e.pointerId===boardPan.pointerId){const v=$('#boardViewport');v.scrollLeft=boardPan.left+boardPan.x-e.clientX;v.scrollTop=boardPan.top+boardPan.y-e.clientY;return}
 if(!drag||e.pointerId!==drag.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8)drag.moved=true;
 if(drag.moved){$('#dragGhost').classList.remove('hidden');$('#dragGhost').style.left=e.clientX-drag.anchorX+'px';$('#dragGhost').style.top=e.clientY-drag.anchorY+'px'}
});
window.addEventListener('pointerup',e=>{
 if(boardPan?.pointerId===e.pointerId){boardPan=null;return}
 if(!drag||e.pointerId!==drag.pointerId)return;
 if(drag.moved){const t=$('#tray').getBoundingClientRect();if(cellAt(e.clientX,e.clientY)!==null)attemptPlace(e.clientX,e.clientY);else if(e.clientX>=t.left&&e.clientX<t.right&&e.clientY>=t.top&&e.clientY<t.bottom)returnSelectedPiece()}
 cancelPieceDrag();
});
window.addEventListener('pointercancel',e=>{if(drag?.pointerId===e.pointerId||boardPan?.pointerId===e.pointerId)cancelPieceDrag()});
$('#resumeDialog').addEventListener('cancel',e=>{e.preventDefault();cancelResume()});
$('#imagePreview').addEventListener('cancel',e=>{e.preventDefault();closeImagePreview()});
window.addEventListener('resize',()=>{drawGlobe();drawPuzzle()});
