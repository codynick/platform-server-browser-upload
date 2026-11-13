# CodyNick AI Tools — cumulative trial patch

**3.21.1-ai.9 · installer revision 11**

This ZIP includes all previous AI tools and model/runtime files, the reorganized AI panel, the original Person Detector example, and the new Named Image Workbench example. English OCR, voice commands, speech-to-text, local text-to-speech and a small local text assistant are included, alongside all earlier tools and examples.

## Supported installations

- Original uploaded server edition **3.21.0**, including its normal CAS-generated HTML cache-version changes.
- Previous AI trials **3.21.1-ai.1**, **3.21.1-ai.2**, **3.21.1-ai.3**, **3.21.1-ai.4**, **3.21.1-ai.5**, **3.21.1-ai.6**, **3.21.1-ai.7** and **3.21.1-ai.8**.

No previous AI patch is required. This is an update to an existing CodyNick website, not a bare-server installer. Application files are checked against known original, deployed or previous-trial bytes; CRLF/LF-only differences are accepted. Differing deployed README, release notes and START_HERE documentation are preserved. Unknown application changes stop installation before website files are changed; do not bypass that check.

## Install on the reserve server

Upload **codynick-ai-llm-patch.zip** to `/root/`, then run:

```bash
sudo bash -c 'work=$(mktemp -d /tmp/codynick-ai-XXXXXX) && unzip -q /root/codynick-ai-llm-patch.zip -d "$work" && bash "$work/codynick-ai-image-patch/install.sh"'
```

The installer uses the saved website domain and prints it before applying the patch. With no saved domain it prompts in an interactive terminal. Confirm you are connected to the intended reserve server. The base installation supplies Python 3 and flock; unzip is required for the command above. No server package installation, backend/database change, service restart, Git push or device firmware change is performed.

It verifies payloads, backs up every changed existing file under `/root/codynick-ai-backup-*`, replaces files atomically, and checks the installed hashes. Avoid using the website during installation. Exact repeat installation is a no-op. An ordinary Git upgrade can replace this trial; it has not been merged or pushed to GitHub.

## Rollback

```bash
sudo bash /root/codynick-ai-image-rollback.sh
```

The backup-specific command is printed as well. Keep the backup directory. Rollback restores exact original file bytes, including the old AI trial if that was the installation source. It removes files newly added by this patch and refuses to overwrite files edited since installation. Account data is not part of rollback.

## Small local text assistant — new in 3.21.1-ai.9

Open **Show Spaces → AI → Text Assistant (LLM)**. Enter a short question, choose a **32 / 64 / 128 token** answer limit, and click **Generate Answer**. The Results tab shows loading progress and streamed text, with Copy, Clear and **Stop / Unload**. Prepare Model is optional. The model is not downloaded or loaded merely by opening the editor or using another AI tool.

This trial uses **SmolLM2-360M-Instruct**, its pinned ONNX-community **8-bit** export, and the existing Transformers.js 3.8.1 / ONNX CPU-WASM runtime with **one thread**. About **367 MB** of model/tokenizer files are served from your website on first use, plus the shared runtime if not already cached. The cumulative ZIP is therefore much larger than earlier patches. A static model download is the only server work; inference and text generation run on the user's CPU. No GPU, cloud inference, account/API key, OS installation, backend service or Apache-header changes are added.

**Try a laptop/desktop first.** This tool uses substantially more RAM than earlier tools. The development-process reference measurements were approximately **1.4–1.5 GiB RSS**, including model-fetch buffers and runtime overhead; they are not minimum browser RAM specifications. Actual browser memory varies, and low-memory phones may fail or reload the tab. Close heavy tabs, use short prompts/answers, and use Stop / Unload to release the worker/model. Leave ample disk space on the reserve server for the ZIP, extracted package, deployed assets and backup (about 2 GB free is a useful working allowance for this trial).

The model can be wrong, repetitive or incomplete; verify answers. It is a small demonstration assistant, not a dependable coding or factual authority. Each question is independent; conversation history is not retained. Questions are limited to **1,000 characters and 384 input tokens including the fixed system instruction**; the worker rejects longer tokenized input rather than silently removing it. Answers are capped at **16–128 generated tokens**, default **64**. A token is a text piece, not necessarily one word. A length-limited or stopped answer may end mid-sentence.

