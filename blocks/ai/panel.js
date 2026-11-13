'use strict';
(()=>{
 const $=id=>document.getElementById(id),panel=$('aiPanel'),video=$('aiVideo'),canvas=$('aiCanvas');
 let worker=null,serial=0,pending=null,ready=false,busy=false,stream=null,epoch=0,results=[],image=null,selection=null,activeCancel=null,lastWorkerMetrics=null,lastMetrics=null;
 const status=s=>{$('aiStatus').textContent=s;window.CodyAIWorkbench?.progress(s);};
 const show=()=>{if($('liveMain').classList.contains('stage-collapsed'))$('toggleSpaces').click();window.CodySpaces.show('ai');};
 const classes=window.CodyAIClasses;
 const validConfidence=n=>{n=Number(n);if(!Number.isFinite(n)||n<1||n>100)throw Error('Confidence must be from 1 to 100 percent.');return n;};
 function controls(){const running=!!window.blockProgramRunning||!!window.CodyPythonPilot?.running,locked=busy||running;for(const id of ['aiPrepare','aiStart','aiCapture','aiCameraStop','aiDetect','aiSaveImage','aiUseImage','aiDeleteImage','aiCamera','aiImageName','aiSavedImage','aiConfidence','aiSpeed'])$(id).disabled=locked;$('aiUpload').disabled=locked&&!selection;if(!locked){$('aiCapture').disabled=!stream;$('aiCameraStop').disabled=!stream;$('aiDetect').disabled=!image;$('aiSaveImage').disabled=!image;$('aiUseImage').disabled=!$('aiSavedImage').value;$('aiDeleteImage').disabled=!$('aiSavedImage').value;}window.CodyAITools?.controls();window.CodyOCR?.controls();window.CodySpeech?.controls();window.CodyTTS?.controls();window.CodyLLM?.controls();}
 function draw(){
  if(!image){canvas.hidden=true;$('aiResults').replaceChildren();return;}canvas.hidden=false;canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d');c.putImageData(image,0,0);c.lineWidth=Math.max(2,canvas.width/250);c.font=`${Math.max(14,Math.round(canvas.width/40))}px sans-serif`;
  for(const d of results){const b=d.box,x=Math.max(0,b.xmin)*canvas.width,y=Math.max(0,b.ymin)*canvas.height,w=(Math.min(1,b.xmax)-Math.max(0,b.xmin))*canvas.width,h=(Math.min(1,b.ymax)-Math.max(0,b.ymin))*canvas.height;
   c.strokeStyle='#39ff88';c.strokeRect(x,y,w,h);const t=`${d.label} ${Math.round(d.confidence*100)}%`,th=Math.max(19,canvas.width/32);c.fillStyle='#102c24';c.fillRect(x,Math.max(0,y-th),Math.min(canvas.width-x,c.measureText(t).width+8),th);c.fillStyle='#fff';c.fillText(t,x+4,Math.max(th-4,y-4));
  }
  $('aiResults').replaceChildren(...results.map(d=>{const li=document.createElement('li');li.textContent=`${d.label}: ${Math.round(d.confidence*100)}%`;return li;}));
 }
 function accept(source,w,h){const scale=Math.min(1,1920/Math.max(w,h),Math.sqrt(3000000/(w*h)));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(source,0,0,c.width,c.height);image=c.getContext('2d').getImageData(0,0,c.width,c.height);results=[];draw();window.CodyAIWorkbench?.imageChanged();window.CodyAITools?.imageChanged();window.CodyOCR?.imageChanged();status('Image ready. Choose Process to detect objects or read text.');}
 function releaseCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;video.hidden=true;}
 function destroyWorker(){worker?.terminate();worker=null;ready=false;if(pending){pending.reject(Error('Stopped'));pending=null;}}
 function stop(){epoch++;window.CodyOCR?.stop();window.CodySpeech?.stop();window.CodyTTS?.stop();window.CodyLLM?.stop();activeCancel?.();releaseCamera();destroyWorker();if(selection){selection.reject(Error('Stopped'));selection=null;}status('Stopped. Camera, microphone and spoken output released.');}
 function clear(){stop();lastMetrics=null;$('aiTiming').textContent='CPU · 1 thread. Timing appears after detection.';window.CodyAIWorkbench?.clear();image=null;results=[];draw();$('aiResults').replaceChildren();window.CodyAITools?.imageChanged();window.CodyOCR?.clear();window.CodySpeech?.clear();window.CodyTTS?.clear();window.CodyLLM?.clear();}
 function getWorker(){
  if(worker)return worker;const w=new Worker(new URL('ai/worker.mjs?v=3.21.1-ai.9',location.href),{type:'module'});worker=w;
  w.onmessage=({data:d})=>{if(w!==worker)return;if(d.progress!==undefined){status(`Loading AI model: ${d.progress}% (${d.file||''})`);return;}if(pending?.id===d.id){if(d.metrics)lastWorkerMetrics=d.metrics;const p=pending;pending=null;d.error?p.reject(Error(d.error)):p.resolve(d.result);}};
  w.onerror=e=>{const p=pending;pending=null;w.terminate();if(worker===w){worker=null;ready=false;}p?.reject(Error(e.message||'AI worker could not load. Check server files and browser support.'));};return w;
 }
 function rpc(op,extra={}){return new Promise((resolve,reject)=>{const w=getWorker(),id=++serial;const timer=setTimeout(()=>{if(pending?.id===id){pending=null;w.terminate();worker=null;ready=false;reject(Error('AI timed out. Try a smaller image or another device.'));}},180000);pending={id,resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};w.postMessage({id,op,...extra},extra.pixels?[extra.pixels]:[]);});}
 async function prepare(){window.CodyTTS?.stop();window.CodyLLM?.stop();window.CodySpeech?.releaseEngine();window.CodyOCR?.releaseEngine();if(!ready){status('Loading CPU detector… First use downloads approximately 32 MB.');await rpc('prepare');ready=true;}status('CPU detector ready.');return true;}
 async function startCamera(facing){
  if(!['default','front','rear'].includes(facing)&&!(typeof facing==='string'&&facing.startsWith('device:')&&facing.length<600))throw Error('Camera must be default, front or rear.');
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera requires HTTPS and browser camera support. You can upload an image instead.');
  releaseCamera();const ticket=epoch;status('Allow camera access in your browser.');
  const s=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:1920},height:{ideal:1080},...(facing.startsWith('device:')?{deviceId:{exact:facing.slice(7)}}:facing==='default'?{}:{facingMode:{ideal:facing==='front'?'user':'environment'}})}});
  if(ticket!==epoch){s.getTracks().forEach(t=>t.stop());throw Error('Stopped');}stream=s;video.srcObject=s;video.hidden=false;
  try{await video.play();if(ticket!==epoch)throw Error('Stopped');}catch(e){if(ticket===epoch)releaseCamera();throw e;}await window.CodyAIWorkbench?.discover();status('Camera ready. Take a picture.');return true;
 }
 async function takePicture(){if(!stream||!video.videoWidth)throw Error('Start the camera before taking a picture.');accept(video,video.videoWidth,video.videoHeight);return true;}
 async function detect(confidence){
  confidence=validConfidence(confidence);if(!image)throw Error('Take a picture or upload an image first.');
  const start=performance.now(),wasReady=ready;await prepare();const prepared=performance.now();
  const mode=['fast','balanced','detailed'].includes($('aiSpeed').value)?$('aiSpeed').value:'fast';
  status(`Detecting objects on your CPU · ${mode} mode…`);results=[];draw();
  let input=image;if(Math.max(image.width,image.height)>960){const c=document.createElement('canvas'),scale=960/Math.max(image.width,image.height);c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);c.getContext('2d').drawImage(canvas,0,0,c.width,c.height);input=c.getContext('2d').getImageData(0,0,c.width,c.height);c.width=c.height=0;}const pixels=input.data.slice().buffer;lastWorkerMetrics=null;
  results=await rpc('detect',{pixels,width:input.width,height:input.height,confidence,mode});
  draw();const finished=performance.now();
  lastMetrics={...(lastWorkerMetrics||{}),mode,threads:1,loadingMs:wasReady?0:prepared-start,totalMs:finished-start};
  const seconds=ms=>(Math.max(0,Number(ms)||0)/1000).toFixed(2);
  $('aiTiming').textContent=`CPU · ${lastMetrics.threads} thread · ${mode} · ${lastMetrics.inputWidth||'?'} × ${lastMetrics.inputHeight||'?'} px | Load ${seconds(lastMetrics.loadingMs)} s | Prepare image ${seconds(lastMetrics.preprocessMs)} s | Inference ${seconds(lastMetrics.inferenceMs)} s | Finish ${seconds(lastMetrics.postprocessMs)} s | Total ${seconds(lastMetrics.totalMs)} s`;
  window.CodyAIWorkbench?.detected();window.CodyAITools?.showTool('objects');window.CodyAITools?.showTab('Results');status(`${results.length} object(s) detected in ${seconds(lastMetrics.totalMs)} s (${mode} mode).`);
  return results.map(d=>({...d,box:{...d.box}}));
 }
 async function choose(){if(['speech','tts','llm'].includes(window.CodyAITools?.tool)){window.CodySpeech?.releaseEngine();window.CodyAITools.showTool('objects');}show();window.CodyAITools?.showTab('Image');status('Click Upload Image in the AI panel to choose a file.');return new Promise((resolve,reject)=>{selection={resolve,reject};controls();});}
 async function command(action,args={},signal){
  signal?.throwIfAborted();if(busy)throw Error('AI is busy. Wait for the current AI operation to finish.');
  if(['count','found','results'].includes(action)){if(action==='results')return results.map(d=>({...d,box:{...d.box}}));const label=String(args.label||'person');if(!classes.includes(label))throw Error('Unknown detector class: '+label);const count=results.filter(d=>d.label===label).length;return action==='found'?count>0:count;}
  const operations={...Object.fromEntries(Object.entries({...window.CodyAIWorkbench?.commands,...window.CodyOCR?.commands,...window.CodySpeech?.commands,...window.CodyTTS?.commands,...window.CodyLLM?.commands}).map(([name,fn])=>[name,()=>fn(args,signal)])),prepare:()=>prepare(),start_camera:()=>startCamera(args.facing||'default'),take_picture:takePicture,choose_image:choose,detect_objects:()=>detect(args.confidence??50),stop_camera:()=>{releaseCamera();return true;}};
  if(!Object.hasOwn(operations,action))throw Error('Unknown AI operation.');busy=true;controls();const cancel=()=>stop();signal?.addEventListener('abort',cancel,{once:true});
  let abortReject;const aborted=new Promise((_,reject)=>{abortReject=()=>reject(signal?.reason||Error('Stopped'));activeCancel=abortReject;signal?.addEventListener('abort',abortReject,{once:true});});
  try{const value=await Promise.race([operations[action](),aborted]);signal?.throwIfAborted();return value;}finally{busy=false;controls();activeCancel=null;signal?.removeEventListener('abort',cancel);signal?.removeEventListener('abort',abortReject);}
 }
 async function manual(action,args){if(window.blockProgramRunning||window.CodyPythonPilot?.running){status('Use the program controls while a program is running. Stop it before using manual detection.');return;}try{await command(action,args);}catch(e){status(e.message);}}
 $('aiPrepare').onclick=()=>manual('prepare');$('aiStart').onclick=()=>manual('start_camera',{facing:$('aiCamera').value});$('aiCapture').onclick=()=>manual('take_picture');$('aiDetect').onclick=()=>manual('detect_objects',{confidence:$('aiConfidence').value});$('aiStop').onclick=()=>stop();$('aiCameraStop').onclick=()=>manual('stop_camera');
 $('aiUpload').onclick=()=>{if(busy&&!selection){status('Wait for the current AI operation to finish.');return;}if(window.blockProgramRunning&&!selection){status('Stop the program before replacing its image.');return;}$('aiFile').click();};
 $('aiFile').addEventListener('cancel',()=>{if(selection){selection.reject(Error('Image selection cancelled.'));selection=null;}});
 $('aiFile').onchange=async()=>{const file=$('aiFile').files[0],ticket=epoch,ownsBusy=!selection;if(ownsBusy){if(busy)return;busy=true;controls();}try{if(!file)return;if(file.size>12*1024*1024)throw Error('Choose an image smaller than 12 MB.');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPEG, PNG or WebP image.');const bitmap=await createImageBitmap(file);try{if(ticket!==epoch)return;if(bitmap.width*bitmap.height>24000000)throw Error('Image is too large. Choose an image under 24 megapixels.');accept(bitmap,bitmap.width,bitmap.height);}finally{bitmap.close();}selection?.resolve(true);selection=null;}catch(e){status(e.message);selection?.reject(e);selection=null;}finally{if(ownsBusy)busy=false;controls();$('aiFile').value='';}};
 window.CodyAI={command,stop,clear,show,controls,releaseDetector:destroyWorker,_core:{prepare,startCamera,takePicture,detect,releaseCamera,cancelCamera(){epoch++;releaseCamera();},accept,get image(){return image;},get results(){return results;},get canvas(){return canvas;},get video(){return video;},get busy(){return busy;},get metrics(){return lastMetrics;},setImage(data,found=[]){image=data;results=found;draw();window.CodyAITools?.imageChanged();window.CodyOCR?.imageChanged();},status}};window.addEventListener('pagehide',stop);controls();
})();
