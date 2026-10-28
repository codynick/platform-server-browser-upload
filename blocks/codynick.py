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

    def append(self, name, value):
        self._send('append', name=name, value=value)


hardware = _Target('HARDWARE')
simulation = _Target('SIMULATION')
dashboard = _Dashboard()
