'use strict';
(() => {
 const B=window.Blockly;
 if(!B||window.CodyEditorInputs)return;
 function parseScalar(raw){
  const text=String(raw??''),trimmed=text.trim();
  if(trimmed.startsWith('"')&&trimmed.endsWith('"')){
   try{const value=JSON.parse(trimmed);if(typeof value==='string')return value;}catch{}
  }
  if(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)){
   const value=Number(trimmed);if(Number.isFinite(value))return value;
  }
  return text;
 }
 B.defineBlocksWithJsonArray([{type:'cn_scalar_value',message0:'%1',args0:[{type:'field_input',name:'VALUE',text:'0'}],output:null,colour:'#a55b80',tooltip:'Type a number or text. Double quotes keep numeric text as text, for example "123".'}]);
 if(window.BlockRuntime&&!BlockRuntime.types.includes('cn_scalar_value'))BlockRuntime.types.push('cn_scalar_value');
 const originalInit=B.Blocks.variables_set.init;
 B.Blocks.variables_set.init=function(){
  originalInit.call(this);
  this.getInput('VALUE').connection.setShadowState({type:'cn_scalar_value',fields:{VALUE:'0'}});
 };
 let active=null,lastPointer=null;
 const coordinate=(x,y)=>new B.utils.Coordinate(x,y);
 const eventAt=(point,type='pointermove')=>new PointerEvent(type,{clientX:point.x,clientY:point.y,pointerId:1,pointerType:'mouse',button:0,buttons:0,bubbles:true});
 function removeListeners(){
  document.removeEventListener('pointerdown',onPlace,true);
  document.removeEventListener('keydown',onKey,true);
  document.removeEventListener('wheel',onWheel,true);
  window.removeEventListener('blur',onBlur);
 }
 function finish(cancel,event){
  const session=active;if(!session)return;
  active=null;removeListeners();
  try{
   if(cancel){
    B.Events.disable();
    try{if(session.dragger){session.copy.revertDrag();session.dragger.onDragEnd();}session.copy.dispose(false);}finally{B.Events.enable();}
   }else{
    B.Events.fire(session.createEvent);
    session.dragger.onDrag(event,coordinate(event.clientX-session.origin.x,event.clientY-session.origin.y));
    session.dragger.onDragEnd(event);
   }
  }finally{B.Events.setGroup(session.previousGroup);}
 }
 function onPlace(event){
  if(!active)return;
  event.preventDefault();event.stopImmediatePropagation();
  const inside=active.workspace.getInjectionDiv().contains(event.target)&&!event.target.closest?.('.blocklyToolbox,.blocklyFlyout');
  finish(event.button!==0||!inside||!active.dragger,event);
 }
 function onKey(event){
  if(!active)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(event.key==='Escape')finish(true);
 }
 function onWheel(event){if(active){event.preventDefault();event.stopImmediatePropagation();}}
 function onBlur(){finish(true);}
 document.addEventListener('pointermove',event=>{
  lastPointer={x:event.clientX,y:event.clientY};
  if(!active?.dragger)return;
  active.dragger.onDrag(event,coordinate(event.clientX-active.origin.x,event.clientY-active.origin.y));
 },true);
 async function duplicate(block,event){
  if(active)finish(true);
  const workspace=block.workspace;
  if(workspace.isReadOnly()||block.isInFlyout||!block.isDuplicatable())return;
  const data=block.toCopyData(true);
  if(!data||!workspace.isCapacityAvailable(data.typeCounts))return;
  const rect=block.getSvgRoot().getBoundingClientRect();
  const point=lastPointer||(event&&Number.isFinite(event.clientX)?{x:event.clientX,y:event.clientY}:{x:rect.x+20,y:rect.y+20});
  const previousGroup=B.Events.getGroup();B.Events.setGroup(true);
  let copy;
  B.Events.disable();
  try{copy=B.serialization.blocks.append(data.blockState,workspace);}catch(error){B.Events.setGroup(previousGroup);throw error;}finally{B.Events.enable();}
  const session=active={copy,workspace,previousGroup,origin:point,dragger:null};
  document.addEventListener('pointerdown',onPlace,true);
  document.addEventListener('keydown',onKey,true);
  document.addEventListener('wheel',onWheel,{capture:true,passive:false});
  window.addEventListener('blur',onBlur);
  try{
   await copy.queueRender();
   if(active!==session)return;
   const cursor=lastPointer||point;
   const target=B.utils.svgMath.screenToWsCoordinates(workspace,coordinate(cursor.x+12,cursor.y+12));
   const position=copy.getRelativeToSurfaceXY();
   B.Events.disable();
   try{copy.moveBy(target.x-position.x,target.y-position.y);}finally{B.Events.enable();}
   session.origin=cursor;
   session.createEvent=new B.Events.BlockCreate(copy);
   const Dragger=B.registry.getClassFromOptions(B.registry.Type.BLOCK_DRAGGER,workspace.options,true);
   session.dragger=new Dragger(copy,workspace);session.dragger.onDragStart(eventAt(cursor));
   copy.select();
  }catch(error){if(active===session)finish(true);console.error('Duplicate failed:',error);window.portalToast?.('Could not duplicate these blocks: '+error.message);}
 }
 const item=B.ContextMenuRegistry.registry.getItem('blockDuplicate');
 if(item)item.callback=(scope,event)=>{if(scope.block)void duplicate(scope.block,event);};
 window.CodyEditorInputs={parseScalar,cancelDuplicate:()=>finish(true),get duplicating(){return !!active;}};
})();
