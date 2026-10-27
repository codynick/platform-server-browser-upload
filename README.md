# CodyNick Portal 3.6.0

## One command: fresh server setup or update

Run as root on a Debian/Ubuntu server:

```bash
(set -e; apt-get update; apt-get install -y curl ca-certificates; setup_file=$(mktemp); trap 'rm -f -- "$setup_file"' EXIT; curl -fsSL https://raw.githubusercontent.com/codynick/platform-server-browser-upload/main/setup.sh -o "$setup_file"; bash "$setup_file")
```

The command installs Git, Apache and Certbot, clones or fast-forwards the main
branch, deploys the website with a rollback backup, configures an Apache site
when the domain has no existing site, and enables HTTPS. Existing domain site
configuration is reused. Existing Let's Encrypt HTTPS is retained.

Before fresh setup, point code.codynick.com DNS (including any AAAA record) to
this server and allow inbound TCP ports 80 and 443. DNS resolution is checked;
Certbot verifies reachability and domain ownership. DNS and firewall changes
are not performed automatically. A failed certificate request reports an error;
fix DNS/reachability and rerun the same command. HTTPS is required for USB use.
Certificates are registered without an email contact; configure a Certbot email
separately if you want certificate notices. Certbot manages automatic renewal.

The server checkout must be clean, on main, and use the expected GitHub origin.
The updater stops rather than overwriting local Git changes. The website-only
rollback command is printed during deployment; it does not undo package, Apache,
or certificate setup. For an existing custom site, its DocumentRoot must be
/var/www/code.codynick.com. This release does not flash firmware onto the CJP.

Open Project > About in the editor to see version 3.6.0. Refresh with Ctrl+F5
after deployment. For an already configured server, install.sh remains available
as a website-only deployment command.

## Pages
- / — landing page
- /blocks/ — original project block-editor appearance, with shared Live runtime
- /simulator/ — original gadget simulator interface adapted to browser-local state
- /dashboard/ — original dashboard renderer adapted to browser-local widgets

Refresh the editor with Ctrl+F5 after installation. Simulator and Dashboard are
available in the editor's right panel, with links for opening full-size tabs.
Hide spaces restores the full-width coding workspace. On narrower screens the
spaces stack below the editor. The open tabs must use the same origin and browser
profile; they share the browser's local state. Different devices/profiles do not
share projects or dashboard values. No PHP, Python server, MySQL or extra service
is required: the original UI assets are retained, but server APIs are replaced
by a browser-local model.

## Target rules (confirmed design)
Each gadget block has a target dropdown: Hardware or Simulation. Hardware is the
default, including imports from v3.4 without a target field. The setting is saved
with the block. There is no project-wide target selector or Set All action.
Logic/math/variables/events/waits and logging run in the browser and have no target.
Dashboard blocks always act on the Live dashboard and have no target dropdown.

A Run snapshot is checked before execution. Enabled blocks under start/main-loop
roots are considered, including branches that might execute; disabled blocks and
loose unused blocks do not require devices. Hardware targets require a connected,
identified CodyPi gateway. Simulated targets require the corresponding gadget on
the simulation stage. A missing/unsupported target produces a block-specific
error; there is no silent hardware/simulation fallback. Missing requirements
prevent program actions from starting. Gadget availability is also checked during
execution. Hardware-targeted blocks cannot execute without a CJP.

The simulated CJP is always present. Add other gadgets using the original
simulator's palette before Run. Stop before adding/removing simulated gadgets.
Start sections run once; main-loop sections then repeat in workspace order.
A forever in a start section prevents reaching later sections. Run uses a snapshot
so edits affect the next run. Stop cancels waits, but an in-flight hardware read
may take up to 2.5 s to finish/time out. Outputs retain their last commanded state.

## Getting started
1. Open /blocks/ in Chrome. For a simulation-only test, no USB connection is needed.
2. Select Examples -> Simulation + dashboard, and accept workspace replacement.
3. This example adds a simulated temperature sensor to the stage and creates a
   gauge/history graph through Dashboard blocks. Press Run.
4. Adjust temperature in Simulation and switch the right panel to Dashboard.
   The values and chart update. A simulated RGB LED lights green.
5. Stop. Try the mixed example after connecting a real CJP and temperature sensor:
   the real reading drives the dashboard while the LED action targets Simulation.

The original Blink RGB, Temperature display and Joystick light examples still
target Hardware by default. Change individual dropdowns to try their simulated
counterparts, adding required gadgets to the stage yourself.

## Supported gadgets
- CJP RGB matrix: index and serpentine XY color, clear
- CJP sound: note, duration, optional wait-until-finished
- Joystick: CJP index 5 and standalone index 0 in simulation; hardware retains 0–5
- LED matrix: scrolling text, pixel on/off/set, clear
- Seven-segment: standalone index 0 and UltraSeg index 2
- Temperature, soil moisture, ultrasonic (standalone 0 / UltraSeg 1), PIR, RFID

