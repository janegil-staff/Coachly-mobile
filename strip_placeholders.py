#!/usr/bin/env python3
"""
strip_placeholders.py

Removes the leading "[PLACEHOLDER] " prefix from every `body` field inside
`termsSections` and `aboutSections` arrays in strings.patched.js, across
all languages.

Usage:
    python3 strip_placeholders.py path/to/strings.patched.js

Overwrites in place. Use git for safety.
"""

import re
import sys
from pathlib import Path

PLACEHOLDER_RE = re.compile(r'\[PLACEHOLDER\]\s*')


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python3 strip_placeholders.py path/to/strings.patched.js")
        sys.exit(1)

    path = Path(sys.argv[1])
    text = path.read_text(encoding="utf-8")

    # Count before
    before = len(PLACEHOLDER_RE.findall(text))

    # Replace globally — the only place "[PLACEHOLDER]" appears in this file
    # is inside the body strings we want to clean, so this is safe.
    new_text = PLACEHOLDER_RE.sub('', text)

    after = len(PLACEHOLDER_RE.findall(new_text))

    path.write_text(new_text, encoding="utf-8")

    print(f"Stripped {before} occurrences of [PLACEHOLDER].")
    if after:
        print(f"WARNING: {after} still remain — check manually.")
    else:
        print("Done. File written.")


if __name__ == "__main__":
    main()
