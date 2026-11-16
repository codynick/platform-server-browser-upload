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

## AI examples

Open **Examples → AI**, load a project, choose **Blocks** or **Python**, and
press **Run**. Use the controls in **Dashboard**. All eight run without a CJP.

| Example | What you need | First steps |
| --- | --- | --- |
| Read English Text | Included Alice page or your own image | Click **Load sample** or **Browse image**, then **Read Text**. |
| Named Image Workbench | An image file or camera access | Name and upload a photo, select it, then click **Detect Objects**. |
| Person Detector | Camera access | Prepare the detector, allow camera access, then click **Take Picture**. Open **AI** to see the detection boxes. |
| Voice Controlled Light | Microphone access | Click **Start listening**, then say “red”, “green” or “off” and pause. |
| English Speech to Text | Microphone access | Click **Start**, speak English and pause between phrases. |
| Local Text to Speech | A local system voice | Edit **Text**, then click **Speak**. |
| Small Local Text Assistant | About 370 MB of model data on first use | Enter a short question and click **Ask**. |
| Talk and Hear an AI Answer | Microphone access, a local system voice and the speech and text models | Click **Talk**, ask one short English question and pause. |

Allow time for models to load on first use. Start with a desktop or laptop for
the two answer-generation examples. If the browser blocks audio, use the
enable-audio controls for the corresponding tool in the **AI** panel. Press
the editor's **Stop** button when finished.
