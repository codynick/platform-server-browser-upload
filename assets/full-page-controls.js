'use strict';
(() => {
 const $ = id => document.getElementById(id);
 const toolbar = $('fullPageControls');
 if (!toolbar) {
  const run = $('blockRunBtn'), connect = $('connect');
  if (!run || !connect) return;
  let session;
  function rotate() {
   session = crypto.randomUUID();
   for (const link of document.querySelectorAll('[data-full-page-view]')) {
    const url = new URL(link.href, location.href);
    url.searchParams.set('editor', session);
    link.href = url.href;
   }
  }
  rotate();
  const editor = window.CodyAccountEditor;
  const reset = editor.reset;
  editor.reset = function (...args) {
   const result = reset.apply(this, args);
   rotate();
   return result;
  };
  function matches(key, stage) {
   return !!key && key === (stage ? new URL($('openStage').href).hash.slice(1) : session);
  }
  window.CodyFullPageControls = {
   state(key, stage) {
    if (!matches(key, stage)) return null;
    return {
     run: run.textContent, running: !!window.blockProgramRunning, runDisabled: run.disabled,
     connect: connect.textContent, connected: !!window.CJP.connected, connectDisabled: connect.disabled
    };
   },
   run(key, stage) {
    if (matches(key, stage) && !run.disabled) run.click();
   },
   async connect(key, stage, choose, confirmFirmware) {
    if (!matches(key, stage) || connect.disabled) return;
    const connecting = connect.textContent === 'Connect';
    await window.CJP.toggleConnection(choose, confirmFirmware);
    if (connecting && !window.CJP.connected && matches(key, stage)) return $('notice').textContent;
   }
  };
  return;
 }

 if (window.parent !== window) return;
 toolbar.hidden = false;
 const run = $('fullPageRun'), connect = $('fullPageConnect'), status = $('fullPageStatus');
 const stage = !!window.CODY_STAGE_REMOTE;
 const key = stage ? location.hash.slice(1) : new URLSearchParams(location.search).get('editor');
 let noticeTimer;
 function owner() {
  try { return window.opener?.CodyFullPageControls; } catch { return null; }
 }
 function render() {
  const state = owner()?.state(key, stage);
  if (!state) {
   run.disabled = connect.disabled = true;
   run.textContent = 'Run'; connect.textContent = 'Connect';
   run.setAttribute('aria-pressed', 'false');
   connect.setAttribute('aria-pressed', 'false');
   run.title = connect.title = 'Open this view from the editor and keep the editor tab open.';
   return;
  }
  run.removeAttribute('title'); connect.removeAttribute('title');
  run.textContent = state.run; run.disabled = state.runDisabled;
  connect.textContent = state.connect; connect.disabled = state.connectDisabled;
  run.setAttribute('aria-pressed', String(state.running));
  connect.setAttribute('aria-pressed', String(state.connected));

 }
 run.onclick = () => { owner()?.run(key, stage); render(); };
 connect.onclick = async () => {
  clearTimeout(noticeTimer);
  status.hidden = true;
  const localChooser = async usb => usb ? window.Ch340UsbPort.requestPort() : navigator.serial.requestPort();
  const attempt = owner()?.connect(key, stage, localChooser, message => window.confirm(message));
  render();
  const error = await attempt;
  if (error) {
   status.hidden = false;
   status.textContent = error;
   noticeTimer = setTimeout(() => { status.hidden = true; }, 10000);
  }
  render();
 };
 render();
 const update = () => render();
 if (window.CodyScheduler) window.CodyScheduler.every(update, 250);
 else setInterval(update, 250);
 window.addEventListener('focus', render);
})();
