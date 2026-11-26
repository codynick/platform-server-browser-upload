# DFPlayer examples and audio mapping

Examples > Demo now includes four additional projects, each with Simulation and
Hardware variants and matching editable Blocks and Python. The previous 13 Demo
entries remain; the total is 21. Loading an example leaves execution stopped.

| Project | Behavior |
|---|---|
| Sound Player Basics | Welcome, lower volume, Happy effect, pause/resume, stop, Hello. Runs once, then waits silently until Stop. |
| Talking Joystick | Announces a new direction or Click once; release between inputs and wait for current speech to finish. |
| Talking Weather Station | Announces air temperature and humidity, using the Air Temp/Hum reporters and signed/decimal number speech. |
| Thirsty Plant | Below 25% soil moisture requests water; after watering announces satisfaction. Only dry/wet transitions trigger speech. LED 0 shows red/green. |

Simulation needs no board. Hardware requires CJP firmware 1.19.10, a Sound Player
with the matching SD card, and the sensors named by each example. Programs run
through the browser; no standalone student program is compiled or uploaded.
Simulation settings (speaker volume/mute and position) save with projects.
Audio does not resume when a saved project is loaded.

## API

Use hardware.dfplayer or simulation.dfplayer:
- await player.is_busy()
- await player.set_volume(50)
- await player.control('pause') / 'resume' / 'stop' / other menu actions
- await player.say_whole_number(21, wait=True)
- await player.say_persian('سلام', wait=True)
- await player.say_phrase('Hello', language='English', wait=True)
- await player.say_number(-12.34, language='English', wait=True, timeout=30)
- await player.play_emotion('Happy', wait=True)
- await player.play_track(folder=1, track=1, large=False, wait=False)
- await player.wait_until_done(timeout=0)

Numeric inputs accept numbers or variables. All blocks have a Hardware/Simulation
selector. Ordinary and until-done blocks are provided for each playback family.
Languages: Arabic, English, German (Deutsch alias), French. Persian-only phrases
have their own menu. Duplicate Persian labels are identified by track number.

## Limits and exact mapping

Whole-number recordings: 0–100. 1–100 uses the gadget's special folder 5/6
sequencing; zero uses the number command to request folder 5 track 128. Larger
numbers belong in multilingual say_number. Number speech rounds to two decimal
places away from zero, with a safe range of ±21,474,836.47 (signed hundredths).
The supplied header's larger clamp can overflow that 32-bit wire format; the
platform rejects overflowing values instead. Integer/decimal composition follows
myTD.h, including minus, zero, decimal-point and thousands/millions vocabulary.

Phrase folders: Persian 02; Arabic 09; English 10; German 11; French 17.
Number folders: Arabic 13; English 14; German 15; French 18.
Emotion tracks: folder 01 tracks 15–19, explicitly named Happy/Sad/Angry/
Surprise/Neutral. The original source contains duplicate numeric prefixes.
Simulation selects 015-Happy.mp3 etc., not the conflicting 015.mp3 etc.
For physical parity, prepare a clean SD card using these selected recordings,
without duplicate track prefixes. catalog.json lists the chosen source filenames.
No original user files were modified.

Generic standard tracks: folder 1–99, track 1–255. Large mode: folder 1–10,
track 1–1000. Hardware can address its SD card; simulation reports a missing
recording if a requested entry is not in the bundled catalogue. Folders 07 and
16, Hafez blocks, and horoscope blocks are excluded. No browser text-to-speech
is substituted for missing files. The original 838 selected recordings load on
demand; they are not all downloaded when the editor opens.

Volume 0–100 maps to the player's 0–30 steps. Simulation next/previous, repeat
all and shuffle use catalogue order; hardware uses the DFPlayer card's order.
Busy is true while playing and between number clips, false while paused.
Simulation until-done uses actual media completion, including pauses and gaps.
Default until timeouts mirror the library: 10 s standard/phrases/whole, 12 s
large tracks, 18 s numbers, 60 s emotions. Python may override timeout. Timeout
0 has no completion deadline. Stop cancels browser playback/waits and sends
the hardware stop command. The supplied STM32 firmware processes long number
speech synchronously, so a hardware stop command may take effect only after
that number's sequence finishes; this patch does not flash the STM32 gadget.

Chrome user interaction (Run) is required to enable sound. The simulator pane
can be hidden while audio continues in the editor. Physical-device testing is
still required to confirm the installed SD card and exact audible match.

Optional clean SD layout: python3 tools/prepare-dfplayer-sd.py EMPTY_OUTPUT_DIRECTORY
Run this from the repository checkout. It copies the selected recordings to
numbered folders, with one file per track and no Hafez/folder 16. It refuses a
nonempty destination and does not modify the source audio or format any card.
Hardware loop-all/shuffle operates on whatever is on its SD card; use this clean
selection if those modes must also exclude Hafez.
