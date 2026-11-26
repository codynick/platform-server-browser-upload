from pathlib import Path
import importlib.util,json,copy,zipfile
r=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('B',r/'tools/build-zone-examples.py');B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)
B.ROOT=r;B.VERSION=(r/'VERSION').read_text().strip()
V=B.var;op=B.op;val=B.val;assign=B.assign;seq=B.sequence;cond=B.condition
T='simulation'
def wait(x):
 e=val(x);return B.stmt('await wait('+e.py+')',B.block('cn_wait',SECONDS=e.node))
def repeat(n,body):
 e=val(n);return B.Statement(['for _ in range(int('+e.py+')):']+['    '+x for x in body.lines],[B.block('controls_repeat_ext',TIMES=e.node,DO=B.chain(body.nodes))])
def until(test,body):
 e=val(test);return B.Statement(['while not ('+e.py+'):']+['    '+x for x in body.lines],[B.block('controls_whileUntil',{'MODE':'UNTIL'},BOOL=e.node,DO=B.chain(body.nodes))])
def floor(x):
 e=val(x);return B.Expr('math.floor('+e.py+')',B.block('math_round',{'OP':'ROUNDDOWN'},NUM=e.node))
def power(a,b):
 a,b=val(a),val(b);return B.Expr('('+a.py+' ** '+b.py+')',B.block('math_arithmetic',{'OP':'POWER'},A=a.node,B=b.node))
def random4():return B.Expr('random.randint(0, 3)',B.block('math_random_int',FROM=val(0).node,TO=val(3).node))
def joy(d):return B.Expr('await '+T+'.joystick.pressed('+repr(d)+')',B.block('cn_joystick_position',{'TARGET':T.upper(),'device':"'CJP'",'pos':repr(d)}))
def click():return B.Expr('await '+T+'.joystick.clicked()',B.block('cn_joystick_click',{'TARGET':T.upper(),'device':"'CJP'"}))
def any_direction():return op(op(joy('up'),'or',joy('right')),'or',op(joy('down'),'or',joy('left')))
def clear():return B.led(T,'off')
def pixel(x,y,color):
 x,y=val(x),val(y)
 return B.stmt('await '+T+"._rgb_xy("+x.py+', '+y.py+', '+repr(color)+')',B.block('cn_rgb_matrix_set_xy',{'TARGET':T.upper(),'color':color},x=x.node,y=y.node))
def index(i,color):
 e=val(i)
 if color=='#000000':return B.stmt('await '+T+'.led.set_color("#000000", index='+e.py+')',B.block('cn_rgb_led_percent',{'TARGET':T.upper()},led=e.node,red=val(0).node,green=val(0).node,blue=val(0).node))
 return B.stmt('await '+T+'.led.set_color('+repr(color)+', index='+e.py+')',B.block('cn_rgb_matrix_set',{'TARGET':T.upper(),'color':color},led=e.node))
def fill(color):return seq(assign('led_number',0),repeat(16,seq(index(V('led_number'),color),assign('led_number',op(V('led_number'),'+',1)))))
def palette():
 colors=['#FF0000','#FFFF00','#0000FF','#00FF00'];coords=[(1,0),(3,1),(1,3),(0,1)]
 return seq(clear(),*(cond(op(V('step'),'==',i),pixel(x,y,colors[i])) for i,(x,y) in enumerate(coords)))
def released():return until(op(any_direction(),'==',False),wait(.02))
def log(text):return B.stmt('print('+repr(text)+')',B.block('text_print',TEXT=val(text).node))
def mood(colors):
 return seq(assign('led_number',0),repeat(16,seq(index(V('led_number'),colors[0]),assign('led_number',op(V('led_number'),'+',1)))),*(pixel(x,y,colors[1]) for x,y in [(1,1),(2,1),(1,2),(2,2)]),wait(V('mood_seconds')))
def digit():
 q=floor(op(V('sequence_code'),'/',power(4,op(op(V('length'),'-',1),'-',V('position')))))
 return op(q,'-',op(floor(op(q,'/',4)),'*',4))
