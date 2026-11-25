(() => {
 'use strict';
 if(window.CodyLightAssets)return;
 const store=window.CodyLiveStore,M=window.CodyLightWorld,el=id=>document.getElementById(id),nodes=new Map(),ns='http://www.w3.org/2000/svg';
 const world=s=>s.scene.illumination||M.defaults(s.scene.light);
 let activeDrag=null,installed=false;
 const camera=()=>window.CodySimulatorView.snapshot().camera;
 function change(fn){store.update(s=>{const w=world(s);fn(w,s);s.scene.illumination=M.clean(w);M.advance(s.scene);});refresh();}
 function move(id,x,y){change(w=>{const a=w.flashlights.find(v=>v.id===id);if(a){a.x=Math.max(0,Math.min(1400,x));a.y=Math.max(0,Math.min(1500,y));}});}
 function fitAll(){
  const s=store.read(),bounds={left:Infinity,top:Infinity,right:0,bottom:0};
  const add=(x,y,width,height)=>{bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x+width);bounds.bottom=Math.max(bounds.bottom,y+height);};
  for(const [kind,p]of Object.entries(s.scene.gadgets)){const n=el('gadget-'+kind);if(n)add(p.x,p.y,n.offsetWidth,n.offsetHeight);}
  for(const a of s.scene.world?.assets||[])add(a.x,a.y,a.kind==='target'?a.width:230,a.kind==='target'?a.height:310);
  for(const p of s.scene.garden?.pots||[])add(p.x,p.y,228,310);
  for(const p of s.scene.garden?.cans||[])add(p.x,p.y,230,210);
  if(s.scene.world?.probe&&s.scene.gadgets.temperature&&window.CodyThermalWorld.hasCups(s.scene.world))add(s.scene.world.probe.x-25,s.scene.world.probe.y-145,50,150);
  if(s.scene.garden?.enabled&&s.scene.gadgets.soil)add(s.scene.garden.probe.x-24,s.scene.garden.probe.y-140,48,150);
  for(const a of world(s).flashlights)add(Math.max(0,a.x-50),Math.max(0,a.y-50),280,280);
  const vp=el('stageViewport');if(!Number.isFinite(bounds.left))return;
  window.CodySimulatorView.restore({camera:window.CodySimulatorViewport.fit(bounds,vp.clientWidth,vp.clientHeight),selected:s.scene.gadgets.light?'light':'cjp'});
 }
 function mount(a){
  const node=document.createElement('section');node.className='world-asset light-flashlight';node.tabIndex=0;node.dataset.flashlight=a.id;node.setAttribute('role','group');node.setAttribute('aria-label','Hand light');
  node.innerHTML='<div class="asset-actions"><button class="gadget-remove" aria-label="Remove hand light">×</button><button class="asset-toggle" aria-label="Switch hand light off">⏻</button></div><img src="/simulator/hand-light.png?v=3.21.1-ai.26" alt="Hand light" draggable="false">';
  node.querySelector('img').ondragstart=e=>e.preventDefault();
  node.querySelector('.gadget-remove').onclick=()=>change(w=>{w.flashlights=w.flashlights.filter(v=>v.id!==a.id);if(!w.flashlights.length)w.enabled=false;});
  node.querySelector('.asset-toggle').onclick=()=>change(w=>{const current=w.flashlights.find(v=>v.id===a.id);if(current)current.on=!current.on;});
  node.addEventListener('pointerdown',event=>{
   event.stopPropagation();
   if(event.button!==0||activeDrag||event.target.closest('button,input,select'))return;
   const current=world(store.read()).flashlights.find(v=>v.id===a.id);if(!current)return;
   event.preventDefault();event.stopPropagation();node.focus({preventScroll:true});node.setPointerCapture(event.pointerId);
   activeDrag={id:a.id,pointer:event.pointerId,clientX:event.clientX,clientY:event.clientY,x:current.x,y:current.y};
  });
  node.addEventListener('pointermove',event=>{if(activeDrag?.id===a.id&&activeDrag.pointer===event.pointerId)move(a.id,activeDrag.x+(event.clientX-activeDrag.clientX)/camera().scale,activeDrag.y+(event.clientY-activeDrag.clientY)/camera().scale);});
  const end=event=>{if(activeDrag?.id===a.id&&activeDrag.pointer===event.pointerId)activeDrag=null;};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,end);
  node.addEventListener('keydown',event=>{if(event.target!==node)return;const d={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[event.key];if(d){event.preventDefault();event.stopPropagation();const p=world(store.read()).flashlights.find(v=>v.id===a.id);if(p)move(a.id,p.x+d[0],p.y+d[1]);}});
  node.addEventListener('dblclick',event=>event.stopPropagation());el('stage').append(node);nodes.set(a.id,node);return node;
 }
 let beams,choice;
 function refresh(){
  if(!installed)return;
  const s=store.read(),w=world(s),sensor=s.scene.gadgets.light&&M.sensorOrigin(s.scene.gadgets.light),ids=new Set(w.flashlights.map(a=>a.id));
  for(const [id,node]of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}
  beams.replaceChildren();
  for(const a of w.flashlights){
   const node=nodes.get(a.id)||mount(a),point=M.emitter(a);node.style.left=a.x+'px';node.style.top=a.y+'px';node.classList.toggle('off',!a.on);
   const angle=sensor?Math.atan2(sensor.y-point.y,sensor.x-point.x)*180/Math.PI-135:0;node.querySelector('img').style.transform='rotate('+angle+'deg)';
   const toggle=node.querySelector('.asset-toggle');toggle.setAttribute('aria-pressed',String(a.on));toggle.setAttribute('aria-label',a.on?'Switch hand light off':'Switch hand light on');
   if(w.enabled&&a.on&&sensor){
    const distance=Math.hypot(sensor.x-point.x,sensor.y-point.y);if(distance>1){const dx=(sensor.x-point.x)/distance,dy=(sensor.y-point.y)/distance,width=Math.min(32,6+distance*.06),path=document.createElementNS(ns,'path');path.setAttribute('d',`M${point.x} ${point.y} L${sensor.x-dy*width} ${sensor.y+dx*width} L${sensor.x+dy*width} ${sensor.y-dx*width} Z`);path.setAttribute('fill','#ffd94d');path.setAttribute('fill-opacity','.16');beams.append(path);}
   }
  }
  const enabled=w.enabled&&!!sensor;
  el('lightValue').readOnly=enabled;
  if(enabled)el('lightValue').value=s.scene.light;
  el('lightMeter').value=s.scene.light;
  choice.disabled=w.flashlights.length>=20;
 }
 function install(){
  const list=document.querySelector('.asset-picker .asset-list');if(!list||!el('gadget-light')||!window.CodySimulatorView){setTimeout(install,50);return;}
  if(installed)return;installed=true;
  choice=document.createElement('button');choice.className='asset-choice light-asset-choice';choice.innerHTML='<img src="/simulator/hand-light.png?v=3.21.1-ai.26" alt=""><span><strong>Hand light</strong><small>Drag closer to increase light intensity</small></span><span class="plus">+</span>';
  choice.onclick=()=>{change((w,s)=>{if(w.flashlights.length>=20)return;const p=s.scene.gadgets.light?M.sensorOrigin(s.scene.gadgets.light):{x:700,y:500};w.flashlights.push({id:crypto.randomUUID(),x:Math.min(1400,Math.max(0,p.x+300-66)),y:Math.min(1500,Math.max(0,p.y-116)),on:true,power:100});w.enabled=true;});list.closest('dialog').close();fitAll();};list.append(choice);
  const point=document.createElement('span');point.className='light-sensing-point';point.title='Light sensing point';point.setAttribute('aria-hidden','true');el('gadget-light').append(point);
  beams=document.createElementNS(ns,'svg');beams.classList.add('light-beams');beams.setAttribute('aria-hidden','true');el('stage').append(beams);
  const previous=store.simCommand;store.simCommand=function(command){if(command.action==='scene'){const current=store.read();command={...command,scene:{...command.scene}};if(current.scene.illumination){const w=M.clean(current.scene.illumination);if(!w.enabled&&Number.isFinite(command.scene.light))w.manual=command.scene.light;command.scene.illumination=w;}else delete command.scene.illumination;}return previous(command);};
  document.addEventListener('keydown',event=>{if(event.target===el('stageViewport')&&['Home','0'].includes(event.key)&&world(store.read()).flashlights.length){event.preventDefault();event.stopImmediatePropagation();fitAll();}},true);
  document.addEventListener('dblclick',event=>{if(el('stageViewport').contains(event.target)&&!event.target.closest('.stage-item,.world-asset,.garden-pot,.garden-can,.soil-probe,.probe-extension')&&world(store.read()).flashlights.length){event.preventDefault();event.stopImmediatePropagation();fitAll();}},true);
  window.addEventListener('blur',()=>{activeDrag=null;});window.addEventListener('codynick-live-change',refresh);setInterval(refresh,100);refresh();
 }
 window.CodyLightAssets={refresh,fit:fitAll,move};install();
})();
