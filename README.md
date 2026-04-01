<p align="center">
  <h1 align="center">影武者AI (Kagemusha AI)</h1>
  <p align="center">会議の影武者 —— 主君の代わりに静かに記録し、完璧に要約・補佐する</p>
  <p align="center">The shadow warrior that silently records, summarizes, and assists on your behalf</p>
</p>

> A local-first, privacy-focused AI meeting note tool with a Sengoku (戦国) spirit.
> Fork of [fastrepl/char](https://github.com/fastrepl/char), reimagined as an open-source alternative to Granola.ai.

## What is Kagemusha AI?

Kagemusha AI is an AI-powered meeting note app that acts as your **shadow warrior** — quietly capturing everything so you can stay focused on the conversation.

- **影のように静かに記録する** — Listens to your meetings without bots; captures audio directly from your computer
- **主君の声と敵将の声を聞き分ける** — Dual-channel transcription separates your voice (mic) from others (system audio)
- **影武者がそっと耳打ちする** — Lightweight real-time assist highlights key points during meetings (planned)
- **戦況を冷静に報告する** — Conversation metrics: talk ratio, speaking pace, question count (planned)
- Crafts perfect **summaries** from your memos after meetings end
- Runs completely **offline** via Ollama or LM Studio — your data never leaves your machine

## Core Principles

- **Complete local-first** — Ollama / LM Studio support out of the box
- **Privacy above all** — No data sent externally; everything stays on your machine
- **Lightweight** — Powered by Tauri (Rust backend), not Electron
- **Markdown-centric** — Simple, editable note experience

## Installation

> Currently in development. See [Development](#development) below to build from source.

## Features

### Notepad

Designed for quick note-taking during meetings. Jot down what matters most.

### Real-time Transcript

Stay engaged in the conversation while Kagemusha captures every detail.

### From Memos to Summaries

After the meeting, Kagemusha crafts a personalized summary based on your memos — or generates great summaries even without your notes.

### Truly Local

Works without any internet connection. Set up LM Studio or Ollama for fully air-gapped operation.

### Bring Your Own LLM

- Run local models via Ollama
- Use third-party APIs: Gemini, Claude, Azure GPT
- Stay compliant with your organization's requirements

### Note Templates

Choose from predefined templates (bullet points, agenda-based, paragraph) or create your own.

## Roadmap

### Phase 1 (Current)

- [x] Repository rebranding to Kagemusha AI
- [x] Dual-channel transcription foundation (separate audio streams + merge) — backend complete, mic (Channel 0) and speaker (Channel 1) are captured independently
- [x] Sengoku-themed templates: Commander's Battle Plan, After-Battle Review, Shadow Warrior's Intelligence Brief

### Phase 2

- [ ] Real-time lightweight Live Assist (side panel + key point highlights + auto-complete)
- [ ] Conversation metrics calculation and post-processing

### Phase 3

- [ ] Pre-meeting preparation wizard
- [ ] High-accuracy speaker diarization
- [ ] Windows support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript / React / Tauri |
| Backend | Rust (audio capture, core processing) |
| Transcription | Whisper-based (local) |
| LLM | Ollama / LM Studio / BYO API |
| Storage | Markdown + SQLite (local) |
| Data Store | TinyBase (schema) + Zustand (UI state) |
| Editor | TipTap |

## Development

```bash
# Install dependencies
pnpm install

# Desktop app (dev mode)
pnpm -F @hypr/desktop tauri:dev

# Web app (dev mode)
pnpm -F @hypr/web dev

# Format
pnpm exec dprint fmt

# Typecheck (TypeScript)
pnpm -r typecheck

# Typecheck (Rust)
cargo check
```

## Positioning vs Granola.ai

Kagemusha AI aims to reproduce and surpass Granola's "notepad + post-hoc AI enhancement" experience in open source:

| Feature | Granola | Kagemusha AI |
|---------|---------|-------------|
| No-bot recording | Yes | Yes |
| Notepad + AI summary | Yes | Yes |
| Dual-channel transcription | No | Planned |
| Complete offline mode | No | Yes |
| Open source | No | Yes (GPL-3.0) |
| Local LLM support | No | Yes |
| Privacy-first | Partial | Complete |

## License

[GPL-3.0](LICENSE)

## Acknowledgments

Built on the foundation of [Char](https://github.com/fastrepl/char) (formerly Hyprnote) by fastrepl.
