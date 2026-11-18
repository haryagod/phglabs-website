# Play reel (play.phglabs.in)

A ~28 second vertical (1080×1920) Instagram Reel for PHG Labs Play, made entirely with local tools: no stock footage,
music licences or cloud AI. Output: `out/phglabs-play-reel.mp4`.

| Step | Script | Tool |
|---|---|---|
| Voiceover | `01-voice.mjs` (lines in `script.json`) | Kokoro-82M TTS (`af_heart`) |
| Word timings for captions | `02-words.mjs` | whisper.cpp large-v3-turbo (CUDA) |
| Gameplay screenshots | `03-capture.mjs` | Playwright + Edge, plays the live games at phone size |
| Timeline (scenes, phone screens, taps, badges) | `04-timeline.mjs` | |
| Video | `05-render.mjs` + `composition.html` | Edge frame by frame → ffmpeg h264_nvenc |
| Music + SFX + mix | `06-audio.mjs` | synthesized in code, mixed to −14 LUFS |

`npm run all` does everything; `npm run build` re-renders after editing `composition.html` or the timing in `04-timeline.mjs`.
`npm run stills 1.9 5.5 13.6` renders preview frames to `build/stills.jpg`. `node 03-capture.mjs rf` re-captures one game.

The capture blocks every Google ad request, so recording never counts as (invalid) AdSense traffic.
Change the voice line in `script.json`, then run `npm run voice && npm run words && npm run build`.
`node_modules` is a directory junction to `../reel/node_modules` (Kokoro); recreate it with
`cmd /c mklink /J node_modules ..\reel\node_modules`.
