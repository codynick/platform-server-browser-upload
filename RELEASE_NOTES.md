# v3.5.1

- Fixed background-page scheduling that could stall Live programs when viewing a separate dashboard tab.
- Added cross-tab change notifications and focus/visibility refresh for dashboards.
- Kept polling as recovery, and avoided redraws when widget data is unchanged.
- Added worker/scheduler and separate-tab info/graph regression checks.
- No project migration or obsolete-file cleanup required; extract the full ZIP into the Git repository, commit and push as usual.
- Browser tab freezing/suspension and device sleep remain outside Live-mode guarantees.
