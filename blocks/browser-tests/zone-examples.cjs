// Real Blockly and Pyodide execution, with a deliberately mocked CJP transport.
const {chromium}=require('playwright'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[],alerts=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('dialog',async d=>{if(!d.message().startsWith('Load ')){alerts.push(d.message());console.error(d.message());}await d.accept();});
  await p.goto(process.env.PILOT_URL||'http://127.0.0.1:8779/blocks/');await p.waitForFunction(()=>window.CodyProjectFiles);
  await p.evaluate(()=>{
   window.testHW={temperature:22,keys:[],calls:[],cycles:0};
   const check=LiveRouter.prototype.check,call=LiveRouter.prototype.call,wait=LiveRouter.prototype.wait;
   LiveRouter.prototype.check=function(type,a,target){if(target==='HARDWARE')return;return check.call(this,type,a,target);};
   LiveRouter.prototype.call=async function(type,a,signal,target){
    if(target!=='HARDWARE')return call.call(this,type,a,signal,target);
    signal?.throwIfAborted();testHW.calls.push({type,args:a});
    if(type==='cn_temperature_read')return testHW.temperature;
    if(type==='cn_joystick_position')return testHW.keys.includes(a.pos);
    if(type==='cn_rgb_matrix_set'){testHW.color=a.color;return;}
    if(type==='cn_rgb_matrix_clear'){testHW.color='#000000';return;}
    if(type.startsWith('cn_seven_segment')){testHW.display=a.value;return;}
    throw Error('Unexpected mocked hardware call '+type);
   };
   LiveRouter.prototype.wait=function(ms,signal){if(ms>=40)testHW.cycles++;return wait.call(this,ms,signal);};
  });
  const state=()=>p.evaluate(()=>({live:CodyLiveStore.read(),sprite:CodySpriteStage.model.snapshot(),hw:testHW}));
  const until=async (fn,arg)=>{try{return await p.waitForFunction(fn,arg,{timeout:45000});}catch(e){console.error(String(fn),await state(),alerts);throw e;}};
  const change=async (scene={},inputs={})=>p.evaluate(({scene,inputs})=>{
   CodyLiveStore.update(s=>Object.assign(s.scene,scene));
   for(const [name,value]of Object.entries(inputs))CodyLiveStore.dashboardInput(name,value);
  },{scene,inputs});
  const settle=async()=>{const count=await p.evaluate(()=>testHW.cycles);await until(n=>testHW.cycles>=n+4,count);};
  const hw=async values=>p.evaluate(v=>Object.assign(testHW,v),values);
  const stage=async (action,args)=>p.evaluate(({action,args})=>CodySpriteStage.command(action,args),{action,args});
  for(const lang of ['blocks','python']){
   await p.locator(lang==='blocks'?'#blocksEditorTab':'#pythonEditorTab').click();
   for(let n=1;n<=15;n++){
    if(process.env.ZONE_ONLY&&n!==Number(process.env.ZONE_ONLY))continue;
    const id='zone-'+String(n).padStart(2,'0');
    await p.locator('#headerExamples').click();await p.selectOption('#example',id);await p.locator('#loadExample').click();
    await until(()=>!document.getElementById('examplesDialog').open);
    await p.evaluate(()=>{testHW.temperature=22;testHW.keys=[];testHW.color=null;testHW.display=null;testHW.calls=[];testHW.cycles=0;});
    const snapshot=await p.evaluate(async id=>{
     const e=(await(await fetch('python-examples.json')).json())[id];
     const expected=await CodyProjectArchive.decode(await(await fetch(e.archive)).arrayBuffer());
     CodyProjectFiles.validate(expected);return {actual:CodyProjectFiles.capture(),expected,selected:CodyPythonPilot.selected};
    },id);
    assert.equal(snapshot.actual.python,snapshot.expected.python);assert.deepEqual(snapshot.actual.editor.names,snapshot.expected.editor.names);
    assert.deepEqual(snapshot.actual.state.live.widgets,snapshot.expected.state.live.widgets);assert.deepEqual(snapshot.actual.state.sprite,snapshot.expected.state.sprite);
    assert.equal(snapshot.selected,lang==='python');assert(snapshot.actual.editor.names.blocks.startsWith(n+'. '));
    await p.locator('#blockRunBtn').click();await p.waitForFunction(()=>testHW.cycles>=4,null,{timeout:180000});
    if(n===1){await until(()=>testHW.color==='#00FF00');await hw({temperature:35});await until(()=>testHW.color==='#FF0000');}
    if(n===2){await change({temperature:35});await until(()=>CodyLiveStore.read().leds[0]==='#FF0000');await change({temperature:20});await until(()=>CodyLiveStore.read().leds[0]==='#00FF00');}
    if(n===3){await change({}, {Power:true,Level:75});await until(()=>CodyLiveStore.read().widgets.Enabled.value===true&&Number(CodyLiveStore.read().widgets.Reading.value)===75);await p.evaluate(()=>{CodyLiveStore.dashboardInput('Hold',true,'test');});await until(()=>CodyLiveStore.read().widgets.Held.value===true&&Number(CodyLiveStore.read().widgets.Taps.value)>=1);await p.evaluate(()=>CodyLiveStore.dashboardInput('Hold',false,'test'));await until(()=>CodyLiveStore.read().widgets.Held.value===false);}
    if(n===4){await stage('set_x',{x:240});await settle();assert((await state()).sprite.x<=216);await p.evaluate(()=>{window.keyMock=CodySpriteStage.command;CodySpriteStage.command=function(action,args,signal){if(action==='key_pressed')return Promise.resolve(args.key==='space');if(action==='mouse_down')return Promise.resolve(true);return keyMock.call(this,action,args,signal);};});await until(()=>!CodySpriteStage.model.snapshot().visible&&CodySpriteStage.model.snapshot().size===140);await p.evaluate(()=>CodySpriteStage.command=keyMock);await until(()=>CodySpriteStage.model.snapshot().visible&&CodySpriteStage.model.snapshot().size===100);}
    if(n===5){await hw({temperature:34});await change({distance:123});await until(()=>testHW.display===123&&Number(CodyLiveStore.read().seven_segment)===34);}
    if(n===6){await hw({temperature:35});await until(()=>testHW.color==='#FF0000'&&Number(CodyLiveStore.read().widgets.Temperature.value)===35);await change({}, {Level:40});await until(()=>testHW.color==='#00FF00');await change({}, {Light:false});await until(()=>testHW.color==='#000000');assert((await state()).live.widgets.History.history.length>0);}
    if(n===7){await hw({keys:['right']});await until(()=>CodySpriteStage.model.snapshot().x>5);await hw({keys:[]});await stage('set_x',{x:240});await until(()=>testHW.color==='#FF0000');}
    if(n===8){await change({temperature:33},{Light:true});await until(()=>Number(CodyLiveStore.read().widgets.Temperature.value)===33&&CodyLiveStore.read().leds[0]==='#00FF00');await change({}, {Light:false});await until(()=>CodyLiveStore.read().leds[0]==='#000000');}
    if(n===9){await change({temperature:40});await until(()=>CodySpriteStage.model.snapshot().size===120&&CodySpriteStage.model.snapshot().speech==='40');await stage('set_x',{x:240});await until(()=>CodyLiveStore.read().leds[0]==='#FF0000');await stage('set_x',{x:0});await until(()=>CodyLiveStore.read().leds[0]==='#00FF00');}
    if(n===10){await change({}, {Size:150,Visible:false});await until(()=>CodySpriteStage.model.snapshot().size===150&&!CodySpriteStage.model.snapshot().visible);await change({}, {Visible:true});await p.evaluate(()=>CodyLiveStore.dashboardInput('Move',true,'test'));await until(()=>CodySpriteStage.model.snapshot().x>0&&Number(CodyLiveStore.read().widgets.Position.value)>0);await p.evaluate(()=>CodyLiveStore.dashboardInput('Move',false,'test'));}
    if(n===11){await hw({temperature:35});await change({temperature:20});await until(()=>testHW.color==='#FF0000'&&CodyLiveStore.read().leds[0]==='#00FF00');await change({}, {Threshold:40});await until(()=>testHW.color==='#00FF00');await change({temperature:45});await until(()=>CodyLiveStore.read().leds[0]==='#FF0000');const s=await state();assert(s.live.widgets['Real history'].history.length&&s.live.widgets['Simulated history'].history.length);}
    if(n===12){await hw({temperature:40});await change({distance:400});await until(()=>CodySpriteStage.model.snapshot().size===120&&Math.abs(CodySpriteStage.model.snapshot().x-200)<.001&&testHW.color==='#FF0000'&&CodyLiveStore.read().leds[0]==='#FF0000');await change({distance:201});await until(()=>Math.abs(CodySpriteStage.model.snapshot().x)<.001&&testHW.color==='#00FF00'&&CodyLiveStore.read().leds[0]==='#00FF00');}
    if(n===13){await change({}, {Speed:10});await hw({keys:['up']});await until(()=>CodySpriteStage.model.snapshot().y>=10&&Number(CodyLiveStore.read().widgets.Y.value)>=10);await hw({keys:[]});await stage('set_y',{y:180});await until(()=>CodyLiveStore.read().widgets.Edge.value===true);}
    if(n===14){await change({temperature:40});await until(()=>CodySpriteStage.model.snapshot().appearance==='cactus'&&CodySpriteStage.model.snapshot().speech==='Hot'&&CodyLiveStore.read().widgets.Warning.value===true);await change({}, {Threshold:45});await until(()=>CodySpriteStage.model.snapshot().appearance==='apple'&&CodySpriteStage.model.snapshot().speech==='Comfortable'&&CodyLiveStore.read().widgets.Warning.value===false);}
    if(n===15){await until(()=>CodySpriteStage.model.snapshot().speech==='Healthy');await change({soil:10});await until(()=>CodySpriteStage.model.snapshot().speech==='Check greenhouse'&&testHW.color==='#FF0000'&&CodyLiveStore.read().leds[0]==='#FF0000'&&CodyLiveStore.read().widgets.Warning.value===true);await change({soil:60});await hw({temperature:40});await until(()=>Number(CodyLiveStore.read().widgets.Temperature.value)===40&&CodyLiveStore.read().widgets.Warning.value===true);await change({}, {'Max temperature':45});await until(()=>CodySpriteStage.model.snapshot().speech==='Healthy'&&CodySpriteStage.model.snapshot().size===100&&testHW.color==='#00FF00'&&CodyLiveStore.read().leds[0]==='#00FF00');}
    const s=await state();
    const expectedZones=snapshot.actual.editor.names.blocks.split(' - ')[0].split('. ')[1].split(' + ');
    assert.equal(s.hw.calls.length>0,expectedZones.includes('HW'),'hardware zone isolation');
    assert.equal(Object.keys(s.live.widgets).length>0,expectedZones.includes('Dash'),'dashboard zone isolation');
    await p.locator('#blockRunBtn').click();await until(()=>!window.blockProgramRunning&&!CodyPythonPilot.running);
    console.log('PASS '+lang+' '+id+': paired archive, saved panels, runtime reactions and Stop');
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(alerts,[]);console.log('PASS all 30 program runs; no runtime alerts or page errors (CJP mocked).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
