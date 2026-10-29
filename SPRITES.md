# Browser sprite stage

One local browser stage is shared by the Blocks and Python editors in that tab.
It needs no new server service, network port, firmware or CJP for sprite-only
programs. Other editor tabs have their own sprite stage. Open Stage opens a linked view
of this editor in a separate tab. Simulation/dashboard retain their
existing behavior. Multiple sprites, user image uploads, collisions between sprites,
parallel Scratch scripts and older sprite-project conversion are outside this preview.

See [APPEARANCES.md](APPEARANCES.md) for the 11 built-in appearances and how to add more.

## Controls

Select Sprites beside Simulation/Dashboard. Use Reset while stopped, and Settings
for the Blocks starting x/y, direction, size and backdrop. Coordinates are 480×360:
center (0,0), positive x right, positive y up; x is -240..240 and y -180..180.
Direction 0 is up, 90 right, -90 left and ±180 down. Size is clamped to 10..300%.
Movement clamps to stage coordinates; bounce accounts for the sprite size/rotation.
White, sky and field backdrops are available.

Click/tap the stage for arrow keys/space, or hold the on-screen buttons. Typing in
the Python editor does not control the stage. Held inputs clear on focus loss,
hidden views, Stop and account changes. Pointer coordinates apply to the canvas.
The first sprite operation/Run shows the Sprites panel; users can switch to the
simulation/dashboard while a program continues. No extra Run button is added.

## Python

```python
from codynick import stage, wait

await stage.configure(backdrop="sky", x=0, y=0, direction=90, size=100)
await stage.say("Hello!")
await stage.glide(2, 100, 50)
print(await stage.x())
```

Every stage operation/read uses await. Methods:

- configure(x=0, y=0, direction=90, size=100, backdrop="white", appearance=None)
- set_appearance("bee"), appearance()
- move(steps), turn(degrees), point_direction(direction), go(x,y)
- set_x(x), set_y(y), change_x(amount), change_y(amount), glide(seconds,x,y)
- bounce(), go_to_mouse(), set_size(size), change_size(amount), show(), hide()
- say(text), say_for(text,seconds)
- x(), y(), direction(), size(), touching_edge()
- key_pressed("up"|"down"|"left"|"right"|"space")
- mouse_x(), mouse_y(), mouse_down()

Glide and timed speech allow 0..300 seconds and pause the calling program. Stop
cancels a glide immediately and preserves its last position. Timed speech expires
at its deadline even if Stop interrupted the wait. Operations are sequential;
overlapping movement while a glide is active is rejected. No AI/IoT API is added.

File and account projects contain both programs plus sprite starting settings and
current state. See PROJECT_FORMAT.md. Raw .py import/export remains separate.

## Examples

- Arrow-key movement: no CJP. Run, focus the stage, then use arrows or touch buttons.
- Simulated temperature: no CJP. Change temperature in Simulation; return to Sprites
  to see its size/speech. The Python example also updates the dashboard.
- Real CJP joystick: connect CJP and use its joystick. Unplug ends the hardware program.

## Validation and rollback

Local automated tests cover model validation, movement/bounce, saved starting
settings, stale input, timed speech, glide completion/cancellation, real Blockly
and Pyodide execution, simulation/dashboard links, input focus and emulated touch.
Physical CJP and real Android testing remain pending. Browser tab suspension still
affects Live-mode execution as before. Existing Blocks/runtime suites pass.

The ZIP updater prints the exact backup and supports:
`sudo bash /root/codynick-python-rollback.sh`.
This restores the website before the latest manual update. Download sprite designs
before downgrading: an older runtime cannot execute the new stage blocks. Release 3.18.0 publishes this implementation to GitHub; see README.md for upgrades.

Both CJP joystick examples also passed browser tests with simulated serial replies; this is not physical USB validation. Development browser tests: blocks/browser-tests/sprites.cjs and sprites-joystick.cjs (Playwright required).

## Open Stage

Click Open Stage beside Open Simulator/Open Dashboard. The new tab mirrors the
originating editor's live stage: position, appearance, direction, size, backdrop,
visibility and speech. It uses the same renderer/assets and works with Blocks or
Python. Keep the original editor open: it executes the program and owns USB;
the separate stage does not execute code or manage firmware/hardware itself.

Click the standalone canvas for arrows/space and pointer sensing, or hold its
touch buttons. The embedded panel may show Simulation/Dashboard while the stage
tab controls the sprite. Focus loss, hidden views, pointer cancellation and closing
the stage release its inputs. Input leases expire after 1.2 seconds without renewal.
Stop, Run, loading projects and stage resets discard old held-input messages.
Several stage views can watch one editor; separate editors use different links.

Same-browser/profile and site origin are required. BroadcastChannel carries
state/input; no new server service or database is introduced. A status line shows
Connected / Program running or stopped, or Editor unavailable. Changing account
clears and detaches the existing stage view. Closing/refreshing the original editor
also invalidates its old link: click Open Stage again in the current editor.
Bookmarking the page does not store a project. Browser suspension/discarding the
editor may pause the Live program, as before. Starting settings and appearance
controls remain in the editor; the separate view shows the stage and input pad.

Software validation covers actual Chrome separate tabs, real Blocks/Pyodide
execution, keyboard/pointer input, hidden embedded panel, Stop, pose/speech/looks,
mobile touch/cancellation, abandoned input expiry, independent editor links and
account-reset detachment. Physical device/Android acceptance remains pending.
