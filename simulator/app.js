const localFetch=async(url,options={})=>{try{const data=url==='/state'?window.CodyLiveStore.simState():window.CodyLiveStore.simCommand(JSON.parse(options.body));return {ok:true,json:async()=>data};}catch(error){return {ok:false,json:async()=>({error:error.message})};}};
'use strict';

const $ = id => document.getElementById(id);
const mainPanelUrl = new URL(window.location.href);
mainPanelUrl.pathname = '/blocks/';
mainPanelUrl.search = '';
mainPanelUrl.hash = '';
$('mainPanel').hidden=window.self!==window.top;
$('mainPanel').href = mainPanelUrl.href;$('mainPanel').target='_top';
const newGadgets={
  dfplayer:{title:'Sound Player (DFPlayer)',body:"<div class=\"photo-device df-device\"><svg viewBox=\"290 350 650 490\" role=\"img\" aria-label=\"Sound Player\"><image href=\"/simulator/dfplayer/player.png?v=3.21.1-ai.29\" width=\"1181\" height=\"1181\"/></svg><strong id=\"dfTitle\">No recording selected</strong><p id=\"dfStatus\" role=\"status\">Stopped</p><progress id=\"dfProgress\" max=\"100\" value=\"0\" aria-label=\"Playback progress\"></progress><label>Volume (%) <input id=\"dfVolume\" type=\"number\" min=\"0\" max=\"100\" value=\"50\"></label><label><input id=\"dfMuted\" type=\"checkbox\"> Mute</label><p id=\"dfError\" role=\"alert\"></p></div>"},
  air:{title:'Air Temp/Hum',body:"<div class=\"photo-device air-device\"><img src=\"/simulator/air-th-probe.png?v=3.21.1-ai.28\" alt=\"Air Temp/Hum probe\"><div class=\"sensor-controls\"><label for=\"airTemperatureValue\">Air temperature (\u00b0C)</label><input id=\"airTemperatureValue\" type=\"number\" min=\"-55\" max=\"125\" step=\"0.1\" value=\"22\"><meter id=\"airTemperatureMeter\" min=\"-55\" max=\"125\" value=\"22\" aria-label=\"Measured air temperature\"></meter><label for=\"airHumidityValue\">Air humidity (%)</label><input id=\"airHumidityValue\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" value=\"50\"><progress id=\"airHumidityMeter\" max=\"100\" value=\"50\" aria-label=\"Measured air humidity\"></progress></div></div>"},
  light:{title:'Light sensor',body:"<div class=\"photo-device light-device\"><svg class=\"light-sensor-photo\" viewBox=\"95 255 899 435\" aria-label=\"CodyNick Light Sensor\"><image href=\"/simulator/light-sensor-photo.png?v=3.21.1-ai.26\" width=\"1181\" height=\"1181\"/></svg><div class=\"sensor-controls\"><label for=\"lightValue\">Light intensity (%)</label><input id=\"lightValue\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" value=\"50\"><progress id=\"lightMeter\" max=\"100\" value=\"50\" aria-label=\"Measured light intensity\"></progress></div></div>"},

  motion:{title:'PIR motion sensor',body:'<div class="sensor-controls"><label><input id="motionValue" type="checkbox"> Motion detected</label></div>'},
  rfid:{title:'RFID reader',body:'<div class="sensor-controls"><label>UID (8 hex characters)<input id="rfidValue" maxlength="8" value="00000000"></label></div>'},
  ultraseg:{title:'UltraSeg',body:'<div class="sensor-controls"><label>Distance (cm)<input id="ultraDistanceValue" type="number" min="2" max="400" step="0.1" value="50"></label><p>Display: <strong id="ultraSegmentValue">Blank</strong></p></div>'},
  joystick:{title:'Stand-Alone joystick',body:'<div class="photo-device"><img class="joystick-photo" src="/simulator/joystick.png" alt="Stand-Alone joystick"><div class="standalone-stick"></div><output id="standaloneState">Neutral</output></div>'},
  ultrasonic:{title:'Ultrasonic sensor',body:'<div class="photo-device"><img src="/simulator/ultrasonic.png" alt="Stand-Alone ultrasonic sensor"><div class="sensor-controls"><label for="distanceValue">Distance (cm)</label><input id="distanceValue" type="number" min="2" max="400" step="0.1" value="50"><input id="distanceSlider" type="range" min="2" max="400" step="0.1" value="50" aria-label="Simulated distance"></div></div>'},
  soil:{title:'Soil-moisture sensor',body:'<div class="photo-device"><img class="soil-photo" src="/simulator/soil.png" alt="Soil-moisture sensor"><div class="sensor-controls"><label for="soilValue">Soil moisture (%)</label><input id="soilValue" type="number" min="0" max="100" step="1" value="50"><input id="soilSlider" type="range" min="0" max="100" step="1" value="50" aria-label="Simulated soil reading"></div></div>'},
  wifi:{title:'Wi-Fi / IoT',body:'<div class="photo-device wifi-device"><img src="/simulator/wifi.png" alt="Wi-Fi and IoT gadget"><p class="sim-label">SIMULATED NETWORK</p><div class="network-controls"><label><input id="wifiLink" type="checkbox" checked> Wi-Fi available</label><label><input id="cloudLink" type="checkbox" checked> Cloud available</label></div><dl class="wifi-status"><dt>Wi-Fi</dt><dd id="wifiState">Disconnected</dd><dt>IoT</dt><dd id="iotState">Disconnected</dd><dt>SSID</dt><dd id="wifiSSID">Not configured</dd></dl><div class="cloud-editor"><label>Type<select id="cloudType"><option value="0">Int</option><option value="1">Float</option><option value="2">Bool</option><option value="3">String</option></select></label><label>Index<input id="cloudIndex" type="number" min="0" max="3" value="0"></label><label class="cloud-value">Value<input id="cloudValue" maxlength="40" value="0"></label><button id="cloudApply">Set value</button></div><pre id="cloudValues" aria-label="Simulated cloud variables"></pre></div>'}
};
// Older/customized deployed HTML may not yet contain the new picker entry.
if(!document.querySelector('[data-add="light"]')){
 const button=document.createElement('button');button.className='tool';button.draggable=false;button.dataset.add='light';button.title='Add Light sensor';
 button.innerHTML="<svg width=\"64\" height=\"42\" viewBox=\"95 255 899 435\" aria-hidden=\"true\"><image href=\"/simulator/light-sensor-photo.png?v=3.21.1-ai.26\" width=\"1181\" height=\"1181\"/></svg><span>Light sensor</span><b aria-hidden=\"true\">+</b>";
 document.querySelector('#gadgetPicker .toolbox')?.append(button);
}
if(!document.querySelector('[data-add="air"]')){const button=document.createElement('button');button.className='tool';button.dataset.add='air';button.innerHTML='<img src="/simulator/air-th-probe.png?v=3.21.1-ai.28" width="64" height="50" alt=""><span>Air Temp/Hum</span><b aria-hidden="true">+</b>';document.querySelector('#gadgetPicker .toolbox')?.append(button);}
if(!document.querySelector('[data-add="dfplayer"]')){const b=document.createElement('button');b.className='tool';b.dataset.add='dfplayer';b.innerHTML='<svg width="64" height="48" viewBox="290 350 650 490"><image href="/simulator/dfplayer/player.png?v=3.21.1-ai.29" width="1181" height="1181"/></svg><span>Sound Player</span><b aria-hidden="true">+</b>';document.querySelector('#gadgetPicker .toolbox')?.append(b);}
function gadgetHeader(kind,title){return `<div class="gadget-header"><button class="gadget-remove" data-remove="${kind}" title="Remove ${title}" aria-label="Remove ${title}">×</button><button class="handle" aria-label="Move ${title}" title="Drag to move ${title}"><span class="gadget-title">${title}</span><span class="drag-grip" aria-hidden="true">✥</span></button></div>`;}
for(const [kind,data] of Object.entries(newGadgets)) {
  const item=document.createElement('section');item.className='stage-item';item.id='gadget-'+kind;item.dataset.kind=kind;item.hidden=true;
  item.innerHTML=`${gadgetHeader(kind,data.title)}${data.body}`;
  $('stage').append(item);
}
for(const [state,symbol] of [['UP','\u2191'],['LEFT','\u2190'],['CLICK','\u25cf'],['RIGHT','\u2192'],['DOWN','\u2193']]) {
  const button=document.createElement('button');button.dataset.state=state;button.dataset.controller='joystick';button.textContent=symbol;button.title='Stand-Alone joystick '+state.toLowerCase();button.setAttribute('aria-label',button.title);
  document.querySelector('.standalone-stick').append(button);
}
for(const image of document.images) {
  image.draggable=false;
  let retries=0;
  const retry=()=>{if(retries++<3)setTimeout(()=>{const url=new URL(image.src);url.searchParams.set('retry',retries);image.src=url.href;},400);};
  image.addEventListener('error',retry);
  if(image.complete&&!image.naturalWidth)retry();
}
const order = [15,14,13,12,8,9,10,11,7,6,5,4,0,1,2,3];
const leds = new Map();
for (const id of order) {
  const el = document.createElement('div'); el.className = 'led'; el.textContent = id;
  el.title = `LED ${id}`; el.dataset.led = id; $('leds').append(el); leds.set(id, el);
}
const digitMap = {0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg','-':'g',' ':''};
Object.assign(digitMap,{"A": "abcefg", "B": "cdefg", "C": "adef", "D": "bcdeg", "E": "adefg", "F": "aefg", "G": "acdef", "H": "bcefg", "I": "bc", "J": "bcd", "K": "bcefg", "L": "def", "M": "", "N": "ceg", "O": "abcdef", "P": "abefg", "Q": "abcfg", "R": "eg", "S": "acdfg", "T": "defg", "U": "bcdef", "V": "bcdef", "W": "", "X": "bcefg", "Y": "bcdfg", "Z": "abdeg"});
const digits = [];
for (let i=0; i<4; i++) {
  const digit = document.createElement('div'); digit.className='digit';
  for (const segment of 'abcdefgp') {
    const el=document.createElement('i'); el.className='segment '+segment; digit.append(el);
  }
  $('sevenDigits').append(digit); digits.push(digit);
}
function displayNumber(text,rawText=false) {
  const values=[];
  for (const ch of text) {
    if (!rawText && ch==='.' && values.length) values[values.length-1].dot=true;
    else values.push({char:ch,dot:false});
  }
  while(values.length<4) values.unshift({char:' ',dot:false});
  values.slice(0,4).forEach((value,index)=>{
    const enabled=(digitMap[rawText?value.char.toUpperCase():value.char] ?? (rawText?'g':''))+(value.dot?'p':'');
    for(const segment of digits[index].children) segment.classList.toggle('on',enabled.includes(segment.classList[1]));
  });
  $('sevenDigits').setAttribute('aria-label','Seven-segment display: '+(text || 'blank'));
  $('displayValue').textContent=text || 'Blank';
}
let audio, muted = true, active = '', standaloneActive='', lastNote = 0, online = false, oscillator, lastInput = 0;
async function command(body) {
  const reply = await localFetch('/command', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  if (!reply.ok) { const data=await reply.json(); throw new Error(data.error || 'Simulator request failed'); }
  return reply.json();
}
function stopTone() { if (oscillator) { try {oscillator.stop();} catch {} oscillator = null; } }
$('sound').onclick = async () => {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume();
    muted = !muted; $('sound').textContent = muted ? 'Enable sound' : 'Mute sound';
    $('soundStatus').textContent = muted ? 'Muted' : 'Sound enabled';
    if (muted) stopTone();
  } catch { $('soundStatus').textContent = 'Sound is unavailable in this browser.'; }
};
function tone(note) {
  if (!audio || muted) return;
  stopTone(); const osc = audio.createOscillator(), gain = audio.createGain();
  oscillator = osc; osc.type = 'square'; osc.frequency.value = note.frequency;
  gain.gain.setValueAtTime(.025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + note.duration/1000);
  osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + note.duration/1000);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); if (oscillator === osc) oscillator = null; };
}
function input(value,device='cjp') {
  if(device==='cjp')active=value;else standaloneActive=value;
  for (const b of document.querySelectorAll('[data-state]')) if((b.dataset.controller||'cjp')===device)b.classList.toggle('active', b.dataset.state === value);
  return command({action:'input', device, states:value ? [value] : []}).catch(()=>{});
}
for (const button of document.querySelectorAll('[data-state]')) {
  const device=button.dataset.controller||'cjp';
  button.onpointerdown = e => {e.preventDefault(); button.setPointerCapture(e.pointerId); input(button.dataset.state,device);};
  button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => input('',device);
  button.onkeydown = e => {if (['Enter',' '].includes(e.key)) {e.preventDefault(); input(button.dataset.state,device);}};
  button.onkeyup = e => {if (['Enter',' '].includes(e.key)) input('',device);};
}
function releaseInputs(){input('');if(scene?.gadgets.joystick)input('','joystick');stopTone();}
window.addEventListener('blur',releaseInputs);
document.addEventListener('visibilitychange', () => {if (document.hidden)releaseInputs();});
const labels={cjp:'CodyJoy Pro',seven:'Seven-segment',temperature:'Temperature sensor',matrix:'LED matrix',...Object.fromEntries(Object.entries(newGadgets).map(([key,value])=>[key,value.title]))};
const defaults={dfplayer:{x:440,y:60},air:{x:800,y:400},light:{x:1040,y:480},motion:{x:400,y:640},rfid:{x:700,y:640},ultraseg:{x:700,y:40},seven:{x:440,y:40},temperature:{x:440,y:360},matrix:{x:760,y:360},joystick:{x:40,y:640},ultrasonic:{x:400,y:720},soil:{x:740,y:720},wifi:{x:1050,y:760}};
let scene=null, selected='cjp', dragging=null, pending=0, pythonConnected=false, z=1, temperatureTimer, stageZoom=1, initialFit=false;
let camera={scale:1,x:0,y:0},panning=null,viewTouched=false;
const viewport=$('stageViewport'),V=window.CodySimulatorViewport;
function renderView(view){camera=view;stageZoom=view.scale;$('stage').style.transform=`translate(${view.x}px,${view.y}px) scale(${view.scale})`;$('zoomLevel').textContent=Math.round(view.scale*100)+'%';}
window.CodySimulatorView={snapshot:()=>({camera:{...camera},selected}),restore:v=>{renderView({...v.camera});initialFit=true;viewTouched=true;select(v.selected);}};
function fitStage(){if(!scene||viewport.clientWidth<=0||viewport.clientHeight<=0)return;let left=Infinity,top=Infinity,right=0,bottom=0;for(const [kind,pos]of Object.entries(scene.gadgets)){const item=$('gadget-'+kind);left=Math.min(left,pos.x);top=Math.min(top,pos.y);right=Math.max(right,pos.x+item.offsetWidth);bottom=Math.max(bottom,pos.y+item.offsetHeight);}renderView(V.fit({left,top,right,bottom},viewport.clientWidth,viewport.clientHeight));viewTouched=false;}
viewport.addEventListener('wheel',event=>{if(event.target.closest('input,select,textarea')||panning||dragging)return;event.preventDefault();const r=viewport.getBoundingClientRect();renderView(V.zoomAt(camera,{x:event.clientX-r.left,y:event.clientY-r.top},event.deltaY));viewTouched=true;},{passive:false});
viewport.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('.stage-item')||panning)return;event.preventDefault();viewport.focus({preventScroll:true});viewport.setPointerCapture(event.pointerId);panning={id:event.pointerId,x:event.clientX,y:event.clientY,camera:{...camera}};viewport.classList.add('panning');});
viewport.addEventListener('pointermove',event=>{if(!panning||event.pointerId!==panning.id)return;renderView(V.pan(panning.camera,event.clientX-panning.x,event.clientY-panning.y));viewTouched=true;});
function endPan(){if(!panning)return;const id=panning.id;panning=null;viewport.classList.remove('panning');if(viewport.hasPointerCapture?.(id))viewport.releasePointerCapture(id);}
for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,event=>{if(panning?.id===event.pointerId)endPan();});
window.addEventListener('blur',endPan);
viewport.addEventListener('dblclick',event=>{if(!event.target.closest('.stage-item')){event.preventDefault();fitStage();}});
viewport.addEventListener('keydown',event=>{if(event.target!==viewport)return;const center={x:viewport.clientWidth/2,y:viewport.clientHeight/2},delta={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}[event.key];if(event.key==='Home'||event.key==='0'){event.preventDefault();fitStage();}else if(['+','=','-'].includes(event.key)){event.preventDefault();renderView(V.zoomAt(camera,center,event.key==='-'?100:-100));viewTouched=true;}else if(delta){event.preventDefault();renderView(V.pan(camera,...delta));viewTouched=true;}});
window.addEventListener('resize',()=>{if(!viewTouched)fitStage();});
$('addGadgets').onclick=()=>$('gadgetPicker').showModal();$('closeGadgets').onclick=()=>$('gadgetPicker').close();
function showError(message) { $('error').textContent=message; $('error').hidden=!message; }
function select(kind) {
  selected=kind; $('selected').textContent=labels[kind];
  for(const item of document.querySelectorAll('.stage-item')) item.classList.toggle('selected',item.dataset.kind===kind);
}
function renderScene(value) {
  scene=structuredClone(value);
  for(const item of document.querySelectorAll('.stage-item')) {
    const pos=scene.gadgets[item.dataset.kind]; item.hidden=!pos;
    if(pos) {item.style.left=pos.x+'px';item.style.top=pos.y+'px';}
  }
  for(const button of document.querySelectorAll('[data-add]')) button.disabled=pythonConnected||!!scene.gadgets[button.dataset.add];
  if(!scene.gadgets[selected]) select('cjp');
  if(![$('temperatureValue'),$('temperatureSlider')].includes(document.activeElement)) {
    $('temperatureValue').value=scene.temperature; $('temperatureSlider').value=scene.temperature;
  }
  for(const [prefix,key] of [['distance','distance'],['soil','soil'],['light','light']]) {
    if(![$(prefix+'Value'),$(prefix+'Slider')].includes(document.activeElement)) {
      $(prefix+'Value').value=value[key];if($(prefix+'Slider'))$(prefix+'Slider').value=value[key];
    }
  }
  $('lightMeter').value=scene.light;
  $('motionValue').checked=scene.motion;if(document.activeElement!==$('rfidValue'))$('rfidValue').value=scene.rfid;if(document.activeElement!==$('ultraDistanceValue'))$('ultraDistanceValue').value=scene.ultraDistance;
  $('wifiLink').checked=scene.wifi_link;$('cloudLink').checked=scene.cloud_link;
  select(selected);
}
let saveQueue=Promise.resolve();
function saveScene() {
  const value=structuredClone(scene); pending++; $('saved').textContent='Saving...';
  saveQueue=saveQueue.catch(()=>{}).then(()=>command({action:'scene',scene:value})).then(()=>{
    $('saved').textContent='Saved'; showError('');
  }).catch(error=>{showError(error.message);$('saved').textContent='Not saved';}).finally(()=>{pending--;});
  return saveQueue;
}
function place(kind,x,y) {
  const item=$('gadget-'+kind); item.hidden=false;
  const pos={x:Math.round(Math.max(0,Math.min(1400-item.offsetWidth,x))/8)*8,
    y:Math.round(Math.max(0,Math.min(1500-item.offsetHeight,y))/8)*8};
  scene.gadgets[kind]=pos; item.style.left=pos.x+'px';item.style.top=pos.y+'px';
}
async function addGadget(kind,pos) {
  if(!scene||scene.gadgets[kind]||pythonConnected) return;
  place(kind,(pos||defaults[kind]).x,(pos||defaults[kind]).y); select(kind); await saveScene();
  renderScene(scene);
  $('gadgetPicker').close();
  fitStage();
}
for(const button of document.querySelectorAll('[data-add]')) {
  button.onclick=()=>addGadget(button.dataset.add);
  button.ondragstart=event=>{
    if(button.disabled) return event.preventDefault();
    event.dataTransfer.setData('text/plain',button.dataset.add);event.dataTransfer.effectAllowed='copy';
  };
}
$('stage').ondragover=event=>{event.preventDefault();event.dataTransfer.dropEffect='copy';$('stage').classList.add('drag-over');};
$('stage').ondragleave=()=>$('stage').classList.remove('drag-over');
$('stage').ondrop=event=>{
  event.preventDefault();$('stage').classList.remove('drag-over');
  const kind=event.dataTransfer.getData('text/plain'), rect=$('stage').getBoundingClientRect();
  if(defaults[kind]) addGadget(kind,{x:(event.clientX-rect.left)/stageZoom,y:(event.clientY-rect.top)/stageZoom});
};
async function removeGadget(kind){if(kind==='cjp'||pythonConnected||window.CodyLiveStore.simState().connected||!scene)return;delete scene.gadgets[kind];renderScene(scene);await saveScene();}
for(const cross of document.querySelectorAll('[data-remove]')){cross.onpointerdown=event=>event.stopPropagation();cross.onclick=event=>{event.stopPropagation();removeGadget(cross.dataset.remove);};}
for(const item of document.querySelectorAll('.stage-item')) {
  const handle=item.querySelector('.handle');
  item.onpointerdown=()=>{select(item.dataset.kind);item.style.zIndex=++z;};
  handle.onpointerdown=event=>{
    if(!scene) return;event.preventDefault();handle.setPointerCapture(event.pointerId);
    const kind=item.dataset.kind;
    dragging={kind,x:event.clientX,y:event.clientY,position:{...scene.gadgets[kind]}};
  };
  handle.onpointermove=event=>{
    if(!dragging||dragging.kind!==item.dataset.kind) return;
    place(dragging.kind,dragging.position.x+(event.clientX-dragging.x)/stageZoom,dragging.position.y+(event.clientY-dragging.y)/stageZoom);
  };
  handle.onpointerup=handle.onpointercancel=handle.onlostpointercapture=()=>{if(dragging){dragging=null;saveScene();}};
  handle.onkeydown=event=>{
    const delta={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[event.key];
    if(delta&&scene){event.preventDefault();const p=scene.gadgets[item.dataset.kind];place(item.dataset.kind,p.x+delta[0],p.y+delta[1]);saveScene();}
  };
}
function setTemperature(event) {
  const value=Number(event.target.value);
  if(!scene||event.target.value===''||!Number.isFinite(value)||value < -55||value > 125) return;
  scene.temperature=Math.round(value*10)/10;
  $('temperatureValue').value=scene.temperature; $('temperatureSlider').value=scene.temperature;
  clearTimeout(temperatureTimer); temperatureTimer=setTimeout(()=>{temperatureTimer=null;saveScene();},150);
}
$('temperatureValue').oninput=$('temperatureSlider').oninput=setTemperature;
for(const [prefix,key,min,max] of [['distance','distance',2,400],['soil','soil',0,100],['light','light',0,100]]) {
  const update=event=>{
    const value=Number(event.target.value);
    if(!scene||event.target.value===''||!Number.isFinite(value)||value<min||value>max)return;
    scene[key]=Math.round(value*10)/10;if(key==='light')$('lightMeter').value=scene[key];$(prefix+'Value').value=scene[key];if($(prefix+'Slider'))$(prefix+'Slider').value=scene[key];
    clearTimeout(temperatureTimer);temperatureTimer=setTimeout(()=>{temperatureTimer=null;saveScene();},150);
  };
  $(prefix+'Value').oninput=update;if($(prefix+'Slider'))$(prefix+'Slider').oninput=update;
}
for(const [id,key] of [['wifiLink','wifi_link'],['cloudLink','cloud_link']]) $(id).onchange=()=>{if(scene){scene[key]=$(id).checked;saveScene();}};
$('cloudApply').onclick=async()=>{
  try {await command({action:'wifi_slot',type:$('cloudType').value,index:Number($('cloudIndex').value),value:$('cloudValue').value});showError('');}
  catch(error){showError(error.message);}
};

$('motionValue').onchange=()=>{scene.motion=$('motionValue').checked;saveScene();};
$('rfidValue').onchange=()=>{const uid=$('rfidValue').value.toUpperCase();if(!/^[0-9A-F]{8}$/.test(uid)){showError('RFID UID must contain 8 hex characters');return;}scene.rfid=uid;saveScene();};
$('ultraDistanceValue').onchange=()=>{const value=Number($('ultraDistanceValue').value);if(!Number.isFinite(value)||value<2||value>400){showError('Distance must be 2–400 cm');return;}scene.ultraDistance=value;saveScene();};
const matrixPixels=[];
for(let i=0;i<64;i++){const el=document.createElement('div');el.className='matrix-pixel';$('matrixPixels').append(el);matrixPixels.push(el);}
let matrix={mode:'pixels',pixels:Array(64).fill(0)}, matrixRevision=-1, matrixStarted=0, raster=null;
function matrixUpdate(value) {
  if(value.revision===matrixRevision) return;
  matrix=value;matrixRevision=value.revision;matrixStarted=performance.now();
  $('matrixText').textContent=value.mode==='text'?value.text:'';
  if(value.mode==='text') {
    // Each byte is one column; bit 0 is the top row. No font scaling or antialiasing.
    const columns=Array(8).fill(0);
    for(const character of value.text) {
      const glyph=MATRIX_FONT5X7[character.charCodeAt(0)-32] || MATRIX_FONT5X7[31];
      columns.push(...glyph,0);
    }
    columns.push(...Array(8).fill(0));
    raster={width:columns.length,columns};
  }
}
function animateMatrix(now) {
  if(!$('gadget-matrix').hidden) {
    let pixels=matrix.pixels;
    if(matrix.mode==='text'&&raster) {
      const offset=Math.floor((now-matrixStarted)/[240,160,100][matrix.speed])%raster.width;
      pixels=Array.from({length:64},(_,i)=>(raster.columns[(i%8+offset)%raster.width]>>Math.floor(i/8))&1);
    }
    matrixPixels.forEach((el,i)=>el.classList.toggle('on',!!pixels[i]));
  }
  requestAnimationFrame(animateMatrix);
}
requestAnimationFrame(animateMatrix);
select('cjp');
async function poll() {
  try {
    const reply = await localFetch('/state', {cache:'no-store', signal:AbortSignal.timeout(2000)});
    if (!reply.ok) throw new Error(); const state = await reply.json();
    $('python').textContent = state.connected ? 'Connected' : 'Waiting';
    pythonConnected=state.connected;
    if(!dragging&&!pending&&!temperatureTimer) {renderScene(state.scene);$('saved').textContent='Saved';}
    if(!initialFit&&scene&&viewport.clientWidth>0&&viewport.clientHeight>0){initialFit=true;fitStage();}
    for(const button of document.querySelectorAll('[data-add]')) button.disabled=state.connected||!!scene?.gadgets[button.dataset.add];
    for(const cross of document.querySelectorAll('[data-remove]'))cross.disabled=state.connected;$('addGadgets').disabled=state.connected;
    if(state.error) showError(state.error);
    matrixUpdate(state.matrix);
    $('direction').textContent = state.states.join(' + ') || 'Neutral';
    $('standaloneState').textContent=state.joystick_states.join(' + ')||'Neutral';
    $('wifiState').textContent=state.wifi.wifi===3?'Connected':'Disconnected';$('iotState').textContent=state.wifi.iot===1?'Connected':'Disconnected';
    $('wifiSSID').textContent=state.wifi.ssid||'Not configured';
    $('cloudValues').textContent=state.wifi.slots.map(slot=>`${slot.type}[${slot.index}] = ${slot.value}`).join('\n')||'No values';
    displayNumber(state.seven_segment || '',!!state.seven_segment_text);$('ultraSegmentValue').textContent=state.ultra_segment||'Blank';
    if(!state.scene.gadgets.seven) $('displayValue').textContent='Not added';
    state.leds.forEach((color,id) => {const el=leds.get(id); el.style.background=color; el.style.boxShadow=color === '#000000' ? 'none' : `0 0 12px ${color}`; el.style.color=color === '#000000' ? '#9ba89f' : '#101b15';});
    if (!state.connected) {stopTone(); $('note').textContent='Silent';}
    for (const note of state.notes) {
      if (note.id > lastNote) {
        // Do not replay old notes when opening/reconnecting the browser.
        if (online && state.now-note.at < 1) tone(note);
        lastNote = note.id;
      }
    }
    const recent=state.notes.at(-1);
    $('note').textContent=recent && state.now < recent.at+recent.duration/1000 ? `${recent.frequency} Hz` : 'Silent';
    online = true;
    if ((active||standaloneActive) && Date.now()-lastInput>250) {lastInput=Date.now();if(active)await input(active);if(standaloneActive)await input(standaloneActive,'joystick');}
  } catch {online=false; stopTone(); showError('Simulator unavailable. Reload this page to retry.'); $('python').textContent='Unknown';}
  setTimeout(poll, 50);
}
poll();

// Load the light asset UI on customized/older simulator HTML as well.
if(!document.getElementById('lightWorldStyles')){const link=document.createElement('link');link.id='lightWorldStyles';link.rel='stylesheet';link.href='/simulator/light-world.css?v=3.21.1-ai.26';document.head.append(link);}
if(!document.getElementById('lightWorldScript')){const script=document.createElement('script');script.id='lightWorldScript';script.src='/simulator/light-world.js?v=3.21.1-ai.28';document.head.append(script);}

if(!document.getElementById("airWorldStyles")){const e=document.createElement("link");e.id="airWorldStyles";e.rel="stylesheet";e.href="/simulator/air-world.css?v=3.21.1-ai.28";document.head.append(e);}
if(!document.getElementById("airWorldScript")){const e=document.createElement("script");e.id="airWorldScript";e.src="/simulator/air-world.js?v=3.21.1-ai.28";document.head.append(e);}

if(!document.getElementById("dfPlayerUI")){const e=document.createElement("script");e.id="dfPlayerUI";e.src="/simulator/dfplayer/ui.js?v=3.21.1-ai.29";document.head.append(e);}
