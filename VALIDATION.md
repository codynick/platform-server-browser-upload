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
