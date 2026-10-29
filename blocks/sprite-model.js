'use strict';
(() => {
 const catalog=typeof module!=='undefined'?require('./sprite-looks.js'):window.CodySpriteLooks;
 const defaults=()=>({x:0,y:0,direction:90,size:100,backdrop:'white',appearance:'rocket'});
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 class SpriteModel {
  constructor({now=()=>performance.now(),sleep,onChange=()=>{}}={}){
   this.now=now;this.sleep=sleep||((ms,signal)=>{if(globalThis.CodyScheduler)return CodyScheduler.wait(ms,signal);return new Promise((resolve,reject)=>{signal?.throwIfAborted();const done=()=>{signal?.removeEventListener('abort',abort);resolve();},timer=setTimeout(done,ms),abort=()=>{clearTimeout(timer);reject(signal.reason||Error('Stopped'));};signal?.addEventListener('abort',abort,{once:true});});});
   this.onChange=onChange;this.settings=defaults();this.keys=[];this.mouse={x:0,y:0,down:false};this.inputAt=-Infinity;this.gliding=false;this.reset();
  }
  number(v,lo,hi,label){v=Number(v);if(!Number.isFinite(v)||v<lo||v>hi)throw Error(label+' must be between '+lo+' and '+hi);return v;}
  validate(a){const s={...defaults(),...a};s.x=this.number(s.x,-240,240,'Start x');s.y=this.number(s.y,-180,180,'Start y');s.direction=((this.number(s.direction,-36000,36000,'Direction')%360)+360)%360;s.size=this.number(s.size,10,300,'Start size');if(!['white','sky','field'].includes(s.backdrop))throw Error('Backdrop must be white, sky or field');s.appearance=String(s.appearance).toLowerCase();if(!catalog.some(v=>v.id===s.appearance))throw Error('Unknown sprite appearance: '+s.appearance);return {x:s.x,y:s.y,direction:s.direction,size:s.size,backdrop:s.backdrop,appearance:s.appearance};}
  setSettings(a,preserve=false){this.settings=this.validate(a);if(preserve){this.state.appearance=this.settings.appearance;this.emit();}else this.reset();}
  reset(){this.state={...this.settings,visible:true,speech:'',speechUntil:0};this.gliding=false;this.release();this.emit();}
  release(){this.keys=[];this.mouse={...this.mouse,down:false};this.inputAt=-Infinity;}
  input(keys,mouse){if(keys.some(k=>!['up','down','left','right','space'].includes(k)))throw Error('Unsupported stage key');this.keys=[...new Set(keys)];this.mouse={x:clamp(mouse.x,-240,240),y:clamp(mouse.y,-180,180),down:!!mouse.down};this.inputAt=this.now();}
  limits(){const a=this.state.direction*Math.PI/180,e=24*this.state.size/100*(Math.abs(Math.sin(a))+Math.abs(Math.cos(a)));return {x:240-e,y:180-e};}
  snapshot(){const l=this.limits();return {...this.state,speech:this.state.speechUntil&&this.now()>=this.state.speechUntil?'':this.state.speech,keys:this.now()-this.inputAt<1000?[...this.keys]:[],mouse:{...this.mouse,down:this.mouse.down&&this.now()-this.inputAt<1000},touching_edge:Math.abs(this.state.x)>=l.x||Math.abs(this.state.y)>=l.y};}
  snapshotProject(){const s=this.snapshot();return {settings:{...this.settings},state:{x:s.x,y:s.y,direction:s.direction,size:s.size,backdrop:s.backdrop,appearance:s.appearance,visible:s.visible,speech:s.speech,speechRemainingMs:s.speechUntil?Math.max(0,s.speechUntil-this.now()):null}};}
  restore(data){
   if(!data?.settings||!data?.state)throw Error('Invalid saved sprite state');
   const settings=this.validate(data.settings),state=this.validate(data.state),s=data.state;
   if(typeof s.visible!=='boolean'||typeof s.speech!=='string'||s.speech.length>200)throw Error('Invalid saved sprite appearance/speech');
   const remaining=s.speechRemainingMs===null?null:this.number(s.speechRemainingMs,0,300000,'Speech remaining time');
   this.settings=settings;this.state={...state,visible:s.visible,speech:remaining===0?'':s.speech,speechUntil:remaining===null?0:this.now()+remaining};this.gliding=false;this.mouse={x:0,y:0,down:false};this.release();this.emit();
  }
  emit(){this.onChange(this.snapshot());}
  async command(action,a={},signal){
   signal?.throwIfAborted();const s=this.state,n=(key,lo=-10000,hi=10000)=>this.number(a[key],lo,hi,key);
   if(['move','go','set_x','set_y','change_x','change_y','go_to_mouse','configure','glide','bounce'].includes(action)&&this.gliding)throw Error('A sprite glide is active. Await it before another movement.');
   switch(action){
    case 'configure':this.state={...this.validate({...a,appearance:a.appearance??s.appearance}),visible:true,speech:'',speechUntil:0};this.release();break;
    case 'move':{const angle=s.direction*Math.PI/180,steps=n('steps');s.x=clamp(s.x+Math.sin(angle)*steps,-240,240);s.y=clamp(s.y+Math.cos(angle)*steps,-180,180);break;}
    case 'turn':s.direction=((s.direction+n('degrees',-36000,36000))%360+360)%360;break;
    case 'point':s.direction=(n('direction',-36000,36000)%360+360)%360;break;
    case 'go':{const x=n('x',-240,240),y=n('y',-180,180);s.x=x;s.y=y;break;}
    case 'set_x':s.x=clamp(n('x'),-240,240);break;
    case 'set_y':s.y=clamp(n('y'),-180,180);break;
    case 'change_x':s.x=clamp(s.x+n('amount'),-240,240);break;
    case 'change_y':s.y=clamp(s.y+n('amount'),-180,180);break;
    case 'set_size':s.size=clamp(n('size'),10,300);break;
    case 'change_size':s.size=clamp(s.size+n('amount'),10,300);break;
    case 'set_appearance':{const valid=this.validate({...this.settings,appearance:a.appearance});s.appearance=valid.appearance;break;}
    case 'appearance':return s.appearance;
    case 'show':s.visible=true;break;
    case 'hide':s.visible=false;break;
    case 'say':s.speech=String(a.text??'').slice(0,200);s.speechUntil=0;break;
    case 'say_for':{const seconds=n('seconds',0,300);s.speech=seconds?String(a.text??'').slice(0,200):'';s.speechUntil=seconds?this.now()+seconds*1000:0;this.emit();await this.sleep(seconds*1000,signal);return;}
    case 'glide':{
     const seconds=n('seconds',0,300),x=n('x',-240,240),y=n('y',-180,180),start=this.now(),from={x:s.x,y:s.y};this.gliding=true;
     try{while(true){signal?.throwIfAborted();const t=seconds?clamp((this.now()-start)/(seconds*1000),0,1):1;s.x=from.x+(x-from.x)*t;s.y=from.y+(y-from.y)*t;this.emit();if(t===1)return;await this.sleep(Math.min(20,Math.max(1,seconds*1000-(this.now()-start))),signal);}}finally{this.gliding=false;}
    }
    case 'bounce':{const l=this.limits(),angle=s.direction*Math.PI/180,vx=Math.sin(angle),vy=Math.cos(angle);if(s.x>=l.x&&vx>1e-9||s.x<=-l.x&&vx<-1e-9)s.direction=-s.direction;if(s.y>=l.y&&vy>1e-9||s.y<=-l.y&&vy<-1e-9)s.direction=180-s.direction;s.direction=(s.direction%360+360)%360;s.x=clamp(s.x,-l.x,l.x);s.y=clamp(s.y,-l.y,l.y);break;}
    case 'go_to_mouse':{const m=this.snapshot().mouse;s.x=m.x;s.y=m.y;break;}
    case 'x':return s.x;case 'y':return s.y;case 'size':return s.size;case 'direction':return (s.direction+180)%360-180;
    case 'touching_edge':return this.snapshot().touching_edge;
    case 'mouse_x':return this.mouse.x;case 'mouse_y':return this.mouse.y;case 'mouse_down':return this.snapshot().mouse.down;
    case 'key_pressed':if(!['up','down','left','right','space'].includes(a.key))throw Error('Key must be up, down, left, right or space');return this.snapshot().keys.includes(a.key);
    default:throw Error('Unsupported sprite action: '+action);
   }
   this.emit();return null;
  }
 }
 SpriteModel.defaults=defaults;
 if(typeof module!=='undefined')module.exports=SpriteModel;else window.CodySpriteModel=SpriteModel;
})();
