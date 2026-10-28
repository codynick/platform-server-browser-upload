const {chromium}=require('playwright');
const assert=require('assert/strict');let browser;
(async()=>{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('codynick-active-account','__guest__'));await page.goto((process.env.DASHBOARD_URL||'http://127.0.0.1:8767/dashboard/'));
 await page.evaluate(()=>{
  CodyLiveStore.dashboard('dash_clear',{});
  for(const [name,type] of [['Temperature','gauge'],['Reading','info'],['History','graph']])CodyLiveStore.dashboard('dash_create_'+type,{NAME:name,TITLE:name});
  CodyLiveStore.dashboard('dash_range',{NAME:'Temperature',MIN:0,MAX:50});
  CodyLiveStore.dashboard('dash_set',{NAME:'Temperature',VALUE:25,SOURCE:'Python'});
 });
 await page.waitForFunction(()=>document.querySelector('[data-card-id="Temperature"] [data-role="value"]')?.textContent==='25');
 await page.waitForTimeout(350);
 await page.evaluate(()=>{window.savedGauge=document.querySelector('[data-card-id="Temperature"]');window.savedInfo=document.querySelector('[data-card-id="Reading"]');window.savedGraph=document.querySelector('[data-card-id="History"]');window.observedValues=[];window.zeroFrames=0;window.monitor=setInterval(()=>{const value=document.querySelector('[data-card-id="Temperature"] [data-role="value"]')?.textContent;observedValues.push(value);if(value==='0'||value==='')zeroFrames++;},5);});
 for(const value of [26,27.5,24,28]){
  await page.evaluate(v=>{CodyLiveStore.dashboard('dash_set',{NAME:'Temperature',VALUE:v,SOURCE:'Python'});CodyLiveStore.dashboard('dash_set',{NAME:'Reading',VALUE:v});CodyLiveStore.dashboard('dash_append',{NAME:'History',VALUE:v});},value);
  await page.waitForFunction(v=>document.querySelector('[data-card-id="Temperature"] [data-role="value"]')?.textContent===String(v),value);
  assert(await page.evaluate(()=>savedGauge===document.querySelector('[data-card-id="Temperature"]')),'Gauge was rebuilt during a value update');
  assert(await page.evaluate(()=>savedInfo===document.querySelector('[data-card-id="Reading"]')));assert(await page.evaluate(()=>savedGraph===document.querySelector('[data-card-id="History"]')));
 }
 assert.equal(await page.evaluate(()=>{clearInterval(monitor);return zeroFrames}),0);
 await page.evaluate(()=>CodyLiveStore.dashboard('dash_range',{NAME:'Temperature',MIN:0,MAX:100}));
 await page.waitForFunction(()=>document.querySelector('[data-card-id="Temperature"] [data-role="max"]')?.textContent==='100');assert(await page.evaluate(()=>savedGauge!==document.querySelector('[data-card-id="Temperature"]')));
 await page.evaluate(()=>CodyLiveStore.dashboard('dash_clear',{}));await page.waitForFunction(()=>!document.querySelector('[data-card-id="Temperature"]'));
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: successive readings preserve gauge/info/graph DOM, no zero/blank reading between updates, range changes and widget removal still render');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
