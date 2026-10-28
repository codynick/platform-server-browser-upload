# CodyNick Portal 3.11.0 — CAS accounts and Guest mode (Not Mature)

## Deploy or update

Run the same command on an existing server or a fresh Debian/Ubuntu VPS
(Ubuntu 22.04+ or Debian 12+ recommended; Python 3.9+ and SQLite 3.35+ required):

```bash
wget -4 -O /tmp/codynick-browser-setup.sh "https://raw.githubusercontent.com/codynick/platform-server-browser-upload/main/setup.sh?$(date +%s)" && sudo bash /tmp/codynick-browser-setup.sh
```

On first setup enter the domain, with DNS pointing to this server and ports 80/443
open. The installer checks HTTPS through Certbot and deploys the frontend plus
Flask/Gunicorn, SQLite and Apache proxy routes. Existing CAS identity settings
and projects are preserved. Domain selection prefers CODYNICK_DOMAIN, then an
existing CAS config, then /etc/codynick/domain, then prompts. One CAS deployment
per VPS is supported. Apache must have an exact HTTPS ServerName for that domain.

Close all old CodyNick tabs before deploying; reopen and Ctrl+F5 afterward.
Verify File → About shows **3.11.0**. Node is not required on the server.

## Accounts

No sign-in means **Guest**, automatically. Guests can edit, run, simulate, use
examples and Upload/Download. Save Project and Load Project require CAS sign-in.
Guest drafts are saved separately in this browser. Private work is never written
to that draft key. Old browser named projects remain intact and can be selected
for explicit import in the signed-in Load dialog, then saved to the account.

The default identity provider is https://id.codynick.com/cas, using CAS principal
as stable ID and `name` / `email` attributes. Existing settings in
/etc/codynick-cas/config.json are retained. For a new installation, environment
variables CAS_BASE_URL, CAS_VALIDATE_URL, CAS_ID_ATTRIBUTE, CAS_NAME_ATTRIBUTE and
CAS_EMAIL_ATTRIBUTE can override defaults. The installer derives the public
origin and logout return for the selected domain on every deployment.

Register these **exact URLs in the CAS server** (the installer cannot change
central identity-provider registration):

- Login service: `https://<domain>/auth/callback`
- Logout return: `https://<domain>/blocks/` (enable CAS post-logout redirection)

A verified identity-confirmation page remains after CAS login. Sessions expire
in eight hours. Account project APIs enforce ownership, write CSRF/Origin checks,
2 MB request limits, 200 projects per account and revision-conflict detection.
Signing out clears private browser content and visits central CAS logout.
The account service retries automatically; if it is unavailable the editor stays
usable as Guest while previously private content is cleared. Account changes
cancel in-flight operations so late private responses cannot refill the workspace.

Programs, sensor readings and dashboards still execute locally in the browser;
only account/project storage is server-side. Dashboard layouts remain local.
No autonomous board execution, public project sharing or account signup is added.

## Rollback and database recovery

Every application deployment snapshots website files/assets, existing CAS code,
configuration, service state, affected Apache files and an existing SQLite database.
A failed application deployment automatically restores the preceding release.
The deployment prints its exact backup directory. To roll back the latest attempt:

```bash
sudo bash /root/codynick-last-backup/rollback.sh
```

Rollback restores website/CAS code and configuration, **retaining the latest
private database**, so projects saved after deployment are not discarded. It
keeps a recoverable copy of the replaced files and leaves the Git checkout intact.
Packages and certificate provisioning are not reversed. Setup failures before
application deployment report an error without claiming an application rollback.

If you explicitly want to restore the older database snapshot as well:

```bash
sudo bash /root/codynick-last-backup/restore-database.sh /root/codynick-last-backup/database.sqlite3
```

That command stops the service, makes a safety copy of the newer database, restores
the selected snapshot, then restarts the service if it was running. No database
snapshot exists on the first-ever CAS installation. Keep off-server copies of
/var/lib/codynick-cas and /etc/codynick-cas for disaster recovery.

Useful diagnostics: `systemctl status codynick-cas`,
`journalctl -u codynick-cas --since today`, and Apache's site error log.
Auth request logs omit ticket query strings. Server-Timing is available to
investigate latency; this release does not claim a live CAS timing diagnosis.

## Editor controls (3.9.0)

File contains New/Save/Load/Upload/Download Project, Examples and About.
File → Examples opens a list; select an entry and choose Load Example (or
double-click it). Names are explicit labels in blocks/index.html, mapped to
internal IDs in blocks.js; they are independent of project filenames.
Advanced contains Console, View Python and Linux USB help when applicable.
Python preview behavior is unchanged. The one green Run button becomes a red
Stop button while running; connection status appears below Connect/Run.
The simulator's Add gadget button opens a picker that closes after adding one.
About displays release version and calendar date.

## Interface polish (3.9.0)

Simulator and Dashboard share a consistent header. Embedded views hide the
Block Editor link; standalone tabs retain it. Open Simulator/Open Dashboard
buttons at the left of the panel toolbar open full-size tabs. File/Advanced
menus use grouped, icon-assisted dropdowns.

Mouse-wheel scrolling over the coding canvas zooms at the pointer. Toolbox
lists still scroll normally; pan the canvas by dragging or using its scrollbars.
Block arguments and target choices use one horizontal row, including imported
projects; loops and conditions retain nested statement bodies.

