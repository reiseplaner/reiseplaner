"""
Transcribes audio with word/segment-level timestamps using OpenAI Whisper API.
Detects pause boundaries by finding gaps between speech segments.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

MIN_PAUSE_GAP_SECONDS = 1.5  # gaps shorter than this are ignored as natural breathing


@dataclass
class SpeechSegment:
    """A continuous block of speech between two pause markers."""
    index: int
    text: str
    start: float   # seconds in original audio
    end: float     # seconds in original audio
    pause_after: float  # seconds of silence after this segment (0.0 for last)

    @property
    def duration(self) -> float:
        return self.end - self.start

    @property
    def budget(self) -> float:
        """Total time budget: speech + pause. Translation must fit in this."""
        return self.duration + self.pause_after


@dataclass
class TranscriptionResult:
    segments: list[SpeechSegment]
    full_text: str
    source_language: str
    total_duration: float

    def print_summary(self) -> None:
        print(f"\n=== Transkription ({self.source_language}) ===")
        print(f"Gesamtdauer: {self.total_duration:.1f}s\n")
        for seg in self.segments:
            pause_info = f" | Pause danach: {seg.pause_after:.1f}s" if seg.pause_after > 0 else " | (letztes Segment)"
            print(f"[{seg.index+1}] {seg.start:.1f}s–{seg.end:.1f}s ({seg.duration:.1f}s){pause_info}")
            print(f"    {seg.text[:80]}{'...' if len(seg.text) > 80 else ''}")
        print()


def transcribe(audio_path: str | Path, api_key: Optional[str] = None) -> TranscriptionResult:
    """
    Transcribes audio file via OpenAI Whisper API and returns SpeechSegments
    with accurate timestamps and detected pause boundaries.

    Args:
        audio_path: Path to MP3/WAV/M4A audio file.
        api_key: OpenAI API key. Falls back to OPENAI_API_KEY env variable.
    """
    from openai import OpenAI

    client = OpenAI(api_key=api_key) if api_key else OpenAI()
    audio_path = Path(audio_path)

    print(f"Transkribiere '{audio_path.name}' mit Whisper ...")

    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    raw_segments = response.segments or []
    detected_lang = getattr(response, "language", "de")
    total_duration = raw_segments[-1]["end"] if raw_segments else 0.0

    speech_segments = _group_into_speech_segments(raw_segments, total_duration)

    full_text = " ".join(s.text for s in speech_segments)
    return TranscriptionResult(
        segments=speech_segments,
        full_text=full_text,
        source_language=detected_lang,
        total_duration=total_duration,
    )


def _group_into_speech_segments(
    raw_segments: list[dict],
    total_duration: float,
) -> list[SpeechSegment]:
    """
    Groups Whisper segments into larger SpeechSegments by detecting pause gaps.
    A gap >= MIN_PAUSE_GAP_SECONDS between two Whisper segments signals a [pause] marker.
    """
    if not raw_segments:
        return []

    groups: list[list[dict]] = [[raw_segments[0]]]
    pause_durations: list[float] = []

    for prev, curr in zip(raw_segments, raw_segments[1:]):
        gap = curr["start"] - prev["end"]
        if gap >= MIN_PAUSE_GAP_SECONDS:
            # This gap corresponds to a [pause X seconds] marker in the script
            pause_durations.append(gap)
            groups.append([curr])
        else:
            groups[-1].append(curr)

    # Last segment has no pause after it
    pause_durations.append(0.0)

    speech_segments = []
    for i, (group, pause_after) in enumerate(zip(groups, pause_durations)):
        text = " ".join(s["text"].strip() for s in group)
        text = re.sub(r"\s+", " ", text).strip()
        speech_segments.append(
            SpeechSegment(
                index=i,
                text=text,
                start=group[0]["start"],
                end=group[-1]["end"],
                pause_after=pause_after,
            )
        )

    return speech_segments


def transcribe_from_script(
    audio_path: str | Path,
    script_text: str,
    api_key: Optional[str] = None,
) -> TranscriptionResult:
    """
    Like transcribe(), but also uses the known script to validate segment count.
    The script_text should contain [pause X seconds] markers to indicate structure.
    """
    result = transcribe(audio_path, api_key)
    expected_pauses = _count_pause_markers(script_text)

    if len(result.segments) - 1 != expected_pauses:
        print(
            f"  Warnung: Skript hat {expected_pauses} Pausen-Marker, "
            f"im Audio wurden {len(result.segments) - 1} Pausen erkannt.\n"
            f"  Prüfe ob alle Pausen im Audio deutlich ≥{MIN_PAUSE_GAP_SECONDS}s lang sind."
        )

    return result


def _count_pause_markers(script_text: str) -> int:
    return len(re.findall(r"\[pause\s+\d+", script_text, re.IGNORECASE))
