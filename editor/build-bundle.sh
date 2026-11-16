#!/usr/bin/env bash
# Собирает бандл участника для одного раунда.
#
#   ./editor/build-bundle.sh round-01
#
# На выходе: bundles/round-01/ — папка, которую кладут на флешку.
# Участник открывает в ней index.html и больше ничего.

set -euo pipefail

ROUND="${1:?Укажи раунд, например: ./editor/build-bundle.sh round-01}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/mockups/$ROUND"
OUT="$ROOT/bundles/$ROUND"

[ -d "$SRC" ] || { echo "Нет макета: $SRC"; exit 1; }
[ -f "$SRC/reference.png" ] || { echo "Нет образца: $SRC/reference.png"; exit 1; }

rm -rf "$OUT"
mkdir -p "$OUT/assets"

cp "$ROOT/editor/editor.html"        "$OUT/index.html"
cp "$ROOT/editor/assets/result.html" "$OUT/assets/result.html"
cp "$SRC/reference.png"              "$OUT/assets/page.png"

# Шрифты и картинки макета едут с бандлом как есть.
if [ -d "$SRC/assets" ]; then
  cp -R "$SRC/assets/." "$OUT/assets/"
  rm -f "$OUT/assets/fonts/README.md"
fi

# Задание: текстовый файл макета превращается в страницу, которую
# редактор показывает по кнопке «Задание».
python3 - "$SRC/instructions.txt" "$OUT/assets/instructions.html" "$ROUND" <<'PY'
import html, sys

src, dst, round_name = sys.argv[1], sys.argv[2], sys.argv[3]
body = html.escape(open(src, encoding='utf-8').read())

open(dst, 'w', encoding='utf-8').write(f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Задание — {html.escape(round_name)}</title>
<style>
  body {{
    margin: 0;
    padding: 40px;
    background: #000;
    color: #fff;
    font-family: 'Courier New', monospace;
    font-size: 15px;
    line-height: 1.6;
  }}
  pre {{
    margin: 0 auto;
    max-width: 760px;
    white-space: pre-wrap;
    text-align: left;
  }}
  b {{ color: #1DAFF7; }}
</style>
</head>
<body>
<pre>{body}</pre>
</body>
</html>
""")
PY

FONTS=$(find "$OUT/assets" -name '*.woff2' | wc -l | tr -d ' ')
echo "Готово: $OUT"
echo "  образец       assets/page.png"
echo "  задание       assets/instructions.html"
echo "  шрифтов       $FONTS"
[ "$FONTS" = "0" ] && echo "  ВНИМАНИЕ: шрифтов нет — положи ALS Hauss в mockups/$ROUND/assets/fonts/"
exit 0
