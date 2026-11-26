# Welcome projects in Demo

Five projects, each with separate Simulation and Hardware entries, are added to
Examples > Demo. The three existing demos remain unchanged. Both editable Blocks
and browser Python programs are included, with a CJP simulator scene and stopped
initial state. Hardware entries require a CJP; keep the browser connected.

| Project | Try this |
|---|---|
| Joy Pixel Walker | Move the joystick. The cyan pixel stays inside the 4x4 grid. |
| Mood Light Composer | Watch calm, happy and alert colors. Change mood_seconds. |
| Speed Switch | Move the joystick; click toggles blue/slow and green/fast. Holding click toggles only once. |
| Countdown Signal | 16 LEDs count down, turning yellow with 8 left and red with 4 left, then flash white and restart. Change step_seconds. |
| Pattern Memory | Click to start. Repeat the growing random sequence using Up=top red, Right=right yellow, Down=bottom blue, Left=left green. Release between moves. |

In Simulation, use the CJP directional buttons and center click. Select a language
and Run. Stop ends either program. Loading an example never starts execution.
Hardware outputs retain their last state on Stop. No standalone program is flashed.

Pattern Memory starts with one step and adds one after each correct round. Green
means correct; red means wrong/10-second timeout; white means all six rounds won.
Release and click to restart. Its numeric sequence_code stores four possible
choices as base-4 digits. length preserves leading zero (Up) steps; position
selects a digit by division, rounding down and subtraction. This avoids requiring
list blocks. Python intentionally uses the same algorithm as the Blocks program.
The game waits for directional release between answers, preventing a held button
from being counted twice. The timer starts when waiting for each new answer.

Original project descriptions: https://codynick.com/welcome_projects.php
These are new implementations of the described activities, not mBlock imports.

Software checks use mocked hardware; physical board behavior was not validated.
