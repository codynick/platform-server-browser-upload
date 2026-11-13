import {pipeline,env,TextStreamer} from '../vendor/transformers.min.mjs';
env.allowRemoteModels=false;env.allowLocalModels=true;
env.localModelPath=new URL('./models/fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9/',import.meta.url).href;
env.backends.onnx.wasm.wasmPaths=new URL('../vendor/',import.meta.url).href;
env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
let generator=null,busy=false;const progressValues=new Map();
self.onmessage=async({data:m})=>{
 if(busy){postMessage({id:m.id,error:'The language model is busy.'});return;}busy=true;
 try{
  if(!['prepare','generate'].includes(m.op))throw Error('Unknown language-model request.');
  if(m.op==='generate'){if(typeof m.prompt!=='string'||!m.prompt.trim()||m.prompt.length>1000||!Number.isInteger(m.maxTokens)||m.maxTokens<16||m.maxTokens>128)throw Error('Use a question of 1–1,000 characters and a 16–128 token answer limit.');}
  const started=performance.now(),cold=!generator;
  generator??=await pipeline('text-generation','onnx-community/SmolLM2-360M-Instruct-ONNX',{device:'wasm',dtype:'q8',progress_callback:p=>{if(p.status==='progress'){const progress=Math.round(p.progress||0);if(progressValues.get(p.file)!==progress){progressValues.set(p.file,progress);postMessage({id:m.id,progress,file:p.file});}}}});
  const loaded=performance.now(),loadingMs=cold?loaded-started:0;postMessage({id:m.id,ready:true,loadingMs});
  if(m.op==='prepare'){postMessage({id:m.id,result:{ready:true,loadingMs}});return;}
  
  const messages=[{role:'system',content:'Give a short, clear answer in English. Use at most two sentences.'},{role:'user',content:m.prompt.trim()}];
  const input=generator.tokenizer.apply_chat_template(messages,{tokenize:true,add_generation_prompt:true,return_tensor:false});if(input.length>384)throw Error('Question is too long after tokenization. Shorten it and retry.');
  let tokens=0,firstTokenMs=null;const decodeStarted=performance.now();
  const streamer=new TextStreamer(generator.tokenizer,{skip_prompt:true,skip_special_tokens:true,token_callback_function:ids=>{tokens+=ids.length;},callback_function:delta=>{if(!delta)return;firstTokenMs??=performance.now()-decodeStarted;postMessage({id:m.id,delta:String(delta),tokens});}});
  const output=await generator(messages,{max_new_tokens:m.maxTokens,do_sample:false,streamer});
  const text=String(output[0]?.generated_text?.at(-1)?.content||'').slice(0,8000),generationMs=performance.now()-decodeStarted;
  postMessage({id:m.id,result:{text,loadingMs,generationMs,totalMs:performance.now()-started,firstTokenMs:firstTokenMs||generationMs,tokens,inputTokens:input.length,limited:tokens>=m.maxTokens}});
 }catch(e){postMessage({id:m.id,error:e.message||String(e)});}finally{busy=false;}
};