Questions and generated text remain in the browser and are never posted to the server for processing. Model files have revision-specific local URLs and can be browser-cached where storage permits. No user text is placed in that model cache. Text explicitly written by a program to Dashboard/console follows ordinary project saving. Model replies are plain text and never executed as code or gadget commands.

### Why this model

Two 8-bit candidates were tested with the same three short prompts and a 64-token limit. The 4-bit exports were larger than the 8-bit files for these conversions, so 8-bit was tested.

| Candidate | ONNX model file | Warm answer time in this test | Reference-process RSS |
|---|---:|---:|---:|
| SmolLM2 135M Instruct | 136 MB | 1.0–3.3 s | 927–954 MiB |
| **SmolLM2 360M Instruct** | **363 MB** | **2.0–2.5 s** | **1,486–1,525 MiB** |

The larger model gave cleaner, shorter sample responses, so it was selected despite the larger download/RAM cost. Response lengths differed: this table does not imply the larger model has faster token throughput. Both models made errors; three prompts are not an accuracy evaluation. The actual shipped worker's temperature-sensor example took about **3.0 s initial load plus 1.9 s generation**, with first streamed text about **0.9 s after generation began**. These are CPU/WASM measurements using a local fetch adapter in Node, not browser/mobile or network-download benchmarks. See the reference JSON files in tests/.

### Five-widget example

**Examples → AI → AI + Dashboard - Small Local Text Assistant** contains paired Blocks/Python and exactly **Question, Ask, Stop, Answer and Status** widgets. Run, edit Question and click Ask. The first Ask loads the model. Answer updates as text streams; Stop cancels generation, unloads the model and keeps partial text. The existing dashboard text input is for short questions (120 characters); the AI panel/API allow the longer bounded prompt. The example uses a 64-token answer budget; edit that Blocks field/Python argument if needed.

### Coding API

The AI Blocks folder **Text Assistant (LLM)** has Prepare local language model, Start answer for [prompt] limit [tokens], Stop/unload language model, Current generated answer, Language model is working?, and Language model status. Start Answer returns promptly so the loop can display streamed text and handle Stop.

```python
from codynick import ai

answer = await ai.generate('What does a temperature sensor measure?', max_tokens=64)
print(answer)
```

`generate()` starts the model, polls without blocking the UI, waits for the final answer and raises on error/cancellation. For dashboard controls and streaming, use:

```python
from codynick import ai, wait

await ai.start_answer('Explain what a sensor does.', max_tokens=64)
while await ai.llm_running():
    print(await ai.llm_answer())  # current partial answer
    await wait(0.25)
print(await ai.llm_answer())
```

Additional calls: `await ai.prepare_llm()`, `await ai.stop_llm()`, `await ai.llm_message()`, and `await ai.llm_status()`. Status includes phase, model readiness, message, current answer and final timing/token metrics. The model stays warm after a normal answer. Stop / Unload, switching tools, editor Stop and page close release it; project/account clear also erases prompt/answer state. Preparing another AI engine releases the language-model worker. Starting the LLM releases detector/OCR/speech-recognition engines, microphone/camera capture and spoken output to reduce resource contention.

### Verification and installation

The actual shipped worker was exercised with the real pinned ONNX model, CPU/WASM inference, streaming and token bounds. UI fixtures check asynchronous jobs, visible progress, warm reuse, Stop/unload, stale replies, prepare cancellation, errors and reset. The paired five-widget example runs through the real Blockly runtime, with Python API checks and actual HTML/DOM checks. The installer uses streaming hashes so it need not load the entire model file into VPS RAM while verifying it. Full rendered-browser/device performance testing remains a reserve-server acceptance step.

Model source/license: Apache-2.0; see blocks/ai/llm/MODEL_CARD.md, LICENSE-APACHE-2.0.txt and ASSETS.json for pinned original/converted sources and hashes.

## Local Text to Speech — introduced in 3.21.1-ai.8

Open **Show Spaces → AI → Tool: Text to Speech → Process**. Enter up to **1,000 characters**, choose a local voice and speed (**0.5–2×**), then click **Speak**. **Stop Speaking** cancels output. Refresh Voices rechecks voices that may appear asynchronously. If browser playback is blocked, click **Enable Speech** in the AI panel; this button stays available while a program is running. Results shows the last text submitted, not an audio recording.

