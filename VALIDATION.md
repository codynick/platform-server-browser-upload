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
