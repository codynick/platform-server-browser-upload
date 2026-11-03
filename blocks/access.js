'use strict';
(()=>{
 const $=id=>document.getElementById(id),ws=window.codyWorkspace;
 if(!ws)return;
 let user=null,access=null,csrf='',checked=false,example=null,grant=null,offset=0,ready=0,pending=false,stopping=false,loading=false,epoch=0,message='';
 const badge={textContent:'',dataset:{}};
 const note=document.createElement('strong');note.id='codeAccess';note.className='access-badge';$('designName').before(note);
 const now=()=>Date.now()/1000+offset;
 function readonly(){return !checked;}
 function flags(){
  const locked=readonly();ws.options.readOnly=locked;
  for(const b of ws.getAllBlocks(false)){b.setEditable(!locked);b.setMovable(!locked);b.setDeletable(!locked);}
  document.body.classList.toggle('code-readonly',locked);
  $('pythonSource').readOnly=locked||!!window.CodyPythonPilot?.running;
 }
 function ui(){
  const running=!!window.blockProgramRunning;
  note.textContent=!checked?'Checking':readonly()?'Read only':'';
  for(const id of ['newProject','menuUpload','importFile','importPythonSource','pythonFile','saveProject','exportPythonSource','saveNamed','menuSave','menuSaveAs','loadNamed']){
   const b=$(id);if(!b)continue;
   const disallowed=!checked||(!user&&['saveNamed','menuSave','menuSaveAs','loadNamed'].includes(id));
   b.disabled=disallowed||((running||pending||loading)&&!['saveProject','exportPythonSource'].includes(id));
   b.classList.toggle('access-disabled',disallowed);b.dataset.accessLabel=disallowed?(!user?'Sign in':'Save As'):'';
   if(disallowed)b.title=!user?'Sign in':'Save As';
  }
  for(const id of ['example','menuExamples','loadExample'])$(id).disabled=running||pending||loading;
  $('saveNamed').textContent=example&&user?'Save As':'Save';
  $('designName').readOnly=!checked;
  const wait=Math.max(0,Math.ceil(ready-now()));
  if(!checked){badge.textContent='Checking';badge.dataset.tone='amber';}
  else if(running&&grant?.deadline){badge.textContent=Math.max(0,Math.ceil(grant.deadline-now()))+'s left';badge.dataset.tone='amber';}
  else if(running&&!grant){badge.textContent='Loading';badge.dataset.tone='amber';}
  else if(!running&&wait&&!example&&!access?.subscribed){badge.textContent='Wait '+wait+'s';badge.dataset.tone='red';}
  else if(message){badge.textContent=message;badge.dataset.tone='red';}
  else{badge.textContent=example?'Example':access?.subscribed?'Subscribed':user?'Ready':'Guest';badge.dataset.tone=access?.subscribed?'green':'amber';}
  if(!running)$('blockRunBtn').disabled=pending||loading||!checked||(!example&&!access?.subscribed&&wait>0);
  const run=$('blockRunBtn'),cooling=!running&&!example&&!access?.subscribed&&wait>0;
  run.textContent=running?(grant?.deadline?'Stop ('+Math.max(0,Math.ceil(grant.deadline-now()))+' sec)':'Stop'):cooling?'Wait ('+wait+' sec)':pending?'Checking':loading?'Loading':message||'Run';
  run.dataset.waiting=String(cooling);run.setAttribute('aria-label',run.textContent);run.title=run.textContent;
  flags();
 }
 async function api(path,data){
  const r=await fetch(path,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(data)});
  const d=await r.json();if(d.server_time)offset=d.server_time-Date.now()/1000;
  if(!r.ok){if(d.ready)ready=d.ready;throw Error(d.error||'Try again');}return d;
 }
 const policy={
  setIdentity(u,a,c){if(user?.user_id!==u?.user_id){epoch++;grant=null;ready=0;}user=u;access=a;csrf=c||'';checked=true;ready=a?.ready??ready;ui();},
  example(id){example=null;message='';ui();},personal(){example=null;message='';ui();},
  loading(value){loading=value;ui();},
  isExample:()=>!!example,canEdit:()=>!readonly(),refresh:ui,
  async begin(){
   if(pending||loading||grant)return false;const started=epoch;pending=true;message='';ui();
   try{const next=await api('/api/run/start',{example,project:example?CodyProjectFiles.capture():undefined});if(started!==epoch)return false;grant=next;ready=grant.ready||0;stopping=false;return true;}
   catch(e){message=e.message==='Wait'?'':e.message==='Sign in required'?'Sign in':'Try again';return false;}
   finally{pending=false;ui();}
  },
  async end(){const previous=grant;grant=null;stopping=false;if(previous?.token){try{const d=await api('/api/run/finish',{token:previous.token});ready=d.ready;}catch{/* Conservative server deadline remains in effect. */}}ui();}
 };
 window.CodyAccess=policy;
 // Browser timers may be throttled. Each runtime operation also checks expiry.
 policy.expired=()=>!!(grant?.deadline&&now()>=grant.deadline);
 policy.check=()=>{if(policy.expired())throw Error('Limit reached');};
 setInterval(()=>{if(policy.expired()&&window.blockProgramRunning&&!stopping){stopping=true;if(window.CodyPythonPilot?.running)void CodyPythonPilot.runOrStop();else $('blockRunBtn').click();}ui();},200);
 ws.addChangeListener(e=>{if(e.type==='create')flags();});
 document.addEventListener('keydown',e=>{if(readonly()&&e.target.closest('.blocklySvg')&&((e.ctrlKey||e.metaKey)&&['v','x','z'].includes(e.key.toLowerCase())||['Delete','Backspace'].includes(e.key))){e.preventDefault();e.stopImmediatePropagation();}},true);
 // Guard file actions even when another editor refreshes its controls.
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const guest=['saveNamed','menuSave','menuSaveAs','loadNamed'];if((!checked||!user)&&guest.includes(b.id)){e.preventDefault();e.stopImmediatePropagation();}},true);
 ui();
})();