def make(kind):
 descriptions={
 'joy-pixel-walker':'Move the joystick to move one cyan pixel on the 4x4 RGB panel. Hold a direction to repeat; edges clamp at 0 and 3. Up moves toward the top of the panel. Change move_seconds or the pixel color to experiment.',
 'mood-light-composer':'Watch three moods rotate: calm blue/cyan, happy yellow/green and alert red/white. Each mood lasts mood_seconds (default 2). Change the timing and colors to compose your own.',
 'speed-switch':'Move the pixel with the joystick. Click once to toggle slow (0.30 seconds per step, blue) and fast (0.08 seconds per step, green). Holding the click does not toggle repeatedly. Edges clamp at the panel boundary.',
 'countdown-signal':'Sixteen green LEDs turn off one by one at step_seconds (default 0.25). The remaining LEDs change to yellow with 8 left and red with 4 left. The panel flashes white at zero, then resets automatically.',
 'pattern-memory':'Click the joystick to start. Watch the pattern, then repeat it: Up=top red, Right=right yellow, Down=bottom blue, Left=left green. Release between moves. A new random step is added after every correct round, up to 6. Ten seconds are allowed for each answer. Green means a correct round; red means wrong/timeout; white means six rounds completed. Release and click to play again. The sequence is encoded as base-4 digits in sequence_code; position selects a digit, preserving all earlier steps without list blocks.'}
 titles={'joy-pixel-walker':'Joy Pixel Walker','mood-light-composer':'Mood Light Composer','speed-switch':'Speed Switch','countdown-signal':'Countdown Signal','pattern-memory':'Pattern Memory'}
 suffix='Simulation' if T=='simulation' else 'Hardware'
 extra=' In Simulation, use the CJP arrow buttons and center click button.' if T=='simulation' else ' Keep this browser open with the CJP connected; this runs through the gateway firmware, not an uploaded standalone program.'
 p=B.Project(0,'Sim' if T=='simulation' else 'HW',titles[kind],descriptions[kind]+extra,required='' if T=='simulation' else 'CJP with gateway firmware')
 p.id='demo-'+kind+('-sim' if T=='simulation' else '-hw');p.title=titles[kind]+' ('+suffix+')'
 p.setup=[clear()]
 if kind in ['joy-pixel-walker','speed-switch']:
  p.setup += [assign('x',1),assign('y',1),assign('move_seconds',.18 if kind=='joy-pixel-walker' else .30)]
  if kind=='speed-switch':p.setup += [assign('fast',False),assign('click_was_down',False)]
  p.loop=[]
  if kind=='speed-switch':
   p.loop += [assign('click_now',click()),cond(op(V('click_now'),'and',op(V('click_was_down'),'==',False)),cond(V('fast'),seq(assign('fast',False),assign('move_seconds',.30)),seq(assign('fast',True),assign('move_seconds',.08)))),assign('click_was_down',V('click_now'))]
  # Mutually exclusive direction priority avoids diagonal double-steps.
  move=cond(op(V('x'),'>',0),assign('x',op(V('x'),'-',1)))
  move=cond(joy('left'),move)
  move=cond(joy('down'),cond(op(V('y'),'<',3),assign('y',op(V('y'),'+',1))),move)
  move=cond(joy('right'),cond(op(V('x'),'<',3),assign('x',op(V('x'),'+',1))),move)
  move=cond(joy('up'),cond(op(V('y'),'>',0),assign('y',op(V('y'),'-',1))),move)
  p.loop += [move,clear()]
  p.loop += [cond(V('fast'),pixel(V('x'),V('y'),'#00FF00'),pixel(V('x'),V('y'),'#0000FF')) if kind=='speed-switch' else pixel(V('x'),V('y'),'#00FFFF'),wait(V('move_seconds'))]
 elif kind=='mood-light-composer':
  p.setup += [assign('mood_seconds',2)]
  p.loop=[mood(['#0000FF','#00FFFF']),mood(['#FFFF00','#00FF00']),mood(['#FF0000','#FFFFFF'])]
 elif kind=='countdown-signal':
  p.setup += [assign('step_seconds',.25)]
  recolor=lambda c:seq(assign('led_number',0),repeat(V('remaining'),seq(index(V('led_number'),c),assign('led_number',op(V('led_number'),'+',1)))))
  p.loop=[fill('#00FF00'),assign('remaining',16),repeat(16,seq(wait(V('step_seconds')),assign('remaining',op(V('remaining'),'-',1)),index(V('remaining'),'#000000'),cond(op(V('remaining'),'==',8),recolor('#FFFF00')),cond(op(V('remaining'),'==',4),recolor('#FF0000')))),wait(.3),fill('#FFFFFF'),wait(.25),clear(),wait(.75)]
 else:
  p.setup += [assign('sequence_code',0),assign('length',0),assign('playing',False),log('Pattern Memory: click the joystick to start.')]
  ready=seq(until(click(),wait(.02)),until(op(click(),'==',False),wait(.02)),released(),assign('sequence_code',0),assign('length',0),assign('playing',True),clear(),wait(.5))
  playback=seq(assign('step',digit()),palette(),wait(.45),clear(),wait(.25),assign('position',op(V('position'),'+',1)))
  read_answer=seq(assign('answer',-1),B.stmt('answer_started = time.monotonic()',B.block('cn_timer_reset')),until(op(op(V('answer'),'>=',0),'or',op(B.Expr('(time.monotonic() - answer_started)',B.block('cn_timer_value')),'>=',10)),seq(cond(joy('up'),assign('answer',0),cond(joy('right'),assign('answer',1),cond(joy('down'),assign('answer',2),cond(joy('left'),assign('answer',3))))),wait(.02))),cond(op(V('answer'),'==',V('expected')),seq(assign('step',V('answer')),palette(),wait(.15),clear(),released()),assign('correct',False)))
  check=seq(cond(V('correct'),seq(assign('expected',digit()),read_answer)),assign('position',op(V('position'),'+',1)))
  success=seq(fill('#00FF00'),wait(.5),clear(),cond(op(V('length'),'>=',6),seq(fill('#FFFFFF'),wait(1),clear(),assign('playing',False),log('Six rounds complete! Click to play again.'))),wait(.5))
  failure=seq(fill('#FF0000'),wait(1),clear(),assign('playing',False),log('Wrong move or timeout. Click to try again.'))
  p.loop=[cond(op(V('playing'),'==',False),ready),assign('sequence_code',op(op(V('sequence_code'),'*',4),'+',random4())),assign('length',op(V('length'),'+',1)),assign('position',0),repeat(V('length'),playback),released(),assign('position',0),assign('correct',True),repeat(V('length'),check),cond(V('correct'),success,failure)]
 return p

