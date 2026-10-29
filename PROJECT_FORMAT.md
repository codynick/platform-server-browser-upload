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
