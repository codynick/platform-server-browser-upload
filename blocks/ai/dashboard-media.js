'use strict';
(()=>{
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('codynick-ai-media-v2'):null,cache=new Map();
 const parse=ref=>/^ai-media:([a-zA-Z0-9-]+):(image|camera|ocr)$/.exec(String(ref||''));
 function receive(m){if(m?.kind!=='frame'||!parse(m.ref))return;if(m.data!==null&&(typeof m.data!=='string'||m.data.length>3000000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(m.data)))return;cache.set(m.ref,{data:m.data,label:String(m.label||''),at:Date.now()});render();}
 function send(m){try{const host=window.parent!==window?window.parent.CodyAIWorkbench:null;if(host&&host.session===m.owner){void host.receive(m,receive);return;}}catch{}channel?.postMessage(m);}
 if(channel)channel.onmessage=e=>receive(e.data);
 function render(){for(const card of document.querySelectorAll('.card[data-card-type="image"]')){const w=CodyLiveStore.read().widgets[card.dataset.cardId],m=cache.get(w?.value),img=card.querySelector('[data-role="ai-image"]'),note=card.querySelector('[data-role="ai-image-note"]');if(!img)continue;const active=m&&Date.now()-m.at<3000&&m.data;img.hidden=!active;if(active&&img.src!==m.data)img.src=m.data;if(note)note.textContent=active?m.label:'No image available. Keep the originating editor open.';}}
 function request(){const refs=new Set(Object.values(CodyLiveStore.read().widgets).filter(w=>w.type==='image').map(w=>w.value));for(const ref of refs){const m=parse(ref);if(m)send({kind:'get',owner:m[1],media:m[2]});}render();}
 function attachUpload(card,owner){const button=card.querySelector('[data-role="button"]');if(!button)return;const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.hidden=true;card.append(input);button.addEventListener('click',()=>{if(!CodyLiveStore.read().run){alert('Run the workbench example before uploading an image.');return;}input.click();});input.addEventListener('change',()=>{const file=input.files[0];if(file){if(file.size>12*1024*1024){alert('Choose an image under 12 MB.');return;}send({kind:'upload',owner,file});}input.value='';});}
 window.CodyAIMedia={request,render,attachUpload,cancel:owner=>send({kind:'cancel',owner})};setInterval(()=>{if(!document.hidden)request();},800);window.addEventListener('pagehide',()=>channel?.close());
})();
