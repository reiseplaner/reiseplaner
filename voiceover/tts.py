"""
Generates per-segment Text-to-Speech audio using the OpenAI TTS API.

Supported voices (OpenAI tts-1-hd):
  alloy, echo, fable, onyx, nova, shimmer

For multilingual content, 'onyx' and 'nova' tend to handle non-English
pronunciations well. 'fable' is good for storytelling/documentary style.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Literal

from .translator import TranslatedSegment

TTS_MODEL = "tts-1-hd"
TTS_DEFAULT_VOICE = "onyx"

VoiceType = Literal["alloy", "echo", "fable", "onyx", "nova", "shimmer"]


@dataclass
class TTSSegment:
    """A translated segment together with its generated audio file."""
    translated: TranslatedSegment
    audio_path: Path
    audio_duration: float  # seconds, measured after generation


def generate_tts_segments(
    translated_segments: list[TranslatedSegment],
    output_dir: str | Path,
    voice: VoiceType = TTS_DEFAULT_VOICE,
    api_key: Optional[str] = None,
) -> list[TTSSegment]:
    """
    Generates MP3 audio for every translated segment and returns TTSSegment list.

    Args:
        translated_segments: From translator.translate_segments().
        output_dir: Directory where per-segment MP3s are written.
        voice: OpenAI TTS voice name.
        api_key: OpenAI API key. Falls back to OPENAI_API_KEY env variable.
    """
    from openai import OpenAI
    from pydub import AudioSegment as PydubSegment

    client = OpenAI(api_key=api_key) if api_key else OpenAI()
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    lang = translated_segments[0].target_language if translated_segments else "??"
    print(f"Generiere TTS ({lang}, voice='{voice}') für {len(translated_segments)} Segmente ...")

    tts_segments = []
    for ts in translated_segments:
        idx = ts.original.index
        out_path = output_dir / f"segment_{idx+1:02d}_{lang}.mp3"

        print(f"  [{idx+1}] TTS: '{ts.translated_text[:60]}...' → {out_path.name}")

        response = client.audio.speech.create(
            model=TTS_MODEL,
            voice=voice,
            input=ts.translated_text,
            response_format="mp3",
        )
        response.stream_to_file(str(out_path))

        # Measure actual audio duration
        audio = PydubSegment.from_mp3(str(out_path))
        duration = len(audio) / 1000.0  # ms → s

        print(f"       Original: {ts.original.duration:.1f}s | TTS: {duration:.1f}s | "
              f"Budget: {ts.original.budget:.1f}s")

        tts_segments.append(
            TTSSegment(
                translated=ts,
                audio_path=out_path,
                audio_duration=duration,
            )
        )

    return tts_segments
