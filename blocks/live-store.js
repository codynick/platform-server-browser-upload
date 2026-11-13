// Shared educational world model. Geometry and temperature work without an active view.
(()=>{
 'use strict';
 const definitions={hot:{name:'Hot water',temperature:65,color:'#e99369'},cold:{name:'Cold water',temperature:5,color:'#76bbd9'},target:{name:'Target block',color:'#e2ad64'}};
 const bounded=(v,lo,hi,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error('Invalid '+label);return v;};
 const hasCups=w=>w.assets.some(a=>a.kind==='hot'||a.kind==='cold');
 function clean(w){
  if(!w||typeof w!=='object'||!Array.isArray(w.assets)||w.assets.length>100)throw Error('Invalid simulation assets (maximum 100).');
  const ids=new Set(),assets=w.assets.map(a=>{if(!a||!Object.hasOwn(definitions,a.kind)||typeof a.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(a.id)||ids.has(a.id))throw Error('Invalid or duplicate simulation asset.');ids.add(a.id);const out={id:a.id,kind:a.kind,x:bounded(a.x,0,1400,'asset X'),y:bounded(a.y,0,1500,'asset Y')};if(a.kind==='target'){out.width=bounded(a.width,10,200,'target width');out.height=bounded(a.height,10,200,'target height');}else out.temperature=bounded(a.temperature,0,95,'water temperature');return out;});
  const p=w.probe;if(!p||typeof p!=='object')throw Error('Invalid simulation probe.');
  const out={assets,probe:{x:bounded(p.x,25,1800,'probe X'),y:bounded(p.y,145,1800,'probe Y'),temperature:bounded(p.temperature,-55,125,'probe temperature'),at:bounded(p.at,0,1e15,'probe timestamp')}};
  if(w.ultrasonic!=null){if(typeof w.ultrasonic.enabled!=='boolean')throw Error('Invalid world sensing switch');out.ultrasonic={enabled:w.ultrasonic.enabled,angle:bounded(w.ultrasonic.angle,-180,180,'sensor angle')};}return out;
 }
 function contact(w){return w.assets.findLast(a=>a.kind!=='target'&&w.probe.x>a.x+29&&w.probe.x<a.x+179&&w.probe.y>a.y+114&&w.probe.y<a.y+253)||null;}
 const origin=p=>({x:p.x+306,y:p.y+110});
 const cross=(a,b)=>a.x*b.y-a.y*b.x;
 function nearestInCone(rect,o,angle){
  const theta=angle*Math.PI/180,axis={x:Math.cos(theta),y:Math.sin(theta)},tan=Math.tan(Math.PI/12),candidates=[];
  const inside=p=>{const dot=p.x*axis.x+p.y*axis.y;return dot>=-1e-8&&Math.abs(cross(axis,p))<=Math.max(0,dot)*tan+1e-8;};
  const corners=[{x:rect.x-o.x,y:rect.y-o.y},{x:rect.x+rect.width-o.x,y:rect.y-o.y},{x:rect.x+rect.width-o.x,y:rect.y+rect.height-o.y},{x:rect.x-o.x,y:rect.y+rect.height-o.y}];
  if(o.x>=rect.x&&o.x<=rect.x+rect.width&&o.y>=rect.y&&o.y<=rect.y+rect.height)return 0;
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],d={x:b.x-a.x,y:b.y-a.y};if(inside(a))candidates.push(Math.hypot(a.x,a.y));const t=Math.max(0,Math.min(1,-(a.x*d.x+a.y*d.y)/(d.x*d.x+d.y*d.y))),p={x:a.x+d.x*t,y:a.y+d.y*t};if(inside(p))candidates.push(Math.hypot(p.x,p.y));
   for(const offset of[-Math.PI/12,Math.PI/12]){const ray={x:Math.cos(theta+offset),y:Math.sin(theta+offset)},denom=cross(ray,d);if(Math.abs(denom)<1e-9)continue;const r=cross(a,d)/denom,u=cross(a,ray)/denom;if(r>=-1e-8&&u>=-1e-8&&u<=1+1e-8)candidates.push(Math.max(0,r));}
  }
  return candidates.length?Math.min(...candidates):Infinity;
 }
 function ultrasound(scene){
  const w=scene.world,p=scene.gadgets.ultrasonic;if(!w?.ultrasonic?.enabled||!p)return {active:false,distance:scene.distance,id:null};
  const o=origin(p);let nearest=Infinity,id=null;
  for(const a of w.assets){if(a.kind!=='target')continue;const d=nearestInCone({x:a.x+4,y:a.y+36,width:a.width,height:a.height},o,w.ultrasonic.angle);if(d<nearest){nearest=d;id=a.id;}}
  const echo=nearest>=2&&nearest<=400;return {active:true,distance:echo?Number(nearest.toFixed(1)):0,id:echo?id:null,origin:o,angle:w.ultrasonic.angle};
 }
 function advance(scene,now=Date.now()){
  if(!scene.world)return scene;const w=clean(scene.world);scene.world=w;
  if(scene.gadgets.temperature&&hasCups(w)){const a=contact(w),target=a?a.temperature:22,seconds=Math.max(0,(now-w.probe.at)/1000);w.probe.temperature=target+(w.probe.temperature-target)*Math.exp(-seconds/(a?5:25));scene.temperature=Number(w.probe.temperature.toFixed(1));}else w.probe.temperature=scene.temperature;
  w.probe.at=now;const echo=ultrasound(scene);if(echo.active)scene.distance=echo.distance;return scene;
 }
 window.CodyThermalWorld={definitions,clean,hasCups,contact,advance,origin,nearestInCone,ultrasound};
})();

