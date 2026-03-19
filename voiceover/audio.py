"""
Audio assembly: fits translated TTS segments into the original timing budget.

Algorithm per segment:
  budget  = original_speech_duration + original_pause_duration
  tts_dur = actual duration of generated TTS audio

  Case A (tts_dur <= budget - MIN_PAUSE):
    → keep TTS at original speed
    → remaining time = budget - tts_dur (used as pause, min MIN_PAUSE)

  Case B (tts_dur > budget - MIN_PAUSE):
    → required_speed = tts_dur / (budget - MIN_PAUSE)
    → if required_speed <= MAX_SPEED_UP: apply tempo change, use MIN_PAUSE after
    → if required_speed > MAX_SPEED_UP: speed up to MAX_SPEED_UP, accept overrun
      (log a warning, output will be slightly longer than original)

Speed adjustment uses ffmpeg's `atempo` filter (range 0.5–2.0 per pass, chainable).
"""

from __future__ import annotations

import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from pydub import AudioSegment
from pydub.generators import Sine

from .tts import TTSSegment

MIN_PAUSE_SECONDS = 0.8      # absolute minimum pause between segments
MAX_SPEED_UP = 1.30          # above this: warn user (still audible but ok)
WARN_SPEED_UP = 1.15         # above this: log a note


@dataclass
class AssemblyReport:
    segment_index: int
    original_duration: float
    tts_duration: float
    speed_factor: float        # 1.0 = no change
    actual_pause: float
    overrun: float             # seconds the segment exceeds its budget (0 = fine)

    @property
    def status(self) -> str:
        if self.overrun > 0.1:
            return "⚠ ÜBERLÄUFT"
        if self.speed_factor > WARN_SPEED_UP:
            return f"↑ schneller ({self.speed_factor:.2f}x)"
        if self.speed_factor > 1.0:
            return f"↑ leicht schneller ({self.speed_factor:.2f}x)"
        return "✓ passt"


def assemble_audio(
    tts_segments: list[TTSSegment],
    output_path: str | Path,
    *,
    sample_rate: int = 44100,
) -> list[AssemblyReport]:
    """
    Assembles all TTS segments into a single output MP3, with timing adjustment.

    Returns a list of AssemblyReport for each segment (useful for logging/UI).
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"\nMontiere Audio → {output_path.name} ...")

    combined = AudioSegment.silent(duration=0)
    reports: list[AssemblyReport] = []

    for tts_seg in tts_segments:
        orig = tts_seg.translated.original
        tts_dur = tts_seg.audio_duration
        budget = orig.budget

        # Compute required speed factor
        available_speech_time = budget - MIN_PAUSE_SECONDS
        if available_speech_time <= 0:
            available_speech_time = tts_dur  # edge case: no budget → no stretch

        speed_factor = tts_dur / available_speech_time if tts_dur > available_speech_time else 1.0
        speed_factor = min(speed_factor, MAX_SPEED_UP)

        adjusted_dur = tts_dur / speed_factor
        actual_pause = max(budget - adjusted_dur, MIN_PAUSE_SECONDS)
        overrun = max(0.0, adjusted_dur + MIN_PAUSE_SECONDS - budget)

        report = AssemblyReport(
            segment_index=orig.index,
            original_duration=orig.duration,
            tts_duration=tts_dur,
            speed_factor=speed_factor,
            actual_pause=actual_pause,
            overrun=overrun,
        )
        reports.append(report)

        print(f"  [{orig.index+1}] orig={orig.duration:.1f}s tts={tts_dur:.1f}s "
              f"speed={speed_factor:.2f}x pause={actual_pause:.1f}s → {report.status}")

        # Load and optionally speed-adjust the TTS audio
        speech_audio = AudioSegment.from_mp3(str(tts_seg.audio_path))

        if abs(speed_factor - 1.0) > 0.01:
            speech_audio = _change_tempo(speech_audio, speed_factor)

        combined += speech_audio

        # Add silence pause (only if not the last segment)
        is_last = tts_seg is tts_segments[-1]
        if not is_last and actual_pause > 0:
            combined += AudioSegment.silent(duration=int(actual_pause * 1000))

    combined.export(str(output_path), format="mp3", bitrate="192k")
    print(f"\nFertig: {output_path} ({len(combined)/1000:.1f}s)\n")
    return reports


def _change_tempo(audio: AudioSegment, factor: float) -> AudioSegment:
    """
    Changes playback speed of an AudioSegment using ffmpeg atempo filter.
    Chains multiple atempo passes for factors outside [0.5, 2.0].
    Preserves pitch (unlike simply resampling).
    """
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_in:
        audio.export(tmp_in.name, format="mp3")
        tmp_in_path = tmp_in.name

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_out:
        tmp_out_path = tmp_out.name

    # Build atempo filter chain (each pass limited to [0.5, 2.0])
    atempo_chain = _build_atempo_chain(factor)
    filter_str = ",".join(f"atempo={v:.6f}" for v in atempo_chain)

    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", tmp_in_path,
            "-filter:a", filter_str,
            tmp_out_path,
        ],
        check=True,
        capture_output=True,
    )

    result = AudioSegment.from_mp3(tmp_out_path)

    Path(tmp_in_path).unlink(missing_ok=True)
    Path(tmp_out_path).unlink(missing_ok=True)

    return result


def _build_atempo_chain(factor: float) -> list[float]:
    """
    Splits a tempo factor into a chain of values each within [0.5, 2.0],
    as required by ffmpeg's atempo filter.

    Examples:
      1.5  → [1.5]
      2.5  → [2.0, 1.25]
      0.4  → [0.5, 0.8]
    """
    chain: list[float] = []
    remaining = factor

    if remaining > 1.0:
        while remaining > 2.0:
            chain.append(2.0)
            remaining /= 2.0
        chain.append(remaining)
    elif remaining < 1.0:
        while remaining < 0.5:
            chain.append(0.5)
            remaining /= 0.5
        chain.append(remaining)
    else:
        chain.append(1.0)

    return chain


def print_assembly_report(reports: list[AssemblyReport]) -> None:
    print("\n=== Montage-Bericht ===")
    total_overrun = sum(r.overrun for r in reports)
    for r in reports:
        print(
            f"  Segment {r.segment_index+1}: "
            f"orig={r.original_duration:.1f}s | tts={r.tts_duration:.1f}s | "
            f"speed={r.speed_factor:.2f}x | pause={r.actual_pause:.1f}s | {r.status}"
        )
    if total_overrun > 0:
        print(
            f"\n  Gesamtüberlauf: {total_overrun:.1f}s "
            f"(Audio wird um {total_overrun:.1f}s länger als Original)"
        )
    else:
        print("\n  Alle Segmente passen ins Zeitbudget.")
    print()
