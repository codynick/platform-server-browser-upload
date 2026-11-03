# Demo examples

Each project includes editable Blocks/Python copies and complete initial panel settings. Find these in Examples → Demo. They also remain in Hardware and their existing topic categories. Default first-example loading and subscription run limits are unchanged.

| Project | Hardware needed | Behavior |
|---|---|---|
| Temperature sensor: HW and SIM | CJP, real temperature sensor, standalone seven-segment | Real temperature → simulated display; simulated temperature → real display. Four square LEDs (12–15) on each CJP reflect its own temperature. Separate gauges and history logs show both sources. |
| Soil Moisture: SIM to HW | CJP and standalone seven-segment; no real soil sensor | Insert the simulated probe into the pot and water with the can. Both displays show moisture. Below 25%, real CJP plays a 150 ms C3 beep (~131 Hz) each cycle. At 25% and above no new beep is played. Dashboard gauge/history show moisture. |
| Move Sprite with HW Joystick | CJP with its built-in joystick | Reuses the existing real-joystick sprite project. Up/down/left/right move the sprite; neutral stops movement. |

Temperature color bands: blue below 18°C; green from 18°C to below 25°C; yellow from 25°C to below 30°C; red at 30°C and above. Hardware and simulated temperatures can vary independently. The other LEDs are cleared when the temperature demo starts.

The dashboard history graphs retain the latest 200 samples per source, rather than an unlimited permanent log. The temperature loop waits 0.25 seconds; the moisture loop waits 0.5 seconds after reading/output and an optional short beep. Sensor/transport time adds to each cycle. Real outputs keep their last state on Stop; an already-issued beep finishes its short duration.

Build using `python tools/build-demo-examples.py`. Test native Python behavior with `python tools/test-demo-python.py` and browser Blocks behavior with `node blocks/browser-tests/demo-examples.cjs` (Playwright/Chrome required). Tests mock CJP responses and do not prove physical sensor/board behavior or browser Pyodide execution.
