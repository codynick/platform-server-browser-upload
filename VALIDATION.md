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
