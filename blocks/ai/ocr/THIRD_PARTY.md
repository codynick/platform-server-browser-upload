# OCR assets

Tesseract.js 7.0.0: https://registry.npmjs.org/tesseract.js/-/tesseract.js-7.0.0.tgz . Browser bundles and their notices are in vendor/; Apache 2.0 license included.

Tesseract.js-core 7.0.0: https://registry.npmjs.org/tesseract.js-core/-/tesseract.js-core-7.0.0.tgz . Three LSTM-only single-file WASM variants are bundled: standard, SIMD and relaxed SIMD. The runtime selects one. Legacy recognition engines are intentionally not enabled. Apache 2.0 license included.

English fast data: https://github.com/tesseract-ocr/tessdata_fast at commit 87416418657359cb625c412a48b6e1d6d41c29bd, eng.traineddata. The source is gzip-compressed without modification. Language license and source SHA-256 are included.

Initial OCR transfer is approximately 6 MB (one selected core + client/worker scripts + compressed English data), before any HTTP compression or browser caching. Other core variants are shipped for compatibility and are not all loaded by the browser. No external CDN or OCR service is used at runtime.

The sample text images in samples/ were generated for this project using DejaVu Sans and contain synthetic demonstration text.
