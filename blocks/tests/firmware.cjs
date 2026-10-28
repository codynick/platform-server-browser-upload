const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=process.argv[2]||path.resolve(__dirname,'../..'),F=require(path.join(root,'blocks/firmware.js'));
const m=JSON.parse(fs.readFileSync(path.join(root,'blocks/firmware/manifest.json'))),hex=fs.readFileSync(path.join(root,'blocks/firmware',m.file),'utf8');
const image=F.parseHex(hex);
assert(image.length>20000&&image.length<=32256);assert.equal(F.compare('1.19.6','1.9.9'),1);
assert.throws(()=>F.parseHex(hex.replace(':10',':11')),/checksum|record/);
assert.throws(()=>F.parseHex(hex.replace(/:00000001FF\s*$/,'')),/Incomplete/);
function mock({signature=[30,149,15],corrupt=false,unplug=false}={}){
 let queue=[],pending,closed=false,address=0,writes=0;const memory=new Uint8Array(32256).fill(255);
 const deliver=bytes=>{queue.push(...bytes);if(pending){const r=pending;pending=null;r({value:Uint8Array.from(queue.splice(0)),done:false});}};
 return {get writes(){return writes;},setSignals:async()=>{},readable:{getReader:()=>({read:()=>closed?Promise.resolve({done:true}):queue.length?Promise.resolve({done:false,value:Uint8Array.from(queue.splice(0))}):new Promise(r=>pending=r),cancel:async()=>{closed=true;pending?.({done:true});},releaseLock(){}})},writable:{getWriter:()=>({releaseLock(){},write:async b=>{
  assert.equal(b[b.length-1],32);let result=[];
  switch(b[0]){case 0x75:result=signature;break;case 0x55:address=(b[1]|b[2]<<8)*2;break;case 0x64:if(unplug)throw Error('unplugged');memory.set(b.slice(4,-1),address);writes++;break;case 0x74:result=Array.from(memory.slice(address,address+128));if(corrupt)result[0]^=1;break;}
  // Fragment responses as USB/serial implementations may do.
  deliver([0x14]);queueMicrotask(()=>deliver([...result,0x10]));
 }})}};
}
(async()=>{
 let port=mock(),progress=[];await new F.Programmer(port,s=>progress.push(s)).upload(image);assert.equal(port.writes,image.length/128);assert(progress.at(-1).includes('100%'));
 port=mock({signature:[0,0,0]});await assert.rejects(()=>new F.Programmer(port,()=>{}).upload(image),/not an ATmega/);assert.equal(port.writes,0);
 await assert.rejects(()=>new F.Programmer(mock({corrupt:true}),()=>{}).upload(image),/verification failed/);
 await assert.rejects(()=>new F.Programmer(mock({unplug:true}),()=>{}).upload(image),/unplugged/);
 console.log('PASS: supplied HEX, validation, version ordering, full upload/readback, fragmented replies, wrong board, corruption, unplug');
})().catch(e=>{console.error(e);process.exitCode=1;});