Only voices for which the browser reports `localService === true` are listed or used. The voice is explicitly assigned before calling the native speech API; no default/remote fallback is used. If no local voice is exposed, the panel and example explain that the feature is unavailable on that browser/device. Try another browser/device; this patch does not install OS voices or anything on the user's PC. Voice quality, pronunciation, startup behavior and availability vary between Windows, Linux, macOS and Android browsers. This is a local system speech interface rather than a bundled neural voice model. No additional model, account, API key, speech service or server processing is added.

Speaking first stops any active microphone capture, finishing the current transcription phrase where possible, to avoid recognizing the spoken output. A recognition model stopped through this API stays warm; after speaking, a program can explicitly restart listening. Switching tools manually releases the previous AI engine. Starting microphone capture stops CodyNick speech output. New Speak calls replace current CodyNick output; they do not accumulate an unbounded queue. Stop All AI, editor Stop, page close and project/account clear cancel output. Text is retained in the current editor session until cleared/reloaded, and is not automatically serialized in a project; text explicitly placed in dashboard widgets follows normal project saving.

### Five-widget TTS example

**Examples → AI → AI + Dashboard - Local Text to Speech** includes matching Blocks/Python and exactly five widgets: **Text**, **Speed**, **Speak**, **Stop**, and **Status**. Run, edit the short message, adjust Speed and click Speak. Status shows progress or explains no local voice. Use AI → Enable Speech if the browser requires a direct playback gesture. The existing dashboard text input is limited to short messages (120 characters); the AI panel and coding API accept 1,000 characters per call.

### TTS coding API

The Text to Speech Blocks folder adds **Start speaking [text] speed [rate]**, **Stop speaking**, **Local speech voice is available?**, **Speech output is active?**, and **Speech output status**. Text and speed accept value blocks, so a program can speak OCR output, a sensor value or dashboard text. Split/truncate longer passages to stay within the 1,000-character limit.

```python
from codynick import ai, wait

if await ai.tts_available():
    await ai.speak('Hello from CodyNick.', rate=1)
    # speak starts playback; wait if a one-shot program must finish speaking.
    while await ai.is_speaking():
        await wait(0.1)
    print(await ai.tts_message())
else:
    print('No local voice is available in this browser.')
```

Additional calls: `await ai.stop_speaking()`, `await ai.tts_voices()` (local `{id, name, lang}` entries only), and `await ai.tts_status()`. Pass `voice=entry['id']` to speak using one of the current device's returned IDs; `voice='auto'` chooses a local voice matching the browser language where possible. Voice IDs are device-specific, so automatic selection is best for portable projects. Calling `await ai.speak()` queues playback and returns; it does not wait for the audio to finish. Editor Stop/program shutdown cancels speech, so use the polling loop above for one-shot scripts. Errors raised after native playback begins appear in TTS status; a successful Speak return alone does not prove sound was produced. No audio file export is offered by this API.

### Verification and acceptance

Tests verify strict local filtering, no remote/default fallback, delayed voice discovery and cancellation, voice disappearance, parameter validation, microphone interlock, replacement/Stop/late-event handling, blocked-playback recovery, the paired five-widget example through actual Blockly, Python methods, actual HTML controls, cumulative upgrades and exact rollback. Native speech synthesis is simulated in automated tests; actual OS voices and audible playback must be checked on the reserve server with the devices/browsers you use. The existing object/OCR/speech models and inference workers are unchanged.

Browser API references: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices and https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService .

## Speech to Text — introduced in 3.21.1-ai.7

After installation, hard-refresh /blocks/. Open **Show Spaces → AI → Speech Recognition → Process**, select **Mode: Speech to Text**, and click **Start Listening**. Allow microphone access. Speak English, pausing between sentences. Process shows a live preview; Results collects only completed phrases, with **Copy Text**, **Clear Text**, and **Download Text** (.txt).

**Stop Listening** finishes the current phrase, then retains the completed transcript with the microphone off. The speech model remains warm. **Start Listening** resumes appending until Clear Text is used. Clear Text erases accumulated text and resets the current recognizer phrase while continuing to listen. **Stop All AI**, editor Stop and tool changes cancel immediately, so a still-unfinished phrase can be discarded; already completed text stays available until project/account clear or page reload. Copy/download includes finalized text only. Use Enable Microphone Audio if the browser suspends audio. Close the editor only after copying/downloading anything you need.

