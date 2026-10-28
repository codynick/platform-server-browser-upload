'use strict';
const $=id=>document.getElementById(id);
let port=null,reader=null,readTask=null,ready=false,busy=false,rx='',identityResolve=null,session=0;
const encoder=new TextEncoder();
const androidDevice=navigator.userAgentData?.platform==='Android'||/Android/i.test(navigator.userAgent||'');
const useUsb=()=>!!navigator.usb&&(androidDevice||!navigator.serial);
const supported=()=>useUsb()||!!navigator.serial;
function connectionError(e){
 if(e.name==='NotFoundError')return 'No device selected. Reconnect the CJP and click Connect to try again.';
 if(e.name==='SecurityError'||e.name==='NotAllowedError')return 'USB permission was denied or blocked. Allow Chrome to access the CJP, then retry.';
 if(useUsb())return 'WebUSB: '+e.message+' Close the Android serial app and reconnect the CJP. Open Console for details.';
 return e.message;
}
function log(message){const lines=$('log').textContent.split('\n').filter(Boolean);lines.push(`${new Date().toLocaleTimeString()}  ${message}`);$('log').textContent=lines.slice(-150).join('\n');$('log').scrollTop=$('log').scrollHeight;}
function controls(){const button=$('connect');button.disabled=busy||!supported()||!window.isSecureContext;button.textContent=busy?(port?'Connecting…':'Please wait…'):(port?'Disconnect':'Connect');button.classList.toggle('connected',ready);button.title=port?'Disconnect from CodyJoy Pro':'Connect to your CodyJoy Pro USB serial port';}
function notice(s){$('notice').textContent=s;window.portalToast?.(s);}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function send(text){if(!port)throw Error('Device disconnected.');if(text.length>20)throw Error('Command exceeds 20 bytes.');const frame=text.padEnd(20,'_');const writer=port.writable.getWriter();try{await writer.write(encoder.encode(frame));log('TX '+frame);}finally{writer.releaseLock();}}
async function readLoop(p,token){const decoder=new TextDecoder();const r=p.readable.getReader();reader=r;try{while(true){const {value,done}=await r.read();if(done)break;rx+=decoder.decode(value,{stream:true});let n;while((n=rx.indexOf('\n'))>=0){const line=rx.slice(0,n).replace(/\0/g,'').replace(/\r$/,'');rx=rx.slice(n+1);log('RX '+line);window.dispatchEvent(new CustomEvent('cjp-line',{detail:line}));if(/^CN@@CJP-Neo\|[^_]+/.test(line)&&identityResolve){identityResolve(line);identityResolve=null;}}if(rx.length>2048)rx=rx.slice(-256);}}catch(e){if(token===session)log('Serial read: '+e.message);}finally{r.releaseLock();if(reader===r)reader=null;if(token===session&&port===p){ready=false;window.dispatchEvent(new Event('cjp-disconnected'));controls();notice('Serial connection ended. Disconnect and reconnect the CJP.');$('status').textContent='Connection ended';}}}
async function disconnect(){window.dispatchEvent(new Event('cjp-disconnected'));session++;ready=false;identityResolve=null;const p=port;port=null;if(reader){try{await reader.cancel();}catch{}}if(readTask){try{await readTask;}catch{}}if(p){try{await p.close();}catch(e){log('Close: '+e.message);}}readTask=null;rx='';$('status').textContent='Disconnected';$('device').textContent='Waiting for a USB connection';controls();}
async function identify(p){
 const token=++session;rx='';readTask=readLoop(p,token);await delay(2200);
 if(port!==p)throw Error('Device disconnected during startup.');
 for(let attempt=0;attempt<3;attempt++){
  const result=new Promise(resolve=>{identityResolve=resolve;});
  await send('CN@@IDENTIFY');const identity=await Promise.race([result,delay(1800).then(()=>null)]);identityResolve=null;
  if(identity)return identity;
 }
 return null;
}
function firmwareVersion(identity){return identity?.match(/\|(\d+\.\d+\.\d+)(?:_|$)/)?.[1]||null;}
async function stopReader(){
 session++;identityResolve=null;
 // WebUSB cancels its pending bulk transfer by closing the device.
 if(reader){try{await reader.cancel();}catch{}}
 if(readTask){try{await readTask;}catch{}}readTask=null;rx='';
}
$('connect').onclick=async()=>{
 if(busy)return;
 if(port){busy=true;controls();try{await disconnect();notice('Disconnected. You can reconnect at any time.');}finally{busy=false;controls();}return;}
 busy=true;controls();
 try{
  const usb=useUsb();log('Connecting using '+(usb?'WebUSB CH340 1A86:7523':'Web Serial'));
  const p=usb?await window.Ch340UsbPort.requestPort():await navigator.serial.requestPort();
  try{await p.open({baudRate:115200});}catch(e){if(!usb)window.CjpLinuxHelp?.openFailure();throw e;}
  port=p;$('status').textContent='Checking firmware…';
  let identity=await identify(p);
  const release=await window.CjpFirmware.release();
  const installed=firmwareVersion(identity);
  if(!installed||window.CjpFirmware.compare(installed,release.version)<0){
   const message=installed?'CJP firmware '+installed+' is installed. Update to '+release.version+'?':'The selected device did not report a CJP firmware version. Install CodyPi '+release.version+'? Confirm that you selected your CJP Arduino Uno.';
   if(!window.confirm(message+'\n\nThis replaces the program on the selected board. Keep USB connected until verification finishes.'))throw Error('Firmware installation declined. Hardware is unavailable; simulation remains available.');
   notice('Downloading firmware…');const image=await window.CjpFirmware.download(release);
   ready=false;await stopReader();await p.close();
   await p.open({baudRate:115200});
   const preventLeave=event=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',preventLeave);
   try{await new window.CjpFirmware.Programmer(p,text=>{notice(text);$('status').textContent=text;}).upload(image);}finally{window.removeEventListener('beforeunload',preventLeave);}
   await p.close();await p.open({baudRate:115200});
   notice('Checking installed firmware…');identity=await identify(p);
   if(firmwareVersion(identity)!==release.version)throw Error('Upload completed, but the expected firmware version was not confirmed. Reconnect to retry.');
  }else if(window.CjpFirmware.compare(installed,release.version)>0){
   throw Error('CJP firmware '+installed+' is newer than this platform release ('+release.version+'). Update the platform before using hardware. No downgrade was performed.');
  }
  ready=true;$('status').textContent='Connected';$('device').textContent=identity.replace('CN@@','')+' · '+(p.transportName||'Web Serial');notice('CJP firmware '+release.version+' is ready.');log('Device firmware confirmed.');
 }catch(e){await disconnect();log('Connection error: '+e.name+': '+e.message);notice(connectionError(e)+' Click Connect to retry.');}finally{busy=false;controls();}
};
$('clearLog').onclick=()=>{$('log').textContent='';};
if(!window.isSecureContext)notice('HTTPS is required. Open https://'+window.location.host+'/blocks/.');else if(!supported())notice('USB connectivity is unavailable. Open the site directly in Chrome.');
if('serial'in navigator)navigator.serial.addEventListener('disconnect',event=>{if(event.target===port||event.port===port){notice('USB device unplugged.');if(!busy)disconnect();}});
if(navigator.usb)navigator.usb.addEventListener('disconnect',event=>{if(port?.device===event.device){notice('CJP USB device unplugged.');if(!busy)disconnect();}});
controls();

window.CJP={get connected(){return ready;},get occupied(){return busy;},send,log,preview:()=>{},controls,notice,
  raw:async text=>{if(!ready||!port)throw Error('Connect CJP first.');const w=port.writable.getWriter();try{await w.write(encoder.encode(text));log('TX '+text);}finally{w.releaseLock();}},
  fault:()=>{ready=false;controls();notice('Serial reply timed out. Disconnect and reconnect before retrying.');}
};
