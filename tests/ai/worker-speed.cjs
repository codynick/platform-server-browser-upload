const fs=require('fs'),http=require('http'),path=require('path'),sharp=require('sharp'),assert=require('assert/strict'),url=require('url');
const imageFile=process.argv[2];if(!imageFile)throw Error('Pass the reference cat photograph as the first argument. Requires developer-only sharp dependency.');
(async()=>{const root=path.resolve(__dirname,'../payload/blocks/ai');const server=http.createServer((req,res)=>{const f=path.join(root,req.url.split('?')[0]);if(!f.startsWith(root+'/')||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',f.endsWith('.wasm')?'application/wasm':'application/json');res.end(fs.readFileSync(f));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const nativeProcess=globalThis.process;
try{const {data,info}=await sharp(imageFile).ensureAlpha().raw().toBuffer({resolveWithObject:true});globalThis.process=undefined;globalThis.self=globalThis;let responses=[];globalThis.postMessage=m=>{if(m.id)responses.push(m)};
const {env,RawImage}=await import(path.join(root,'vendor/transformers.min.mjs'));await import(url.pathToFileURL(path.join(root,'worker.mjs')));
env.localModelPath=`http://127.0.0.1:${server.address().port}/models/`;env.backends.onnx.wasm.wasmPaths={mjs:url.pathToFileURL(path.join(root,'vendor/ort-wasm-simd-threaded.jsep.mjs')).href,wasm:`http://127.0.0.1:${server.address().port}/vendor/ort-wasm-simd-threaded.jsep.wasm`};
RawImage.prototype.resize=async function(w,h){const {data,info}=await sharp(Buffer.from(this.data),{raw:{width:this.width,height:this.height,channels:this.channels}}).resize(w,h).raw().toBuffer({resolveWithObject:true});return new RawImage(new Uint8ClampedArray(data),info.width,info.height,info.channels);};
await self.onmessage({data:{id:1,op:'prepare'}});assert(!responses.at(-1).error,responses.at(-1).error);
const records=[];
for(const [i,mode] of ['fast','balanced','detailed'].entries()){
 for(let run=0;run<2;run++){
 await self.onmessage({data:{id:10+i*2+run,op:'detect',mode,width:info.width,height:info.height,pixels:Uint8Array.from(data).buffer,confidence:50}});const reply=responses.at(-1);assert(!reply.error,reply.error);assert(reply.result.some(d=>d.label==='cat'));assert(Math.max(reply.metrics.inputWidth,reply.metrics.inputHeight)<=({fast:512,balanced:640,detailed:960})[mode]);records.push({...reply.metrics,labels:reply.result.map(d=>d.label)});console.log(JSON.stringify(records.at(-1)));
 }
}
const large=await sharp(imageFile).resize(960,720).ensureAlpha().raw().toBuffer();await self.onmessage({data:{id:30,op:'detect',mode:'detailed',width:960,height:720,pixels:Uint8Array.from(large).buffer,confidence:50}});const largeReply=responses.at(-1);assert(!largeReply.error,largeReply.error);assert.equal(largeReply.metrics.inputWidth,960);console.log('PASS: 960-pixel detailed input without unintended upscaling');
fs.writeFileSync('speed-benchmark.json',JSON.stringify(records,null,2));globalThis.process=nativeProcess;console.log('PASS: actual worker CPU/WASM, all three bounded modes, valid boxes/results, timings and repeated inference');
}finally{globalThis.process=nativeProcess;server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
