## 3.20.3 — independent cooldown and body dragging

- Default guest/free runs to 60 seconds with a separate 10-second cooldown after completion or early Stop. Preserve existing saved per-user runtime values. Add per-user Cooldown immediately after Maximum runtime in Admin; Unlimited/admin access ignores both settings.
- Store cooldown preferences and per-run snapshots in separate additive tables, preserving the existing access/run schemas for rollback. Optional DEFAULT_RUN_SECONDS and DEFAULT_COOLDOWN_SECONDS server configuration persists across upgrades.
- Remove target headers/footers and pot/cup headers. Drag their bodies with mouse, touch or keyboard; keep pot moisture/cup temperatures and settings/remove overlays. Controls and probes remain independent; existing sensing coordinates are retained.
- Preserve the 3.20.2 source revision for rollback. The installer still prints separate backend and website rollback commands; restore backend first, website second, retaining private projects/database.
- Automated checks use mocked services and sensors. Production Linux and physical-device validation remain manual.

## 3.20.2 — hardware examples and shared project information

- Remove numeric prefixes from example titles in the library, editor choices, saved names, Python title comments and reproducible zone builder. Refresh the fifteen affected archive checksums.
- Add an inclusive Hardware category containing all fourteen real-hardware projects, including mixed projects; retain their other categories.
- Show the project description info button in both Blocks and Python, including Blocks-only mode. Both views use the saved project description and the same popover.
- Check archive integrity and all thirty examples in both editors using mocked services; physical hardware and Linux production deployment remain manual.

## 3.20.1 — subscription dates and example library

- Add UTC subscription start/end fields and a date-independent Unlimited override; preserve CAS email in admin list and account details.
- Add searchable example categories and editable personal copies; load the first catalog example or the requested landing-page example automatically.
- Apply per-run limits and the existing cooldown to every free/guest run, including examples; guests have 20 seconds per run and local project download.
- Adopt the supplied interactive landing page with direct featured-example links. Published example archives remain unchanged.
- Automated checks use mocked services/hardware. Physical device and Linux production deployment validation remain manual.

## 3.20.0 — cumulative sensor worlds, account access and first-admin setup

- Publish the accepted local releases: water cups and extendable temperature probe; ultrasonic targets; soil pots, automatic watering can and moisture bar; three paired Sensor Test examples; Save As; read-only example code; per-user free runtime/cooldown; username menu; and the simple Unlimited checkbox admin panel. Admin accounts are unlimited automatically. Stopping preserves Hardware, Simulation and Dashboard outputs.
- Ask for the first admin CodyNick ID during installation/update only when no admin is configured. Collect it before website deployment; support CODYNICK_ADMIN_ID for unattended installs. A fresh-install ID is reserved for matching CAS sign-in without creating a password, account or session. Existing admins and private projects are retained.
- Deploy and roll back the admin page with the rest of the website. Keep frontend/backend cache references aligned. Validation and limits are recorded in VALIDATION.md; no physical-device or production VPS validation is claimed.

## 3.19.7 — simple unlimited subscription checkbox (local patch)

- Replace subscription names, dates, Unlimited action and Cancel subscription action with a single Unlimited subscription checkbox and Save. Ticking/unticking is applied only by Save.
- Disable run/cooldown seconds when Unlimited is checked. Admin accounts show a checked, disabled checkbox automatically; switching back to User restores the explicit user selection.
- Retain account access checks, code/example protections and data-preserving rollback. No pushed deployment or physical-device validation.

## 3.19.6 — unlimited administrator and manual unlimited access (local patch)

- Automatically grant unlimited runtime and no cooldown to admin accounts, regardless of subscription dates.
- Add an Unlimited button to the admin panel to save permanent unlimited subscription access for any account, without granting the Admin role. Show Unlimited in subscription status and the account list.
- Retain Save As, in-button countdowns, read-only examples, environment interaction, output-preserving stop, compatibility checks and rollback. Accept 3.19.3, 3.19.4 and 3.19.5. No pushed deployment or physical-device validation.

## 3.19.5 — Save As dialog, button countdowns and account menu (local patch)

