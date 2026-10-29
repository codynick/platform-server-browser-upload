const {chromium}=require('playwright');const assert=require('assert/strict');let browser;
(async()=>{
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});const page=await browser.newPage();let accept=true;page.on('dialog',d=>accept?d.accept():d.dismiss());
 await page.goto((process.env.PILOT_URL||'http://127.0.0.1:8767/blocks/'));await page.waitForFunction(()=>!!window.CodyPythonPilot);
 const load=async name=>{await page.locator('#headerExamples').click();await page.selectOption('#example',name);const title=await page.locator('#example option:checked').textContent();await page.locator('#loadExample').click();await page.waitForFunction(()=>!document.getElementById('examplesDialog').open);return title;};
 assert.equal(await load('blink'),await page.locator('#designName').inputValue());
 const blockTitle=await page.locator('#designName').inputValue();accept=false;await load('temperature');assert.equal(await page.locator('#designName').inputValue(),blockTitle);accept=true;await page.locator('#closeExamples').click();
 await page.locator('#pythonEditorTab').click();assert.equal(await page.locator('#designName').inputValue(),'');const pythonTitle=await load('sim-dashboard');assert.equal(await page.locator('#designName').inputValue(),pythonTitle);
 await page.locator('#blocksEditorTab').click();assert.equal(await page.locator('#designName').inputValue(),blockTitle);await page.locator('#pythonEditorTab').click();assert.equal(await page.locator('#designName').inputValue(),pythonTitle);
 await page.locator('#pythonSource').fill('print("keep me")');accept=false;await load('mixed');assert.equal(await page.locator('#designName').inputValue(),pythonTitle);assert.equal(await page.locator('#pythonSource').inputValue(),'print("keep me")');accept=true;await page.locator('#closeExamples').click();
 console.log('PASS: Blocks/Python example titles, independent names across switches and cancelled replacements');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