The same English Vosk model is reused: no additional speech model or language download is introduced. First-time speech users still need about 45 MB of assets. The model reads English without a command list, but does not automatically add punctuation or restore capitalization. Accents, noise and microphone quality affect accuracy. There is a 200,000-character session transcript limit; a warning appears when it is reached. Only short live previews and bounded audio chunks are held; audio is not recorded, uploaded or saved in projects. Text explicitly written by a program to dashboard/console can be saved as ordinary project state.

### Five-widget transcription example

**Examples → AI → AI + Dashboard - English Speech to Text** includes matching Blocks/Python and exactly five widgets: **Start**, **Stop**, **Clear**, **Transcript**, and **Status**. Run, click Start, allow microphone permission, and speak. Pause between sentences. Stop finishes the final phrase; Start resumes; Clear resets the text/current phrase. The Transcript info widget displays completed text. Copy/download is available through AI → Results. The previous Voice Controlled Light example is also included.

### Transcription Blocks and Python

The Speech Recognition Blocks folder adds **Start English speech to text**, **Completed transcript**, **Live speech preview**, and **Clear completed transcript**, alongside the existing Prepare/Stop/Listening and voice-command blocks. Live preview is provisional and is not included in Completed transcript until finalized.

```python
from codynick import ai, wait

await ai.start_transcription(clear=True)
await wait(5)  # speak English for a short test
await ai.stop_listening()  # finishes the current phrase; microphone off
print(await ai.transcription_text())
```

Use `await ai.start_transcription()` to append to an existing session transcript, `await ai.clear_transcript()` to reset it, and `await ai.speech_partial()` for provisional words. `await ai.speech_status()` includes mode, finishing state, transcript length/revision and any warning/error. These functions work through the same browser bridge as existing AI tools. Manual mode changes are locked during listening; Stop first to change mode. Voice-command calls continue to use restricted exact final matches and do not append to the transcript.

### Verification

The actual packaged Vosk browser client/WASM transcribed the official recorded test audio without a grammar restriction. As expected for a small model, it made errors on part of the recording; this is a functional engine test, not an accuracy claim. Tests verify separate partial/final text, append/clear, no command events in transcription mode, final-phrase processing on Stop, short worklet-buffer flush, microphone cleanup and cancellation, the paired five-widget example through real Blockly, Python calls, and cumulative installer rollback. Browser microphone/mobile acceptance testing remains necessary on the reserve server.

## Voice commands — introduced in 3.21.1-ai.6

Open **Show Spaces → AI → Tool: Speech Recognition → Mode: Voice Commands**. Speech has two compact tabs, **Process** and **Results**; image controls are hidden for this tool.

1. In Process, enter English command phrases separated by commas, e.g. `red, green, off`.
2. Click **Start Listening** and allow the browser microphone request. Prepare Voice Commands is optional and never opens the microphone.
3. Say one command, then pause. Only a completed phrase exactly matching the configured list becomes a command; partial recognition and `[unk]` do not trigger actions.
4. Stop Listening releases the microphone. The panel Stop Listening button keeps the speech model warm. In code, `await ai.stop_listening()` keeps the model warm for another session. **Stop All AI**, editor Stop, page close and project/account clear release the model and microphone.

If the browser suspends audio, click **Enable Microphone Audio** in the AI panel. Microphone device names usually appear only after permission is granted; stop listening, refresh the device list, select a microphone and start again. HTTPS and microphone permission are required. Devices with insufficient WASM memory or older browser audio APIs may fail; the reserve-server test should include the browsers/phones you use.

The model is **Vosk small English US 0.15**, through **vosk-browser 0.0.8** CPU/WASM. First use downloads about **45 MB** of speech assets and needs substantially more memory than OCR (small Vosk models typically require around 300 MB at runtime). Only one AI engine remains loaded when changing tools. Audio is passed in bounded chunks to a worker, with a stalled-worker timeout. Slow devices may skip audio and show a warning. Recognition runs locally, without a cloud speech API, GPU, browser speech service, user installation or Apache-header changes. Model files can be cached in IndexedDB; unavailable cache storage falls back to in-memory operation. Audio is not recorded, uploaded or placed in the cache.

Use 1–32 short command phrases, up to 64 characters each, containing English letters, spaces or apostrophes. Spell out numbers. Words must be in the model's existing vocabulary; this does not train new names or words. Unrelated speech/noise can still match a command: try a simulation before connecting actions to real hardware. Use Speech to Text mode for transcription without a command list.