- Open a named Save As dialog, save a complete independent copy, and load that saved copy as the active editable project. Keep the original example unchanged.
- Show free-account runtime and cooldown inside the Run button: Run, Stop (n sec), disabled Wait (n sec), Run. Remove the separate status/countdown text.
- Replace separate account controls with the username button and a Subscription/Sign out menu. Show subscription status and end date; include Admin Panel only for admins.
- Retain the access policy, default 20-second duration, per-user admin settings, output-preserving stop, compatibility checks and data-preserving rollback. Accept 3.19.3 or 3.19.4. No pushed deployment or physical-device validation.

## 3.19.4 — Save As and manual account access (local patch)

- Add Save As for an independent cloud copy of both programs and complete environment. Keep example Blocks/Python read-only for all accounts until Save As; allow environment interaction.
- Guests can run original examples without a time limit but cannot create, edit, import or save code/projects. Free users can edit/save personal projects with a default 20-second run and matching cooldown; admins set the duration per user. Subscribed users have no policy run/cooldown limit. Example runs remain unlimited for everyone.
- Add server-backed account roles, subscription dates, run admission/cooldown persistence, original-example code verification, and an admin page with audited manual changes. Never remove the last admin. Stop execution without clearing Hardware, Simulation or Dashboard outputs.
- Use short colored access labels and preserve horizontal category tabs. Deliver only a local checked patch, backup and rollback; no pushed upgrade or physical-device validation.

## 3.19.3 — soil moisture and automatic watering (local patch)

- Add soil pots and a reusable bare watering can; overlap tilts the can 45 degrees and waters automatically. Double-click the can to remove it or a pot to reset moisture to zero.
- Show moisture with a bottom progress bar. Remove soil timing/speed controls; double drying and drainage rates for sandy, loamy and clay soil while retaining soaking differences and the extendable two-prong probe.
- Include all three simulation-only Sensor Test examples: Temperature, Ultrasonic and Soil Moisture, with paired Blocks/Python programs.
- Targeted cumulative patch accepts supported 3.19.1 and 3.19.2 files, preserves deployed editor HTML, and includes backup and rollback. No backend, firmware or database changes. See patch VALIDATION.txt for test limits.

## 3.19.3-preview.3 — interactive soil and watering can (local preview only)

- Simplify the can to an unframed, button-free reusable draggable image; overlapping a pot tilts it 45 degrees and waters automatically, while moving away stops watering. Double-click removes the can.
- Remove soil timing, speed and pause controls. Show live moisture as a bar in the pot bottom strip instead of a header number; double all three soil types’ drying/drainage rates; double-click a pot to reset its soil and surface water to zero. Retain the extendable two-prong probe, soil-type settings and other existing assets.
- Include Sensor Test: Soil Moisture with matching simulation-only Blocks/Python, saved garden state, simulated display and threshold LED. Rebase saved state on load; automatic watering depends only on can/pot overlap.
- This build is isolated localhost preview work. No production deployment, installer, physical-device validation or original-project modification is claimed.

## 3.19.3-preview.2 — simplified watering and dry reset (local preview only)

- Replace the framed watering can and Pour/Refill buttons with a reusable draggable image that tilts 45 degrees and waters automatically on pot overlap. Double-click removes the can.
- Remove soil time, speed and pause controls; display live moisture in the pot header. Double-click the pot to reset moisture and surface water to zero.
- Preserve soil types, the two-prong probe and the simulation-only example. Verify the interactions in the browser; no original project or server changes.

## 3.19.3-preview.1 — interactive soil and watering can (local preview only)

- Add separate soil pots and finite 500 ml watering cans. Hold Pour/Refill, placement-dependent water landing, gradual soaking, soil-type drainage/drying, surface pooling and overflow.
- Add an extendable two-prong soil probe, world/manual sensing, a simulation clock with 1x/10x/60x/300x speeds and pause, and per-pot gear settings for soil type and starting moisture. Preserve the existing simulator and previous assets.
- Include Sensor Test: Soil Moisture with matching simulation-only Blocks/Python, saved garden state, simulated display and threshold LED. Rebase saved clocks and cancel held pours on project load; short pour leases and pointer/keyboard/visibility cleanup prevent stuck watering.
- This build is isolated localhost preview work. No production deployment, installer, physical-device validation or original-project modification is claimed.


