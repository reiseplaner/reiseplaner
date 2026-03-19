"""
Command-line interface for the multilingual voiceover pipeline.

Usage:
    python -m voiceover.cli --audio versailles_de.mp3 \\
                            --script versailles_de.txt \\
                            --lang fr \\
                            --voice onyx \\
                            --output output/

    # Or with explicit API keys:
    python -m voiceover.cli --audio versailles_de.mp3 \\
                            --script versailles_de.txt \\
                            --lang fr \\
                            --openai-key sk-... \\
                            --anthropic-key sk-ant-...
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="voiceover",
        description="Multilingual Voiceover Automation Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument(
        "--audio", "-a",
        required=True,
        help="Pfad zum deutschen Voiceover MP3",
    )
    parser.add_argument(
        "--script", "-s",
        required=True,
        help="Pfad zur deutschen Skript-Textdatei (mit [pause X seconds] Markierungen)",
    )
    parser.add_argument(
        "--lang", "-l",
        required=True,
        help="Zielsprache als ISO-639-1 Code (z.B. fr, en, es, it, nl)",
    )
    parser.add_argument(
        "--output", "-o",
        default="./voiceover_output",
        help="Ausgabe-Verzeichnis (Standard: ./voiceover_output)",
    )
    parser.add_argument(
        "--voice", "-v",
        default="onyx",
        choices=["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        help="OpenAI TTS-Stimme (Standard: onyx)",
    )
    parser.add_argument(
        "--openai-key",
        default=None,
        help="OpenAI API Key (oder OPENAI_API_KEY Umgebungsvariable setzen)",
    )
    parser.add_argument(
        "--anthropic-key",
        default=None,
        help="Anthropic API Key (oder ANTHROPIC_API_KEY Umgebungsvariable setzen)",
    )

    args = parser.parse_args()

    # Validate inputs
    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"Fehler: Audio-Datei nicht gefunden: {audio_path}")
        sys.exit(1)

    script_path = Path(args.script)
    if not script_path.exists():
        print(f"Fehler: Skript-Datei nicht gefunden: {script_path}")
        sys.exit(1)

    script_text = script_path.read_text(encoding="utf-8")

    # Check API keys
    openai_key = args.openai_key or os.getenv("OPENAI_API_KEY")
    anthropic_key = args.anthropic_key or os.getenv("ANTHROPIC_API_KEY")

    if not openai_key:
        print("Fehler: OPENAI_API_KEY nicht gesetzt. Nutze --openai-key oder setze die Umgebungsvariable.")
        sys.exit(1)
    if not anthropic_key:
        print("Fehler: ANTHROPIC_API_KEY nicht gesetzt. Nutze --anthropic-key oder setze die Umgebungsvariable.")
        sys.exit(1)

    # Run pipeline
    from .pipeline import PipelineConfig, run_pipeline

    config = PipelineConfig(
        audio_path=audio_path,
        script_text=script_text,
        target_language=args.lang,
        output_dir=Path(args.output),
        voice=args.voice,
        openai_api_key=openai_key,
        anthropic_api_key=anthropic_key,
    )

    try:
        result = run_pipeline(config)
        print(f"Erfolgreich! Output: {result.output_path}")
    except KeyboardInterrupt:
        print("\nAbgebrochen.")
        sys.exit(1)
    except Exception as e:
        print(f"\nFehler: {e}")
        raise


if __name__ == "__main__":
    main()
