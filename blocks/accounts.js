'use strict';
(async()=>{
 const editor=window.CodyAccountEditor,get=id=>document.getElementById(id),GUEST='__guest__';
 const readMarker=()=>{try{return localStorage.getItem('codynick-active-account')||GUEST;}catch{return GUEST;}};
 let observed=readMarker(),user=null,csrf=null,generation=0,projectEpoch=0,current=null,busy=false,accountChecked=false,checking=false,refreshPending=false,reloading=false;
 const requests=new Set(),sign=get('accountSignIn'),out=get('accountSignOut'),label=get('accountName');
 const say=message=>{if(editor)editor.status(message);};
 function visible(){document.documentElement.classList.remove('account-verifying');}
 function display(offline=false){if(!editor)return;label.textContent=user?(user.name||user.user_id):'Guest';sign.hidden=!!user;out.hidden=!user;sign.disabled=false;out.disabled=false;label.title=offline?'Account service unavailable. Guest mode is available; account connection retries automatically.':'';}
 function invalidate(){generation++;projectEpoch++;for(const controller of requests)controller.abort();requests.clear();current=null;busy=false;user=null;csrf=null;}
 function clearContent(wipe){editor?.setGuest(false);editor?.reset();if(wipe){window.CodyLiveStore?.reset();localStorage.removeItem('codynick-dashboard-layout-v1');}if(!editor){window.CodyAccountViewReset?.();const grid=get('dashboardGrid');if(grid)grid.replaceChildren();window.dispatchEvent(new Event('codynick-live-change'));}}
 function transition(marker,{broadcast=false,wipe=false}={}){
  if(observed===marker)return false;
  invalidate();observed=marker;clearContent(wipe);
  if(broadcast)localStorage.setItem('codynick-active-account',marker);
  return true;
 }
 function stale(){const error=Error('The account or project changed while the request was running.');error.stale=true;return error;}
 async function api(path,method='GET',data,scoped=true){
  if(scoped&&!user)throw Error('Sign in to access private projects. Guest work can be downloaded.');
  const started=generation,owner=user?.user_id,controller=new AbortController();requests.add(controller);
  const timeout=setTimeout(()=>controller.abort(),6000);
  try{
   const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf||''},body:data?JSON.stringify(data):undefined});
   const result=await response.json();
   if(started!==generation||(scoped&&owner!==user?.user_id))throw stale();
   if(!response.ok){if(scoped&&response.status===401){void check();}throw Error(result.error||'Account request failed');}
   return result;
  }catch(error){if(started!==generation)throw stale();throw error;}finally{clearTimeout(timeout);requests.delete(controller);}
 }
 async function check(){
  if(checking){refreshPending=true;return;}checking=true;
  const started=generation;
  try{
   const data=await api('/api/me','GET',undefined,false);if(started!==generation)return;const first=!accountChecked;accountChecked=true;
   const marker=data.user?.user_id||GUEST,previous=readMarker(),changed=transition(marker,{broadcast:previous!==marker,wipe:previous!==marker});
   user=data.user;csrf=data.csrf;
   if(previous!==marker)localStorage.setItem('codynick-active-account',marker);
   editor?.setGuest(!user,changed&&!user);
   display();visible();if(changed||first)say(user?'Signed in. Open or save your private projects.':'Guest mode. Use Upload/Download, or sign in for private Save/Load.');
  }catch(error){
   if(error.stale)return;
   // Unknown identity must not expose an earlier private workspace. Guest work remains usable.
   if(user||observed!==GUEST){invalidate();clearContent(true);observed=GUEST;editor?.setGuest(true,true);}else editor?.setGuest(true);
   user=null;csrf=null;display(true);visible();say('Guest mode — account service unavailable. Save/Load will reconnect automatically.');
  }finally{checking=false;if(refreshPending){refreshPending=false;void check();}}
 }
 window.CodyAccounts={get generation(){return generation;},projectReplaced(){projectEpoch++;current=null;},check};
 if(editor){
  sign.onclick=()=>{if(confirm('Sign in reloads the editor. Download unsaved changes first. Continue?'))location.href='/auth/login';};
  out.onclick=async()=>{
   if(busy||!confirm('Sign out of CodyNick and the central account? Download unsaved changes first.'))return;
   busy=true;const started=generation;
   try{const result=await api('/auth/logout','POST');transition(GUEST,{broadcast:true,wipe:true});editor.setGuest(true,true);display();visible();const target=new URL(result.logout_url,location.href);location.href=target.protocol==='https:'?target.href:'/blocks/';}
   catch(error){if(!error.stale)say(error.message);}finally{if(started===generation)busy=false;}
  };
  get('saveNamed').onclick=async()=>{
   if(busy)return;if(!user){say('Guest mode: sign in to Save Project, or use Download Project.');return;}
   busy=true;const started=generation,epoch=projectEpoch;
   try{const title=get('designName').value.trim()||'Untitled',existing=current&&current.title===title,data={title,project:editor.project()};if(existing)data.revision=current.revision;
    const result=await api('/api/projects'+(existing?'/'+encodeURIComponent(current.id):''),existing?'PUT':'POST',data);
    if(epoch===projectEpoch){current=result;say('Saved privately to your account.');}else say('The earlier project was saved. Your current workspace is unchanged.');
   }catch(error){if(!error.stale)say(error.message);}finally{if(started===generation)busy=false;}
  };
  get('loadNamed').onclick=async()=>{
   if(window.blockProgramRunning){say('Stop the program before loading.');return;}
   if(!user){say('Guest mode: sign in to Load Project, or use Upload Project.');return;}
   const epoch=projectEpoch;
   try{const data=await api('/api/projects');if(epoch!==projectEpoch)return;const select=get('designList');select.replaceChildren();
    for(const item of data.projects){const option=document.createElement('option');option.value=item.id;option.textContent=item.title;select.append(option);}
    for(const name of Object.keys(editor.legacy())){const option=document.createElement('option');option.value='browser:'+name;option.textContent='Import browser copy: '+name;select.append(option);}
    get('designDialogTitle').textContent='My private projects';get('designListStatus').textContent='Account projects are private. Browser copies are imported only when selected.';get('designDialog').showModal();
   }catch(error){if(!error.stale)say(error.message);}
  };
  get('loadNamedConfirm').onclick=async()=>{
   if(!user||window.blockProgramRunning)return;const epoch=projectEpoch;
   try{const id=get('designList').value;if(!id)return;let loaded;
    if(id.startsWith('browser:')){const title=id.slice(8),workspace=editor.legacy()[title];if(!workspace)return;loaded={title,project:{workspace}};}
    else loaded=await api('/api/projects/'+encodeURIComponent(id));
    if(epoch!==projectEpoch||!user)return;
    if(!confirm('Replace the workspace with “'+loaded.title+'”? Download unsaved work first.'))return;
    editor.load(loaded.project.workspace);projectEpoch++;current=loaded.id?{id:loaded.id,title:loaded.title,revision:loaded.revision}:null;get('designName').value=loaded.title;get('designDialog').close();say(loaded.id?'Private project loaded.':'Browser copy imported. Choose Save Project to store it in your account.');
   }catch(error){if(!error.stale)say(error.message);}
  };
  const del=document.createElement('button');del.id='deleteAccountProject';del.textContent='Delete selected';document.querySelector('#designDialog .design-actions').prepend(del);
  del.onclick=async()=>{const id=get('designList').value;if(!user||!id||id.startsWith('browser:')||window.blockProgramRunning)return;if(!confirm('Permanently delete the selected account project?'))return;
   try{await api('/api/projects/'+encodeURIComponent(id),'DELETE');if(current?.id===id)current=null;get('designDialog').close();say('Private project deleted.');}catch(error){if(!error.stale)say(error.message);}
  };
 }
 window.addEventListener('storage',event=>{if(event.key!=='codynick-active-account'&&event.key!==null)return;const marker=readMarker();if(transition(marker,{wipe:false}))accountChecked=false;if(editor)editor.setGuest(marker===GUEST,marker===GUEST);display();if(checking)refreshPending=true;else void check();});
 await check();setInterval(()=>{if(!document.hidden)void check();},15000);window.addEventListener('focus',()=>void check());
})();
