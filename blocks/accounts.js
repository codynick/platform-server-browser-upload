'use strict';
(async()=>{
 const editor=window.CodyAccountEditor;
 const initialAccount=localStorage.getItem('codynick-active-account');

 let user,csrf,current=null,checked=false,busy=false;
 let observed=initialAccount,generation=0,reloading=false;
 const toolbar=editor?document.querySelector('.toolbar'):null;
 const sign=document.createElement('button'),out=document.createElement('button');
 sign.id='accountButton';sign.textContent='Sign in';out.id='accountSignOut';out.textContent='Sign out';out.setAttribute('role','menuitem');
 const account=document.createElement('div');account.className='account-controls';account.setAttribute('aria-label','CodyNick account');
 const menu=document.createElement('div');menu.id='accountMenu';menu.className='account-menu';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Account');
 const subscription=document.createElement('button');subscription.id='accountSubscription';subscription.textContent='Subscription';subscription.setAttribute('role','menuitem');subscription.setAttribute('aria-expanded','false');subscription.setAttribute('aria-controls','subscriptionStatus');
 const status=document.createElement('div');status.id='subscriptionStatus';status.hidden=true;status.className='subscription-status';status.setAttribute('role','status');
 const admin=document.createElement('a');admin.id='adminLink';admin.href='/admin/';admin.textContent='Admin Panel';admin.setAttribute('role','menuitem');admin.hidden=true;
 menu.append(subscription,status,admin,out);account.append(sign,menu);if(toolbar)toolbar.append(account);
 function closeMenu(focus=false){menu.hidden=true;sign.setAttribute('aria-expanded','false');if(focus)sign.focus();}
 sign.onclick=()=>{if(!user){if(confirm('Sign in? Unsaved changes will close.'))location.href='/auth/login';return;}menu.hidden=!menu.hidden;sign.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)subscription.focus();};
 subscription.onclick=()=>{status.hidden=!status.hidden;subscription.setAttribute('aria-expanded',String(!status.hidden));};
 document.addEventListener('click',e=>{if(!account.contains(e.target))closeMenu();});
 account.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeMenu(true);e.preventDefault();return;}
  const items=[subscription,admin,out].filter(n=>!n.hidden),index=items.indexOf(document.activeElement);
  if(!menu.hidden&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?(index+1)%items.length:(index-1+items.length)%items.length;items[next].focus();}
 });
 account.addEventListener('keydown',e=>{if(e.key==='Tab')setTimeout(()=>{if(!account.contains(document.activeElement))closeMenu();},0);});
 function showAccount(access){
  sign.hidden=false;sign.disabled=false;out.disabled=false;sign.textContent=user?(user.name||user.user_id):'Sign in';
  sign.title=user?(user.name||user.user_id):'Sign in';
  if(user){sign.setAttribute('aria-haspopup','menu');sign.setAttribute('aria-expanded',String(!menu.hidden));sign.setAttribute('aria-controls','accountMenu');}
  else{closeMenu();sign.removeAttribute('aria-haspopup');sign.removeAttribute('aria-controls');}
  admin.hidden=!user||access?.role!=='admin';out.hidden=!user;subscription.hidden=!user;
  const now=access?.server_time||Date.now()/1000;
  const text=access?.unlimited?'Unlimited':access?.subscribed?'Subscribed':access?.plan?(access.ends&&access.ends<=now?'Expired':access.starts>now?'Scheduled':'Free'):'Free';
  const strong=document.createElement('strong');strong.textContent=text;strong.className=['Subscribed','Unlimited'].includes(text)?'subscription-active':'subscription-inactive';status.replaceChildren(strong);
  if(access?.plan&&access.role!=='admin'&&access.plan!=='Unlimited'){const plan=document.createElement('span');plan.textContent=access.plan;status.append(plan);}
  if(access?.plan&&access.ends&&access.role!=='admin'){const end=document.createElement('span');end.textContent='Ends '+new Date(access.ends*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})+' (UTC)';status.append(end);}
  if(text==='Scheduled'){const start=document.createElement('span');start.textContent='Starts '+new Date(access.starts*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})+' (UTC)';status.append(start);}
 }
 const say=m=>editor?editor.status(m):console.info(m);
 async function api(path,method='GET',data){
  const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf||''},body:data?JSON.stringify(data):undefined});
  const result=await r.json();if(!r.ok)throw Error(result.error||'Request failed');return result;
 }
 function clear(wipe){
  editor?.reset();window.CodyAccess?.personal();current=null;document.getElementById('saveAsDialog')?.close();
  if(wipe)for(const k of ['codynick-live-state-v1','codynick-dashboard-layout-v1'])localStorage.removeItem(k);
  // The editor resets in place: reloading it also recreates both live iframes.
  // Each standalone/embedded live view reloads at most once to drop its memory.
  if(!editor&&!reloading){reloading=true;location.reload();}
 }
 function accountChanged(marker,wipe){
  if(observed===marker)return;
  observed=marker;generation++;user=null;csrf=null;current=null;
  closeMenu();showAccount(null);window.CodyAccess?.setIdentity(null,null,'');
  document.body.style.visibility='hidden';
  clear(wipe);
 }
 let checking=false,refreshPending=false;
 async function check(){
  if(checking||reloading)return;checking=true;
  const started=generation;
  try{
   const data=await api('/api/me'),next=data.user?.user_id||null;
   // Discard an answer started before another tab's account transition.
   if(started!==generation)return;
   const marker=next||'__guest__';
   const previous=localStorage.getItem('codynick-active-account');
   accountChanged(marker,previous!==marker);
   if(previous!==marker)localStorage.setItem('codynick-active-account',marker);
   user=data.user;csrf=data.csrf;checked=true;window.CodyAccess?.setIdentity(user,data.access,csrf);
   if(reloading)return;
   document.body.style.visibility='visible';showAccount(data.access);
  }catch(e){sign.disabled=true;out.disabled=true;sign.title='Account service unavailable. Reload to retry.';csrf=null;}finally{checking=false;if(refreshPending){refreshPending=false;void check();}}
 }
 out.onclick=async()=>{closeMenu();if(busy||!confirm('Sign out? Unsaved changes will close.'))return;busy=true;try{const result=await api('/auth/logout','POST');accountChanged('__guest__',true);localStorage.setItem('codynick-active-account','__guest__');location.href=result.logout_url;}catch(e){say(e.message);}finally{busy=false;}};
 if(editor){
  const examples=document.getElementById('headerExamples');
  if(examples)examples.onclick=()=>document.getElementById('menuExamples').click();
  const save=async(asNew=false,newTitle=null)=>{
   if(busy)return;
   if(!user){say('Sign in to save a private account project, or use Download Project.');return;}
   busy=true;const saveGeneration=generation;
   try{
    const title=newTitle||document.getElementById('designName').value.trim()||'Untitled';
    const data={title,project:editor.project()};if(asNew){data.project.editor.names={blocks:title,python:title};}if(new TextEncoder().encode(JSON.stringify(data)).length>1900000)throw Error('This project is too large for account saving. Download .codynick instead.');
    // A changed title creates a new project; same title updates only the loaded/saved project.
    const existing=!asNew&&current&&current.title===title;
    if(existing)data.revision=current.revision;
    const saved=await api('/api/projects'+(existing?'/'+current.id:''),existing?'PUT':'POST',data);
    if(saveGeneration!==generation||!user)return false;
    if(asNew){await editor.loadProject(data.project);window.CodyPythonPilot?.renameProject(title);document.getElementById('designName').value=title;window.CodyAccess?.personal();}current=saved;editor.saved?.();say('Saved');return true;
   }catch(e){say('Try again');return false;}finally{busy=false;}
  };
  const dialog=document.createElement('dialog');dialog.id='saveAsDialog';dialog.className='save-as-dialog';dialog.setAttribute('aria-labelledby','saveAsHeading');
  dialog.innerHTML='<form id="saveAsForm"><h2 id="saveAsHeading">Save As</h2><label for="saveAsName">Project name</label><input id="saveAsName" name="title" maxlength="120" required autocomplete="off"><strong id="saveAsStatus" role="status"></strong><div class="save-as-actions"><button id="saveAsCancel" type="button">Cancel</button><button id="saveAsConfirm" type="submit">Save</button></div></form>';
  document.body.append(dialog);const name=document.getElementById('saveAsName'),saveStatus=document.getElementById('saveAsStatus'),confirmSave=document.getElementById('saveAsConfirm'),cancelSave=document.getElementById('saveAsCancel');
  function openSaveAs(){if(!user||busy||window.blockProgramRunning)return;name.value='';name.placeholder=document.getElementById('designName').value.trim();saveStatus.textContent='';dialog.showModal();name.focus();}
  document.getElementById('saveNamed').onclick=()=>window.CodyAccess?.isExample()?openSaveAs():save();
  document.getElementById('menuSaveAs').onclick=openSaveAs;
  cancelSave.onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  document.getElementById('saveAsForm').onsubmit=async e=>{e.preventDefault();if(busy)return;const title=name.value.trim();if(!title||window.CodyAccess?.isExample()&&title===document.getElementById('designName').value.trim()){saveStatus.textContent='Choose name';name.focus();return;}confirmSave.disabled=true;cancelSave.disabled=true;saveStatus.textContent='Saving';try{if(await save(true,title))dialog.close();else saveStatus.textContent='Try again';}finally{confirmSave.disabled=false;cancelSave.disabled=false;}};
  document.getElementById('loadNamed').onclick=async()=>{
   if(window.blockProgramRunning){say('Stop the program before loading.');return;}
   try{
    if(!user)throw Error('Sign in to load your account projects.');
    const data=await api('/api/projects');const select=document.getElementById('designList');select.replaceChildren();
    for(const p of data.projects){const o=document.createElement('option');o.value=p.id;o.textContent=p.title;select.append(o);}
    document.getElementById('designDialogTitle').textContent='My private projects';document.getElementById('designListStatus').textContent='Saved in your CodyNick account';
    document.getElementById('designDialog').showModal();
   }catch(e){say(e.message);}
  };
  document.getElementById('loadNamedConfirm').onclick=async()=>{
   try{
    const id=document.getElementById('designList').value;if(!id)return;
    const p=await api('/api/projects/'+id);
    if(!confirm('Replace the workspace with “'+p.title+'”? Download unsaved work first.'))return;
    await (editor.loadProject?editor.loadProject(p.project):editor.load(p.project.workspace));current={id:p.id,title:p.title,revision:p.revision};document.getElementById('designName').value=p.title;document.getElementById('designDialog').close();say('Private project loaded.');
   }catch(e){say(e.message);}
  };
  const del=document.createElement('button');del.textContent='Delete selected';document.querySelector('#designDialog .design-actions').prepend(del);
  del.onclick=async()=>{const id=document.getElementById('designList').value;if(!id||!confirm('Permanently delete the selected account project?'))return;try{await api('/api/projects/'+id,'DELETE');if(current?.id===id)current=null;document.getElementById('designDialog').close();say('Project deleted.');}catch(e){say(e.message);}};
  for(const id of ['newProject','loadExample','importFile'])document.getElementById(id).addEventListener(id==='importFile'?'change':'click',()=>{current=null;});
 }
 window.addEventListener('storage',e=>{
  if(e.key!=='codynick-active-account')return;
  // Storage notifications are one-way: never echo a notification or write back
  // a cached identity. Checking happens on the next poll/focus after cleanup.
  const marker=localStorage.getItem('codynick-active-account');
  accountChanged(marker,false);
  if(checking)refreshPending=true;else void check();
 });
 await check();setInterval(()=>{if(!document.hidden)return check();},15000);window.addEventListener('focus',check);
})();
