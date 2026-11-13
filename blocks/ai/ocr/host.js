'use strict';
importScripts('./vendor/tesseract.min.js');
let engine=null,loading=null,busy=false;
const base=new URL('./',self.location.href),path=name=>new URL(name,base).href;
async function prepare(){if(engine)return;loading??=Tesseract.createWorker('eng',1,{workerPath:path('vendor/worker.min.js'),corePath:path('core/'),langPath:path('languages/'),workerBlobURL:false,legacyCore:false,legacyLang:false,gzip:true,cachePath:'codynick-eng-fast-7',logger:m=>postMessage({progress:Math.round((m.progress||0)*100),status:String(m.status||'Loading OCR')})});engine=await loading;}
function wordsOf(blocks){const words=[];for(const b of blocks||[])for(const p of b.paragraphs||[])for(const l of p.lines||[])for(const w of l.words||[])if(w.text?.trim()&&w.bbox)words.push({text:w.text,confidence:w.confidence,box:{xmin:w.bbox.x0,ymin:w.bbox.y0,xmax:w.bbox.x1,ymax:w.bbox.y1}});return words.slice(0,2000);}
self.onmessage=async({data:m})=>{if(busy){postMessage({id:m.id,error:'OCR is busy.'});return;}busy=true;try{
 const start=performance.now();await prepare();const loaded=performance.now();
 if(m.op==='prepare'){postMessage({id:m.id,result:true});return;}
 if(m.op!=='read'||!['auto','block','line'].includes(m.layout)||!(m.bytes instanceof ArrayBuffer)||m.bytes.byteLength>20*1024*1024)throw Error('Invalid OCR request.');
 await engine.setParameters({tessedit_pageseg_mode:{auto:3,block:6,line:7}[m.layout],preserve_interword_spaces:'1',user_defined_dpi:'150'});
 const {data}=await engine.recognize(new Uint8Array(m.bytes),{rotateAuto:false},{text:true,blocks:!!m.words,hocr:false,tsv:false,box:false,unlv:false,osd:false,pdf:false,imageColor:false,imageGrey:false,imageBinary:false});
 postMessage({id:m.id,result:{text:String(data.text||'').slice(0,200000),confidence:Number(data.confidence)||0,words:m.words?wordsOf(data.blocks):[],initializationMs:loaded-start,recognitionMs:performance.now()-loaded}});
}catch(e){postMessage({id:m.id,error:e.message||String(e)});}finally{busy=false;}};
