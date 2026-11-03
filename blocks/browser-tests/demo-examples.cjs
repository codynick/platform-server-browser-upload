const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1500,height:1050}}),base='http://127.0.0.1:8791';
  await context.addInitScript(()=>localStorage.setItem('codynick-active-account','demo-tester'));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.pathname==='/api/me')return route.fulfill({json:{user:{user_id:'demo-tester',name:'Demo tester'},csrf:'test',access:{role:'admin',unlimited:true,subscribed:true}}});
   if(url.pathname==='/api/run/start'||url.pathname==='/api/run/finish')return route.fulfill({json:{token:null,deadline:null,ready:0,server_time:Date.now()/1000}});
   if(url.origin!==base)return route.continue();let file=path.join(__dirname,'../..',decodeURIComponent(url.pathname));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   if(!fs.existsSync(file))return route.fulfill({status:404,body:'Missing test fixture'});
   const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
   return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  const p=await context.newPage(),errors=[],alerts=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('dialog',async d=>{alerts.push(d.message());await d.accept();});
  await p.goto(base+'/blocks/');await p.waitForFunction(()=>window.CodyAccess?.canEdit()&&document.getElementById('designName').value==='Sensor Test: Soil Moisture'&&!document.getElementById('blockRunBtn').disabled);
  await p.evaluate(()=>{
   window.testHW={temperature:17.9,keys:[],leds:{},display:null,sounds:[],calls:[],cycles:0};
   const check=LiveRouter.prototype.check,call=LiveRouter.prototype.call,wait=LiveRouter.prototype.wait;
   LiveRouter.prototype.check=function(type,a,target){if(target==='HARDWARE')return;return check.call(this,type,a,target);};
   LiveRouter.prototype.call=async function(type,a,signal,target){
    if(target!=='HARDWARE')return call.call(this,type,a,signal,target);signal?.throwIfAborted();testHW.calls.push({type,args:a});
    if(type==='cn_temperature_read')return testHW.temperature;
    if(type==='cn_joystick_position')return testHW.keys.includes(a.pos);
    if(type==='cn_joystick_states')return testHW.keys;
    if(type==='cn_rgb_matrix_set'){testHW.leds[a.led]=a.color;return;}
    if(type==='cn_rgb_matrix_clear'){testHW.leds={};return;}
    if(type.startsWith('cn_seven_segment')){testHW.display=a.value;return;}
    if(type==='cn_sound_play_until_done'){testHW.sounds.push(a);return;}
    throw Error('Unexpected hardware call '+type);
   };
   LiveRouter.prototype.wait=function(ms,signal){if(ms>=10)testHW.cycles++;return wait.call(this,ms,signal);};
  });
  async function load(id){await p.evaluate(id=>CodyProjectFiles.loadExample(id,false),id);}
  async function run(){await p.locator('#blockRunBtn').click();await p.waitForFunction(()=>window.blockProgramRunning);}
  async function stop(){await p.locator('#blockRunBtn').click();await p.waitForFunction(()=>!window.blockProgramRunning);}
  async function settle(){const n=await p.evaluate(()=>testHW.cycles);await p.waitForFunction(n=>testHW.cycles>=n+3,n);}
  await load('demo-temperature-hw-sim');
  await p.evaluate(()=>CodyLiveStore.update(s=>{s.scene.temperature=40;}));await run();
  for(const[value,color]of [[17.9,'#0000FF'],[18,'#00FF00'],[24.9,'#00FF00'],[25,'#FFFF00'],[29.9,'#FFFF00'],[30,'#FF0000']]){
   const simulated=value<25?40:10,simColor=simulated===40?'#FF0000':'#0000FF';
   await p.evaluate(({value,simulated})=>{testHW.temperature=value;CodyLiveStore.update(s=>{s.scene.temperature=simulated;});},{value,simulated});
   await p.waitForFunction(({value,color,simulated,simColor})=>{
    const s=CodyLiveStore.read();return Number(s.seven_segment)===value&&testHW.display===simulated&&[12,13,14,15].every(i=>testHW.leds[i]===color&&s.leds[i]===simColor)&&s.widgets['HW temperature log']?.history.at(-1)?.y===value&&s.widgets['SIM temperature log']?.history.at(-1)?.y===simulated;
   },{value,color,simulated,simColor});
  }
  assert.equal(await p.evaluate(()=>CodyLiveStore.read().widgets['HW temperature log'].limit),200);await stop();
  console.log('PASS Blocks temperature crossover, independent LEDs at all 18/25/30 boundaries and dashboard history');
  await load('demo-soil-sim-hw');
  assert.equal(await p.evaluate(()=>CodyLiveStore.read().scene.garden.pots.length>0),true);
  await p.evaluate(()=>CodyLiveStore.update(s=>{s.scene.garden.enabled=false;s.scene.soil=24.9;}));await run();
  await p.waitForFunction(()=>testHW.sounds.length>0&&testHW.display===24.9&&Number(CodyLiveStore.read().seven_segment)===24.9);
  assert.deepEqual(await p.evaluate(()=>testHW.sounds[0]),{note:'C3',duration_ms:150});
  await p.evaluate(()=>CodyLiveStore.update(s=>{s.scene.soil=25;}));await settle();
  const silent=await p.evaluate(()=>testHW.sounds.length);await settle();assert.equal(await p.evaluate(()=>testHW.sounds.length),silent);
  assert.equal(await p.evaluate(()=>CodyLiveStore.read().widgets['Moisture log'].history.at(-1).y),25);
  await p.evaluate(()=>CodyLiveStore.update(s=>{s.scene.soil=10;}));await p.waitForFunction(n=>testHW.sounds.length>n,silent);
  assert.equal(await p.evaluate(()=>testHW.calls.some(c=>c.type==='cn_soil_read')),false);await stop();
  console.log('PASS Blocks simulated soil to both displays, below-25% hardware beep, silence at 25%, dashboard log, no hardware soil read');
  await load('stage-joystick');assert.equal(await p.locator('#designName').inputValue(),'Move Sprite with HW Joystick');await run();
  for(const[direction,axis,sign]of [['right','x',1],['left','x',-1],['up','y',1],['down','y',-1]]){
   await p.evaluate(direction=>{testHW.keys=[direction];},direction);
   await p.waitForFunction(({axis,sign})=>CodySpriteStage.model.snapshot()[axis]*sign>10,{axis,sign});
  }
  await p.evaluate(()=>{testHW.keys=[];});await stop();
  console.log('PASS reused Blocks sprite project responds to all four real joystick directions');
  await p.locator('#headerExamples').click();await p.locator('.example-categories button').filter({hasText:'Demo'}).click();assert.equal(await p.locator('.example-card').count(),3);
  assert.deepEqual(await p.locator('.example-card strong').allTextContents(),['Temperature sensor: HW and SIM','Soil Moisture: SIM to HW','Move Sprite with HW Joystick']);
  if(process.env.REVIEW_SHOTS){fs.mkdirSync(process.env.REVIEW_SHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.REVIEW_SHOTS,'demo-category.png')});}
  assert.deepEqual(errors,[]);assert.deepEqual(alerts,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
