# Bundled AI assets

Transformers.js 3.8.1 full browser bundle, from https://registry.npmjs.org/@huggingface/transformers/-/transformers-3.8.1.tgz . TRANSFORMERS-LICENSE applies. Includes Hugging Face Jinja (Apache-2.0), ONNX Runtime/common (MIT) and their bundled dependency code.

ONNX runtime build 1.22.0-dev.20250409-89f8206ba4, exactly as shipped in that Transformers.js dist. ONNX-LICENSE applies. The .mjs and .wasm are paired bytes from that distribution.

Model: https://huggingface.co/Xenova/yolos-tiny/tree/e2f9c7673f0fa61849efe2b56a0d7774779ebb9d , q8 ONNX + config/preprocessor_config. Upstream https://github.com/hustvl/YOLOS ; Model card declares Apache-2.0; upstream YOLOS code is MIT, in models/YOLOS-LICENSE.

The browser downloads these files from the deployed website only. Remote model downloads and GPU execution are disabled.
