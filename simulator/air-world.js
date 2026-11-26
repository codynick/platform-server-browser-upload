(() => {
 'use strict';if(window.CodyAirAssets)return;
 const S=window.CodyLiveStore,M=window.CodyAirWorld,$=id=>document.getElementById(id),nodes=new Map(),ns='http://www.w3.org/2000/svg';
 let installed=false,drag=null,spraying=null,effects,dialog;
 const world=s=>s.scene.airWorld||M.defaults(s.scene.airTemperature,s.scene.airHumidity);
 const change=fn=>{S.update(s=>{const w=world(s);fn(w,s);s.scene.airWorld=M.clean(w);M.advance(s.scene);});refresh();};
 const camera=()=>CodySimulatorView.snapshot().camera;
 function move(id,x,y){change(w=>{const a=w.assets.find(a=>a.id===id);if(a){a.x=Math.max(0,Math.min(1400,x));a.y=Math.max(0,Math.min(1500,y));}});}
 const fit=()=>window.CodyLightAssets?.fit();
 function stopSpray(){if(!spraying)return;const id=spraying;spraying=null;change(w=>{const a=w.assets.find(a=>a.id===id);if(a)a.sprayUntil=0;});}
 function mount(a){
  const node=document.createElement('section');node.className='world-asset air-asset';node.tabIndex=0;node.dataset.airAsset=a.id;node.setAttribute('role','group');node.setAttribute('aria-label',a.kind==='mist'?'Water mist spray':'Air heater');
  node.innerHTML='<div class="asset-actions"><button class="gadget-remove" aria-label="Remove '+(a.kind==='mist'?'water mist spray':'air heater')+'">×</button></div><img src="/simulator/air-'+(a.kind==='mist'?'mist':'heater')+'.svg?v=3.21.1-ai.28" alt="" draggable="false"><button class="air-action"></button>';
  const button=node.querySelector('.air-action');
  node.querySelector('.gadget-remove').onclick=()=>{if(spraying===a.id)stopSpray();change(w=>{w.assets=w.assets.filter(v=>v.id!==a.id);});};
  if(a.kind==='heater')button.onclick=()=>change(w=>{const v=w.assets.find(v=>v.id===a.id);if(v)v.on=!v.on;});
  else{
   const start=()=>{stopSpray();spraying=a.id;change(w=>{const v=w.assets.find(v=>v.id===a.id);if(v)v.sprayUntil=Date.now()+600;});};
   button.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();button.focus();button.setPointerCapture(e.pointerId);start();};
   for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,stopSpray);
   button.onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)start();}};button.onkeyup=e=>{if([' ','Enter'].includes(e.key))stopSpray();};button.onblur=stopSpray;
  }
  node.onpointerdown=e=>{e.stopPropagation();if(e.button!==0||drag||e.target.closest('button,input,select'))return;const p=world(S.read()).assets.find(v=>v.id===a.id);if(!p)return;e.preventDefault();node.focus({preventScroll:true});node.setPointerCapture(e.pointerId);drag={id:a.id,pointer:e.pointerId,x:p.x,y:p.y,cx:e.clientX,cy:e.clientY};};
  node.onpointermove=e=>{if(drag?.id===a.id&&drag.pointer===e.pointerId)move(a.id,drag.x+(e.clientX-drag.cx)/camera().scale,drag.y+(e.clientY-drag.cy)/camera().scale);};
  const end=e=>{if(drag?.id===a.id&&drag.pointer===e.pointerId)drag=null;};for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,end);
  node.onkeydown=e=>{if(e.target!==node)return;const delta={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[e.key];if(delta){e.preventDefault();e.stopPropagation();const p=world(S.read()).assets.find(v=>v.id===a.id);if(p)move(a.id,p.x+delta[0],p.y+delta[1]);}};
  node.ondblclick=e=>e.stopPropagation();$('stage').append(node);nodes.set(a.id,node);return node;
 }
 function refresh(){
  if(!installed)return;const s=S.read(),w=world(s),point=s.scene.gadgets.air&&M.sensorOrigin(s.scene.gadgets.air),ids=new Set(w.assets.map(a=>a.id));
  for(const [id,node]of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}effects.replaceChildren();
  for(const a of w.assets){const node=nodes.get(a.id)||mount(a),active=w.enabled&&(a.kind==='heater'?a.on:a.sprayUntil>Date.now());node.style.left=a.x+'px';node.style.top=a.y+'px';node.classList.toggle('heating',active&&a.kind==='heater');node.classList.toggle('spraying',active&&a.kind==='mist');const b=node.querySelector('.air-action');b.textContent=a.kind==='heater'?(a.on?'Heater: ON':'Heater: OFF'):'Hold to spray';b.setAttribute('aria-pressed',String(a.kind==='heater'?a.on:a.sprayUntil>Date.now()));
   if(active&&point){const e=M.emitter(a);if(a.kind==='mist'){const p=document.createElementNS(ns,'path');p.setAttribute('d',`M${e.x} ${e.y} L${point.x-18} ${point.y-10} L${point.x+18} ${point.y+10} Z`);p.setAttribute('fill','#72cafa');p.setAttribute('fill-opacity','.25');effects.append(p);}else{for(let i=0;i<3;i++){const p=document.createElementNS(ns,'path');p.setAttribute('d',`M${e.x-24+i*24} ${e.y} q-12 -20 0 -40 t0 -40`);p.setAttribute('fill','none');p.setAttribute('stroke','#f08a43');p.setAttribute('stroke-width','4');p.setAttribute('stroke-opacity','.6');effects.append(p);}}}
  }
  for(const [key,id]of [['airTemperature','airTemperatureValue'],['airHumidity','airHumidityValue']]){const input=$(id);input.readOnly=w.enabled;if(input.readOnly||document.activeElement!==input)input.value=(Math.round(s.scene[key]*10)/10).toFixed(1);}
  $('airTemperatureMeter').value=s.scene.airTemperature;$('airHumidityMeter').value=s.scene.airHumidity;
 }
 function settings(){const w=world(S.read());$('airWorldEnabled').checked=w.enabled;$('airAmbientT').value=w.ambientTemperature;$('airAmbientH').value=w.ambientHumidity;dialog.showModal();}
 function install(){
  const list=document.querySelector('.asset-picker .asset-list');if(!list||!$('gadget-air')||!window.CodySimulatorView||!window.CodyLightAssets){setTimeout(install,50);return;}if(installed)return;installed=true;
  const picker=document.querySelector('#gadgetPicker .toolbox');if(picker&&!picker.querySelector('[data-add="air"]')){const b=document.createElement('button');b.className='tool';b.dataset.add='air';b.innerHTML='<img src="/simulator/air-th-probe.png?v=3.21.1-ai.28" width="64" height="50" alt=""><span>Air Temp/Hum</span><b aria-hidden="true">+</b>';picker.append(b);}
  for(const kind of ['mist','heater']){const b=document.createElement('button');b.className='asset-choice air-choice';b.innerHTML='<img src="/simulator/air-'+kind+'.svg?v=3.21.1-ai.28" alt=""><span><strong>'+(kind==='mist'?'Water mist spray':'Air heater')+'</strong><small>'+(kind==='mist'?'Hold to spray; closer increases humidity':'Switch on; closer warms and dries the air')+'</small></span><span class="plus">+</span>';b.onclick=()=>{change((w,s)=>{if(w.assets.length>=20)return;const point=s.scene.gadgets.air?M.sensorOrigin(s.scene.gadgets.air):{x:800,y:500};w.assets.push({id:crypto.randomUUID(),kind,x:Math.max(0,Math.min(1400,point.x+(kind==='heater'?250:-280)-90)),y:Math.max(0,Math.min(1500,point.y-75)),on:false,power:100,sprayUntil:0});w.enabled=true;});list.closest('dialog').close();fit();};list.append(b);}
  const gear=document.createElement('button');gear.className='air-settings-button';gear.textContent='⚙';gear.title='Air environment settings';gear.setAttribute('aria-label','Air environment settings');gear.onclick=settings;$('gadget-air').querySelector('.gadget-header').append(gear);
  const point=document.createElement('span');point.className='air-probe-point';point.title='Air sensing point';point.setAttribute('aria-hidden','true');$('gadget-air').append(point);
  dialog=document.createElement('dialog');dialog.className='air-settings';dialog.innerHTML='<form><strong>Air environment</strong><label><span>Use environmental assets</span><input id="airWorldEnabled" type="checkbox"></label><label>Ambient temperature (°C)<input id="airAmbientT" type="number" min="-20" max="50" step="0.1" required></label><label>Ambient humidity (%)<input id="airAmbientH" type="number" min="0" max="100" step="0.1" required></label><p>Hold the mist spray to humidify the air. Nearby heaters raise temperature and lower relative humidity. Readings change gradually, returning toward ambient after sources stop. Turn off environmental sensing for manual values. This is a simplified classroom model.</p><div class="actions"><button type="button">Cancel</button><button type="submit">Apply</button></div></form>';document.body.append(dialog);dialog.querySelector('[type=button]').onclick=()=>dialog.close();dialog.querySelector('form').onsubmit=e=>{e.preventDefault();if(!dialog.querySelector('form').reportValidity())return;stopSpray();change(w=>{w.enabled=$('airWorldEnabled').checked;w.ambientTemperature=Number($('airAmbientT').value);w.ambientHumidity=Number($('airAmbientH').value);});dialog.close();};
  for(const [id,key,lo,hi]of [['airTemperatureValue','airTemperature',-55,125],['airHumidityValue','airHumidity',0,100]])$(id).oninput=()=>{const input=$(id),v=Number(input.value);if(input.readOnly||input.value===''||!Number.isFinite(v)||v<lo||v>hi)return;change((w,s)=>{s.scene[key]=v;w[key==='airTemperature'?'manualTemperature':'manualHumidity']=v;});};
  effects=document.createElementNS(ns,'svg');effects.classList.add('air-effects');effects.setAttribute('aria-hidden','true');$('stage').append(effects);
  const previous=S.simCommand;S.simCommand=function(c){if(c.action==='scene'){const current=S.read();c={...c,scene:{...c.scene}};if(current.scene.airWorld){c.scene.airWorld=current.scene.airWorld;c.scene.airTemperature=current.scene.airTemperature;c.scene.airHumidity=current.scene.airHumidity;}else delete c.scene.airWorld;}return previous(c);};
  window.addEventListener('blur',()=>{drag=null;stopSpray();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpray();});window.addEventListener('codynick-live-change',refresh);
  document.addEventListener('keydown',e=>{if(e.target===$('stageViewport')&&['Home','0'].includes(e.key)&&world(S.read()).assets.length){e.preventDefault();e.stopImmediatePropagation();fit();}},true);
  setInterval(()=>{if(spraying)change(w=>{const a=w.assets.find(a=>a.id===spraying);if(a)a.sprayUntil=Date.now()+600;});else refresh();},100);refresh();
 }
 window.CodyAirAssets={refresh,move,fit};install();
})();
