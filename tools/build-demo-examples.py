"""Build paired Demo projects without changing the existing zone examples."""
from pathlib import Path
import importlib.util,json,zipfile,hashlib,copy

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('zone_builder',Path(__file__).with_name('build-zone-examples.py'))
B=importlib.util.module_from_spec(spec);spec.loader.exec_module(B)

def graph(p,name):
    p.widget(name,'graph');p.widgets[name]['limit']=200
    p.setup[-1].lines=[f'dashboard.graph({name!r}, history=200)']
    p.setup[-1].nodes.append(B.block('dash_history',{'NAME':name,'COUNT':200}))

def squares(target,color):
    colors=dict(blue='#0000FF',green='#00FF00',yellow='#FFFF00',red='#FF0000')
    return B.sequence(*(B.stmt(f'await {target}.led.set_color({color!r}, index={i})',B.block('cn_rgb_matrix_set',{'TARGET':target.upper(),'led':i,'color':colors[color]})) for i in [12,13,14,15]))

def temperature_colors(target,value):
    return B.condition(B.op(value,'<',18),squares(target,'blue'),B.condition(B.op(value,'<',25),squares(target,'green'),B.condition(B.op(value,'<',30),squares(target,'yellow'),squares(target,'red'))))

def repack(path,change):
    with zipfile.ZipFile(path) as z:infos=z.infolist();payload={i.filename:z.read(i.filename) for i in infos}
    change(payload)
    m=json.loads(payload['manifest.json']);m['applicationVersion']=B.VERSION
    m['files']={name:hashlib.sha256(payload[name]).hexdigest() for name in m['files']}
    payload['manifest.json']=B.json_bytes(m)
    with zipfile.ZipFile(path,'w') as z:
        for info in infos:z.writestr(info,payload[info.filename])

def main():
    catalog_path=ROOT/'blocks/python-examples.json';catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
    real,sim,moisture=B.var('real_temperature'),B.var('simulated_temperature'),B.var('moisture')
    p=B.Project(0,'HW + Sim + Dash','Temperature sensor: HW and SIM',
        'The real temperature is shown on the simulated seven-segment; the simulated temperature is shown on the real standalone seven-segment. '
        'On each CJP, the four internal square LEDs (12–15) show its own temperature: blue below 18 C, green from 18 to below 25 C, yellow from 25 to below 30 C, red at 30 C and above. '
        'Warm the real sensor or change simulated temperature independently. Dashboard gauges show both readings and two history graphs log the latest 200 samples each.',
        required='CJP, real temperature sensor and standalone seven-segment display',simulation=['temperature','seven'])
    p.id='demo-temperature-hw-sim';p.title='Temperature sensor: HW and SIM'
    p.widget('HW temperature','gauge',minimum=-20,maximum=80);p.widget('SIM temperature','gauge',minimum=-20,maximum=80)
    graph(p,'HW temperature log');graph(p,'SIM temperature log')
    p.setup.extend([B.led('hardware','off'),B.led('simulation','off')])
    p.loop=[B.assign('real_temperature',B.sensor('hardware','temperature')),B.assign('simulated_temperature',B.sensor('simulation','temperature')),
            B.display('simulation',real),B.display('hardware',sim),temperature_colors('hardware',real),temperature_colors('simulation',sim),
            B.output('HW temperature',real,'gauge'),B.output('SIM temperature',sim,'gauge'),B.output('HW temperature log',real,'graph'),B.output('SIM temperature log',sim,'graph'),B.wait(.25)]
    catalog[p.id]={**p.write(),'demo':True,'demoOrder':1}

    p=B.Project(0,'HW + Sim + Dash','Soil Moisture: SIM to HW',
        'No real soil sensor is used. Insert both simulated probe tips into the soil pot and drag the watering can over it to change moisture. '
        'The real and simulated standalone seven-segment displays both show simulated moisture (%). Below 25%, the real CJP plays a short low C3 beep (about 131 Hz, 150 ms) each loop. At 25% and above there are no new beeps. '
        'Dashboard shows moisture and logs the latest 200 samples in a history graph.',
        required='CJP and standalone seven-segment display; no real soil sensor',simulation=['soil','seven'])
    p.id='demo-soil-sim-hw';p.title='Soil Moisture: SIM to HW'
    p.widget('Moisture (%)','gauge',minimum=0,maximum=100);graph(p,'Moisture log')
    beep=B.stmt("await hardware.sound.play('C3', duration_ms=150)",B.block('cn_sound_play_until_done',{'TARGET':'HARDWARE','note':'C3','duration_ms':150}))
    p.loop=[B.assign('moisture',B.sensor('simulation','soil')),B.display('hardware',moisture),B.display('simulation',moisture),
            B.output('Moisture (%)',moisture,'gauge'),B.output('Moisture log',moisture,'graph'),B.condition(B.op(moisture,'<',25),beep),B.wait(.5)]
    catalog[p.id]={**p.write(),'demo':True,'demoOrder':2}
    # Reuse the tested pot/probe/can scene while keeping the new program/dashboard.
    with zipfile.ZipFile(ROOT/'blocks/examples/sensor-test-soil-moisture.codynick') as z:
        source_live=json.loads(z.read('state/live.json'));source_view=z.read('state/simulator-view.json')
    def soil_scene(payload):
        live=json.loads(payload['state/live.json']);live['scene']=copy.deepcopy(source_live['scene'])
        payload['state/live.json']=B.json_bytes(live);payload['state/simulator-view.json']=source_view
    repack(ROOT/'blocks'/catalog[p.id]['archive'],soil_scene)

    # The published joystick project already supplies both matching programs.
    e=catalog['stage-joystick'];e['title']='Move Sprite with HW Joystick';e['demo']=True;e['demoOrder']=3
    def rename(payload):
        editor=json.loads(payload['state/editor.json']);editor['names']={'blocks':e['title'],'python':e['title']};payload['state/editor.json']=B.json_bytes(editor)
    repack(ROOT/'blocks'/e['archive'],rename)
    catalog_path.write_bytes(B.json_bytes(catalog))
    print('Demo category: two new paired projects and one reused joystick project')

if __name__=='__main__':main()
