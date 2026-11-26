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
const archive=require(path.join(root,'project-archive.js')),catalog=JSON.parse(fs.readFileSync(path.join(root,'python-examples.json'),'utf8'));
async function run(kind,target){
 const id='demo-dfplayer-'+kind+'-'+(target==='SIMULATION'?'sim':'hw'),project=await archive.decode(fs.readFileSync(path.join(root,catalog[id].archive))),ws=new ctx.Blockly.Workspace();ctx.Blockly.serialization.workspaces.load(project.workspace,ws);
 const calls=[];let runtime,loops=0,soilReads=0;
 const loopId=ws.getTopBlocks().find(b=>b.type==='cn_event_loop').getInputTargetBlock('DO').id;
 const mock={t:{log(){}},check(type,a,t){assert.equal(t,target);},async wait(ms,signal){signal.throwIfAborted();},async call(type,a,signal,t){this.check(type,a,t);calls.push({type,a});if(type.startsWith('cn_df_')){ctx.CodyDFPlayer.plan(type,a);return;}
  if(type==='cn_air_temperature')return 23.4;if(type==='cn_air_humidity')return 60;if(type==='cn_soil_read')return [20,30,30][Math.min(soilReads++,2)];if(type==='cn_joystick_position')return a.pos==='up'&&loops<=2;if(type==='cn_joystick_click')return loops===4;if(type==='cn_rgb_matrix_set')return;throw Error('Unexpected '+type);
 }};
 runtime=new ctx.BlockRuntime(mock,ctx.HARDWARE_SPECS,(event,id)=>{if(event==='block'&&id===loopId&&++loops>(kind==='plant'?3:kind==='joystick'?4:1))runtime.stop();});try{await runtime.run(ws);}catch(e){if(!/Stopped/.test(e.message))throw e;}ws.dispose();return calls;
}
for(const target of ['SIMULATION','HARDWARE']){
 const basics=await run('basics',target);assert.deepEqual(basics.filter(c=>c.type==='cn_df_volume').map(c=>c.a.volume),[50,25,40]);for(const action of ['pause','resume','stop'])assert(basics.some(c=>c.a.action===action));
 const joystick=await run('joystick',target);assert.deepEqual(joystick.filter(c=>c.type==='cn_df_phrase_wait').map(c=>c.a.phrase),['Up','Click']);
 const weather=await run('weather',target);assert.deepEqual(weather.filter(c=>c.type==='cn_df_number_wait').map(c=>c.a.value),[23.4,60]);assert.deepEqual(weather.filter(c=>c.type==='cn_df_phrase_wait').map(c=>c.a.phrase),['Temperature','Humidity']);
 const plant=await run('plant',target);assert.deepEqual(plant.filter(c=>c.type==='cn_df_phrase_wait').map(c=>c.a.phrase),["I'm thirsty",'I am quenched']);assert(plant.some(c=>c.type==='cn_rgb_matrix_set'&&c.a.color==='#FF0000'));assert(plant.some(c=>c.type==='cn_rgb_matrix_set'&&c.a.color==='#00FF00'));
 console.log('PASS:',target,'Blocks examples: basics controls, joystick edge announcements, weather sensor values and plant threshold transitions');
}
})().catch(e=>{console.error(e);process.exitCode=1});
