'use strict';
(()=>{
 const $=id=>document.getElementById(id),core=CodyAI._core;let worker=null,serial=0,active=0,ready=false,phase='idle',answer='',message='Enter a short question. The model loads only when requested.',metrics=null,pendingPrepare=null,timer=null;
 const running=()=>['loading','generating'].includes(phase);
 function controls(){const locked=core.busy||!!window.blockProgramRunning||!!window.CodyPythonPilot?.running;for(const id of ['llmPrompt','llmTokens','llmPrepare','llmGenerate'])$(id).disabled=locked||running();for(const id of ['llmStop','llmStopResults'])$(id).disabled=!running()&&!worker;$('llmClear').disabled=locked||running();$('llmCopy').disabled=!answer;}
 function render(){$('llmAnswer').value=answer;$('llmStatus').textContent=message;$('llmResultStatus').textContent=message;$('llmTiming').textContent=metrics?`CPU · 1 thread · ${metrics.tokens} tokens · first text ${(metrics.firstTokenMs/1000).toFixed(2)} s · generation ${(metrics.generationMs/1000).toFixed(2)} s${metrics.limited?' · answer limit reached':''}`:'SmolLM2 360M Instruct · 8-bit · CPU only';controls();}
 function releaseEngine(markStopped=false){const wasRunning=running();active=++serial;clearTimeout(timer);worker?.terminate();worker=null;ready=false;pendingPrepare?.reject(Error('Stopped'));pendingPrepare=null;if(wasRunning){phase='stopped';message=answer?'Stopped. Partial answer kept.':'Stopped. Model released.';}else if(markStopped){if(phase!=='complete')phase='stopped';message=answer?'Model unloaded. Answer kept.':'Model unloaded.';}render();}
 function stop(){releaseEngine(true);return true;}
 function clear(){releaseEngine();answer='';metrics=null;phase='idle';message='Enter a short question. The model loads only when requested.';$('llmPrompt').value='What does a temperature sensor measure?';$('llmTokens').value='64';render();return true;}
 function fail(text){clearTimeout(timer);worker?.terminate();worker=null;ready=false;phase='error';message=String(text||'Language model failed. This device may not have enough available memory.');pendingPrepare?.reject(Error(message));pendingPrepare=null;render();core.status(message);}
 function armTimeout(id){clearTimeout(timer);timer=setTimeout(()=>{if(active===id)fail('Language model stalled. Stop, check the connection/available memory, and try a shorter question.');},180000);}
 function getWorker(){if(worker)return worker;const w=new Worker(new URL('ai/llm/worker.mjs?v=3.21.1-ai.9',location.href),{type:'module'});worker=w;
  w.onmessage=({data:d})=>{if(worker!==w||d.id!==active)return;
   if(d.error){fail(d.error);return;}if(d.progress!==undefined){armTimeout(d.id);message=`Loading local language model: ${d.progress}% · ${d.file||'model'}`;render();return;}
   if(d.ready){armTimeout(d.id);ready=true;if(phase==='loading')phase=pendingPrepare?'loading':'generating';message=pendingPrepare?'Language model ready.':'Generating a short answer on your CPU…';render();return;}
   if(d.delta!==undefined){armTimeout(d.id);answer=(answer+String(d.delta)).slice(0,8000);phase='generating';message=`Generating… ${d.tokens||0} tokens`;render();return;}
   if(d.result){clearTimeout(timer);if(pendingPrepare){const p=pendingPrepare;pendingPrepare=null;phase='ready';message='Language model ready.';render();p.resolve(true);}else{answer=String(d.result.text||'');metrics=d.result;phase='complete';message=d.result.limited?'Answer limit reached. The last sentence may be incomplete.':answer?'Answer complete. Verify facts before using it.':'No answer was generated. Try a simpler question.';render();}}
  };
  w.onerror=e=>{if(worker===w)fail(e.message||'The model worker failed. Check browser support, installed assets and available memory.');};return w;
 }
 function takeResources(){CodyAI.releaseDetector();window.CodyOCR?.releaseEngine();window.CodySpeech?.releaseEngine();window.CodyTTS?.stop();core.releaseCamera();window.CodyAITools?.showTool('llm');}
 function begin(op,args={}){takeResources();active=++serial;phase=ready&&op==='generate'?'generating':'loading';message=ready?'Generating a short answer…':'Loading language model on demand (about 370 MB of model data)…';metrics=null;if(op==='generate')answer='';render();const id=active;armTimeout(id);getWorker().postMessage({id,op,...args});}
 async function prepare(){if(running())throw Error('Wait for the current language-model operation or stop it.');if(ready)return true;return new Promise((resolve,reject)=>{pendingPrepare={resolve,reject};try{begin('prepare');}catch(e){pendingPrepare=null;fail(e.message);reject(e);}});}
 function start(args={}){if(running())throw Error('Stop the current answer before asking another question.');const prompt=String(args.prompt??'').trim(),maxTokens=Number(args.max_tokens??64);if(!prompt||prompt.length>1000||!Number.isInteger(maxTokens)||maxTokens<16||maxTokens>128)throw Error('Use a question of 1–1,000 characters and an answer limit of 16–128 tokens.');try{begin('generate',{prompt,maxTokens});window.CodyAITools?.showTab('Results');return true;}catch(e){fail(e.message);throw e;}}
 const commands={llm_prepare:prepare,llm_start:async a=>start(a),llm_stop:async()=>stop(),llm_answer:async()=>answer,llm_running:async()=>running(),llm_message:async()=>message,llm_status:async()=>({phase,ready,message,answer,metrics})};
 window.CodyLLM={commands,releaseEngine,stop,clear,controls};
 $('llmPrepare').onclick=async()=>{try{await CodyAI.command('llm_prepare');}catch(e){core.status(e.message);}};
 $('llmGenerate').onclick=async()=>{try{await CodyAI.command('llm_start',{prompt:$('llmPrompt').value,max_tokens:Number($('llmTokens').value)});}catch(e){core.status(e.message);}};
 for(const id of ['llmStop','llmStopResults'])$(id).onclick=()=>{if(core.busy)CodyAI.stop();else stop();};$('llmClear').onclick=()=>clear();
 $('llmCopy').onclick=async()=>{try{await navigator.clipboard.writeText(answer);core.status('Answer copied.');}catch{$('llmAnswer').focus();$('llmAnswer').select();core.status('Select and copy the answer with your keyboard or browser menu.');}};render();
})();
