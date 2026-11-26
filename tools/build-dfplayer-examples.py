from pathlib import Path
import importlib.util,json,zipfile,hashlib,copy
r=Path(__file__).resolve().parents[1];q=r;repo=r
spec=importlib.util.spec_from_file_location('B',repo/'tools/build-zone-examples.py');B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B);B.ROOT=q;B.VERSION=(r/'VERSION').read_text().strip()
T='simulation';V=B.var;op=B.op;seq=B.sequence;cond=B.condition
def df(kind,wait=False,**args):
 inputs={};fields={'TARGET':T.upper()};pyargs=[]
 for name,value in args.items():
  if name in ['value','volume','folder','track','timeout']:
   e=B.val(value);inputs[name]=e.node;pyargs.append(name+'='+e.py)
  else:fields[name]=value;pyargs.append(name+'='+repr(value))
 method={'whole':'say_whole_number','persian':'say_persian','phrase':'say_phrase','number':'say_number','emotion':'play_emotion','volume':'set_volume','control':'control','track':'play_track','wait':'wait_until_done'}[kind]
 pyargs=[a.replace('mode=\'standard\'','large=False').replace('mode=\'large\'','large=True') for a in pyargs]
 if wait:pyargs.append('wait=True')
 return B.stmt('await '+T+'.dfplayer.'+method+'('+', '.join(pyargs)+')',B.block('cn_df_'+kind+('_wait' if wait else ''),fields,**inputs))
