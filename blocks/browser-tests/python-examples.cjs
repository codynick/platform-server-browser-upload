const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');let browser;
const artifacts=process.env.PILOT_ARTIFACTS||path.resolve('test-output/python-pilot');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});const page=await browser.newPage({viewport:{width:1400,height:950}});page.setDefaultTimeout(180000);const errors=[],alerts=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{alerts.push(d.message());await d.accept();});
 await page.goto((process.env.PILOT_URL||'http://127.0.0.1:8767/blocks/')+'?python=1');await page.locator('#pythonEditorTab').click();await page.waitForFunction(()=>document.querySelector('#example option[value="hello"]'));
 await page.evaluate(()=>{
  window.testFrames=[];
  window.CJP={connected:true,occupied:false,controls(){},log(){},fault(){},preview(){},raw:async s=>testFrames.push(s),send:async s=>{
   testFrames.push(s);let reply;
   if(s.startsWith('CN@@TEMP@@'))reply='CN@@TEMP@@25.0______';
   if(s.startsWith('CN@@JOY@@05'))reply='CN@@JOY@@05C_______';
   if(reply)setTimeout(()=>window.dispatchEvent(new CustomEvent('cjp-line',{detail:reply})),10);
  }};
 });
 for(const name of ['hello','sim-dashboard','mixed','cross-displays','blink','temperature','joystick']){
  await page.locator('#headerExamples').click();await page.selectOption('#example',name);await page.locator('#loadExample').click();await page.waitForFunction(()=>!document.getElementById('examplesDialog').open);
  const source=(await page.locator('#pythonSource').inputValue()).replace('while True:','for _ in range(2):');await page.locator('#pythonSource').fill(source);await page.locator('#blockRunBtn').click();
  await page.waitForFunction(()=>!window.CodyPythonPilot.running,null,{timeout:180000});const status=await page.locator('#pythonStatusBar').textContent();assert.equal(status,'Python program finished.',name+': '+status);console.log('PASS: example '+name+' executes in real browser Python'+(name==='hello'||name==='sim-dashboard'?'':' (serial hardware simulated for this test)'));
 }
 const frames=await page.evaluate(()=>testFrames);assert(frames.some(s=>s.startsWith('CN@@TEMP@@')));assert(frames.some(s=>s.startsWith('CN@@7SEG@@')));assert(frames.some(s=>s.startsWith('CN@@JOY@@05')));assert(frames.some(s=>s.startsWith('CN@@RGB@@')));
 await page.locator('#pythonSource').fill('print("File round trip")\n');const downloadPromise=page.waitForEvent('download');await page.locator('#projectMenu').evaluate(e=>e.open=true);await page.locator('#exportPythonSource').click();const download=await downloadPromise;assert(download.suggestedFilename().endsWith('.py'));assert.equal(fs.readFileSync(await download.path(),'utf8'),'print("File round trip")\n');
 await page.locator('#pythonFile').setInputFiles({name:'test.py',mimeType:'text/x-python',buffer:Buffer.from('print("Opened file")\n')});assert.equal(await page.locator('#pythonSource').inputValue(),'print("Opened file")\n');console.log('PASS: .py file download and open preserve source');
 await page.locator('#headerExamples').click();await page.selectOption('#example','sim-dashboard');await page.locator('#loadExample').click();await page.waitForFunction(()=>!document.getElementById('examplesDialog').open);await page.locator('#show-dashboard').click();
 await page.screenshot({path:path.join(artifacts,'python-desktop.png'),fullPage:true});
 await page.setViewportSize({width:412,height:915});await page.locator('#pythonOutput').scrollIntoViewIfNeeded();
 assert(await page.locator('#pythonOutput').isVisible());assert(await page.locator('#pythonSource').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#pythonEditorTab').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,'python-mobile-layout.png'),fullPage:true});
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: mobile layout has no horizontal page overflow and Console remains accessible');
} )().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
