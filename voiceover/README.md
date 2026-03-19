# Multilingual Voiceover Automation Pipeline

Automatisiert die Übersetzung und Timing-Anpassung von YouTube-Reise-Voiceovers.

## Workflow

```
Deutsches MP3 + Skript (.txt)
        │
        ▼
[1] Whisper Transkription
    → Timestamps pro Segment (anhand Pausen im Audio)
        │
        ▼
[2] Claude Übersetzung
    → Jedes Segment einzeln übersetzt, Zeitbudget-aware
        │
        ▼
[3] OpenAI TTS Generierung
    → MP3 pro Segment in Zielsprache
        │
        ▼
[4] Audio-Montage
    → Tempo-Anpassung wenn Zielsprache länger
    → Finale MP3 mit originalem Timing-Budget
```

## Skript-Format

Dein Skript muss `[pause X seconds]` Marker enthalten – das sind die Schnittmarken:

```
Erster Abschnitt Text...

[pause 3 seconds]

Zweiter Abschnitt Text...

[pause 4 seconds]

Dritter Abschnitt Text...
```

## Installation

```bash
# System-Abhängigkeit
sudo apt install ffmpeg   # Ubuntu/Debian
# brew install ffmpeg     # macOS

# Python-Pakete
pip install -r voiceover/requirements.txt
```

## Umgebungsvariablen

```bash
export OPENAI_API_KEY="sk-..."        # Für Whisper + TTS
export ANTHROPIC_API_KEY="sk-ant-..."  # Für Claude Übersetzung
```

## Verwendung

```bash
# Versailles auf Französisch:
python -m voiceover.cli \
  --audio versailles_de.mp3 \
  --script voiceover/example_versailles_de.txt \
  --lang fr \
  --voice onyx \
  --output ./output/versailles

# Unterstützte Zielsprachen: fr, en, es, it, pt, nl, pl, ja, zh, ko, ar
# Unterstützte Stimmen:       alloy, echo, fable, onyx, nova, shimmer
```

## Ausgabe-Struktur

```
output/versailles/
├── versailles_de_fr.mp3            ← Fertiges Französisch-Audio
└── segments/
    └── fr/
        ├── segment_01_fr.mp3       ← Segment 1 (unbearbeitet)
        ├── segment_02_fr.mp3       ← Segment 2
        └── segment_03_fr.mp3       ← Segment 3
```

## Timing-Logik

| Situation | Lösung |
|---|---|
| TTS kürzer als Original | Restzeit wird zur Pause |
| TTS leicht länger (bis +30%) | Audio auf max. 1.30x beschleunigt |
| TTS deutlich länger (+30%) | Max-Speed + Warnung; Pause reduziert auf Min. |

Die `[pause X seconds]` in deinem Skript fungieren als **Zeitpuffer** —
wenn Französisch z.B. 15% länger ist als Deutsch, wird die Pause entsprechend kürzer.

## Eigener Workflow (Python API)

```python
from voiceover.pipeline import PipelineConfig, run_pipeline

config = PipelineConfig(
    audio_path="versailles_de.mp3",
    script_text=open("versailles_de.txt").read(),
    target_language="fr",
    output_dir="./output/versailles",
    voice="onyx",
)

result = run_pipeline(config)
print(f"Fertig: {result.output_path}")
```
