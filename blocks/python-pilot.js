'use strict';
(() => {
 // The server pilot is enabled by configuration; ?python=0 hides it for a visit.
 const pilotOption=new URLSearchParams(location.search).get('python');
 if(pilotOption==='0'||!(pilotOption==='1'||window.CODY_PYTHON_PILOT_ENABLED))return;
 const $=id=>document.getElementById(id),source=$('pythonSource'),output=$('pythonOutput');
 const fileButtons=['saveNamed','menuSave','loadNamed','menuUpload','saveProject','newProject','importFile'];
 const api={selected:false,running:false,worker:null,dirty:false,controller:null,bridge:null,token:null};
 const blockOptions=$('example').innerHTML;
 const blockFiles={};
 for(const id of ['menuUpload','saveProject','newProject']){const button=$(id);blockFiles[id]={handler:button.onclick,label:button.querySelector('span:last-child').textContent,title:button.title};}
 const bubble=$('pythonHelpBubble');
 const closeInfo=()=>{if(bubble.matches(':popover-open'))bubble.hidePopover();};
 $('pythonInfo').onclick=()=>{
  if(bubble.matches(':popover-open')){bubble.hidePopover();return;}
  bubble.showPopover();const button=$('pythonInfo').getBoundingClientRect(),bounds=bubble.getBoundingClientRect();
  bubble.style.left=Math.max(12,Math.min(button.right-bounds.width,innerWidth-bounds.width-12))+'px';
  bubble.style.top=Math.max(12,Math.min(button.bottom+8,innerHeight-bounds.height-12))+'px';
 };
 bubble.addEventListener('toggle',()=>{$('pythonInfo').setAttribute('aria-expanded',String(bubble.matches(':popover-open')));});
 window.addEventListener('resize',closeInfo);

 const exampleNote=document.querySelector('.examples-note'),blockNote=exampleNote.textContent;
 const status=text=>{const target=$(api.selected?'pythonStatusBar':'workspaceStatus');target.textContent=text;target.title=text;};
 const examplesReady=fetch('python-examples.json').then(r=>{if(!r.ok)throw Error('Cannot load Python examples');return r.json();});
 examplesReady.catch(e=>status(e.message));
 let examples={},heartbeat=null,finishing=null,started=false,workerGeneration=0;
 let blockDesignName=$('designName').value,pythonDesignName='';
 function syncColors(){const colors=$('pythonColors');colors.scrollTop=source.scrollTop;colors.scrollLeft=source.scrollLeft;}
 function lines(){$('pythonColors').innerHTML=window.CodyPythonColor(source.value);syncColors();const count=source.value.split('\n').length;$('pythonLineNumbers').textContent=Array.from({length:count},(_,i)=>i+1).join('\n');source.classList.remove('python-error');}
 function print(text){output.textContent=(output.textContent+'\n'+text).split('\n').slice(-400).join('\n').slice(-60000);output.scrollTop=output.scrollHeight;window.CJP.log('PYTHON '+String(text).slice(0,1000));}
 function controls(){
  document.body.classList.toggle('python-active',api.selected);
  $('blocksEditorTab').setAttribute('aria-selected',String(!api.selected));$('pythonEditorTab').setAttribute('aria-selected',String(api.selected));
  $('toolboxWorkspace').hidden=api.selected;$('pythonPanel').hidden=!api.selected;
  for(const id of ['generalToolboxTab','hardwareToolboxTab','dashboardToolboxTab','spritesToolboxTab'])$(id).hidden=api.selected;
  for(const id of fileButtons)$(id).disabled=id==='saveProject'?false:!!window.blockProgramRunning;
  $('pythonInfo').hidden=!api.selected;$('saveNamed').hidden=false;$('importPythonSource').hidden=!api.selected;$('exportPythonSource').hidden=!api.selected;$('importPythonSource').disabled=api.running;
  for(const [id,label] of Object.entries({menuUpload:'Upload Project',saveProject:'Download Project',newProject:'New Project'})){
   $(id).querySelector('span:last-child').textContent=api.selected?label:blockFiles[id].label;
   $(id).title=api.selected?label:blockFiles[id].title;
  }
  $('viewPython').hidden=api.selected;
  source.readOnly=api.running;
  for(const id of ['pythonFile','blocksEditorTab','pythonEditorTab'])$(id).disabled=api.running;
 }
 async function select(python){
  if(window.blockProgramRunning){status('Stop the running program before changing editors.');return;}
  if(python!==api.selected){if(api.selected)pythonDesignName=$('designName').value;else blockDesignName=$('designName').value;$('designName').value=python?pythonDesignName:blockDesignName;}
  closeInfo();api.selected=python;controls();
  if(python){
   try{examples=await examplesReady;$('example').replaceChildren(...Object.entries(examples).map(([id,e])=>{const o=document.createElement('option');o.value=id;o.textContent=e.title;return o;}));}catch(e){status(e.message);}
   $('examplesTitle').textContent='Complete Examples';exampleNote.textContent='Loads both programs and complete dashboard, simulation and sprite setup. Download your current project first to keep a copy.';status('Python · Ready. Use await for gadget operations and waits.');source.focus();
  }else{$('example').innerHTML=blockOptions;$('examplesTitle').textContent='Complete Examples';exampleNote.textContent=blockNote;window.Blockly.svgResize(window.codyWorkspace);status('Live mode · Ready to edit.');}
 }
 function highlightError(text){
  const matches=[...text.matchAll(/File "program\.py", line (\d+)/g)];
  if(!matches.length)return;const n=Number(matches.at(-1)[1]),parts=source.value.split('\n');
  const from=parts.slice(0,n-1).reduce((sum,s)=>sum+s.length+1,0);source.focus();source.setSelectionRange(from,from+(parts[n-1]?.length||0));source.scrollTop=Math.max(0,(n-4)*22.4);source.classList.add('python-error');syncColors();
 }
 async function finish(message,error=false){
  if(finishing)return finishing;if(!api.running)return;
  finishing=(async()=>{
   api.worker?.terminate();api.worker=null;workerGeneration++;api.controller.abort(Error('Stopped'));window.CodySpriteStage?.release();
   status('Stopping Python… Waiting for any active hardware reply.');
   // Preserve serial exclusivity until an outstanding sensor request settles.
   await api.bridge.router.hardware.tail.catch(()=>{});
   heartbeat?.();heartbeat=null;if(started)window.CodyLiveStore.stop(api.token);started=false;
   api.running=false;window.CodyBlockExecution.lock(false);controls();status(message);print(message);
   if(error){highlightError(message);window.alert('Python program ended with an error:\n\n'+message.slice(-2500));}
  })();
  try{await finishing;}finally{finishing=null;}
 }
 api.runOrStop=async()=>{
  if(api.running){await finish('Python program stopped.');return;}
  if(window.blockProgramRunning||window.CJP.occupied){status('Wait for the current program or connection operation to finish.');return;}
  if(source.value.length>100000){status('Python source must be under 100,000 characters.');return;}
  if(!source.value.trim()){status('Write a program or open a Python example first.');return;}
  const token='python-'+Date.now()+'-'+Math.random();
  try{window.CodyLiveStore.start(token);started=true;}catch(e){status(e.message);return;}
  api.token=token;api.running=true;api.controller=new AbortController();
  api.bridge=new window.CodyPythonBridge(new window.LiveRouter(new window.CjpHardware(window.CJP),window.CodyLiveStore),window.CodyLiveStore,api.controller.signal);
  window.CodyBlockExecution.lock(true);controls();output.textContent='';source.classList.remove('python-error');status('Starting Python…');
  heartbeat=window.CodyScheduler.every(()=>window.CodyLiveStore.heartbeat(token),800);
  const generation=++workerGeneration;let activeRequests=0;
  try{
   const worker=new Worker(new URL('python-worker.mjs',location.href),{type:'module'});api.worker=worker;
   worker.onerror=event=>{event.preventDefault();void finish('Python worker failed to load. Check the Internet connection and reload the local pilot.',true);};
   worker.onmessage=async event=>{
    if(generation!==workerGeneration||!api.running||finishing)return;
    const m=event.data;
    if(m.type==='phase'){status(m.text);print(m.text);return;}
    if(m.type==='output'){print(m.text);return;}
    if(m.type==='done'){await finish('Python program finished.');return;}
    if(m.type==='error'){await finish(m.text,true);return;}
    if(m.type==='notify'){try{api.bridge.notify(m.op,m.json);}catch(e){await finish(e.message,true);}return;}
    if(m.type==='rpc'){
     if(++activeRequests>100){await finish('Too many simultaneous gadget operations. Await calls one at a time.',true);return;}
     try{const result=await api.bridge.request(m.op,m.json);if(generation===workerGeneration&&!finishing)worker.postMessage({type:'reply',id:m.id,result});}
     catch(e){if(generation===workerGeneration&&!finishing)worker.postMessage({type:'reply',id:m.id,error:e.message});}
     finally{activeRequests--;}
    }
   };
   worker.postMessage({type:'run',source:source.value});
  }catch(e){await finish(e.message,true);}
 };
 $('blocksEditorTab').onclick=()=>select(false);$('pythonEditorTab').onclick=()=>select(true);
 $('pythonTabs').hidden=false;
 source.addEventListener('input',()=>{api.dirty=true;lines();});
 source.addEventListener('scroll',()=>{$('pythonLineNumbers').scrollTop=source.scrollTop;syncColors();});
 source.addEventListener('keydown',event=>{
  if(event.key==='Tab'){event.preventDefault();if(!source.readOnly){source.setRangeText('    ',source.selectionStart,source.selectionEnd,'end');api.dirty=true;lines();}}
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void api.runOrStop();}
 });
 $('pythonClearOutput').onclick=()=>{output.textContent='';};
 $('menuUpload').onclick=event=>api.selected?$('pythonFile').click():blockFiles.menuUpload.handler?.(event);
 $('pythonFile').onchange=async()=>{
  try{const f=$('pythonFile').files[0];if(!f)return;if(f.size>100000)throw Error('Python file must be smaller than 100 KB');if(api.dirty&&!confirm('Replace your Python code? Download it first to keep a copy.'))return;source.value=await f.text();api.dirty=false;$('designName').value=f.name.replace(/\.py$/i,'');$('pythonExampleHelp').textContent='Opened '+f.name;closeInfo();lines();status('Opened '+f.name);}catch(e){status(e.message);}finally{$('pythonFile').value='';}
 };
 const downloadPython=()=>{
  const url=URL.createObjectURL(new Blob([source.value],{type:'text/x-python'})),a=document.createElement('a');a.href=url;a.download=(($('designName').value||'CodyNick-program').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').trim().slice(0,100).replace(/\.py$/i,'')||'CodyNick-program')+'.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);api.dirty=false;
 };
 $('saveProject').onclick=event=>api.selected?downloadPython():blockFiles.saveProject.handler?.(event);
 $('newProject').onclick=event=>{
  if(!api.selected)return blockFiles.newProject.handler?.(event);
  if(api.dirty&&!confirm('Start a new Python program? Download your current code first to keep it.'))return;
  source.value='';$('designName').value='';api.dirty=false;
  $('pythonExampleHelp').textContent='Write Python code or open Examples. Gadget operations and wait() use await.';
  closeInfo();lines();status('New Python program · Ready.');source.focus();
 };
 window.addEventListener('cjp-disconnected',()=>{if(api.running&&api.bridge.hardwareUsed)void finish('CJP disconnected. Reconnect it before running again.',true);});
 window.addEventListener('beforeunload',event=>{if(api.dirty||api.running){event.preventDefault();event.returnValue='';}});
 api.exportPythonSource=downloadPython;
 api.markProjectSaved=()=>{api.dirty=false;};
 api.exportProjectState=()=>({source:source.value,names:{blocks:api.selected?blockDesignName:$('designName').value,python:api.selected?$('designName').value:pythonDesignName},language:api.selected?'python':'blocks',help:$('pythonExampleHelp').textContent,console:output.textContent,cursorStart:source.selectionStart,cursorEnd:source.selectionEnd,scrollTop:source.scrollTop,scrollLeft:source.scrollLeft});
 api.restoreProjectState=async data=>{
  blockDesignName=data.names.blocks;pythonDesignName=data.names.python;source.value=data.source;api.dirty=false;lines();
  $('designName').value=api.selected?pythonDesignName:blockDesignName;await select(data.language==='python');
  $('pythonExampleHelp').textContent=data.help;output.textContent=data.console;source.setSelectionRange(Math.min(source.value.length,data.cursorStart),Math.min(source.value.length,data.cursorEnd));source.scrollTop=data.scrollTop;source.scrollLeft=data.scrollLeft;syncColors();
 };
 const blockStatus=window.CodyAccountEditor.status;window.CodyAccountEditor.status=text=>api.selected?status(text):blockStatus(text);
 const reset=window.CodyAccountEditor.reset;window.CodyAccountEditor.reset=()=>{
  if(api.running)void finish('Python stopped because the account changed.');
  blockDesignName='';pythonDesignName='';source.value='# Open Examples to get started.\nprint("Hello, CodyNick!")\n';api.dirty=false;lines();reset();
 };
 if(['localhost','127.0.0.1'].includes(location.hostname))document.body.style.visibility='visible';
 window.CodyPythonPilot=api;lines();controls();
})();
