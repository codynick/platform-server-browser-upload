from pathlib import Path
import sys,types,importlib.util,json,ast,time
r=Path(__file__).resolve().parents[1];repo=r;projects={}
import zipfile
for key,e in json.loads((r/'blocks/python-examples.json').read_text(encoding='utf-8')).items():
 if key.startswith(('demo-joy-pixel','demo-mood-light','demo-speed-switch','demo-countdown-signal','demo-pattern-memory')):
  with zipfile.ZipFile(r/'blocks'/e['archive']) as z:projects[key]={'python':z.read('programs/main.py').decode()}
class Done(Exception):pass
def run(id,cycles=1,direction=None,click=False,mode='correct'):
 g={};clock=0;count=0;clicks=0;calls=[];steps=0
 async def cycle():
  nonlocal count
  count+=1
  if count>=cycles:raise Done()
 async def request(op,payload):
  nonlocal clock,clicks,steps
  steps+=1
  if steps>100000:raise AssertionError('Runaway '+id)
  a=json.loads(payload)
  if op=='wait':clock+=a['seconds'];return 'null'
  assert op=='gadget';kind=a['block'];args=a['args'];assert a['target']==('SIMULATION' if id.endswith('sim') else 'HARDWARE');calls.append((kind,args))
  if kind=='cn_joystick_click':
   clicks+=1;return json.dumps((clicks%2==1) if 'pattern-memory' in id else click)
  if kind=='cn_joystick_position':
   d=direction
   if 'pattern-memory' in id:
    expected=g.get('expected',-1);expected=(expected+1)%4 if mode=='wrong' else expected
    d=['up','right','down','left'][expected] if g.get('answer')==-1 and expected>=0 and mode!='timeout' else None
   return json.dumps(args['pos']==d)
  if kind=='cn_rgb_matrix_set':assert isinstance(args['led'],(int,float)) and args['led']==int(args['led']) and 0<=args['led']<16
  else:assert kind=='cn_rgb_matrix_clear',kind
  return 'null'
 bridge=types.ModuleType('_codynick_bridge');bridge.request=request;bridge.notify=lambda *a:None;sys.modules['_codynick_bridge']=bridge
 spec=importlib.util.spec_from_file_location('codynick',repo/'blocks/codynick.py');api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api);sys.modules['codynick']=api
 tree=ast.parse(projects[id]['python'])
 loop=next(n for n in tree.body if isinstance(n,ast.While));loop.body.append(ast.Expr(value=ast.Await(value=ast.Call(func=ast.Name(id='_cycle',ctx=ast.Load()),args=[],keywords=[]))));ast.fix_missing_locations(tree)
 g['_cycle']=cycle;original=time.monotonic;time.monotonic=lambda:clock
 program=eval(compile(tree,id,'exec',flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT),g)
 try:program.send(None)
 except Done:pass
 finally:program.close();time.monotonic=original
 return g,calls,clock
for suffix in ['sim','hw']:
 for d,x,y in [('up',1,0),('right',3,1),('down',1,3),('left',0,1)]:
  g,_,_=run('demo-joy-pixel-walker-'+suffix,12,direction=d);assert (g['x'],g['y'])==(x,y)
 g,_,_=run('demo-speed-switch-'+suffix,5,direction='right',click=True);assert g['fast'] is True and g['move_seconds']==.08
 g,calls,clock=run('demo-mood-light-composer-'+suffix);assert clock>=6
 for color in ['#0000FF','#FFFF00','#FF0000']:assert any(a.get('color')==color for _,a in calls)
 g,calls,_=run('demo-countdown-signal-'+suffix);assert [a['led'] for _,a in calls if a.get('color')=='#000000']==list(range(15,-1,-1))
 for mode in ['correct','wrong','timeout']:
  g,calls,clock=run('demo-pattern-memory-'+suffix,6 if mode=='correct' else 1,mode=mode);assert g['playing'] is False and g['length']==(6 if mode=='correct' else 1)
  if mode=='timeout':assert clock>=10
 print('PASS: Python',suffix,'boundaries, speed switch, moods, countdown, memory win/wrong/timeout')
