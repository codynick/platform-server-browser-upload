'use strict';
(()=>{
 const get=id=>document.getElementById(id);
 const menus=[get('projectMenu'),get('advancedMenu')];
 for(const menu of menus){const summary=menu.querySelector('summary');
  menu.addEventListener('click',event=>{if(event.target.closest('.project-menu-panel button')){menu.open=false;summary.focus();}});
  menu.addEventListener('toggle',()=>{if(menu.open)for(const other of menus)if(other!==menu)other.open=false;});
 }
 document.addEventListener('click',event=>{for(const menu of menus)if(!menu.contains(event.target))menu.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')for(const menu of menus)if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});
 // Both coding modes share the saved project description.
 const info=get('pythonInfo'),bubble=get('pythonHelpBubble');
 const closeInfo=()=>{if(bubble.matches(':popover-open'))bubble.hidePopover();};
 info.onclick=()=>{
  if(bubble.matches(':popover-open')){bubble.hidePopover();return;}
  bubble.showPopover();const button=info.getBoundingClientRect(),bounds=bubble.getBoundingClientRect();
  bubble.style.left=Math.max(12,Math.min(button.right-bounds.width,innerWidth-bounds.width-12))+'px';
  bubble.style.top=Math.max(12,Math.min(button.bottom+8,innerHeight-bounds.height-12))+'px';
 };
 bubble.addEventListener('toggle',()=>info.setAttribute('aria-expanded',String(bubble.matches(':popover-open'))));
 window.addEventListener('resize',closeInfo);
 for(const id of ['blocksEditorTab','pythonEditorTab'])get(id).addEventListener('click',closeInfo);
 const about=get('aboutDialog');get('aboutVersion').textContent=window.CODYNICK_VERSION;
 const released=window.CODYNICK_RELEASE_DATE;get('aboutDate').dateTime=released;
 // Parse as local noon so the calendar date cannot shift with UTC offsets.
 get('aboutDate').textContent=new Date(released+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
 get('menuAbout').onclick=()=>about.showModal();get('closeAbout').onclick=()=>about.close();
 get('menuExamples').onclick=()=>{get('example').value='sim-dashboard';get('examplesDialog').showModal();};
 get('closeExamples').onclick=()=>get('examplesDialog').close();
 get('example').addEventListener('dblclick',()=>get('loadExample').click());
 get('menuSave').onclick=()=>get('saveNamed').click();get('menuUpload').onclick=()=>get('importFile').click();
})();
