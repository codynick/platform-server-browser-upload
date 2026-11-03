# Rollback from 3.20.3 to 3.20.2

The previous release is commit c21c4c323604846f4514ba612eacacb3020c5fbd.
Before updating, close all editor/simulator/dashboard/stage tabs and retain the complete installer output.

For an installed server, use the exact backup paths printed during this upgrade:

1. Run the printed accounts/backend rollback command (`sudo bash /root/codynick-cas-backup-<actual-id>/rollback.sh`).
2. Run the printed website rollback command (`sudo bash /root/codynick-portal-backup-<actual-id>/rollback.sh`).
3. Reopen the editor and hard-refresh with Ctrl+F5; confirm About shows the previous installed version (3.20.2 if that was installed before this update).

The account backup is made after website deployment, so backend rollback must precede website rollback. Do not run placeholder paths literally. Ask for help with the actual installer output if unsure.

Cooldown data is in separate additive tables. The prior access/run table layouts are unchanged, so the old backend can resume without deleting or restoring the private project database. Saved 3.20.3 cooldown preferences remain dormant during rollback. The old version resumes its original coupled runtime/cooldown behavior; guest limits revert to the old behavior. An already-started run can retain its recorded deadline until stopped.

Do not restore an old database backup as routine code rollback: that would discard newer projects/account changes. Keep all printed backups until the upgrade is accepted. Rollback does not change the GitHub main branch; coordinate any later update to avoid immediately reinstalling 3.20.3.

Optional persistent defaults: in /etc/codynick-cas/config.json use string values "DEFAULT_RUN_SECONDS": "60" and "DEFAULT_COOLDOWN_SECONDS": "10", then restart codynick-cas. Existing per-user overrides take precedence. No server configuration is changed by this source release.
