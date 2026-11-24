let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('playwright-core'));}
const fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
 const context=await browser.newContext({viewport:{width:1500,height:1000}});const page=await context.newPage();
 const base=path.resolve(__dirname,'../..');
 const overlay=base;
 await context.route('**/*',async route=>{
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



 await page.evaluate(()=>{
  const B=window.Blockly,ws=window.codyWorkspace;ws.clear();
  const variable=ws.getVariableMap().createVariable('answer'),set=ws.newBlock('variables_set');set.setFieldValue(variable.getId(),'VAR');set.initSvg();set.render();set.moveBy(100,80);window.scalar=set.getInputTargetBlock('VALUE').getField('VALUE');window.assignment=set;
 });
 for(const [text,expected] of [['42',42],['hello','hello'],['"123"','123'],['-1.25e2',-125]]){
  const point=await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,100));const r=window.scalar.getSvgRoot().getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  await page.mouse.dblclick(point.x,point.y);await page.locator('input.blocklyHtmlInput').fill(text);await page.keyboard.press('Enter');
  const value=await page.evaluate(async()=>{const rt=new BlockRuntime({wait:async()=>{}},HARDWARE_SPECS);rt.controller=new AbortController();rt.signal=rt.controller.signal;await rt.chain(window.assignment);return rt.vars.get(window.assignment.getFieldValue('VAR'));});
  if(value!==expected)throw Error('Scalar mismatch '+text+': '+JSON.stringify(value));
 }
 console.log('PASS: directly typed numbers, text, quoted numeric text and exponent values execute with correct types');
 await page.evaluate(()=>{window.scalarProject=Blockly.serialization.workspaces.save(codyWorkspace);});
 const variableDrop=await page.evaluate(async()=>{
  const B=Blockly,ws=codyWorkspace,v=ws.getVariableMap().createVariable('sourceValue');
  const getter=ws.newBlock('variables_get');getter.setFieldValue(v.getId(),'VAR');getter.initSvg();getter.render();getter.moveBy(520,220);window.valueGetter=getter;
  await new Promise(r=>setTimeout(r,150));
  const screen=c=>new DOMPoint(c.x,c.y).matrixTransform(ws.getCanvas().getScreenCTM());
  const from=screen(getter.outputConnection),to=screen(assignment.getInput('VALUE').connection);
  return {from:{x:from.x+35*ws.scale,y:from.y},to:{x:to.x+35*ws.scale,y:to.y}};
 });
 await page.mouse.move(variableDrop.from.x,variableDrop.from.y);await page.mouse.down();await page.mouse.move(variableDrop.from.x+12,variableDrop.from.y,{steps:5});await page.mouse.move(variableDrop.to.x,variableDrop.to.y,{steps:25});await page.mouse.up();
 if(!await page.evaluate(()=>assignment.getInputTargetBlock('VALUE')===valueGetter))throw Error('Variable did not replace assignment value box');
 const assigned=await page.evaluate(async()=>{const rt=new BlockRuntime({wait:async()=>{}},HARDWARE_SPECS);rt.controller=new AbortController();rt.signal=rt.controller.signal;rt.vars.set(valueGetter.getFieldValue('VAR'),'copied text');await rt.chain(assignment);return rt.vars.get(assignment.getFieldValue('VAR'));});
 if(assigned!=='copied text')throw Error('Assigned variable lost value/type');
 await page.evaluate(()=>{const saved=Blockly.serialization.workspaces.save(codyWorkspace);window.CodyAccountEditor.load(saved);});
 console.log('PASS: variable replaces the typed box, executes unchanged and survives project validation/roundtrip');
 await page.evaluate(()=>{
  const B=window.Blockly,ws=window.codyWorkspace;ws.clear();
  const text=t=>({type:'text_print',inputs:{TEXT:{block:{type:'text',fields:{TEXT:t}}}}});
  const c={type:'cn_wait',inputs:{SECONDS:{block:{type:'math_number',fields:{NUM:1}}}}};
  const b={type:'controls_if',inputs:{DO0:{block:text('inside B')}},next:{block:c}};
  const a={...text('A'),next:{block:b}};
  const repeat={type:'controls_repeat_ext',inputs:{TIMES:{block:{type:'math_number',fields:{NUM:2}}},DO:{block:a}},next:{block:text('outside mouth D')}};
  B.serialization.workspaces.load({blocks:{blocks:[{type:'cn_event_start',x:80,y:70,inputs:{DO:{block:repeat}}}]}},ws);
  window.originalRoot=ws.getTopBlocks()[0];window.originalB=ws.getAllBlocks(false).find(b=>b.type==='controls_if');
  window.originalSnapshot=JSON.stringify(B.serialization.blocks.save(window.originalRoot,{addCoordinates:true,saveIds:true}));
  window.originalCount=ws.getAllBlocks(false).length;window.expectedCopy=window.originalB.getDescendants(false).map(b=>b.type).sort();
  window.originalIds=ws.getAllBlocks(false).map(b=>b.id);
 });
 async function duplicateSource(){
  const point=await page.evaluate(async()=>{await new Promise(r=>setTimeout(r,150));const r=window.originalB.getSvgRoot().getBoundingClientRect();return {x:r.x+16,y:r.y+12}});
  await page.mouse.click(point.x,point.y,{button:'right'});
  await page.getByRole('menuitem',{name:/^Duplicate\b/}).click();
  await page.waitForFunction(()=>window.CodyEditorInputs.duplicating);
  await page.waitForFunction(()=>window.codyWorkspace.getTopBlocks(false).some(b=>!window.originalIds.includes(b.id)));
 }
 await duplicateSource();
 const copied=await page.evaluate(()=>{window.copy=codyWorkspace.getTopBlocks(false).find(b=>!window.originalIds.includes(b.id));return {types:window.copy.getDescendants(false).map(b=>b.type).sort(),expected:window.expectedCopy};});
 if(JSON.stringify(copied.types)!==JSON.stringify(copied.expected))throw Error('Wrong duplicate descendants '+JSON.stringify(copied));
 await page.mouse.move(630,620,{steps:20});
 const first=await page.evaluate(()=>({...window.copy.getRelativeToSurfaceXY()}));
 await page.mouse.move(680,690,{steps:15});
 const second=await page.evaluate(()=>({...window.copy.getRelativeToSurfaceXY()}));
 if(first.x===second.x&&first.y===second.y)throw Error('Duplicate did not follow mouse');
 if(!await page.evaluate(()=>CodyEditorInputs.duplicating))throw Error('Duplicate placed before click');
 await page.mouse.click(680,690);await page.waitForFunction(()=>!CodyEditorInputs.duplicating);
 const result=await page.evaluate(()=>({same:window.originalSnapshot===JSON.stringify(Blockly.serialization.blocks.save(window.originalRoot,{addCoordinates:true,saveIds:true})),count:codyWorkspace.getAllBlocks(false).length,expected:window.originalCount+window.expectedCopy.length,chain:!!window.copy.getNextBlock()}));
 if(!result.same||result.count!==result.expected||!result.chain)throw Error('Placed duplicate changed source or lost chain '+JSON.stringify(result));
 console.log('PASS: right-click duplicates B and following C plus nested contents, excludes parent/A/outside D, follows pointer and places on click');
 await page.waitForTimeout(150);
 await page.evaluate(()=>codyWorkspace.undo(false));
 await page.waitForFunction(()=>codyWorkspace.getAllBlocks(false).length===window.originalCount);
 await page.evaluate(()=>codyWorkspace.undo(true));
 await page.waitForFunction(()=>codyWorkspace.getAllBlocks(false).length===window.originalCount+window.expectedCopy.length);
 console.log('PASS: duplicate placement is one undo/redo operation');
 const before=await page.evaluate(()=>codyWorkspace.getAllBlocks(false).length);
 await duplicateSource();await page.keyboard.press('Escape');await page.waitForFunction(()=>!CodyEditorInputs.duplicating);
 if(await page.evaluate(()=>codyWorkspace.getAllBlocks(false).length)!==before)throw Error('Escape left copied blocks behind');
 if(!await page.evaluate(()=>window.originalSnapshot===JSON.stringify(Blockly.serialization.blocks.save(window.originalRoot,{addCoordinates:true,saveIds:true}))))throw Error('Escape changed original');
 console.log('PASS: Escape removes the floating copy and preserves source');
 await page.waitForTimeout(100);await page.evaluate(()=>codyWorkspace.undo(false));
 await page.waitForFunction(()=>codyWorkspace.getAllBlocks(false).length===window.originalCount);
 console.log('PASS: cancellation adds no undo step');
 await page.evaluate(()=>{
  const ws=codyWorkspace;window.destination=ws.newBlock('cn_event_start');destination.initSvg();destination.render();destination.moveBy(430,430);
  window.originalIds=ws.getAllBlocks(false).map(b=>b.id);
 });
 await duplicateSource();
 await page.waitForTimeout(150);
 const drop=await page.evaluate(()=>{
  window.copy=codyWorkspace.getTopBlocks(false).find(b=>!window.originalIds.includes(b.id));
  const toScreen=c=>new DOMPoint(c.x,c.y).matrixTransform(codyWorkspace.getCanvas().getScreenCTM());
  const from=toScreen(window.copy.previousConnection),to=toScreen(destination.getInput('DO').connection);
  // The floating block's origin sits 12 px to the right/below the pointer.
  const origin=toScreen(window.copy.getRelativeToSurfaceXY());
  return {x:origin.x-12+to.x-from.x,y:origin.y-12+to.y-from.y};
 });
 await page.mouse.move(drop.x,drop.y,{steps:25});await page.waitForTimeout(150);await page.mouse.click(drop.x,drop.y);
 await page.waitForFunction(()=>!CodyEditorInputs.duplicating);
 if(!await page.evaluate(()=>destination.getInputTargetBlock('DO')===window.copy&&!!window.copy.getNextBlock()))throw Error('Duplicate did not connect into destination mouth');
 console.log('PASS: floating chain snaps into another statement mouth on placement');
 await page.waitForTimeout(150);await page.evaluate(()=>codyWorkspace.undo(false));
 await page.waitForFunction(()=>!destination.getInputTargetBlock('DO'));
 await page.evaluate(()=>codyWorkspace.undo(true));
 await page.waitForFunction(()=>!!destination.getInputTargetBlock('DO')?.getNextBlock());
 console.log('PASS: connected chain undo/redo restores the mouth connection');
 const saved=await page.evaluate(()=>window.scalarProject);
 const readonly=await page.context().newPage();await readonly.goto('https://rgb.test/sharing/',{waitUntil:'domcontentloaded'});
 await readonly.waitForFunction(()=>window.CodyEditorInputs&&window.Blockly.Blocks.cn_scalar_value);
 const visible=await readonly.evaluate(saved=>{const B=window.Blockly,ws=B.inject('blockCode',{readOnly:true,renderer:'zelos',media:'/blocks/vendor/blockly/media/'});B.serialization.workspaces.load(saved,ws);return ws.getAllBlocks(false).some(b=>b.type==='cn_scalar_value')&&window.BlockRuntime.types.includes('cn_scalar_value');},saved);
 if(!visible)throw Error('Shared viewer could not load typed value block');await readonly.close();
 console.log('PASS: read-only shared viewer supports the new value block');
 if(process.env.CODYNICK_SCREENSHOT)await page.screenshot({path:process.env.CODYNICK_SCREENSHOT});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
