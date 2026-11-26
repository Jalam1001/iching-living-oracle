#!/usr/bin/env bash
# Downloads James Legge's public-domain translation (Sacred Books of the East, vol. 16, 1882)
# from the Internet Sacred Text Archive. The raw HTML is not committed (≈22 MB);
# the parsed result is committed as sources/legge_raw.json.
set -euo pipefail
D=${LEGGE_HTML_DIR:-sources/legge-html}; mkdir -p "$D"
for i in $(seq -w 1 64); do curl -sSL -A "Mozilla/5.0" -o "$D/ic$i.htm" "https://sacred-texts.com/ich/ic$i.htm"; done
for s in section-i-2 section-ii-2; do curl -sSL -A "Mozilla/5.0" -o "$D/$s.htm" "https://sacred-texts.com/book/the-i-ching/$s"; done
echo "Now run: python3 tools/parse_legge.py"
