'use strict';
(()=>{
 const $=id=>document.getElementById(id),dialog=$('examplesDialog'),select=$('example');
 const style=document.createElement('style');style.textContent=`
 #examplesDialog{width:min(980px,95vw);max-width:980px}#example{display:none}
 .example-library{display:grid;grid-template-columns:180px 1fr;gap:20px;margin:18px 0}.example-categories{display:flex;flex-direction:column;gap:6px}
 .example-categories button{text-align:left;padding:12px;border:0;border-radius:10px;cursor:pointer}.example-categories button[aria-pressed=true]{background:#172033;color:white}
 .example-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-height:52vh;overflow:auto;padding:4px}
 #examplesDialog .example-categories button{display:block;width:100%;text-align:left;font-size:14px}
 #examplesDialog .example-card{display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:6px;min-height:160px;font-size:16px;text-align:left;white-space:normal;border:1px solid #d9dfeb;border-radius:14px;padding:16px;background:#fff;color:#172033;cursor:pointer}
 .example-card[aria-pressed=true]{outline:3px solid #06b7fa}.example-card strong,.example-card small{display:block}.example-card small{font-size:13px;margin-top:4px;color:#4a566e;font-weight:normal;line-height:1.5}
 #exampleSearch{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d9dfeb;border-radius:10px}.example-tags{display:block;margin-top:auto;padding:5px 8px;border-radius:6px;background:#e9f7fc;font-size:12px;color:#126681}
 @media(max-width:640px){.example-library{grid-template-columns:1fr}.example-categories{flex-direction:row;flex-wrap:wrap}.example-results{grid-template-columns:1fr}}
 `;document.head.append(style);
 const search=document.createElement('input');search.id='exampleSearch';search.type='search';search.placeholder='Search examples';search.setAttribute('aria-label','Search examples');select.before(search);
 const library=document.createElement('div');library.className='example-library';
 const nav=document.createElement('nav');nav.className='example-categories';nav.setAttribute('aria-label','Example categories');
 const results=document.createElement('div');results.className='example-results';library.append(nav,results);select.before(library);
 const path=document.createElement('p');path.setAttribute('aria-live','polite');library.before(path);
 let catalog={},category='All examples',selected='';
 const group=e=>e.title.startsWith('Sensor Test')?'Sensors':e.stage&&e.dashboard?'Combined projects':e.stage?'Sprites':e.dashboard?'Dashboards':'General';
 function render(){
  const categories=['All examples','General','Sensors','Dashboards','Sprites','Combined projects'];nav.replaceChildren();results.replaceChildren();
  for(const name of categories){const count=Object.values(catalog).filter(e=>name==='All examples'||group(e)===name).length;if(!count)continue;const b=document.createElement('button');b.type='button';b.textContent=name+' ('+count+')';b.setAttribute('aria-pressed',String(name===category));b.onclick=()=>{category=name;render();};nav.append(b);}
  const query=search.value.trim().toLowerCase();let count=0;
  for(const[id,e]of Object.entries(catalog)){
   if(category!=='All examples'&&group(e)!==category||query&&!(e.title+' '+e.help).toLowerCase().includes(query))continue;
   count++;const card=document.createElement('button');card.type='button';card.className='example-card';card.setAttribute('aria-pressed',String(id===selected));
   const title=document.createElement('strong');title.textContent=e.title;
   const help=document.createElement('small');help.textContent=(e.help||'').split(/(?<=[.!?])\s/).slice(0,2).join(' ');
   const tags=document.createElement('span');tags.className='example-tags';tags.textContent=[group(e),e.stage?'Sprite':'',e.dashboard?'Dashboard':'',e.simulation?.length?'Simulation':''].filter(Boolean).join(' · ');
   card.append(title,help,tags);card.onclick=()=>{selected=id;if(![...select.options].some(o=>o.value===id)){const o=new Option(e.title,id);select.append(o);}select.value=id;render();$('loadExample').focus();};card.ondblclick=()=>$('loadExample').click();results.append(card);
  }path.textContent='Examples › '+category+' · '+count+' results';if(!count)results.textContent='No matching examples.';
 }
 search.oninput=render;
 $('menuExamples').onclick=()=>{selected=select.value;render();dialog.showModal();search.focus();};
 fetch('python-examples.json').then(r=>{if(!r.ok)throw Error('Cannot load examples');return r.json();}).then(data=>{catalog=data;render();}).catch(e=>{results.textContent=e.message;});
})();
