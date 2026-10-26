# CodyNick Portal 3.4 — Linux connection help

## Install with MobaXterm
Upload CodyNick_Portal_v3_4.zip to /root/. Run as root:

```bash
cd /root
unzip -o CodyNick_Portal_v3_4.zip -d CodyNick_Portal_v3_4
bash /root/CodyNick_Portal_v3_4/install.sh
```

If unzip is unavailable, first run `apt install -y unzip`.

Home: https://code.codynick.com/
Block IDE: https://code.codynick.com/blocks/

Press Ctrl+F5 after installation. No Apache restart or certificate changes needed.
The existing Apache document root must be /var/www/code.codynick.com.

## Android connection
The Connect button automatically uses WebUSB on Android and native Web Serial
on Windows/other desktop platforms. The WebUSB path is scoped to the user's
CH340 board: VID 1A86, PID 7523. No firmware or Windows driver changes are needed.
It initializes 115200 baud, 8N1, no hardware flow control and identifies the CJP
before enabling block execution or showing the green Disconnect button.

On your S23 FE:
1. Disconnect and close the Android USB serial app so it releases the device.
2. Unplug/replug the CJP with the known working adapter/cable.
3. Open https://code.codynick.com/blocks/ directly in Chrome and reload the page.
4. Keep Chrome's Desktop site option off if Android detection is not working.
5. Tap Connect, choose the CH340/USB2.0-Serial device, and grant Android/Chrome USB
   access if prompted. Wait for firmware identification.
6. Run Blink RGB and test Stop. Test Disconnect and reconnect too.

If it fails, open Console and send the connection error and any TX/RX lines.
The log identifies the connection path; on the phone it should say
Connecting using WebUSB CH340 1A86:7523. A successful identity is shown with
WebUSB · CH340. On Windows the connection remains Web Serial.

The USB interface/baud/control initialization, read/write behavior, cancellation,
cleanup and Android routing were verified against simulated USB devices. Native
Windows routing was regression tested. This is an unverified hardware build:
actual CH340 operation on the S23 FE still needs the above physical test.
Only the confirmed 1A86:7523 device is supported by this WebUSB implementation.
Some Android/browser builds may still block USB access or interface claiming.
No additional server services, certificates or permission headers are installed.

## Original appearance
The editor's editor.css is the original index.php inline stylesheet extracted
verbatim, and stage.css and the shared navigation stylesheet are copied from the
uploaded project. The header, toolbar, workspace shell, General/Hardware tabs,
modal and named-design dialog markup come from that source. The original
CodyNickTheme, block builder, event shapes, General toolbox, block recoloring,
Zelos renderer, grid spacing and zoom defaults are reused.

The toolbar now has one Connect button. Successful firmware identification changes
it to Disconnect with a green background and white text. Press it again to
close the connection. If an open port faults, Disconnect remains available to
clean it up; green styling is removed until a successful reconnect.

New, Save, Load, Upload and Download are in the Project dropdown. A second Save
shortcut sits immediately after the design-name field and performs the same
named-design save action. The menu closes on action, outside click, or Escape.
Connection status and examples sit in the existing design bar. The console opens
in a modal using the original modal appearance. View Python uses the original
Python generator for reference; Run still executes through browser Web Serial.
The extra webserial.css contains only connection/console additions and wrapping
needed to fit the new buttons. It does not replace the original editor design.

The original optional sprite stage is collapsed and excluded from this hardware
edition; only General and Hardware modes are offered, as previously scoped.
Sprites, dashboards, simulator and Python execution services are not included.
The root landing page remains; RGB Studio is not restored.

The installer backs up all replaced files and earlier RGB Studio assets to a
unique /root/codynick-portal-backup-* directory. It prints a rollback command:

    bash /root/codynick-portal-backup-EXAMPLE/rollback.sh

Use the exact backup path printed. Rollback also preserves the version it replaces.
Files outside this portal's known paths are left alone. Apache and SSL settings
are not modified. This is a static site: no PHP, Node service, database, or Python
service is installed. The tests are development tools, not server requirements.

