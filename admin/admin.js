'use strict';
(async()=>{
 const $=id=>document.getElementById(id);let csrf='',selected=null,rows=[],busy=false,userUnlimited=false;
 const say=(text,tone='amber')=>{$('status').textContent=text;$('status').dataset.tone=tone;};
 const label=a=>a.unlimited?'Unlimited':a.subscribed?'Subscribed':'Free';
 async function api(path,method='GET',data){const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:data?JSON.stringify(data):undefined});const d=await r.json();if(!r.ok)throw Error(r.status===403?'Admin only':r.status===409?'Keep admin':r.status===400?'Check fields':d.error||'Try again');return d;}
 function controls(){
  const disabled=!selected||busy,admin=$('role').value==='admin';
  $('role').disabled=disabled;$('unlimited').checked=admin||userUnlimited;$('unlimited').disabled=disabled||admin;
  $('seconds').disabled=disabled||admin||userUnlimited;$('save').disabled=disabled;$('users').disabled=busy;
 }
 function select(){
  selected=rows.find(u=>u.id===$('users').value)||null;
  if(selected){const a=selected.access;$('name').textContent=selected.name||selected.id;$('uid').textContent=selected.id;$('role').value=a.role;$('seconds').value=a.seconds;
   const now=a.server_time||Date.now()/1000;userUnlimited=!!(a.plan&&a.starts!=null&&a.starts<=now&&(a.ends==null||a.ends>now));
   const option=$('users').selectedOptions[0];if(option)option.textContent=(selected.name||selected.id)+' · '+label(a);say(label(a),a.subscribed?'green':'amber');
  }controls();
 }
 async function find(){const d=await api('/api/admin/users?q='+encodeURIComponent($('query').value));rows=d.users;$('users').replaceChildren(...rows.map(u=>{const o=document.createElement('option');o.value=u.id;o.textContent=(u.name||u.id)+' · '+label(u.access);return o;}));selected=null;userUnlimited=false;$('role').value='user';$('seconds').value=20;controls();say(rows.length?'Select account':'No matches');}
 async function save(){
  if(!selected||busy)return;busy=true;say('Saving');controls();
  try{
   let duration=Number($('seconds').value);if(($('role').value==='admin'||userUnlimited)&&(!Number.isInteger(duration)||duration<1||duration>86400))duration=selected.access.seconds;
   const data={role:$('role').value,seconds:duration,plan:userUnlimited?'Unlimited':'',starts:userUnlimited?Math.floor(Date.now()/1000):null,ends:null};
   const d=await api('/api/admin/users/'+encodeURIComponent(selected.id),'PUT',data);selected.access=d.access;select();say('Saved','green');
  }catch(e){say(e.message,'red');}finally{busy=false;controls();}
 }
 $('role').onchange=controls;$('unlimited').onchange=()=>{userUnlimited=$('unlimited').checked;controls();};
 $('search').onsubmit=e=>{e.preventDefault();if(!busy)void find().catch(e=>say(e.message,'red'));};$('users').onchange=select;$('settings').onsubmit=e=>{e.preventDefault();void save();};
 controls();try{const d=await api('/api/me');csrf=d.csrf;if(d.access?.role!=='admin'){say('Admin only','red');return;}document.querySelector('main').hidden=false;await find();}catch(e){say(e.message,'red');}
})();