## 3.19.2 — simulation-only sensor tests and ultrasonic targets (local patch)

- Add a movable/resizable target block, rotatable 30-degree ultrasonic detection cone, scale-independent 2–400 cm surface-distance sensing, and zero for no echo. Preserve manual ultrasonic inputs unless world sensing is enabled. UltraSeg remains manual in this patch.
- Add a Sensor tests Examples group with Sensor Test: Temperature and Sensor Test: Ultrasonic, each containing matching Blocks/Python and complete simulation-only scenes, simulated seven-segment readings, and CJP LED warnings. No dashboard, sprites or hardware actions.
- Keep water cups/temperature probe, include world state in saved projects, and perform sensor calculations in shared live state even with the simulator hidden.
- Deliver a targeted 3.19.1-to-3.19.2 patch with baseline checks, original-file backup, failure recovery and rollback. Preserve deployed editor HTML while updating required script references and adding the example-group script. No backend, firmware or database changes.
- Validation and production/physical-device test limits are listed in VALIDATION.txt in the patch.

## 3.19.1 — interactive water assets (local server upgrade)

- Add movable hot/cold water cups, per-cup gear temperature dialogs, and an extendable temperature probe without replacing the simulator stage or gadget controls.
- Save cups and probe state inside complete projects. Compute gradual water/air response in shared live state so sensor reads also work without an active simulator view. Keep manual temperature controls when no cups are present.
- Supply a checksum-verified, baseline-checked local upgrade with file backups, automatic recovery on installation failure, and explicit rollback. Installer revision r2 preserves deployed editor HTML and patches only the two required local script cache versions. Accounts, projects database, firmware and services are not modified.
- Browser and automated validation are documented in the upgrade package; physical hardware and production Linux deployment are not claimed as tested.

## 3.19.0 — numbered zone examples

- Publish fifteen complete numbered examples covering each of Hardware, Simulation, Dashboard and Sprite, every pair, every triple and all four together.
- Include matching Blocks/Python code, Design names, help, clean simulation scenes, dashboard widgets/layout and sprite setup in each `.codynick` archive. Put these examples first and retain the twelve existing choices.
- Add a shared-program example builder and thirty browser execution checks with mocked CJP responses; confirm all twenty-seven examples restore correctly from both editors. Physical CJP/Android and Linux deployment checks remain manual.
- Promote the tested local preview, update versioned assets and release documentation, and retain the existing GitHub upgrade and local ZIP rollback paths. No firmware/backend/schema changes are included.

## 3.19.0-preview.1 — numbered zone examples (local update only)

- Add fifteen complete `.codynick` projects covering four individual zones, six pairs, four triples and all four together. Titles use number, target zones and project title; new examples use “simulated” terminology.
- Every new archive contains matching Blocks/Python programs, Design names, instructions, clean simulation/dashboard/sprite configuration and saved dashboard layout. Put the numbered examples first in both editors and retain the twelve existing choices.
- Include a reproducible shared-program builder, usage table and browser regressions for all thirty program runs. Hardware interactions are mocked in automated tests; physical CJP/sensor and Linux deployment validation remain manual.
- Supply separate project files and a cumulative checked ZIP with the existing local update/rollback scripts. GitHub remains unchanged; no firmware/backend/schema change is included.

## 3.18.0 — cumulative browser platform release

- Preserve the supplied HEX file's exact bytes in Git so the packaged firmware checksum remains valid; AVR program content/version is unchanged.

