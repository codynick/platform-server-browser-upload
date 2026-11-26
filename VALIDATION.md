# Validation for 3.21.1-ai.29

Repository checks: all DFPlayer, paired example, existing Air Temp/Hum and earlier Demo regressions pass. Actual recorded-audio browser checks were repeated against the repository files. Media verification rejects missing, modified, duplicate, excluded and invalid-path entries. Installer shell syntax and package-lock checks pass.

CodyNick 3.21.1-ai.29 cumulative local validation

Firmware:
- Compiled CodyPi 1.19.10 for Uno with the installed AVR 7.3.0 toolchain,
  recompiling the sketch and linking the unchanged Arduino/CodyNick objects.
- Flash 30,332 / 32,256 bytes; static RAM 1,525 / 2,048 bytes.
- Actual HEX parser and mocked bootloader upload/readback regressions pass:
  fragmented replies, wrong MCU, corruption, unplug, startup noise, delayed
  probes, bounded retries and no writes on failed synchronization.
- I2C address 16 bridge limits writes to five bytes, validates hex payloads,
  checks transmission status, validates busy replies and applies Wire timeout.
  Long waits execute in the browser, not as blocking Uno routines.

Runtime, API and examples:
- Exact wire packets for volume, track modes and signed hundredths verified.
- Number vocabulary sequences match supplied STM32 myTD.h, including negative
  numbers, zero, fractional leading zero, thousands and safe numeric bounds.
- Planned clips exist for representative values in all four number languages.
- Mock audio verifies pause/resume, actual completion signalling, busy state,
  Stop cancellation, missing recordings, independent Hardware/Simulation routing,
  I2C errors, all block target roundtrips and Python bridge calls.
- Public native Python APIs verified for both targets. Generated desktop Python
  helper executes against mocked serial, validating 20-byte framing, menus,
  waits, bounds, errors and timeout restoration. This is not a Pyodide test.
- All eight new example Python sources compile. Actual Blockly execution with
  mocked transport verifies Basics controls, joystick edge announcements,
  weather sensor values and dry/wet soil transitions for both targets.

Rendered Chrome with real audio files:
- 21 Demo entries; all eight new projects load stopped with matching
  Blocks/Python and valid saved scenes.
- Real MP3 playback/decoding verifies Welcome, Happy and Hello; real pause/
  resume and media completion, not a fake busy timer.
- Negative decimal speech fetches the exact minus/one/dot/twenty clips.
- Audio continues with Simulation hidden. Stop cancels playback. Volume and
  project restore work. No JavaScript page errors or unexpected alert dialogs.
- Existing Air Temp/Hum spray, heater, settings, state restoration and hidden
  sensing browser regressions pass against the cumulative .29 overlay.

Assets and installer:
- All 838 selected MP3s contain valid MPEG Layer III headers. All catalogue
  entries resolve; Hafez/folder 07 and folder 16 are excluded. Named emotion
  alternatives chosen explicitly; source names/collisions are recorded.
- Optional prepare-sd.py creates 838 matching files in an empty folder;
  generated SD output bytes match every catalogue entry.
- All Demo archive manifests/file SHA256 values verified.
- .28 local-patch and current Git-base fixtures pass LF/CRLF upgrades,
  idempotence, exact rollback/new-file cleanup and unknown-source rejection.
- Customized HTML and unrelated URL queries/fragments are preserved;
  DFPlayer module is inserted exactly once and required caches are refreshed.
- Website discovery ignores backups and rejects zero/multiple live roots.
- Payload SHA256 and final ZIP integrity checked.

Physical gadget, installed SD-card playback, STM32 flashing and production
server deployment were not performed. Supplied STM32 firmware can defer stop
commands until a synchronous number sequence completes. A clean matching SD
selection is necessary for audible parity where the original has duplicate
track prefixes. The cumulative source is applied to the local repository; deployment also verifies every bundled recording SHA256 before backups or writes.


# Validation for 3.21.1-ai.28

CodyNick 3.21.1-ai.28 cumulative local validation

Firmware:
- Built CodyPi 1.19.9 for Arduino Uno using the installed AVR 7.3.0 toolchain,
  recompiling the sketch and linking the unchanged Arduino/CodyNick objects.
- Flash: 29,976 / 32,256 bytes; static RAM: 1,499 / 2,048 bytes.
- Validated HEX through the actual uploader's parser and mocked bootloader:
  upload/readback, fragmented responses, wrong MCU, corruption, unplug,
  delayed probes, startup noise, retries and no writes on failed sync pass.