### Five-widget voice example

**Examples → AI → AI + Dashboard - Voice Controlled Light** contains paired Blocks/Python and exactly five widgets: **Start listening**, **Stop listening**, **Voice command**, **Light**, and **Status**. Run it, click Start listening, allow the microphone, then say **red**, **green**, or **off**, pausing after each. The Light info card changes its colored symbol; no physical gadget is required. If audio needs a browser gesture, use Enable Microphone Audio in the AI panel. The first start loads the model; later starts reuse it until editor Stop/tool change.

### Voice coding API

The AI category has a Voice Commands folder: Prepare English voice commands, Start listening for commands, Stop listening, Next voice command, Last completed speech, and Microphone is listening? **Next voice command consumes one queued match** and returns an empty string if none is waiting. Read it once into a variable if multiple actions need the same command.

```python
from codynick import ai, wait

await ai.start_listening(['red', 'green', 'off'])
while True:
    command = await ai.next_command()
    if command:
        print(command)
    await wait(0.1)
```

Additional calls: `await ai.prepare_speech()`, `await ai.stop_listening()`, `await ai.speech_text()`, `await ai.is_listening()`, and `await ai.speech_status()`. `start_listening(..., microphone='default')` optionally accepts a locally selected device ID. Speech status returns readiness, listening state, last text/command, partial text, pending queue length, dropped audio count, warning and error. Raw audio is never returned or saved. Recognized text written explicitly by a program to console/dashboard follows normal project saving behavior.

### Verification and limits

The actual packaged browser client and Vosk WASM recognized an 8.3-second official Vosk recording with a restricted phrase grammar in a Node VM supplying browser fetch/IndexedDB. Reference inference was faster than the recording on the development machine; this is not a microphone latency or mobile benchmark. Tests cover exact final matching, consume-once queues, bounded audio input, permission denial, late permission cleanup, worklet/fallback capture, engine release, real Blockly example execution, Python calls, tool selection and cumulative installer rollback. Full rendered-browser and physical microphone testing remain reserve-server acceptance steps.

## OCR accuracy update

For a short label, open AI → Image, enable **Read selected area only**, and drag closely around the letters with a small margin. In Process choose **Single line**, leave **Enhance image** checked, and click **Read Text**. Paragraphs use One text block; pages use Auto. The layout selector is now visible without opening advanced settings.

Enhancement uses grayscale with guarded 2% contrast stretching, a 12-pixel white border, and up to 3× enlargement for short selected areas or single lines, with a 2-megapixel enlargement budget. Full photographs are not enlarged. Enhancement can be turned off; it is not guaranteed to help every image. No second OCR pass, new model, extra model download or server processing is introduced. It cannot remove background clutter automatically or restore missing detail.

On the supplied “Touch the Future” photograph, a tight 153 × 26 crop with Single line returned the exact phrase both before and after enhancement. The full scene remained unreliable: cropping/layout was the decisive improvement. The shipped enhancement was tested with the actual packaged WASM model and also preserved exact expected text on the three bundled clean printed samples. Recognition timings are reference-machine measurements, not guarantees; see tests/ocr-accuracy-reference-results.json. The personal photograph is not included in this package.

The panel, Blocks and Python all use enhancement by default. Python supports `await ai.read_text(layout="line", region=[x,y,width,height], enhance=False)` to bypass preparation. Old programs and the five-widget example continue to work. Bounding boxes are mapped back to the original source image after enlargement and padding.

## Performance update

The previous bundled image-preprocessing path enlarged photos to a 1,333-pixel longest edge. This patch replaces its shortest/longest-edge rule with explicit, aspect-preserving dimensions and never enlarges an image for inference.

In the AI panel, open **Speed and detail**:

| Mode | Maximum longest edge | Intended use |
|---|---:|---|
| **Fast** (default) | 512 pixels | Quick interactive detection |
| Balanced | 640 pixels | More detail at higher CPU cost |
| Detailed | 960 pixels | Inspect smaller objects; slower |

Modes do not upscale: a small photo may have the same inference dimensions in more than one mode. The stored/displayed image retains its resolution; only inference input is reduced. Boxes remain normalized and are drawn on the original displayed image. Smaller inference images can miss small objects or change predictions; use a larger mode when needed. Lower modes are speed/accuracy choices, not guarantees of equivalent accuracy.

