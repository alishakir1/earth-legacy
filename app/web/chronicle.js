'use strict';
let museumWing='all',arrivalEntry=null,dailySession=null,revealStarted=0;
const wingMatches=r=>museumWing==='all'||(r.entry_type==='mythical_creature'?'myth':'history')===museumWing;
const localDay=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function makeText(tag,value,cls){const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el}
function collectionStats(){const earned=data.filter(done);return {earned,civs:new Set(earned.map(r=>r.civilization_id)).size}}
function frameOptions(){const {earned,civs}=collectionStats();return [{id:'bronze',ar:'البرونز',en:'Bronze',ready:true,need:txt('متاح من البداية','Available from the start')},{id:'lapis',ar:'اللازورد',en:'Lapis',ready:earned.length>=10,need:txt('اكتشف 10 بطاقات','Discover 10 cards')},{id:'jade',ar:'اليشم',en:'Jade',ready:civs>=3,need:txt('اكتشف 3 حضارات','Discover 3 civilizations')}]}
function applyFrame(){const f=frameOptions().find(x=>x.id===saved._frame&&x.ready);document.body.dataset.frame=f?.id||'bronze'}
function selectFrame(id){if(!frameOptions().some(x=>x.id===id&&x.ready))return;saved._frame=id;persist();applyFrame();showJournal()}
function renderJourneyExtras(){
 applyFrame();const found=data.filter(done).length,total=Math.ceil(data.length/10),chapter=Math.min(total,Math.floor(unlockedThrough()/10)+1);
 $('#chapterButton').textContent=txt(`سجل الرحلة · الفصل ${chapter} من ${total}`,`Journey journal · Chapter ${chapter} of ${total}`);
 $('#chapterCaption').textContent=txt('كل عشر محطات تترك أثراً في متحفك.','Every ten stops leave a mark in your museum.');
 $('#dailyTitle').textContent=txt('عودة إلى حكاية','Revisit a story');$('#dailyDescription').textContent=found?txt('أحجية يومية اختيارية من اكتشافاتك. تحفظ منفصلة عن رحلتك.','An optional daily puzzle from your discoveries. Saved separately from your journey.'):txt('اكتشف بطاقتك الأولى لتفتح أحجية اليوم.','Discover your first card to unlock the daily puzzle.');
 const record=saved._daily?.[localDay()];$('#dailyPlay').disabled=!found;$('#dailyPlay').textContent=record?.done?txt('اكتملت اليوم ✓','Completed today ✓'):txt('أحجية اليوم','Daily puzzle');
}
function showJournal(){
 applyFrame();$('#journalTitle').textContent=txt('سجل رحلتك','Your journey journal');$('#closeJournal').setAttribute('aria-label',txt('إغلاق','Close'));const b=$('#journalBody');b.replaceChildren();const {earned,civs}=collectionStats();
 b.append(makeText('p',txt(`${earned.length} اكتشافات · ${civs} حضارات · ${Number(saved._dailyTotal)||0} أحاجٍ يومية مكتملة`,`${earned.length} discoveries · ${civs} civilizations · ${Number(saved._dailyTotal)||0} daily puzzles completed`),'journal-summary'));
 const badges=document.createElement('div');badges.className='journal-badges';for(const [yes,ar,en] of [[earned.length>0,'أول اكتشاف','First discovery'],[earned.length>=10,'عشر حكايات','Ten stories'],[civs>=3,'عابر الحضارات','Across civilizations'],[earned.some(r=>r.entry_type==='mythical_creature'),'قارئ الأساطير','Myth explorer']]){const badge=makeText('span',(yes?'✓ ':'◇ ')+txt(ar,en),yes?'earned':'waiting');badges.append(badge)}b.append(badges);
 b.append(makeText('h3',txt('فصول الرحلة','Journey chapters')));const list=document.createElement('ol');list.className='chapter-list';const chapterCount=Math.min(Math.ceil(data.length/10),Math.floor(unlockedThrough()/10)+1);
 for(let c=0;c<chapterCount;c++){const entries=data.slice(c*10,c*10+10),count=entries.filter(done).length,item=document.createElement('li');item.className=count===entries.length?'complete':'';item.append(makeText('strong',txt(`الفصل ${c+1}`,`Chapter ${c+1}`)),makeText('span',txt(`\u2066${count} / ${entries.length}\u2069 اكتشافات`,`${count} / ${entries.length} discoveries`)));const track=makeText('div','','progress-track'),fill=document.createElement('span');fill.style.width=100*count/entries.length+'%';track.append(fill);item.append(track);list.append(item)}b.append(list);
 b.append(makeText('h3',txt('إطار متحفك','Your museum frame')),makeText('p',txt('مكافآت تجميلية. استخدام المساعدة لا ينقص تقدمك أو مكافآتك.','Cosmetic rewards. Using assistance never reduces progress or rewards.'),'muted'));
 const choices=document.createElement('div');choices.className='frame-choices';for(const f of frameOptions()){const button=document.createElement('button');button.dataset.frame=f.id;button.disabled=!f.ready;button.setAttribute('aria-pressed',String(document.body.dataset.frame===f.id));button.append(makeText('strong',txt(f.ar,f.en)),makeText('small',f.ready?txt('متاح','Unlocked'):f.need));button.onclick=()=>selectFrame(f.id);choices.append(button)}b.append(choices);if(!$('#journalDialog').open)$('#journalDialog').showModal();
}
function closeJournal(){if($('#journalDialog').open)$('#journalDialog').close()}
$('#journalDialog').addEventListener('cancel',e=>{e.preventDefault();closeJournal()});
function endDaily(){if(!dailySession)return;selected=dailySession.returnIndex;dailySession=null;revealStarted=0}
function startDaily(){
 const date=localDay(),eligible=data.filter((r,i)=>done(r)&&canPlay(i));if(!eligible.length)return;
 if(!saved._daily||typeof saved._daily!=='object'||Array.isArray(saved._daily))saved._daily={};let record=saved._daily[date];
 if(!record||!eligible.some(r=>r.entry_id===record.entry)){let hash=0;for(const ch of date)hash=(hash*31+ch.charCodeAt(0))>>>0;record=saved._daily[date]={entry:eligible[hash%eligible.length].entry_id,done:false};persist()}
 if(record.done){toast(txt('أكملت أحجية اليوم. حكاية أخرى تنتظرك غداً.','Today’s puzzle is complete. Another story awaits tomorrow.'));return}
 dailySession={date,returnIndex:selected};selected=data.findIndex(r=>r.entry_id===record.entry);openPuzzle();
}
function recordCompletion(entry){
 if(dailySession){const record=saved._daily[dailySession.date];if(!record.done){record.done=true;saved._dailyTotal=(Number(saved._dailyTotal)||0)+1}}
 else saved._museum=[...new Set([...(saved._museum||[]),entry.entry_id])];
 revealStarted=performance.now();
}
function drawCompletionReveal(ctx){if(!revealStarted||placed.size!==pieceCount)return;const t=prefs.reduceMotion?1:Math.min(1,(performance.now()-revealStarted)/850);ctx.save();ctx.globalAlpha=t;ctx.drawImage(puzzleImage,0,0,BW,BH);ctx.restore();if(t<1&&!effectFrame)effectFrame=requestAnimationFrame(()=>{effectFrame=0;drawPuzzle()})}
function renderWings(){for(const host of $$('.wing-filters')){host.replaceChildren();for(const [id,ar,en] of [['all','كل القاعات','All wings'],['history','التاريخ','History'],['myth','الأساطير','Myths']]){const b=makeText('button',txt(ar,en));b.dataset.wing=id;b.setAttribute('aria-pressed',String(museumWing===id));b.onclick=()=>{museumWing=id;renderWings();if(activeScreen==='collection')openCollection(currentCivilization);else renderCivilizations()};host.append(b)}}}
function renderGalleryRoom(members,unlocked){
 renderWings();applyFrame();const room=$('#galleryHall'),ratio=members.length?unlocked.length/members.length:0;
 room.dataset.stage=ratio===0?'silent':ratio<.5?'awakening':ratio<1?'growing':'complete';room.dataset.theme=museumWing==='myth'?'myth':currentCivilization==='egypt'?'sand':currentCivilization==='mesopotamia'?'clay':['greece','rome'].includes(currentCivilization)?'marble':'night';
 $('#roomStage').textContent=txt(ratio===0?'قاعة تنتظر اكتشافك':ratio<.5?'بدأ الضوء يعود':ratio<1?'حكايات تملأ القاعة':'اكتملت المجموعة الحالية',ratio===0?'A room awaiting discovery':ratio<.5?'The lights are coming on':ratio<1?'Stories fill the gallery':'Current collection complete');
 $('#roomNote').textContent=txt('تصميم فني مستلهم من الحضارات؛ ليس إعادة بناء أثرية.','An artistic setting inspired by civilizations, not an archaeological reconstruction.');
 $('#wingNote').textContent=museumWing==='myth'?txt('مخلوقات من الموروث والأساطير، وليست كائنات مثبتة تاريخياً.','Creatures from traditions and mythology, not historically verified beings.'):museumWing==='history'?txt('شخصيات تاريخية؛ الملامح في الصور تصورات فنية.','Historical people; the portraits are artistic interpretations.'):txt('تُميّز كل بطاقة بين الشخصية التاريخية والمخلوق الأسطوري.','Each card distinguishes historical people from mythical creatures.');
 for(const b of $$('#museumGrid button')){const r=data.find(r=>r.entry_id===b.dataset.entry);b.classList.add('gallery-frame');b.append(makeText('small',r.entry_type==='mythical_creature'?txt('أسطورة','MYTH'):txt('تاريخ','HISTORY')));if(b.dataset.entry===arrivalEntry){b.classList.add('arrival');b.scrollIntoView({block:'nearest',behavior:'auto'})}}
 const missing=Math.min(4,Math.max(0,members.length-unlocked.length));for(let i=0;i<missing;i++){const p=makeText('div','◇','empty-frame');p.setAttribute('aria-label',txt('إطار لاكتشاف قادم','A frame for a future discovery'));$('#museumGrid').append(p)}
 if(!members.length)$('#museumGrid').append(makeText('p',txt('لا توجد بطاقات من هذا النوع ضمن محتوى هذه الحضارة الحالي.','No cards of this type in this collection yet.'),'room-no-cards'));arrivalEntry=null;
}
function enrichDiscovery(entry,completed){
 applyFrame();const c=$('#cardBody');const story=makeText('blockquote',entry['impact_'+lang]||entry.impact_ar,'legacy-story');const label=makeText('small',entry.entry_type==='mythical_creature'?txt('أثرها في الخيال والثقافة','ITS PLACE IN CULTURE'):txt('الأثر الذي بقي','THE LEGACY THAT REMAINS'));story.prepend(label);c.querySelector('#cardTitle').after(story);
 if(completed&&dailySession){$('.discovery-badge').textContent=txt('✓ اكتملت أحجية اليوم','✓ Daily puzzle complete');$('#nextLevel').textContent=txt('العودة إلى الرحلة','Back to the journey');$('#nextLevel').dataset.advance='0'}
 const quiz=document.createElement('details');quiz.className='discovery-quiz';quiz.append(makeText('summary',txt('اختبر ذاكرتك · اختياري','Test your memory · optional')));
 quiz.append(makeText('p',entry.entry_type==='mythical_creature'?txt('بأي حضارة تربط هذه البطاقة المخلوق الأسطوري؟','Which civilization does this card associate with the mythical creature?'):txt('إلى أي حضارة تنتمي هذه البطاقة؟','Which civilization does this card belong to?')));
 const key='card_civilization_'+lang,correct=entry[key]||entry.card_civilization_ar,answers=[correct];for(const other of data){const value=other[key]||other.card_civilization_ar;if(value&&!answers.includes(value))answers.push(value);if(answers.length===3)break}answers.sort((a,b)=>a.localeCompare(b,lang));
 const result=makeText('p','','quiz-result');result.setAttribute('role','status');for(const value of answers){const button=makeText('button',value);button.onclick=()=>{const yes=value===correct;button.setAttribute('aria-pressed',String(yes));result.textContent=yes?txt('صحيح! هذه معلومة من البطاقة التي اكتشفتها.','Correct! This comes from your discovery card.'):txt('حاول مرة أخرى، أو راجع خانة الحضارة في البطاقة.','Try again, or check the civilization field on the card.');if(yes)quiz.querySelectorAll('button').forEach(b=>b.disabled=true)};quiz.append(button)}quiz.append(result);c.append(quiz);
}
