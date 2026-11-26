const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../blocks');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);

ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
ctx.document.addEventListener=target.addEventListener.bind(target);ctx.document.removeEventListener=target.removeEventListener.bind(target);
for(const f of ['hardware.js','runtime.js','block-specs.js','editor-interactions.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};





ctx.setInterval=()=>0;vm.runInContext(fs.readFileSync(path.join(root,"dfplayer.js"),"utf8"),ctx);
(async()=>{
const D=ctx.CodyDFPlayer,S=ctx.CodyLiveStore,cat=JSON.parse(fs.readFileSync(path.join(root,'../simulator/dfplayer/catalog.json'),'utf8'));
const plain=v=>JSON.parse(JSON.stringify(v));
assert.deepEqual(plain(D.sayNumber(14,-120)),[[14,211],[14,1],[14,205],[14,20]]);
assert.deepEqual(plain(D.sayNumber(14,3)),[[14,128],[14,205],[14,128],[14,3]]);
assert.deepEqual(plain(D.sayInt(14,1001)),[[14,111],[14,1]]);assert.deepEqual(plain(D.whole(21)),[[6,20],[5,1]]);
assert.equal(D.frame(D.plan('cn_df_number',{value:-1.2,language:'English'}).packet),'CN@@DF@@W50EFFFFFF88');
assert.equal(D.frame(D.plan('cn_df_volume',{volume:50}).packet),'CN@@DF@@W1AF');
assert.equal(D.plan('cn_df_phrase',{phrase:'Hello',language:'English'}).packet.join(','),'10,1');
for(const language of ['Arabic','English','German','French'])for(const value of [0,-.03,-1.2,123.45,1001,1234567.89])for(const [folder,track]of D.plan('cn_df_number',{value,language}).sequence)assert(cat.tracks.some(t=>t.folder===folder&&t.track===track));
for(const type of ['phrase','persian','number','whole','emotion','track'])assert(ctx.HARDWARE_SPECS.some(s=>s.type==='cn_df_'+type+'_wait'));
assert.throws(()=>D.plan('cn_df_number',{value:Infinity,language:'English'}));assert.throws(()=>D.plan('cn_df_whole',{value:101}));assert.throws(()=>D.plan('cn_df_volume',{volume:-1}));assert.throws(()=>D.plan('cn_df_track',{folder:11,track:1,mode:'large'}));
for(const action of D.actions){const p=D.plan('cn_df_control',{action});assert.equal(p.packet.length,4);}
assert.equal(cat.tracks.some(t=>t.folder===7||t.folder===16),false);
ctx.fetch=async()=>({ok:true,json:async()=>cat});
class MockAudio{
 constructor(src){this.src=src;this.duration=.12;this.currentTime=0;this.volume=1;this.muted=false;this.timer=null;MockAudio.all.push(this);}
 async play(){this.timer=setTimeout(()=>{this.currentTime=this.duration;this.onended?.();},60);queueMicrotask(()=>this.onloadedmetadata?.());}
 pause(){clearTimeout(this.timer);}
}MockAudio.all=[];ctx.Audio=MockAudio;
const scene=S.defaults().scene;scene.gadgets.dfplayer={x:440,y:40};S.simCommand({action:'scene',scene});
const hw=new ctx.CjpHardware(ctx.CJP),router=new ctx.LiveRouter(hw,S),controller=new AbortController();ctx.CJP.connected=false;
await router.call('cn_df_volume',{volume:50},controller.signal,'SIMULATION');assert.equal(S.read().scene.dfplayer.volume,50);
await router.call('cn_df_phrase',{phrase:'Hello',language:'English'},controller.signal,'SIMULATION');assert.equal(await router.call('cn_df_busy',{},controller.signal,'SIMULATION'),true);
await router.call('cn_df_control',{action:'pause'},controller.signal,'SIMULATION');assert.equal(await router.call('cn_df_busy',{},controller.signal,'SIMULATION'),false);
await router.call('cn_df_control',{action:'resume'},controller.signal,'SIMULATION');assert.equal(await router.call('cn_df_wait',{timeout:2},controller.signal,'SIMULATION'),true);assert.equal(S.read().dfplayer.status,'finished');
await router.call('cn_df_number_wait',{value:-1.2,language:'English'},controller.signal,'SIMULATION');assert.equal(S.read().dfplayer.progress,100);
assert.equal(sent.length,0);
await router.call('cn_df_phrase',{phrase:'Welcome',language:'English'},controller.signal,'SIMULATION');controller.abort(Error('Stopped'));assert.equal(S.read().dfplayer.busy,false);assert.equal(S.read().dfplayer.status,'stopped');
const signal=new AbortController().signal;await assert.rejects(()=>router.call('cn_df_track',{folder:7,track:1,mode:'standard'},signal,'SIMULATION'),/No audio assigned/);
ctx.CJP.connected=true;let polls=0;const packets=[];ctx.CJP.send=async frame=>{packets.push(frame);queueMicrotask(()=>ctx.dispatchEvent(new CustomEvent('cjp-line',{detail:frame.startsWith('CN@@DF@@B')?'CN@@DF@@B'+(++polls%2?'1':'0')+'__________':'CN@@DF@@OK__________'})));};
await router.call('cn_df_phrase_wait',{phrase:'Hello',language:'English'},signal,'HARDWARE');assert(packets.includes('CN@@DF@@W20A01'));
ctx.CJP.send=async()=>queueMicrotask(()=>ctx.dispatchEvent(new CustomEvent('cjp-line',{detail:'CN@@DF@@ERR_________'})));await assert.rejects(()=>router.call('cn_df_volume',{volume:50},signal,'HARDWARE'),/unavailable|write failed/);
for(const type of ctx.HARDWARE_SPECS.filter(s=>s.type.startsWith('cn_df_')).map(s=>s.type)){const w=new ctx.Blockly.Workspace(),b=w.newBlock(type);b.setFieldValue('SIMULATION','TARGET');const c=new ctx.Blockly.Workspace();ctx.Blockly.serialization.workspaces.load(ctx.Blockly.serialization.workspaces.save(w),c);assert.equal(c.getTopBlocks()[0].getFieldValue('TARGET'),'SIMULATION');w.dispose();c.dispose();}
const ws=ctx.codyWorkspace;ws.clear();const start=ws.newBlock('cn_event_start'),phrase=ws.newBlock('cn_df_phrase_wait');phrase.setFieldValue('Hello','phrase');phrase.setFieldValue('English','language');start.getInput('DO').connection.connect(phrase.previousConnection);
vm.runInContext(fs.readFileSync(path.join(root,'python-preview.js'),'utf8'),ctx);const py=ctx.generatePython();assert(!py.includes("'language': English"));
vm.runInContext(fs.readFileSync(path.join(root,'python-bridge.js'),'utf8'),ctx);const bridge=new ctx.CodyPythonBridge(router,S,signal);assert.equal(await bridge.request('gadget',JSON.stringify({block:'cn_df_busy',target:'SIMULATION',args:{}})),'false');
console.log('PASS: number sequencing, packets, menu/range checks, audio pause/resume/finish/Stop, missing recordings, independent HW/SIM, targets and Python generation/bridge');
})().catch(e=>{console.error(e);process.exitCode=1});
