import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),engine=process.env.TEST_ENGINE||'chromium';
await mkdir(resolve(root,'artifacts',engine,'preview'),{recursive:true});
const suites=['earth_legacy','puzzle_assistance','locked_pieces','experience','chronicle'];
const results=await Promise.all(suites.map(name=>new Promise(resolveRun=>{
 const child=spawn(process.execPath,[`tests/regression/test_${name}.cjs`],{cwd:root,stdio:'inherit'});
 child.on('error',()=>resolveRun(1));child.on('exit',code=>resolveRun(code??1));
})));
if(results.some(code=>code!==0))process.exitCode=1;
