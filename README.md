# CodyNick Portal 3.11.5

CodyNick is a browser-based visual programming environment for combining real
CodyNick gadgets, simulated gadgets, and live dashboards in one project.

Repository: [codynick/platform-server-browser-upload](https://github.com/codynick/platform-server-browser-upload)

## One command for installation and upgrades

Run this same command in an interactive terminal on the VPS:

```bash
wget -4 -O /tmp/codynick-browser-setup.sh "https://raw.githubusercontent.com/codynick/platform-server-browser-upload/main/setup.sh?$(date +%s)" && sudo bash /tmp/codynick-browser-setup.sh
```

- **First installation:** the installer asks for the website domain, such as
  `code.codynick.com`, and saves it.
- **Future upgrades:** the installer reuses the saved domain and existing CAS
  settings. Use the same command; no domain is included in it.
- **Source:** the command downloads `setup.sh` from the repository's `main`
  branch, then clones or updates that repository on the VPS.
- **Publication:** commit and push a release to `main` before running the command
  to install that release.

The same command supports a clean OS installation and upgrades. There is no
need to upload update packages to the VPS separately.

## Server requirements

Use a Debian/Ubuntu VPS with `apt-get`, systemd, and root or sudo access.
`wget` must be available to run the command above. If it is missing, install it
with `sudo apt-get update && sudo apt-get install -y wget`.

Before installation:

1. Point the chosen domain's DNS A record to the VPS public IPv4 address.
2. If an AAAA record exists, ensure it points to a working IPv6 address on this
   VPS; otherwise remove the incorrect record.
3. Allow inbound TCP ports **80 and 443** through server/provider firewalls.
4. Keep the separate CAS identity server available at `id.codynick.com`.

The installer installs dependencies, creates the Apache website, obtains/checks
HTTPS, deploys the application, and installs the CAS backend and private project
storage. **HTTPS is configured before application/CAS deployment.**

If installation stops, fix the reported error and run the same command again.
A failed installation does not require reinstalling the OS.

## First-installation CAS settings

Use these working settings for the CodyNick identity server:

| Setting | Value |
| --- | --- |
| CAS base URL | `https://id.codynick.com/cas` |
| CAS validation URL | `https://id.codynick.com/cas/serviceValidate` |
| Stable CodyNick ID attribute | `cn_id` |
| Name attribute | `first_name` |
| Email attribute | `email` |

The first-installation prompts look like this. Text after the colon shows what
to enter; an empty response accepts the displayed default.

```text
First installation: confirm the settings of your existing CAS server.
CAS base URL [https://id.codynick.com/cas]:
CAS validation URL [https://id.codynick.com/cas/p3/serviceValidate]: https://id.codynick.com/cas/serviceValidate
Stable CodyNick ID attribute [__principal__; __principal__ means CAS user]: cn_id
Name attribute [name]: first_name
Email attribute [email]:
```

**Override the suggested `/p3/serviceValidate` URL with `/serviceValidate`.**
Also enter `cn_id` and `first_name` instead of accepting `__principal__` and
`name`. Press Enter for the base URL and email attribute shown above.

These are configuration values to enter at the prompts; documenting them does
not change the installer's built-in defaults. Existing configurations are reused
during upgrades, so the first-installation questions are not repeated.

## CAS service registration

On `id.codynick.com`, allow these exact URLs for `code.codynick.com`:

```text
https://code.codynick.com/auth/callback
https://code.codynick.com/blocks/
```

- `/auth/callback` is the login service URL.
- `/blocks/` is the return destination after central logout. CAS must permit
  post-logout redirection.

No URL patterns are required. For another website domain, register the same paths
with that hostname. Moving to another VPS while keeping the domain does not
change these registered URLs. The installer cannot edit the separate CAS server's
service registry.

## Features and account behavior

- Blockly editor with per-block Hardware/Simulation routing.
- Real hardware connection through the browser; programs execute in the editor
  tab, which must remain open.
- Simulator and dashboard, including separate live-view tabs.
- CAS login, private account projects, account Save/Load, and project deletion.
- Guest use and portable `.codynick` file upload/download.
- Sign out clears the local workspace/account state and visits central CAS
  logout. Its return to the editor depends on the CAS redirect policy above.
- Header: **Logo · File · Advanced · Examples · Show/Hide Spaces · Connect · Run ·
  Sign in/out**, with only the username below the account button.
- File, Advanced, Examples, and Spaces controls are vertically centered against
  the logo on desktop. Examples opens the example chooser.
- Legacy browser-copy import/removal buttons are absent.

The fixed-callback CAS flow retains its explicit identity confirmation step at
`/auth/confirm`. This release does not remove that extra click.

## Upgrade procedure

1. Copy the complete cumulative release contents into the root of your local
   repository. Keep the existing `.git` directory; do not add a nested package
   folder around the source.
2. Review, commit, and push the release to `main` using your own GitHub account.
3. Close all old CodyNick editor, simulator, and dashboard tabs.
4. Run the same single-line VPS command shown above.
5. Open the editor at your domain's `/blocks/` path and press **Ctrl+F5**.

Example commands from your local repository, with `main` checked out:

```bash
git status
git add .
git commit -m "Upgrade CodyNick Portal"
git push origin main
```

For a README-only change, stage only that file:

```bash
git add README.md
git commit -m "Document setup command and working CAS settings"
git push origin main
```

An upgrade preserves existing CAS configuration and private project data. The
VPS Git checkout must be clean and on `main`; setup stops instead of overwriting
uncommitted server-checkout changes. Already-open tabs keep running old scripts
until closed/reloaded.

## Server locations and diagnostics

| Item | Location |
| --- | --- |
| Repository checkout used by GitHub setup | `/root/platform-server-browser-upload` |
| Saved domain | `/etc/codynick/domain` |
| Website | `/var/www/<your-domain>/` |
| CAS configuration | `/etc/codynick-cas/config.json` |
| Private project database | `/var/lib/codynick-cas/projects.sqlite3` |
| Backend service | `codynick-cas` |

Check the account service and its logs:

```bash
sudo systemctl status codynick-cas --no-pager
sudo journalctl -u codynick-cas --since "10 minutes ago" --no-pager
```

Authentication responses include `Server-Timing`; sanitized logs record request
path, status, and duration. Do not share ticket query strings or session cookies
when reporting a problem. The previously reported roughly 10-second sign-in
delay has not been independently diagnosed by the packaged tests.

Installation prints backup locations and rollback commands. Static deployment
and CAS deployment have separate backups. A rollback preserves the private
project database; it does not restore deleted projects. For a complete backup,
include the CAS configuration and database using a consistent SQLite backup.
A clean OS reinstall without restoring those files creates fresh local settings
and an empty project database; accounts on the separate CAS server remain there.

## Development checks

With Python backend dependencies and Node installed, run:

```bash
python3 tests/test_setup.py
python3 cas/test_install.py
node cas/test_accounts.cjs
(cd cas/backend && python3 -m unittest -q)
```

The setup fixture tests use temporary files and mocked server services, including
fresh setup, repeated setup, DNS/TLS failures, and retry behavior. Existing Node
suites cover editor, runtime, connection, simulation, and dashboard behavior.
See `VALIDATION.md` for scope and limitations. These tests do not replace live
HTTPS, CAS, hardware, and browser verification.

## CJP firmware updates

The editor checks the bundled CodyPi release when connecting and offers confirmed Uno firmware installation when needed. See [firmware release instructions and device validation](blocks/firmware/README.md).

## Revision history

Keep this history current in every revision, with the newest revision first.
Entries below describe the documented changes; earlier test limitations apply to
their original releases. Desktop and mobile firmware uploads have since been
confirmed by the user, as recorded in 3.11.5.

### 3.11.5 — program error alerts and revision history

- Show a browser alert as well as status/Console output when a program fails to start or ends with an error, including missing sensors and hardware disconnection.
- Restore program controls and stop live updates before displaying a runtime error alert.
- Keep normal completion and the user's Stop action free of error alerts.
- Include documented revision history at the end of README.md; require updates for every release.
- User confirmed successful desktop firmware upload after 3.11.3 and mobile upload after 3.11.4.

### 3.11.4 — Android bootloader synchronization

- Retry STK500 synchronization within each reset window instead of one early probe.
- Match CH340 driver control-line values using the complete 16-bit complement.
- Log synchronization attempts and failing upload stage; freeze progress on error.
- Physical Android acceptance remains required; this addresses identified handshake weaknesses, not a confirmed device diagnosis.

### 3.11.3 — firmware download integrity and visible progress

- Preserve exact HEX bytes in Git and normalize new releases before hashing.
- Correct the deployed firmware checksum mismatch caused by Git line endings.
- Show persistent download, upload/read-back, restart, completion and failure progress.

### 3.11.2 — CJP firmware installation

- Check the deployed CodyPi firmware version on connection; bundle release 1.19.6.
- Request confirmation before installing older or unidentified firmware.
- Add Uno STK500v1 upload through Web Serial and CH340 WebUSB, with MCU signature checks, page read-back verification, post-reset identity confirmation and retry handling.
- Keep simulation available after declining installation; block hardware for mismatched versions without downgrading newer firmware.
- Add checksum-addressed firmware packaging and update instructions.
- Use codynick/platform-server-browser-upload for bootstrap, checkout, and documentation.
- Automated upload/connection tests pass; physical CJP desktop/Android acceptance remains required.

### 3.11.1 — clean installation repair

- Create HTTP and HTTPS site before deploying any application/CAS components.
- Correct bootstrap repository to codynick/platform-server-browser-upload.
- Install complete extracted ZIP directly without fetching other source.
- Retry/repeat installation tests and early DNS/TLS failure checks.
- Include latest centered header controls and dedicated Examples button.
- First-install CAS endpoint/attribute prompts; preserve configured installs.

### 3.11.0

- Bundle CAS and private projects into the same setup.sh install/update flow.
- Derive callback and central-logout return URLs from the selected domain.
- Place account controls at top right with username only below the button.
- Remove legacy-browser import and cleanup controls.
- Preserve 3.10.2 compact standalone tool headers and current simulator features.
- Refresh Apache integration on repeat installs, including confirmation policy.
- Add sanitized request timing diagnostics; live login latency remains unverified.
- Retain identity confirmation until CAS supports correlated automatic login.

### 3.10.2 — 2026-10-27

- Keep standalone tool branding, title and Block Editor on one compact header row.
- Remove the forced empty navigation row; allow natural wrapping on narrow screens.
- Preserve compact logo-free headers in embedded views.
- Verify both desktop headers stay within 80 px in Chrome.

### 3.10.1 — 2026-10-27

- Right-align Block Editor in the top navigation row of standalone tool pages.
- Hide simulator/dashboard logos in embedded views and reduce header height.
- Isolate the coding workspace stacking context so scrollbars stay behind menus.
- Add actual scrollbar/menu overlap hit-testing to the Chrome regression suite.

### 3.10.0 — 2026-10-27

- Added the supplied transparent wide CodyNick logo across page headers and About.
- Put standalone Block Editor navigation on a separate left-aligned row.
- Added pointer-anchored simulator wheel zoom and background drag-to-pan.
- Added double-click/Home fit recovery and keyboard camera controls.
- Added left-side gadget removal crosses and right-side drag grips.
- Removed Fit Stage, 1:1, the global remove button and Browser simulator text.
- Included the new logo in installer backups and rollback.

### 3.9.0 — 2026-10-27

- Matched simulator/dashboard headers; hide Block Editor links in embedded views.
- Styled and left-aligned the panel's new-tab buttons.
- Added grouped, polished File/Advanced menus with icons and clear focus states.
- Use each graph title for its default legend, preserving named multi-series data.
- Added child-friendly built-in example names without changing their IDs.
- Enabled plain mouse-wheel canvas zoom; toolbox wheel scrolling is preserved.
- Keep block arguments and target choices inline, including imported projects.

### 3.8.0 — 2026-10-27

- Replaced Project menu with File; added Project suffix to file actions.
- Added an Examples chooser and moved Console/Python/Linux help into Advanced.
- Removed Main Panel from the blocks toolbar; moved Hide Spaces before Connect.
- Combined Run/Stop into one green/red button, with connection status beneath it.
- Replaced the simulator's permanent gadget sidebar with an Add gadget picker.
- Styled About with a border, version badge and release date.
- Python reference preview behavior is unchanged.

### 3.7.0

- Added Edit/Lock layout, grid-snapped card movement and corner resizing.
- Added keyboard arrow controls, drag cancellation and Reset layout.
- Preserve per-widget layout separately from program state across runs and tabs.
- Compact info, medium gauge and wide graph defaults with responsive placement.
- Smaller independent graph axis text, compact numbers and adaptive tick labels.
- Make the mixed-display regression wait for a complete sample before Stop.

### 3.6.1

- Ask for the website domain during first setup; remember it for updates.
- Use the selected domain for deployment paths, Apache, HTTPS and rollback.
- Let Certbot reuse a valid matching certificate or obtain/renew it as needed.
- Show version 3.6.1 in Project > About.

### 3.6.0

- Added setup.sh for fresh Debian/Ubuntu server setup and existing installations.
- Install dependencies, clone/update main, deploy with backup, configure Apache
  when needed, and request HTTPS through Certbot.
- Preserve existing domain site configuration and stop on local repository changes.
- Added Project > About with the installed application version.
- Aligned VERSION, About and installer output at 3.6.0.

### 3.5.1

- Fixed background-page scheduling that could stall Live programs when viewing a separate dashboard tab.
- Added cross-tab change notifications and focus/visibility refresh for dashboards.
- Kept polling as recovery, and avoided redraws when widget data is unchanged.
- Added worker/scheduler and separate-tab info/graph regression checks.
- No project migration or obsolete-file cleanup required; extract the full ZIP into the Git repository, commit and push as usual.
- Browser tab freezing/suspension and device sleep remain outside Live-mode guarantees.
