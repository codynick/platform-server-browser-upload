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




 const saved=await page.evaluate(()=>{
  const B=Blockly,ws=codyWorkspace;ws.clear();
  const a={type:'cn_rgb_led_percent',inputs:{led:{shadow:{type:'math_number',fields:{NUM:3}}},red:{shadow:{type:'math_number',fields:{NUM:100}}},green:{shadow:{type:'math_number',fields:{NUM:50}}},blue:{shadow:{type:'math_number',fields:{NUM:0}}}}};
  const print={type:'text_print',inputs:{TEXT:{block:{type:'text',fields:{TEXT:'test'}}}}};
  const assignment={type:'variables_set',fields:{VAR:{name:'answer'}},inputs:{VALUE:{shadow:{type:'cn_scalar_value',fields:{VALUE:'hello'}}}},next:{block:print}};
  a.next={block:assignment};
  B.serialization.workspaces.load({blocks:{blocks:[{type:'cn_event_start',x:60,y:70,inputs:{DO:{block:{type:'controls_repeat_ext',inputs:{TIMES:{shadow:{type:'math_number',fields:{NUM:2}}},DO:{block:a}}}}}}]}},ws);
  window.exampleRgb=ws.getAllBlocks(false).find(b=>b.type==='cn_rgb_led_percent');
  for(const block of ws.getAllBlocks(false)){
   block.initSvg();block.initSvg();
   const icons=block.inputList.flatMap(i=>i.fieldRow).filter(f=>f.name==='__codyNickBlockIcon');
   if(block.isShadow()||block.outputConnection){if(icons.length)throw Error('Inline value was branded: '+block.type)}
   else if(icons.length!==1)throw Error('Expected one main block icon: '+block.type+' '+icons.length);
  }
  const data=B.serialization.workspaces.save(ws);if(JSON.stringify(data).includes('__codyNickBlockIcon'))throw Error('Visual icon leaked into project data');
  return data;
 });
 await page.waitForTimeout(200);
 const bounds=await page.evaluate(()=>{const b=exampleRgb,icon=b.getField('__codyNickBlockIcon').getSvgRoot().getBoundingClientRect(),rect=b.getSvgRoot().getBoundingClientRect();return {icon:{x:icon.x,width:icon.width},block:{x:rect.x,width:rect.width}}});
 if(bounds.icon.x<bounds.block.x||bounds.icon.x>bounds.block.x+40)throw Error('Icon not at left edge');
 console.log('PASS: statement/event headers have one left icon; inline values stay plain; repeated rendering and project data remain clean');
 await page.evaluate(()=>{
  const ws=codyWorkspace,original=ws.updateToolbox;ws.updateToolbox=function(t){window.palette=t;return original.call(this,t)};document.getElementById('hardwareToolboxTab').click();ws.updateToolbox=original;
  const category=ws.getToolbox().getToolboxItems().find(c=>c.getName()==='RGB LED');ws.getToolbox().setSelectedItem(category);
 });
 await page.waitForTimeout(200);
 const flyout=await page.evaluate(()=>codyWorkspace.getFlyout().getWorkspace().getAllBlocks(false).filter(b=>!b.outputConnection&&!b.isShadow()).every(b=>!!b.getField('__codyNickBlockIcon')));
 if(!flyout)throw Error('Toolbox icon missing');
 console.log('PASS: toolbox blocks have the same icon treatment');
 const viewer=await page.context().newPage();await viewer.goto('https://rgb.test/sharing/',{waitUntil:'domcontentloaded'});await viewer.waitForFunction(()=>window.CodyEditorInputs&&window.Blockly.BlockSvg.prototype.codyNickBrandingInstalled_);
 const branded=await viewer.evaluate(saved=>{const B=Blockly,ws=B.inject('blockCode',{readOnly:true,renderer:'zelos',media:'/blocks/vendor/blockly/media/'});B.serialization.workspaces.load(saved,ws);return ws.getAllBlocks(false).filter(b=>!b.outputConnection&&!b.isShadow()).every(b=>!!b.getField('__codyNickBlockIcon'));},saved);
 if(!branded)throw Error('Shared viewer branding missing');await viewer.close();
 console.log('PASS: shared read-only viewer renders branded headers');
 await page.evaluate(()=>{codyWorkspace.getToolbox().clearSelection();codyWorkspace.clear();const inputs=Object.fromEntries(HARDWARE_SPECS.find(s=>s.type==='cn_rgb_led_percent').args.map(a=>[a.name,{shadow:{type:'math_number',fields:{NUM:Number(a.default)}}}]));window.exampleRgb=Blockly.serialization.blocks.append({type:'cn_rgb_led_percent',inputs},codyWorkspace);exampleRgb.moveBy(65,95);});
 await page.locator('#toggleSpaces').click();await page.waitForTimeout(250);
 const clip=await page.evaluate(()=>{const r=exampleRgb.getSvgRoot().getBoundingClientRect();return{x:Math.max(0,r.x-6),y:Math.max(0,r.y-6),width:r.width+12,height:r.height+12}});
 if(process.env.CODYNICK_SCREENSHOT)await page.screenshot({path:process.env.CODYNICK_SCREENSHOT,clip});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
