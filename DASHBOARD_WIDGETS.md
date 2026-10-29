# Dashboard inputs and LED outputs

All widgets have a unique name and visible title. Create them before reading or
writing them. They need no CJP: input can control dashboard, simulation, sprite
or real hardware operations in the ordinary program loop.

| Widget | Value | Behaviour |
| --- | --- | --- |
| Momentary button | Boolean | True while held, False after release. |
| Toggle button | Boolean | Each click reverses its persistent state. |
| Slider | Number | Configurable minimum, maximum, step and initial value. |
| LED indicator | Boolean | Green/ON for True, red/OFF for False; output only. |

Buttons support mouse/touch and Space/Enter. Held-state reads do not consume a
press. clicked() consumes one queued tap so fast clicks between loop iterations
are not lost (up to 1,000 pending taps). Focus loss, touch cancellation, page hiding,
Stop and project loading release momentary buttons. A 1.2-second lease expires a
press if its dashboard disappears/freezes; active presses renew every 250 ms.
Stop/project restore also clear queued taps. Different dashboard views cannot
release another view's held button.

Toggle buttons support mouse/touch/keyboard. Sliders support dragging, keyboard
arrows and a number entry committed on Enter/blur. Values clamp to the range and
snap to steps measured from the minimum. Maximum must exceed minimum, range
endpoints must be within +/-1 billion, and step must be between 0.000001 and the
range width. If the maximum is not on a step, the highest reachable value is the
last step below it. Boolean outputs require actual True/False, not strings.

## Blocks

Dashboard > Inputs contains creation, held/clicked/state/value read blocks and
toggle/slider setters. Dashboard > LED contains creation and a Boolean setter.
Boolean read blocks connect to conditions or LED setters; slider value blocks
connect to numbers such as sprite size, brightness, speed or a threshold.

## Python

```python
from codynick import dashboard, wait

dashboard.clear()
dashboard.button("Hold", title="Hold to enable")
dashboard.toggle("Power", initial=False)
dashboard.slider("Level", minimum=0, maximum=100, step=5, initial=50)
dashboard.led("Enabled", initial=False)

while True:
    held = await dashboard.pressed("Hold")
    power = await dashboard.value("Power")
    level = await dashboard.value("Level")
    dashboard.set_led("Enabled", held or power)
    if await dashboard.clicked("Hold"):
        print("Button tapped")
    await wait(0.05)
```

Creation/output updates do not require await. Input reads do because they fetch
current state from the browser rather than Python's worker memory. Also available:
dashboard.set_toggle(name, boolean) and dashboard.set_slider(name, number).
dashboard.value(name) reads any input type; pressed/clicked require a momentary
button. Keep the wait in a loop so the browser stays responsive.

## Included tests to try

Both editors' Examples lists include:

1. **Dashboard: buttons, slider and LEDs**: hold/tap the button, count quick taps,
   toggle Power and move the stepped slider; LEDs and gauge reflect inputs.
2. **Dashboard: control a sprite**: Hold Move to move the Bee, toggle visibility,
   and set size. Open Dashboard in another tab/window and view Sprites in the
   editor. Switching focus back to the editor releases Move.

Inputs share state with embedded/separate dashboards in the same browser/profile
and site origin, not other computers. LEDs cannot be changed by clicking.
.codynick and account projects save configuration, toggle/slider/LED values and
both programs. Momentary buttons always restore released; held ownership and
pending taps are excluded. The saved LED is its last output and can initially
differ from a newly released button; the program updates it on the next Run.
Running restarts program setup, which may intentionally recreate/reset widgets.

Software validation covers actual desktop Chrome/Pyodide, Blocks, emulated touch,
separate tabs, project restoration and Node state/validation tests. Physical CJP
and Android acceptance for this revision remains pending.

Momentary buttons use original CSS artwork: a red circular cap in a metallic rim.
The cap depresses while held; Pressed/Released appears underneath. The card title
and accessible button name identify the action; no external image is downloaded.

Loading an example now restores its complete archive in both editors. Dashboard
widgets and their initial layout/values appear before Run; old widgets and gadgets
are replaced. Switching coding language shows the matching archived program.