Each detection displays its actual input dimensions, image-preparation time, inference time, finish time, loading time for that click and total click duration. The workbench summary also shows inference time and mode for each saved image's latest detection. The first detection may include model download/initialization; repeat the same image without Stop to compare warm inference. Stop still releases the model.

CPU-only, **one thread** is retained in this release; Apache isolation headers are not changed. Low aggregate CPU percentage can therefore remain normal even when latency is much lower. No WebGPU or local application installation is introduced. The measured resize bottleneck is addressed first; this is not a claim of tested multithread acceleration.

Reference benchmark on the build machine, single-thread CPU/WASM: the previous preprocessing produced 1,333 × 999 input with about 14.6 seconds warm inference. The corrected Fast path produced 512 × 384 input with about 0.65 seconds warm inference; both detected two cats on that photograph. This is one image on one machine, not a laptop performance promise or an accuracy benchmark. Actual patched-worker tests also cover repeated Fast/Balanced/Detailed inference and a 960-pixel detailed input. The first warm-up run can be slower.

To test after installation: hard-refresh, open AI, leave Fast selected, upload the same photo used previously, and click Detect Objects twice. Compare the second click and send the timing line if it is still slow. You can also run the existing dashboard workbench; no extra dashboard widget is added for timing.

## Compact AI panel and OCR

Open `/blocks/`, close old editor tabs and hard-refresh. Choose **Show Spaces → AI**. The **Tool** dropdown selects **Object Detection** or **Read Text (OCR)**. Three tabs keep the interface compact:

- **Image:** camera/capture/upload, optional named-image collection, source preview, and OCR crop controls.
- **Process:** only the selected tool's settings and action. Advanced settings stay collapsed.
- **Results:** only the selected tool's results. Object detection retains its image/boxes/list/timing. OCR shows selectable text, optional word boxes, confidence, timing, Copy Text and Download Text.

Capture/upload uses the current unsaved image immediately. Open Named images and choose Save Current Image only when you want to retain a named copy in this session. The existing Dashboard Workbench still names captures/uploads explicitly. Changing tools does not require another image capture. Each engine loads only when processing/preparation is requested. The detector is released when OCR starts; OCR is released when object detection starts. Only the active heavy engine stays loaded. Images stay in the originating browser. Cancel / Stop Camera releases workers and camera; a program waiting on the cancelled operation ends normally through its Stop path. Reload/project/account reset also clears images and OCR text.

### Quick OCR test

1. Select **Read Text (OCR)** and open **Process**.
2. Click **Load Sample Label**, which loads a small local sample without starting OCR.
3. Return to **Process** and click **Read Text**. Wait for first-use English/runtime loading.
4. Results should include `CODY NICK` and `Temperature 24 C`. Click Read Text again for a warm timing comparison.
5. Try your own upright English photo using Image → Upload Image or camera capture. Crop around a label or paragraph for quicker reading.

To crop: in **Image**, enable **Read selected area only** and drag a rectangle on the source preview. Then choose **Process → Read Text**. Clear Selection switches back to the whole image. Code reads the whole image unless an explicit normalized region is supplied.

Only English printed text and numbers are included. No handwriting, PDF ingestion, language downloads, automatic rotation or curved-text correction is introduced. Use a sharp, well-lit image. Text layout is Auto by default; Text block and Single line are visible options. Word boxes are off by default to avoid unnecessary output work.

OCR uses **Tesseract.js 7.0.0**, its LSTM-only WASM engine and **English tessdata_fast** pinned at commit `87416418657359cb625c412a48b6e1d6d41c29bd`. The selected core, wrapper scripts and compressed English data total about **6 MB** before HTTP compression/cache; fallback core variants are included in the ZIP but not all downloaded. Language data can be cached in IndexedDB; images are not placed there. Standard, SIMD and relaxed-SIMD core variants support modern browsers without requiring a GPU or SharedArrayBuffer/server-header changes.

A small controller worker owns the Tesseract worker, so OCR work remains off the UI thread and cancellation can terminate the worker tree. The OCR worker is reused between reads; model/runtime initialization is timed separately from recognition. Clear text/results on image changes prevents stale text being mistaken for a new image.

### Five-widget OCR example