def joy(direction):return B.Expr('await '+T+'.joystick.pressed('+repr(direction)+')',B.block('cn_joystick_position',{'TARGET':T.upper(),'device':"'CJP'",'pos':repr(direction)}))
def click():return B.Expr('await '+T+'.joystick.clicked()',B.block('cn_joystick_click',{'TARGET':T.upper(),'device':"'CJP'"}))
def air(kind):return B.Expr('await '+T+'.air.'+kind+'.read()',B.block('cn_air_'+kind,{'TARGET':T.upper()}))
catalog_path=q/'blocks/python-examples.json';catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
titles=['Sound Player Basics','Talking Joystick','Talking Weather Station','Thirsty Plant']
ids=['basics','joystick','weather','plant']
descriptions=[
 'Listen to Welcome, then a short Happy effect. The program lowers volume, pauses/resumes the effect, stops it, and says Hello. Use Stop at any time. The demonstration runs once; its main loop then waits silently.',
 'Move the joystick or press its center: the speaker announces Up, Down, Left, Right or Click in English. Release between choices; wait for the current phrase to finish. Held directions are announced only once.',
 'The speaker announces air temperature and humidity in English, including the measured numbers. In Simulation add a mist spray or heater, or set manual Air Temp/Hum values. Readings repeat after a three-second pause.',
 'Below 25% soil moisture the plant says I am thirsty; after sufficient watering it says I am quenched. Only changes between dry/wet trigger speech. Red/green LED 0 reflects dry/wet. In Simulation put both probe tips in soil and overlap the watering can with the pot.'
]
for i,(kind,title,description) in enumerate(zip(ids,titles,descriptions)):
 for j,T in enumerate(['simulation','hardware']):
  hardware=T=='hardware';sim=['dfplayer']+(['air'] if kind=='weather' else ['soil'] if kind=='plant' else []) if not hardware else []
  required='CJP and Sound Player'+(' and Air Temp/Hum sensor' if kind=='weather' else ' and soil moisture sensor' if kind=='plant' else '') if hardware else ''
  p=B.Project(0,'HW' if hardware else 'Sim',title,description+' The Sound Player uses prerecorded SD-card audio; Hafez is excluded.',required=required,simulation=sim)
  p.id='demo-dfplayer-'+kind+('-hw' if hardware else '-sim');p.title=title+(' (Hardware)' if hardware else ' (Simulation)');p.setup=[df('volume',volume=50),df('control',action='repeat_track_off'),df('control',action='repeat_all_off')]
  if kind=='basics':
   p.setup += [df('phrase',True,phrase='Welcome',language='English'),df('volume',volume=25),df('emotion',emotion='Happy'),B.wait(1.2),df('control',action='pause'),B.wait(.5),df('control',action='resume'),B.wait(1.2),df('control',action='stop'),df('volume',volume=40),df('phrase',True,phrase='Hello',language='English')];p.loop=[B.wait(1)]
  elif kind=='joystick':
   p.setup += [B.assign('last_direction',0)];p.loop=[B.assign('direction',0),*[cond(joy(d),B.assign('direction',n)) for n,d in enumerate(['up','down','left','right'],1)],cond(click(),B.assign('direction',5)),cond(op(op(V('direction'),'>',0),'and',op(V('direction'),'==',V('last_direction'))),B.wait(.01))]
   # Announce only on transitions to a non-neutral input.
   different=B.Expr('(direction != last_direction)',B.block('logic_compare',{'OP':'NEQ'},A=V('direction').node,B=V('last_direction').node))
   p.loop += [cond(op(op(V('direction'),'>',0),'and',different),seq(*(cond(op(V('direction'),'==',n),df('phrase',True,phrase=phrase,language='English')) for n,phrase in enumerate(['Up','Down','Left','Right','Click'],1)))),B.assign('last_direction',V('direction')),B.wait(.05)]
  elif kind=='weather':
   p.loop=[B.assign('temperature',air('temperature')),B.assign('humidity',air('humidity')),df('phrase',True,phrase='Temperature',language='English'),df('number',True,value=V('temperature'),language='English'),df('phrase',True,phrase='Humidity',language='English'),df('number',True,value=V('humidity'),language='English'),B.wait(3)]
  else:
   p.setup += [B.assign('last_dry',-1)]
   different=B.Expr('(dry != last_dry)',B.block('logic_compare',{'OP':'NEQ'},A=V('dry').node,B=V('last_dry').node))
   p.loop=[B.assign('moisture',B.sensor(T,'soil')),cond(op(V('moisture'),'<',25),seq(B.assign('dry',1),B.led(T,'red')),seq(B.assign('dry',0),B.led(T,'green'))),cond(different,cond(op(V('dry'),'==',1),df('phrase',True,phrase="I'm thirsty",language='English'),df('phrase',True,phrase='I am quenched',language='English'))),B.assign('last_dry',V('dry')),B.wait(.2)]
  entry=p.write();entry.update(demo=True,demoOrder=14+i*2+j,category='General');catalog[p.id]=entry
  archive=q/'blocks'/entry['archive']
  with zipfile.ZipFile(archive) as z:payload={n:z.read(n) for n in z.namelist()}
  live=json.loads(payload['state/live.json']);scene=live['scene'];scene['dfplayer']={'volume':50,'muted':False}
  if not hardware:
   scene['gadgets']['dfplayer']={'x':420,'y':40}
   if kind=='weather':scene.update(airTemperature=22,airHumidity=50);scene['gadgets']['air']={'x':800,'y':40}
   if kind=='plant':
    with zipfile.ZipFile(repo/'blocks/examples/sensor-test-soil-moisture.codynick') as z:scene=json.loads(z.read('state/live.json'))['scene']
    scene['gadgets']['dfplayer']={'x':1000,'y':40};scene['dfplayer']={'volume':50,'muted':False};live['scene']=scene
  payload['state/live.json']=B.json_bytes(live)
  editor=json.loads(payload['state/editor.json']);editor['space']='simulator';payload['state/editor.json']=B.json_bytes(editor)
  payload['state/simulator-view.json']=B.json_bytes({'camera':{'scale':.55,'x':10,'y':20},'selected':'dfplayer' if not hardware else 'cjp'})
  manifest=json.loads(payload['manifest.json']);manifest['files']={n:hashlib.sha256(payload[n]).hexdigest() for n in manifest['files']};payload['manifest.json']=B.json_bytes(manifest)
  with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
   for n,data in payload.items():z.writestr(n,data)
catalog_path.write_bytes(B.json_bytes(catalog));print('Built four paired Sound Player examples under Demo')
