(() => {
 'use strict';
 const menus={"phrases": ["Hello", "Welcome", "Good morning", "Good bye", "Warning", "Keep away", "Up", "Down", "Left", "Right", "Open", "Close", "Ok", "Click", "Open the tap", "Close the tap", "Tap is open", "Tap is closed", "Thief Thief", "There's a thief in the house", "Fire", "Smoke", "Humidity", "Temperature", "Soil Moisture", "Parking Capacity", "Was", "Is", "A little", "A lot", "Give me water", "Please give me water", "Can you give me water", "I'm thirsty", "I am quenched", "I'm full", "Water consumption is high", "Hurry up", "It's time to go", "Welcome to school", "How are you athlete", "Welcome footballer"], "persian": ["سلام", "بالا", "چپ", "راست", "پایین", "کلیک", "خوش آمدید", "نزدیک نشو", "خدا نگهدار", "هشدار", "دزد", "صاحب خانه دزد", "آتیش", "دود", "رطوبت", "دما", "رطوبت خاک", "ظرفیت پارکینگ", "می‌باشد", "است", "کم", "زیاد", "به من آب دهید", "تشنه ام", "وای تشنمه ( زن )", "وای تشنمه ( مرد )", "سیراب شدم ( زن )", "سیراب شدم ( مرد )", "لطفا به من آب بدید.( زن )", "لطفا به من آب بدید.( مرد )", "میشه به من آب بدید ؟ ( زن )", "میشه به من آب بدید ؟ ( مرد )", "بشتابید بسوی نماز", "به مدرسه خوش آمدی", "چطوری ورزشکار", "خوش اومدی فوتبالیست", "شیر آب بازه", "شیر آب را ببندید", "صبح شما بخیر", "مصرف آب بالاست", "وقت نماز است", "دزد [track 42]", "آتیش [track 43]"]},actions=['mute','unmute','volume_up','volume_down','stop','next','previous','pause','resume','repeat_track','repeat_track_off','repeat_all','repeat_all_off','shuffle'];
 const languages={Arabic:[9,13],English:[10,14],German:[11,15],French:[17,18]};
 const integer=(v,lo,hi,name)=>{v=Number(v);if(!Number.isInteger(v)||v<lo||v>hi)throw Error(name+' must be an integer from '+lo+' to '+hi);return v;};
 const number=(v,lo,hi,name)=>{v=Number(v);if(!Number.isFinite(v)||v<lo||v>hi)throw Error(name+' must be '+lo+' to '+hi);return v;};
 const lookup=(names,value,label)=>{const index=names.findIndex(s=>s.toLowerCase()===String(value).toLowerCase());if(index<0)throw Error('Unknown '+label);return index;};
 const language=value=>languages[String(value)==='Deutsch'?'German':String(value)]||(()=>{throw Error('Unknown DFPlayer language');})();
 function sayInt(folder,n){if(n===0)return [[folder,128]];const out=[];if(n<0){out.push([folder,211]);n=-n;}const hundreds=v=>{if(v>=100)out.push([folder,100+Math.floor(v/100)]);if(v%100)out.push([folder,v%100]);};for(const [scale,word]of [[1e9,130],[1e6,120],[1e3,110]]){const part=Math.floor(n/scale);if(part){if(part===1)out.push([folder,word+1]);else{hundreds(part);out.push([folder,word]);}n%=scale;}}hundreds(n);return out;}
 function sayNumber(folder,cents){const abs=Math.abs(cents),out=[];if(cents<0)out.push([folder,211]);out.push(...sayInt(folder,Math.floor(abs/100)));const frac=abs%100;if(frac){out.push([folder,205]);if(frac<10)out.push([folder,128]);out.push([folder,frac]);}return out;}
 const whole=n=>n===0?[[5,128]]:n<=20||n%10===0?[[5,n]]:[[6,Math.floor(n/10)*10],[5,n%10]];
 function plan(type,a={}){
  if(type==='cn_df_busy')return {kind:'busy'};
  if(type==='cn_df_wait')return {kind:'wait',timeout:number(a.timeout??0,0,86400,'Timeout')};
  if(type==='cn_df_volume')return {kind:'volume',volume:number(a.volume,0,100,'Volume'),packet:[0xA0+Math.floor(Number(a.volume)*3/10)]};
  if(type==='cn_df_control'){const action=String(a.action),code=actions.indexOf(action);if(code<0)throw Error('Unknown DFPlayer action');return {kind:'control',action,packet:[0x47,code,0,0]};}
  const wait=type.endsWith('_wait');if(wait)type=type.slice(0,-5);let packet,sequence,label,timeout=10;
  if(type==='cn_df_phrase'){const track=lookup(menus.phrases,a.phrase,'phrase')+1,folder=language(a.language)[0];packet=[folder,track];sequence=[[folder,track]];label=menus.phrases[track-1]+' · '+a.language;}
  else if(type==='cn_df_persian'){const track=lookup(menus.persian,a.phrase,'Persian phrase')+1;packet=[2,track];sequence=[[2,track]];label=menus.persian[track-1];}
  else if(type==='cn_df_emotion'){const names=['Happy','Sad','Angry','Surprise','Neutral'],i=lookup(names,a.emotion,'emotion');packet=[1,15+i];sequence=[[1,15+i]];label=names[i];timeout=60;}
  else if(type==='cn_df_whole'){const n=integer(a.value,0,100,'Whole number');packet=n===0?[5,0,0,0,0]:[5,n];sequence=whole(n);label=String(n);}
  else if(type==='cn_df_number'){const value=number(a.value,-21474836.47,21474836.47,'Number'),folder=language(a.language)[1],cents=Math.sign(value)*Math.floor(Math.abs(value)*100+.5);if(Math.abs(cents)>2147483647)throw Error('Number exceeds the signed hundredths range');packet=[folder,(cents>>>24)&255,(cents>>>16)&255,(cents>>>8)&255,cents&255];sequence=sayNumber(folder,cents);label=String(cents/100)+' · '+a.language;timeout=18;}
  else if(type==='cn_df_track'){const large=a.mode==='large';if(!['standard','large'].includes(a.mode))throw Error('Unknown track mode');const folder=integer(a.folder,1,large?10:99,'Folder'),track=integer(a.track,1,large?1000:255,'Track');packet=large?[folder,track&255,track>>8]:[folder,track];sequence=!large&&folder===5?(track>100&&track%100===0?[[5,0]]:whole(track>100?track%100:track)):[[folder,track]];label='Folder '+folder+', track '+track;timeout=large?12:10;}
  else throw Error('Unsupported DFPlayer block: '+type);
  return {kind:'play',packet,sequence,label,wait,gap:sequence.length>1?(a.language==='French'?1.1:a.language==='German'||a.language==='Deutsch'?.48:.4):0,timeout:number(a.timeout??timeout,0,86400,'Timeout')};
 }
 const frame=bytes=>'CN@@DF@@W'+bytes.length+bytes.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
 let catalogPromise=null,job=null,generation=0,repeatTrack=false,repeatAll=false,shuffle=false;const hardwareStates=new WeakMap(),bindings=new WeakMap();
 const store=()=>window.CodyLiveStore;
 const config=()=>store().read().scene.dfplayer||{volume:50,muted:false};
 const publish=state=>store().update(s=>{s.dfplayer={at:Date.now(),status:'stopped',busy:false,title:'',progress:0,duration:0,position:0,error:'',...state};});
 async function catalog(){if(!catalogPromise)catalogPromise=fetch('/simulator/dfplayer/catalog.json?v=3.21.1-ai.29',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Cannot load DFPlayer audio catalogue');return r.json();}).catch(e=>{catalogPromise=null;throw e;});return catalogPromise;}
 function state(){if(!job)return;const audio=job.audio,done=job.index/job.items.length,position=Number.isFinite(audio?.currentTime)?audio.currentTime:0,duration=Number.isFinite(audio?.duration)?audio.duration:0;publish({status:job.paused?'paused':'playing',busy:!job.paused,title:job.label,position,duration,progress:Math.min(100,100*(done+(!job.inGap&&duration?position/duration/job.items.length:0)))});}
 function stopSimulation(error=null){generation++;if(!job){if(error)publish({status:'error',error:String(error.message||error)});return;}const old=job;job=null;old.audio?.pause();if(old.audio){old.audio.onended=null;old.audio.onerror=null;old.audio.src='';}old.resolve(false);publish(error?{status:'error',title:old.label,error:String(error.message||error)}:{title:old.label});}
 function applyVolume(){if(job?.audio){const c=config();job.audio.volume=Math.floor(c.volume*3/10)/30;job.audio.muted=c.muted;}}
 async function playSimulation(p,signal){
  const cat=await catalog();signal?.throwIfAborted();const items=p.sequence.map(([folder,track])=>{const item=cat.tracks.find(t=>t.folder===folder&&t.track===track);if(!item)throw Error('No audio assigned for folder '+folder+', track '+track);return item;});
  stopSimulation();const token=++generation;let resolve;const promise=new Promise(r=>{resolve=r;});job={items,index:0,label:p.label,paused:false,signal,promise,resolve,audio:null,token,gap:p.gap||0,inGap:false};
  async function next(){
   if(!job||job.token!==token)return;const current=job;if(current.paused){setTimeout(()=>void next().catch(fail),40);return;}
   if(current.index>=current.items.length){if(repeatTrack){current.index=0;}else if(repeatAll||shuffle){current.items=[cat.tracks[shuffle?Math.floor(Math.random()*cat.tracks.length):((cat.tracks.findIndex(t=>t.file===current.items.at(-1).file)+1)%cat.tracks.length)]];current.index=0;current.label=current.items[0].label;}else{job=null;publish({title:current.label,status:'finished',progress:100});current.resolve(true);return;}}
   const item=current.items[current.index],audio=new Audio('/simulator/dfplayer/'+item.file+'?v=3.21.1-ai.29');audio.preload='metadata';current.audio=audio;current.inGap=false;applyVolume();audio.onended=()=>{if(job===current){current.index++;current.inGap=true;if(current.gap&&current.index<current.items.length)setTimeout(()=>void next().catch(fail),current.gap*1000);else void next().catch(fail);}};audio.onerror=()=>fail(Error('Cannot play DFPlayer recording: '+item.label));audio.onloadedmetadata=state;
   try{await audio.play();if(job===current)state();else audio.pause();}catch(e){fail(Error('Audio playback failed. Click Run again or allow browser audio. '+e.message));throw e;}
  }
  function fail(error){if(job?.token===token){stopSimulation(error);window.CJP?.log?.('DFPlayer: '+error.message);}}
  await next();return {promise};
 }
 async function waitPromise(promise,timeout,signal,router){let done=false,result=false;promise.then(v=>{done=true;result=v;});const started=performance.now();while(!done){signal?.throwIfAborted();if(timeout&&performance.now()-started>=timeout*1000)return false;await router.wait(40,signal);}return result;}
 async function write(router,bytes,signal){const raw=await router.hardware.request(frame(bytes),'CN@@DF@@',signal);if(raw!=='OK')throw Error('DFPlayer unavailable or I2C write failed. Check the gadget and SD card.');}
 async function busy(router,signal){const raw=await router.hardware.request('CN@@DF@@B','CN@@DF@@B',signal);if(!['0','1'].includes(raw))throw Error('DFPlayer unavailable. Check its connection.');return raw==='1';}
 async function waitHardware(router,timeout,signal){const begin=performance.now();let seen=false;const h=hardwareStates.get(router)||{};while(true){signal?.throwIfAborted();const elapsed=performance.now()-begin;if(timeout&&elapsed>=timeout*1000)return false;if(h.paused){await router.wait(60,signal);continue;}const active=await busy(router,signal);if(active)seen=true;else if(seen)return true;else if(elapsed>=2000)return false;await router.wait(60,signal);}}
 function bind(signal,router,target){if(!signal)return;let targets=bindings.get(signal);if(!targets){targets=new Set();bindings.set(signal,targets);}const key=target+':'+(router.token||'');if(targets.has(key))return;targets.add(key);signal.addEventListener('abort',()=>{if(target==='SIMULATION'){if(job?.signal===signal)stopSimulation();}else if(hardwareStates.get(router)?.signal===signal&&router.t.connected){void write(router,[0x47,4,0,0]).catch(()=>{});}},{once:true});}
 async function call(type,a,signal,target,router){
  const p=plan(type,a);signal?.throwIfAborted();bind(signal,router,target);
  if(target==='HARDWARE'){
   const h=hardwareStates.get(router)||{paused:false};h.signal=signal;hardwareStates.set(router,h);
   if(p.kind==='busy')return busy(router,signal);
   if(p.kind==='wait')return waitHardware(router,p.timeout,signal);
   await write(router,p.packet,signal);if(p.kind==='control'){if(p.action==='pause')h.paused=true;if(['resume','stop','next','previous'].includes(p.action))h.paused=false;}
   if(p.kind==='play'){h.paused=false;if(p.wait){const ok=await waitHardware(router,p.timeout,signal);if(!ok)throw Error('DFPlayer did not finish before its timeout, or playback did not start.');return true;}}return;
  }
  if(target!=='SIMULATION')throw Error('Unknown DFPlayer target');
  if(p.kind==='busy')return !!job&&!job.paused;
  if(p.kind==='wait')return job?waitPromise(job.promise,p.timeout,signal,router):true;
  if(p.kind==='volume'){store().update(s=>{s.scene.dfplayer={...config(),volume:p.volume};});applyVolume();return;}
  if(p.kind==='control'){
   const action=p.action;if(['mute','unmute','volume_up','volume_down'].includes(action)){const c=config();if(action==='mute'||action==='unmute')c.muted=action==='mute';else c.volume=Math.round(Math.max(0,Math.min(30,Math.floor(c.volume*3/10)+(action==='volume_up'?1:-1)))*100/30);store().update(s=>{s.scene.dfplayer=c;});applyVolume();return;}
   if(action==='stop'){stopSimulation();return;}
   if(action==='pause'){if(job){job.paused=true;job.audio?.pause();state();}return;}
   if(action==='resume'){if(job){job.paused=false;try{if(!job.inGap)await job.audio?.play();state();}catch(e){stopSimulation(e);throw e;}}return;}
   if(action.startsWith('repeat_track')){repeatTrack=action==='repeat_track';return;}
   if(action.startsWith('repeat_all')){repeatAll=action==='repeat_all';if(!repeatAll)shuffle=false;return;}
   const cat=await catalog();signal?.throwIfAborted();if(action==='shuffle')shuffle=true;
   const index=job?cat.tracks.findIndex(t=>t.file===job.items[job.index]?.file):(action==='previous'?0:-1),offset=action==='previous'?-1:1,item=cat.tracks[action==='shuffle'?Math.floor(Math.random()*cat.tracks.length):(index+offset+cat.tracks.length)%cat.tracks.length];
   await playSimulation({sequence:[[item.folder,item.track]],label:item.label},signal);return;
  }
  const current=await playSimulation(p,signal);if(p.wait){const ok=await waitPromise(current.promise,p.timeout,signal,router);if(!ok)throw Error('DFPlayer simulation playback was interrupted or timed out.');return true;}
 }
 if(typeof document!=='undefined'){setInterval(()=>{if(job){applyVolume();if(!store().read().scene.gadgets.dfplayer){stopSimulation();return;}state();}},100);window.addEventListener('beforeunload',()=>stopSimulation());}
 window.CodyDFPlayer={resetSimulation(){repeatTrack=false;repeatAll=false;shuffle=false;stopSimulation();},plan,frame,sayInt,sayNumber,whole,call,stopSimulation,menus,actions};
})();