**Examples → AI → AI + Dashboard - Read English Text** contains matching Blocks/Python and exactly five widgets: **Load sample**, **Read Text**, **Source image**, **Recognized text**, and **Status**.

Run, click Load sample, then Read Text. Status shows confidence and OCR time. For your own image, upload/capture it in the AI Image tab before Run. The example leaves the existing Object Detection Workbench unchanged. Its image/recognized text are shown on Dashboard, and the full OCR result is available in AI → Results.

### OCR programming

```python
from codynick import ai

await ai.choose_image()  # click Upload Image in the revealed Image tab
await ai.prepare_ocr()   # optional; read_text prepares automatically
text = await ai.read_text()
print(text)
print(ai.ocr_confidence())  # 0–100 percent
print(ai.ocr_elapsed())     # seconds spent on recognition
print(ai.ocr_contains("CODY"))  # case-insensitive

# Read a normalized region: x, y, width, height, each in [0, 1].
text = await ai.read_text(layout="block", region=[0.1, 0.2, 0.5, 0.3], words=True)
print(ai.ocr_results())  # text, confidence, word boxes, region, dimensions, timings
```

The AI Blocks category adds Prepare English OCR, Load sample text image, Read English text, Image is ready?, Recognized text, OCR confidence/time, Text contains, and Show OCR image on dashboard. Their Python counterparts also include `await ai.ocr_sample()`, `await ai.has_image()` and `await ai.show_ocr_image(name)`.

Word boxes returned by `ocr_results()` are normalized to the full source image, including when reading a crop. OCR confidence is 0–100; object detector confidence remains 0–1 in detailed results. Blocks/Python use cached text/confidence after the most recent successful read. Taking/choosing another image clears that program's OCR cache. Failed reads clear its cache as well. OCR text kept in the AI panel is not automatically serialized in projects; text explicitly copied by a program into dashboard widgets or console output follows existing saved-project behavior.

## New example: AI + Dashboard - Named Image Workbench

Open **Examples → AI → AI + Dashboard - Named Image Workbench**. It contains both Blocks and Python and a saved 17-widget dashboard layout. Choose either language, press **Run**, then work entirely from **Dashboard**:

1. **Camera** selects Default, Front or Rear. After camera permission, available named physical cameras are added too. Select a camera, then press **Start Camera**. Its low-rate live preview appears on Dashboard.
2. **Capture button title** changes the label of the capture button. Its program/widget identifier remains `Take Picture`, so renaming the label does not break the example.
3. Enter **Capture name**, then press the capture button. This stores a named photo but does not run detection. A duplicate name asks before replacement.
4. For a photo you already have, enter **Upload image name**, press **Upload Image**, and choose a JPEG, PNG or WebP file. The named upload is added to the session collection and selected automatically.
5. **Image source** chooses **Camera capture** (the latest named camera capture) or **Saved image**. The **Saved image** dropdown selects a previously captured or uploaded photo. Switching images restores that image's last results, if already analysed.
6. Set **Confidence** (1–100%, default 50) and press **Detect Objects**. The camera is not triggered again by detection.
7. Read **Detected image**, **Detection summary**, and the table **Detection results** with object number, label and confidence percentage. Zero detections are shown as zero, without retaining an old result table.
8. **Stop Camera** releases the camera; saved photos remain available for detection. The editor's **Stop** ends the program, releases the camera and destroys the AI model worker.

Upload works without any camera. Empty names, unavailable images, permission denial and detector errors appear in **AI status** and leave the workbench available to correct the problem. A new photo clears its old detection results. The model loads when first needed, with progress status. Existing account run-duration/cooldown rules still apply; use a suitable test-account duration for first model loading.

The example's Blocks/Python loop is explicit: create the workbench, refresh its controls, and react to Start Camera / Take Picture / Detect Objects / Stop Camera dashboard buttons. Upload is attached to a real browser click so the file picker satisfies browser requirements. The helper blocks encapsulate named-image management and output drawing; the original lower-level AI blocks/functions remain available.

## Images and browser sessions

