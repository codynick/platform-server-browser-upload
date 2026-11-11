'use strict';
(async()=>{
 const $=id=>document.getElementById(id);let csrf='',selected=null,rows=[],busy=false,userUnlimited=false,defaults=null;
 const dateValue=v=>v==null?'':new Date(v*1000).toISOString().slice(0,19);
 const dateSeconds=v=>v?Math.floor(Date.parse(v+'Z')/1000):null;
 const say=(text,tone='amber')=>{$('status').textContent=text;$('status').dataset.tone=tone;};
 const label=a=>a.unlimited?'Unlimited':a.subscribed?'Subscribed':'Free';
 async function api(path,method='GET',data){const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:data?JSON.stringify(data):undefined});const d=await r.json();if(!r.ok)throw Error(r.status===403?'Admin only':r.status===409?(path==='/api/admin/defaults'?(d.error||'Reload defaults'):'Keep admin'):r.status===400?'Check fields':d.error||'Try again');return d;}
 function controls(){
  for(const id of ['defaultSeconds','defaultCooldown','saveDefaults'])$(id).disabled=busy;
  const disabled=!selected||busy,admin=$('role').value==='admin';
  $('role').disabled=disabled;$('unlimited').checked=admin||userUnlimited;$('unlimited').disabled=disabled||admin;
  $('seconds').disabled=disabled||admin||userUnlimited;$('cooldown').disabled=disabled||admin||userUnlimited;
  for(const id of ['starts','ends'])$(id).disabled=disabled||admin||userUnlimited;
  $('dateStatus').textContent=admin||userUnlimited?'Unlimited overrides subscription dates. Dates are preserved.':'An active subscription allows unlimited running. Dates use UTC.';$('save').disabled=disabled;$('users').disabled=busy;
 }
 function select(){
  selected=rows.find(u=>u.id===$('users').value)||null;
  if(selected){const a=selected.access;$('name').textContent=selected.name||selected.id;$('uid').textContent=selected.id;$('email').value=selected.email||'Not provided';$('starts').value=dateValue(a.starts);$('ends').value=dateValue(a.ends);$('role').value=a.role;$('seconds').value=a.seconds;$('cooldown').value=a.cooldown??10;
   const now=a.server_time||Date.now()/1000;userUnlimited=!!a.unlimited_override;
   const option=$('users').selectedOptions[0];if(option)option.textContent=(selected.name||selected.id)+' · '+(selected.email||'Not provided')+' · '+label(a);say(label(a),a.subscribed?'green':'amber');
  }controls();
 }
 async function find(){const d=await api('/api/admin/users?q='+encodeURIComponent($('query').value));rows=d.users;$('users').replaceChildren(...rows.map(u=>{const o=document.createElement('option');o.value=u.id;o.textContent=(u.name||u.id)+' · '+(u.email||'Not provided')+' · '+label(u.access);return o;}));selected=null;userUnlimited=false;for(const id of ['email','starts','ends'])$(id).value='';$('role').value='user';$('seconds').value=defaults?.seconds??60;$('cooldown').value=defaults?.cooldown??10;controls();say(rows.length?'Select account':'No matches');}
 async function save(){
  if(!selected||busy)return;busy=true;say('Saving');controls();
  try{
   let duration=Number($('seconds').value);if(($('role').value==='admin'||userUnlimited)&&(!Number.isInteger(duration)||duration<1||duration>86400))duration=selected.access.seconds;
   let cooldown=Number($('cooldown').value);if(($('role').value==='admin'||userUnlimited)&&(!Number.isInteger(cooldown)||cooldown<0||cooldown>86400))cooldown=selected.access.cooldown??10;
   const starts=dateSeconds($('starts').value),ends=dateSeconds($('ends').value);
   if(ends!==null&&(starts===null||ends<=starts))throw Error('End must be after start');
   const data={role:$('role').value,seconds:duration,cooldown,plan:starts!==null?'Subscription':'',starts,ends,unlimited:userUnlimited};
   const d=await api('/api/admin/users/'+encodeURIComponent(selected.id),'PUT',data);selected.access=d.access;select();say('Saved','green');
  }catch(e){say(e.message,'red');}finally{busy=false;controls();}
 }
 async function loadDefaults(){const data=await api('/api/admin/defaults');defaults=data.defaults;$('defaultSeconds').value=defaults.seconds;$('defaultCooldown').value=defaults.cooldown;}
 $('defaultsForm').onsubmit=async event=>{event.preventDefault();if(busy||!defaults)return;busy=true;controls();$('defaultsStatus').textContent='Saving…';try{const data=await api('/api/admin/defaults','PUT',{seconds:Number($('defaultSeconds').value),cooldown:Number($('defaultCooldown').value),revision:defaults.revision});defaults=data.defaults;$('defaultsStatus').textContent='Saved';await find();}catch(error){$('defaultsStatus').textContent=error.message;}finally{busy=false;controls();}};
 $('role').onchange=controls;$('unlimited').onchange=()=>{userUnlimited=$('unlimited').checked;controls();};
 $('search').onsubmit=e=>{e.preventDefault();if(!busy)void find().catch(e=>say(e.message,'red'));};$('users').onchange=select;$('settings').onsubmit=e=>{e.preventDefault();void save();};
 controls();try{const d=await api('/api/me');csrf=d.csrf;if(d.access?.role!=='admin'){say('Admin only','red');return;}document.querySelector('main').hidden=false;await loadDefaults();await find();}catch(e){say(e.message,'red');}
})();