// Classroom soil/water model. Moisture is a relative 0–100 scale, not calibrated VWC.
(()=>{
'use strict';
const types={sand:{name:'Sandy',capacity:400,field:45,soak:.8,drain:9,evap:.00024},loam:{name:'Loamy',capacity:500,field:65,soak:2,drain:30,evap:.00016},clay:{name:'Clay',capacity:600,field:80,soak:4.5,drain:70,evap:.00010}};
const finite=(v,lo,hi,name)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error('Invalid '+name);return v;};
function clean(g){
 if(!g||!Array.isArray(g.pots)||!Array.isArray(g.cans)||g.pots.length+g.cans.length>100||typeof g.enabled!=='boolean')throw Error('Invalid soil world');
 const ids=new Set(),position=a=>{if(!a||typeof a.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(a.id)||ids.has(a.id))throw Error('Invalid or duplicate garden asset');ids.add(a.id);return {id:a.id,x:finite(a.x,0,1400,'garden X'),y:finite(a.y,0,1500,'garden Y')};};
 const pots=g.pots.map(a=>{const p=position(a);if(!Object.hasOwn(types,a.type))throw Error('Invalid soil type');return {...p,type:a.type,water:finite(a.water,0,types[a.type].capacity,'soil water'),surface:finite(a.surface,0,100,'surface water'),overflow:finite(a.overflow,0,1e12,'overflow'),drained:finite(a.drained||0,0,1e12,'drained water')};});
 const cans=g.cans.map(a=>position(a));const p=g.probe;
 if(!p)throw Error('Missing soil probe');return {enabled:g.enabled,at:finite(g.at,0,1e15,'soil timestamp'),pots,cans,probe:{x:finite(p.x,25,1800,'soil probe X'),y:finite(p.y,145,1800,'soil probe Y'),value:finite(p.value,0,100,'soil reading')}};
}
const moisture=p=>p.water/types[p.type].capacity*100;
const surface=p=>({left:p.x+24,right:p.x+196,y:p.y+136,bottom:p.y+256});
const spout=c=>({x:c.x+181.07,y:c.y+153.64});
function contact(g){return g.pots.findLast(p=>{const s=surface(p),inset=Math.max(0,Math.min(15,(g.probe.y-s.y)/120*15));return g.probe.x-8>=s.left+inset&&g.probe.x+8<=s.right-inset&&g.probe.y>=s.y+8&&g.probe.y<=s.bottom;})||null;}
function partial(g){return !contact(g)&&g.pots.some(p=>{const s=surface(p);return g.probe.y>=s.y&&g.probe.y<=s.bottom&&g.probe.x+8>s.left&&g.probe.x-8<s.right;});}
function landing(g,c){let best=null,area=0;for(const p of g.pots){const width=Math.min(c.x+205,p.x+202)-Math.max(c.x+5,p.x+18),height=Math.min(c.y+160,p.y+264)-Math.max(c.y+15,p.y+95);const overlap=Math.max(0,width)*Math.max(0,height);if(overlap>area){area=overlap;best=p;}}return best;}
function evolve(p,seconds){const t=types[p.type];const soak=p.surface*(1-Math.exp(-seconds/t.soak)),accepted=Math.min(soak,t.capacity-p.water);p.surface-=accepted;p.water+=accepted;
 const above=Math.max(0,p.water-t.capacity*t.field/100),drain=above*(1-Math.exp(-seconds/t.drain));p.water-=drain;p.drained+=drain;
 const evaporated=Math.min(p.water,t.capacity*t.evap*seconds);p.water-=evaporated;
 // A small surface puddle evaporates too; water cannot be created by the model.
 p.surface=Math.max(0,p.surface-Math.min(p.surface,t.capacity*t.evap*.5*seconds));
}
function advance(scene,now=Date.now()){
 if(!scene.garden)return scene;const g=clean(scene.garden);scene.garden=g;const real=Math.max(0,(now-g.at)/1000);
 // A reusable can waters automatically for as long as its image overlaps a pot.
 // Split longer reads so infiltration and overflow remain consistent across frame rates.
 const steps=Math.max(1,Math.min(600,Math.ceil(real/.1))),dt=real/steps;
 for(let i=0;i<steps;i++){for(const c of g.cans){const p=landing(g,c);if(p){const combined=p.surface+60*dt;p.surface=Math.min(100,combined);p.overflow+=Math.max(0,combined-100);}}for(const p of g.pots)evolve(p,dt);}
 if(g.enabled&&scene.gadgets.soil){const p=contact(g),target=p?moisture(p):0;g.probe.value=target+(g.probe.value-target)*Math.exp(-real/1.8);scene.soil=Number(g.probe.value.toFixed(1));}else g.probe.value=scene.soil;
 g.at=now;return scene;
}
window.CodySoilWorld={types,clean,moisture,surface,spout,contact,partial,landing,evolve,advance};
const previous=window.CodyThermalWorld.advance;window.CodyThermalWorld.advance=(scene,now=Date.now())=>advance(previous(scene,now),now);
})();

