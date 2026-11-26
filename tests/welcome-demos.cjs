const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'../blocks');const target=new EventTarget(),els={},sent=[],alerts=[];const element=()=>({children:[],style:{},textContent:'',hidden:false,value:'',files:[],append(b){this.children.push(b)},close(){this.open=false;},setAttribute(){},classList:{add(){},remove(){}}});
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,structuredClone,performance,AbortController,Event,CustomEvent,TextEncoder,TextDecoder,Blob,URL,queueMicrotask,confirm:()=>true,alert:message=>alerts.push(message),requestAnimationFrame:f=>f(),localStorage:{data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)}},document:{getElementById:id=>els[id]??=element(),createElement:element}};ctx.window=ctx;ctx.addEventListener=target.addEventListener.bind(target);ctx.removeEventListener=target.removeEventListener.bind(target);ctx.dispatchEvent=target.dispatchEvent.bind(target);vm.createContext(ctx);

ctx.document.createElementNS=(ns,name)=>({nodeType:1,nodeName:name,children:[],attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},appendChild(c){this.children.push(c);return c},cloneNode(){return this},hasChildNodes(){return !!this.children.length},hasAttributes(){return !!Object.keys(this.attrs).length}});
ctx.document.createTextNode=text=>({nodeType:3,textContent:text});
vm.runInContext(fs.readFileSync(path.join(root,'vendor/blockly/blockly.min.js'),'utf8'),ctx);ctx.Blockly.inject=()=>new ctx.Blockly.Workspace();ctx.Blockly.svgResize=()=>{};ctx.CJP={connected:true,controls(){},notice(){},preview(){},log(){},send:async s=>{assert(s.length<=20);sent.push(s);},raw:async()=>{},fault(){}};
ctx.document.addEventListener=target.addEventListener.bind(target);ctx.document.removeEventListener=target.removeEventListener.bind(target);
for(const f of ['hardware.js','runtime.js','block-specs.js','editor-interactions.js','live-store.js','live-router.js','dashboard-blocks.js','blocks.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});ctx.codyWorkspace.highlightBlock=()=>{};




const projects={},mapping=[[0,1,2,3],[7,6,5,4],[8,9,10,11],[15,14,13,12]];
async function test(id,o={}){
 const ws=new ctx.Blockly.Workspace();ctx.Blockly.serialization.workspaces.load(projects[id].workspace,ws);
 let clock=0,cycles=0,ticks=0,clicks=0,r;const calls=[],frames=[],leds=Array(16).fill('#000000');ctx.performance={now:()=>clock};
 const vars=()=>Object.fromEntries(ws.getVariableMap().getAllVariables().map(v=>[v.name,r.vars.get(v.getId())]));
 const hw={t:{log(){}},check(type,a,target){assert.equal(target,id.endsWith('-sim')?'SIMULATION':'HARDWARE');},async wait(ms,signal){signal.throwIfAborted();clock+=ms;if(++ticks>150000)throw Error('Runaway '+id);if(ms===50){frames.push([...leds]);if(++cycles>=(o.cycles||1))r.stop();}},async call(type,a,signal,target){this.check(type,a,target);calls.push({type,a,clock});
 if(type==='cn_joystick_click')return id.includes('pattern-memory')?(++clicks%2===1):!!o.click;
 if(type==='cn_joystick_position'){if(!id.includes('pattern-memory'))return a.pos===o.direction;const v=vars();return !o.timeout&&v.answer===-1&&a.pos===['up','right','down','left'][o.wrong?(v.expected+1)%4:v.expected];}
 if(type==='cn_rgb_matrix_clear'){leds.fill('#000000');return;}
 if(type==='cn_rgb_matrix_set'||type==='cn_rgb_led_percent'){assert(Number.isInteger(a.led)&&a.led>=0&&a.led<16);leds[a.led]=a.color||'#000000';return;}
 if(type==='cn_rgb_matrix_set_xy'){assert(Number.isInteger(a.x)&&a.x>=0&&a.x<4&&Number.isInteger(a.y)&&a.y>=0&&a.y<4);leds[mapping[a.y][a.x]]=a.color;return;}
 throw Error('Unexpected '+type);
 }};r=new ctx.BlockRuntime(hw,ctx.HARDWARE_SPECS);try{await r.run(ws);}catch(e){if(!/Stopped/.test(e.message))throw e;}const result={vars:vars(),calls,frames,clock};ws.dispose();return result;
}
(async()=>{
const catalog=JSON.parse(fs.readFileSync(path.join(root,'python-examples.json'))),archive=require(path.join(root,'project-archive.js'));for(const [id,e]of Object.entries(catalog))if(/^demo-(joy-pixel|mood-light|speed-switch|countdown-signal|pattern-memory)/.test(id)){projects[id]=await archive.decode(fs.readFileSync(path.join(root,e.archive)));}
for(const suffix of ['sim','hw']){
 for(const [direction,x,y]of [['up',1,0],['right',3,1],['down',1,3],['left',0,1]]){const s=await test('demo-joy-pixel-walker-'+suffix,{direction,cycles:12});assert.equal(s.vars.x,x);assert.equal(s.vars.y,y);assert(s.frames.every(f=>f.filter(c=>c!=='#000000').length===1));}
 const fast=await test('demo-speed-switch-'+suffix,{click:true,direction:'right',cycles:5});assert.equal(fast.vars.fast,true);assert.equal(fast.vars.move_seconds,.08);assert.equal(fast.vars.x,3);
 const slow=await test('demo-speed-switch-'+suffix,{cycles:2});assert.equal(slow.vars.fast,false);assert.equal(slow.vars.move_seconds,.3);
 const mood=await test('demo-mood-light-composer-'+suffix);for(const color of ['#0000FF','#FFFF00','#FF0000'])assert(mood.calls.some(c=>c.a.color===color));assert(mood.clock>=6000);
 const cd=await test('demo-countdown-signal-'+suffix);assert.deepEqual(cd.calls.filter(c=>c.type==='cn_rgb_led_percent').map(c=>c.a.led),Array.from({length:16},(_,i)=>15-i));for(const color of ['#FFFF00','#FF0000'])assert(cd.calls.some(c=>c.a.color===color));
 for(const mode of ['correct','wrong','timeout']){const s=await test('demo-pattern-memory-'+suffix,{cycles:mode==='correct'?6:1,wrong:mode==='wrong',timeout:mode==='timeout'});assert.equal(s.vars.playing,false);assert.equal(s.vars.length,mode==='correct'?6:1);if(mode==='timeout')assert(s.clock>=10000);assert(s.calls.some(c=>c.a.color===(mode==='correct'?'#FFFFFF':'#FF0000')));}
 console.log('PASS:',suffix,'boundary/one pixel, click-edge/speeds, three moods, 16-step countdown, memory six-round win/wrong/timeout');
}
})().catch(e=>{console.error(e);process.exitCode=1});
