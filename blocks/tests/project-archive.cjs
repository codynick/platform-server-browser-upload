const fs=require('fs'),path=require('path'),assert=require('assert/strict'),Zip=require('../vendor/jszip.min.js'),codec=require('../project-archive.js');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../examples/stage-keyboard.codynick')),s=await codec.decode(source),encoded=await codec.encode(s);
 assert.deepEqual(await codec.decode(encoded),s);assert.equal(Buffer.from(encoded).subarray(0,2).toString(),'PK');
 await assert.rejects(()=>codec.decode(Buffer.from('{"workspace":{}}')),/Older formats/);
 async function mutate(change){const z=await Zip.loadAsync(source);await change(z);return z.generateAsync({type:'uint8array',compression:'DEFLATE'});}
 await assert.rejects(()=>mutate(z=>z.file('programs/main.py','tampered',{createFolders:false})).then(codec.decode),/checksum/);
 await assert.rejects(()=>mutate(z=>z.file('unexpected.txt','bad')).then(codec.decode),/directory/);
 await assert.rejects(()=>mutate(z=>z.remove('state/sprite.json')).then(codec.decode),/directory/);
 await assert.rejects(()=>mutate(async z=>{const m=JSON.parse(await z.file('manifest.json').async('string'));m.version=99;z.file('manifest.json',JSON.stringify(m));}).then(codec.decode),/Unsupported/);
 await assert.rejects(()=>codec.decode(new Uint8Array(8*1024*1024+1)),/8 MB/);
 // Corrupt only central-directory size metadata: streaming decompression must reject,
 // rather than trusting a falsely small advertised expanded size.
 const bad=Buffer.from(source);let central=bad.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));assert(central>0);bad.writeUInt32LE(1,central+24);await assert.rejects(()=>codec.decode(bad));
 const duplicate=Buffer.from(source);central=duplicate.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));duplicate.writeUInt32LE(5*1024*1024,central+24);await assert.rejects(()=>codec.decode(duplicate),/oversized/);
 const crc=Buffer.from(source);crc.writeUInt32LE((crc.readUInt32LE(central+16)^1)>>>0,central+16);await assert.rejects(()=>codec.decode(crc),/corrupt/);
 const pathEntry=Buffer.from(source);pathEntry[central+46]=47;await assert.rejects(()=>codec.decode(pathEntry),/Unexpected/);
 const Model=require('../sprite-model.js'),model=new Model();await model.command('set_appearance',{appearance:'bee'});await model.command('configure',{x:77});assert.equal(await model.command('appearance'),'bee');const snap=model.snapshotProject();model.reset();model.restore(snap);assert.equal(model.snapshot().x,77);assert.equal(model.snapshot().appearance,'bee');assert.deepEqual(model.snapshot().keys,[]);assert.equal(model.snapshot().mouse.down,false);
 console.log('PASS: portable ZIP roundtrip, corruption/size/schema/legacy rejection, bounded expansion, sprite snapshot and appearance API');
})().catch(e=>{console.error(e);process.exitCode=1;});