- Publish all local previews since 3.12.0: the browser-native sprite stage, eleven appearances, Blocks/Python stage APIs and keyboard/pointer/touch controls.
- Add Open Stage, a separate tab linked to its originating editor, with live pose/appearance/speech and forwarded inputs; preserve editor isolation and invalidate held input on Stop/reset/disconnection.
- Add momentary buttons, persistent toggles, stepped numeric sliders and red/green boolean LED outputs, including the round metallic push-button appearance and paired no-hardware examples.
- Replace .codynick JSON with complete ZIP project archives containing both programs, names, editor and dashboard/simulation/sprite state. Account Save/Load stores the same logical snapshot; momentary input is restored released.
- Convert all twelve supplied examples to complete archived projects. Load both programs and the full initial scene from either editor, preserve the chosen language and leave execution stopped. Validate before replacement and block Run while loading.
- Rename the Python tab, retain syntax colouring/compact layout and .py import/export, and version shared editor/stage assets together.
- Provide the normal GitHub one-command upgrade and a checked cumulative ZIP. Retain older revision history. No backend schema migration or firmware change is required; old project formats are not converted.
- Software browser/Node and package checks are recorded in VALIDATION.md. Physical hardware/Android and production deployment of this revision are not claimed.

## 3.17.0-preview.1 — Open Stage in a separate tab (local update only)

- Add Open Stage beside Open Simulator/Open Dashboard, opening a responsive standalone stage linked to its originating editor.
- Reuse the existing sprite renderer/assets and mirror current pose, appearance, size, backdrop, visibility and speech for both Blocks and Python programs; forward focused keyboard, pointer and touch inputs to the editor.
- Keep controls working when the embedded stage is hidden; release input on focus loss/cancellation/close and expire abandoned holds. Stop, Run and project resets invalidate stale input messages.
- Isolate editor sessions with separate channels, detach and clear stage views on account reset, and show connection/program status. The program continues to run in the original editor, which must remain open.
- Version editor/stage script and stylesheet URLs so updated shared rendering code loads consistently after an upgrade.
- Supply a cumulative checked ZIP with the previous complete-example and dashboard improvements. GitHub and the original checkout remain unchanged; physical CJP/Android and VPS deployment are unvalidated.

## 3.16.0-preview.1 — complete archived examples (local update only)

- Convert all 12 supplied examples to full .codynick ZIP projects containing both Blocks and Python source, matching Design names, dashboard configuration/layout, a clean simulation scene and sprite setup.
- Use one complete-project loading path for Examples in both editors, preserving the selected language and leaving execution stopped.
- Confirm replacement of both programs and all scene configuration; verify archive integrity and validate state before applying. Cancelled/invalid loads preserve the current project.
- Populate dashboard controls/indicators/readings and saved layouts immediately before Run; remove unrelated widgets and gadgets from prior projects. Restore momentary inputs released and use example initial toggle/slider/LED values.
- Make the shared chooser metadata point to authoritative archive files rather than loading separate Python-only source. Add Hello to Blocks and align mixed-temperature colour logic and sensor/dashboard counterparts.
- Include all earlier local features and original round push-button artwork in a cumulative checked ZIP. GitHub/original checkout are unchanged. Physical hardware/Android and VPS deployment remain unvalidated.

## 3.15.1-preview.1 — round dashboard push button (local update only)

- Replace the rectangular momentary button with original CSS artwork: a raised red circular cap and metallic rim, inspired by the supplied visual reference.
- Add a depressed appearance while held and a visible Pressed/Released label; retain an accessible button name, keyboard focus ring and reduced-motion support.
- Allocate enough card height for the round control, title and state label. Preserve momentary/tap behaviour and both examples in Blocks/Python.
- Supply a cumulative checked local ZIP; GitHub and the original checkout remain unchanged. Physical hardware/Android and VPS deployment of this revision are unvalidated.

## 3.15.0-preview.1 — dashboard inputs and boolean LED indicators (local update only)

- Add momentary buttons, persistent toggle buttons, numeric sliders and boolean LED outputs; green means True and red means False.
- Add Dashboard Inputs/LED Blocks categories and browser Python creation/read/write APIs; input reads use await in Python while output writes retain the existing ordered notification API.
- Support held-state reads plus queued/consumable button taps, pointer/touch and keyboard input, slider range/step/initial values and direct numeric entry.
- Release momentary inputs on focus loss, touch cancellation, hidden pages, Stop and project restore; owner isolation and a short heartbeat lease prevent stuck presses. LEDs reject user-input writes.
- Share inputs/outputs with embedded and separate dashboards in the same browser. Save toggle/slider/LED values in .codynick/account snapshots; exclude held buttons, input ownership and queued taps.
- Add two no-hardware examples in both languages: Dashboard buttons/slider/LEDs with tap counting, and dashboard control of a sprite.
- Deliver a cumulative checked local server ZIP, with existing website rollback. GitHub and the original checkout remain unchanged. Browser/Node software checks pass; physical CJP/Android and VPS deployment of this revision remain pending.

