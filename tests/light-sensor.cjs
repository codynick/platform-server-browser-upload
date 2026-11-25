const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../blocks');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);

ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
ctx.document.addEventListener=target.addEventListener.bind(target);ctx.document.removeEventListener=target.removeEventListener.bind(target);
for(const f of ['hardware.js','runtime.js','block-specs.js','editor-interactions.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};



(async()=>{
const B=ctx.Blockly,ws=ctx.codyWorkspace;ws.clear();
const block=ws.newBlock('cn_light_read');assert.equal(block.outputConnection.getCheck()[0],'Number');assert.equal(block.getFieldValue('TARGET'),'HARDWARE');assert.deepEqual(Array.from(block.getField('TARGET').getOptions(),o=>o[1]),['HARDWARE','SIMULATION']);
block.setFieldValue('SIMULATION','TARGET');ctx.CodyAccountEditor.load(B.serialization.workspaces.save(ws));assert.equal(ws.getAllBlocks(false)[0].getFieldValue('TARGET'),'SIMULATION');
let reply='0';ctx.CJP.send=async message=>{sent.push(message);queueMicrotask(()=>ctx.dispatchEvent(new CustomEvent('cjp-line',{detail:'CN@@LIGHT@@'+reply.padEnd(9,'_')})));};
const hw=new ctx.CjpHardware(ctx.CJP),signal=new AbortController().signal;
for(const value of [0,0.1,25,50,99.9,100]){reply=String(value);assert.equal(await hw.call('cn_light_read',{},signal),value);assert.equal(sent.at(-1),'CN@@LIGHT@@');}
for(const value of ['ERR','-1','-1.0','','NaN','100.1','-0.1','50oops']){reply=value;await assert.rejects(()=>hw.call('cn_light_read',{},signal),/Light sensor|light intensity/);}
ctx.CJP.connected=false;const router=new ctx.LiveRouter(hw,ctx.CodyLiveStore),before=sent.length;
await assert.rejects(()=>router.call('cn_light_read',{},signal,'SIMULATION'),/Add light/);
let scene=ctx.CodyLiveStore.read().scene;assert.equal(scene.light,50);scene.gadgets.light={x:100,y:100};
for(const value of [0,.1,30.5,100]){scene.light=value;ctx.CodyLiveStore.simCommand({action:'scene',scene});assert.equal(await router.call('cn_light_read',{},signal,'SIMULATION'),value);}
assert.equal(sent.length,before);await assert.rejects(()=>router.call('cn_light_read',{},signal,'HARDWARE'),/Connect a CJP/);
for(const light of [-.1,100.1,NaN,Infinity])assert.throws(()=>ctx.CodyLiveStore.scene({...scene,light}));
const legacy=structuredClone(scene);delete legacy.light;assert.equal(ctx.CodyLiveStore.scene(legacy).light,50);
ctx.CodyLiveStore.restoreProject(ctx.CodyLiveStore.read());assert.equal(ctx.CodyLiveStore.read().scene.light,100);
ws.clear();const name=ws.getVariableMap().createVariable('lightPercent');const start=ws.newBlock('cn_event_start'),set=ws.newBlock('variables_set'),sensor=ws.newBlock('cn_light_read');set.setFieldValue(name.getId(),'VAR');sensor.setFieldValue('SIMULATION','TARGET');start.getInput('DO').connection.connect(set.previousConnection);set.getInput('VALUE').connection.connect(sensor.outputConnection);
const runtime=new ctx.BlockRuntime(router,ctx.HARDWARE_SPECS);await runtime.run(ws);assert.equal(runtime.vars.get(name.getId()),100);assert(runtime.variableSources.get(name.getId()).has('Simulation'));
vm.runInContext(fs.readFileSync(path.join(root,'python-bridge.js'),'utf8'),ctx);const bridge=new ctx.CodyPythonBridge(router,ctx.CodyLiveStore,signal);assert.equal(await bridge.request('gadget',JSON.stringify({block:'cn_light_read',target:'SIMULATION',args:{}})),'100');
vm.runInContext(fs.readFileSync(path.join(root,'python-preview.js'),'utf8'),ctx);const python=ctx.generatePython();assert(python.includes('def __cn_light_percent'));assert(python.includes('lightPercent = __cn_light_percent(cody)'));
console.log('PASS: percent block/HW-SIM selector, roundtrip, valid and error replies, disconnected simulation, gadget and range validation, legacy defaults, state restore, runtime variable/provenance, Python bridge and preview');ws.dispose();
})().catch(e=>{console.error(e);process.exitCode=1});
