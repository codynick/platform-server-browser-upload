# Complete .codynick projects — ZIP format 1

Use File > Download Project in either editor to save one ZIP file named
Design.codynick. File > Upload Project replaces both programs and restores the
saved state. Account Save/Load stores the same logical snapshot using the existing
account service. No database migration or new service is needed.

The ZIP contains:

- manifest.json: format, schema version, application version and SHA-256 of each payload.
- programs/blocks.json: Blockly program, variable definitions and block positions.
- programs/main.py: exact Python source, UTF-8.
- state/editor.json: independent Design names, active editor/space, spaces visibility,
  example description, Python console text, cursor/selection and editor scrolling.
- state/live.json: simulated gadgets/positions/readings, LEDs/matrix/displays,
  dashboard widgets, properties, current values and retained graph history.
- state/sprite.json: starting settings plus current position, direction, size,
  appearance, backdrop, visibility and speech. Timed speech retains remaining time.
- state/dashboard-layout.json: saved widget positions and sizes.
- state/simulator-view.json: pan/zoom and selected gadget.

Reopening restores a visual snapshot, not a suspended execution. Programs remain
stopped. Run starts from the beginning and resets the sprite to its saved starting
settings; program setup may overwrite saved dashboard/simulation values. Sensor
values in the file represent the recorded simulation, not new physical readings.

USB connections, credentials, account identity, runtime leases, held keys/buttons,
pending sounds and Python variables/memory are excluded. Loading does not replay
hardware commands. A hardware program still needs a fresh/available CJP connection.
Catalogue SVG assets are provided by the platform, not embedded in project files.

Limits: ZIP input and aggregate expanded payload <=8 MiB, each entry <=4 MiB,
Python <=100,000 characters, <=2,000 blocks, <=100 widgets, <=1,000 retained points
per graph. Compressed entries are streamed with output bounds; CRC and manifest
hashes are verified before project state is applied. Unexpected/duplicate entries,
old JSON .codynick files and older account payloads are rejected. There is no
compatibility conversion. Projects should only be run when their code is trusted.

Account saving retains the server's existing 2 MiB request limit; the browser
checks a 1.9 MB payload budget and recommends Download Project for larger designs.
Account Save captures both editors even when Python is selected. Separate Python
.py import/export is available in File and affects Python source only.

Dashboard widgets include momentary/toggle buttons, sliders and boolean LED outputs.
Momentary buttons restore False; input ownership, heartbeat and queued taps are
excluded. Toggle, slider and LED values are retained. See DASHBOARD_WIDGETS.md.

## Complete examples

All supplied Examples use this same complete-project archive loader. Loading an
example replaces both programs, names, dashboard/widgets/layout, simulation and
sprite state, while preserving the selected editor and leaving execution stopped.
The catalogue in blocks/python-examples.json contains metadata/archive paths only;
program source and initial scene state live in each .codynick archive. Widgets
appear before Run. Cancellation/validation failure preserves the current project.

## 3.19.1 simulation water assets

Optional state/live.json scene.world contains up to 100 hot/cold water assets
(id, kind, temperature, x, y) and probe (x, y, temperature, at). Position and
temperature are validated by CodyLiveStore.scene. Loading rebases the probe clock
to the load time, retaining the saved measured temperature. Older projects omit
world and keep their manual temperature behavior. No schema version changes.

## 3.19.2 ultrasonic targets

scene.world.assets also accepts target blocks (id,kind=target,x,y,width,height).
scene.world.ultrasonic contains enabled (boolean) and angle (-180 to 180 degrees).
Target width/height are 10–200 cm. x/y locate the title bar; the physical rectangle
starts at x+4,y+36. One unzoomed stage unit is one centimetre. The ultrasonic
origin is gadget x+306,y+110 and a 30-degree cone extends up to 400 cm.
Only target blocks reflect sound in this educational model. No echo is 0; valid
surface distance is 2–400 cm. Cups do not become ultrasound obstacles.
Older projects without ultrasonic.enabled retain their manual distance.

## 3.19.3-preview.1 garden state

Optional scene.garden stores soil pots (type, contained water, surface pool, overflow,
drained amount), watering cans (0–500 ml), soil probe position/response, soil time,
speed and pause/world-sensing switches. The shared model validates these fields.
Pour leases expire after 350 ms without renewal; project restoration clears them
and rebases the clock, preserving moisture without replaying elapsed closed time.
Each pot is one moisture zone, with geometry for both prongs and spout landing.


## 3.19.3 current garden state
scene.garden contains enabled, at, pots and cans arrays, and probe {x,y,value}. Pots retain id,x,y,type,water,surface,overflow,drained. Cans retain id,x,y only; watering follows overlap. Legacy speed, clock, paused, level and pourUntil fields are ignored. Both probe tips must enter soil. Saved garden timestamps are rebased on restore.
