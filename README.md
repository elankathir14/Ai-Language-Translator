# AI Language Translator 🌐⚡

[![Python Version](https://img.shields.io/badge/Python-3.10%20%7C%203.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Framework](https://img.shields.io/badge/Framework-Flask%203.x-black?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Deploy to Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?logo=render&logoColor=white)](https://render.com)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/)
[![Internship](https://img.shields.io/badge/CodeAlpha-AI%20Internship%20Project-6366f1)](https://codealpha.tech/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A state-of-the-art, neural-powered web application for real-time multilingual text translation, speech recognition, and audio synthesis. Developed as a capstone internship project for the **CodeAlpha Artificial Intelligence Internship**...

---

## 📖 Table of Contents

- [Project Title](#project-title)
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Architecture & How the Application Works](#architecture--how-the-application-works)
- [Installation Steps](#installation-steps)
- [Environment Variable Setup](#environment-variable-setup)
- [How to Run the Project](#how-to-run-the-project)
- [Deploying on Render](#️-deploying-on-render)
- [API Configuration & Modular Providers](#api-configuration--modular-providers)
- [Screenshots & UI Showcase](#screenshots--ui-showcase)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Future Enhancements](#future-enhancements)
- [Internship Project Information](#internship-project-information)

---

## 🌟 Project Overview

**AI Language Translator** is a full-stack, modular AI translation suite built on Python, Flask, and modern web standards. Unlike tutorial-grade translation widgets, this system is engineered with an enterprise-style architecture featuring:

1. **Pluggable Translation Engine**: A decoupled provider abstraction that supports Google Translate (Cloud API & GTX Engine), MyMemory Translated API, and Google Gemini Generative AI, complete with seamless automatic failover.
2. **Interactive Audio Accessibility**: Integrated browser-native Speech-to-Text (STT) for voice input and multilingual Text-to-Speech (TTS) for natural vocal pronunciation.
3. **Persistent Translation History**: Client-side `localStorage` caching allowing users to inspect, copy, or restore previous translations across sessions without relying on complex database setups.
4. **Glassmorphic Responsive Dashboard**: Modern dashboard aesthetics with both dark and light modes, ambient animated glow effects, micro-interactions, live word/character counters, and keyboard accessibility.

---

## ✨ Key Features

| Category | Features |
| :--- | :--- |
| **Translation Engine** | Real-time translation across 54 global & regional languages categorized by region, including **English, Tamil, Hindi, Telugu, Malayalam, Kannada, French, German, Spanish, Japanese, and Korean**. |
| **Smart Detection** | Automatic Source Language Detection ("Auto Detect") that identifies the input language and returns its name and country flag. |
| **Interactive Controls** | **Swap Languages** button that exchanges source and target selections (and text content) with animated rotation. |
| **Voice Input (STT)** | Browser Web Speech API integration that listens through the user's microphone with live audio pulsation indicators. |
| **Speech Output (TTS)** | Natural Text-to-Speech synthesis that reads out translations in authentic target language accents with animated sound waves. |
| **Live Telemetry & Status** | Live status bar showing detected language, selected target language, active AI engine, and response latency in milliseconds. |
| **Counters & Validation** | Dynamic character and word counters with a 5,000-character safety limit and validation against empty inputs. |
| **History & Persistence** | Recent translation history stored in browser `localStorage` with quick restore, copy, and deletion options. |
| **Theme System** | Sleek Dark Mode (default) and Crisp Light Mode with instant toggle and local preference persistence. |
| **Keyboard Friendly** | Full accessibility with keyboard shortcuts: <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to translate, <kbd>Alt</kbd> + <kbd>S</kbd> to swap, <kbd>Alt</kbd> + <kbd>C</kbd> to copy, <kbd>Esc</kbd> to clear. |

---

## 🛠️ Technologies Used

### Backend
- **Python 3.11+**: Core programming language.
- **Flask 3.x**: Lightweight WSGI web framework for serving endpoints and routing.
- **python-dotenv**: Secure environment variable loader for non-hardcoded credentials.
- **requests**: High-performance HTTP client for communicating with translation APIs.
- **deep-translator**: Multi-provider translation library and adapter.

### Frontend
- **HTML5**: Semantic document structure with high accessibility (`aria-live`, semantic landmarks).
- **CSS3 (Vanilla)**: Custom design system utilizing CSS custom properties, glassmorphism, flexbox/grid, and responsive media queries.
- **JavaScript (Vanilla ES6+)**: Modular application architecture, DOM event delegation, clipboard API, and Web Speech API.
- **Google Fonts**: Modern typography featuring *Outfit* and *Inter*.
- **Font Awesome 6**: Vector UI icons for intuitive controls.

---

## 📐 Architecture & How the Application Works

```
┌────────────────────────────────────────────────────────┐
│                   Client Browser UI                    │
│   (HTML5 + Vanilla CSS Glassmorphism + Modern JS)      │
│   • Voice Input (STT)      • Audio Playback (TTS)      │
│   • LocalStorage History   • Dark / Light Theme        │
└───────────────────────────┬────────────────────────────┘
                            │
              REST API (JSON / HTTP POST)
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Flask Web Server                    │
│               app.py (Routes & API logic)              │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│            TranslatorService Orchestrator              │
│            (Validation, Failover, Latency)             │
└──────────────┬────────────┬─────────────┬──────────────┘
               │            │             │
        ┌──────▼──────┐ ┌───▼───────┐ ┌───▼───────────┐
        │ Google GTX/ │ │ MyMemory  │ │ Google Gemini │
        │ Cloud API   │ │ API       │ │ 1.5 Flash AI  │
        └─────────────┘ └───────────┘ └───────────────┘
```

### Flow of Execution:
1. **User Action**: The user enters or speaks text into the source text area and selects a target language (or uses "Auto Detect").
2. **Client Validation**: The frontend validates that the input is non-empty and under the 5,000-character ceiling, then displays an animated loading state.
3. **API Request**: A `POST` request is dispatched to `/api/translate` containing the text, source language, target language, and preferred engine.
4. **Backend Processing**: `TranslatorService` validates the payload, measures processing latency, invokes the primary provider, and automatically fails over to secondary engines if any provider experiences rate limits or timeouts.
5. **Response Rendering**: The translated text, detected source language, flag, and latency metrics are rendered in the dashboard, and an entry is saved to browser `localStorage`.

---

## 🚀 Installation Steps

### Prerequisites
- Python 3.10 or higher installed on your system.
- Git installed (optional, for cloning).

### 1. Clone or Download the Repository
```bash
git clone https://github.com/your-username/CodeAlpha_LanguageTranslationTool.git
cd CodeAlpha_LanguageTranslationTool
```

### 2. Create a Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

---

## ⚙️ Environment Variable Setup

The application strictly separates configuration from source code using environment variables. **No API keys are hardcoded.**

1. Copy the sample environment file to create your local `.env`:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux / Bash
cp .env.example .env
```

2. Review or customize your `.env` settings:
```env
# Flask Server Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5000
SECRET_KEY=your_secret_key_here

# Translation Provider Selection
# Options: "google" (default, free & reliable), "mymemory", "gemini"
TRANSLATION_PROVIDER=google

# Provider API Credentials (Optional - Default Google GTX engine works without keys!)
GOOGLE_TRANSLATE_API_KEY=
MYMEMORY_API_KEY=
MYMEMORY_EMAIL=
GEMINI_API_KEY=
```

---

## 🏃 How to Run the Project

Start the Flask development server:
```bash
python app.py
```

Once started, open your web browser and navigate to:
```
http://127.0.0.1:5000
```

To stop the server, press <kbd>Ctrl</kbd> + <kbd>C</kbd> in your terminal.

---

## ☁️ Deploying on Render

This repository is pre-configured for instant zero-configuration deployment on [Render](https://render.com) using the included [`render.yaml`](render.yaml) blueprint and [`Procfile`](Procfile).

### Option A: 1-Click Blueprint Deploy (Recommended)
1. Log in to [Render](https://dashboard.render.com).
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your GitHub repository (`elankathir14/Ai-Language-Translator`).
4. Render will automatically detect [`render.yaml`](render.yaml) and configure:
   - **Service Type**: Web Service
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Click **Apply**. Render will build and deploy your application with a live public HTTPS URL (e.g., `https://ai-language-translator.onrender.com`).

### Option B: Manual Web Service Setup
1. On your Render Dashboard, click **New +** → **Web Service**.
2. Select your repository: `elankathir14/Ai-Language-Translator`.
3. Configure the settings:
   - **Name**: `ai-language-translator`
   - **Region**: Choose the closest region (e.g., Oregon or Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: `Free`
4. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: (Generate or enter any secure random string)
   - `TRANSLATION_PROVIDER`: `google`
5. Click **Deploy Web Service**. Render will install dependencies and start your live server.

---

## 🔌 API Configuration & Modular Providers

The translation architecture is located under `services/providers/`:

```
services/
├── translator_service.py         # Main orchestrator & fallback logic
└── providers/
    ├── base_provider.py          # Abstract base provider class
    ├── google_provider.py        # Google Cloud & GTX engine provider
    ├── mymemory_provider.py      # MyMemory Translated API provider
    └── gemini_provider.py        # Gemini 1.5 Flash AI provider
```

### Supported Providers:
1. **Google Translate (Default)**:
   - **Zero Key Required**: Uses Google's high-speed neural translation engine out of the box.
   - **Google Cloud API**: Set `GOOGLE_TRANSLATE_API_KEY=your_key` in `.env` if you prefer your own Google Cloud Translate billing quota.
2. **MyMemory Translated API**:
   - Free tier provides up to 5,000 words/day without registration.
   - Setting `MYMEMORY_EMAIL=you@example.com` in `.env` increases daily allowance to 50,000 words.
3. **Google Gemini AI (1.5 Flash)**:
   - Provides contextual, conversational nuance.
   - Add your Gemini API key: `GEMINI_API_KEY=your_gemini_key` in `.env` and set `TRANSLATION_PROVIDER=gemini`.

---

## 📸 Screenshots & UI Showcase

<img width="1606" height="987" alt="image" src="https://github.com/user-attachments/assets/52d8c3cd-9efb-4744-b380-475f907bb1b7" />


<!-- Placeholder for internship presentation and report screenshots -->
### Desktop Dashboard (Dark Theme)
```
+-----------------------------------------------------------------------------------------+
| [A/文] AI Language Translator  • CodeAlpha AI Internship            [● Engine Online] [☀] |
+-----------------------------------------------------------------------------------------+
| From: [ 🌐 Auto Detect  ▼ ]      [ ⇄ Swap ]      To: [ 🇮🇳 Tamil (தமிழ்) ▼ ]  Engine: [⚡] |
+-----------------------------------------------------------------------------------------+
| +------------------------------------+     +------------------------------------------+ |
| | ✎ Source Text         [🎤] [📋] [↺] |     | ✨ Translated Result            [🔊] [📋] | |
| |------------------------------------|     |------------------------------------------| |
| | Hello, welcome to the CodeAlpha   |     | கோட்ஆல்ஃபா செயற்கை நுண்ணறிவு             | |
| | Artificial Intelligence            |     | இன்டர்ன்ஷிப் திட்டத்திற்கு வரவேற்கிறோம்! | |
| | internship project!                |     |                                          | |
| |------------------------------------|     |------------------------------------------| |
| | Chars: 71 / 5,000  • Words: 9       |     | Chars: 68  • Words: 5                    | |
| |                  [ ⚡ Translate ]  |     |                     Shortcut: Ctrl+Enter | |
| +------------------------------------+     +------------------------------------------+ |
+-----------------------------------------------------------------------------------------+
| [ Detected: 🇺🇸 English (en) ]  [ Target: 🇮🇳 Tamil (ta) ]  [ Engine: Google ]  [ ⏱ 142 ms ]|
+-----------------------------------------------------------------------------------------+
| 🕒 Recent Translation History                                          [ 🗑 Clear History ]|
|  • 🇺🇸 EN ➔ 🇮🇳 TA  | Hello, welcome... ➔ கோட்ஆல்ஃபா...               [↗] [📋] [🗑]        |
+-----------------------------------------------------------------------------------------+
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (or <kbd>Cmd</kbd> + <kbd>Enter</kbd>) | **Translate** the current source text |
| <kbd>Alt</kbd> + <kbd>S</kbd> | **Swap** source and target languages |
| <kbd>Alt</kbd> + <kbd>C</kbd> | **Copy** translated result to clipboard |
| <kbd>Esc</kbd> (in editor) | **Clear** the source editor |

---

## 🔮 Future Enhancements

- [ ] **Document Translation**: Add PDF, DOCX, and TXT upload with translated file download.
- [ ] **Camera / OCR Translation**: Optical character recognition via Tesseract or Google Vision for image translation.
- [ ] **Offline Translation Mode**: Integration of quantized local models (such as MarianMT / Opus-MT via ONNX).
- [ ] **Custom Vocabulary & Glossary**: Domain-specific terms for medical, legal, and engineering translations.

---

## 🎓 Internship Project Information

- **Company / Platform**: CodeAlpha
- **Domain**: Artificial Intelligence Internship
- **Project Title**: AI Language Translator
- **Developer**: CodeAlpha Intern
- **Status**: Completed & Verified

*Thank you for exploring the AI Language Translator project!*