## Try it
1. Open the editor in Chrome on your PC or Android phone.
2. Plug the CJP into your computer, with the existing CodyPi firmware and gadgets.
3. Keep the joystick centered during startup. Close other serial applications.
4. Click Connect, choose its COM port, and wait for identification.
5. Click Run on the default Blink RGB example; LED 0 should blink red.
6. Click Stop. Hardware keeps its last commanded output.
7. Try the temperature-display or joystick-light example with the relevant gadgets.

## Blocks and execution
Start once, main loop, wait, forever, repeat, while/until, if/else, comparisons,
arithmetic, text, variables, timer, logging, and break/continue are supported.
Hardware: RGB matrix (index or serpentine XY), LED matrix text/pixels/clear,
sound, joystick, temperature, soil moisture, PIR, RFID, ultrasonic, seven-segment
literal and computed values. Wi-Fi/IoT, sprites, dashboards, simulator, Python
execution, OS keyboard and legacy library-update blocks are not included.
Unsupported imported blocks are rejected before replacing the current project.

Programs execute in the visitor's browser and are not flashed onto the Uno.
Keep the editor open and connected. Background-tab throttling may alter timing.
Run uses a snapshot; edits during execution affect the next run.
Enabled start sections execute in order, then enabled main-loop sections repeat.
A forever loop inside a start section prevents reaching later sections.

Stop interrupts waits and prevents subsequent hardware commands. Already sent
commands may finish. An active sensor request may take up to 2.5 seconds to time
out; after a timeout, disconnect and reconnect before retrying to avoid stale
reply confusion. Ultrasonic values may be cached by firmware. RGB commands have
no hardware acknowledgments. Sound duration is limited to 32767 ms to avoid the
Uno firmware's signed 16-bit parsing issue. LED matrix text is up to 49 printable
ASCII characters; seven-segment values must fit the six-character field.

## Projects
The workspace autosaves in this browser under the same key as the previous
Block Studio package, so compatible existing workspaces are retained.
Save/Load stores named designs in browser storage. Download/Upload transfers
.codynick projects as files. No account or server storage is used. Use downloads
for backups or transfer, and avoid multiple simultaneous editor tabs.
The firmware and supported block IDs are unchanged from the previous release.

## Verification
JavaScript/installer syntax, HTML element references, local asset references,
original stylesheet byte equality, real headless Blockly initialization and
examples, original Python reference generation, runtime controls, firmware
frames, reply matching/timeouts, upgrade cleanup and rollback were checked.
Tests: `node blocks/tests/runtime.cjs`, `node blocks/tests/ui.cjs`,
`node blocks/tests/serial.cjs`, and `node blocks/tests/menu.cjs`, `node blocks/tests/webusb.cjs`, and
`node blocks/tests/android.cjs`.
Graphical browser rendering was not verified in the build environment. Physical
Web Serial and gadget behavior require testing with your CJP.

## Attribution
The user-provided platform-server.zip supplied the bundled Blockly engine and
hardware block definitions. CodyNick.py and CodyPi.ino supplied protocol details.
Bundled notices are retained; see blocks/vendor/blockly/LICENSE.
Python templates in block-specs.js are reference metadata only. The browser
interprets supported blocks directly without running Python or using eval.

CH340 protocol reference and MIT notices: blocks/THIRD_PARTY.md.

## Linux connection help (3.4)
Linux desktops show a Linux USB setup button before connecting. The setup dialog
also opens after a native SerialPort.open() failure on a detected Linux desktop.
It explains dialout membership, full desktop logout/login, busy ports and browser
sandbox restrictions. The failure is not diagnosed as definitely a permission
problem. Copy command uses the clipboard; if unavailable, it highlights the
command for manual copying. No permissions are changed by the webpage.
Android is excluded from Linux detection; its proven WebUSB path is retained.
ChromeOS is also excluded. The dialog appears on request or an open failure,
not as an automatic first-visit interruption.
