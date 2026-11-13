const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const site=path.resolve(process.argv[2]||'build/testsite');const read=f=>fs.readFileSync(path.join(site,f),'utf8');
const Runtime=require(path.join(site,'blocks/runtime.js')),codec=require(path.join(site,'blocks/project-archive.js'));
const ctx={console,setTimeout,clearTimeout,AbortController,performance};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('blocks/vendor/blockly/blockly.min.js'),ctx);
for(const f of ['blocks/block-specs.js','blocks/runtime.js','blocks/dashboard-blocks.js','blocks/sprite-looks.js','blocks/sprite-blocks.js','blocks/ai/classes.js','blocks/ai/blocks.js','sharing/block-definitions.js'])vm.runInContext(read(f),ctx,{filename:f});
(async()=>{
const p=await codec.decode(fs.readFileSync(path.join(site,'blocks/examples/ai-person-detector.codynick')));const B=ctx.Blockly,ws=new B.Workspace();B.serialization.workspaces.load(p.workspace,ws);const blocks=ws.getAllBlocks(false);assert(blocks.some(b=>b.type==='ai_detect_objects'));assert(p.python.includes('from codynick import ai,'));
let clicked=true,commands=[],outputs={},runtime;
ctx.CodyAI={command:async(a,args)=>{commands.push(a);return a==='count'?2:a==='found'?true:[]},stop(){}};global.window=ctx;
const store={dashboard(action,a){if(action==='dash_button_clicked'){const v=clicked;clicked=false;return v;}if(action==='dash_info_set'||action==='dash_led_set')outputs[a.NAME]=a.VALUE;}};
const hw={store,wait:async(ms,signal)=>{signal?.throwIfAborted();if(outputs.People===2&&outputs['Person detected']===true)runtime.stop();}};
runtime=new ctx.BlockRuntime(hw,ctx.HARDWARE_SPECS);await assert.rejects(()=>runtime.run(ws),/Stopped/);assert.deepEqual(commands,['prepare','start_camera','take_picture','detect_objects','count','found']);assert.equal(outputs.People,2);assert.equal(outputs['Person detected'],true);
const restored=await codec.decode(await codec.encode(p));assert.deepEqual(restored,p);
console.log('PASS: actual paired example archive, all Blockly definitions, interpreter camera/detection/dashboard flow and complete-project ZIP roundtrip');
})().catch(e=>{console.error(e);process.exitCode=1});
