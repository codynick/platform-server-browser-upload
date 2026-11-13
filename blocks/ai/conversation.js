'use strict';
(()=>{
 const $=id=>document.getElementById(id);let epoch=0,active=false,phase='idle',question='',answer='',message='Click Talk, ask one short question, then pause.',needsAudio=false,sleepCancel=null;
 const snapshot=()=>({active,phase,question,answer,message,needsAudio});
 function controls(){const locked=CodyAI._core.busy||!!window.blockProgramRunning||!!window.CodyPythonPilot?.running;$('conversationTalk').disabled=locked||active;$('conversationStop').disabled=!active;$('conversationEnableAudio').hidden=!needsAudio;$('conversationEnableSpeech').hidden=phase!=='blocked';}
 function render(){$('conversationQuestion').value=question;$('conversationAnswer').value=answer;$('conversationStatus').textContent=message;controls();}
 function state(next,text){phase=next;message=text;render();}
 function releaseChildren(){window.CodySpeech?.stop();window.CodyLLM?.stop();window.CodyTTS?.stop();}
 function stop(){epoch++;active=false;needsAudio=false;sleepCancel?.();releaseChildren();state('stopped','Stopped. Microphone, model and spoken output released.');return true;}
 function clear(){stop();question=answer='';state('idle','Click Talk, ask one short question, then pause.');}
 function check(ticket){if(ticket!==epoch)throw Error('Stopped');}
 function pause(){return new Promise(resolve=>{const timer=setTimeout(()=>{sleepCancel=null;resolve();},100);sleepCancel=()=>{clearTimeout(timer);sleepCancel=null;resolve();};});}
 async function run(ticket,args){
  try{
   state('checking','Checking for a local voice…');const available=await CodyTTS.commands.tts_available();check(ticket);if(!available)throw Error('No local speech voice is available in this browser. Try another browser/device. Remote voices are disabled.');
   state('starting','Loading English speech recognition / requesting microphone…');await CodySpeech.commands.speech_start_transcription({clear:true,microphone:args.microphone});check(ticket);
   let lastPoll=performance.now(),heardMs=0,suspendedSince=null;
   state('listening','Listening. Ask one short English question, then pause.');
   while(true){const s=await CodySpeech.commands.speech_status();check(ticket);if(s.error)throw Error(s.error);needsAudio=s.audioState==='suspended';
    const completed=String(await CodySpeech.commands.speech_transcript()||'').trim();check(ticket);question=completed||String(s.partial||'').trim();if(completed)break;
    if(needsAudio){suspendedSince??=performance.now();state('listening','Click Enable Microphone Audio in the AI panel to begin.');if(performance.now()-suspendedSince>60000)throw Error('Microphone audio was not enabled. Click Talk again and enable microphone audio.');}
    else{heardMs+=performance.now()-lastPoll;suspendedSince=null;state('listening',s.partial?`Listening: ${String(s.partial).slice(0,200)}`:'Listening. Ask one short English question, then pause.');if(heardMs>30000)break;}
    lastPoll=performance.now();if(!s.listening)throw Error('The microphone stopped before a question was recognized. Click Talk to retry.');await pause();check(ticket);
   }
   needsAudio=false;state('finishing','Finishing your question and turning the microphone off…');await CodySpeech.commands.speech_stop();check(ticket);question=String(await CodySpeech.commands.speech_transcript()||'').trim();check(ticket);
   if(!question)throw Error('No question was recognized. Check the microphone, click Talk and try again.');if(question.length>1000)throw Error('The question is too long. Click Talk and ask a shorter question.');
   state('thinking','Loading / running the local LLM. Your microphone is off…');await CodyLLM.commands.llm_start({prompt:question,max_tokens:args.max_tokens});check(ticket);
   while(true){const s=await CodyLLM.commands.llm_status();check(ticket);answer=String(s.answer||'');state('thinking',s.message||'Generating an answer…');if(s.phase==='error'||s.phase==='stopped')throw Error(s.message||'Language-model generation stopped.');if(s.phase==='complete')break;await pause();check(ticket);}
   if(!answer.trim())throw Error('The language model did not return an answer. Click Talk to retry.');
   const spoken=answer.slice(0,1000);state('speaking','Starting the spoken answer. Microphone remains off…');await CodyTTS.commands.tts_speak({text:spoken,voice:args.voice,rate:1});check(ticket);
   while(true){const s=await CodyTTS.commands.tts_status();check(ticket);if(s.phase==='error')throw Error(s.message||'Local speech output failed.');if(s.phase==='blocked')state('blocked','Click Enable Speech in the AI panel to hear the answer.');else if(s.speaking)state('speaking',answer.length>1000?'Speaking the first 1,000 characters; the full answer is displayed.':'Speaking the answer. Microphone is off.');else break;await pause();check(ticket);}
   active=false;state('complete','Finished. Verify the answer. Click Talk for another independent question.');
  }catch(e){if(ticket!==epoch)return;active=false;needsAudio=false;releaseChildren();state('error',e.message||String(e));}
 }
 function talk(args={}){if(active)throw Error('A voice question is already in progress. Stop it first.');const max_tokens=Number(args.max_tokens??64);if(!Number.isInteger(max_tokens)||max_tokens<16||max_tokens>128)throw Error('Use an answer limit of 16–128 tokens.');releaseChildren();epoch++;active=true;question=answer='';needsAudio=false;const ticket=epoch;state('checking','Checking for a local voice…');window.CodyAITools?.showTool('conversation');window.CodyAITools?.showTab('Process');void run(ticket,{microphone:args.microphone||'default',voice:args.voice||'auto',max_tokens});return true;}
 const commands={conversation_talk:async a=>talk(a),conversation_stop:async()=>stop(),conversation_active:async()=>active,conversation_question:async()=>question,conversation_answer:async()=>answer,conversation_message:async()=>message,conversation_status:async()=>snapshot()};
 window.CodyConversation={commands,stop,clear,controls,get active(){return active;}};
 $('conversationTalk').onclick=async()=>{try{await CodyAI.command('conversation_talk',{microphone:$('speechMicrophone').value,voice:$('ttsVoice').value});}catch(e){CodyAI._core.status(e.message);}};
 $('conversationStop').onclick=()=>{if(CodyAI._core.busy)CodyAI.stop();else stop();};
 $('conversationEnableAudio').onclick=async()=>{try{await CodySpeech.unlockAudio();}catch(e){CodyAI._core.status(e.message);}};
 $('conversationEnableSpeech').onclick=async()=>{try{await CodyTTS.retrySpeech();}catch(e){CodyAI._core.status(e.message);}};render();
})();
