import {readFile,access,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../www');
const data=JSON.parse(await readFile(resolve(root,'content.json'),'utf8'));
const civs=JSON.parse(await readFile(resolve(root,'civilizations.json'),'utf8'));
assert.equal(new Set(data.map(r=>r.entry_id)).size,data.length);
assert.equal(data[21].entry_id,'ibn_sina');
for(const [i,r] of data.entries()) {
 assert.equal(r.number,i+1); assert(civs.some(c=>c.civilization_id===r.civilization_id));
 assert(!r.image.includes('..')&&!r.image.startsWith('/'));await access(resolve(root,r.image));
 for(const lang of ['ar','en']) for(const key of ['name','card_civilization','birth_place','birth_date','period','description','achievements','impact']) assert(r[key+'_'+lang],`${r.entry_id}: ${key}_${lang}`);
 assert(r.sources.includes('https://'));
}
assert.equal((await readdir(resolve(root,'images'))).filter(p=>p.endsWith('.webp')).length,data.length);
console.log(`Verified ${data.length} levels, ${civs.length} collections, bilingual fields and image files.`);
