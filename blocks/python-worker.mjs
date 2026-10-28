// A fresh worker per run makes even an infinite CPU loop stoppable.
const pending=new Map();let serial=0,ready=false,outputStart=Date.now(),outputCount=0;
const request=(op,json)=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});postMessage({type:'rpc',id,op,json});});
let notificationStart=Date.now(),notificationCount=0;
const notify=(op,json)=>{
 if(Date.now()-notificationStart>1000){notificationStart=Date.now();notificationCount=0;}
 if(++notificationCount>200)throw Error('Too many dashboard updates. Add await wait(0.05) inside the loop.');
 postMessage({type:'notify',op,json});
};
function output(text){
 if(Date.now()-outputStart>1000){outputStart=Date.now();outputCount=0;}
 if(outputCount++<100)postMessage({type:'output',text:String(text).slice(0,4000)});
 else if(outputCount===101)postMessage({type:'output',text:'[Further output limited to keep the editor responsive.]'});
}
self.onmessage=async event=>{
 const msg=event.data;
 if(msg.type==='reply'){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error(msg.error)):p.resolve(msg.result);}return;}
 if(msg.type!=='run'||ready)return;ready=true;
 try{
  postMessage({type:'phase',text:'Loading Python for this run…'});
  // Pinned runtime; local pilot requires Internet on first load.
  const {loadPyodide}=await import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs');
  const py=await loadPyodide({stdout:output,stderr:output,stdin:()=>{throw Error('input() is not supported in this pilot. Use a variable instead.');}});
  py.registerJsModule('_codynick_bridge',{request,notify});
  const response=await fetch('./codynick.py');if(!response.ok)throw Error('Cannot load the CodyNick Python library.');
  py.FS.writeFile('/home/pyodide/codynick.py',await response.text());
  postMessage({type:'phase',text:'Python running…'});
  const result=await py.runPythonAsync(msg.source,{filename:'program.py'});result?.destroy?.();
  postMessage({type:'done'});
 }catch(error){postMessage({type:'error',text:error.message||String(error)});}
};