Simulation reuses the original photos/SVGs, joystick controls, draggable stage,
RGB visualization, seven-segment renderer, LED font/raster and optional sound.
PIR, RFID and UltraSeg have added controls; UltraSeg's numeric display is a simple
readout rather than an additional photorealistic seven-segment panel.
Enable sound in the simulator to permit browser audio. Simulated reads represent
values you enter, not a physical/environmental model. Hardware ultrasonic values
can be cached by CodyPi. RGB hardware commands have no acknowledgments.

The original simulator's Wi-Fi/IoT exploratory card is retained, but Wi-Fi/IoT
coding blocks remain outside this release's palette. They were not available in
v3.4. Legacy sensors, sprites, Upload mode, cloud accounts and autonomous programs
are not implemented here.

## Dashboard
Dashboard toolbox groups are copied from the original project: Setup, Info,
Gauge and Graph. Create a named widget before updating it. Supported blocks:
clear, create, set value, append sample, history length, range, color/size and font.
Gauge and graph values carry a Source label (Hardware, Simulation, mixed sources,
or Program), including readings passed through variables. Values are local to
this browser. Widgets persist after Stop; a program can clear/recreate them.
There are at most 100 widgets, with graph history limited to 1000 samples each.
The dashboard can be open in its iframe or another same-origin tab while Run
continues in the editor. Closing the editor stops program execution; the session
indicator expires after a few seconds. Only run one Live program per browser
profile; a live-session check blocks another active editor from starting.

## Projects and compatibility
Save/Load named designs and autosave retain their existing browser keys. Download
and Upload preserve per-block targets and stage arrangement/sensor settings.
Dashboard creation blocks recreate widgets when you run a project; current graph
history/output states are not part of the exported project. The simulator's
layout/settings and dashboard state also persist separately in browser storage.
Original supported hardware IDs are retained. Unsupported imported blocks are
rejected before replacing the workspace. Back up work with Download before
changing examples or loading another design.

View Python remains a reference preview for hardware-only projects. Mixed-target
and dashboard projects instead show a clear message that a single hardware Python
script cannot represent the browser Live routing. The Run button always uses
the JavaScript interpreter; nothing is flashed to the CJP.

## Connections
Windows/Linux desktop Chrome uses native Web Serial. Linux USB setup help
explains dialout permissions, full logout/login and occupied ports. Android
uses WebUSB for CH340 VID 1A86 / PID 7523; close other Android serial apps first.
The Android connection path was physically confirmed on an S23 FE in v3.3.
Existing firmware CodyPi 1.19.6 remains unchanged. Browser timing is not real time;
background tab throttling may change update timing.

## Tests and limits
Run `node blocks/tests/live.cjs` for mixed routing, disconnected simulation,
dashboard source labels, preflight validation, persistence and gadget-model checks.
`frontends.cjs` checks original frontend initialization and graph parsing with a
DOM stub. `ui.cjs` and `runtime.cjs` load real headless Blockly blocks and test
Run/Stop/variables/loops and protocol frames. `serial.cjs`, `android.cjs`,
`webusb.cjs`, `linux-help.cjs` and `menu.cjs` cover existing connection/menu paths.
Node is only used for development tests; it is not required on the VPS.

Installer/rollback was exercised in a temporary website tree; local HTML asset
references and all scripts were checked. Mixed hardware replies are simulated in
tests. Graphical layout/touch behavior and physical mixed-mode hardware execution
still need testing in your browser after deployment.

## Attribution
Original block editor styles/theme/definitions, simulator interface/assets and
dashboard HTML/CSS/renderer come from your supplied platform-server.zip. The
simulator's bundled font license is preserved in simulator/FONT-LICENSE.txt.
Blockly notices: blocks/vendor/blockly/LICENSE. CH340 protocol reference/notices:
blocks/THIRD_PARTY.md. CodyPi firmware protocol is unchanged.

## v3.5.1 separate-tab update fix
The runtime previously yielded through setTimeout(0) for every block/value.
Browsers can clamp those background-page timers, stretching a short loop into
many seconds when the dashboard/simulator is the active tab. Zero-delay yields
now use MessageChannel; program delays and heartbeat use a dedicated timer
worker, with native timers as a compatibility fallback. Stop still cancels waits.

Live-state writes now notify other pages through BroadcastChannel and storage
events. Dashboards refresh on these notifications and on focus/visibility, with
polling retained as a recovery path and unchanged states skipped. No appearance
or block/project format changes were made.

New regression tests: blocks/tests/scheduler.cjs and blocks/tests/tabs.cjs.
They exercise actual worker-thread timing with simulated clamped page timers and
three isolated JavaScript browser contexts sharing browser-style storage/events.
Graphical browser behavior still needs your check. A suspended/frozen browser tab,
closed editor, or sleeping/locked device cannot be guaranteed to keep running;
this remains browser Live mode, not autonomous hardware execution.

## v3.5.2 mixed sensor example

The Examples menu includes **Real temperature + simulated distance + cross displays**. The downloadable project is `blocks/examples/Real-temperature-Sim-distance.codynick`; instructions are beside it. Both sensors feed separate info cards and history graphs. Real temperature drives the simulated seven-segment display; simulated distance drives the real standalone seven-segment display.
