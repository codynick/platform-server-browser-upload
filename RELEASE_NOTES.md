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
