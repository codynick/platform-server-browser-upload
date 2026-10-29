# Complete example projects

Every Examples item is a .codynick ZIP containing both Blocks and Python source,
Design names, dashboard/widgets/layout, a clean simulation scene and sprite setup.
Loading from either editor preserves the selected language and leaves execution
stopped. Both programs and all scene configuration are replaced after confirmation.
Widgets appear before Run; momentary buttons restore released. Run executes setup
again and may reset widgets. The catalogue is ../python-examples.json; its archive
field selects the file. Code and initial state live in the archive itself.

| Example | Hardware required |
| --- | --- |
| Hello Python | None |
| Pretend sensor → dashboard and LED | None |
| Real temperature → dashboard and pretend LED | CJP and temperature sensor |
| Real and pretend readings → opposite displays | CJP, temperature sensor and standalone seven-segment display |
| Blink a real CJP light | CJP |
| Real temperature → display and dashboard | CJP, temperature sensor and standalone seven-segment display |
| CJP joystick click → real light | CJP |
| Sprites: arrow-key movement | None |
| Sprites: simulated temperature | None |
| Sprites: real CJP joystick | CJP |
| Dashboard: buttons, slider and LEDs | None |
| Dashboard: control a sprite | None |

Use Open Dashboard and Open Stage to view/control separate panels while keeping
the original editor open. Hardware examples require the expected CJP firmware and
the gadgets named in their help. Older JSON project files are not converted.
File → Download Project saves both programs and the current scene as a new archive.
