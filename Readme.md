# Feelio: The Multimodal AI Therapist

> **"Dr. Libra listens to your voice and reads your eyes to understand what you aren't saying."**

Feelio is an advanced AI mental health companion that goes beyond text. By fusing **Voice Analysis** (Audio) and **Facial Expression Recognition** (Vision), it detects emotional contradictions—like when you say *"I'm fine"* but look sad—and responds with clinical-grade psychological support.

---

## 🧠 Core Intelligence: "Dr. Libra"
The AI persona, **Dr. Libra**, is modeled after a Clinical Psychologist (PhD).
* **Methodology:** Uses **CBT (Cognitive Behavioral Therapy)**, Socratic Questioning, and "Holding Space" protocols.
* **Multimodal Empathy:** If your face shows distress but your words deny it, Dr. Libra gently challenges the contradiction.
* **Safety First:** Includes a dedicated **Crisis Intervention Protocol** that overrides standard therapy if self-harm or severe distress is detected.

---

## 📂 Repository Structure (Monorepo)

This project is organized as a monorepo containing both the backend intelligence and the frontend interface.

```text
feelio/
├── feelio-be/          # 🧠 Python Backend (The "Brain")
│   ├── main.py         # Entry point (Orchestrator)
│   ├── vision_module.py# MediaPipe Face Mesh System
│   ├── audio_module.py # Speech-to-Text & TTS
│   ├── config.py       # Environment Configuration
│   └── ...
│
├── feelio-fe/          # 💻 Frontend (React/Next.js - Coming Soon)
│   └── ...
│
└── DEPLOYMENT.md       # Production Deployment Guide