import {pipeline, env, RawImage} from './vendor/transformers.min.mjs';
env.allowRemoteModels=false;
env.allowLocalModels=true;
env.localModelPath=new URL('./models/',import.meta.url).href;
env.backends.onnx.wasm.wasmPaths=new URL('./vendor/',import.meta.url).href;
// CPU-only compatibility path. The speed fix is bounded inference dimensions.
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
const modes={fast:512,balanced:640,detailed:960};
let detector=null;
const tidy=values=>{for(const v of values)v?.dispose?.();};
self.onmessage=async({data:m})=>{
 try{
  if(m.op==='prepare'){
   const start=performance.now();
   detector??=await pipeline('object-detection','Xenova/yolos-tiny',{device:'wasm',dtype:'q8',progress_callback:p=>{
    if(p.status==='progress')postMessage({progress:Math.round(p.progress||0),file:p.file});
   }});
   postMessage({id:m.id,result:true,metrics:{initializationMs:performance.now()-start,threads:1}});
  }else if(m.op==='detect'){
   if(!detector)throw Error('Prepare the object detector first.');
   if(!Object.hasOwn(modes,m.mode))throw Error('Unknown detection speed mode.');
   if(!Number.isInteger(m.width)||!Number.isInteger(m.height)||m.width<16||m.height<16||m.width*m.height>960*960||!(m.pixels instanceof ArrayBuffer)||m.pixels.byteLength!==m.width*m.height*4)throw Error('Choose a valid image at least 16 pixels wide and high.');
   if(!Number.isFinite(m.confidence)||m.confidence<1||m.confidence>100)throw Error('Confidence must be from 1 to 100 percent.');
   const start=performance.now(),scale=Math.min(1,modes[m.mode]/Math.max(m.width,m.height));
   const width=Math.max(16,Math.round(m.width*scale)),height=Math.max(16,Math.round(m.height*scale));
   // Explicit dimensions avoid this runtime's shortest/longest-edge upscaling.
   detector.processor.image_processor.size={width,height};
   const image=new RawImage(new Uint8ClampedArray(m.pixels),m.width,m.height,4);
   let inputs,output;
   try{
    inputs=await detector.processor([image]);const preprocessed=performance.now();
    output=await detector.model({pixel_values:inputs.pixel_values,pixel_mask:inputs.pixel_mask});const inferred=performance.now();
    const batch=detector.processor.image_processor.post_process_object_detection(output,m.confidence/100,null)[0];
    const result=batch.boxes.map((b,i)=>({label:detector.model.config.id2label[batch.classes[i]],confidence:batch.scores[i],box:{xmin:b[0],ymin:b[1],xmax:b[2],ymax:b[3]}}));
    const end=performance.now(),shape=inputs.pixel_values.dims;
    postMessage({id:m.id,result,metrics:{mode:m.mode,threads:1,inputWidth:shape[3],inputHeight:shape[2],preprocessMs:preprocessed-start,inferenceMs:inferred-preprocessed,postprocessMs:end-inferred,workerMs:end-start}});
   }finally{tidy(Object.values(inputs||{}));tidy(Object.values(output||{}));}
  }else throw Error('Unknown AI worker request.');
 }catch(e){postMessage({id:m.id,error:e.message||String(e)});}
};
