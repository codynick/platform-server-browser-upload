"""Build paired Blocks/Python examples from one small shared program description.

Run from any directory. No external Python dependencies; no hardware is accessed.
"""
from pathlib import Path
import copy
import hashlib
import html
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '3.19.0'

def block(kind, fields=None, **inputs):
    return dict(type=kind, **({'fields': fields} if fields else {}),
                **({'inputs': {k: {'block': copy.deepcopy(v)} for k, v in inputs.items()}} if inputs else {}))

def chain(items):
    items = copy.deepcopy(items)
    for a, b in zip(items, items[1:]): a['next'] = {'block': b}
    return items[0] if items else None

class Expr:
    def __init__(self, py, node): self.py, self.node = py, node

def val(v):
    if isinstance(v, Expr): return v
    if isinstance(v, bool): return Expr(str(v), block('logic_boolean', {'BOOL': 'TRUE' if v else 'FALSE'}))
    if isinstance(v, (int, float)): return Expr(str(v), block('math_number', {'NUM': v}))
    return Expr(repr(v), block('text', {'TEXT': str(v)}))

def var(name): return Expr(name, block('variables_get', {'VAR': {'name': name}}))

def op(a, symbol, b):
    a, b = val(a), val(b)
    arithmetic = {'+': 'ADD', '-': 'MINUS', '*': 'MULTIPLY', '/': 'DIVIDE'}
    compares = {'>': 'GT', '<': 'LT', '>=': 'GTE', '<=': 'LTE', '==': 'EQ'}
    kind, code = ('math_arithmetic', arithmetic[symbol]) if symbol in arithmetic else ('logic_operation', symbol.upper()) if symbol in ['and', 'or'] else ('logic_compare', compares[symbol])
    return Expr(f'({a.py} {symbol} {b.py})', block(kind, {'OP': code}, A=a.node, B=b.node))

def absolute(a):
    a = val(a)
    return Expr(f'abs({a.py})', block('math_single', {'OP': 'ABS'}, NUM=a.node))

def sensor(target, kind):
    return Expr(f'await {target}.{kind}.read()', block('cn_' + {'temperature': 'temperature', 'soil': 'soil', 'ultrasonic': 'ultrasonic'}[kind] + '_read', {'TARGET': target.upper(), **({'device': "'STANDALONE'"} if kind == 'ultrasonic' else {})}))

def joystick(direction):
    return Expr(f'await hardware.joystick.pressed({direction!r})', block('cn_joystick_position', {'TARGET': 'HARDWARE', 'device': "'CJP'", 'pos': repr(direction)}))

def stage_read(action, key=None):
    return Expr(f'await stage.{action}({repr(key) if key else ""})', block('stage_' + action, {'key': key} if key else None))

def dash_read(name, kind='slider'):
    suffix, method = {'slider': ('slider_value', 'value'), 'toggle': ('toggle_value', 'value'), 'held': ('button_pressed', 'pressed'), 'tap': ('button_clicked', 'clicked')}[kind]
    return Expr(f'await dashboard.{method}({name!r})', block('dash_' + suffix, {'NAME': name}))

class Statement:
    def __init__(self, lines, nodes): self.lines, self.nodes = lines, nodes

def stmt(py, node): return Statement([py], [node])
def sequence(*items): return Statement([s for i in items for s in i.lines], [s for i in items for s in i.nodes])
def assign(name, expression):
    e = val(expression)
    return stmt(f'{name} = {e.py}', block('variables_set', {'VAR': {'name': name}}, VALUE=e.node))

def condition(test, yes, no=None):
    test = val(test)
    inputs = dict(IF0=test.node, DO0=chain(yes.nodes))
    lines = ['if ' + test.py + ':'] + ['    ' + s for s in yes.lines]
    if no:
        inputs['ELSE'] = chain(no.nodes)
        lines += ['else:'] + ['    ' + s for s in no.lines]
    node = block('controls_if', **inputs)
    if no: node['extraState'] = {'hasElse': True}
    return Statement(lines, [node])