- Safe reader uses address 98, humidity-first bytes, signed temperature,
  tenths scale, complete-packet/range validation, one-second shared cache and
  supported Wire timeout. Supplied header retained byte-for-byte as reference.

Runtime/model:
- Numeric reporters, Hardware/Simulation target roundtrip and variable sockets.
- Hardware tests cover negative/zero/positive temperatures and humidity bounds;
  ERR, non-finite/malformed and out-of-range replies reject.
- Coupled heating/drying, mist/humidifying, source proximity, recovery,
  manual values, malformed-world rejection and JSON/project restore pass.
- Simulation works without a board or visible simulator and stays independent
  of Hardware replies. Python bridge accepts both new reporters.
- Public Python hardware.air/simulation.air temperature/humidity APIs pass.
- Actual generated Python preview helper executes against mocked serial:
  fixed 20-byte request frames, signed values, errors and restored timeout.

Rendered Chrome:
- Supplied probe cutout loads; picker adds Air Temp/Hum and both assets.
- Actual pointer hold-to-spray increases humidity and release stops emission.
- Actual heater drag, on/off, warming/recovery, ambient/settings dialog,
  manual fallback, complete project restore, hidden sensing and removal pass.
- Demo library still has all 13 entries; ten welcome variants load stopped
  with Blocks/Python and saved state; actual simulated joystick moves pixel.
- No JavaScript page errors or unexpected alert dialogs.

Installer:
- .27 patch and current .26 Git fixtures pass LF/CRLF upgrades, idempotence,
  exact rollback/new-file cleanup, modified-source rejection and customized
  HTML preservation including unrelated URL queries and fragments.
- Required module cache URLs update; source/payload hashes validated before
  writes. Backup folders excluded; zero/multiple live roots stop safely.
- All Demo archive file hashes and final ZIP integrity verified.

Physical sensor/board and production server testing was not performed.
The cumulative .28 source was applied to the local repository; portable Air Temp/Hum and Demo regression suites, existing demo tests, installer shell syntax and package-lock checks pass. Browser checks were repeated against the repository files.

# Validation for 3.21.1-ai.27

CodyNick 3.21.1-ai.27 local validation

Archive/data:
- All ten new .codynick ZIPs have valid manifests and SHA256 file checksums.
- Python syntax compiles with top-level await; complete saved project state
  validates through the real browser project loader for every new entry.
- Existing catalogue entries and three Demo entries are retained.

Actual Blockly runtime with mocked CJP transport, both target variants:
- Four directional boundaries clamp correctly; exactly one pixel is lit.
- Speed click edge toggles only once while held; fast/slow durations verified.
- Three mood palettes and durations, 16-step countdown order and warning colors.
- Memory grows through six correct rounds, wins, rejects wrong answers and
  times out after ten virtual seconds; input release prevents repeated holds.

Native Python with actual codynick.py and mocked browser bridge:
- Same boundary, speed, mood, countdown and memory win/wrong/timeout cases pass
  for both Simulation and Hardware versions. This is not a Pyodide browser test.

Rendered Chrome:
- Examples > Demo displays 13 entries, including all ten new variants.
- Every new project loads stopped with matching Blocks/Python and valid state.
- Real mouse input on simulated CJP joystick moves pixel to right boundary;
  Run and Stop work without a connected board. No page errors or alerts.

Installer:
- .26 fixture upgrades, LF/CRLF, idempotence, exact rollback/new-file cleanup,
  modified-source rejection, customized HTML/query preservation and automatic
  website discovery checks pass. Backup directories are ignored.
- Payload SHA256 and final ZIP integrity checked.

Firmware remains 1.19.8. No physical board or production server validation.
Local repository and Git were not updated by this local-patch task.

# Validation for 3.21.1-ai.26

3.21.1-ai.26 local validation
- Chrome confirms restored sensor photo and marked sensing point.
- Below the photo: only one intensity label, numeric box and progress bar.
- Real mouse dragging toward the photo raises measurement 34.6% to 97.1%.
- Keyboard movement, on/off, manual input, read-only measured value, saved
  scene restore, hidden-panel sensing and manual restoration on removal pass.
- .25 and Git-base installer checks: LF/CRLF upgrade, idempotence, rollback,
  new-file cleanup, source rejection and customized HTML preservation pass.
