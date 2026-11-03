const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const base=process.env.PILOT_URL||'http://127.0.0.1:8791';
 try{
  const context=await browser.newContext({viewport:{width:1400,height:1000}});
  if(process.env.STATIC_FIXTURE)await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!==base)return route.continue();
   let name=path.join(__dirname,'../..',decodeURIComponent(url.pathname));if(fs.existsSync(name)&&fs.statSync(name).isDirectory())name=path.join(name,'index.html');
   const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
   if(!fs.existsSync(name))return route.fulfill({status:404,body:'Not found'});
   await route.fulfill({contentType:mime[path.extname(name)]||'application/octet-stream',body:fs.readFileSync(name)});
  });
  const p=await context.newPage(),errors=[];let starts=0;
  p.setDefaultTimeout(30000);p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.stack);});p.on('dialog',d=>{console.log('DIALOG',d.type(),d.message());return d.accept();});
  await p.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;let data;
   if(path==='/api/me')data={user:null,access:null,csrf:null};
   else if(path==='/api/run/start'){starts++;assert.equal(route.request().postDataJSON().example,null);data={token:'test',deadline:Date.now()/1000+1,ready:Date.now()/1000+2,server_time:Date.now()/1000};}
   else data={ready:Date.now()/1000+5,server_time:Date.now()/1000};
   await route.fulfill({json:data});
  });
  await p.goto(base+'/blocks/',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.getElementById('designName').value==='Sensor Test: Soil Moisture'&&!document.getElementById('blockRunBtn').disabled);
  assert.equal(await p.locator('#pythonInfo').isVisible(),true);
  await p.locator('#pythonInfo').click();
  assert.equal(await p.evaluate(()=>document.getElementById('pythonHelpBubble').matches(':popover-open')),true);
  assert.match(await p.locator('#pythonExampleHelp').textContent(),/gold probe tips/);
  await p.locator('#pythonInfo').click();
  assert.equal(await p.evaluate(()=>CodyAccess.canEdit()),true);
  assert.equal(await p.locator('#designName').getAttribute('readonly'),null);
  await p.locator('#designName').fill('My soil experiment');
  await p.evaluate(()=>{const b=codyWorkspace.getAllBlocks(false)[0];if(!b.isEditable()||!b.isMovable())throw Error('Example locked');});
  await p.locator('#blockRunBtn').click();
  await p.waitForFunction(()=>window.blockProgramRunning===true);
  await p.waitForFunction(()=>!window.blockProgramRunning);
  await p.waitForFunction(()=>document.getElementById('blockRunBtn').textContent.startsWith('Wait'));
  assert.equal(starts,1);assert.match(await p.locator('#blockRunBtn').textContent(),/Wait/);
  await p.evaluate(()=>CodyAccess.setIdentity(null,null,''));
  assert.match(await p.locator('#blockRunBtn').textContent(),/Wait/);
  await p.locator('#headerExamples').click();
  await p.locator('.example-categories button').filter({hasText:'Hardware'}).click();
  assert.equal(await p.locator('.example-card').count(),14);
  const hardware=await p.evaluate(async()=>{
   const catalog=await(await fetch('python-examples.json')).json();
   if(Object.values(catalog).some(e=>/^\d+\./.test(e.title)))throw Error('Numbered catalog title');
   return Object.values(catalog).filter(e=>e.hardware).map(e=>e.title).sort();
  });
  assert.deepEqual((await p.locator('.example-card strong').allTextContents()).sort(),hardware);
  if(process.env.REVIEW_SHOTS){fs.mkdirSync(process.env.REVIEW_SHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.REVIEW_SHOTS,'hardware-library.png')});}
  await p.locator('.example-categories button').filter({hasText:'Sensors'}).click();
  assert.equal(await p.locator('.example-card').count(),3);
  if(process.env.REVIEW_SHOTS){fs.mkdirSync(process.env.REVIEW_SHOTS,{recursive:true});await p.screenshot({path:path.join(process.env.REVIEW_SHOTS,'library.png')});}
  await p.locator('#exampleSearch').fill('Ultrasonic');assert.equal(await p.locator('.example-card').count(),1);
  await p.locator('.example-card').click();await p.locator('#loadExample').click();
  await p.waitForFunction(()=>document.getElementById('designName').value==='Sensor Test: Ultrasonic');
  await p.locator('#pythonEditorTab').click();
  assert.equal(await p.locator('#pythonInfo').isVisible(),true);
  await p.locator('#pythonInfo').click();
  assert.match(await p.locator('#pythonExampleHelp').textContent(),/striped target/);
  await p.locator('#pythonInfo').click();
  await p.locator('#pythonSource').fill('print("My copy")');
  assert.equal(await p.locator('#pythonSource').inputValue(),'print("My copy")');
  await p.goto(base+'/blocks/?example=zone-04');
  await p.waitForFunction(()=>document.getElementById('designName').value.includes('Move the Bee'));
  const restored=await p.evaluate(async()=>{
   const catalog=await(await fetch('python-examples.json')).json();let count=0;
   for(const language of ['blocks','python']){
    document.getElementById(language==='python'?'pythonEditorTab':'blocksEditorTab').click();
    await new Promise(resolve=>setTimeout(resolve,0));
    for(const[id,e]of Object.entries(catalog)){
     await CodyProjectFiles.loadExample(id,false);
     const expected=await CodyProjectArchive.decode(await(await fetch(e.archive)).arrayBuffer()),actual=CodyProjectFiles.capture();
     if(id.startsWith('zone-')&&(actual.editor.names.blocks!==e.title||actual.editor.names.python!==e.title||/^# \d+\./.test(actual.python)))throw Error('Numbered saved title: '+id);
     if(actual.python!==expected.python||JSON.stringify(actual.editor.names)!==JSON.stringify(expected.editor.names)||actual.editor.language!==language)throw Error('Incorrect example restore: '+id+' '+language);
     count++;
    }
   }return count;
  });assert.equal(restored,60);
  console.log('PASS all 30 examples restore both programs in both editor modes');
  await p.goto(base+'/blocks/?python=0&example=zone-02');
  await p.waitForFunction(()=>document.getElementById('designName').value==='Sim - Simulated Sensor and Light');
  assert.equal(await p.evaluate(()=>!!window.CodyPythonPilot),false);
  await p.locator('#pythonInfo').click();
  assert.equal(await p.evaluate(()=>document.getElementById('pythonHelpBubble').matches(':popover-open')),true);
  assert.match(await p.locator('#pythonExampleHelp').textContent(),/change temperature across 30 C/);
  console.log('PASS unnumbered saved titles, all hardware examples and project information in Blocks, Python and Blocks-only mode');
  console.log('PASS guest automatic/default and linked examples, editable copies, timed stop/cooldown, sensor categories/search, Python editing');
  await p.goto(base+'/');
  assert.equal(await p.locator('.example-list a[href*="example="]').count(),7);
  await p.setViewportSize({width:390,height:844});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(process.env.REVIEW_SHOTS)await p.screenshot({path:path.join(process.env.REVIEW_SHOTS,'landing-mobile.png'),fullPage:true});
  console.log('PASS featured links and mobile landing layout');
  await p.close();
  const a=await context.newPage();let saved;
  a.on('pageerror',e=>errors.push(e.message));
  const access={role:'user',seconds:20,plan:'Subscription',starts:1893456000,ends:1924992000,unlimited_override:0,subscribed:false,unlimited:false};
  await a.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;let data;
   if(path==='/api/me')data={user:{user_id:'admin'},csrf:'csrf',access:{role:'admin',unlimited:true}};
   else if(req.method()==='PUT'){saved=req.postDataJSON();Object.assign(access,saved,{unlimited_override:+saved.unlimited,unlimited:saved.unlimited});data={access};}
   else data={users:[{id:'learner',name:'Learner',email:'learner@example.test',access}]};
   await route.fulfill({json:data});
  });
  await a.goto(base+'/admin/');await a.waitForSelector('#users option');
  assert.match(await a.locator('#users option').textContent(),/learner@example.test/);
  await a.selectOption('#users','learner');assert.equal(await a.locator('#email').inputValue(),'learner@example.test');
  if(process.env.REVIEW_SHOTS)await a.screenshot({path:path.join(process.env.REVIEW_SHOTS,'admin.png')});
  const start=await a.locator('#starts').inputValue(),end=await a.locator('#ends').inputValue();
  await a.locator('#unlimited').check();assert.equal(await a.locator('#starts').isDisabled(),true);
  await a.locator('#save').click();await a.waitForFunction(()=>document.getElementById('status').textContent==='Saved');
  assert.equal(saved.unlimited,true);assert.equal(saved.starts,1893456000);assert.equal(saved.ends,1924992000);
  await a.locator('#unlimited').uncheck();assert.equal(await a.locator('#starts').isDisabled(),false);
  assert.equal(await a.locator('#starts').inputValue(),start);assert.equal(await a.locator('#ends').inputValue(),end);
  await a.locator('#save').click();await a.waitForFunction(()=>document.getElementById('status').textContent==='Saved');
  assert.equal(saved.unlimited,false);assert.equal(saved.starts,1893456000);
  console.log('PASS admin email and preserved UTC subscription dates across Unlimited toggles');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