Single-series graph legends use the graph title; explicitly named series keep
their names. The example chooser uses friendly names while preserving internal
IDs and existing project compatibility.

## Simulator navigation and branding (3.10.0)

The supplied transparent CodyNick logo is displayed at its original proportions
on the landing page, editor, About dialog, simulator and dashboard. Standalone
tool pages place Block Editor at the right of the same compact row as the logo and title;
embedded views hide that link and the duplicate logo, keeping their title.

Scroll over the simulator to zoom at the pointer; drag empty stage space to pan.
Double-click empty space, or focus the stage and press Home/0, to fit all gadgets.
The focused stage also supports +/- zoom and arrow-key panning. Camera movement
does not change saved gadget coordinates. Use the right-side grip to move a
gadget and its left-side cross to remove it (while stopped). The built-in CJP
remains required and non-removable. Fit Stage, 1:1 and the global remove button
are replaced by these direct controls. Browser simulator text is removed.

## Pages
- / — landing page
- /blocks/ — original project block-editor appearance, with shared Live runtime
- /simulator/ — original gadget simulator interface adapted to browser-local state
- /dashboard/ — original dashboard renderer adapted to browser-local widgets

Refresh the editor with Ctrl+F5 after installation. Simulator and Dashboard are
available in the editor's right panel, with links for opening full-size tabs.
Hide spaces restores the full-width coding workspace. On narrower screens the
spaces stack below the editor. The open tabs must use the same origin and browser
profile; they share the browser's local state. Different devices/profiles share explicitly saved private projects through
the account API, while live values and layouts remain browser-local. Python and
SQLite serve the account API; hardware/simulation execution stays in the browser.

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
2. Open File → Examples, choose **Try a pretend sensor and draw a graph**,
   click Load Example, and accept workspace replacement.
3. This example adds a simulated temperature sensor to the stage and creates a
   gauge/history graph through Dashboard blocks. Press Run.
4. Adjust temperature in Simulation and switch the right panel to Dashboard.
   The values and chart update. A simulated RGB LED lights green.
5. Stop. Try the mixed example after connecting a real CJP and temperature sensor:
   the real reading drives the dashboard while the LED action targets Simulation.

The Blink a light, Show the temperature, and Control a light with the joystick examples still
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
v3.4. Legacy sensors, sprites, Upload mode and autonomous programs
are not implemented here.

## Dashboard

Use **Edit layout** to drag card titles and resize from the lower-right corner.
Both actions snap to the grid; occupied cards move to free space. Focus a title
or resize handle and use arrow keys for keyboard control. Escape cancels an
active drag. **Lock layout** prevents accidental changes; **Reset layout**
restores defaults. Info cards start compact, gauges medium, and graphs wide.

Layout is saved independently in this browser by widget name, surviving refresh,
Stop, dashboard clear/recreation, and subsequent runs. User layout overrides
program size settings until reset. Layout is not exported in project files;
reusing the same widget name in another project reuses its saved layout.
Narrow panels adapt the grid without overwriting saved desktop sizes.

Graph axes use an independent 11 px font, compact numbers, adaptive tick density,
and truncated long axis titles; hover over the graph for full axis titles.

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
Save/Load access private account projects; Guest drafts use a separate browser key. Download
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

Install backend test dependencies in a virtual environment from backend/requirements.txt.
Run `python -m unittest discover -s backend -p "test_*.py"` for CAS, configuration
and isolated deploy/rollback tests. Service commands in deployment fixtures are
mocked; this does not claim a live VPS or CAS-provider test.
With Playwright available, `node blocks/browser-tests/accounts.cjs` checks Guest
mode, private Save/Load, separate drafts, cross-tab cleanup, late-response rejection,
service outage recovery and the account header. CODY_ACCOUNT_ARTIFACTS selects
its screenshot directory.


`node blocks/tests/simulator-viewport.cjs` checks camera zoom/pan/fit math.
With Playwright available, `node simulator/tests/browser.cjs` checks pointer and
keyboard navigation, gadget dragging/removal, program locks, branding and mobile
layouts. `CODY_SIMULATOR_ARTIFACTS` selects screenshots; CODY_CHROME_PATH selects
the browser executable.


With Playwright available, `node blocks/browser-tests/editor.cjs` checks the
File/Advanced menus, examples, Run/Stop colors, status placement, About date,
gadget picker and narrow-screen toolbar. `CODY_EDITOR_ARTIFACTS` selects its
screenshot folder; `CODY_CHROME_PATH` selects an installed Chrome executable.

`node blocks/tests/dashboard-layout.cjs` checks layout packing, persistence and
axis formatting. With Playwright available, `node dashboard/tests/browser.cjs`
checks real pointer/keyboard editing, live updates, graph label bounds, reload,
cross-tab layout reset, mobile width and the embedded editor dashboard.
Use `CODY_CHROME_PATH` for an installed Chrome executable, or install Playwright's
Chromium. Optional `CODY_DASHBOARD_ARTIFACTS` selects the screenshot directory.

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

The File → Examples chooser includes **Send real and pretend readings to displays**. The downloadable project is `blocks/examples/Real-temperature-Sim-distance.codynick`; instructions are beside it. Both sensors feed separate info cards and history graphs. Real temperature drives the simulated seven-segment display; simulated distance drives the real standalone seven-segment display.
