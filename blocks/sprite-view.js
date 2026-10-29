'use strict';
(() => {
 const $=id=>document.getElementById(id),canvas=$('stageCanvas'),ctx=canvas.getContext('2d'),panel=$('spriteStagePanel');
 let frame=0,speechTimer=null;const held=new Set(),touches=new Map(),mouse={x:0,y:0,down:false};
 const looks=window.CodySpriteLooks,images=new Map();for(const look of looks){const img=new Image();img.onload=schedule;img.src=look.file;images.set(look.id,img);const option=document.createElement('option');option.value=look.id;option.textContent=look.label;$('stage_appearance').append(option);}
 const model=new window.CodySpriteModel({onChange:()=>schedule()});
 function schedule(){window.CodyStageLink?.changed();if(!frame)frame=requestAnimationFrame(()=>{frame=0;draw();});}
 function draw(){
  clearTimeout(speechTimer);const s=model.snapshot();if(s.speech&&s.speechUntil>model.now())speechTimer=setTimeout(schedule,s.speechUntil-model.now()+1);
  if(panel.hidden)return;
  const dpr=Math.min(devicePixelRatio||1,3);if(canvas.width!==480*dpr||canvas.height!==360*dpr){canvas.width=480*dpr;canvas.height=360*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle={white:'#ffffff',sky:'#e2f3ff',field:'#e8f6df'}[s.backdrop];ctx.fillRect(0,0,480,360);
  if(s.backdrop==='sky'){ctx.fillStyle='#fff';for(const [x,y] of [[70,55],[330,95]]){ctx.beginPath();ctx.ellipse(x,y,45,13,0,0,Math.PI*2);ctx.fill();}}
  if(s.backdrop==='field'){ctx.fillStyle='#b8d99b';ctx.fillRect(0,300,480,60);}
  ctx.strokeStyle='#dce5eb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(240,0);ctx.lineTo(240,360);ctx.moveTo(0,180);ctx.lineTo(480,180);ctx.stroke();
  if(s.visible){
   const look=looks.find(v=>v.id===s.appearance),image=images.get(s.appearance);
   ctx.save();ctx.translate(240+s.x,180-s.y);ctx.rotate((s.direction-(look?.heading||0))*Math.PI/180);ctx.scale(s.size/100,s.size/100);
   if(image?.complete&&image.naturalWidth){ctx.drawImage(image,-24,-24,48,48);}else{
   ctx.fillStyle='#f59e35';ctx.beginPath();ctx.moveTo(-7,13);ctx.lineTo(0,26);ctx.lineTo(7,13);ctx.closePath();ctx.fill();
   ctx.fillStyle='#087d91';ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-22,18);ctx.lineTo(-7,13);ctx.lineTo(7,13);ctx.lineTo(22,18);ctx.lineTo(10,0);ctx.closePath();ctx.fill();
   ctx.fillStyle='#4c97ff';ctx.strokeStyle='#174e76';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-24);ctx.bezierCurveTo(16,-10,13,6,9,16);ctx.lineTo(-9,16);ctx.bezierCurveTo(-13,6,-16,-10,0,-24);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-5,6,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.restore();
   if(s.speech){
    ctx.font='14px Arial';const lines=[];let line='';for(const word of s.speech.split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width>205&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
    const shown=lines.slice(0,6),h=shown.length*18+18,x=Math.max(8,Math.min(246,240+s.x-100)),y=Math.max(8,Math.min(352-h,180-s.y-65-h));
    ctx.fillStyle='#fff';ctx.strokeStyle='#7d9bab';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,226,h,9);ctx.fill();ctx.stroke();ctx.fillStyle='#243d4c';shown.forEach((t,i)=>ctx.fillText(t,x+10,y+23+i*18,206));
   }
  }
  $('stage_appearance').value=s.appearance;
  $('stageReadout').textContent=`x ${s.x.toFixed(1)} · y ${s.y.toFixed(1)} · direction ${(s.direction+180)%360-180}° · size ${Math.round(s.size)}%`;
 }
 function publish(){const keys=[...new Set([...held,...touches.values()])];if(window.CodyStageLink)CodyStageLink.input(keys,mouse);else model.input(keys,mouse);}
 function release(){held.clear();touches.clear();mouse.down=false;if(window.CodyStageLink)CodyStageLink.releaseLocal();else model.release();}
 function pointer(event){const r=canvas.getBoundingClientRect();mouse.x=Math.max(-240,Math.min(240,(event.clientX-r.left)/r.width*480-240));mouse.y=Math.max(-180,Math.min(180,180-(event.clientY-r.top)/r.height*360));publish();}
 const keys={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',' ':'space'};
 canvas.addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();held.add(keys[e.key]);publish();}});
 canvas.addEventListener('keyup',e=>{if(keys[e.key]){e.preventDefault();held.delete(keys[e.key]);publish();}});
 canvas.addEventListener('blur',release);window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
 canvas.addEventListener('pointermove',pointer);canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);mouse.down=true;pointer(e);});
 const pointerUp=()=>{mouse.down=false;publish();};canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('lostpointercapture',pointerUp);
 for(const button of document.querySelectorAll('[data-stage-key]')){
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touches.set(e.pointerId,button.dataset.stageKey);publish();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>{touches.delete(e.pointerId);publish();});
  button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();held.add(button.dataset.stageKey);publish();}});
  button.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){held.delete(button.dataset.stageKey);publish();}});button.addEventListener('blur',release);
 }
 setInterval(()=>{if(document.hidden||panel.hidden){release();return;}if(held.size||touches.size||mouse.down)publish();},250);
 function controls(){for(const name of ['x','y','direction','size','backdrop','appearance'])$('stage_'+name).value=name==='appearance'?model.state.appearance:model.settings[name];}
 for(const name of ['x','y','direction','size','backdrop','appearance'])$('stage_'+name).addEventListener('change',()=>{
  try{if(window.blockProgramRunning)throw Error('Stop the program before changing starting settings.');const settings={};for(const key of ['x','y','direction','size','backdrop','appearance'])settings[key]=$('stage_'+key).value;window.CodyStageLink?.resetInputs();model.setSettings(settings,name==='appearance');$('stageSettingStatus').textContent='Starting settings saved with the Blocks design.';}catch(e){$('stageSettingStatus').textContent=e.message;}controls();
 });
 $('stageReset').onclick=()=>{if(window.blockProgramRunning){$('stageSettingStatus').textContent='Stop the program before Reset.';return;}window.CodyStageLink?.resetInputs();release();model.reset();};
 window.addEventListener('resize',schedule);
 window.CodySpriteStage={model,snapshotProject:()=>model.snapshotProject(),restoreProject:data=>{release();model.restore(data);controls();},command:(...args)=>model.command(...args),getSettings:()=>({...model.settings}),setSettings:a=>{release();model.setSettings(a);controls();},clear:()=>{release();model.setSettings(window.CodySpriteModel.defaults());controls();},release,
  setRunning(on){$('stageReset').disabled=on;for(const name of ['x','y','direction','size','backdrop','appearance'])$('stage_'+name).disabled=on;if(!on)release();},
  show(){window.CodySpaces?.show('sprites');schedule();},beginRun(){release();model.reset();this.show();},changedSpace(){if(panel.hidden)release();else schedule();}};
 controls();schedule();
})();
