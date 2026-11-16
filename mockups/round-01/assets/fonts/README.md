# Шрифты бандла

Сюда положить два файла ALS Hauss:

```
ALSHauss-Regular.woff2   # font-weight 400 — наборный текст
ALSHauss-Medium.woff2    # font-weight 500 — заголовки
```

Имена важны: на них ссылается `@font-face` в `design.html` и в бандлах раундов.

Если есть только `.otf` или `.ttf`, сконвертировать:

```sh
npx ttf2woff2 < ALSHauss-Medium.ttf > ALSHauss-Medium.woff2
```

**После добавления файлов обязательно перегенерировать образец** — иначе
участники получат скриншот в Helvetica, а верстать будут в ALS Hauss:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --screenshot=reference.png --window-size=1920,1080 \
  "file://$PWD/design.html"
```

Шрифт коммерческий. В публичный репозиторий файлы не коммитим —
раздаём участникам на флешке вместе с бандлом.