def main():
 path=B.ROOT/'blocks/python-examples.json';catalog=json.loads(path.read_text(encoding='utf-8'))
 global T
 for i,kind in enumerate(['joy-pixel-walker','mood-light-composer','speed-switch','countdown-signal','pattern-memory']):
  for j,T in enumerate(['simulation','hardware']):
   p=make(kind);entry=p.write();entry['simulation']=['cjp'] if T=='simulation' else [];catalog[p.id]={**entry,'demo':True,'demoOrder':4+i*2+j,'category':'General'}
   file=B.ROOT/'blocks'/entry['archive']
   with zipfile.ZipFile(file) as z:payload={n:z.read(n) for n in z.namelist()}
   source=payload['programs/main.py'].decode().replace('from codynick import','import math\nimport random\nimport time\nfrom codynick import',1)
   # Keep all gadget calls on the public browser Python API.
   source=source.replace('await '+T+'._rgb_xy(',"await rgb_xy(")
   if 'await rgb_xy(' in source:
    helper="\nasync def rgb_xy(x, y, color):\n    rows = [[0, 1, 2, 3], [7, 6, 5, 4], [8, 9, 10, 11], [15, 14, 13, 12]]\n    await "+T+".led.set_color(color, index=rows[int(y)][int(x)])\n\n"
    at=source.index('\n\n',source.index('from codynick import'));source=source[:at]+helper+source[at:]
   compile(source,p.id,'exec',flags=__import__('ast').PyCF_ALLOW_TOP_LEVEL_AWAIT);payload['programs/main.py']=source.encode()
   view={'camera':{'scale':1,'x':20,'y':20},'selected':'cjp'};payload['state/simulator-view.json']=B.json_bytes(view)
   manifest=json.loads(payload['manifest.json']);manifest['files']={n:__import__('hashlib').sha256(payload[n]).hexdigest() for n in manifest['files']};payload['manifest.json']=B.json_bytes(manifest)
   with zipfile.ZipFile(file,'w',zipfile.ZIP_DEFLATED) as z:
    for n,data in payload.items():z.writestr(n,data)
 path.write_bytes(B.json_bytes(catalog));print('Built 10 Demo entries (five paired projects)')
if __name__=='__main__':main()
