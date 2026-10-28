const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=process.argv[2]||path.resolve(__dirname,'../..'),F=require(path.join(root,'blocks/firmware.js'));
const m=JSON.parse(fs.readFileSync(path.join(root,'blocks/firmware/manifest.json'))),data=fs.readFileSync(path.join(root,'blocks/firmware',m.file));
(async()=>{
 global.fetch=async()=>new Response(data,{headers:{'Content-Length':String(data.length)}});
 const updates=[];const image=await F.download(m,n=>updates.push(n));assert(image.length>20000);assert.equal(updates[0],0);assert.equal(updates.at(-1),100);
 global.fetch=async()=>new Response(Buffer.concat([data,Buffer.from('bad')]));await assert.rejects(()=>F.download(m),/checksum failed/);
 global.fetch=async()=>new Response('missing',{status:404});await assert.rejects(()=>F.download(m),/Cannot download/);
 console.log('PASS: streamed firmware download, exact checksum, numeric progress, corrupt response and HTTP error');
})().catch(e=>{console.error(e);process.exitCode=1;});
