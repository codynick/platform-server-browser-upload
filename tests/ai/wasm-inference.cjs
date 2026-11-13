const fs=require('fs'),http=require('http'),path=require('path'),sharp=require('sharp');
const processImage=process.argv[2];if(!processImage)throw Error('Pass a reference JPEG containing a cat. Developer test requires sharp.');
(async()=>{
const root=path.resolve(__dirname,'../payload/blocks/ai');const server=http.createServer((req,res)=>{const f=path.join(root,req.url.split('?')[0]);if(!f.startsWith(root+'/')||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',f.endsWith('.wasm')?'application/wasm':'application/json');res.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{const nativeProcess=globalThis.process;globalThis.process=undefined;globalThis.self=globalThis;
const {pipeline,env,RawImage}=await import(path.join(root,'vendor/transformers.min.mjs'));
env.allowRemoteModels=false;env.localModelPath=`http://127.0.0.1:${server.address().port}/models/`;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.wasmPaths={mjs:require('url').pathToFileURL(path.join(root,'vendor/ort-wasm-simd-threaded.jsep.mjs')).href,wasm:`http://127.0.0.1:${server.address().port}/vendor/ort-wasm-simd-threaded.jsep.wasm`};
// Node supplies image resizing for this CPU test; browser uses its canvas APIs.
RawImage.prototype.resize=async function(w,h){const {data,info}=await sharp(Buffer.from(this.data),{raw:{width:this.width,height:this.height,channels:this.channels}}).resize(w,h).raw().toBuffer({resolveWithObject:true});return new RawImage(new Uint8ClampedArray(data),info.width,info.height,info.channels);};
const detector=await pipeline('object-detection','Xenova/yolos-tiny',{device:'wasm',dtype:'q8'});console.log('PASS WASM model load');
const {data,info}=await sharp(processImage).ensureAlpha().raw().toBuffer({resolveWithObject:true});const result=await detector(new RawImage(new Uint8ClampedArray(data),info.width,info.height,4),{threshold:.5,percentage:true});console.log(JSON.stringify(result));if(!result.some(d=>d.label==='cat'))throw Error('No cat detected');globalThis.process=nativeProcess;console.log('PASS real CPU/WASM inference');await detector.dispose();
}finally{server.close();}})().catch(e=>{console.error(e);globalThis.process=require('process');process.exitCode=1});