- Website auto-detection ignores backups and rejects zero/multiple live sites.
- Cumulative source hashes retained for .15 through .25; ZIP hashes checked.
- Firmware unchanged at 1.19.8; no physical hardware testing performed.

Firmware and Light Sensor implementation validation from .23:

3.21.1-ai.23 local validation

Firmware:
- Compiled CodyPi 1.19.8 for Arduino Uno with the supplied Light Sensor header.
- Header is bundled unchanged; device 1 reads I2C address 103.
- Initial library-cache warmup is handled; invalid/missing readings produce ERR.
- New image uses 29238 flash bytes and 1463 static RAM bytes, within Uno limits.
- The real uploader parses the shipped HEX and validates record checksums/bounds.
- Existing mocked bootloader upload/readback, delayed probes, noise, wrong MCU,
  corruption and unplug regression tests pass with the new firmware image.

Block/runtime:
- Number output, Hardware/Simulation selector and project target roundtrip.
- Hardware responses 0, 0.1, 25, 50, 99.9 and 100 return exact numeric values.
- ERR/-1, empty/malformed, non-finite and out-of-range replies reject.
- Disconnected Simulation reads without serial writes; missing gadget and
  disconnected Hardware are rejected by the existing preflight path.
- Simulation range validation, legacy default, scene restore and saved positions.
- Sensor values connect to variable assignments and retain Simulation provenance.
- Python bridge whitelist and live hardware/simulation.light.read APIs pass.
- Generated Python preview helper was executed against mocked serial input;
  valid/error responses and timeout restoration pass.

Rendered Chrome:
- Light block has both target choices and loads as a numeric reporter.
- Actual simulator picker adds the Light sensor, decimal control and meter;
  slider bounds 0/100 and 73.4% reading synchronize with the runtime.
- The test removes the static picker button to exercise the older/customized
  HTML fallback insertion path from app.js.
- Sensor workspace reload and read-only shared viewer loading pass.

Cumulative checks:
- Existing UI, live routing, hardware numeric inputs, seven-segment text,
  portable archives and serial suites pass against the cumulative source.
- Existing icons, typed variable values, duplicate behavior and RGB options are retained.

Installer fixtures:
- .15 through .22 patch and Git bases, both LF and CRLF.
- Full output hashes, repeat application, exact rollback and new-file cleanup.
- Modified source rejected before writes.
- Customized editor/simulator/sharing HTML, account asset versions, relative URLs
  and other query parameters survive updates. New required script caches refresh.
- Missing/duplicate scripts reject; old backup directories are excluded from --auto.
- Zero or multiple live websites stop without writes.

Physical gadget, real USB upload, Android and production-server deployment were
not tested. Compiling and simulated transport tests do not establish physical acceptance.


# Validation for 3.21.1-ai.22

- RGB color-code and percentage frame/mapping/bounds tests, direct number and variable sockets, Hardware/Simulation routing and existing regression suites pass locally.
- Real Chrome checks cover typed variable values, scoped pointer-following chain duplication, cancellation, undo/redo, connected mouths and shared-project loading; all nine RGB inputs accept direct numbers and variable drops.
- Real Chrome confirms one icon on each statement/event header in the editor, toolbox and shared viewer, with plain inline values, real PNG transparency and no decorative fields in project serialization.
- Installer/CAS apt command contracts cover the 600-second dpkg lock timeout. Deployment assertions cover icon preflight, deployment and rollback asset lists; shell syntax and existing account-install patch checks pass.
- Earlier cumulative local patch installer fixtures cover .15 through .21, line endings, customized pages, backup exclusion and exact rollback.
- Physical hardware, real USB/Android, a full Linux service deployment and production-server deployment were not performed locally.

# Validation for 3.21.1-ai.18

3.21.1-ai.18 local validation

Firmware:
- Rebuilt 1.19.6 from the available CodyPi source and CodyNick library.
  Decoded machine code matches the deployed firmware byte-for-byte (28176 bytes).
- Arduino Uno build of new 1.19.7 succeeds: flash 28466/32256, static RAM 1435/2048.
- New text handler forwards four printable bytes to write_to_sevensegment_Text_V2
  using device 0 or 2; numeric handler remains unchanged.
- Shipped HEX parsed by the real uploader, with checksum/address bounds verified.
- Existing mocked bootloader tests pass for full upload/readback, wrong MCU,
  corrupted readback, unplug, delayed probes, startup noise and retry limits.

