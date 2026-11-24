'use strict';
(() => {
 const B=window.Blockly;
 if(!B?.BlockSvg||B.BlockSvg.prototype.codyNickBrandingInstalled_)return;
 const init=B.BlockSvg.prototype.initSvg;
 B.BlockSvg.prototype.initSvg=function(){
  // Brand statement/event headers; keep all inline value/reporters and shadows plain.
  if(!this.isShadow()&&!this.outputConnection&&!this.getField('__codyNickBlockIcon')){
   const input=this.inputList[0]||this.appendDummyInput('__codyNickBrandRow');
   input.insertFieldAt(0,new B.FieldImage('/assets/codynick-block-icon.png?v=3.21.1-ai.22',32,22,'CodyNick'),'__codyNickBlockIcon');
  }
  return init.apply(this,arguments);
 };
 B.BlockSvg.prototype.codyNickBrandingInstalled_=true;
})();
