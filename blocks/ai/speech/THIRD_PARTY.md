# Voice command assets

- vosk-browser 0.0.8, Apache-2.0, from the npm distribution. Vosk CPU/WASM engine is embedded in vosk-worker.js.
- vosk-model-small-en-us-0.15, Apache-2.0, from https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip; repackaged as a gzipped tar with the original model bytes.
- UUID 9 code in the browser wrapper is MIT licensed; see LICENSE-UUID-MIT.txt. TypeScript helper notices are retained in the JS assets.

Local modifications externalize the worker as a same-origin static file, terminate it promptly on release, and treat persistent model caching as optional so unavailable browser storage does not prevent recognition. Audio is never stored in the model filesystem.

See ASSETS.json for source and shipped SHA-256 identifiers. No runtime CDN, external speech service, GPU, SharedArrayBuffer or server-header changes are required.