Blocks/runtime/Python:
- Directly editable text shadow, string and numeric variables, legacy empty and
  numeric-shadow migration, preserved connected numeric blocks and JSON roundtrip.
- Exact 20-byte text packets for feed, short/blank strings, long-string truncation,
  both device indices and literal spaces/underscores.
- Non-ASCII text and unsupported device rejection; numeric display still rejects feed.
- Simulation text mode, numeric-mode reset and project-state restoration.
- Live Python show_text and unchanged numeric show operations.
- Generated Python preview helper executed against a mocked original client.
- Existing UI, routing, portable-project archive and serial regression suites pass.

Rendered Chrome:
- Direct keyboard entry of feed in the text box.
- Mouse drag of a variable onto the text box.
- Runtime string-variable execution updates the real simulator iframe.
- F, E, E, d segment patterns match the original supplied SevSeg mapping.

Installer:
- .15 diagnostic, .16-fix2, and .17 bases tested with LF and CRLF.
- Complete installed-file checksum validation, idempotent repeat, and byte-exact rollback.
- New firmware file removed on rollback while old files are restored.
- Modified base rejected before writes.
- Auto detection ignores adjacent prior patch backups and rejects zero/multiple live sites.
- Installer fix1 preserves customized simulator HTML, relative script URLs,
  other query parameters and CRLF. Reapplication is a no-op, rollback is exact,
  and missing/duplicate required scripts reject before any writes.

Physical board, real display, real USB upload, Android hardware and production
server deployment have not been tested. The firmware source and build are supplied
for review. Website rollback does not downgrade a board flashed to newer firmware.


# Validation for 3.20.4

- Browser Demo regression executes real Blockly programs with a mocked CJP transport. Checks cross-wired temperature displays, all four LED bands including exact 18/25/30 boundaries on both sources, two separate dashboard histories, moisture on both displays, below-25% C3 alarm/silence at 25%, absence of real soil reads, and joystick motion in all four directions.
- Native Python regression executes the published Python programs through the real codynick.py API and a mocked bridge: all temperature boundaries, independent source colors/displays/logs, moisture values 0/24.9/25/60/100, and all four joystick directions pass. This does not test browser Pyodide.
- Editor/library regression restores all 32 projects in both coding modes (64 restores), checks the three exact Demo titles, Hardware inclusion, subscription/admin fields and landing links. All 32 archives pass ZIP/checksum checks and Python compilation. Demo category render inspected.
- No firmware, account/backend, schema or installer change. Physical boards/sensors, real CAS, browser Pyodide runtime execution and production Linux deployment remain manual.

# Validation for 3.20.3

- Backend: 24 tests pass, including guest/default 60/10 admission, preserved saved runtime overrides, independent cooldown snapshots, early Stop, repeat Finish idempotence, expired limits, cooldown validation, omitted-field compatibility and legacy-run handling. Existing six-column access/run tables remain compatible with 3.20.2 SQL.
- Simulator browser regression passes for target/pot/hot/cold body dragging at multiple points, touch events, keyboard movement, settings/remove controls and independent probes. Drawing/sensing offsets match the prior geometry, temperature/soil contact still registers and overlapping the can still waters the pot. Target headers/footers and pot/cup headers are absent; moisture/temperature readouts remain. Desktop renders were inspected.
- Editor/admin browser regression passes for independent runtime/cooldown fields, field order, saved values and Unlimited disabling/preservation; all thirty examples restore in both editors. Browser checks use local static files with mocked account/run services; touch uses Chrome touch events.
- All thirty project archives pass ZIP/checksum checks and their Python programs compile. Project archive and Blockly runtime regressions pass, as do 14 first-admin tests and Apache patch/idempotence/shell syntax checks.
- The committed 3.20.2 source archive was saved and checked. Cooldown storage is additive; private projects and old table layouts are retained. Server rollback uses the installer's actual backend backup first and website backup second. No production server update/rollback, real CAS or physical hardware test was performed.

# Validation for 3.20.2

- Browser regression passes for the inclusive Hardware category (all fourteen projects), unnumbered catalog/saved titles, and the shared description popover in Blocks, Python and Blocks-only mode. All thirty examples restore in both editors (sixty restores); existing subscription/admin checks still pass. Tests use local static assets and mocked services.
- All thirty archives pass ZIP integrity, manifest checksums and Python compilation. Program code and scene payloads match 3.20.1 except for title comments and saved names. The project archive regression passes; the updated builder parses.
- Firmware, account policy and server installer are unchanged. Physical devices, real CAS and Linux production deployment remain manual.

