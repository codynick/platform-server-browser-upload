from pathlib import Path
import ast,types,sys,asyncio,json,zipfile
r=Path(__file__).resolve().parents[1];calls=[]
async def request(op,payload):
 a=json.loads(payload);calls.append(a);return 'true' if a.get('block') in ['cn_df_busy','cn_df_wait'] else 'null'
sys.modules['_codynick_bridge']=types.SimpleNamespace(request=request,notify=lambda *a:None);sys.dont_write_bytecode=True;sys.path.insert(0,str(r/'blocks'));import codynick
async def check():
 for target in ['hardware','simulation']:
  p=getattr(codynick,target).dfplayer
  assert await p.is_busy() is True
  await p.set_volume(42);assert calls[-1]['args']['volume']==42
  await p.control('pause');assert calls[-1]['args']['action']=='pause'
  await p.say_phrase('Hello',language='German',wait=True);assert calls[-1]['block']=='cn_df_phrase_wait'
  await p.say_number(-1.2,language='English',wait=True,timeout=30);assert calls[-1]['args']['value']==-1.2 and calls[-1]['args']['timeout']==30
  await p.say_whole_number(21);assert calls[-1]['block']=='cn_df_whole'
  await p.say_persian('سلام');assert calls[-1]['block']=='cn_df_persian'
  await p.play_emotion('Happy');assert calls[-1]['block']=='cn_df_emotion'
  await p.play_track(1,300,large=True,wait=True);assert calls[-1]['args']['mode']=='large'
  assert calls[-1]['target']==target.upper()
  assert await p.wait_until_done(10) is True
asyncio.run(check())
js=(r/'blocks/python-preview.js').read_text(encoding='utf-8');marker="allBlocks.some(b=>b.type.startsWith('cn_df_')) ? ";helper_source=json.JSONDecoder().raw_decode(js[js.index(marker)+len(marker):].lstrip())[0];tree=ast.parse(helper_source);helper=next(x for x in tree.body if isinstance(x,ast.FunctionDef) and x.name=='__cn_df_call');ns={'time':__import__('time')};exec(compile(ast.Module(body=[helper],type_ignores=[]),'preview','exec'),ns)
class Serial:
 timeout=.7
 def __init__(self):self.sent=[];self.data=b'';self.polls=0;self.fail=False
 def reset_input_buffer(self):pass
 def flush(self):pass
 def write(self,packet):
  self.sent.append(packet);assert len(packet)==20
  if packet.startswith(b'CN@@DF@@B'):
   self.polls+=1;self.data=b'CN@@DF@@B'+(b'1' if self.polls%2 else b'0')+b'_'*10
  else:self.data=b'CN@@DF@@'+(b'ERR' if self.fail else b'OK');self.data=self.data.ljust(20,b'_')
 def read(self,n):data=self.data;self.data=b'';return data
serial=Serial();cody=types.SimpleNamespace(ensure_connected=lambda:True,ser=types.SimpleNamespace(ser=serial));call=ns['__cn_df_call']
call(cody,'cn_df_volume',{'volume':50});assert serial.sent[-1]==b'CN@@DF@@W1AF'.ljust(20,b'_')
call(cody,'cn_df_number',{'value':-1.2,'language':'English'});assert serial.sent[-1]==b'CN@@DF@@W50EFFFFFF88'
assert call(cody,'cn_df_phrase_wait',{'phrase':'Hello','language':'English'}) is True
call(cody,'cn_df_track',{'folder':1,'track':300,'mode':'large'});assert serial.sent[-1]==b'CN@@DF@@W3012C01'.ljust(20,b'_')
for block,args in [('cn_df_volume',{'volume':101}),('cn_df_whole',{'value':101}),('cn_df_number',{'value':float('nan')}),('cn_df_control',{'action':'bad'})]:
 try:call(cody,block,args)
 except (ValueError,RuntimeError):pass
 else:raise AssertionError('Expected rejection')
serial.fail=True
try:call(cody,'cn_df_volume',{'volume':50})
except RuntimeError:pass
else:raise AssertionError('Expected I2C failure')
assert serial.timeout==.7
for f in (r/'blocks/examples').glob('demo-dfplayer-*.codynick'):
 with zipfile.ZipFile(f) as z:compile(z.read('programs/main.py'),str(f),'exec',flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
print('PASS: public Python API both targets, executable preview framing/menus/waits/range/errors, restored serial timeout, eight example sources')
