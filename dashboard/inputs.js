'use strict';
(()=>{
 const store=window.CodyLiveStore,owner='dashboard-'+crypto.randomUUID(),held=new Map(),attached=new WeakSet();
 const send=(id,value)=>{try{store.dashboardInput(id,value,owner);}catch(e){console.warn(e.message);}};
 function release(id){if(held.delete(id))send(id,false);}
 function releaseAll(){for(const id of [...held.keys()])release(id);}
 function attach(card){if(attached.has(card))return;attached.add(card);const id=card.dataset.cardId,type=card.dataset.cardType;
  if(type==='button'){
   const b=card.querySelector('[data-role=button]');if(!b)return;
   const press=()=>{if(!held.has(id)){held.set(id,b);send(id,true);}};
   b.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();b.focus();b.setPointerCapture(e.pointerId);press();});
   for(const event of ['pointerup','pointercancel','lostpointercapture','blur'])b.addEventListener(event,()=>release(id));
   b.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();press();}});
   b.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();release(id);}});
   b.addEventListener('click',e=>{if(e.detail===0&&!held.has(id)){press();release(id);}});
  }else if(type==='switch'){
   card.querySelector('[data-role=switch]')?.addEventListener('click',()=>send(id,'toggle'));
  }else if(type==='slider'){
   const range=card.querySelector('[data-role=input]'),number=card.querySelector('[data-role=number]');
   const change=input=>{if(input.value.trim()===''||!Number.isFinite(Number(input.value)))return;send(id,Number(input.value));const w=store.read().widgets[id];if(!w)return;range.value=w.value;if(number)number.value=w.value;const text=card.querySelector('[data-role=value]');if(text)text.textContent=w.value;};
   range?.addEventListener('input',()=>change(range));range?.addEventListener('change',()=>change(range));number?.addEventListener('change',()=>change(number));
  }
 }
 window.addEventListener('blur',releaseAll);window.addEventListener('pagehide',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
 setInterval(()=>{for(const [id,button] of held){const w=store.read().widgets[id];if(!button.isConnected||document.hidden||!w?.value||w.inputOwner!==owner)release(id);else send(id,true);}},250);
 window.CodyDashboardInputs={attach,releaseAll};
})();
