#!/usr/bin/env bash
# Собирает бандлы всех раундов из mockups/ в bundles/.
#
#   ./editor/build-all.sh            — в bundles/
#   ./editor/build-all.sh web/dist/editor — сразу в папку публикации

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-}"

rounds=()
for dir in "$ROOT"/mockups/*/; do
  name="$(basename "$dir")"
  [ -f "$dir/reference.png" ] || { echo "пропуск $name: нет reference.png"; continue; }
  "$ROOT/editor/build-bundle.sh" "$name" > /dev/null
  rounds+=("$name")
done

if [ -n "$DEST" ]; then
  mkdir -p "$DEST"
  for name in "${rounds[@]}"; do
    rm -rf "${DEST:?}/$name"
    cp -R "$ROOT/bundles/$name" "$DEST/$name"
  done

  # Оглавление: оператор раздаёт отсюда ссылки на раунды.
  {
    echo '<!doctype html><html lang="ru"><head><meta charset="utf-8">'
    echo '<title>Раунды — Code in the Dark · Импульс 2026</title><style>'
    echo 'body{margin:0;padding:64px;background:#000;color:#fff;font-family:Helvetica,Arial,sans-serif}'
    echo 'h1{font-size:56px;letter-spacing:-.04em;margin:0 0 8px}'
    echo 'p{color:#AEB1B7;margin:0 0 48px}'
    echo 'a{display:block;padding:20px 0;border-top:2px solid #1DAFF7;color:#fff;text-decoration:none;font-size:28px}'
    echo 'a:last-child{border-bottom:2px solid #1DAFF7}a:hover{color:#1DAFF7}'
    echo '</style></head><body><h1>Раунды</h1>'
    echo '<p>Открывать только в момент старта раунда.</p>'
    for name in "${rounds[@]}"; do
      echo "<a href=\"./$name/\">$name</a>"
    done
    echo '</body></html>'
  } > "$DEST/index.html"

  echo "Опубликовано в $DEST: ${#rounds[@]} раундов"
else
  echo "Собрано в bundles/: ${#rounds[@]} раундов"
fi
