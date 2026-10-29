const assert=require('assert/strict'),Model=require('../sprite-model.js');
(async()=>{
 let clock=0;const model=new Model({now:()=>clock,sleep:async ms=>{clock+=ms;}});
 await model.command('move',{steps:10});assert.equal(model.snapshot().x,10);
 await model.command('turn',{degrees:90});await model.command('move',{steps:10});assert(Math.abs(model.snapshot().y+10)<1e-8);
 await model.command('point',{direction:90});await model.command('set_x',{x:1000});await model.command('bounce');assert.equal(await model.command('direction'),-90);assert.equal(model.snapshot().x,216);
 await model.command('set_size',{size:400});assert.equal(model.snapshot().size,300);
 model.input(['left'],{x:12,y:15,down:true});assert(await model.command('key_pressed',{key:'left'}));assert(await model.command('mouse_down'));clock+=1001;assert(!await model.command('key_pressed',{key:'left'}));assert(!await model.command('mouse_down'));
 model.setSettings({x:-10,y:20,direction:90,size:75,backdrop:'sky'});await model.command('glide',{seconds:1,x:100,y:-20});assert.equal(model.snapshot().x,100);assert.equal(model.snapshot().y,-20);assert.equal(model.settings.x,-10);model.reset();assert.equal(model.snapshot().x,-10);
 await assert.rejects(()=>model.command('glide',{seconds:-1,x:0,y:0}),/seconds/);await assert.rejects(()=>model.command('go',{x:Infinity,y:0}),/x/);assert.throws(()=>model.setSettings({backdrop:'bad'}),/Backdrop/);
 const abort=new AbortController();let steps=0;const stop=new Model({now:()=>clock,sleep:async ms=>{clock+=ms;if(++steps===3)abort.abort(Error('Stopped'));}});await assert.rejects(()=>stop.command('glide',{seconds:1,x:100,y:0},abort.signal),/Stopped/);assert(stop.snapshot().x<100);assert.equal(stop.gliding,false);
 await model.command('say_for',{text:'hello',seconds:1});assert.equal(model.snapshot().speech,'');await model.command('hide');assert.equal(model.snapshot().visible,false);await model.command('show');assert.equal(model.snapshot().visible,true);
 console.log('PASS: sprite movement, rotation, bounds/bounce, size clamp, input expiry, saved settings, glide completion/cancellation, invalid inputs and speech expiry');
})().catch(e=>{console.error(e);process.exitCode=1;});
