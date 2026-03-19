"""
Main pipeline: orchestrates transcription → translation → TTS → assembly.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .transcriber import TranscriptionResult, transcribe_from_script
from .translator import TranslatedSegment, translate_segments
from .tts import TTSSegment, generate_tts_segments, VoiceType, TTS_DEFAULT_VOICE
from .audio import AssemblyReport, assemble_audio, print_assembly_report


@dataclass
class PipelineConfig:
    # Input
    audio_path: Path                   # German MP3
    script_text: str                   # German script with [pause X seconds] markers
    target_language: str               # e.g. "fr", "en", "es"

    # Output
    output_dir: Path                   # base directory for all outputs

    # Optional overrides
    voice: VoiceType = TTS_DEFAULT_VOICE
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    def __post_init__(self):
        self.audio_path = Path(self.audio_path)
        self.output_dir = Path(self.output_dir)

    @property
    def segments_dir(self) -> Path:
        return self.output_dir / "segments" / self.target_language

    @property
    def final_output_path(self) -> Path:
        stem = self.audio_path.stem
        return self.output_dir / f"{stem}_{self.target_language}.mp3"


@dataclass
class PipelineResult:
    config: PipelineConfig
    transcription: TranscriptionResult
    translations: list[TranslatedSegment]
    tts_segments: list[TTSSegment]
    assembly_reports: list[AssemblyReport]
    output_path: Path


def run_pipeline(config: PipelineConfig) -> PipelineResult:
    """
    Runs the full voiceover pipeline end-to-end.

    Steps:
      1. Transcribe German audio → timestamps per segment
      2. Translate segments → target language
      3. Generate TTS audio per translated segment
      4. Assemble final audio with timing adjustment
    """
    _banner(f"Voiceover Pipeline: DE → {config.target_language.upper()}")

    # ── Step 1: Transcription ────────────────────────────────────────────────
    _step(1, "Transkription mit Timestamps (Whisper)")
    transcription = transcribe_from_script(
        audio_path=config.audio_path,
        script_text=config.script_text,
        api_key=config.openai_api_key or os.getenv("OPENAI_API_KEY"),
    )
    transcription.print_summary()

    # ── Step 2: Translation ──────────────────────────────────────────────────
    _step(2, f"Übersetzung nach {config.target_language.upper()} (Claude)")
    translations = translate_segments(
        segments=transcription.segments,
        target_language=config.target_language,
        api_key=config.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY"),
        source_language=transcription.source_language,
    )

    # Print translation preview
    print()
    for t in translations:
        budget_s = t.original.budget
        print(f"  [{t.original.index+1}] Budget: {budget_s:.1f}s")
        print(f"       DE: {t.original.text[:80]}...")
        print(f"       {config.target_language.upper()}: {t.translated_text[:80]}...")
    print()

    # ── Step 3: TTS Generation ───────────────────────────────────────────────
    _step(3, f"TTS-Generierung (OpenAI, voice='{config.voice}')")
    tts_segments = generate_tts_segments(
        translated_segments=translations,
        output_dir=config.segments_dir,
        voice=config.voice,
        api_key=config.openai_api_key or os.getenv("OPENAI_API_KEY"),
    )

    # ── Step 4: Audio Assembly ───────────────────────────────────────────────
    _step(4, "Audio-Montage mit Timing-Anpassung")
    reports = assemble_audio(
        tts_segments=tts_segments,
        output_path=config.final_output_path,
    )
    print_assembly_report(reports)

    _banner(f"Fertig! → {config.final_output_path}")

    return PipelineResult(
        config=config,
        transcription=transcription,
        translations=translations,
        tts_segments=tts_segments,
        assembly_reports=reports,
        output_path=config.final_output_path,
    )


def _banner(text: str) -> None:
    line = "─" * (len(text) + 4)
    print(f"\n┌{line}┐")
    print(f"│  {text}  │")
    print(f"└{line}┘\n")


def _step(n: int, text: str) -> None:
    print(f"\n{'='*60}")
    print(f"  Schritt {n}: {text}")
    print(f"{'='*60}")
