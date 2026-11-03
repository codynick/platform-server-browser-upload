const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1450,height:1050},hasTouch:true}),base='http://127.0.0.1:8791';
  await context.addInitScript(()=>localStorage.setItem('codynick-active-account','__guest__'));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.pathname==='/api/me')return route.fulfill({json:{user:null,access:null,csrf:null}});
   if(url.origin!==base)return route.continue();let name=path.join(__dirname,'../..',decodeURIComponent(url.pathname));if(fs.existsSync(name)&&fs.statSync(name).isDirectory())name=path.join(name,'index.html');
   if(!fs.existsSync(name))return route.fulfill({status:404,body:'Missing fixture'});
   const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
   return route.fulfill({contentType:types[path.extname(name)]||'application/octet-stream',body:fs.readFileSync(name)});
  });
  const p=await context.newPage(),errors=[];p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'/simulator/');await p.waitForFunction(()=>window.CodySimulatorView&&window.CodySoilWorld);
  await p.evaluate(()=>{
   CodyLiveStore.update(s=>{
    s.scene.gadgets={cjp:{x:20,y:20},temperature:{x:20,y:400},soil:{x:400,y:500}};
    s.scene.world={assets:[{id:'hot',kind:'hot',temperature:65,x:500,y:60},{id:'cold',kind:'cold',temperature:5,x:800,y:60},{id:'target',kind:'target',width:100,height:140,x:1100,y:100}],probe:{x:300,y:650,temperature:21.1,at:Date.now()}};
    s.scene.garden={enabled:true,at:Date.now(),pots:[{id:'pot',x:700,y:500,type:'loam',water:100,surface:0,overflow:0,drained:0}],cans:[{id:'can',x:1100,y:550}],probe:{x:500,y:900,value:0}};
   });
  });
  await p.waitForSelector('.garden-pot');await p.waitForSelector('.world-target');await p.waitForTimeout(250);
  await p.evaluate(()=>CodySimulatorView.restore({camera:{scale:.65,x:0,y:0},selected:'cjp'}));
  const selectors={target:'.world-target',hot:'[aria-label="Hot water cup"]',cold:'[aria-label="Cold water cup"]',pot:'.garden-pot'};
  const position=async id=>p.evaluate(id=>{const s=CodyLiveStore.read().scene;const a=id==='pot'?s.garden.pots[0]:s.world.assets.find(a=>a.id===id);return {x:a.x,y:a.y};},id);
  const probes=()=>p.evaluate(()=>{const s=CodyLiveStore.read().scene;return [s.world.probe.x,s.world.probe.y,s.garden.probe.x,s.garden.probe.y];});
  async function move(id,fx,fy){
   const before=await position(id),probeBefore=await probes(),box=await p.locator(selectors[id]).boundingBox();
   await p.mouse.move(box.x+box.width*fx,box.y+box.height*fy);await p.mouse.down();await p.mouse.move(box.x+box.width*fx+26,box.y+box.height*fy+13,{steps:5});await p.mouse.up();
   const after=await position(id);assert(Math.abs(after.x-before.x-40)<1,id+' body drag x');assert(Math.abs(after.y-before.y-20)<1,id+' body drag y');assert.deepEqual(await probes(),probeBefore);
  }
  for(const[id,selector]of Object.entries(selectors)){
   assert.equal(await p.locator(selector+' .gadget-header').count(),0);await move(id,.35,.6);await move(id,.7,.8);
  }
  assert.equal(await p.locator('.world-target .asset-caption').count(),0);
  assert.equal(await p.locator('.pot-moisture-bar').isVisible(),true);
  assert.match(await p.locator(selectors.hot+' .asset-caption').textContent(),/65.0°C/);
  // Keyboard movement stays on the asset, while gear buttons retain their own behavior.
  for(const[id,selector]of Object.entries(selectors)){
   const root=p.locator(selector),before=await position(id);await root.focus();await p.keyboard.press('ArrowRight');
   assert.equal((await position(id)).x,before.x+8);
   const gear=root.locator('.asset-gear');await gear.focus();const fixed=await position(id);await p.keyboard.press('ArrowRight');assert.deepEqual(await position(id),fixed);
   await gear.click();await p.waitForSelector('dialog[open]');assert.deepEqual(await position(id),fixed);
   await p.locator('dialog[open] .picker-heading button').click();
  }
  // Real touch events move the target body too.
  const cdp=await context.newCDPSession(p),beforeTouch=await position('target'),b=await p.locator('.world-target').boundingBox();
  const point={x:b.x+b.width/2,y:b.y+b.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+26,y:point.y+13}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert(Math.abs((await position('target')).x-beforeTouch.x-40)<1);
  // Verify drawing and sensing still agree with the pre-upgrade coordinates.
  const geometry=await p.evaluate(()=>{
   const s=CodyLiveStore.read().scene,stage=document.getElementById('stage').getBoundingClientRect(),scale=CodySimulatorView.snapshot().camera.scale;
   const top=node=>(node.getBoundingClientRect().top-stage.top)/scale;
   return {target:top(document.querySelector('.target-body'))-(s.world.assets.find(a=>a.id==='target').y+36),cup:top(document.querySelector('[aria-label="Hot water cup"] svg'))+78-(s.world.assets.find(a=>a.id==='hot').y+114),pot:top(document.querySelector('.garden-pot svg'))+100-CodySoilWorld.surface(s.garden.pots[0]).y};
  });for(const[name,error]of Object.entries(geometry))assert(Math.abs(error)<1,name+' sensing offset '+error);
  await p.evaluate(()=>{CodyLiveStore.update(s=>{const hot=s.scene.world.assets.find(a=>a.id==='hot'),pot=s.scene.garden.pots[0];s.scene.world.probe.x=hot.x+100;s.scene.world.probe.y=hot.y+160;s.scene.garden.probe.x=pot.x+110;s.scene.garden.probe.y=pot.y+180;s.scene.garden.cans[0].x=pot.x+40;s.scene.garden.cans[0].y=pot.y+80;});});
  await p.waitForFunction(()=>document.querySelector('.garden-can').classList.contains('pouring'));
  assert.equal(await p.evaluate(()=>CodyThermalWorld.contact(CodyLiveStore.read().scene.world).id),'hot');
  assert.equal(await p.evaluate(()=>CodySoilWorld.contact(CodyLiveStore.read().scene.garden).id),'pot');
  if(process.env.REVIEW_SHOTS){fs.mkdirSync(process.env.REVIEW_SHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.REVIEW_SHOTS,'body-dragging.png')});}
  // Remove remains available without moving the body first.
  await p.locator('.world-target').hover();await p.locator('.world-target .gadget-remove').click();await p.waitForFunction(()=>!document.querySelector('.world-target'));
  assert.deepEqual(errors,[]);
  console.log('PASS headerless target/pot/cups: multi-point mouse dragging, touch, keyboard, independent controls/probes, retained sensing geometry, automatic watering and remove');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
