'use strict';
(() => {
 const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v)),B=window.Blockly,editor=window.CodyAccountEditor;
 const layoutKey='codynick-dashboard-layout-v1',liveFields=['scene','leds','matrix','seven_segment','ultra_segment','widgets'];let busy=false;
 const object=(v,name)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid '+name);return v;};
 const number=(v,lo,hi,name)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error('Invalid '+name);return v;};
 const string=(v,max,name)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid '+name);return v;};
 const say=text=>editor.status(text);
 function stopped(){if(window.blockProgramRunning||window.CodyPythonPilot?.running)throw Error('Stop the program before loading a project.');if(CodyLiveStore.read().run&&Date.now()-CodyLiveStore.read().run.at<3500)throw Error('Stop the Live program running in the other editor tab first.');}
 function validate(s){
  object(s,'project');if(s.format!=='codynick-webserial'||s.version!==3||s.projectSchema!=='codynick-project/1')throw Error('This is not a complete project from this version. Older project formats are not supported.');
  string(s.python,100000,'Python source');object(s.workspace,'Blocks source');if(!Array.isArray(s.workspace.blocks?.blocks))throw Error('Invalid Blocks workspace');
  let count=0;const supported=new Set([...HARDWARE_SPECS.map(s=>s.type),...BlockRuntime.types]);
  function walk(b,depth=0){if(!b)return;if(depth>150||++count>2000||!supported.has(b.type))throw Error('Invalid or unsupported block in project.');for(const input of Object.values(b.inputs||{})){walk(input.block,depth+1);walk(input.shadow,depth+1);}walk(b.next?.block,depth+1);}
  s.workspace.blocks.blocks.forEach(b=>walk(b));
  const temporary=new B.Workspace();try{B.serialization.workspaces.load(s.workspace,temporary);}finally{temporary.dispose();}
  object(s.editor,'editor state');object(s.editor.names,'design names');string(s.editor.names.blocks,120,'Blocks design name');string(s.editor.names.python,120,'Python design name');
  if(!['blocks','python'].includes(s.editor.language)||!['simulator','dashboard','sprites'].includes(s.editor.space)||typeof s.editor.collapsed!=='boolean')throw Error('Invalid selected editor or space.');
  string(s.editor.help,4000,'example description');string(s.editor.console,60000,'Python console');
  for(const key of ['cursorStart','cursorEnd','scrollTop','scrollLeft'])number(s.editor[key],0,10000000,'editor '+key);
  object(s.state,'saved state');const live=object(s.state.live,'simulation/dashboard state');CodyLiveStore.scene(live.scene);
  if(!Array.isArray(live.leds)||live.leds.length!==16||live.leds.some(v=>typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v)))throw Error('Invalid simulated LED state.');
  object(live.matrix,'matrix state');if(!Array.isArray(live.matrix.pixels)||live.matrix.pixels.length!==64||live.matrix.pixels.some(v=>v!==0&&v!==1)||!['pixels','text'].includes(live.matrix.mode))throw Error('Invalid LED matrix state.');
  string(live.matrix.text,200,'matrix text');number(live.matrix.speed,0,2,'matrix speed');number(live.matrix.revision,0,1e12,'matrix revision');string(live.seven_segment,50,'seven segment reading');string(live.ultra_segment,50,'UltraSeg reading');
  object(live.widgets,'dashboard widgets');if(Object.keys(live.widgets).length>100)throw Error('Too many dashboard widgets.');
  for(const [id,w] of Object.entries(live.widgets)){
   object(w,'widget');string(id,120,'widget name');if(w.id!==id||!['info','gauge','graph','led','textarea','button','switch','slider','bar','pie','table'].includes(w.type))throw Error('Invalid dashboard widget.');
   string(w.title,1000,'widget title');if(typeof w.value==='string')string(w.value,200000,'widget value');else if(typeof w.value==='number')number(w.value,-1e15,1e15,'widget value');else if(typeof w.value!=='boolean')throw Error('Invalid dashboard value.');
   if(['button','switch','led'].includes(w.type)&&typeof w.value!=='boolean')throw Error('Invalid boolean widget state.');if(w.type==='slider'){number(w.step,.000001,1e9,'slider step');if(w.max_value<=w.min_value||w.step>w.max_value-w.min_value||typeof w.value!=='number'||w.value<w.min_value||w.value>w.max_value)throw Error('Invalid slider state.');}
   number(w.min_value,-1e15,1e15,'widget minimum');number(w.max_value,-1e15,1e15,'widget maximum');if(!Array.isArray(w.history)||w.history.length>1000)throw Error('Invalid graph history.');
   for(const point of w.history){number(point.x,-1e15,1e15,'graph x');number(point.y,-1e15,1e15,'graph y');}
  }
  object(s.state.layout,'dashboard layout');if(Object.keys(s.state.layout).length>1000)throw Error('Dashboard layout is too large.');for(const r of Object.values(s.state.layout))object(r,'layout position');
  const sprite=new CodySpriteModel();sprite.restore(s.state.sprite);
  const camera=s.state.simulatorView;if(camera!==null){object(camera,'simulation view');number(camera.camera?.scale,.15,3,'simulation zoom');number(camera.camera?.x,-1e7,1e7,'simulation pan');number(camera.camera?.y,-1e7,1e7,'simulation pan');string(camera.selected,50,'selected gadget');}
  if(s.editor.language==='python'&&!window.CodyPythonPilot)throw Error('Enable Python before loading this project.');
  return s;
 }
 function capture(){
  const workspace=B.serialization.workspaces.save(window.codyWorkspace);workspace.blocks??={languageVersion:0,blocks:[]};delete workspace.codynick_live_scene;delete workspace.codynick_sprite_stage;
  const py=window.CodyPythonPilot?.exportProjectState()||{source:$('pythonSource').value,names:{blocks:$('designName').value,python:''},language:'blocks',help:$('pythonExampleHelp').textContent,console:$('pythonOutput').textContent,cursorStart:0,cursorEnd:0,scrollTop:0,scrollLeft:0};
  const {source,...editorState}=py;const state=CodyLiveStore.read(),live={};for(const key of liveFields)live[key]=clone(state[key]);for(const w of Object.values(live.widgets)){delete w.inputAt;delete w.inputOwner;delete w.clicks;if(w.type==='button')w.value=false;}
  let simulatorView=null;try{simulatorView=$('simulatorFrame').contentWindow.CodySimulatorView?.snapshot()||null;}catch{}
  let layout={};try{layout=JSON.parse(localStorage.getItem(layoutKey)||'{}');}catch{}
  return {format:'codynick-webserial',version:3,projectSchema:'codynick-project/1',applicationVersion:window.CODYNICK_VERSION,workspace,python:source,editor:{...editorState,space:['simulator','dashboard','sprites'].find(n=>$('show-'+n).getAttribute('aria-pressed')==='true')||'simulator',collapsed:$('liveMain').classList.contains('stage-collapsed')},state:{live,sprite:CodySpriteStage.snapshotProject(),layout,simulatorView}};
 }
 async function apply(s){
  editor.load(s.workspace);CodyLiveStore.restoreProject(s.state.live);CodySpriteStage.restoreProject(s.state.sprite);
  const clean={};for(const [id,r] of Object.entries(s.state.layout))Object.defineProperty(clean,id,{value:CodyDashboardLayout.clean(r),enumerable:true});
  localStorage.setItem(layoutKey,JSON.stringify(clean));window.dispatchEvent(new StorageEvent('storage',{key:layoutKey,newValue:JSON.stringify(clean)}));
  if(window.CodyPythonPilot)await CodyPythonPilot.restoreProjectState({source:s.python,...s.editor});
  else $('designName').value=s.editor.names.blocks;
  $('liveMain').classList.toggle('stage-collapsed',s.editor.collapsed);$('toggleSpaces').textContent=s.editor.collapsed?'Show Spaces':'Hide Spaces';CodySpaces.show(s.editor.space);B.svgResize(window.codyWorkspace);
  if(s.state.simulatorView)$('simulatorFrame').contentWindow.CodySimulatorView?.restore(s.state.simulatorView);
  const dashboard=$('dashboardFrame').contentWindow;dashboard.CodyDashboardLayoutUI?.reload?.();
 }
 async function loadProject(s){stopped();validate(s);const previous=capture();try{await apply(s);}catch(e){try{await apply(previous);}catch{}throw e;}}
 async function download(){if(busy)return;busy=true;try{const s=capture();validate(s);const bytes=await CodyProjectArchive.encode(s),a=document.createElement('a'),url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));a.href=url;a.download=($('designName').value.trim()||'Untitled').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').slice(0,100)+'.codynick';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);editor.saved();say('Downloaded complete project: Blocks, Python and saved scene state.');}catch(e){say(e.message);alert(e.message);}finally{busy=false;}}
 $('saveProject').onclick=download;$('menuUpload').onclick=()=>$('importFile').click();$('importFile').accept='.codynick';
 $('importFile').onchange=async()=>{try{stopped();const f=$('importFile').files[0];if(!f)return;if(f.size>8*1024*1024)throw Error('Project archive must be smaller than 8 MB.');const s=validate(await CodyProjectArchive.decode(await f.arrayBuffer()));if(!confirm('Replace both programs and saved scene state? Download your current project first to keep it.'))return;await loadProject(s);say('Complete project loaded. Programs remain stopped.');}catch(e){say('Project upload failed: '+e.message);alert('Project upload failed: '+e.message);}finally{$('importFile').value='';}};
 $('newProject').onclick=async()=>{try{stopped();if(!confirm('Create a new project? This clears both programs and all simulated/dashboard/sprite state. Download first to keep the current project.'))return;const s=capture();s.workspace={blocks:{languageVersion:0,blocks:[]}};s.python='';s.editor={...s.editor,names:{blocks:'',python:''},help:'Open Examples to begin.',console:'',cursorStart:0,cursorEnd:0,scrollTop:0,scrollLeft:0};const base=CodyLiveStore.defaults();for(const key of liveFields)s.state.live[key]=clone(base[key]);const model=new CodySpriteModel();s.state.sprite=model.snapshotProject();s.state.layout={};s.state.simulatorView=null;await loadProject(s);say('New project · Ready.');}catch(e){say(e.message);alert(e.message);}};
 $('importPythonSource').onclick=()=>$('pythonFile').click();$('exportPythonSource').onclick=()=>CodyPythonPilot.exportPythonSource();
 editor.project=capture;editor.loadProject=loadProject;editor.saved=()=>window.CodyPythonPilot?.markProjectSaved();
 // Examples are full projects, regardless of which coding editor is selected.
 let exampleBusy=false;
 $('loadExample').onclick=async()=>{
  if(exampleBusy)return;exampleBusy=true;const run=$('blockRunBtn'),previousDisabled=run.disabled;let locked=false;
  try{
   stopped();const id=$('example').value;if(!id)return;run.disabled=true;locked=true;say('Loading complete example…');
   const metadataResponse=await fetch('python-examples.json',{cache:'no-cache'});if(!metadataResponse.ok)throw Error('Cannot load example catalogue.');
   const entry=(await metadataResponse.json())[id];if(!entry||!/^examples\/[A-Za-z0-9-]+\.codynick$/.test(entry.archive))throw Error('Unknown example archive.');
   const response=await fetch(entry.archive,{cache:'no-cache'});if(!response.ok)throw Error('Cannot download example: '+entry.title);
   const project=validate(await CodyProjectArchive.decode(await response.arrayBuffer()));
   const selected=window.CodyPythonPilot?.selected?'python':'blocks';
   if(!confirm('Load “'+entry.title+'”? This replaces both Blocks and Python programs, dashboard widgets/layout, simulation and sprite settings. Download your current project first to keep it.'))return;
   project.editor.language=selected;await loadProject(project);$('examplesDialog').close();say('Loaded '+entry.title+' · Both programs and scene setup restored. Programs remain stopped.');
  }catch(e){say('Example could not load: '+e.message);alert('Example could not load: '+e.message);}finally{if(locked)run.disabled=previousDisabled;exampleBusy=false;}
 };
 window.CodyProjectFiles={capture,validate,loadProject,read:CodyProjectArchive.decode,download};
})();
