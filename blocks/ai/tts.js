'use strict';
(()=>{
 const $=id=>document.getElementById(id),core=CodyAI._core,synth=window.speechSynthesis;
 let generation=0,current=null,phase='idle',message='Choose a local voice, enter text and click Speak.',lastText='',lastArgs=null,startTimer=null,endTimer=null;
 const waiters=new Set();
 const supported=()=>!!synth&&typeof synth.getVoices==='function'&&typeof synth.speak==='function'&&typeof window.SpeechSynthesisUtterance==='function';
 function voiceId(v){const s=JSON.stringify([v.voiceURI||'',v.lang||'',v.name||'']);let hash=2166136261;for(let i=0;i<s.length;i++)hash=Math.imul(hash^s.charCodeAt(i),16777619);return 'local-'+(hash>>>0).toString(16)+'-'+s.length;}
 function localVoices(){if(!supported())return [];let all;try{all=synth.getVoices();}catch{return [];}return all.filter(v=>v?.localService===true).map(v=>({voice:v,id:voiceId(v),name:String(v.name||'Local voice'),lang:String(v.lang||'')}));}
 function state(){return {supported:supported(),phase,speaking:phase==='pending'||phase==='speaking',message,text:lastText,voice:current?.voice?.name||'',localOnly:true};}
 function controls(){const locked=core.busy||!!window.blockProgramRunning||!!window.CodyPythonPilot?.running;for(const id of ['ttsText','ttsVoice','ttsRate','ttsSpeak','ttsRefresh'])$(id).disabled=locked;$('ttsStop').disabled=!current&&phase!=='loading';$('ttsEnable').hidden=phase!=='blocked';}
 function render(){const list=localVoices(),old=$('ttsVoice').value;$('ttsVoice').replaceChildren(new Option('Automatic local voice','auto'));for(const v of list)$('ttsVoice').add(new Option(`${v.name} (${v.lang||'language unspecified'})`,v.id));if(list.some(v=>v.id===old))$('ttsVoice').value=old;$('ttsAvailability').textContent=!supported()?'This browser does not expose text-to-speech.':list.length?`${list.length} local voice(s). Remote voices are excluded.`:'No local voice is available in this browser. Try Refresh Voices or another browser/device. Remote voices will not be used.';$('ttsStatus').textContent=message;$('ttsSpoken').value=lastText;controls();}
 function refresh(){render();if(localVoices().length)for(const resolve of [...waiters])resolve();return localVoices().map(({id,name,lang})=>({id,name,lang}));}
 function stop(){generation++;clearTimeout(startTimer);clearTimeout(endTimer);const had=current;current=null;if(had){had.onstart=had.onend=had.onerror=null;synth?.cancel();}phase='idle';lastArgs=null;message='Stopped.';for(const resolve of [...waiters])resolve();render();return true;}
 function clear(){stop();lastText='';$('ttsText').value='Hello from CodyNick.';$('ttsRate').value='1';$('ttsVoice').value='auto';message='Choose a local voice, enter text and click Speak.';render();}
 async function waitForVoices(){if(localVoices().length)return;await new Promise(resolve=>{const timer=setTimeout(done,1800);function done(){clearTimeout(timer);waiters.delete(done);resolve();}waiters.add(done);});}
 function selectVoice(request){const list=localVoices();if(!list.length)throw Error('No local voice is available. Try Refresh Voices or another browser/device. Remote voices are disabled.');if(request&&request!=='auto'){const chosen=list.find(v=>v.id===request);if(!chosen)throw Error('That local voice is no longer available. Refresh the voice list and choose again.');return chosen.voice;}const language=String(navigator.language||'en').toLowerCase();return (list.find(v=>v.lang.toLowerCase()===language)||list.find(v=>v.lang.toLowerCase().split('-')[0]===language.split('-')[0])||list.find(v=>/^en(?:-|$)/i.test(v.lang))||list.find(v=>v.voice.default)||list[0]).voice;}
 async function speak(args={}){
  const text=['string','number','boolean'].includes(typeof args.text)?String(args.text).trim():'';if(!text||text.length>1000)throw Error('Enter 1–1,000 characters to speak. Split longer text into shorter passages.');const rate=Number(args.rate??1);if(!Number.isFinite(rate)||rate<.5||rate>2)throw Error('Speech speed must be between 0.5 and 2.');const voice=String(args.voice||'auto');if(voice.length>64)throw Error('Invalid local voice identifier.');if(!supported())throw Error('This browser does not expose text-to-speech.');
  window.CodyLLM?.releaseEngine();stop();const ticket=generation;phase='loading';message='Checking local system voices…';render();window.CodyAITools?.showTool('tts');window.CodyAITools?.showTab('Process');
  try{if(!localVoices().length)await waitForVoices();if(ticket!==generation)throw Error('Stopped');selectVoice(voice);
   // Never listen to our own spoken output; preserve the warm recognizer model.
   if(window.CodySpeech?.capturing)await CodySpeech.commands.speech_stop();if(ticket!==generation)throw Error('Stopped');
   const selected=selectVoice(voice);if(selected.localService!==true)throw Error('Only local voices are allowed.');const u=new SpeechSynthesisUtterance(text);u.voice=selected;u.lang=selected.lang;u.rate=rate;u.pitch=1;u.volume=1;current=u;lastText=text;lastArgs={text,voice,rate};phase='pending';message=`Starting ${selected.name} (${selected.lang})…`;render();
   const valid=()=>ticket===generation&&current===u;
   u.onstart=()=>{if(!valid())return;clearTimeout(startTimer);phase='speaking';message=`Speaking with ${selected.name} · ${rate}×`;endTimer=setTimeout(()=>{if(valid()){stop();phase='error';message='Speech timed out. Try a shorter passage or another local voice.';render();}},240000);render();};
   u.onend=()=>{if(!valid())return;clearTimeout(startTimer);clearTimeout(endTimer);current=null;phase='idle';message='Finished speaking.';render();};
   u.onerror=e=>{if(!valid())return;clearTimeout(startTimer);clearTimeout(endTimer);current=null;phase=e.error==='not-allowed'?'blocked':'error';message=phase==='blocked'?'Click Enable Speech here to allow spoken output.':`Local speech failed (${e.error||'unavailable'}). Try another local voice/browser.`;render();};
   startTimer=setTimeout(()=>{if(valid()&&phase==='pending'){const retry=lastArgs;stop();lastArgs=retry;phase='blocked';message='Speech did not start. Click Enable Speech, or try another local voice.';render();}},6000);
   synth.speak(u);return true;
  }catch(e){if(ticket===generation){stop();phase='error';message=e.message;render();core.status(message);}throw e;}
 }
 const commands={tts_available:async()=>{if(supported()&&!localVoices().length)await waitForVoices();return localVoices().length>0;},tts_speak:speak,tts_stop:async()=>stop(),tts_voices:async()=>{if(!localVoices().length)await waitForVoices();return refresh();},tts_is_speaking:async()=>state().speaking,tts_message:async()=>message,tts_status:async()=>state()};
 window.CodyTTS={commands,stop,clear,controls};
 $('ttsSpeak').onclick=async()=>{try{await CodyAI.command('tts_speak',{text:$('ttsText').value,voice:$('ttsVoice').value,rate:Number($('ttsRate').value)});}catch(e){core.status(e.message);}};
 $('ttsStop').onclick=()=>{if(core.busy)CodyAI.stop();else stop();};$('ttsRefresh').onclick=()=>refresh();$('ttsEnable').onclick=async()=>{if(!lastArgs)return;try{await CodyAI.command('tts_speak',lastArgs);}catch(e){core.status(e.message);}};
 synth?.addEventListener?.('voiceschanged',refresh);render();
})();
