# Numbered zone examples

Each `.codynick` ZIP includes matching Blocks and Python, saved panels, widget layout and sprite state. Load via Examples or File > Open, select a language, then Run. Loading leaves execution stopped. Hardware examples require a connected CJP with gateway firmware; no autonomous firmware is compiled.

Use Open Dashboard / Open Stage for side-by-side interaction. Green dashboard Warning/Edge means True; red means False. A red RGB hardware/simulation LED means the warning is active.

| Project | Required hardware | Try this and expected result |
|---|---|---|
| 1. HW - Real Sensor and Light | CJP and temperature sensor | Try warming the real temperature sensor. Above 30 C, RGB LED 0 turns red; otherwise green. |
| 2. Sim - Simulated Sensor and Light | None | Open Simulation and change temperature across 30 C. Simulated RGB LED 0 turns red above 30 C and green otherwise. |
| 3. Dash - Dashboard Control Desk | None | Open Dashboard. Hold or tap Hold; Held follows the press and Taps counts clicks. Power controls Enabled; Level controls Reading. |
| 4. Sprite - Move the Bee | None | Open Sprites or Open Stage, then focus the stage. Arrows move and bounce the Bee; hold Space to hide it, release to show it. Press the stage to enlarge it. |
| 5. HW + Sim - Real Meets Simulated | CJP, temperature sensor and standalone seven-segment display | Open Simulation. Real temperature appears on the simulated seven-segment display. Change simulated distance: the real standalone display follows. |
| 6. HW + Dash - Hardware Control Desk | CJP and temperature sensor | Open Dashboard. Temperature and History show the real sensor. Enable Light and adjust Level: RGB LED 0 turns red above the selected temperature threshold, green below it; disabling Light turns it off. |
| 7. HW + Sprite - Joystick Pilot | CJP (built-in joystick) | Move the real CJP joystick: the sprite follows. At the stage edge, real RGB LED 0 turns red; otherwise green. |
| 8. Sim + Dash - Virtual Instrument Panel | None | Change temperature in Simulation: Dashboard follows. Toggle Light in Dashboard: simulated RGB LED 0 turns green when enabled, off when disabled. |
| 9. Sim + Sprite - Temperature Balloon | None | Change simulated temperature: Ball size and speech change (size clamps safely to 10-300%). Arrows move it. At the stage edge simulated RGB LED 0 turns red; otherwise green. |
| 10. Dash + Sprite - Sprite Control Desk | None | Open Dashboard and Open Stage side by side. Hold Move to advance and bounce the Bee; Visible hides/shows it; Size resizes it; Position reports x. |
| 11. HW + Sim + Dash - Compare Real and Simulated | CJP and temperature sensor | Change simulated temperature and warm the real sensor. Compare gauges and histories. Threshold independently makes each matching real/simulated RGB LED 0 red above it and green otherwise. |
| 12. HW + Sim + Sprite - Two Worlds, One Sprite | CJP and temperature sensor | Real temperature changes sprite size. Simulated distance maps 2-400 cm onto x=-200 to 200. Near either edge (abs(x)>=190), both RGB LEDs 0 turn red; otherwise green. |
| 13. HW + Dash + Sprite - Joystick Mission Control | CJP (built-in joystick) | Open Dashboard and Open Stage. Move the real joystick; Speed controls each movement step. X/Y show position and Edge lights green at a boundary. |
| 14. Sim + Dash + Sprite - Virtual Weather Station | None | Change simulated temperature and Dashboard Threshold. Above the threshold, the sprite becomes a Cactus and says Hot; otherwise it becomes an Apple and says Comfortable. Dashboard shows reading, history and warning. |
| 15. HW + Sim + Dash + Sprite - Smart Greenhouse | CJP and temperature sensor | Warm the real sensor or change simulated soil moisture. Set Max temperature and Min moisture in Dashboard. Too hot OR too dry makes both RGB LEDs 0 red, Warning green, and the Cactus large with Check greenhouse speech. Otherwise both RGB LEDs are green and it says Healthy. |

Validation: the automated suite uses actual Blockly execution and real browser Pyodide with a mocked CJP transport. This verifies software routing and reactions; it does not validate physical sensors or a real board.