## 3.14.0-preview.1 — complete projects and sprite appearances (local update only)

- Rename the Python tab to Python.
- Add Ball, Bee, Bird, Dog, Athlete, Cactus, Apple, Apartment, Bike and Diamond alongside Rocket; select appearances in the stage or change them with Blocks/Python.
- Add original local SVG assets and an extendable catalogue, documented in APPEARANCES.md.
- Replace .codynick JSON with a ZIP container holding both programs, independent Design names, editor selection, Python console/cursor, simulation gadget positions/readings/outputs, dashboard widgets/history/layout, simulator camera and sprite starting/current state.
- Unify File New/Upload/Download and private account Save/Load across both editors; retain separate Import/Export Python .py items. Reopening restores state with programs stopped; connections, held inputs, pending sounds and Python runtime memory are excluded.
- Validate ZIP size, directory, streamed expansion, CRC and SHA-256 before applying; reject old project formats and malformed state. Convert supplied project examples to the new ZIP format.
- Include the previous local sprite preview and all published browser Python improvements. No GitHub push or original-checkout change. Browser software checks pass; physical CJP/Android and production deployment of this revision remain unvalidated.

## 3.13.0-preview.1 — browser-native sprite stage (local update only)

- Add a Sprites space with one rocket, 480×360 coordinates, three backdrops, motion, glides, edge bouncing, speech, size and visibility controls.
- Add Motion, Looks and Sensing blocks plus an awaited codynick.stage Python API using the existing worker bridge.
- Support focused keyboard input, pointer sensing and touch direction buttons; release input on blur, hidden views and Stop.
- Save Block starting settings with project files/account designs; Python examples configure the stage in their source. Runtime motion does not overwrite saved settings.
- Include keyboard, simulated-temperature and real-CJP-joystick examples in both languages; retain shared simulation/dashboard functionality.
- Supply a standalone server ZIP with integrity checks and website rollback. The original Git checkout and GitHub are unchanged; no older sprite compatibility is included.
- Desktop and emulated-touch software validation is performed locally. Physical Python CJP/Android acceptance remains pending.

## 3.12.0 — cumulative platform upgrade

- Combine all firmware, Python pilot, dashboard and interface updates through 3.12.0-pilot.6 in one complete manual upgrade package.
- Include confirmed CodyPi firmware updates with integrity checks, progress, read-back verification, Android bootloader synchronization and retry diagnostics.
- Include browser Python, seven prepared examples, syntax coloring, shared hardware/simulation/dashboard routing, Run/Stop, Console and meaningful errors.
- Preserve gauge animation state on live updates, display example names in Design, and remember separate Blocks/Python names.
- Include compact Python layout: status below Console, click-to-open example information, and context-sensitive File actions.
- Update README revision history and provide package integrity verification, website backup and rollback; publish the cumulative source on GitHub main.
- Python account Save/Load remains unavailable; physical Python CJP/Android validation is still pending.

## 3.12.0-pilot.6 — compact Python editor controls

- Move Python status messages below the Console and remove the empty category/status row above the editor.
- Put example descriptions in a click-to-open information bubble beside Design; support outside-click and Escape dismissal.
- Remove the separate Open/Download toolbar; route File menu actions to Open Python File, Download Python File and New Python Program in Python mode.
- Restore Blocks file actions when switching back; keep Python account Save/Load unavailable and document this in the info bubble.
- Name opened Python files in Design and use the current Design name for Python downloads.

## 3.12.0-pilot.5 — show example names in Design

- Set the Design field to the selected example title after successful loading in Blocks and Python.
- Preserve each editor's Design name when switching between their independent programs.
- Keep the existing name when an example replacement is cancelled or fails.

## 3.12.0-pilot.4 — stable live dashboard updates

