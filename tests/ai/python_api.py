import asyncio,importlib.util,json,pathlib,sys,types,unittest
SITE=pathlib.Path(sys.argv.pop(1) if len(sys.argv)>1 else 'build/testsite')
requests=[]
async def request(op,payload):
 a=json.loads(payload);requests.append((op,a))
 if a.get('action')=='conversation_active':return json.dumps(False)
 if a.get('action')=='conversation_question':return json.dumps('My question')
 if a.get('action')=='conversation_answer':return json.dumps('My answer')
 if a.get('action')=='conversation_message':return json.dumps('Finished')
 if a.get('action')=='conversation_status':return json.dumps(dict(active=False,phase='complete'))
 if a.get('action')=='llm_running':return json.dumps(False)
 if a.get('action')=='llm_answer':return json.dumps('A short answer.')
 if a.get('action')=='llm_message':return json.dumps('Answer complete.')
 if a.get('action')=='llm_status':return json.dumps(dict(phase='complete',answer='A short answer.'))
 if a.get('action')=='tts_message':return json.dumps('Speaking')
 if a.get('action')=='tts_voices':return json.dumps([dict(id='local-test',name='Local',lang='en')])
 if a.get('action')=='tts_status':return json.dumps(dict(phase='speaking'))
 if a.get('action')=='speech_transcript':return json.dumps('hello world')
 if a.get('action')=='speech_partial':return json.dumps('hello')
 if a.get('action')=='speech_next':return json.dumps('red')
 if a.get('action')=='speech_text':return json.dumps('red')
 if a.get('action')=='speech_status':return json.dumps(dict(listening=True,lastCommand='red'))
 if a.get('action')=='read_text':return json.dumps(dict(text='CODY NICK',confidence=95,recognitionMs=100,words=[]))
 return json.dumps([dict(label='person',confidence=.9,box=dict(xmin=0,ymin=0,xmax=1,ymax=1))] if a.get('action')=='detect_objects' else True)
sys.modules['_codynick_bridge']=types.SimpleNamespace(request=request,notify=lambda *a:None)
spec=importlib.util.spec_from_file_location('codynick',SITE/'blocks/codynick.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
async def test():
 ai=m.ai;await ai.start_voice_turn(max_tokens=32);assert requests[-1][1]['args']['max_tokens']==32;assert not await ai.voice_active();assert await ai.voice_question()=='My question';assert await ai.voice_answer()=='My answer';assert await ai.voice_message()=='Finished';assert (await ai.voice_status())['phase']=='complete';await ai.stop_voice_turn();await ai.prepare_llm();await ai.start_answer('Question',max_tokens=32);assert requests[-1][1]['args']['prompt']=='Question';assert not await ai.llm_running();assert await ai.llm_answer()=='A short answer.';assert await ai.llm_message()=='Answer complete.';assert await ai.generate('Question')=='A short answer.';await ai.stop_llm();assert await ai.tts_available();await ai.speak('hello',rate=1.2);assert requests[-1][1]['args']['text']=='hello';assert await ai.is_speaking();assert await ai.tts_message()=='Speaking';assert (await ai.tts_voices())[0]['id']=='local-test';assert (await ai.tts_status())['phase']=='speaking';await ai.stop_speaking();await ai.start_transcription(clear=True);assert requests[-1][1]['args']['clear'];assert await ai.transcription_text()=='hello world';assert await ai.speech_partial()=='hello';await ai.clear_transcript();await ai.prepare_speech();await ai.start_listening(['red','green']);assert requests[-1][1]['args']['commands']==['red','green'];assert await ai.next_command()=='red';assert await ai.speech_text()=='red';assert await ai.is_listening();assert (await ai.speech_status())['lastCommand']=='red';await ai.stop_listening();await ai.workbench_setup();await ai.workbench_sync();await ai.workbench_action('capture');await ai.prepare();await ai.start_camera();await ai.take_picture();await ai.detect_objects(50)
 assert ai.count('person')==1 and ai.found('person') and not ai.found('cat')
 await ai.prepare_ocr();assert await ai.read_text()=='CODY NICK';assert requests[-1][1]['args']['enhance'] is True;await ai.read_text(enhance=False);assert requests[-1][1]['args']['enhance'] is False;assert ai.ocr_contains('cody');assert ai.ocr_confidence()==95;assert ai.ocr_elapsed()==.1
 data=ai.ocr_results();data['text']='changed';assert ai.ocr_text()=='CODY NICK'
 await ai.show_ocr_image();assert await ai.has_image()
 r=ai.results();r[0]['label']='changed';assert ai.count('person')==1
 await ai.take_picture();assert ai.results()==[];assert ai.ocr_text()==''
 await ai.choose_image();await ai.stop_camera()
 assert all(op=='ai' for op,a in requests)
 print('PASS: Python AI operations, cache clearing, count/found and defensive result copies')
asyncio.run(test())
