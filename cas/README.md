# First admin setup (3.20.0)

setup.sh and cas/update.sh ask for the first admin CodyNick ID when none is configured. The normal interactive setup asks before website deployment. Existing admins cause the prompt to be skipped. CODYNICK_ADMIN_ID supplies it noninteractively. Blank input is retried; EOF/missing unattended input aborts with instructions.

The exact stable CAS identity is reserved. If the account has not signed in yet, the reservation becomes effective only after successful matching CAS sign-in; the installer creates no user/password/session. The reservation counts as a configured admin on later updates. Verify the ID before entering it. bootstrap_admin.py --select performs no database writes; --apply assigns the role transactionally and records an audit entry. Apply runs as the service user after schema initialization. Existing projects and account settings are preserved.

# Local CodyNick upgrade

This upgrades your existing website and CAS backend in place. No repository
upload, git command, or full website replacement is required.

1. Close every CodyNick editor, simulator and dashboard tab.
2. Extract this archive and upload codynick-cas-update over the folder in /root.
3. Run as root:

   cd /root/codynick-cas-update && bash update.sh

The updater reads the domain from existing CAS configuration, falling back to
/etc/codynick/domain. It asks only if neither exists. Existing identity settings
and private projects are preserved. A backup and rollback command are printed.

Changes: remove legacy import/removal buttons; put Sign in/out at top right,
with username only below it; arrange Logo, File, Advanced, Examples, Show/Hide Spaces, Connect,
Run, Account; derive logout return URL from this installation's domain. CAS must
allow the exact editor /blocks/ return URL and enable post-logout redirection.

The confirmation page remains until the CAS server supports a verifiable
round-trip login token or another correlated authentication flow. This update
does not claim to diagnose the reported 10-second delay; sanitized request timing
is included to help locate it.

After installation, reopen the editor and Ctrl+F5. Old open tabs keep running
their old scripts until closed. Repeat the same command for future local upgrades
after replacing this update folder with the new revision.

Header revision: File, Advanced, Examples and Spaces share the logo vertical center on desktop. The new Examples button opens the existing example chooser.
