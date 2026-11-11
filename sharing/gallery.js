'use strict';
(() => {
 const $=id=>document.getElementById(id),results=$('galleryResults');let generation=0,currentPage=1;
 const node=(tag,text,className)=>{const element=document.createElement(tag);if(text!=null)element.textContent=text;if(className)element.className=className;return element;};
 function stateFromUrl(){const query=new URLSearchParams(location.search);$('galleryQuery').value=(query.get('q')||'').slice(0,120);$('galleryLanguage').value=['all','blocks','python'].includes(query.get('language'))?query.get('language'):'all';$('gallerySort').value=query.get('sort')==='newest'?'newest':'updated';const page=query.get('page')||'1';return /^[0-9]{1,6}$/.test(page)&&Number(page)>0?Math.min(100000,Number(page)):1;}
 async function load(page=1,writeHistory=true){
  const stamp=++generation;currentPage=page;
  const params=new URLSearchParams({q:$('galleryQuery').value.trim(),language:$('galleryLanguage').value,sort:$('gallerySort').value,page:String(page)});
  if(writeHistory)history.pushState(null,'',location.pathname+'?'+params);
  $('galleryStatus').textContent='Searching public projects…';results.setAttribute('aria-busy','true');$('galleryPrevious').disabled=true;$('galleryNext').disabled=true;
  try{
   const response=await fetch('/api/gallery?'+params,{credentials:'omit',cache:'no-store'}),data=await response.json();
   if(!response.ok)throw Error(data.error||'Could not load the gallery.');if(stamp!==generation)return;
   currentPage=data.page;if(data.page!==page){params.set('page',String(data.page));history.replaceState(null,'',location.pathname+'?'+params);}
   results.replaceChildren();
   for(const project of data.projects){
    const card=node('article',null,'gallery-card'),badge=node('span',project.selection==='both'?'Blocks + Python':project.selection==='blocks'?'Blocks':'Python','language-badge');
    const heading=node('h2',project.title),projectUrl='/sharing/#'+project.token;
    const by=node('p','Designed by '+project.display_name,'gallery-author');
    const description=node('p',project.description||'Open this project to explore its code and simulation.','gallery-description');
    const date=node('time','Updated '+new Date(project.updated*1000).toLocaleDateString());date.dateTime=new Date(project.updated*1000).toISOString();
    const open=node('a','Explore project →','gallery-open');open.href=projectUrl;open.setAttribute('aria-label','Explore '+project.title);
    card.append(badge,heading,by,description,date,open);results.append(card);
   }
   $('galleryStatus').textContent=data.total?`${data.total} public project${data.total===1?'':'s'}${params.get('q')?' matching your search':''}.`:(params.get('q')||params.get('language')!=='all'?'No projects match these filters. Try another search or clear the filters.':'No public projects yet. Be the first to share something you have made.');
   if(!data.projects.length){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('empty-graphic');svg.setAttribute('aria-hidden','true');svg.innerHTML='<use href="/sharing/icons.svg#empty"></use>';results.append(svg);}
   $('galleryPage').textContent=data.total?'Page '+data.page+' of '+data.pages:'';
   $('galleryPrevious').disabled=data.page<=1;$('galleryNext').disabled=data.page>=data.pages;
  }catch(error){if(stamp===generation){results.replaceChildren();$('galleryStatus').textContent=error.message;$('galleryPage').textContent='';}}
  finally{if(stamp===generation)results.setAttribute('aria-busy','false');}
 }
 $('gallerySearch').onsubmit=event=>{event.preventDefault();void load(1);};
 $('galleryReset').onclick=()=>{$('galleryQuery').value='';$('galleryLanguage').value='all';$('gallerySort').value='updated';void load(1);};
 $('galleryPrevious').onclick=()=>{void load(Math.max(1,currentPage-1));};$('galleryNext').onclick=()=>{void load(currentPage+1);};
 window.addEventListener('popstate',()=>void load(stateFromUrl(),false));
 void load(stateFromUrl(),false);
})();
