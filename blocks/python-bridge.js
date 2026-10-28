'use strict';
(() => {
 const allowed=new Set(['cn_temperature_read','cn_soil_read','cn_motion_detect','cn_rfid_readuid','cn_ultrasonic_read','cn_joystick_states','cn_joystick_position','cn_joystick_click','cn_rgb_matrix_set','cn_rgb_matrix_clear','cn_led_matrix_clear','cn_led_matrix_display_text','cn_led_matrix_set_pixel','cn_seven_segment_display','cn_sound_play_until_done']);
 class PythonBridge {
  constructor(router,store,signal){this.router=router;this.store=store;this.signal=signal;this.hardwareUsed=false;}
  async request(op,json){
   this.signal.throwIfAborted();const a=this.parse(json);
   if(op==='wait'){
    if(typeof a.seconds!=='number'||!Number.isFinite(a.seconds)||a.seconds<0||a.seconds>86400)throw Error('Wait must be between 0 and 86400 seconds');
    await this.router.wait(a.seconds*1000,this.signal);return 'null';
   }
   if(op!=='gadget'||!allowed.has(a.block)||!['HARDWARE','SIMULATION'].includes(a.target))throw Error('Unsupported Python gadget operation');
   if(a.target==='HARDWARE')this.hardwareUsed=true;
   const value=await this.router.call(a.block,a.args||{},this.signal,a.target);
   return JSON.stringify(value??null);
  }
  parse(json){if(typeof json!=='string'||json.length>8192)throw Error('Python request is too large');const a=JSON.parse(json);if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Invalid Python request');return a;}
  notify(op,json){
   this.signal.throwIfAborted();if(op!=='dashboard')throw Error('Unsupported Python notification');
   const a=this.parse(json),v=a.args||{},name=String(v.name||'Value');
   const send=(action,args={})=>this.store.dashboard(action,{NAME:name,SOURCE:'Python',...args});
   if(a.action==='clear'){send('dash_clear');return;}
   if(a.action==='show'){
    if(!Object.hasOwn(this.store.read().widgets,name))send('dash_create_info',{TITLE:name});
    send('dash_set',{VALUE:v.value});return;
   }
   if(a.action==='gauge'){send('dash_create_gauge',{TITLE:name});send('dash_range',{MIN:v.minimum,MAX:v.maximum});return;}
   if(a.action==='graph'){send('dash_create_graph',{TITLE:name});send('dash_history',{COUNT:v.history});return;}
   if(a.action==='append'){send('dash_append',{VALUE:v.value});return;}
   throw Error('Unsupported dashboard action');
  }
 }
 if(typeof module!=='undefined')module.exports=PythonBridge;else window.CodyPythonBridge=PythonBridge;
})();
