'use strict';
(()=>{
 const specs=[
 ['conversation_talk','talk to local AI',[]],['conversation_stop','stop voice question and answer',[]],['conversation_active','voice question and answer is active?',[],'Boolean'],['conversation_question','your recognized question',[],'String'],['conversation_answer','spoken AI answer',[],'String'],['conversation_message','voice question and answer status',[],'String'],
 ['llm_prepare','prepare local language model',[]],
 ['llm_start','start answer for %1 limit %2 tokens',[{type:'input_value',name:'prompt'},{type:'field_number',name:'max_tokens',value:64,min:16,max:128,precision:1}]],
 ['llm_stop','stop and unload language model',[]],['llm_answer','current generated answer',[],'String'],['llm_running','language model is working?',[],'Boolean'],['llm_message','language model status',[],'String'],
 ['tts_speak','start speaking %1 speed %2',[{type:'input_value',name:'text'},{type:'input_value',name:'rate',check:'Number'}]],
 ['tts_available','local speech voice is available?',[],'Boolean'],['tts_stop','stop speaking',[]],['tts_is_speaking','speech output is active?',[],'Boolean'],['tts_message','speech output status',[],'String'],
 ['speech_start_transcription','start English speech to text',[]],
 ['speech_transcript','completed transcript',[],'String'],
 ['speech_partial','live speech preview',[],'String'],
 ['speech_clear_transcript','clear completed transcript',[]],
 ['speech_prepare','prepare English voice commands',[]],
 ['speech_start','start listening for commands %1',[{type:'field_input',name:'commands',text:'red, green, off'}]],
 ['speech_stop','stop listening',[]],
 ['speech_next','next voice command',[],'String'],
 ['speech_text','last completed speech',[],'String'],
 ['speech_listening','microphone is listening?',[],'Boolean'],
 ['prepare_ocr','prepare English OCR',[]],['ocr_sample','load sample text image',[]],
 ['read_text','read English text layout %1 word boxes %2 enhance %3',[{type:'field_dropdown',name:'layout',options:[['auto','auto'],['text block','block'],['single line','line']]},{type:'field_checkbox',name:'words',checked:false},{type:'field_checkbox',name:'enhance',checked:true}]],
 ['ocr_text','recognized text',[],'String'],['ocr_confidence','OCR confidence (%)',[],'Number'],['ocr_elapsed','OCR time (seconds)',[],'Number'],['ocr_has_image','image is ready?',[],'Boolean'],
 ['ocr_contains','recognized text contains %1',[{type:'field_input',name:'needle',text:'CODY'}],'Boolean'],['ocr_show_image','show OCR image on dashboard %1',[{type:'field_input',name:'name',text:'Source image'}]],
 ['workbench_setup','create image detection dashboard',[]],['workbench_sync','refresh image dashboard controls',[]],['workbench_action','image dashboard action %1',[{type:'field_dropdown',name:'action',options:[['start camera','start'],['capture named image','capture'],['detect selected image','detect'],['stop camera','stop']]}]],
 ['prepare','prepare object detector',[]],
 ['start_camera','start camera %1',[{type:'field_dropdown',name:'facing',options:[['default','default'],['front','front'],['rear','rear']]}]],
 ['take_picture','take picture',[]],['choose_image','choose image file (click Upload Image in AI panel)',[]],
 ['detect_objects','detect objects, minimum confidence %1 %',[{type:'field_number',name:'confidence',value:50,min:1,max:100,precision:1}]],
 ['count','number of detected %1',[{type:'field_dropdown',name:'label',options:window.CodyAIClasses.map(c=>[c,c])}],'Number'],
 ['found','was %1 detected?',[{type:'field_dropdown',name:'label',options:window.CodyAIClasses.map(c=>[c,c])}],'Boolean'],
 ['stop_camera','stop camera',[]]
 ];
 const api={types:specs.map(s=>'ai_'+s[0]),definitions(){Blockly.defineBlocksWithJsonArray(specs.map(([action,label,args,output])=>({type:'ai_'+action,message0:label,args0:args,colour:'#7055bd',tooltip:'Runs locally on the user CPU. Speech and images are not automatically saved in projects.',...(output?{output}:{previousStatement:null,nextStatement:null})})));},categories(){return [{kind:'category',name:'Voice Q&A',colour:'#7055bd',contents:api.types.filter(t=>t.startsWith('ai_conversation_')).map(type=>({kind:'block',type}))},{kind:'category',name:'Text Assistant (LLM)',colour:'#7055bd',contents:api.types.filter(t=>t.startsWith('ai_llm_')).map(type=>({kind:'block',type,...(type==='ai_llm_start'?{inputs:{prompt:{shadow:{type:'text',fields:{TEXT:'What does a temperature sensor measure?'}}}}}:{})}))},{kind:'category',name:'Text to Speech',colour:'#7055bd',contents:api.types.filter(t=>t.startsWith('ai_tts_')).map(type=>({kind:'block',type,...(type==='ai_tts_speak'?{inputs:{text:{shadow:{type:'text',fields:{TEXT:'Hello from CodyNick.'}}},rate:{shadow:{type:'math_number',fields:{NUM:1}}}}}:{})}))},{kind:'category',name:'Speech Recognition',colour:'#7055bd',contents:api.types.filter(t=>t.startsWith('ai_speech_')).map(type=>({kind:'block',type}))},{kind:'category',name:'Read Text (OCR)',colour:'#7055bd',contents:api.types.filter(t=>t==='ai_prepare_ocr'||t==='ai_read_text'||t.startsWith('ai_ocr_')).map(type=>({kind:'block',type}))},{kind:'category',name:'Image Workbench',colour:'#7055bd',contents:api.types.filter(t=>t.startsWith('ai_workbench')).map(type=>({kind:'block',type}))},{kind:'category',name:'Image Detection',colour:'#7055bd',contents:api.types.filter(t=>!t.startsWith('ai_conversation_')&&!t.startsWith('ai_llm_')&&!t.startsWith('ai_tts_')&&!t.startsWith('ai_speech_')&&!t.startsWith('ai_workbench')&&!t.startsWith('ai_ocr_')&&!['ai_prepare_ocr','ai_read_text'].includes(t)).map(type=>({kind:'block',type}))}];},async execute(b,r){const action=b.type.slice(3),s=specs.find(s=>s[0]===action),args={};for(const a of s[2])args[a.name]=a.type==='input_value'?await r.input(b,a.name,a.name==='rate'?1:''):b.getFieldValue(a.name);return window.CodyAI.command(action,args,r.signal);}};
 window.CodyAIBlocks=api;window.BlockRuntime.types.push(...api.types);
})();
