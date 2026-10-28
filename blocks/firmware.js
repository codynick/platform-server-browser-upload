'use strict';
// Arduino Uno Optiboot STK500v1 protocol. No erase or EEPROM commands are sent.
(() => {
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 function compare(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return Math.sign(x[i]-y[i]);}return 0;}
 function parseHex(text){
  const image=new Uint8Array(32256).fill(255),seen=new Set();let base=0,end=0,eof=false;
  for(const raw of text.trim().split(/\r?\n/)){
   const line=raw.trim();if(!line)continue;
   if(eof||!/^:([0-9a-f]{2})+$/i.test(line))throw Error('Invalid firmware HEX record.');
   const b=Uint8Array.from(line.slice(1).match(/../g),s=>parseInt(s,16));
   if(b.length!==b[0]+5||b.reduce((a,v)=>a+v,0)%256)throw Error('Firmware HEX checksum failed.');
   const n=b[0],addr=(b[1]<<8)|b[2],type=b[3],data=b.slice(4,4+n);
   if(type===0){if(base+addr+n>image.length)throw Error('Firmware exceeds Uno application memory.');for(let i=0;i<n;i++){const at=base+addr+i;if(seen.has(at))throw Error('Overlapping firmware records.');seen.add(at);image[at]=data[i];}end=Math.max(end,base+addr+n);}
   else if(type===1){if(n||addr)throw Error('Invalid HEX end record.');eof=true;}
   else if(type===2||type===4){if(n!==2||addr)throw Error('Invalid HEX address record.');base=((data[0]<<8)|data[1])*(type===2?16:65536);}
   else throw Error('Unsupported firmware HEX record.');
  }
  if(!eof||!end||!seen.has(0))throw Error('Incomplete firmware HEX file.');
  return image.slice(0,Math.ceil(end/128)*128);
 }
 async function release(){
  const res=await fetch('firmware/manifest.json',{cache:'no-store'});if(!res.ok)throw Error('Cannot load firmware release.');
  const m=await res.json();
  if(m.board!=='arduino-uno'||!/^\d+\.\d+\.\d+$/.test(m.version)||!/^CodyPi\.[a-f0-9]{64}\.hex$/.test(m.file)||!/^[a-f0-9]{64}$/.test(m.sha256))throw Error('Invalid firmware manifest.');
  return m;
 }
 async function download(m,progress=()=>{}){
  progress(0);
  const res=await fetch('firmware/'+m.file,{cache:'no-store'});if(!res.ok)throw Error('Cannot download firmware.');
  const chunks=[];let received=0;const total=Number(res.headers?.get('Content-Length'))||0;
  if(res.body?.getReader){const reader=res.body.getReader();try{while(true){const {value,done}=await reader.read();if(done)break;chunks.push(value);received+=value.length;progress(total?Math.min(99,received/total*100):null);}}finally{reader.releaseLock();}}
  else{const bytes=new Uint8Array(await res.arrayBuffer());chunks.push(bytes);received=bytes.length;}
  const bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==m.sha256)throw Error('Firmware download checksum failed. Reconnect to retry.');
  const image=parseHex(new TextDecoder().decode(bytes));progress(100);return image;
 }
 class Programmer {
  constructor(port,progress,log=()=>{}){this.port=port;this.progress=progress;this.log=log;this.bytes=[];this.error=null;this.stage='starting uploader';}
  async start(){this.reader=this.port.readable.getReader();this.writer=this.port.writable.getWriter();this.pump=(async()=>{try{while(true){const r=await this.reader.read();if(r.done)break;this.bytes.push(...r.value);}}catch(e){this.error=e;}finally{this.error ||= Error('USB connection ended.');}})();}
  async exact(n,timeout=1400){const until=Date.now()+timeout;while(this.bytes.length<n){if(this.error)throw this.error;if(Date.now()>until)throw Error('CJP bootloader timed out. Check the port and USB cable, then retry.');await sleep(5);}return this.bytes.splice(0,n);}
  async command(bytes,n=0){await this.writer.write(Uint8Array.from([...bytes,0x20]));const reply=await this.exact(n+2);if(reply[0]!==0x14||reply[n+1]!==0x10)throw Error('Unexpected Uno bootloader response: '+reply.map(v=>v.toString(16).padStart(2,'0')).join(' '));return reply.slice(1,-1);}
  async reset(){
   await this.port.setSignals({dataTerminalReady:false,requestToSend:false});await sleep(250);
   this.bytes=[];await this.port.setSignals({dataTerminalReady:true,requestToSend:true});await sleep(100);
  }
  async synchronize(){
   this.stage='connecting to Uno bootloader';
   for(let reset=0;reset<3;reset++){
    this.progress('Connecting to Uno bootloader (attempt '+(reset+1)+' of 3)');
    this.log('BOOT reset '+(reset+1));await this.reset();
    // Probe repeatedly inside one boot window. A single early packet can be
    // lost during startup; waiting a full command timeout then resetting repeats it.
    for(let probe=0;probe<8;probe++){
     this.log('BOOT sync '+(reset+1)+'.'+(probe+1));
     await this.writer.write(Uint8Array.of(0x30,0x20));
     const until=Date.now()+120;let previous=-1;
     while(Date.now()<until){
      if(this.error)throw this.error;
      while(this.bytes.length){
       const byte=this.bytes.shift();
       if(previous===0x14&&byte===0x10){
        this.log('BOOT synchronized');
        // Drain duplicate synchronization replies before issuing binary commands.
        await sleep(40);this.bytes=[];return;
       }
       previous=byte;
      }
      await sleep(5);
     }
    }
   }
   throw Error('No Uno bootloader reply after 3 reset attempts. No firmware was written. On mobile, disconnect/reconnect USB and retry; if it repeats, open Console and share the BOOT messages.');
  }
  async upload(image){
   await this.start();
   try{
    await this.synchronize();
    this.stage='checking Uno signature';
    const signature=await this.command([0x75],3);
    if(signature.join(',')!=='30,149,15')throw Error('Selected device is not an ATmega328P Uno. Nothing was written.');
    this.log('BOOT signature '+signature.map(v=>v.toString(16)).join(' '));
    await this.command([0x50]);
    for(let at=0;at<image.length;at+=128){
     this.stage='writing firmware page '+(at/128+1);
     const word=at/2,page=image.slice(at,at+128);
     await this.command([0x55,word&255,word>>8]);
     await this.command([0x64,0,128,0x46,...page]);
     await this.command([0x55,word&255,word>>8]);
     this.stage='verifying firmware page '+(at/128+1);
     const read=await this.command([0x74,0,128,0x46],128);
     if(read.some((v,i)=>v!==page[i]))throw Error('Firmware verification failed. Reconnect and retry installation.');
     this.progress('Installing and verifying firmware',Math.round((at+128)/image.length*100));
    }
    await this.command([0x51]);
   }catch(e){this.log('BOOT failure at '+this.stage+': '+e.message);throw Error(this.stage+': '+e.message);}finally{this.writer.releaseLock();try{await this.reader.cancel();}catch{}await this.pump;this.reader.releaseLock();}
  }
 }
 const api={compare,parseHex,release,download,Programmer};
 if(typeof module!=='undefined')module.exports=api;else window.CjpFirmware=api;
})();
