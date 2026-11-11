'use strict';
(() => {
 const editor=window.CodyAccountEditor;if(!editor)return;
 let reference=null,legacy=false,epoch=0,resetUI=()=>{};
 const valid=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{24}$/.test(id);
 window.CodyPublication={reference:()=>reference?{...reference}:null,restore(value,options={}){reference=valid(value?.id)?{id:value.id}:null;legacy=!reference&&!!options.legacy;},clear(){reference=null;legacy=false;}};
 const reset=editor.reset;editor.reset=(...args)=>{CodyPublication.clear();epoch++;resetUI();return reset(...args);};
 const toolbar=document.querySelector('.toolbar');
 function toolbarButton(id,label,action){const button=document.createElement('button');button.id=id;button.textContent=label;button.onclick=action;toolbar.insertBefore(button,toolbar.querySelector('.account-controls'));return button;}
 const publishButton=toolbarButton('publishProject','Publish',()=>void open());
 const mine=document.createElement('button');mine.id='myPublishedProjects';mine.type='button';mine.innerHTML='<span class="menu-item-icon" aria-hidden="true">▱</span><span>My published projects</span>';mine.onclick=()=>window.open('/sharing/manage.html','_blank','noopener');document.getElementById('loadNamed').after(mine);
 toolbarButton('publicGallery','Community',()=>window.open('/sharing/gallery.html','_blank','noopener'));
 const dialog=document.createElement('dialog');dialog.className='sharing-dialog';dialog.setAttribute('aria-labelledby','publishHeading');
 dialog.innerHTML=`<form id="publishForm"><div class="dialog-heading"><span class="graphic-badge"><svg aria-hidden="true"><use href="/sharing/icons.svg#publish"></use></svg></span><div><h2 id="publishHeading">Publish project</h2><span id="publishDesigner" class="designer-badge"></span></div></div>
 <p id="publishSummary" class="muted">Blocks and Python will appear in Community.</p>
 <label>Title<input id="publishTitle" maxlength="120" required></label>
 <label>Description<textarea id="publishDescription" maxlength="2000" rows="4" placeholder="What does your project do?"></textarea></label>
 <p id="publishStatus" role="status"></p>
 <div class="share-actions"><button id="publishOpen" type="button" hidden>View project</button><button id="publishCopyLink" type="button" hidden>Copy link</button><button id="publishClose" type="button">Cancel</button><button id="publishConfirm" type="submit">Publish</button></div></form>`;
 document.body.append(dialog);const $=id=>document.getElementById(id);
 let shares=[],csrf='',identity='',busy=false,publication=null,publishedUrl='';
 const say=message=>$('publishStatus').textContent=message;
 resetUI=()=>{dialog.close();$('publishForm').reset();$('publishDesigner').textContent='';shares=[];publication=null;publishedUrl='';identity='';csrf='';$('publishOpen').hidden=true;$('publishCopyLink').hidden=true;lock(false);say('');};
 function lock(value){busy=value;publishButton.disabled=value;for(const id of ['publishTitle','publishDescription','publishClose','publishConfirm'])$(id).disabled=value;}
 async function api(path,method='GET',data){const response=await fetch(path,{method,cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:data?JSON.stringify(data):undefined});const result=await response.json();if(!response.ok)throw Error(result.error||'Publication request failed');return result;}
 function info(){ $('publishHeading').textContent=publication?'Publish changes':'Publish project';$('publishSummary').textContent=publication?'Publish both programs to Community. The existing link stays the same.':'Blocks and Python will appear in Community.'; }
 $('publishClose').onclick=()=>dialog.close();dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 async function open(){
  if(busy)return;if(window.blockProgramRunning){editor.status('Stop the program before publishing.');return;}
  const started=epoch;$('publishForm').reset();$('publishDesigner').textContent='';publication=null;lock(true);say('Loading publication details…');$('publishOpen').hidden=true;$('publishCopyLink').hidden=true;dialog.showModal();
  try{
   const account=await api('/api/me');if(started!==epoch)return;if(!account.user)throw Error('Sign in to publish your project.');identity=account.user.user_id;csrf=account.csrf;
   const owned=(await api('/api/shares')).shares;if(started!==epoch)return;shares=owned;
   let share=reference&&shares.find(item=>item.id===reference.id);
   if(!share&&legacy){const matches=shares.filter(item=>item.title===$('designName').value.trim());if(matches.length===1)share=matches[0];}
   if(share)CodyPublication.restore({id:share.id});
   publication=share||null;$('publishTitle').value=share?.title||$('designName').value.trim()||'My project';$('publishDescription').value=share?.description||'';$('publishDesigner').textContent='Designed by '+(account.user.name||'Student');info();say('');
  }catch(error){if(started===epoch)say(error.message);}finally{if(started===epoch){lock(false);$('publishTitle').focus();}}
 }
 $('publishForm').onsubmit=async event=>{
  event.preventDefault();if(busy)return;const started=epoch;lock(true);say('Publishing…');
  try{
   if(window.blockProgramRunning)throw Error('Stop the program before publishing.');
   const account=await api('/api/me');if(started!==epoch)return;if(!account.user||account.user.user_id!==identity)throw Error('Account changed. Close and reopen Publish.');csrf=account.csrf;
   const data={title:$('publishTitle').value.trim(),description:$('publishDescription').value.trim(),visibility:'public',selection:'both',reviewed:true,public_confirmed:true};
   if(!data.title)throw Error('Enter a title.');
   const project=editor.project();CodyProjectFiles.validate(project);
   const preview=await api('/api/shares/preview','POST',{...data,project});CodyProjectFiles.validate(preview.project);if(started!==epoch)return;
   const existing=publication,saved=await api('/api/shares'+(existing?'/'+existing.id:''),existing?'PUT':'POST',{...data,project:preview.project,...(existing?{revision:existing.revision}:{})});
   if(started!==epoch)return;CodyPublication.restore({id:saved.id});shares=shares.filter(item=>item.id!==saved.id);shares.unshift(saved);
   publication=saved;info();
   publishedUrl=location.origin+'/sharing/#'+saved.token;$('publishOpen').hidden=false;$('publishCopyLink').hidden=false;
   say(existing?'Published changes. The existing link now opens your updated project.':saved.visibility==='public'?'Published in Community.':'Published. Copy the link to send your project to friends and family.');
   editor.status('Published. Save your private project to retain its publication association.');
  }catch(error){if(started===epoch)say(error.message);}finally{if(started===epoch)lock(false);}
 };
 $('publishOpen').onclick=()=>window.open(publishedUrl,'_blank','noopener');
 $('publishCopyLink').onclick=async()=>{try{await navigator.clipboard.writeText(publishedUrl);say('Link copied.');}catch{const input=document.createElement('input');input.value=publishedUrl;dialog.append(input);input.select();const copied=document.execCommand('copy');input.remove();say(copied?'Link copied.':'Use My published projects to copy the link.');}};
})();
