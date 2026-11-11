'use strict';
(() => {
 let loaded=false;
 window.CodySharingImport=async()=>{
  if(loaded)return;loaded=true;const token=new URLSearchParams(location.search).get('shared');
  try{
   if(!/^[A-Za-z0-9_-]{43}$/.test(token||''))throw Error('Invalid project link.');
   const response=await fetch('/api/shared/'+token,{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('This project has been unpublished or is unavailable.');const data=await response.json();
   await CodyProjectFiles.loadProject(data.project);window.CodyPublication?.clear();
   // Only the owner can reconnect this project to an existing publication.
   try{const response=await fetch('/api/shares',{cache:'no-store'});if(response.ok){const own=(await response.json()).shares.find(share=>share.token===token);if(own)window.CodyPublication?.restore({id:own.id});}}catch{}
   CodyAccountEditor.status('Published project opened. Programs remain stopped. Review the code before running. Save to keep your own private project.');history.replaceState(null,'',location.pathname);
  }catch(error){CodyAccountEditor.status(error.message);}
 };
 window.dispatchEvent(new Event('codynick-sharing-import-ready'));
})();
