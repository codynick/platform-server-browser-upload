const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);

ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
ctx.document.addEventListener=target.addEventListener.bind(target);ctx.document.removeEventListener=target.removeEventListener.bind(target);
for(const f of ['hardware.js','runtime.js','block-specs.js','editor-interactions.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};

(async()=>{
const B=ctx.Blockly,ws=ctx.codyWorkspace,rt=new ctx.BlockRuntime({wait:async()=>{}},ctx.HARDWARE_SPECS);rt.controller=new AbortController();rt.signal=rt.controller.signal;
ws.clear();let b=ws.newBlock('variables_set');const name=ws.getVariableMap().createVariable('answer');b.setFieldValue(name.getId(),'VAR');
assert.equal(b.getInputTargetBlock('VALUE').type,'cn_scalar_value');
for(const [typed,value] of [['0',0],['42',42],['-1.25e2',-125],['hello','hello'],['"123"','123'],['',''],[' true ',' true '],['1e999','1e999'],['"a\\nb"','a\nb']]){
 b.getInputTargetBlock('VALUE').setFieldValue(typed,'VALUE');await rt.chain(b);assert.equal(rt.vars.get(name.getId()),value);
}
b.getInputTargetBlock('VALUE').setFieldValue('hello','VALUE');
let data=B.serialization.workspaces.save(ws);ctx.CodyAccountEditor.load(data);b=ws.getAllBlocks(false).find(b=>b.type==='variables_set');await rt.chain(b);assert.equal(rt.vars.get(name.getId()),'hello');
vm.runInContext(fs.readFileSync(path.join(root,'python-preview.js'),'utf8'),ctx);
const start=ws.newBlock('cn_event_start');start.getInput('DO').connection.connect(b.previousConnection);
assert(ctx.generatePython().includes('answer = "hello"'));
const getter=ws.newBlock('variables_get'),source=ws.getVariableMap().createVariable('source');getter.setFieldValue(source.getId(),'VAR');b.getInput('VALUE').connection.connect(getter.outputConnection);rt.vars.set(source.getId(),'123');await rt.chain(b);assert.equal(rt.vars.get(name.getId()),'123');
getter.outputConnection.disconnect();assert.equal(b.getInputTargetBlock('VALUE').getFieldValue('VALUE'),'hello');
const existingText=ws.newBlock('text');existingText.setFieldValue('123','TEXT');b.getInput('VALUE').connection.connect(existingText.outputConnection);await rt.chain(b);assert.equal(rt.vars.get(name.getId()),'123');
let toolbox;ws.updateToolbox=t=>toolbox=t;els.hardwareToolboxTab.onclick();assert(toolbox.contents.some(c=>c.name==='7Segment Display'));assert(!toolbox.contents.some(c=>c.name==='Seven Segment'));
assert(B.ContextMenuRegistry.registry.getItem('blockDuplicate').callback);
console.log('PASS: editable scalar defaults, number/text types, quoted numeric strings, project validation/roundtrip, generated Python, variable replacement, shadow restoration, old text semantics and category rename');
ws.dispose();
})().catch(e=>{console.error(e);process.exitCode=1});
