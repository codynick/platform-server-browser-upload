'use strict';
(()=>{
 const stage=window.CodySpriteStage;if(!stage)return;
 const remote=!!window.CODY_STAGE_REMOTE,open=document.getElementById('openStage'),status=document.getElementById('stageConnection');
 const uuid=()=>crypto.randomUUID(),client=uuid(),lease=1200,clients=new Map(),startedAt=Date.now();
 let session=remote?location.hash.slice(1):uuid(),channel=null,epoch=0,running=false,lastSent=0,lastState=0,connected=false,suspended=false;
 let local={keys:[],mouse:{x:0,y:0,down:false},at:0},lastMouse={x:0,y:0,down:false};
 const every=(fn,ms)=>window.CodyScheduler?CodyScheduler.every(fn,ms):(()=>{const id=setInterval(fn,ms);return()=>clearInterval(id);})();
 const send=data=>{try{channel?.postMessage(data);}catch{}};
 const tell=text=>{if(status&&status.textContent!==text)status.textContent=text;};
 function combine(){
  const now=Date.now(),inputs=[local,...clients.values()].filter(v=>v.at&&now-v.at<lease),keys=[...new Set(inputs.flatMap(v=>v.keys))];
  if(inputs.length)lastMouse={...inputs.reduce((a,b)=>a.at>b.at?a:b).mouse};else lastMouse.down=false;
  stage.model.input(keys,lastMouse);
 }
 function publish(force=false){
  if(remote||suspended||!clients.size)return;const now=performance.now();if(!force&&now-lastSent<33)return;lastSent=now;
  send({type:'state',epoch,running,project:stage.snapshotProject()});
 }
 function invalidate(){epoch++;local={keys:[],mouse:{...local.mouse,down:false},at:0};for(const v of clients.values()){v.keys=[];v.mouse.down=false;v.at=0;}stage.model.release();publish(true);}
 function setConnected(value){
  if(connected===value)return;connected=value;
  for(const button of document.querySelectorAll('[data-stage-key]'))button.disabled=!value;
  document.getElementById('stageCanvas')?.setAttribute('aria-disabled',String(!value));
  if(!value){stage.release();tell('Editor unavailable. Keep the editor open and use Open Stage there to reconnect.');}
 }
 function receive(event){
  const m=event.data;if(suspended||!m||typeof m!=='object')return;
  if(remote){
   if(m.type==='closed'){if(m.reason==='account')stage.model.setSettings(CodySpriteModel.defaults());setConnected(false);return;}
   if(m.type!=='state'||!Number.isInteger(m.epoch)||typeof m.running!=='boolean')return;
   try{if(!connected||epoch!==m.epoch){epoch=m.epoch;stage.release();}stage.model.restore(m.project);lastState=Date.now();setConnected(true);tell(m.running?'Connected · Program running':'Connected · Program stopped');}catch{setConnected(false);}return;
  }
  if(typeof m.from!=='string'||m.from.length>80)return;
  if(m.type==='hello'){
   if(!clients.has(m.from)&&clients.size>=8)return;
   if(!clients.has(m.from))clients.set(m.from,{keys:[],mouse:{x:0,y:0,down:false},at:0,seen:Date.now()});
   clients.get(m.from).seen=Date.now();publish(true);return;
  }
  const view=clients.get(m.from);if(!view)return;
  if(m.type==='bye'){clients.delete(m.from);combine();return;}
  if(m.type==='presence'){view.seen=Date.now();return;}
  if(m.type!=='input'||m.epoch!==epoch||!Array.isArray(m.keys)||m.keys.length>5||m.keys.some(k=>!['up','down','left','right','space'].includes(k))||!m.mouse||!Number.isFinite(m.mouse.x)||!Number.isFinite(m.mouse.y)||typeof m.mouse.down!=='boolean')return;
  Object.assign(view,{keys:m.keys,mouse:{x:Math.max(-240,Math.min(240,m.mouse.x)),y:Math.max(-180,Math.min(180,m.mouse.y)),down:m.mouse.down},at:m.active===false?0:Date.now(),seen:Date.now()});combine();
 }
 function connect(){
  if(remote&&!/^[a-f0-9-]{36}$/i.test(session)){tell('Open this stage using Open Stage in your editor.');return;}
  try{channel=new BroadcastChannel('codynick-stage-'+session);channel.onmessage=receive;}
  catch{tell('Separate stage tabs are unavailable in this browser.');if(open){open.removeAttribute('href');open.setAttribute('aria-disabled','true');}return;}
  if(open)open.href='/blocks/stage.html#'+session;
  if(remote){tell('Connecting to the editor…');send({type:'hello',from:client});}
 }
 window.CodyStageLink={
  changed:()=>publish(),resetInputs:()=>{if(!remote)invalidate();},
  input(keys,mouse){local={keys:[...keys],mouse:{...mouse},at:Date.now()};if(remote){if(connected)send({type:'input',from:client,epoch,keys,mouse,active:true});}else combine();},
  releaseLocal(){local={keys:[],mouse:{...local.mouse,down:false},at:0};if(remote){send({type:'input',from:client,epoch,keys:[],mouse:local.mouse,active:false});}else combine();}
 };
 if(remote){
  document.getElementById('stageReset').disabled=true;for(const control of document.querySelectorAll('.stage-settings input,.stage-settings select,.stage-look-picker select'))control.disabled=true;
  for(const button of document.querySelectorAll('[data-stage-key]'))button.disabled=true;
  document.getElementById('stageCanvas').setAttribute('aria-disabled','true');
 }else{
  for(const name of ['restoreProject','setSettings','clear','beginRun']){const original=stage[name];stage[name]=function(...args){invalidate();const result=original.apply(this,args);publish(true);return result;};}
  const original=stage.setRunning;stage.setRunning=function(on){if(running!==on){running=on;invalidate();}original.call(this,on);publish(true);};
  // Account changes detach existing stage tabs before another account's work appears.
  const editor=window.CodyAccountEditor;if(editor){const reset=editor.reset;editor.reset=function(...args){send({type:'closed',reason:'account'});channel?.close();clients.clear();session=uuid();connect();return reset.apply(this,args);};}
 }
 connect();
 every(()=>{
  if(suspended)return;
  if(remote){if(channel&&Date.now()-(lastState||startedAt)>2500){setConnected(false);tell('Editor unavailable. Use Open Stage in the current editor to reconnect.');}send({type:connected?'presence':'hello',from:client});}
  else{for(const [id,v]of clients)if(Date.now()-v.seen>2500)clients.delete(id);combine();if(performance.now()-lastSent>=800)publish(true);}
 },350);
 window.addEventListener('pagehide',()=>{send({type:remote?'bye':'closed',from:client});suspended=true;if(!remote){clients.clear();invalidate();}});
 window.addEventListener('pageshow',e=>{if(e.persisted){suspended=false;if(remote){lastState=0;setConnected(false);send({type:'hello',from:client});}else publish(true);}});
})();
