'use strict';
(()=>{
const menu=document.getElementById('projectMenu');
const summary=menu.querySelector('summary');
const close=()=>{menu.open=false;};
const about=document.getElementById('aboutDialog');
document.getElementById('aboutVersion').textContent=window.CODYNICK_VERSION;
document.getElementById('menuAbout').onclick=()=>about.showModal();
document.getElementById('closeAbout').onclick=()=>about.close();
document.getElementById('menuSave').onclick=()=>document.getElementById('saveNamed').click();
document.getElementById('menuUpload').onclick=()=>document.getElementById('importFile').click();
menu.addEventListener('click',event=>{if(event.target.closest('.project-menu-panel button')){close();summary.focus();}});
document.addEventListener('click',event=>{if(!menu.contains(event.target))close();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){close();summary.focus();}});
})();
