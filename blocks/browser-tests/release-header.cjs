'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('playwright-core'));}
const root=path.resolve(__dirname,'../..'),origin='https://codynick-header.test';
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});try{
 for(const role of ['guest','user','admin'])for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950}});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
   if(url.pathname==='/api/me')return route.fulfill({json:{user:role==='guest'?null:{user_id:'fixture-'+role,name:role==='admin'?'Administrator':'Student'},csrf:role==='guest'?null:'fixture-csrf',access:role==='guest'?null:{role,subscribed:role==='admin',unlimited:role==='admin',plan:'',ready:0,seconds:60,cooldown:10}}});
   if(url.pathname==='/auth/login')return route.fulfill({contentType:'text/html',body:'<h1>Sign-in route reached</h1>'});
   const relative=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname,file=path.resolve(root,'.'+relative);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
   return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.goto(origin+'/blocks/');await page.waitForFunction(()=>document.body.style.visibility==='visible'&&document.getElementById('publicGallery'));
  const account=page.locator('#accountButton');assert.equal(await page.locator('.toolbar').evaluate(node=>node.lastElementChild.classList.contains('account-controls')),true);
  const bounds=await account.boundingBox();assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+1);
  const rightmost=await page.locator('.topbar button').evaluateAll(nodes=>Math.max(...nodes.filter(node=>node.getClientRects().length).map(node=>node.getBoundingClientRect().right)));
  assert(bounds.x+bounds.width>=rightmost-2,`${role}/${width}: account must be rightmost`);
  if(role==='guest'){assert.equal(await account.textContent(),'Sign in');await account.click();await page.waitForURL(origin+'/auth/login');}
  else{await account.click();assert(await page.locator('#accountMenu').isVisible());await page.locator('#accountSubscription').click();assert(await page.locator('#subscriptionStatus').isVisible());assert.equal(await page.locator('#adminLink').isVisible(),role==='admin');await page.keyboard.press('Escape');assert.equal(await page.locator('#accountMenu').isVisible(),false);}
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: rightmost header account, desktop/mobile, guest sign-in route, subscription and admin menu');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1});