'use strict';
(()=>{
 if(window.CodyLiveStore)return;
 const key='codynick-live-state-v1';
 const defaults=()=>({scene:{gadgets:{cjp:{x:40,y:40}},temperature:21.1,distance:50,soil:50,wifi_link:true,cloud_link:true,motion:false,rfid:'00000000',ultraDistance:50},leds:Array(16).fill('#000000'),matrix:{text:'',speed:1,pixels:Array(64).fill(0),mode:'pixels',revision:0},seven_segment:'',ultra_segment:'',states:[],joystick_states:[],inputAt:0,joyAt:0,notes:[],sequence:0,widgets:{},run:null,wifi:{wifi:0,iot:0,ssid:'',slots:[]}});
 let memory=defaults();
 let updates;
 const changed=()=>window.dispatchEvent(new Event('codynick-live-change'));
 try{updates=new BroadcastChannel('codynick-live-updates-v1');updates.onmessage=()=>changed();}catch{}
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null)changed();});

 function read(){try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s&&s.scene?.gadgets&&s.widgets){memory={...defaults(),...s};}else{memory=defaults();}}catch{}const result=structuredClone(memory);CodyThermalWorld.advance(result.scene);for(const w of Object.values(result.widgets))if(w.type==='button'&&Date.now()-(w.inputAt||0)>1200){w.value=false;w.inputOwner='';}return result;}
 function update(fn){const s=read();const result=fn(s);memory=s;localStorage.setItem(key,JSON.stringify(s));changed();updates?.postMessage('changed');return result;}
 const finite=(n,label)=>{n=Number(n);if(!Number.isFinite(n))throw Error(label+' must be a finite number');return n;};
 function scene(clean){const d=defaults().scene;const known=['cjp','seven','temperature','matrix','joystick','ultrasonic','soil','wifi','motion','rfid','ultraseg'];if(!clean?.gadgets||!clean.gadgets.cjp)throw Error('Simulation must contain CodyJoy Pro.');const out={...d,...clean,gadgets:{}};for(const [kind,p] of Object.entries(clean.gadgets)){if(!known.includes(kind))throw Error('Unsupported simulated gadget: '+kind);out.gadgets[kind]={x:Math.max(0,Math.min(1400,finite(p.x,'X'))),y:Math.max(0,Math.min(1500,finite(p.y,'Y')))};}for(const [n,lo,hi]of [['temperature',-55,125],['distance',0,400],['soil',0,100],['ultraDistance',2,400]]){out[n]=finite(out[n],n);if(out[n]<lo||out[n]>hi)throw Error('Invalid simulated '+n);}if(clean.world!=null)out.world=CodyThermalWorld.clean(clean.world);else delete out.world;if(clean.garden!=null)out.garden=CodySoilWorld.clean(clean.garden);else delete out.garden;out.motion=!!out.motion;out.rfid=String(out.rfid).toUpperCase();if(!/^[0-9A-F]{8}$/.test(out.rfid))throw Error('RFID must have 8 hexadecimal characters');return out;}
 function simState(){const s=read();const now=Date.now();return {...s,now:now/1000,connected:!!s.run&&now-s.run.at<3500,states:now-s.inputAt<1000?s.states:[],joystick_states:now-s.joyAt<1000?s.joystick_states:[],error:''};}
 function simCommand(c){return update(s=>{switch(c.action){case 'scene':s.scene=scene(c.scene);break;case 'input':{const states=c.states;if(!Array.isArray(states)||states.some(v=>!['UP','DOWN','LEFT','RIGHT','CLICK'].includes(v)))throw Error('Invalid joystick input');if(c.device==='joystick'){s.joystick_states=states;s.joyAt=Date.now();}else{s.states=states;s.inputAt=Date.now();}break;}case 'wifi_slot':{const type=String(c.type),index=Number(c.index);if(!['0','1','2','3'].includes(type)||!Number.isInteger(index)||index<0||index>3)throw Error('Invalid cloud slot');const slots=s.wifi.slots.filter(v=>v.type!==type||v.index!==index);slots.push({type,index,value:c.value});s.wifi.slots=slots;break;}default:throw Error('Unknown simulator action');}return {ok:true};});}
 function widget(s,name){if(!Object.hasOwn(s.widgets,name))throw Error('Create dashboard widget "'+name+'" before using it.');return s.widgets[name];}
 const boolean=v=>{if(typeof v!=='boolean')throw Error('Widget state must be True or False');return v;};
 function sliderValue(w,v){v=finite(v,'Slider value');const steps=Math.floor((w.max_value-w.min_value)/w.step+1e-9),index=Math.max(0,Math.min(steps,Math.round((v-w.min_value)/w.step)));return Number((w.min_value+index*w.step).toFixed(9));}
 function releaseInputs(owner){update(s=>{for(const w of Object.values(s.widgets))if(w.type==='button'&&(!owner||w.inputOwner===owner)){w.value=false;w.inputOwner='';w.inputAt=0;if(!owner)w.clicks=0;}});}
 function dashboardInput(id,value,owner='dashboard'){return update(s=>{const w=widget(s,id);if(w.disabled&&value!==false)throw Error('This control is busy');if(w.type==='button'){const pressed=boolean(value);if(!pressed&&w.inputOwner&&w.inputOwner!==owner)return;if(pressed&&!w.value)w.clicks=Math.min(1000,(w.clicks||0)+1);w.value=pressed;w.inputOwner=pressed?owner:'';w.inputAt=pressed?Date.now():0;}
 else if(w.type==='switch')w.value=value==='toggle'?!w.value:boolean(value);else if(w.type==='slider')w.value=sliderValue(w,value);else if(w.type==='text_input')w.value=String(value).slice(0,120);else if(w.type==='select'){if(!w.options.some(o=>o.value===String(value)))throw Error('Choose a listed option');w.value=String(value);}else if(w.type==='textarea')w.value=String(value).slice(0,200000);else throw Error('This dashboard widget is output only.');});}
 function dashboard(action,a){
 const name=String(a.NAME||'widget');
 if(['dash_button_pressed','dash_button_clicked','dash_toggle_value','dash_slider_value','dash_read'].includes(action)){const w=widget(read(),name),expected={dash_button_pressed:'button',dash_button_clicked:'button',dash_toggle_value:'switch',dash_slider_value:'slider'}[action];if(expected&&w.type!==expected)throw Error('Wrong input widget type: '+name);if(!['button','switch','slider','text_input','select','textarea'].includes(w.type))throw Error('Read requires an input widget: '+name);if(action==='dash_button_clicked')return update(s=>{const b=widget(s,name),clicked=(b.clicks||0)>0;if(clicked)b.clicks--;return clicked;});return w.value;}
 return update(s=>{const name=String(a.NAME||'widget');if(action==='dash_clear'){s.widgets={};return;}if(action.startsWith('dash_create')){const type=action==='dash_create'?a.TYPE:action.slice(12);if(!['info','gauge','graph','button','switch','slider','led','text_input','select','image','table'].includes(type))throw Error('Unknown widget type');if(Object.keys(s.widgets).length>=100&&!Object.hasOwn(s.widgets,name))throw Error('Maximum 100 widgets');Object.defineProperty(s.widgets,name,{enumerable:true,writable:true,configurable:true,value:{id:name,type,title:String(a.TITLE||name),value:['graph','table'].includes(type)?'[]':['text_input','select','image'].includes(type)?'':['button','switch','led'].includes(type)?false:0,min_value:0,max_value:50,color:'blue',font_name:'Arial',font_size:32,horizontal_alignment:'center',vertical_alignment:'center',column_span:1,height_multiplier:1,history:[],limit:20,samples:0,description:'Source: Program',valid:true,step:1,clicks:0,inputAt:0,inputOwner:''}});const w=widget(s,name);if(type==='select'){w.options=[];}if(type==='text_input')w.value=String(a.INITIAL??'').slice(0,120);if(['switch','led'].includes(type)&&a.INITIAL!=null)w.value=a.INITIAL==='TRUE'?true:a.INITIAL==='FALSE'?false:boolean(a.INITIAL);if(type==='slider'){w.min_value=finite(a.MIN??0,'Slider minimum');w.max_value=finite(a.MAX??100,'Slider maximum');w.step=finite(a.STEP??1,'Slider step');if(Math.abs(w.min_value)>1e9||Math.abs(w.max_value)>1e9||w.max_value<=w.min_value||w.step<1e-6||w.step>w.max_value-w.min_value)throw Error('Slider needs minimum < maximum and a positive step within the range (at least 0.000001).');w.value=sliderValue(w,a.INITIAL??w.min_value);}return;}
 const w=widget(s,name);const expected={dash_led_set:'led',dash_toggle_set:'switch',dash_slider_set:'slider'}[action];if(expected&&w.type!==expected)throw Error('Wrong widget type: '+name);switch(action){case 'dash_options':{if(w.type!=='select')throw Error('Options require a dropdown');if(!Array.isArray(a.OPTIONS)||a.OPTIONS.length>100)throw Error('Maximum 100 options');const opts=a.OPTIONS.map(o=>{if(!o||typeof o.value!=='string'||o.value.length>600||typeof o.label!=='string'||o.label.length>200)throw Error('Invalid dropdown option');return {label:o.label,value:o.value};});if(new Set(opts.map(o=>o.value)).size!==opts.length)throw Error('Duplicate dropdown value');w.options=opts;if(!opts.some(o=>o.value===w.value))w.value=opts[0]?.value||'';break;}case 'dash_title':w.title=String(a.VALUE||name).slice(0,120);break;case 'dash_set':case 'dash_info_set':case 'dash_gauge_set':case 'dash_led_set':case 'dash_toggle_set':case 'dash_slider_set':if(w.type==='select'){if(!w.options.some(o=>o.value===String(a.VALUE)))throw Error('Choose a listed option');w.value=String(a.VALUE);break;}if(w.type==='image'&&a.VALUE&&!/^ai-media:[a-zA-Z0-9-]+:[a-zA-Z0-9_-]+$/.test(String(a.VALUE)))throw Error('Image output requires an AI media reference');w.value=['led','switch','button'].includes(w.type)?boolean(a.VALUE):w.type==='slider'?sliderValue(w,a.VALUE):w.type==='gauge'?finite(a.VALUE,'Gauge value'):String(a.VALUE??'');break;
 case 'dash_append':if(w.type!=='graph')throw Error('Append requires a graph');w.samples++;w.history.push({x:w.samples,y:finite(a.VALUE,'Graph sample')});w.history=w.history.slice(-w.limit);w.value=JSON.stringify(w.history);break;
 case 'dash_history':if(w.type!=='graph')throw Error('History requires a graph');w.limit=Math.max(1,Math.min(1000,Math.floor(finite(a.COUNT,'History'))));w.history=w.history.slice(-w.limit);w.value=JSON.stringify(w.history);break;
 case 'dash_range':w.min_value=finite(a.MIN,'Minimum');w.max_value=finite(a.MAX,'Maximum');if(w.max_value<=w.min_value)throw Error('Maximum must exceed minimum');break;
 case 'dash_appearance':w.color=a.COLOR;w.column_span=Math.max(1,Math.min(3,Number(a.WIDTH)));w.height_multiplier=Math.max(1,Math.min(3,Number(a.HEIGHT)));break;
 case 'dash_font':w.font_name=a.FONT;w.font_size=Math.max(8,Math.min(96,Number(a.SIZE)));w.horizontal_alignment=a.HORIZONTAL;w.vertical_alignment=a.VERTICAL;break;
 default:throw Error('Unsupported dashboard block: '+action);}
 if(a.SOURCE&&['dash_set','dash_info_set','dash_gauge_set','dash_append'].includes(action))w.description='Source: '+a.SOURCE;
 });}
 window.CodyLiveStore={defaults,restoreProject(data){const s=defaults();for(const key of ['scene','leds','matrix','seven_segment','ultra_segment','widgets'])s[key]=structuredClone(data[key]);s.scene=scene(s.scene);if(s.scene.world)s.scene.world.probe.at=Date.now();if(s.scene.garden){s.scene.garden.at=Date.now();}for(const w of Object.values(s.widgets))if(w.type==='button'){w.value=false;w.clicks=0;w.inputOwner='';w.inputAt=0;}memory=s;localStorage.setItem(key,JSON.stringify(s));changed();updates?.postMessage('changed');},read,update,scene,simState,simCommand,dashboard,cards:()=>Object.values(read().widgets),dashboardInput,releaseInputs,start(token){update(s=>{if(s.run&&Date.now()-s.run.at<3500)throw Error('Another Live program is running in this browser. Stop it first.');s.run={token,at:Date.now()};});},heartbeat(token){update(s=>{if(s.run?.token===token)s.run.at=Date.now();});},stop(token){update(s=>{if(s.run?.token===token){s.run=null;for(const w of Object.values(s.widgets))if(w.type==='button'){w.value=false;w.inputOwner='';w.inputAt=0;w.clicks=0;}}});}};
})();
