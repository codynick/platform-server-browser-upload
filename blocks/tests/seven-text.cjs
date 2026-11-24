const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);
ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
for(const f of ['hardware.js','runtime.js','block-specs.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};

(async()=>{
const B=ctx.Blockly,ws=ctx.codyWorkspace,rt=new ctx.BlockRuntime(new ctx.CjpHardware(ctx.CJP),ctx.HARDWARE_SPECS);
rt.controller=new AbortController();rt.signal=rt.controller.signal;
let toolbox;ws.updateToolbox=t=>toolbox=t;els.hardwareToolboxTab.onclick();
const state=toolbox.contents.flatMap(c=>c.contents).find(b=>b.type==='cn_seven_segment_display_value');
ws.clear();let b=B.serialization.blocks.append(state,ws);
assert.equal(b.getInputTargetBlock('value').getFieldValue('TEXT'),'feed');assert.equal(b.getInput('value').connection.getCheck(),null);
b.getInputTargetBlock('value').setFieldValue('Ab-1','TEXT');assert.equal((await rt.args(b)).value,'Ab-1');
const variable=ws.getVariableMap().createVariable('message'),getter=ws.newBlock('variables_get');getter.setFieldValue(variable.getId(),'VAR');b.getInput('value').connection.connect(getter.outputConnection);rt.vars.set(variable.getId(),'feed');
await rt.gadget(b);assert.equal(sent.at(-1),'CN@@7TXT@@00feed____');
rt.vars.set(variable.getId(),23.5);await rt.gadget(b);assert(sent.at(-1).startsWith('CN@@7SEG@@0023.5'));
let saved=B.serialization.workspaces.save(ws);B.serialization.workspaces.load(saved,ws);b=ws.getAllBlocks(false).find(b=>b.type==='cn_seven_segment_display_value');assert.equal(b.getInputTargetBlock('value').type,'variables_get');
for(const value of [undefined,{shadow:{type:'math_number',fields:{NUM:12}}}]){
 ws.clear();B.serialization.workspaces.load({blocks:{blocks:[{type:'cn_seven_segment_display_value',inputs:value?{value}:undefined}]}},ws);
 assert.equal(ws.getAllBlocks(false).find(b=>b.type==='cn_seven_segment_display_value').getInputTargetBlock('value').getFieldValue('TEXT'),value?'12':'feed');
}
ws.clear();B.serialization.workspaces.load({blocks:{blocks:[{type:'cn_seven_segment_display_value',inputs:{value:{block:{type:'math_number',fields:{NUM:12}}}}}]}},ws);assert.equal(ws.getAllBlocks(false).find(b=>b.type==='cn_seven_segment_display_value').getInputTargetBlock('value').type,'math_number');
const hw=new ctx.CjpHardware(ctx.CJP),signal=rt.signal;
for(const [value,device,expected] of [['feed','STANDALONE','CN@@7TXT@@00feed____'],['a','ULTRASEG','CN@@7TXT@@02a   ____'],['','STANDALONE','CN@@7TXT@@00    ____'],['123456','STANDALONE','CN@@7TXT@@001234____'],[' A_-','STANDALONE','CN@@7TXT@@00 A_-____']]){
 await hw.call('cn_seven_segment_display_value',{device,value},signal);assert.equal(sent.at(-1),expected);assert.equal(sent.at(-1).length,20);
}
await assert.rejects(()=>hw.call('cn_seven_segment_display_value',{device:'STANDALONE',value:'é'},signal),/ASCII/);
await assert.rejects(()=>hw.call('cn_seven_segment_display_value',{device:1,value:'feed'},signal),/device/);
await assert.rejects(()=>hw.call('cn_seven_segment_display',{device:0,value:'feed'},signal),/Display value/);
const router=new ctx.LiveRouter(hw,ctx.CodyLiveStore),scene=ctx.CodyLiveStore.read().scene;scene.gadgets.seven={x:0,y:0};scene.gadgets.ultraseg={x:0,y:0};ctx.CodyLiveStore.simCommand({action:'scene',scene});
await router.call('cn_seven_segment_display_value',{device:'STANDALONE',value:'feed'},signal,'SIMULATION');
await router.call('cn_seven_segment_display_value',{device:'ULTRASEG',value:'Hi'},signal,'SIMULATION');
let live=ctx.CodyLiveStore.read();assert.equal(live.seven_segment,'feed');assert.equal(live.seven_segment_text,true);assert.equal(live.ultra_segment,'Hi  ');assert.equal(live.ultra_segment_text,true);
ctx.CodyLiveStore.restoreProject(live);assert.equal(ctx.CodyLiveStore.read().seven_segment_text,true);
await router.call('cn_seven_segment_display',{device:'STANDALONE',value:12.3},signal,'SIMULATION');assert.equal(ctx.CodyLiveStore.read().seven_segment_text,false);
vm.runInContext(fs.readFileSync(path.join(root,'python-preview.js'),'utf8'),ctx);
ws.clear();B.serialization.workspaces.load({blocks:{blocks:[{type:'cn_event_start',inputs:{DO:{block:{type:'cn_seven_segment_display_value',inputs:{value:{shadow:{type:'text',fields:{TEXT:'feed'}}}}}}}}]}},ws);
const python=ctx.generatePython();assert(python.includes('def __cn_seven_reading'));assert(python.includes('__cn_seven_reading(cody, \'STANDALONE\', "feed")'));

console.log('PASS: editable text, string/numeric variables, migration, roundtrip, exact text frames, numeric preservation, ASCII validation, simulation modes, restore and generated Python');ws.dispose();
})().catch(e=>{console.error(e);process.exitCode=1});