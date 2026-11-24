let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('playwright-core'));}
const fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}});
 const base=path.resolve(__dirname,'../..');
 const overlay=base;
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='https://rgb.test')return route.abort();
  if(url.pathname==='/api/me')return route.fulfill({json:{user:null,csrf:null,access:null}});
  const relative=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
  let file=path.join(overlay,relative);if(!fs.existsSync(file))file=path.join(base,relative);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
  return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
 await page.goto('https://rgb.test/blocks/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.codyWorkspace,{timeout:30000});
 await page.waitForTimeout(1200);


 const point=await page.evaluate(async()=>{
  const ws=window.codyWorkspace;ws.clear();
  window.Blockly.serialization.workspaces.load({blocks:{blocks:[{type:'cn_seven_segment_display_value',x:100,y:90}]}},ws);
  const parent=ws.getAllBlocks(false).find(b=>b.type==='cn_seven_segment_display_value');
  window.textBlock=parent;window.typedField=parent.getInputTargetBlock('value').getField('TEXT');
  await new Promise(resolve=>setTimeout(resolve,150));
  const r=window.typedField.getSvgRoot().getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
 });
 await page.mouse.dblclick(point.x,point.y);
 await page.locator('input.blocklyHtmlInput').fill('feed');await page.keyboard.press('Enter');
 if(await page.evaluate(()=>window.typedField.getValue())!=='feed')throw Error('Text typing failed');
 console.log('PASS: directly type feed into the show text block');
 const points=await page.evaluate(async()=>{
  const B=window.Blockly,ws=window.codyWorkspace;
  const variable=ws.getVariableMap().createVariable('message'),getter=ws.newBlock('variables_get');
  getter.setFieldValue(variable.getId(),'VAR');getter.initSvg();getter.render();getter.moveBy(570,240);window.testGetter=getter;
  await new Promise(resolve=>setTimeout(resolve,150));
  const toScreen=c=>new DOMPoint(c.x,c.y).matrixTransform(ws.getCanvas().getScreenCTM());
  const from=toScreen(getter.outputConnection),to=toScreen(window.textBlock.getInput('value').connection);
  return {from:{x:from.x+35*ws.scale,y:from.y},to:{x:to.x+35*ws.scale,y:to.y}};
 });
 await page.mouse.move(points.from.x,points.from.y);await page.mouse.down();
 await page.mouse.move(points.from.x+12,points.from.y+4,{steps:5});await page.mouse.move(points.to.x,points.to.y,{steps:30});await page.waitForTimeout(150);await page.mouse.up();
 if(!await page.evaluate(()=>window.textBlock.getInputTargetBlock('value')===window.testGetter))throw Error('String variable drop failed');
 console.log('PASS: mouse drop of a variable onto the text box');
 await page.evaluate(async()=>{
  const scene=CodyLiveStore.read().scene;scene.gadgets.seven={x:50,y:50};CodyLiveStore.simCommand({action:'scene',scene});
  const runtime=new BlockRuntime(new LiveRouter(new CjpHardware(window.CJP),CodyLiveStore),window.HARDWARE_SPECS);
  runtime.controller=new AbortController();runtime.signal=runtime.controller.signal;
  runtime.vars.set(window.testGetter.getFieldValue('VAR'),'feed');window.textBlock.setFieldValue('SIMULATION','TARGET');
  await runtime.gadget(window.textBlock);
 });
 const simulator=page.frames().find(f=>f.url().includes('/simulator/'));
 await simulator.waitForFunction(()=>document.getElementById('displayValue')?.textContent==='feed');
 const glyphs=await simulator.evaluate(()=>[...document.getElementById('sevenDigits').children].map(d=>[...d.children].filter(s=>s.classList.contains('on')).map(s=>s.classList[1]).join('')));
 if(JSON.stringify(glyphs)!==JSON.stringify(['aefg','adefg','adefg','bcdeg']))throw Error('Incorrect feed glyphs: '+JSON.stringify(glyphs));
 console.log('PASS: simulator displays the F E E d segment patterns from the original library');
 if(process.env.CODYNICK_SCREENSHOT)await page.screenshot({path:process.env.CODYNICK_SCREENSHOT});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