- Up to **12 named images** are held in the originating editor's memory, retained at up to 1,920 pixels on the longest edge and 3 megapixels each, within a 16-megapixel collection budget. Input limit: 12 MB and 24 megapixels. OCR benefits from sharp source text; object detection makes its own smaller working image so its speed fix is retained. Remove images in the AI panel after stopping a program.
- Images are not sent to the server, placed in localStorage or embedded in `.codynick`/account/Community snapshots. Camera IDs, upload bindings and image references are reset for saved projects. Code, control text, layout and derived summary/table values can be saved normally.
- Loading a project, changing accounts or closing/reloading the originating editor clears the image collection. Stopping a program retains it for the current editor session.
- Embedded and separate Dashboard views use same-origin in-browser messages for preview and annotated still images. Keep the originating editor open. Preview is deliberately low-rate to limit CPU/memory demand. A separate tab may lose its live view when the browser suspends the originating editor; resume that tab to continue.
- Model/runtime downloads are served from your website. AI uses **CPU/WASM**, one thread, with no GPU requirement, local PC installation or AI service on the VPS.

## Programming additions

The existing eight object-detection blocks/functions are retained. The AI category adds:

| Block | Python |
|---|---|
| Create image detection dashboard | `await ai.workbench_setup()` |
| Refresh image dashboard controls | `await ai.workbench_sync()` |
| Image dashboard action: start / capture / detect / stop | `await ai.workbench_action("capture")` |

```python
from codynick import ai, dashboard, wait

await ai.workbench_setup()
while True:
    await ai.workbench_sync()
    if await dashboard.clicked("Start Camera"):
        await ai.workbench_action("start")
    if await dashboard.clicked("Take Picture"):
        await ai.workbench_action("capture")
    if await dashboard.clicked("Detect Objects"):
        await ai.workbench_action("detect")
    if await dashboard.clicked("Stop Camera"):
        await ai.workbench_action("stop")
    await wait(0.1)
```

Reusable Dashboard additions include text inputs, dropdowns, image-output placeholders and tables. Blocks provide text/dropdown reporters, dropdown choices separated by `|`, dynamic titles, and creation of image/table widgets. Image values are session media references rather than arbitrary image URLs. Python adds `dashboard.text_input`, `select`, `options`, `image`, `table` and `title`; `await dashboard.value(name)` reads text/dropdown input. Tables accept the existing key/value JSON format or a JSON object with `columns` and `rows`.

The original **AI + Dash - Person Detector** example is still included. The old View Python hardware-script preview does not translate browser AI; use the actual Python editor and the paired examples.

## Runtime and limits

The detector is unchanged: Transformers.js **3.8.1**, ONNX Runtime Web **1.22.0-dev.20250409-89f8206ba4**, and quantized **Xenova/yolos-tiny**, pinned revision `e2f9c7673f0fa61849efe2b56a0d7774779ebb9d`. Approximate first-use model/runtime transfer is 32 MB, subject to browser caching. Licenses and model cards are bundled.

The 80 COCO classes are predefined; this does not identify arbitrary custom gadgets or recognize faces. Detection is probabilistic. Device performance and memory vary, especially on phones. Camera access requires HTTPS and permission; Front/Rear is a preference on devices that do not expose both. Uploaded images provide the camera-free test path.

## Validation scope

The cumulative installer is tested for fresh-base deployment, known CAS-generated page variations, previous-AI upgrade, repeat installation, code mismatch/corruption/symlink refusal, partial failure recovery and exact rollback. Workbench fixtures exercise camera enumeration and selection, capture/upload names, duplicate handling, editable button titles, source switching, independent detection, image/table outputs, zero detections, recoverable errors, and snapshot privacy. The complete Blockly example is executed with the actual interpreter and shared dashboard store against mocked camera/inference operations. Dashboard HTML is tested with a DOM implementation for actual input events, dropdowns, upload-picker attachment and escaped three-column tables. Existing Node regression suites are retained.

OCR validation adds real English-fast recognition on three synthetic printed samples (label, paragraph and page), matching expected text after whitespace normalization. Measured warm reads were approximately 0.04–0.3 seconds on the build machine, not a guarantee for real photos/devices. The actual browser UMD client and controller protocol were exercised with a real Node-worker/WASM adapter, including word boxes. UI fixtures cover cropping, text/copy/confidence/timing, worker reuse/cancellation, and the five-widget Blockly example. These do not replace a real-browser subworker/camera/mobile acceptance test.

The unchanged model previously passed actual CPU/WASM inference on a reference photo. Full rendered-browser/physical-camera/mobile acceptance for this new workbench remains a reserve-server test; DOM fixtures are not a substitute for those checks. No production deployment or physical-device testing of this revision is claimed.
