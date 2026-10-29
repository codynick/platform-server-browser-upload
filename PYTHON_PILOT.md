# Browser Python — 3.18.0

Install or upgrade from GitHub using the command in START_HERE.txt or README.md.

The script reuses the saved website domain. If it cannot find one, it asks for it.
An explicit domain override is supported:

```bash
sudo env CODYNICK_DOMAIN=ide.codynick.com bash /root/codynick-platform-upgrade-3.18.0/update-local.sh
```

The update uses only extracted package files. Python 3 must already be present
on the existing Debian/Ubuntu installation. The unzip command requires unzip.
No Node.js, Python-package installation or compilation service is needed on the
server. The browser downloads the pinned Pyodide runtime from jsDelivr when
uncached, so the user's browser needs Internet access for that download.

The installer backs up the current website, installs the static application,
and prints its exact backup location. It does not run the CAS installer, alter
CAS settings, migrate private projects, change Git checkouts or flash a CJP.
The normal Connect flow can still offer firmware installation if required.
Close old editor tabs before testing. Open the site's /blocks/ page and refresh
with Ctrl+F5 (on mobile close/reopen and reload). Blocks remains the selected
editor; Python appears beside it. Select Python and open Examples.

## Test sequence

1. Hello Python: prints text and 25.
2. Pretend sensor → dashboard and LED: no CJP needed. Move the temperature slider,
   open Dashboard, and check the gauge/graph. Press Stop.
3. Try `while True: pass` and confirm Stop responds.
4. Enter a syntax error and verify the alert and highlighted line.
5. Connect a CJP and run Blink, then a real temperature example with its listed gadgets.
6. Switch back to Blocks and confirm existing projects still run.

Both editors share File New/Upload/Download Project and account Save/Load.
See PROJECT_FORMAT.md. File also offers separate Python .py import/export.
Autocomplete and Blocks-to-Python generation remain deferred.

## Rollback

```bash
sudo bash /root/codynick-python-rollback.sh
```

This restores the website backed up immediately before the latest manual update.
It also preserves a copy of the replaced website. Refresh/close old tabs afterward.
For earlier backups, use the exact backup path printed by that installation:
`sudo bash /root/codynick-portal-backup-XXXXXXXX/rollback.sh`.
To hide the pilot temporarily for one visit without restoring files, use
`https://YOUR-DOMAIN/blocks/?python=0`.

## Validation scope

The browser pilot passed real Chrome tests for Python execution, shared simulation
and dashboard state, Stop including CPU-only loops, errors, independent editors,
file round trips and mobile layout. All seven examples executed; real-hardware
examples used simulated serial replies in those automated tests. Physical Python
CJP/Android acceptance remains pending. The ZIP integrity and shell syntax are
checked locally; this package has not yet been installed on your VPS.

The earlier PC preview is still available with `node tools/python-preview.cjs`.
The cumulative browser Python source is included in the 3.12.0 GitHub release.

Python syntax coloring is bundled locally and does not require an additional CDN.

Coloring validation: token/HTML escaping checks, exact source preservation, native scrolling, real Python execution and mobile font alignment passed in Chrome. Development regression: `node blocks/browser-tests/python-color.cjs` (Playwright required).

Dashboard update validation: successive nonzero readings preserve gauge/info/graph nodes without intermediate zero/blank text; range changes and removal still render. Cross-tab storage/focus and dashboard layout tests pass. Browser regression: `node dashboard/tests/live-updates.cjs` (Playwright required).

Python status appears below Console. Click the info icon beside Design for the example description and project-saving notes. File Project actions save both editors; Python .py import/export remains available separately.

Dashboard input and LED APIs/examples: see DASHBOARD_WIDGETS.md.

Examples now restore both source programs and their complete scene configuration.
They preserve the selected editor and do not start execution.

Open Stage opens a linked standalone sprite view. Python continues in the original
editor; keep it open and use Run/Stop there. See SPRITES.md.