def stage(action, **args):
    args = {k: val(v) for k, v in args.items()}
    fields = {'appearance': args.pop('appearance').node['fields']['TEXT']} if 'appearance' in args else None
    pyargs = ', '.join(f'{k}={v.py}' for k, v in args.items())
    if fields: pyargs = repr(fields['appearance'])
    return stmt(f'await stage.{"point_direction" if action == "point" else action}({pyargs})', block('stage_' + action, fields, **{k: v.node for k, v in args.items()}))

def led(target, color):
    if color == 'off':
        return stmt(f'await {target}.led.clear()', block('cn_rgb_matrix_clear', {'TARGET': target.upper()}))
    colors = dict(red='#FF0000', green='#00FF00', blue='#0000FF', off='#000000')
    return stmt(f'await {target}.led.set_color({color!r})', block('cn_rgb_matrix_set', {'TARGET': target.upper(), 'led': 0, 'color': colors[color]}))

def warning(target, test): return condition(test, led(target, 'red'), led(target, 'green'))

def display(target, expression):
    e = val(expression)
    return stmt(f'await {target}.seven_segment.show({e.py})', block('cn_seven_segment_display_value', {'TARGET': target.upper(), 'device': "'STANDALONE'"}, value=e.node))

def output(name, expression, kind='info'):
    e = val(expression)
    method = 'set_led' if kind == 'led' else 'append' if kind == 'graph' else 'show'
    return stmt(f'dashboard.{method}({name!r}, {e.py})', block('dash_' + ('append' if kind == 'graph' else kind + '_set'), {'NAME': name}, VALUE=e.node))

def wait(seconds): return stmt(f'await wait({seconds})', block('cn_wait', SECONDS=val(seconds).node))

