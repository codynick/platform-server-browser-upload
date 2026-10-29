"""CodyNick browser Python pilot. Gadget operations and wait() use await."""
import json
import math
from _codynick_bridge import request as _request, notify as _notify


async def _call(target, block, **args):
    return json.loads(await _request('gadget', json.dumps(dict(target=target, block=block, args=args))))


async def wait(seconds):
    """Pause this program without blocking the editor."""
    seconds = float(seconds)
    if not math.isfinite(seconds) or not 0 <= seconds <= 86400:
        raise ValueError('Wait must be between 0 and 86400 seconds')
    await _request('wait', json.dumps(dict(seconds=seconds)))


class _Sensor:
    def __init__(self, target, block):
        self.target, self.block = target, block

    async def read(self, device='STANDALONE'):
        return await _call(self.target, self.block, device=device)


class _Led:
    def __init__(self, target):
        self.target = target

    async def set_color(self, color, index=0):
        colors = dict(red='#FF0000', green='#00FF00', blue='#0000FF', white='#FFFFFF', yellow='#FFFF00', off='#000000')
        color = colors.get(str(color).lower(), color)
        await _call(self.target, 'cn_rgb_matrix_set', led=index, color=color)

    async def clear(self):
        await _call(self.target, 'cn_rgb_matrix_clear')


class _Joystick:
    def __init__(self, target):
        self.target = target

    async def states(self, device='CJP'):
        return await _call(self.target, 'cn_joystick_states', device=device)

    async def pressed(self, direction, device='CJP'):
        if direction not in ('up', 'down', 'left', 'right'):
            raise ValueError('Direction must be up, down, left or right')
        return await _call(self.target, 'cn_joystick_position', device=device, pos=direction)

    async def clicked(self, device='CJP'):
        return await _call(self.target, 'cn_joystick_click', device=device)


class _SevenSegment:
    def __init__(self, target):
        self.target = target

    async def show(self, value, device='STANDALONE'):
        await _call(self.target, 'cn_seven_segment_display', device=device, value=value)


class _Matrix:
    def __init__(self, target):
        self.target = target

    async def clear(self):
        await _call(self.target, 'cn_led_matrix_clear')

    async def text(self, text, speed='medium'):
        await _call(self.target, 'cn_led_matrix_display_text', text=text, speed=speed)

    async def pixel(self, x, y, on=True):
        await _call(self.target, 'cn_led_matrix_set_pixel', x=x, y=y, state=int(bool(on)))


class _Sound:
    def __init__(self, target):
        self.target = target

    async def play(self, note='C4', duration_ms=250):
        await _call(self.target, 'cn_sound_play_until_done', note=note, duration_ms=duration_ms)


class _Target:
    def __init__(self, target):
        self.temperature = _Sensor(target, 'cn_temperature_read')
        self.soil = _Sensor(target, 'cn_soil_read')
        self.motion = _Sensor(target, 'cn_motion_detect')
        self.rfid = _Sensor(target, 'cn_rfid_readuid')
        self.ultrasonic = _Sensor(target, 'cn_ultrasonic_read')
        self.led = _Led(target)
        self.joystick = _Joystick(target)
        self.seven_segment = _SevenSegment(target)
        self.matrix = _Matrix(target)
        self.sound = _Sound(target)


class _Dashboard:
    """Dashboard updates are sent in order; they do not require await."""
    def _send(self, action, **args):
        _notify('dashboard', json.dumps(dict(action=action, args=args)))

    def clear(self):
        self._send('clear')

    def show(self, name, value):
        self._send('show', name=name, value=value)

    def gauge(self, name, minimum=0, maximum=50):
        self._send('gauge', name=name, minimum=minimum, maximum=maximum)

    def graph(self, name, history=20):
        self._send('graph', name=name, history=history)

    def button(self, name, title=None): self._send('button', name=name, title=title)
    def toggle(self, name, initial=False, title=None): self._send('toggle', name=name, initial=initial, title=title)
    def slider(self, name, minimum=0, maximum=100, step=1, initial=50, title=None):
        self._send('slider', name=name, minimum=minimum, maximum=maximum, step=step, initial=initial, title=title)
    def led(self, name, initial=False, title=None): self._send('led', name=name, initial=initial, title=title)
    def set_led(self, name, value): self._send('set_led', name=name, value=value)
    def set_toggle(self, name, value): self._send('set_toggle', name=name, value=value)
    def set_slider(self, name, value): self._send('set_slider', name=name, value=value)
    async def value(self, name): return json.loads(await _request('dashboard', json.dumps(dict(action='value', name=name))))
    async def pressed(self, name): return json.loads(await _request('dashboard', json.dumps(dict(action='pressed', name=name))))
    async def clicked(self, name): return json.loads(await _request('dashboard', json.dumps(dict(action='clicked', name=name))))

    def append(self, name, value):
        self._send('append', name=name, value=value)


hardware = _Target('HARDWARE')
simulation = _Target('SIMULATION')
dashboard = _Dashboard()


async def _stage(action, **args):
    return json.loads(await _request('sprite', json.dumps(dict(action=action, args=args))))


class _Stage:
    """One browser sprite. Every operation/read uses await; no CJP required."""
    async def configure(self, x=0, y=0, direction=90, size=100, backdrop='white', appearance=None):
        await _stage('configure', x=x, y=y, direction=direction, size=size, backdrop=backdrop, appearance=appearance)
    async def set_appearance(self, appearance): await _stage('set_appearance', appearance=appearance)
    async def appearance(self): return await _stage('appearance')
    async def move(self, steps): await _stage('move', steps=steps)
    async def turn(self, degrees): await _stage('turn', degrees=degrees)
    async def point_direction(self, direction): await _stage('point', direction=direction)
    async def go(self, x, y): await _stage('go', x=x, y=y)
    async def set_x(self, x): await _stage('set_x', x=x)
    async def set_y(self, y): await _stage('set_y', y=y)
    async def change_x(self, amount): await _stage('change_x', amount=amount)
    async def change_y(self, amount): await _stage('change_y', amount=amount)
    async def glide(self, seconds, x, y): await _stage('glide', seconds=seconds, x=x, y=y)
    async def bounce(self): await _stage('bounce')
    async def go_to_mouse(self): await _stage('go_to_mouse')
    async def set_size(self, size): await _stage('set_size', size=size)
    async def change_size(self, amount): await _stage('change_size', amount=amount)
    async def say(self, text): await _stage('say', text=str(text))
    async def say_for(self, text, seconds): await _stage('say_for', text=str(text), seconds=seconds)
    async def show(self): await _stage('show')
    async def hide(self): await _stage('hide')
    async def x(self): return await _stage('x')
    async def y(self): return await _stage('y')
    async def direction(self): return await _stage('direction')
    async def size(self): return await _stage('size')
    async def key_pressed(self, key): return await _stage('key_pressed', key=key)
    async def mouse_x(self): return await _stage('mouse_x')
    async def mouse_y(self): return await _stage('mouse_y')
    async def mouse_down(self): return await _stage('mouse_down')
    async def touching_edge(self): return await _stage('touching_edge')


stage = _Stage()
