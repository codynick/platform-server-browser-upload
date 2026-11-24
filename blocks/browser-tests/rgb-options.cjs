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



 const types=['cn_rgb_led_code','cn_rgb_led_xy_code','cn_rgb_led_percent'];
 await page.evaluate(()=>{
  const ws=codyWorkspace,original=ws.updateToolbox;ws.updateToolbox=function(toolbox){window.hardwarePalette=toolbox;return original.call(this,toolbox)};
  document.getElementById('hardwareToolboxTab').click();ws.updateToolbox=original;
 });
 for(const type of types){
  const args=await page.evaluate(type=>HARDWARE_SPECS.find(s=>s.type===type).args.map(a=>a.name),type);
  for(const name of args){
   const points=await page.evaluate(async({type,name})=>{
    const B=Blockly,ws=codyWorkspace;ws.clear();
    const state=window.hardwarePalette.contents.find(c=>c.name==='RGB LED').contents.find(s=>s.type===type);
    const parent=B.serialization.blocks.append(state,ws);parent.moveBy(100,80);window.testParent=parent;
    window.typedField=parent.getInputTargetBlock(name).getField('NUM');
    await new Promise(r=>setTimeout(r,120));const r=window.typedField.getSvgRoot().getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};
   },{type,name});
   await page.mouse.dblclick(points.x,points.y);await page.locator('input.blocklyHtmlInput').fill(name==='red'?'50':'1');await page.keyboard.press('Enter');
   if(await page.evaluate(()=>window.typedField.getValue())!==(name==='red'?50:1))throw Error('Typed number failed '+type+'.'+name);
   const move=await page.evaluate(async()=>{
    const ws=codyWorkspace,v=ws.getVariableMap().createVariable('value'),getter=ws.newBlock('variables_get');getter.setFieldValue(v.getId(),'VAR');getter.initSvg();getter.render();getter.moveBy(600,240);window.testGetter=getter;
    await new Promise(r=>setTimeout(r,120));
    const screen=c=>new DOMPoint(c.x,c.y).matrixTransform(ws.getCanvas().getScreenCTM());
    const from=screen(getter.outputConnection);return{x:from.x+35*ws.scale,y:from.y};
   });
   const target=await page.evaluate(name=>{const p=new DOMPoint(testParent.getInput(name).connection.x,testParent.getInput(name).connection.y).matrixTransform(codyWorkspace.getCanvas().getScreenCTM());return{x:p.x+35*codyWorkspace.scale,y:p.y}},name);
   await page.mouse.move(move.x,move.y);await page.mouse.down();await page.mouse.move(move.x+12,move.y,{steps:5});await page.mouse.move(target.x,target.y,{steps:25});await page.mouse.up();
   if(!await page.evaluate(name=>testParent.getInputTargetBlock(name)===testGetter,name))throw Error('Variable drop failed '+type+'.'+name);
   console.log('PASS: direct number and variable mouse drop '+type+'.'+name);
  }
  const targets=await page.evaluate(()=>testParent.getField('TARGET').getOptions().map(o=>o[1]));
  if(JSON.stringify(targets)!==JSON.stringify(['HARDWARE','SIMULATION']))throw Error('Target options missing '+type);
 }
 const color=await page.evaluate(async()=>{
  const B=Blockly,ws=codyWorkspace;ws.clear();const state=window.hardwarePalette.contents.find(c=>c.name==='RGB LED').contents.find(s=>s.type==='cn_rgb_led_percent');
  const b=B.serialization.blocks.append(state,ws);b.moveBy(100,100);b.setFieldValue('SIMULATION','TARGET');
  for(const [name,value] of [['led',7],['red',20],['green',40],['blue',60]])b.getInputTargetBlock(name).setFieldValue(value,'NUM');
  const rt=new BlockRuntime(new LiveRouter(new CjpHardware(CJP),CodyLiveStore),HARDWARE_SPECS);rt.controller=new AbortController();rt.signal=rt.controller.signal;await rt.gadget(b);return CodyLiveStore.read().leds[7];
 });
 if(color!=='#336699')throw Error('Actual browser simulation color mismatch '+color);
 const frame=page.frames().find(f=>f.url().includes('/simulator/'));
 await frame.waitForFunction(()=>document.querySelector('[data-led="7"]')?.style.backgroundColor==='rgb(51, 102, 153)');
 console.log('PASS: all three HW/SIM selectors; percentage program updates the real simulator LED');
 if(process.env.CODYNICK_SCREENSHOT)await page.screenshot({path:process.env.CODYNICK_SCREENSHOT});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
