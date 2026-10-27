const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const handlers={},menuEvents={},els={};const summary={focus(){this.focused=true;}};const menu={open:true,querySelector:()=>summary,addEventListener:(k,f)=>menuEvents[k]=f,contains:el=>el==='inside'};
const element=()=>({clicks:0,showModal(){this.open=true;},close(){this.open=false;},click(){this.clicks++;}});
const ctx={window:{CODYNICK_VERSION:"3.6.0"},document:{getElementById:id=>id==='projectMenu'?menu:els[id]??=element(),addEventListener:(k,f)=>handlers[k]=f}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../project-menu.js'),'utf8'),ctx);
assert.equal(els.aboutVersion.textContent,'3.6.0');els.menuAbout.onclick();assert(els.aboutDialog.open);els.closeAbout.onclick();assert(!els.aboutDialog.open);
els.menuSave.onclick();assert.equal(els.saveNamed.clicks,1);els.menuUpload.onclick();assert.equal(els.importFile.clicks,1);
handlers.keydown({key:'Escape'});assert(!menu.open);assert(summary.focused);menu.open=true;handlers.click({target:'outside'});assert(!menu.open);menu.open=true;menuEvents.click({target:{closest:()=>true}});assert(!menu.open);
console.log('PASS: menu Save shortcut, Upload picker, Escape/outside/action dismissal');
