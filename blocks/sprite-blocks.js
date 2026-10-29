'use strict';
(() => {
 const value=(name,fallback=10)=>({name,kind:'value',fallback});
 const specs=[
  ['move','move %1 steps',[value('steps')]],['turn','turn clockwise %1 degrees',[value('degrees',15)]],['point','point in direction %1',[value('direction',90)]],
  ['go','go to x %1 y %2',[value('x',0),value('y',0)]],['set_x','set x to %1',[value('x',0)]],['set_y','set y to %1',[value('y',0)]],['change_x','change x by %1',[value('amount')]],['change_y','change y by %1',[value('amount')]],
  ['glide','glide %1 seconds to x %2 y %3',[value('seconds',1),value('x',100),value('y',0)]],['bounce','if on edge, bounce',[]],['go_to_mouse','go to pointer',[]],
  ['set_appearance','set appearance to %1',[{name:'appearance',kind:'appearance'}]],['appearance','sprite appearance',[],true],
  ['say','say %1',[{...value('text','Hello!'),text:true}]],['say_for','say %1 for %2 seconds',[{...value('text','Hello!'),text:true},value('seconds',2)]],['show','show sprite',[]],['hide','hide sprite',[]],['set_size','set size to %1 percent',[value('size',100)]],['change_size','change size by %1',[value('amount',10)]],
  ['x','sprite x',[],true],['y','sprite y',[],true],['direction','sprite direction',[],true],['size','sprite size (percent)',[],true],['mouse_x','pointer x',[],true],['mouse_y','pointer y',[],true],['mouse_down','pointer down?',[],true],['touching_edge','touching edge?',[],true],
  ['key_pressed','key %1 pressed?',[{name:'key',kind:'field'}],true]
 ].map(([action,label,args,output])=>({type:'stage_'+action,action,label,args,output,string:action==='appearance',boolean:['key_pressed','mouse_down','touching_edge'].includes(action)}));
 const folders=[['Motion','#287db3',['move','turn','point','go','set_x','set_y','change_x','change_y','glide','bounce','go_to_mouse','x','y','direction']],['Looks','#a33883',['set_appearance','appearance','say','say_for','show','hide','set_size','change_size','size']],['Sensing','#168579',['key_pressed','mouse_x','mouse_y','mouse_down','touching_edge']]];
 const api={
  types:specs.map(s=>s.type),
  definitions(){Blockly.defineBlocksWithJsonArray(specs.map(s=>({type:s.type,message0:s.label,args0:s.args.map(a=>a.kind==='appearance'?{type:'field_dropdown',name:a.name,options:window.CodySpriteLooks.map(v=>[v.label,v.id])}:a.kind==='field'?{type:'field_dropdown',name:a.name,options:['up','down','left','right','space'].map(v=>[v,v])}:{type:'input_value',name:a.name,...(!a.text?{check:'Number'}:{})}),colour:folders.find(f=>f[2].includes(s.action))[1],...(s.output?{output:s.boolean?'Boolean':s.string?'String':'Number'}:{previousStatement:null,nextStatement:null})})));},
  categories(){return folders.map(([name,colour,actions])=>({kind:'category',name,colour,contents:actions.map(action=>{const s=specs.find(s=>s.action===action),inputs={};for(const a of s.args)if(a.kind==='value')inputs[a.name]={shadow:a.text?{type:'text',fields:{TEXT:a.fallback}}:{type:'math_number',fields:{NUM:a.fallback}}};return {kind:'block',type:s.type,inputs};})}));},
  async execute(block,runtime){const spec=specs.find(s=>s.type===block.type);if(!spec)throw Error('Unknown sprite block');const args={};for(const a of spec.args)args[a.name]=a.kind!=='value'?block.getFieldValue(a.name):await runtime.input(block,a.name,a.fallback);return window.CodySpriteStage.command(spec.action,args,runtime.signal);}
 };
 window.CodySpriteBlocks=api;
 window.BlockRuntime.types.push(...api.types);
})();
