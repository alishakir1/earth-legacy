'use strict';
let museumView='all',cardCollection=null;
function savedLevelSummary(entry){
 const d=difficultyFor(entry.number),key=entry.entry_id+'_grid'+d.columns+'x'+d.rows,state=saved[key+'_positions'];
 const ids=new Set(),slots=new Set();let correct=0;
 if(state?.version===1&&Array.isArray(state.slots))for(const pair of state.slots){if(!Array.isArray(pair))continue;const [id,slot]=pair;if(Number.isInteger(id)&&Number.isInteger(slot)&&id>=0&&id<d.count&&slot>=0&&slot<d.count&&!ids.has(id)&&!slots.has(slot)){ids.add(id);slots.add(slot);if(id===slot)correct++}}
 else if(Array.isArray(saved[key]))for(const id of saved[key])if(Number.isInteger(id)&&id>=0&&id<d.count)ids.add(id);
 if(!(state?.version===1&&Array.isArray(state.slots)))correct=ids.size;
 return {correct,count:d.count,partial:ids.size>0&&correct<d.count};
}
function enhanceDestination(entry){
 const state=savedLevelSummary(entry),owned=done(entry);
 $('.destination').classList.toggle('is-mystery',!owned);
 $('#destinationState').textContent=state.partial?txt(`تابع من حيث توقفت · ${state.correct} / ${state.count}`,`Pick up where you left off · ${state.correct} / ${state.count}`):owned?txt('اكتشاف محفوظ في متحفك','A discovery in your museum'):txt('حلّ الصورة واكتشف الحكاية','Complete the picture. Discover the story.');
 $('#playButton').textContent=state.partial?txt('تابع','Continue'):txt('العب','Play');
 $('#destinationProgress').classList.toggle('hidden',!state.partial);$('#destinationProgress span').style.width=100*state.correct/state.count+'%';
 const found=data.filter(done),civs=new Set(found.map(r=>r.civilization_id)).size;
 $('#journeyStats').textContent=txt(`${found.length} اكتشافات · ${civs} حضارات`,`${found.length} discoveries · ${civs} civilizations`);renderJourneyExtras();
}
function setMuseumView(value){museumView=value==='owned'?'owned':'all';renderCivilizations();renderMuseumFilters()}
function renderMuseumFilters(){
 $('#allCollections').textContent=txt('كل الحضارات','All civilizations');$('#ownedCollections').textContent=txt('مجموعتي','My collection');
 $('#allCollections').setAttribute('aria-pressed',String(museumView==='all'));$('#ownedCollections').setAttribute('aria-pressed',String(museumView==='owned'));
}
function renderMuseumHighlights(){
 const earned=data.filter(done),recent=[...(saved._museum||[])].reverse().map(id=>data.find(r=>r.entry_id===id&&done(r))).filter(Boolean).slice(0,3);
 $('#recentFinds').classList.toggle('hidden',!recent.length);$('#recentTitle').textContent=txt('آخر اكتشافاتك','Recent discoveries');$('#recentCards').innerHTML='';
 for(const r of recent){const b=document.createElement('button'),im=document.createElement('img'),name=document.createElement('span');im.src=r.image;im.alt='';name.textContent=title(r);b.append(im,name);b.dataset.entry=r.entry_id;b.onclick=()=>showCard(r);$('#recentCards').append(b)}
 $('#museumWelcome').classList.toggle('hidden',!!earned.length);$('#museumWelcomeTitle').textContent=txt('أول حكاية تنتظرك','Your first story awaits');$('#museumWelcomeText').textContent=txt('حلّ أول أحجية لتفتح بطاقة شخصية وتبدأ مجموعتك.','Solve your first puzzle to reveal a character and start your collection.');$('#museumJourney').textContent=txt('ابدأ رحلتك','Start your journey');
 renderMuseumFilters();renderWings();
}
function startMuseumJourney(){selected=Math.max(0,unlockedThrough());showMap();selectLevel(selected)}
function enhanceDiscoveryCard(entry,completed){
 const c=$('#cardBody'),badge=document.createElement('div');badge.className='discovery-badge';badge.textContent=completed?txt('✓ اكتشاف جديد في متحفك','✓ A new discovery in your museum'):txt('من مجموعة اكتشافاتك','FROM YOUR COLLECTION');c.prepend(badge);
 const facts=document.createElement('div');facts.className='card-facts';const fields=[...c.querySelectorAll('.card-field')];c.insertBefore(facts,fields[0]);fields.slice(0,4).forEach(p=>facts.append(p));
 const members=data.filter(r=>r.civilization_id===entry.civilization_id),earned=members.filter(done).length,progress=document.createElement('div');progress.className='discovery-progress';
 const label=document.createElement('p');label.textContent=txt(`${earned} من ${members.length} بطاقات هذه الحضارة في متحفك`,`${earned} of ${members.length} cards in this civilization collected`);
 const track=document.createElement('div'),fill=document.createElement('span');track.className='progress-track';fill.style.width=100*earned/members.length+'%';track.append(fill);progress.append(label,track);c.append(progress);
 cardCollection=entry.civilization_id;$('#cardMuseum').textContent=txt('شاهدها في المتحف','View in museum');$('#cardMuseum').classList.toggle('hidden',!completed);
 $('#card').classList.toggle('new-discovery',completed);enrichDiscovery(entry,completed);
}
function visitCardCollection(){if(!cardCollection)return;const id=cardCollection;arrivalEntry=data.find(r=>r.civilization_id===id&&title(r)===$("#cardTitle").textContent)?.entry_id||data[selected]?.entry_id;museumWing="all";closeCard();openCollection(id)}
