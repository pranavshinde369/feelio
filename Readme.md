# Feelio — Multimodal AI Therapist (Prototype)

Warm, voice-first therapist that fuses live speech with facial emotion cues. The app keeps a short, solution-focused style, offers targeted “playbooks,” and prints a mini summary at the end of each session.

## How it works
- Voice: SpeechRecognition captures mic input and streams it into Gemini.
- Vision: DeepFace runs in a background thread, tracks dominant emotion, and overlays it on the camera preview.
- Fusion loop: [therapist_fusion.py](therapist_fusion.py) blends speech + facial emotion + recent trajectory + contradiction checks, then calls Gemini with a solution-focused prompt.
- Output: Gemini replies are spoken with gTTS/pygame; pacing slows down when users speak quickly.
- Safety: A small keyword net intercepts self-harm language with a crisis-forward message before hitting the model.
- Session memory: Conversation turns and emotion history are logged to produce a concise text summary on shutdown.

## Project layout
- [therapist_fusion.py](therapist_fusion.py): Vision + voice fusion loop (recommended entry point).
- [therapist_core.py](therapist_core.py): Voice-only loop (no camera) with simpler prompting.
- [test_vision.py](test_vision.py): Standalone emotion preview from the webcam.
- [check_models.py](check_models.py): Quick Gemini model availability probe.

## Prerequisites
- Python 3.10+
- Working microphone and webcam
- Gemini API key (set as an environment variable)

## Install
```bash
pip install speechrecognition google-generativeai gTTS pygame opencv-python deepface
# If deepface pulls heavy backends, you may also need: pip install tensorflow
```

## Configure your key
```bash
# PowerShell example
$env:GEMINI_API_KEY="YOUR_KEY_HERE"

# Or create a .env file and load it yourself (recommended)
```
Then remove the hard-coded placeholders in the scripts or adjust them to read from the environment:
```python
import os
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

## Run
- Fusion (voice + vision, recommended):
```bash
python therapist_fusion.py
```
- Voice-only core loop:
```bash
python therapist_core.py
```
- Vision test only:
```bash
python test_vision.py
```

## What happens in a session
1) A camera thread keeps updating the current emotion and a short timeline buffer.
2) You press-and-speak; SpeechRecognition transcribes.
3) Gemini receives a fusion prompt that includes your words, facial emotion, trajectory, contradiction flag, and a suggested coping playbook.
4) The reply is voiced; pacing slows when you speak very fast.
5) On exit (say “stop” or hit Ctrl+C), a short text summary prints to the console.

## Current differentiators
- Emotion-aware fusion: combines text + live affect + recent trajectory for more grounded responses.
- Playbook selector: swaps in emotion/intent-specific micro-protocols (grounding, activation, pacing cues).
- Contradiction surfacing: gently notes when “I’m fine” conflicts with a distressed expression.
- Adaptive pacing: slows TTS and adds a short pause if user speech is long/fast.
- Lightweight safety net: catches common self-harm phrases before model calls and responds with crisis-forward language.
- Session recap: end-of-run console summary of feelings + actions.

## Out-of-the-box ideas to extend
- Micro-journaling pulse: offer a 60-second “write it down” mode that saves to a local, encrypted file.
- Detachment breaks: detect sustained anger and schedule a 2-minute “cool-down walk” timer with soft chimes.
- Emotion-aware reminders: send a follow-up nudge (email/SMS) with the last chosen playbook and a 24h check-in link.
- Dual-channel reflection: show a side-by-side of emotion timeline and message sentiment to highlight mismatches.
- Model mix: route safety/risk checks to a small local classifier, keep generative calls in the cloud.
- Handoff packet: export a one-page PDF summary with emotions trend + coping steps for a human therapist.
- Biofeedback-lite: if wearable/HR data is available, surface “you calmed 8 BPM after grounding” micro-reinforcement.
- Action streaks: show a streak for completed coping steps to build adherence, reset weekly.
- Intent router: classify “vent”, “reframe”, “plan”, “ground” and tune tone + length accordingly.
- Quiet mode: text-first UI variant that still shows live emotion tags but replies in concise text only.
- Collaborative check-ins: allow a user to share a sanitized summary with a trusted person and schedule a consented follow-up.
- Context-aware playlists: pair mood with short ambient audio loops (local) that fade in during grounding, off by default.
- Energy budgeting: user rates current energy (1–5); coach suggests only fits-in-5-min tasks matching energy.
- Gentle exposure ladder: track avoided situations, propose one tiny exposure step with a confidence slider.
- Empathy replay: one-tap replay of the last validating sentence, voiced slower for soothing.

## Safety & privacy
- Do not use for emergencies. Provide local emergency contacts in any deployment.
- Audio/video are processed locally for capture; text goes to Gemini for generation. Review Google’s data policies before production use.
- Remove hard-coded keys and load from environment/secrets; prefer `.env` or a secret manager.
- If you log sessions, encrypt or rotate files; clear them if users do not consent.

## Troubleshooting
- “Could not open webcam”: switch camera index in `cv2.VideoCapture(0)` to 1 or 2.
- gTTS lock issues on Windows: unique filenames are already used; if files linger, delete leftover `response_*.mp3`.
- SpeechRecognition timeouts: increase `timeout` and `phrase_time_limit` in `listen_to_user` if needed.

## Frontend prompt (for Lovable/Bolt/AI UI builders)
```
Design a single-page “Feelio” that feels sophisticated, calm, and irresistibly usable.

Layout:
- Left column: chat transcript with 1–3 sentence therapist turns, tiny time-stamps, and emotion chips inline. Add a “tone switch” toggle (concise vs. reflective).
- Right column: “Session Mirror” showing live emotion tag, a smooth emotion trajectory sparkline, a rotating “Next Action” playbook card, and a tiny “adherence streak” badge.
- Top bar: wordmark “Feelio”, session timer, mic toggle with clear state, privacy badge (“On-device capture; cloud LLM replies”), and a “Download summary” button.
- Bottom dock: large push-to-talk mic, quick intent chips (“Ground me”, “Reframe this”, “Plan next step”, “I feel anxious”), captions toggle, and a “Safety” button that opens local crisis resources.

Visual direction: dusk gradient (amber → deep teal) with glass panels, soft grain texture, and ambient glow accents. Typography: Sora (headings) and Manrope (body). Rounded cards, generous padding, elevated shadows that feel soft not heavy.

Motion: staggered load-in; emotion tag pulses softly on change; sparkline animates along the latest segment; Next Action card flip or slide when playbook updates; mic button has a breathing animation while listening.

UX polish: mobile-first responsive grid; high contrast and focus states; clear mic status (idle/listening/thinking); sticky bottom input area; no stock illustrations—use abstract shapes and soft light blobs.
Retention hooks: show adherence streak badge near the Next Action card; add a subtle “you calmed 8 BPM after grounding” toast when biofeedback is present; keep Safety and Privacy always one tap away.
```
