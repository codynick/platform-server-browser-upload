"""Execute the published Python programs through the real CodyNick Python API.
The bridge is mocked; this does not validate physical hardware or browser Pyodide.
"""
from pathlib import Path
import ast,importlib.util,json,sys,types,unittest,zipfile
ROOT=Path(__file__).resolve().parents[1]
class Done(Exception):pass

class DemoTests(unittest.TestCase):
    def run_program(self,eid,real=22,sim=28,soil=50,keys=(),cycles=1):
        state=dict(calls=[],widgets={},sprite={'x':0,'y':0},cycles=0)
        async def request(op,payload):
            a=json.loads(payload)
            if op=='wait':
                state['cycles']+=1
                if state['cycles']>=cycles:raise Done()
                return 'null'
            if op=='gadget':
                state['calls'].append(a);kind=a['block'];args=a['args'];target=a['target']
                value=real if target=='HARDWARE' else sim
                if kind=='cn_temperature_read':return json.dumps(value)
                if kind=='cn_soil_read':return json.dumps(soil)
                if kind=='cn_joystick_states':return json.dumps(list(keys))
                if kind=='cn_joystick_position':return json.dumps(args['pos'] in keys)
                return 'null'
            if op=='sprite':
                action=a['action'];args=a['args'];sprite=state['sprite']
                if action=='configure':sprite.update({k:v for k,v in args.items() if v is not None})
                elif action in ['change_x','change_y']:sprite[action[-1]]+=args['amount']
                return 'null'
            raise AssertionError(op)
        def notify(op,payload):
            self.assertEqual(op,'dashboard');a=json.loads(payload);args=a['args'];name=args.get('name')
            if a['action']=='clear':state['widgets'].clear();return
            w=state['widgets'].setdefault(name,{'history':[]})
            if a['action']=='show':w['value']=args['value']
            elif a['action']=='append':w['history'].append(args['value'])
            elif a['action']=='graph':w['limit']=args['history']
        bridge=types.ModuleType('_codynick_bridge');bridge.request=request;bridge.notify=notify;sys.modules['_codynick_bridge']=bridge
        spec=importlib.util.spec_from_file_location('codynick',ROOT/'blocks/codynick.py');api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api);sys.modules['codynick']=api
        catalog=json.loads((ROOT/'blocks/python-examples.json').read_text(encoding='utf-8'))
        with zipfile.ZipFile(ROOT/'blocks'/catalog[eid]['archive']) as z:source=z.read('programs/main.py').decode()
        code=compile(source,eid,'exec',flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        # All bridge operations finish synchronously, so no OS event loop is needed.
        program=eval(code,{})
        try:program.send(None)
        except Done:pass
        finally:program.close()
        return state

    def test_temperature_thresholds_and_crossed_displays(self):
        values=[(17.9,'#0000FF'),(18,'#00FF00'),(24.9,'#00FF00'),(25,'#FFFF00'),(29.9,'#FFFF00'),(30,'#FF0000')]
        for real,real_color in values:
            sim=40 if real<25 else 10;sim_color='#FF0000' if sim==40 else '#0000FF'
            s=self.run_program('demo-temperature-hw-sim',real=real,sim=sim)
            for target,value,color in [('HARDWARE',sim,real_color),('SIMULATION',real,sim_color)]:
                displays=[c['args']['value'] for c in s['calls'] if c['target']==target and c['block'].startswith('cn_seven_segment')]
                self.assertEqual(displays,[value])
                leds=[c['args'] for c in s['calls'] if c['target']==target and c['block']=='cn_rgb_matrix_set']
                self.assertEqual({a['led'] for a in leds},{12,13,14,15});self.assertEqual({a['color'] for a in leds},{color})
            self.assertEqual(s['widgets']['HW temperature']['value'],real)
            self.assertEqual(s['widgets']['SIM temperature']['value'],sim)
            self.assertEqual(s['widgets']['HW temperature log']['history'],[real])
            self.assertEqual(s['widgets']['SIM temperature log']['history'],[sim])
            self.assertEqual(s['widgets']['HW temperature log']['limit'],200)

    def test_soil_displays_alarm_boundary_and_no_real_soil_read(self):
        for value in [0,24.9,25,60,100]:
            s=self.run_program('demo-soil-sim-hw',soil=value)
            self.assertFalse(any(c['target']=='HARDWARE' and c['block']=='cn_soil_read' for c in s['calls']))
            displays=[c for c in s['calls'] if c['block'].startswith('cn_seven_segment')]
            self.assertEqual({c['target'] for c in displays},{'HARDWARE','SIMULATION'})
            self.assertEqual({c['args']['value'] for c in displays},{value})
            sounds=[c for c in s['calls'] if c['block']=='cn_sound_play_until_done']
            self.assertEqual(len(sounds),int(value<25))
            if sounds:self.assertEqual(sounds[0]['args'],{'note':'C3','duration_ms':150})
            self.assertEqual(s['widgets']['Moisture (%)']['value'],value)
            self.assertEqual(s['widgets']['Moisture log']['history'],[value])

    def test_reused_joystick_moves_all_directions(self):
        for direction,axis,sign in [('right','x',1),('left','x',-1),('up','y',1),('down','y',-1)]:
            s=self.run_program('stage-joystick',keys=[direction],cycles=3)
            self.assertEqual(s['sprite'][axis],15*sign)

if __name__=='__main__':unittest.main(verbosity=2)
