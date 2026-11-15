import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../dist'),base='https://earth-legacy.test';
const mime:Record<string,string>={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
async function prepare(page:Page,platform:'android'|'ios',seed:Record<string,string>={},local:Record<string,string>={}) {
 await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)throw Error('Unexpected external request');const p=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!p.startsWith(root+sep))throw Error('Invalid asset path');await route.fulfill({contentType:mime[extname(p)]||'text/plain',body:await readFile(p)});});
 await page.addInitScript(({platform,seed,local})=>{
   const w=window as unknown as Record<string,any>;
   for(const [key,value] of Object.entries(local))localStorage.setItem(key,value);
   w.nativeTest={store:{...seed},events:{},writes:[],opened:[],exits:0};
   if(platform==='android')w.androidBridge={};else w.webkit={messageHandlers:{bridge:{}}};
   w.Capacitor={
     PluginHeaders:[{name:'Preferences',methods:[{name:'get',rtype:'promise'},{name:'set',rtype:'promise'}]},{name:'App',methods:[{name:'addListener',rtype:'callback'},{name:'exitApp',rtype:'promise'}]},{name:'Browser',methods:[{name:'open',rtype:'promise'}]}],
     nativeCallback:(name:string,method:string,options:any,cb:any)=>{w.nativeTest.events[options.eventName]=cb;return 'listener-'+options.eventName},
     nativePromise:async(name:string,method:string,options:any)=>{
       if(name==='Preferences'&&method==='get')return {value:w.nativeTest.store[options.key]??null};
       if(name==='Preferences'&&method==='set'){await new Promise(resolve=>setTimeout(resolve,8));w.nativeTest.store[options.key]=options.value;w.nativeTest.writes.push([options.key,options.value]);return;}
       if(name==='App'&&method==='exitApp'){w.nativeTest.exits++;return;}
       if(name==='Browser'&&method==='open'){w.nativeTest.opened.push(options.url);return;}
       throw Error('Unexpected native call');
     }
   };
 },{platform,seed,local});
 await page.goto(base);await page.waitForFunction('typeof contentReady!=="undefined"&&contentReady&&!!window.nativeTest.events.appStateChange');
 await page.evaluate('finishSplash();chooseLanguage("ar")');
}
test('iOS restores the native backup before the game reads progress',async({page})=>{
 const progress=JSON.stringify({_museum:['akbar'],_frame:'bronze'});
 await prepare(page,'ios',{'erth-progress-v1':progress});
 await expect(page.locator('#personName')).toHaveText('المستوى 2');
 expect(await page.evaluate('done(data[0])')).toBe(true);
 expect(await page.evaluate('window.nativeTest.events.backButton===undefined')).toBe(true);
 await page.evaluate(()=>{window.EarthStorage.set('erth-progress-v1','first');window.EarthStorage.set('erth-progress-v1','second');window.EarthStorage.set('erth-progress-v1',JSON.stringify({_museum:[]}));});
 await page.evaluate('window.EarthStorage.flush()');
 expect(await page.evaluate('window.nativeTest.store["erth-progress-v1"]')).toBe('{"_museum":[]}');
 expect(await page.evaluate('window.nativeTest.writes.filter(x=>x[0]==="erth-progress-v1").slice(-3).map(x=>x[1])')).toEqual(['first','second','{"_museum":[]}']);
});
test('Android retains legacy local progress and hardware Back respects the game',async({page})=>{
 await prepare(page,'android',{'erth-progress-v1':JSON.stringify({_museum:[]})},{'erth-progress-v1':JSON.stringify({_museum:['akbar','augustus']})});
 await expect(page.locator('#personName')).toHaveText('المستوى 3');await page.evaluate('window.EarthStorage.flush()');
 expect(JSON.parse(await page.evaluate('window.nativeTest.store["erth-progress-v1"]'))._museum).toEqual(['akbar','augustus']);
 await page.evaluate('museum();window.nativeTest.events.backButton()');expect(await page.evaluate('activeScreen')).toBe('map');
 expect(await page.evaluate('window.nativeTest.exits')).toBe(0);await page.evaluate('window.nativeTest.events.backButton()');expect(await page.evaluate('window.nativeTest.exits')).toBe(1);
});
test('native pause saves the board and source links open outside the game',async({page})=>{
 await prepare(page,'ios',{'erth-progress-v1':JSON.stringify({_museum:['akbar']})});
 await page.evaluate('selected=0;openPuzzle("continue")');await page.waitForFunction('pieces.length===24');
 await page.locator('#placePage').click();await page.evaluate('window.nativeTest.events.appStateChange({isActive:false});window.EarthStorage.flush()');
 expect(JSON.parse(await page.evaluate('window.nativeTest.store["erth-progress-v1"]')).akbar_grid6x4).toHaveLength(6);
 await page.evaluate('leavePuzzle();showCard(data[0])');await page.locator('#cardBody details').first().locator('summary').click();
 const url=await page.locator('.source-link').first().getAttribute('href');await page.locator('.source-link').first().click();
 expect(await page.evaluate('window.nativeTest.opened')).toEqual([url]);expect(page.url()).toBe(base+'/');
});
