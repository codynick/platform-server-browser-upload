'use strict';
(() => {
 const menu = document.getElementById('examplePublishing');
 const label = document.getElementById('examplePublishingVersion');
 const publish = document.getElementById('publishExample');
 const download = document.getElementById('downloadPublishedExample');
 const restoreRevision = document.getElementById('restoreExampleRevision');
 const restoreBundled = document.getElementById('restoreBundledExample');
 const actions = [publish, download, restoreRevision, restoreBundled];
 const project = window.CodyProjectFiles;
 const csrf = () => window.CodyAccess?.exampleAdminToken();
 let current = null;
 let busy = false;

 function refresh() {
  menu.hidden = !current || !csrf();
  if (menu.hidden) return;
  label.textContent = 'Built-in example · ' + current.version;
  for (const action of actions) action.disabled = busy;
 }

 function loaded(example) {
  current = example;
  refresh();
 }

 function status(message) {
  window.CodyAccountEditor.status(message);
 }

 function adminPath(example, action) {
  return '/api/admin/examples/' + encodeURIComponent(example.id) + '/' + action;
 }

 async function api(url, options) {
  const response = await fetch(url, {cache: 'no-store', ...options});
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw Error(data?.error || 'The example service returned an error.');
  return data;
 }

 function save(example, body, contentType) {
  if (current !== example || !csrf()) throw Error('Reopen the built-in example as an admin.');
  return api(adminPath(example, 'package'), {
   method: 'PUT',
   headers: {'X-CSRF-Token': csrf(), 'If-Match': example.token, 'Content-Type': contentType},
   body
  });
 }

 function run(action) {
  return async () => {
   if (!current || !csrf() || busy) return;
   const example = current;
   busy = true;
   refresh();
   try {
    await action(example);
   } catch (error) {
    status(error.message);
    alert(error.message);
   } finally {
    busy = false;
    refresh();
   }
  };
 }

 publish.onclick = run(async example => {
  project.stopped();
  if (!confirm('Publish the entire current project as “' + example.title +
      '” for all users? Review both programs, dashboard values and layout, simulation, and sprites before publishing.')) return;
  const snapshot = project.capture();
  snapshot.editor.publication = null;
  snapshot.editor.console = '';
  const bytes = await CodyProjectArchive.encode(project.validate(snapshot));
  if (bytes.byteLength > 8 * 1024 * 1024) throw Error('The example package exceeds 8 MB.');
  const saved = await save(example, bytes, 'application/zip');
  if (current === example) loaded({...example, token: saved.token, version: saved.version});
  status('Published “' + example.title + '” · ' + saved.version);
 });

 download.onclick = run(example => {
  const link = document.createElement('a');
  link.href = '/api/examples/' + encodeURIComponent(example.id) + '/package';
  link.download = example.id + '.codynick';
  link.click();
 });

 async function restore(example, revision) {
  project.stopped();
  const result = await save(example, JSON.stringify({restore: revision}), 'application/json');
  if (current === example) {
   loaded(null);
   if (!await project.loadExample(example.id, false)) {
    throw Error('The server restored the example. Open it again to refresh this editor.');
   }
  }
  status('Restored “' + example.title + '” · ' + result.version);
 }

 restoreBundled.onclick = run(async example => {
  project.stopped();
  const history = await api(adminPath(example, 'revisions'));
  if (confirm('Restore the bundled ' + history.bundled_release + ' version of “' + example.title +
      '” for all users? This discards unsaved editor changes. Published revisions stay in history.')) {
   await restore(example, 'bundled');
  }
 });

 restoreRevision.onclick = run(async example => {
  project.stopped();
  const history = await api(adminPath(example, 'revisions'));
  const revisions = history.revisions.filter(row => row.published);
  if (!revisions.length) throw Error('This example has no published revision to restore.');
  const choices = revisions.map(row => row.revision + ' · ' + new Date(row.created * 1000).toLocaleString() +
    (row.source_revision ? ' · restored from revision ' + row.source_revision : ''));
  const choice = prompt('Restore a published revision of “' + example.title +
    '” for all users. Unsaved editor changes will be discarded.\n\nEnter a revision number. Recent revisions:\n' +
    choices.join('\n'));
  if (choice === null) return;
  const revision = Number(choice.trim());
  if (!/^\d+$/.test(choice.trim()) || !Number.isSafeInteger(revision) || revision < 1) {
   throw Error('Enter a published revision number.');
  }
  await restore(example, revision);
 });

 window.CodyExamplePublishing = {loaded, refresh, clear: () => loaded(null)};
})();
