const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../blocks');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);

ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
ctx.document.addEventListener=target.addEventListener.bind(target);ctx.document.removeEventListener=target.removeEventListener.bind(target);
for(const f of ['hardware.js','runtime.js','block-specs.js','editor-interactions.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};




(async()=>{
const M=ctx.CodyLightWorld,scene=ctx.CodyLiveStore.defaults().scene;scene.gadgets.light={x:100,y:100};scene.light=37.5;scene.illumination=M.defaults(scene.light);scene.illumination.enabled=true;
const sensor=M.sensorOrigin(scene.gadgets.light),lamp={id:'lamp',x:sensor.x+600-66,y:sensor.y-116,on:true,power:100};scene.illumination.flashlights=[lamp];
const levels=[];for(const distance of [600,300,140,20,0]){lamp.x=sensor.x+distance-66;levels.push(M.intensity(scene));}assert(levels.every((v,i)=>v>=0&&v<=100&&(!i||v>levels[i-1])));assert.equal(levels.at(-1),100);
lamp.on=false;assert.equal(M.intensity(scene),5);lamp.on=true;scene.illumination.enabled=false;assert.equal(M.intensity(scene),37.5);scene.illumination.enabled=true;
const value=M.intensity(scene);scene.gadgets.light.x+=100;assert(M.intensity(scene)<value);scene.gadgets.light.x-=100;
scene.illumination.flashlights.push({...lamp,id:'lamp-2'});assert.equal(M.intensity(scene),100);
assert.throws(()=>M.clean({...scene.illumination,ambient:101}));assert.throws(()=>M.clean({...scene.illumination,enabled:'false'}));assert.throws(()=>M.clean({...scene.illumination,flashlights:[lamp,lamp]}));assert.throws(()=>M.clean({...scene.illumination,flashlights:[{...lamp,x:-1}]}));assert.throws(()=>M.clean({...scene.illumination,flashlights:[{...lamp,power:101}]}));
scene.illumination.flashlights=[lamp];ctx.CodyLiveStore.simCommand({action:'scene',scene});let saved=ctx.CodyLiveStore.read();assert.equal(saved.scene.light,100);
const encoded=JSON.stringify(saved);ctx.CodyLiveStore.restoreProject(JSON.parse(encoded));assert.equal(ctx.CodyLiveStore.read().scene.illumination.flashlights[0].id,'lamp');
const hw=new ctx.CjpHardware(ctx.CJP),router=new ctx.LiveRouter(hw,ctx.CodyLiveStore),signal=new AbortController().signal;ctx.CJP.connected=false;assert.equal(await router.call('cn_light_read',{},signal,'SIMULATION'),100);assert.equal(sent.length,0);
ctx.CodyLiveStore.update(s=>{s.scene.illumination.flashlights[0].x=sensor.x+600-66;});const far=await router.call('cn_light_read',{},signal,'SIMULATION');assert(far<20);
ctx.CodyLiveStore.update(s=>{s.scene.illumination.flashlights[0].x=sensor.x-66;});assert.equal(await router.call('cn_light_read',{},signal,'SIMULATION'),100);
// No simulator DOM or controller exists in this harness: proximity is shared core behavior.
ctx.CJP.connected=true;ctx.CJP.send=async()=>queueMicrotask(()=>ctx.dispatchEvent(new CustomEvent('cjp-line',{detail:'CN@@LIGHT@@42.0_____'})));assert.equal(await router.call('cn_light_read',{},signal,'HARDWARE'),42);
const manual={...scene,illumination:undefined,light:64.3};assert.equal(M.advance(manual).light,64.3);
console.log('PASS: monotone distance response, bounds/saturation, on/off, manual mode, sensor movement, validation, JSON/project restore, hidden-view simulation and independent Hardware reading',levels);
})().catch(e=>{console.error(e);process.exitCode=1});
