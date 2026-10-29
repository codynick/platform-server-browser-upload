'use strict';
(function(root){
 const Zip=typeof module!=='undefined'?require('./vendor/jszip.min.js'):root.JSZip;
 const files=['programs/blocks.json','programs/main.py','state/editor.json','state/live.json','state/sprite.json','state/dashboard-layout.json','state/simulator-view.json'];
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true}),MAX=8*1024*1024;
 const json=s=>JSON.stringify(s,null,2)+'\n';
 async function sha(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
 function checkDirectory(bytes){
  if(bytes.length>MAX)throw Error('Project archive must be smaller than 8 MB.');
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===bytes.length){end=i;break;}
  if(end<0)throw Error('This is not a ZIP-based .codynick project. Older formats are not supported.');
  const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true),size=v.getUint32(end+12,true);
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||count!==files.length+1||v.getUint16(end+8,true)!==count||start+size!==end)throw Error('Invalid project ZIP directory.');
  const allowed=new Set(['manifest.json',...files]),entries=new Map();let pos=start,total=0;
  for(let i=0;i<count;i++){
   if(pos+46>end||v.getUint32(pos,true)!==0x02014b50)throw Error('Invalid project ZIP entry.');
   const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),expanded=v.getUint32(pos+24,true),nameSize=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true);
   if(pos+46+nameSize+extra+comment>end||flags&1||![0,8].includes(method)||expanded>4*1024*1024)throw Error('Unsupported or oversized project ZIP entry.');
   const name=decoder.decode(bytes.subarray(pos+46,pos+46+nameSize));if(!allowed.delete(name))throw Error('Unexpected or duplicate file in project: '+name);
   entries.set(name,{size:expanded,crc:v.getUint32(pos+16,true)});total+=expanded;if(total>MAX)throw Error('Expanded project is larger than 8 MB.');pos+=46+nameSize+extra+comment;
  }
  if(pos!==end||allowed.size)throw Error('Incomplete project ZIP.');return entries;
 }
 const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 function readBounded(file,entry){return new Promise((resolve,reject)=>{
  const chunks=[];let size=0,crc=-1,failed=false;const stream=file.internalStream('uint8array');
  stream.on('data',chunk=>{if(failed)return;size+=chunk.length;if(size>4*1024*1024||size>entry.size){failed=true;stream.pause();chunks.length=0;reject(Error('Expanded project entry exceeds its permitted size.'));return;}for(const byte of chunk)crc=crcTable[(crc^byte)&255]^(crc>>>8);chunks.push(chunk);});
  stream.on('error',reject);stream.on('end',()=>{if(failed)return;if(size!==entry.size||((crc^-1)>>>0)!==entry.crc){reject(Error('Project ZIP entry is corrupt.'));return;}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}resolve(bytes);});stream.resume();
 });}
 async function encode(s){
  if(s?.format!=='codynick-webserial'||s.version!==3||s.projectSchema!=='codynick-project/1')throw Error('Invalid complete project.');
  const text={
   'programs/blocks.json':json(s.workspace),'programs/main.py':s.python,
   'state/editor.json':json(s.editor),'state/live.json':json(s.state.live),'state/sprite.json':json(s.state.sprite),
   'state/dashboard-layout.json':json(s.state.layout),'state/simulator-view.json':json(s.state.simulatorView)
  };
  const zip=new Zip(),hashes={};let total=0;
  for(const name of files){const bytes=encoder.encode(text[name]);total+=bytes.length;if(bytes.length>4*1024*1024||total>MAX)throw Error('Project is too large to package.');hashes[name]=await sha(bytes);zip.file(name,bytes,{createFolders:false});}
  zip.file('manifest.json',json({format:'codynick-project',version:1,applicationVersion:s.applicationVersion,createdAt:new Date().toISOString(),files:hashes}),{createFolders:false});
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
 }
 async function decode(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input),entries=checkDirectory(bytes);
  const zip=await Zip.loadAsync(bytes),m=JSON.parse(decoder.decode(await readBounded(zip.file('manifest.json'),entries.get('manifest.json'))));
  if(m.format!=='codynick-project'||m.version!==1||!m.files||Object.keys(m.files).length!==files.length)throw Error('Unsupported .codynick project format.');
  const text={};
  for(const name of files){const data=await readBounded(zip.file(name),entries.get(name));if(await sha(data)!==m.files[name])throw Error('Project checksum failed: '+name);text[name]=decoder.decode(data);}
  return {format:'codynick-webserial',version:3,projectSchema:'codynick-project/1',applicationVersion:m.applicationVersion,workspace:JSON.parse(text['programs/blocks.json']),python:text['programs/main.py'],editor:JSON.parse(text['state/editor.json']),state:{live:JSON.parse(text['state/live.json']),sprite:JSON.parse(text['state/sprite.json']),layout:JSON.parse(text['state/dashboard-layout.json']),simulatorView:JSON.parse(text['state/simulator-view.json'])}};
 }
 const api={encode,decode,files};if(typeof module!=='undefined')module.exports=api;else root.CodyProjectArchive=api;
})(typeof window==='undefined'?globalThis:window);