class Project:
    def __init__(self, number, zones, title, description, required='', simulation=(), appearance='rocket'):
        self.id = f'zone-{number:02d}'
        self.title = f'{number}. {zones} - {title}'
        self.zones, self.description, self.required = zones, description, required
        self.simulation, self.appearance = list(simulation), appearance
        self.widgets, self.setup, self.loop = {}, [], []
        self.help = (f'Requires: {required}. ' if required else 'No CJP required. ') + description + ' Choose Blocks or Python, then Run. Press Stop to finish.'
        if required: self.help += ' Hardware outputs keep their last state after Stop.'

    def widget(self, name, kind, minimum=0, maximum=50, initial=None, step=1):
        if not self.widgets: self.setup.append(stmt('dashboard.clear()', block('dash_clear')))
        value = '[]' if kind == 'graph' else False if kind in ['button', 'switch', 'led'] else 0
        if initial is not None: value = initial
        self.widgets[name] = dict(id=name, type=kind, title=name, value=value, min_value=minimum, max_value=maximum, color='blue', font_name='Arial', font_size=32, horizontal_alignment='center', vertical_alignment='center', column_span=1, height_multiplier=1, history=[], limit=20, samples=0, description='Source: Program', valid=True)
        fields = dict(NAME=name, TITLE=name)
        method = 'toggle' if kind == 'switch' else kind
        args = ''
        if kind in ['switch', 'led']:
            fields['INITIAL'] = 'TRUE' if value else 'FALSE'
            args = f', initial={value}'
        if kind == 'slider':
            self.widgets[name]['step'] = step
            fields.update(MIN=minimum, MAX=maximum, STEP=step, INITIAL=value)
            args = f', minimum={minimum}, maximum={maximum}, step={step}, initial={value}'
        if kind == 'gauge': args = f', minimum={minimum}, maximum={maximum}'
        py = f'dashboard.{method}({name!r}{args})' if kind != 'info' else f'dashboard.show({name!r}, {value!r})'
        self.setup.append(stmt(py, block('dash_create_' + kind, fields)))
        if kind == 'gauge': self.setup.append(Statement([], [block('dash_range', {'NAME': name, 'MIN': minimum, 'MAX': maximum})]))
        return self

    def sprite(self):
        self.setup += [stage('go', x=0, y=0), stage('point', direction=90), stage('set_size', size=100), stage('set_appearance', appearance=self.appearance), stage('show')]

    def write(self):
        start, loop = sequence(*self.setup), sequence(*self.loop)
        roots = []
        if start.nodes: roots.append(block('cn_event_start', DO=chain(start.nodes)))
        roots.append(block('cn_event_loop', DO=chain(loop.nodes)))
        for i, root in enumerate(roots): root.update(x=30 + i * 600, y=30)
        ws = {'blocks': {'languageVersion': 0, 'blocks': roots}}
        py = '# ' + self.title + '\n# ' + self.help + '\nfrom codynick import hardware, simulation, dashboard, stage, wait\n\n' + '\n'.join(start.lines) + '\n\nwhile True:\n' + '\n'.join('    ' + line for line in loop.lines) + '\n'
        compile(py, self.id + '.py', 'exec', flags=__import__('ast').PyCF_ALLOW_TOP_LEVEL_AWAIT)
        scene = dict(gadgets={'cjp': {'x': 40, 'y': 40}}, temperature=21.1, distance=50, soil=50, wifi_link=True, cloud_link=True, motion=False, rfid='00000000', ultraDistance=50)
        for i, kind in enumerate(self.simulation): scene['gadgets'][kind] = {'x': 440 + i % 2 * 220, 'y': 100 + i // 2 * 200}
        live = dict(scene=scene, leds=['#000000'] * 16, matrix=dict(text='', speed=1, pixels=[0] * 64, mode='pixels', revision=0), seven_segment='', ultra_segment='', widgets=self.widgets)
        settings = dict(x=0, y=0, direction=90, size=100, backdrop='field' if self.appearance == 'cactus' else 'sky', appearance=self.appearance)
        sprite = dict(settings=settings, state={**settings, 'visible': True, 'speech': '', 'speechRemainingMs': None})
        editor = dict(names=dict(blocks=self.title, python=self.title), language='blocks', help=self.help, console='', cursorStart=0, cursorEnd=0, scrollTop=0, scrollLeft=0, space='dashboard' if self.widgets else 'sprites' if 'Sprite' in self.zones else 'simulator', collapsed=False)
        layout = {name: dict(x=i % 3 * 4, y=i // 3 * 2, w=4, h=2) for i, name in enumerate(self.widgets)}
        payload = {'programs/blocks.json': ws, 'programs/main.py': py, 'state/editor.json': editor, 'state/live.json': live, 'state/sprite.json': sprite, 'state/dashboard-layout.json': layout, 'state/simulator-view.json': dict(camera=dict(scale=.6, x=0, y=0), selected='cjp')}
        payload = {name: data.encode('utf-8') if isinstance(data, str) else json_bytes(data) for name, data in payload.items()}
        manifest = dict(format='codynick-project', version=1, applicationVersion=VERSION, files={name: hashlib.sha256(data).hexdigest() for name, data in payload.items()})
        archive = 'examples/' + self.id + '.codynick'
        with zipfile.ZipFile(ROOT / 'blocks' / archive, 'w', zipfile.ZIP_DEFLATED) as z:
            for name, data in payload.items(): z.writestr(name, data)
            z.writestr('manifest.json', json_bytes(manifest))
        return dict(title=self.title, help=self.help, simulation=self.simulation, stage='Sprite' in self.zones, dashboard=bool(self.widgets), archive=archive)

def json_bytes(value): return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')

def move_controls(source='keys', speed=5):
    return [condition(stage_read('key_pressed', d) if source == 'keys' else joystick(d), stage(axis, amount=op(speed, '*', sign))) for d, axis, sign in [('right', 'change_x', 1), ('left', 'change_x', -1), ('up', 'change_y', 1), ('down', 'change_y', -1)]]

def main():
    projects = []
    def new(*args, **kwargs):
        p = Project(*args, **kwargs); projects.append(p); return p
    temp, real, simulated, distance, edge, threshold = [var(n) for n in ['temperature', 'real_temperature', 'simulated_temperature', 'distance', 'edge', 'threshold']]
    p = new(1, 'HW', 'Real Sensor and Light', 'Try warming the real temperature sensor. Above 30 C, RGB LED 0 turns red; otherwise green.', 'CJP and temperature sensor')
    p.loop = [assign('temperature', sensor('hardware', 'temperature')), warning('hardware', op(temp, '>', 30)), wait(.2)]
    p = new(2, 'Sim', 'Simulated Sensor and Light', 'Open Simulation and change temperature across 30 C. Simulated RGB LED 0 turns red above 30 C and green otherwise.', simulation=['temperature'])
    p.loop = [assign('temperature', sensor('simulation', 'temperature')), warning('simulation', op(temp, '>', 30)), wait(.2)]
    p = new(3, 'Dash', 'Dashboard Control Desk', 'Open Dashboard. Hold or tap Hold; Held follows the press and Taps counts clicks. Power controls Enabled; Level controls Reading.')
    for name, kind, args in [('Hold','button',{}),('Power','switch',{}),('Level','slider',dict(maximum=100,initial=50,step=5)),('Held','led',{}),('Enabled','led',{}),('Reading','gauge',dict(maximum=100)),('Taps','info',dict(initial=0))]: p.widget(name,kind,**args)
    p.setup.append(assign('taps', 0))
    p.loop = [output('Held',dash_read('Hold','held'),'led'),output('Enabled',dash_read('Power','toggle'),'led'),output('Reading',dash_read('Level'),'gauge'),condition(dash_read('Hold','tap'),assign('taps',op(var('taps'),'+',1))),output('Taps',var('taps')),wait(.05)]
    p = new(4,'Sprite','Move the Bee','Open Sprites or Open Stage, then focus the stage. Arrows move and bounce the Bee; hold Space to hide it, release to show it. Press the stage to enlarge it.',appearance='bee')
    p.sprite();p.setup.append(stage('say',text='Arrows move; Space hides; press stage to enlarge'))
    p.loop = move_controls() + [stage('bounce'),condition(stage_read('key_pressed','space'),stage('hide'),stage('show')),condition(stage_read('mouse_down'),stage('set_size',size=140),stage('set_size',size=100)),wait(.05)]
    p = new(5,'HW + Sim','Real Meets Simulated','Open Simulation. Real temperature appears on the simulated seven-segment display. Change simulated distance: the real standalone display follows.', 'CJP, temperature sensor and standalone seven-segment display',simulation=['ultrasonic','seven'])
    p.loop = [assign('temperature',sensor('hardware','temperature')),assign('distance',sensor('simulation','ultrasonic')),display('simulation',temp),display('hardware',distance),wait(.3)]
    p = new(6,'HW + Dash','Hardware Control Desk','Open Dashboard. Temperature and History show the real sensor. Enable Light and adjust Level: RGB LED 0 turns red above the selected temperature threshold, green below it; disabling Light turns it off.','CJP and temperature sensor')
    p.widget('Temperature','gauge').widget('History','graph').widget('Light','switch',initial=True).widget('Level','slider',minimum=0,maximum=50,initial=30)
    p.loop = [assign('temperature',sensor('hardware','temperature')),output('Temperature',temp,'gauge'),output('History',temp,'graph'),condition(dash_read('Light','toggle'),warning('hardware',op(temp,'>',dash_read('Level'))),led('hardware','off')),wait(.3)]
    p = new(7,'HW + Sprite','Joystick Pilot','Move the real CJP joystick: the sprite follows. At the stage edge, real RGB LED 0 turns red; otherwise green.','CJP (built-in joystick)',appearance='bird')
    p.sprite();p.loop = move_controls('joystick') + [warning('hardware',stage_read('touching_edge')),wait(.05)]
    p = new(8,'Sim + Dash','Virtual Instrument Panel','Change temperature in Simulation: Dashboard follows. Toggle Light in Dashboard: simulated RGB LED 0 turns green when enabled, off when disabled.',simulation=['temperature'])
    p.widget('Temperature','gauge').widget('History','graph').widget('Light','switch')
    p.loop = [assign('temperature',sensor('simulation','temperature')),output('Temperature',temp,'gauge'),output('History',temp,'graph'),condition(dash_read('Light','toggle'),led('simulation','green'),led('simulation','off')),wait(.2)]
    p = new(9,'Sim + Sprite','Temperature Balloon','Change simulated temperature: Ball size and speech change (size clamps safely to 10-300%). Arrows move it. At the stage edge simulated RGB LED 0 turns red; otherwise green.',simulation=['temperature'],appearance='ball')
    p.sprite();p.loop = [assign('temperature',sensor('simulation','temperature')),stage('set_size',size=op(temp,'*',3)),stage('say',text=temp)] + move_controls() + [warning('simulation',stage_read('touching_edge')),wait(.05)]
    p = new(10,'Dash + Sprite','Sprite Control Desk','Open Dashboard and Open Stage side by side. Hold Move to advance and bounce the Bee; Visible hides/shows it; Size resizes it; Position reports x.',appearance='bee')
    p.widget('Move','button').widget('Visible','switch',initial=True).widget('Size','slider',minimum=20,maximum=200,step=5,initial=100).widget('Position','gauge',minimum=-240,maximum=240)
    p.sprite();p.loop = [condition(dash_read('Move','held'),stage('move',steps=5)),stage('bounce'),stage('set_size',size=dash_read('Size')),condition(dash_read('Visible','toggle'),stage('show'),stage('hide')),output('Position',stage_read('x'),'gauge'),wait(.05)]
    p = new(11,'HW + Sim + Dash','Compare Real and Simulated','Change simulated temperature and warm the real sensor. Compare gauges and histories. Threshold independently makes each matching real/simulated RGB LED 0 red above it and green otherwise.','CJP and temperature sensor',simulation=['temperature'])
    p.widget('Real temperature','gauge').widget('Simulated temperature','gauge').widget('Real history','graph').widget('Simulated history','graph').widget('Threshold','slider',minimum=0,maximum=50,initial=30)
    p.loop = [assign('real_temperature',sensor('hardware','temperature')),assign('simulated_temperature',sensor('simulation','temperature')),assign('threshold',dash_read('Threshold')),output('Real temperature',real,'gauge'),output('Simulated temperature',simulated,'gauge'),output('Real history',real,'graph'),output('Simulated history',simulated,'graph'),warning('hardware',op(real,'>',threshold)),warning('simulation',op(simulated,'>',threshold)),wait(.3)]
    p = new(12,'HW + Sim + Sprite','Two Worlds, One Sprite','Real temperature changes sprite size. Simulated distance maps 2-400 cm onto x=-200 to 200. Near either edge (abs(x)>=190), both RGB LEDs 0 turn red; otherwise green.','CJP and temperature sensor',simulation=['ultrasonic'],appearance='dog')
    p.sprite();p.loop = [assign('temperature',sensor('hardware','temperature')),assign('distance',sensor('simulation','ultrasonic')),stage('set_size',size=op(temp,'*',3)),stage('set_x',x=op(op(op(distance,'-',2),'*',400/398),'-',200)),assign('edge',op(absolute(stage_read('x')),'>=',190)),warning('hardware',edge),warning('simulation',edge),wait(.2)]
    p = new(13,'HW + Dash + Sprite','Joystick Mission Control','Open Dashboard and Open Stage. Move the real joystick; Speed controls each movement step. X/Y show position and Edge lights green at a boundary.','CJP (built-in joystick)',appearance='athlete')
    p.widget('Speed','slider',minimum=1,maximum=10,initial=5).widget('X','gauge',minimum=-240,maximum=240).widget('Y','gauge',minimum=-180,maximum=180).widget('Edge','led')
    p.sprite();p.loop = [assign('speed',dash_read('Speed'))] + move_controls('joystick',var('speed')) + [output('X',stage_read('x'),'gauge'),output('Y',stage_read('y'),'gauge'),output('Edge',stage_read('touching_edge'),'led'),wait(.05)]
    p = new(14,'Sim + Dash + Sprite','Virtual Weather Station','Change simulated temperature and Dashboard Threshold. Above the threshold, the sprite becomes a Cactus and says Hot; otherwise it becomes an Apple and says Comfortable. Dashboard shows reading, history and warning.',simulation=['temperature'],appearance='apple')
    p.widget('Temperature','gauge').widget('History','graph').widget('Threshold','slider',minimum=0,maximum=50,initial=30).widget('Warning','led')
    p.sprite();p.loop = [assign('temperature',sensor('simulation','temperature')),assign('hot',op(temp,'>',dash_read('Threshold'))),output('Temperature',temp,'gauge'),output('History',temp,'graph'),output('Warning',var('hot'),'led'),condition(var('hot'),sequence(stage('set_appearance',appearance='cactus'),stage('say',text='Hot')),sequence(stage('set_appearance',appearance='apple'),stage('say',text='Comfortable'))),wait(.2)]
    p = new(15,'HW + Sim + Dash + Sprite','Smart Greenhouse','Warm the real sensor or change simulated soil moisture. Set Max temperature and Min moisture in Dashboard. Too hot OR too dry makes both RGB LEDs 0 red, Warning green, and the Cactus large with Check greenhouse speech. Otherwise both RGB LEDs are green and it says Healthy.','CJP and temperature sensor',simulation=['soil'],appearance='cactus')
    p.widget('Temperature','gauge').widget('Moisture','gauge',maximum=100).widget('Max temperature','slider',minimum=0,maximum=50,initial=30).widget('Min moisture','slider',minimum=0,maximum=100,initial=30).widget('Warning','led')
    p.sprite();p.loop = [assign('temperature',sensor('hardware','temperature')),assign('moisture',sensor('simulation','soil')),assign('warning',op(op(temp,'>',dash_read('Max temperature')),'or',op(var('moisture'),'<',dash_read('Min moisture')))),output('Temperature',temp,'gauge'),output('Moisture',var('moisture'),'gauge'),output('Warning',var('warning'),'led'),warning('hardware',var('warning')),warning('simulation',var('warning')),condition(var('warning'),sequence(stage('set_size',size=140),stage('say',text='Check greenhouse')),sequence(stage('set_size',size=100),stage('say',text='Healthy'))),wait(.3)]

    catalog_path = ROOT / 'blocks/python-examples.json'
    old = json.loads(catalog_path.read_text(encoding='utf-8'))
    catalog = {p.id: p.write() for p in projects}
    # Keep existing examples as additional choices; the numbered coverage set leads.
    for key, entry in old.items():
        if key.startswith('zone-'): continue
        catalog[key] = entry
    catalog_path.write_bytes(json_bytes(catalog))
    index = ROOT / 'blocks/index.html'
    source = index.read_text(encoding='utf-8')
    options = ''.join(f'<option value="{key}">{html.escape(e["title"])}</option>' for key, e in catalog.items())
    source = re.sub(r'(<select id="example"[^>]*>).*?(</select>)', lambda m: m[1] + options + m[2], source, flags=re.S)
    index.write_text(source, encoding='utf-8', newline='\n')
    guide = '# Numbered zone examples\n\nEach `.codynick` ZIP includes matching Blocks and Python, saved panels, widget layout and sprite state. Load via Examples or File > Open, select a language, then Run. Loading leaves execution stopped. Hardware examples require a connected CJP with gateway firmware; no autonomous firmware is compiled.\n\nUse Open Dashboard / Open Stage for side-by-side interaction. Green dashboard Warning/Edge means True; red means False. A red RGB hardware/simulation LED means the warning is active.\n\n'
    guide += '| Project | Required hardware | Try this and expected result |\n|---|---|---|\n'
    for p in projects: guide += f'| {p.title} | {p.required or "None"} | {p.description} |\n'
    guide += '\nValidation: the automated suite uses actual Blockly execution and real browser Pyodide with a mocked CJP transport. This verifies software routing and reactions; it does not validate physical sensors or a real board.\n'
    (ROOT / 'blocks/examples/ZONE_EXAMPLES.md').write_text(guide, encoding='utf-8', newline='\n')
    print('Built 15 paired archives; catalogue now has', len(catalog), 'examples.')

if __name__ == '__main__': main()
