# Validation for 3.18.0

This cumulative release promotes the locally verified 3.17.0-preview.1 source,
including the complete-example, dashboard-input and sprite-stage previews.

Browser evidence: all twelve archived examples load from both editors, restoring
both programs and clean dashboard/simulation/sprite configuration while stopped.
The paired dashboard examples execute in Blocks and real Pyodide, including
hold/tap/toggle/slider/LED and sprite control. Separate stage tabs mirror pose,
appearance/size/speech and forward keyboard/pointer/touch input. Hidden embedded
panels, Stop, input lease expiry, editor isolation, account-reset detachment and
mobile layout are covered by the retained browser regressions.

Release checks include the full Node suite, syntax checks, browser smoke tests,
ZIP CRC/SHA checks and corrupt-payload rejection, exact Linux required filenames,
firmware hash preservation and shell syntax. Scripts under blocks/browser-tests
require Playwright and accept CHROME_PATH/PILOT_URL. The local preview is provided
by tools/python-preview.cjs.

Windows does not execute the full Linux service/deployment fixture. Physical
CJP/Android and production deployment of this revision are not claimed. No server
database/schema or firmware image change is part of this release. Older project
formats are rejected, not migrated. Browser suspension can still pause a Live
program; keep the original editor open when using the separate stage.