- Update values in existing dashboard widgets instead of rebuilding all cards on each sensor reading or graph sample.
- Preserve the gauge needle/fill animation state so readings transition directly without restarting at zero.
- Continue rebuilding when widgets are added, removed or reconfigured; retain live info and graph updates.
- Apply to both Blocks and Python, including embedded and standalone dashboards.

## 3.12.0-pilot.3 — Python syntax coloring

- Add locally bundled coloring for Python keywords, await, strings, multiline strings, comments, numbers, built-ins and definition names.
- Preserve native typing, text selection, file operations, line numbers, error selection and horizontal/vertical scrolling; provide a forced-colors fallback.
- Include the change in the manual server ZIP with package checksums, backup and rollback support.
- No Python API, firmware or account-storage changes.

## 3.12.0-pilot.2 — manual server test package

- Provide a complete ZIP and update-local.sh for updating the existing website directly from extracted files, without fetching GitHub.
- Enable the Python tab by default through a small configuration file; allow ?python=0 to hide it for a visit.
- Verify package and firmware checksums before installation; reuse the website backup/rollback mechanism and print a simple rollback command.
- Keep CAS configuration, backend and private project storage unchanged; no firmware is flashed during installation.
- Python account saving and physical Python hardware/Android validation remain pending.

## 3.12.0-pilot.1 — local browser Python pilot

- Add opt-in Blocks/Python tabs with a basic Python editor, line numbers, Open/Download .py, Console and error-line selection.
- Run Python in a dedicated worker with top-level await, shared hardware/simulation/dashboard routing, and worker termination for Stop.
- Provide Python counterparts of all six block examples plus a no-hardware introduction; no AI or IoT API.
- Keep Blocks project formats and account saving unchanged; Python file saving is explicit and separate in this pilot.
- Disabled at ordinary URLs; enable locally with /blocks/?python=1. No deployment or GitHub push is part of this revision.
- Physical Python hardware/Android validation remains pending. See PYTHON_PILOT.md for setup, test scope and rollback.

## 3.11.5 — program error alerts and revision history

- Show a browser alert as well as status/Console output when a program fails to start or ends with an error, including missing sensors and hardware disconnection.
- Restore program controls and stop live updates before displaying a runtime error alert.
- Keep normal completion and the user's Stop action free of error alerts.
- Include documented revision history at the end of README.md; require updates for every release.
- User confirmed successful desktop firmware upload after 3.11.3 and mobile upload after 3.11.4.

## 3.11.4 — Android bootloader synchronization

- Retry STK500 synchronization within each reset window instead of one early probe.
- Match CH340 driver control-line values using the complete 16-bit complement.
- Log synchronization attempts and failing upload stage; freeze progress on error.
- Physical Android acceptance remains required; this addresses identified handshake weaknesses, not a confirmed device diagnosis.

## 3.11.3 — firmware download integrity and visible progress

- Preserve exact HEX bytes in Git and normalize new releases before hashing.
- Correct the deployed firmware checksum mismatch caused by Git line endings.
- Show persistent download, upload/read-back, restart, completion and failure progress.

## 3.11.2 — CJP firmware installation

- Check the deployed CodyPi firmware version on connection; bundle release 1.19.6.
- Request confirmation before installing older or unidentified firmware.
- Add Uno STK500v1 upload through Web Serial and CH340 WebUSB, with MCU signature checks, page read-back verification, post-reset identity confirmation and retry handling.
- Keep simulation available after declining installation; block hardware for mismatched versions without downgrading newer firmware.
- Add checksum-addressed firmware packaging and update instructions.
- Use codynick/platform-server-browser-upload for bootstrap, checkout, and documentation.
- Automated upload/connection tests pass; physical CJP desktop/Android acceptance remains required.

## 3.11.1 — clean installation repair

- Create HTTP and HTTPS site before deploying any application/CAS components.
- Correct bootstrap repository to codynick/platform-server-browser-upload.
- Install complete extracted ZIP directly without fetching other source.
- Retry/repeat installation tests and early DNS/TLS failure checks.
- Include latest centered header controls and dedicated Examples button.
- First-install CAS endpoint/attribute prompts; preserve configured installs.

## 3.11.0