# Validation for 3.20.1

- CAS/backend: 20 tests pass, including timed guest/example admission, configured free-user duration, cooldown, subscription dates/expiry, Unlimited override, CAS email, admin authorization and idempotent legacy Unlimited migration.
- Browser: subscriptions-library.cjs passes with local static assets and mocked account/run APIs. Checks cover first-example startup, direct example links, guest editing, timed stop/cooldown, category search, all 30 examples restored in both editor modes (60 restores), email display and date preservation across Unlimited toggles. Desktop library/admin and mobile landing layouts were rendered and inspected. Network preview serving was unreliable on this Windows host; the deterministic browser fixture serves the same files directly.
- Project archive and Blockly runtime suites pass. The 14 first-admin tests pass. Apache configuration/idempotence, embedded Python parsing and Git Bash syntax checks pass.
- Linux setup fixtures could not run on this Windows host. The legacy cas/test_accounts.cjs mock lacks document.addEventListener and fails before account logic; the browser regression above covers the changed admin/account flows.
- Physical hardware, real CAS sign-in and production Linux deployment remain manual. Browser execution remains subject to client-side enforcement; guest cooldown identity uses a secure HttpOnly cookie. Example archives and firmware are unchanged.

Previous validation history follows.

# Validation for 3.20.0

- First-admin helper: 14 tests cover a fresh database, an existing pre-policy database, a configured/pending admin, blank input, EOF, unattended configuration, read-only selection, concurrent application, exact-ID handling, preserving private projects/settings, and the unprivileged apply path avoiding root-only config reads. An actual interactive terminal prompt was exercised locally, including capturing only the selected ID for the installer.
- CAS/private projects: 16 tests pass, including first-admin reservation followed by verified CAS sign-in and unlimited admin access. Reservation alone creates neither a user nor a session.
- Apache configuration patch/idempotence and embedded Python parsing pass. setup.sh, install.sh, cas/update.sh and both rollback scripts pass Bash syntax checks. Installer ordering and admin-page deployment/rollback are checked by tests. Linux setup fixture tests were extended for first-admin selection; a complete apt/systemd/VPS installation was not run on this Windows host.
- Existing Node tests pass for actual Blockly/LiveRouter mixed Hardware/Simulation execution, complete project archive roundtrip/rejection, and simulator viewport bounds. Thirty example archives pass ZIP integrity and payload checksum checks; their Python programs compile. The firmware hash matches its manifest and remains unchanged.
- Sensor worlds, Save As, in-button countdowns, account menu and the simple admin checkbox retain the previously tested local implementations (3.19.1–3.19.7). Those local tests cover policy, installer/rollback, browser UI and retained outputs. Python UI cutoff checks used a controlled worker; no new physical-board or production VPS validation is claimed.
- Publishing this release does not itself deploy it. Browser-side execution is not a hostile-client-proof sandbox; server authorization, original-example verification and run/cooldown admission remain enforced.

Previous validation history follows.

# Validation for 3.19.0

The fifteen numbered archives are built from one shared program description for
Blocks and Python. Each ZIP has the seven defined payload files plus a SHA-256
manifest. The builder compiles the Python syntax and is repeatable.

Browser regression: blocks/browser-tests/zone-examples.cjs executes all fifteen
in real Blockly and browser Pyodide (thirty runs), exercises changes on both sides
of thresholds, dashboard inputs/outputs, joystick and stage reactions, initial
configuration, editor selection, zone isolation and Stop. A mocked CJP transport
supplies readings/joystick inputs and records real-output commands. No physical
board is claimed. The actual simulator/router/dashboard/stage implementations
remain active. Additional existing archive/load and Node checks are retained.

The cumulative package is checked for CRC, SHA-256 of every payload, exact firmware
hash and shell syntax. Local installer checksum preflight accepts the package and
rejects a deliberately corrupt copy. The firmware and backend are unchanged.
Linux service/deployment and physical CJP/Android tests remain manual. Publishing this release does not itself deploy it to the server.

Example 12 uses a documented near-edge margin abs(x)>=190 with distance mapped to
[-200,200], so its warning remains reachable at every sprite size. Other edge
examples use the sprite's actual boundary. Sprite size clamps to 10-300 percent.
Green dashboard warning LEDs mean True; red means False. RGB warning outputs use
red for warning, green for normal. Stop leaves hardware outputs unchanged.
