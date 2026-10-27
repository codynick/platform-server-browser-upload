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
