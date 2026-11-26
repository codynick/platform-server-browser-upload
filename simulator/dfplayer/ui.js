(() => {
 'use strict';
 const S=window.CodyLiveStore,$=id=>document.getElementById(id);
 const style=document.createElement('style');style.textContent='.df-device>svg{display:block;width:300px;height:185px}.df-device{display:grid;gap:9px}.df-device label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px}.df-device input[type=number]{width:72px;padding:6px}.df-device progress{width:100%;height:16px;accent-color:#e12629}.df-device p{margin:0;font-size:12px}.df-device #dfError{color:#b71f2e;white-space:normal}.df-device #dfTitle{font-size:13px;white-space:normal}';document.head.append(style);
 function install(){
  if(!$('dfVolume')){setTimeout(install,50);return;}
  $('dfVolume').oninput=()=>{const input=$('dfVolume'),value=Number(input.value);if(input.value===''||!Number.isFinite(value)||value<0||value>100)return;S.update(s=>{s.scene.dfplayer={...(s.scene.dfplayer||{muted:false}),volume:value};});};
  $('dfMuted').onchange=()=>S.update(s=>{s.scene.dfplayer={...(s.scene.dfplayer||{volume:50}),muted:$('dfMuted').checked};});
  const previous=S.simCommand;S.simCommand=function(c){if(c.action==='scene'){c={...c,scene:{...c.scene,dfplayer:S.read().scene.dfplayer||{volume:50,muted:false}}};}return previous(c);};
  const refresh=()=>{const state=S.read(),c=state.scene.dfplayer||{volume:50,muted:false},raw=state.dfplayer||{status:'stopped',progress:0},p=['playing','paused'].includes(raw.status)&&raw.at&&Date.now()-raw.at>2000?{...raw,status:'stopped',busy:false,progress:0}:raw;if(document.activeElement!==$('dfVolume'))$('dfVolume').value=c.volume;$('dfMuted').checked=c.muted;$('dfTitle').textContent=p.title||'No recording selected';$('dfStatus').textContent=(p.status||'stopped').replace(/^./,s=>s.toUpperCase())+(p.busy?' · Busy':'');$('dfProgress').value=p.progress||0;$('dfError').textContent=p.error||'';};
  window.addEventListener('codynick-live-change',refresh);setInterval(refresh,100);refresh();
 }
 install();
})();
