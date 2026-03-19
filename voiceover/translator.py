"""
Translates speech segments into a target language using the Claude API.

Translation strategy:
- Each segment is translated independently so timing can be tracked per-segment.
- Claude is given the full script context so it doesn't translate each segment
  in isolation (important for proper terminology, names, tone continuity).
- Claude is asked to produce translations that are roughly proportional in length
  to the original — this minimises the speed adjustment needed later.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .transcriber import SpeechSegment


LANGUAGE_NAMES = {
    "fr": "Französisch",
    "en": "Englisch",
    "es": "Spanisch",
    "it": "Italienisch",
    "pt": "Portugiesisch",
    "nl": "Niederländisch",
    "pl": "Polnisch",
    "ja": "Japanisch",
    "zh": "Chinesisch (Mandarin)",
    "ko": "Koreanisch",
    "ar": "Arabisch",
}


@dataclass
class TranslatedSegment:
    """Original segment + its translation."""
    original: SpeechSegment
    translated_text: str
    target_language: str


def translate_segments(
    segments: list[SpeechSegment],
    target_language: str,
    api_key: Optional[str] = None,
    *,
    source_language: str = "de",
) -> list[TranslatedSegment]:
    """
    Translates all speech segments into target_language.

    Args:
        segments: SpeechSegment list from transcriber.
        target_language: ISO-639-1 code, e.g. "fr", "en", "es".
        api_key: Anthropic API key. Falls back to ANTHROPIC_API_KEY env variable.
        source_language: ISO-639-1 code of original language.
    """
    import anthropic

    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    lang_name = LANGUAGE_NAMES.get(target_language, target_language.upper())
    print(f"Übersetze {len(segments)} Segmente nach {lang_name} ...")

    full_source = "\n\n".join(
        f"[Segment {s.index + 1}]\n{s.text}" for s in segments
    )

    translations = _translate_via_claude(
        client=client,
        full_source=full_source,
        segments=segments,
        source_language=source_language,
        target_language=target_language,
        lang_name=lang_name,
    )

    result = []
    for seg, translated_text in zip(segments, translations):
        result.append(
            TranslatedSegment(
                original=seg,
                translated_text=translated_text,
                target_language=target_language,
            )
        )
        ratio = len(translated_text) / max(len(seg.text), 1)
        print(
            f"  [{seg.index+1}] {len(seg.text)} → {len(translated_text)} Zeichen "
            f"(Verhältnis: {ratio:.2f}x)"
        )

    return result


def _translate_via_claude(
    client,
    full_source: str,
    segments: list[SpeechSegment],
    source_language: str,
    target_language: str,
    lang_name: str,
) -> list[str]:
    """Calls Claude once for all segments and parses the structured response."""

    segment_count = len(segments)
    durations_info = "\n".join(
        f"  Segment {s.index+1}: {s.duration:.1f}s Redezeit, "
        f"{s.pause_after:.1f}s Pause danach (Budget gesamt: {s.budget:.1f}s)"
        for s in segments
    )

    prompt = f"""Du übersetzt ein deutsches YouTube-Reise-Voiceover nach {lang_name}.

KONTEXT:
- Jedes Segment wird einzeln als Audio aufgenommen (Text-to-Speech).
- Die Segmente haben feste Zeitbudgets (Sprechzeit + Pause). Wenn die Übersetzung
  länger wird, muss das Audio leicht beschleunigt werden (bis max. 1.3x ist kaum hörbar).
  Versuche daher, NICHT deutlich länger als das Original zu sein.
- Schreibe Zahlen als Wörter aus (z.B. "sechzehnhundert"), da sie von TTS gesprochen werden.
- Behalte denselben informativen, journalistischen Stil.
- Eigenname von Orten, Gebäuden etc. in der Zielsprache verwenden wo üblich
  (z.B. "Versailles" bleibt "Versailles", aber "Ludwig der Vierzehnte" → "Louis XIV").

ZEITBUDGETS DER SEGMENTE:
{durations_info}

ORIGINALTEXT ({segment_count} Segmente):
{full_source}

AUSGABEFORMAT (exakt einhalten, keine Erklärungen):
[Segment 1]
<übersetzter Text>

[Segment 2]
<übersetzter Text>

[Segment N]
<übersetzter Text>"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    return _parse_translation_response(response_text, segment_count)


def _parse_translation_response(response: str, expected_count: int) -> list[str]:
    """Parses the [Segment N] structured response from Claude."""
    import re

    parts = re.split(r"\[Segment\s+\d+\]\s*", response, flags=re.IGNORECASE)
    # First element before the first [Segment N] is empty
    translations = [p.strip() for p in parts if p.strip()]

    if len(translations) != expected_count:
        raise ValueError(
            f"Claude hat {len(translations)} Übersetzungen zurückgegeben, "
            f"aber {expected_count} erwartet.\nAntwort:\n{response}"
        )

    return translations
