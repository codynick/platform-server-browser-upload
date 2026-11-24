const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);

ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
ctx.document.addEventListener=target.addEventListener.bind(target);ctx.document.removeEventListener=target.removeEventListener.bind(target);
for(const f of ['hardware.js','runtime.js','block-specs.js','editor-interactions.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};


(async()=>{
const B=ctx.Blockly,ws=ctx.codyWorkspace,colors=['#FF0000','#00FFFF','#0000FF','#FFFF00','#FF00FF','#00FF00','#FF8000','#FFFFFF'];
const types=['cn_rgb_led_code','cn_rgb_led_xy_code','cn_rgb_led_percent'];
const rt=new ctx.BlockRuntime(new ctx.LiveRouter(new ctx.CjpHardware(ctx.CJP),ctx.CodyLiveStore),ctx.HARDWARE_SPECS);rt.controller=new AbortController();rt.signal=rt.controller.signal;
let toolbox;ws.updateToolbox=t=>toolbox=t;els.hardwareToolboxTab.onclick();const palette=toolbox.contents.find(c=>c.name==='RGB LED').contents;
for(const type of types){
 ws.clear();let b=B.serialization.blocks.append(palette.find(s=>s.type===type),ws);
 assert.equal(b.getFieldValue('TARGET'),'HARDWARE');assert.deepEqual(Array.from(b.getField('TARGET').getOptions(),o=>o[1]),['HARDWARE','SIMULATION']);
 for(const arg of ctx.HARDWARE_SPECS.find(s=>s.type===type).args){
  assert.equal(b.getInputTargetBlock(arg.name).getFieldValue('NUM'),Number(arg.default));
  assert.equal(b.getInput(arg.name).connection.getCheck()[0],'Number');
  const value=arg.name==='red'?55:1;b.getInputTargetBlock(arg.name).setFieldValue(value,'NUM');assert.equal((await rt.args(b))[arg.name],value);
  const variable=ws.getVariableMap().createVariable('value_'+arg.name),getter=ws.newBlock('variables_get');getter.setFieldValue(variable.getId(),'VAR');b.getInput(arg.name).connection.connect(getter.outputConnection);rt.vars.set(variable.getId(),value+1);assert.equal((await rt.args(b))[arg.name],value+1);
  const saved=B.serialization.workspaces.save(ws);ctx.CodyAccountEditor.load(saved);b=ws.getAllBlocks(false).find(b=>b.type===type);assert.equal(b.getInputTargetBlock(arg.name).type,'variables_get');
 }
 b.setFieldValue('SIMULATION','TARGET');const saved=B.serialization.workspaces.save(ws);ctx.CodyAccountEditor.load(saved);assert.equal(ws.getAllBlocks(false).find(b=>b.type===type).getFieldValue('TARGET'),'SIMULATION');
}
const hw=new ctx.CjpHardware(ctx.CJP),signal=rt.signal;
for(let code=0;code<8;code++){
 await hw.call('cn_rgb_led_code',{led:15,code},signal);assert.equal(sent.at(-1),'CN@@RGB@@15'+colors[code]);
 await hw.call('cn_rgb_led_xy_code',{x:3,y:1,code},signal);assert.equal(sent.at(-1),'CN@@RGB@@04'+colors[code]);
}
for(const [red,green,blue,color] of [[0,0,0,'#000000'],[100,0,0,'#FF0000'],[0,100,0,'#00FF00'],[0,0,100,'#0000FF'],[100,100,100,'#FFFFFF'],[50,50,50,'#808080'],[100,50,0,'#FF8000'],[20,40,60,'#336699'],[12.5,0,0,'#200000']]){
 await hw.call('cn_rgb_led_percent',{led:7,red,green,blue},signal);assert.equal(sent.at(-1),'CN@@RGB@@07'+color);
}
for(const [type,args] of [
 ['cn_rgb_led_code',{led:0,code:-1}],['cn_rgb_led_code',{led:0,code:8}],['cn_rgb_led_code',{led:0,code:1.5}],['cn_rgb_led_code',{led:16,code:0}],['cn_rgb_led_code',{led:0,code:NaN}],
 ['cn_rgb_led_xy_code',{x:4,y:0,code:1}],['cn_rgb_led_xy_code',{x:0,y:-1,code:1}],['cn_rgb_led_xy_code',{x:.5,y:0,code:1}],
 ['cn_rgb_led_percent',{led:0,red:-1,green:0,blue:0}],['cn_rgb_led_percent',{led:0,red:101,green:0,blue:0}],['cn_rgb_led_percent',{led:0,red:0,green:NaN,blue:0}],['cn_rgb_led_percent',{led:0,red:0,green:0,blue:Infinity}],['cn_rgb_led_percent',{led:16,red:0,green:0,blue:0}]
]){const before=sent.length;await assert.rejects(()=>hw.call(type,args,signal));assert.equal(sent.length,before);}
ctx.CJP.connected=false;const router=new ctx.LiveRouter(hw,ctx.CodyLiveStore),before=sent.length;
for(let code=0;code<8;code++){
 await router.call('cn_rgb_led_code',{led:5,code},signal,'SIMULATION');assert.equal(ctx.CodyLiveStore.read().leds[5],colors[code]);
 await router.call('cn_rgb_led_xy_code',{x:3,y:1,code},signal,'SIMULATION');assert.equal(ctx.CodyLiveStore.read().leds[4],colors[code]);
}
await router.call('cn_rgb_led_percent',{led:7,red:20,green:40,blue:60},signal,'SIMULATION');assert.equal(ctx.CodyLiveStore.read().leds[7],'#336699');assert.equal(sent.length,before);
for(const type of types)await assert.rejects(()=>router.call(type,{led:0,code:0,x:0,y:0,red:0,green:0,blue:0},signal,'HARDWARE'),/Connect a CJP/);
ws.clear();const start=ws.newBlock('cn_event_start');let connection=start.getInput('DO').connection;
for(const type of types){const b=B.serialization.blocks.append(palette.find(s=>s.type===type),ws);b.setFieldValue('SIMULATION','TARGET');connection.connect(b.previousConnection);connection=b.nextConnection;}
await new ctx.BlockRuntime(router,ctx.HARDWARE_SPECS).run(ws);assert.equal(sent.length,before);
vm.runInContext(fs.readFileSync(path.join(root,'python-preview.js'),'utf8'),ctx);const python=ctx.generatePython();assert(python.includes('def __cn_rgb_code'));assert(python.includes('def __cn_rgb_percent'));assert(python.includes('RGB_Matrix.set_xy(cody, 0, 0, __cn_rgb_code(0))'));
console.log('PASS: all 9 numeric/variable sockets, HW/SIM dropdowns and serialization, eight color codes, XY routing, percentage rounding, invalid-value rejection without IO, disconnected simulation, hardware preflight, complete program execution and Python preview');ws.dispose();
})().catch(e=>{console.error(e);process.exitCode=1});