- Bundle CAS and private projects into the same setup.sh install/update flow.
- Derive callback and central-logout return URLs from the selected domain.
- Place account controls at top right with username only below the button.
- Remove legacy-browser import and cleanup controls.
- Preserve 3.10.2 compact standalone tool headers and current simulator features.
- Refresh Apache integration on repeat installs, including confirmation policy.
- Add sanitized request timing diagnostics; live login latency remains unverified.
- Retain identity confirmation until CAS supports correlated automatic login.

# v3.10.2 — 2026-10-27

- Keep standalone tool branding, title and Block Editor on one compact header row.
- Remove the forced empty navigation row; allow natural wrapping on narrow screens.
- Preserve compact logo-free headers in embedded views.
- Verify both desktop headers stay within 80 px in Chrome.

# v3.10.1 — 2026-10-27

- Right-align Block Editor in the top navigation row of standalone tool pages.
- Hide simulator/dashboard logos in embedded views and reduce header height.
- Isolate the coding workspace stacking context so scrollbars stay behind menus.
- Add actual scrollbar/menu overlap hit-testing to the Chrome regression suite.

# v3.10.0 — 2026-10-27

- Added the supplied transparent wide CodyNick logo across page headers and About.
- Put standalone Block Editor navigation on a separate left-aligned row.
- Added pointer-anchored simulator wheel zoom and background drag-to-pan.
- Added double-click/Home fit recovery and keyboard camera controls.
- Added left-side gadget removal crosses and right-side drag grips.
- Removed Fit Stage, 1:1, the global remove button and Browser simulator text.
- Included the new logo in installer backups and rollback.

# v3.9.0 — 2026-10-27

- Matched simulator/dashboard headers; hide Block Editor links in embedded views.
- Styled and left-aligned the panel's new-tab buttons.
- Added grouped, polished File/Advanced menus with icons and clear focus states.
- Use each graph title for its default legend, preserving named multi-series data.
- Added child-friendly built-in example names without changing their IDs.
- Enabled plain mouse-wheel canvas zoom; toolbox wheel scrolling is preserved.
- Keep block arguments and target choices inline, including imported projects.

# v3.8.0 — 2026-10-27

- Replaced Project menu with File; added Project suffix to file actions.
- Added an Examples chooser and moved Console/Python/Linux help into Advanced.
- Removed Main Panel from the blocks toolbar; moved Hide Spaces before Connect.
- Combined Run/Stop into one green/red button, with connection status beneath it.
- Replaced the simulator's permanent gadget sidebar with an Add gadget picker.
- Styled About with a border, version badge and release date.
- Python reference preview behavior is unchanged.

# v3.7.0

- Added Edit/Lock layout, grid-snapped card movement and corner resizing.
- Added keyboard arrow controls, drag cancellation and Reset layout.
- Preserve per-widget layout separately from program state across runs and tabs.
- Compact info, medium gauge and wide graph defaults with responsive placement.
- Smaller independent graph axis text, compact numbers and adaptive tick labels.
- Make the mixed-display regression wait for a complete sample before Stop.

# v3.6.1

- Ask for the website domain during first setup; remember it for updates.
- Use the selected domain for deployment paths, Apache, HTTPS and rollback.
- Let Certbot reuse a valid matching certificate or obtain/renew it as needed.
- Show version 3.6.1 in Project > About.

# v3.6.0

- Added setup.sh for fresh Debian/Ubuntu server setup and existing installations.
- Install dependencies, clone/update main, deploy with backup, configure Apache
  when needed, and request HTTPS through Certbot.
- Preserve existing domain site configuration and stop on local repository changes.
- Added Project > About with the installed application version.
- Aligned VERSION, About and installer output at 3.6.0.

# v3.5.1

- Fixed background-page scheduling that could stall Live programs when viewing a separate dashboard tab.
- Added cross-tab change notifications and focus/visibility refresh for dashboards.
- Kept polling as recovery, and avoided redraws when widget data is unchanged.
- Added worker/scheduler and separate-tab info/graph regression checks.
- No project migration or obsolete-file cleanup required; extract the full ZIP into the Git repository, commit and push as usual.
- Browser tab freezing/suspension and device sleep remain outside Live-mode guarantees.
