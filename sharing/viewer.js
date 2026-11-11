'use strict';
(async()=>{
 const $=id=>document.getElementById(id),token=location.hash.slice(1);let workspace;
 function validateBlocks(source){let count=0;const allowed=new Set([...HARDWARE_SPECS.map(spec=>spec.type),...BlockRuntime.types]);function walk(block,depth=0){if(!block)return;if(depth>150||++count>2000||!allowed.has(block.type))throw Error('Unsupported Blocks code in this project.');for(const input of Object.values(block.inputs||{})){walk(input.block,depth+1);walk(input.shadow,depth+1);}walk(block.next?.block,depth+1);}source.blocks.blocks.forEach(block=>walk(block));}
 try{
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('Open the full project link supplied by the designer.');
  const response=await fetch('/api/shared/'+token,{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error(response.status===404?'This project is unavailable or has been unpublished.':'Could not load this project.');
  const data=await response.json();$('title').textContent=data.title;document.title=data.title+' · CodyNick';$('designer').textContent='Designed by '+data.display_name;$('description').textContent=data.description;
  const language=data.selection==='both'?'Blocks and Python':data.selection==='blocks'?'Blocks':'Python';$('projectInfo').textContent=`${language} · ${data.visibility==='public'?'Community':'Unlisted'} · Updated ${new Date(data.updated*1000).toLocaleString()}`;
  $('openEditor').href='/blocks/?shared='+token;$('pythonCode').textContent=data.project.python||'Python code was not included in this publication.';$('content').hidden=false;
  if(data.selection==='python'){$('blockCode').hidden=true;$('blocksStatus').textContent='Blocks code was not included in this publication.';}
  else try{validateBlocks(data.project.workspace);workspace=Blockly.inject('blockCode',{readOnly:true,renderer:'zelos',media:'/blocks/vendor/blockly/media/',scrollbars:true,zoom:{controls:true,wheel:true,startScale:.8,minScale:.2,maxScale:2}});Blockly.serialization.workspaces.load(data.project.workspace,workspace);workspace.zoomToFit();requestAnimationFrame(()=>{Blockly.svgResize(workspace);workspace.zoomToFit();});$('blocksStatus').textContent='Read-only code. Open in editor to make changes or run it.';}catch(error){$('blocksStatus').textContent=error.message;}
  $('message').textContent='';window.addEventListener('resize',()=>{if(workspace){Blockly.svgResize(workspace);workspace.zoomToFit();}});
 }catch(error){$('message').textContent=error.message;}
 $('report').onclick=async()=>{const reason=prompt('Why are you reporting this project? Do not include personal information.');if(!reason?.trim())return;try{const response=await fetch('/api/shared/'+token+'/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:reason.trim().slice(0,500)})});if(!response.ok)throw Error('Could not send the report.');$('message').textContent='Report sent to the platform administrator.';}catch(error){$('message').textContent=error.message;}};
})();
