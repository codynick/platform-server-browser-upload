const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);
ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
for(const f of ['hardware.js','runtime.js','block-specs.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};

(async()=>{
const B=ctx.Blockly,ws=ctx.codyWorkspace,slots={"cn_rgb_matrix_set": ["led"], "cn_rgb_matrix_set_xy": ["x", "y"], "cn_led_matrix_set_pixel": ["x", "y"], "cn_led_matrix_on": ["x", "y"], "cn_led_matrix_off": ["x", "y"], "cn_sound_play": ["duration_ms"], "cn_sound_play_until_done": ["duration_ms"], "cn_seven_segment_display": ["value"]};
const calls=[];const rt=new ctx.BlockRuntime({wait:async()=>{},call:async(type,args,signal,target)=>calls.push({type,args,target})},ctx.HARDWARE_SPECS);
let toolbox;ws.updateToolbox=t=>toolbox=t;els.hardwareToolboxTab.onclick();
assert(toolbox.contents.some(c=>c.name==='RGB LED'));assert(!toolbox.contents.some(c=>c.name==='RGB Matrix'));
const palette=toolbox.contents.flatMap(c=>c.contents);

for(const [type,names] of Object.entries(slots)){
 ws.clear();
 const state=palette.find(b=>b.type===type);assert(state);
 let b=B.serialization.blocks.append(state,ws);
 for(const name of names){
  const arg=ctx.HARDWARE_SPECS.find(s=>s.type===type).args.find(a=>a.name===name);
  assert.equal(b.getInputTargetBlock(name).getFieldValue('NUM'),Number(arg.default));
  b.getInputTargetBlock(name).setFieldValue(name==='duration_ms'?250:2,'NUM');
  rt.controller=new AbortController();rt.signal=rt.controller.signal;
  assert.equal((await rt.args(b))[name],name==='duration_ms'?250:2);
  const variable=ws.getVariableMap().createVariable('test_'+name),get=ws.newBlock('variables_get');get.setFieldValue(variable.getId(),'VAR');
  b.getInput(name).connection.connect(get.outputConnection);rt.vars.set(variable.getId(),name==='duration_ms'?300:3);
  assert.equal((await rt.args(b))[name],name==='duration_ms'?300:3);
  const saved=B.serialization.workspaces.save(ws);B.serialization.workspaces.load(saved,ws);
  b=ws.getAllBlocks(false).find(b=>b.type===type);
  assert.equal(b.getInputTargetBlock(name).type,'variables_get');
 }
 // Migrate every old numeric field, including nested blocks, without changing caller data.
 ws.clear();const fields=Object.fromEntries(names.map(n=>[n,n==='duration_ms'?345:2]));
 const legacy={blocks:{blocks:[{type,fields}]}};const before=JSON.stringify(legacy);
 B.serialization.workspaces.load(legacy,ws);const upgraded=ws.getAllBlocks(false).find(b=>b.type===type);
 for(const name of names)assert.equal(upgraded.getInputTargetBlock(name).getFieldValue('NUM'),fields[name]);
 assert.equal(JSON.stringify(legacy),before);
 const args=await rt.args(upgraded);for(const name of names)assert.equal(args[name],fields[name]);
}
// Validate real wire frames, simulation routing, and unchanged bounds for all operations.
const hw=new ctx.CjpHardware(ctx.CJP),signal=new AbortController().signal;
const cases=[['cn_rgb_matrix_set',{led:15,color:'#FF0000'},'CN@@RGB@@15#FF0000'],['cn_rgb_matrix_set_xy',{x:3,y:1,color:'#00FF00'},'CN@@RGB@@04#00FF00'],['cn_led_matrix_set_pixel',{x:7,y:6,state:'True'},'CN@@LPX@@761'],['cn_led_matrix_on',{x:6,y:7},'CN@@LPX@@671'],['cn_led_matrix_off',{x:6,y:7},'CN@@LPX@@670'],['cn_sound_play',{note:'C4',duration_ms:250},'CN@@BUZ@@026200250'],['cn_sound_play_until_done',{note:'C4',duration_ms:1},'CN@@BUZ@@026200001'],['cn_seven_segment_display',{device:'STANDALONE',value:123.4},'CN@@7SEG@@00123.4 __']];
for(const [type,args,expected] of cases){await hw.call(type,args,signal);assert.equal(sent.at(-1),expected);}
for(const [type,args] of [['cn_rgb_matrix_set_xy',{x:4,y:0,color:'#FF0000'}],['cn_led_matrix_on',{x:8,y:0}],['cn_sound_play',{note:'C4',duration_ms:0}],['cn_sound_play',{note:'C4',duration_ms:32768}],['cn_seven_segment_display',{device:'STANDALONE',value:1234567}]])await assert.rejects(()=>hw.call(type,args,signal));
const router=new ctx.LiveRouter(hw,ctx.CodyLiveStore);const scene=ctx.CodyLiveStore.read().scene;scene.gadgets.matrix={x:0,y:0};scene.gadgets.seven={x:0,y:0};ctx.CodyLiveStore.simCommand({action:'scene',scene});
for(const [type,args] of cases)await router.call(type,args,signal,'SIMULATION');
const simulation=ctx.CodyLiveStore.read();assert.equal(simulation.leds[4],'#00FF00');assert.equal(simulation.matrix.pixels[6*8+7],1);assert.equal(simulation.seven_segment,'123.4');assert.equal(simulation.notes.at(-2).duration,250);
vm.runInContext(fs.readFileSync(path.join(root,'python-preview.js'),'utf8'),ctx);
ws.clear();B.serialization.workspaces.load({blocks:{blocks:[{type:'cn_event_start',inputs:{DO:{block:{type:'cn_sound_play',fields:{note:'C4',duration_ms:250}}}}}]}},ws);
assert(ctx.generatePython().includes('CJP_Sound_Maker.play(cody, "C4", 250)'));
console.log('PASS: numeric sockets, palette defaults, legacy imports, number/variable evaluation, roundtrip, firmware frames, simulation, bounds and Python preview');ws.dispose();
})().catch(e=>{console.error(e);process.exitCode=1});