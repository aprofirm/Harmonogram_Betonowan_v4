from pathlib import Path


def zamien_raz(sciezka, stary, nowy):
    plik = Path(sciezka)
    tresc = plik.read_text(encoding="utf-8")
    liczba = tresc.count(stary)
    if liczba != 1:
        raise RuntimeError(f"{sciezka}: oczekiwano 1 wystąpienia, znaleziono {liczba}: {stary!r}")
    plik.write_text(tresc.replace(stary, nowy, 1), encoding="utf-8")


zamien_raz(
    "index.html",
    '<span class="znacznik-etapu">Etap 4H.4</span>',
    '<span class="znacznik-etapu">Etap 4H.5</span>',
)
zamien_raz(
    "index.html",
    '<span>4H.4 · pamięć i ponowne przeliczenie pomp</span>',
    '<span>4H.5 · końcowe testy trybu mam X pomp</span>',
)
zamien_raz(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "4H.4"',
    'punktEtapu: "4H.5"',
)

zamien_raz(
    "README.md",
    "    node testy/etap_4h_4.test.js\n",
    "    node testy/etap_4h_4.test.js\n    node testy/etap_4h_5.test.js\n",
)
zamien_raz(
    "README.md",
    "Podetapy **4H.1–4H.4** są zakończone. Operator może wybrać **Oblicz, ile\n",
    "Cały punkt **4H — tryb „mam X pomp”** jest zakończony. Operator może wybrać **Oblicz, ile\n",
)
zamien_raz(
    "README.md",
    "oraz liczby pomp, w tym `0`, a także czysty stan każdego ponownego przeliczenia\nbez odziedziczonych zajętości. Następny krok to **4H.5 — testy końcowe trybu\n„mam X pomp”**. Pełne połączenie ograniczeń pomp i gruszek należy do Etapu 5.",
    "oraz liczby pomp, w tym `0`, a także czysty stan każdego ponownego przeliczenia\nbez odziedziczonych zajętości. Końcowy test 4H.5 potwierdza flotę wystarczającą,\nniedobór, `0`, błędne dane, stabilność wyniku, limit aktywnej listy i brak\nnakładania pracy jednej pompy. Następny krok to **4I.1 — centralny wynik pomp**.\nPełne połączenie ograniczeń pomp i gruszek należy do Etapu 5.",
)

zamien_raz(
    "testy/TESTY_ETAP_4.md",
    "### 4H — tryb „mam X pomp”\n",
    "### 4H.5 — końcowe testy trybu „mam X pomp”\n\n"
    "- flota wystarczająca realizuje plan bez przesunięć i bez brakujących pomp;\n"
    "- zbyt mała flota nie tworzy fikcyjnych zasobów i wylicza kaskadowe przesunięcia;\n"
    "- `0` pomp pozostawia budowę bez przydziału i bez fikcyjnego stanu pompy;\n"
    "- błędny limit oraz błędny format danych przejazdu kończą się czytelnym błędem;\n"
    "- ponowne przeliczenie tych samych danych jest identyczne także po obliczeniu innego limitu;\n"
    "- rzeczywiste okresy pracy tej samej pompy nie nakładają się;\n"
    "- nieaktywna pompa nie trafia do rzeczywistej puli przydziału;\n"
    "- `testy/etap_4h_5.test.js` jest końcowym testem kontraktu całego 4H.\n\n"
    "### 4H — tryb „mam X pomp”\n",
)

zamien_raz(
    "ETAPY_ROZWOJU.md",
    '- [ ] **4H — tryb „mam X pomp”.**',
    '- [x] **4H — tryb „mam X pomp”.**',
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "  - [ ] **4H.5 — testy:** flota wystarczająca, zbyt mała, `0`, błędne dane,\n    stabilność wyniku i brak nakładania pracy jednej pompy.",
    "  - [x] **4H.5 — testy:** flota wystarczająca, zbyt mała, `0`, błędne dane,\n    stabilność wyniku i brak nakładania pracy jednej pompy.",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "- [ ] zmniejszenie liczby pomp powoduje pełne ponowne przeliczenie.",
    "- [x] zmniejszenie liczby pomp powoduje pełne ponowne przeliczenie.",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "## Test regresji\n\n- [ ] silnik gruszek daje te same wyniki przy danych bez pomp jak wcześniej,\n- [ ] import CSV nadal działa,\n- [ ] zmiana liczby gruszek nadal poprawnie przebudowuje kursy.\n\n---\n\n# ETAP 5",
    "## Test regresji\n\n- [x] silnik gruszek daje te same wyniki przy danych bez pomp jak wcześniej,\n- [x] import CSV nadal działa,\n- [x] zmiana liczby gruszek nadal poprawnie przebudowuje kursy.\n\n---\n\n# ETAP 5",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "Zamknięty podetap: **4H.4**. Punkt nadrzędny **4H** pozostaje otwarty.\nNastępny niezakończony podetap: **4H.5 — testy**.\n\n# Kolejny krok\n\nRozpocząć **4H.5 — testy końcowe trybu „mam X pomp”**: zebrać w jednym\nzestawie flotę wystarczającą, zbyt małą, `0`, błędne dane, stabilność wyniku\ni brak nakładania pracy jednej pompy.",
    "Zamknięty podetap: **4H.4**. Punkt nadrzędny **4H** pozostaje otwarty.\nNastępny niezakończony podetap: **4H.5 — testy**.\n\n## Zamknięcie 4H.5 i całego 4H — 2026-08-29\n\n- [x] flota wystarczająca nie powoduje przesunięć;\n- [x] zbyt mała flota wylicza kaskadowe przesunięcia bez tworzenia dodatkowych pomp;\n- [x] `0` pomp nie tworzy fikcyjnego zasobu ani przydziału;\n- [x] błędne dane wejściowe są odrzucane czytelnym błędem;\n- [x] ponowne przeliczenie jest stabilne i zawsze zaczyna od czystego stanu;\n- [x] pełne rzeczywiste okresy jednej pompy nie nakładają się;\n- [x] pełna regresja potwierdza brak zmian w imporcie CSV i silniku gruszek.\n\nZamknięty podetap: **4H.5**. Cały punkt **4H — tryb „mam X pomp”** jest zakończony.\nNastępny niezakończony podetap: **4I.1 — centralny wynik**.\n\n# Kolejny krok\n\nRozpocząć **4I.1 — centralny wynik pomp**: podłączyć niezależny wynik pomp do\n`przeliczCalyHarmonogram()` bez docelowego łączenia korekt pomp i gruszek.",
)

Path("testy/etap_4h_5_integracja.test.js").write_text(
    '''"use strict";\n\nconst assert = require("node:assert/strict");\nconst fs = require("node:fs");\nconst path = require("node:path");\n\nconst katalogProjektu = path.resolve(__dirname, "..");\n\nfunction wczytaj(sciezka) {\n  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");\n}\n\nfunction uruchomTesty() {\n  const html = wczytaj("index.html");\n  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");\n  const etapy = wczytaj("ETAPY_ROZWOJU.md");\n  const readme = wczytaj("README.md");\n\n  assert.match(html, /Etap 4H\\.5/);\n  assert.match(html, /4H\\.5 · końcowe testy trybu mam X pomp/);\n  assert.match(konfiguracja, /punktEtapu:\\s*"4H\\.5"/);\n  assert.match(etapy, /\\[x\\] \\*\\*4H — tryb „mam X pomp”\\.\\*\\*/);\n  assert.match(etapy, /\\[x\\] \\*\\*4H\\.5 — testy:/);\n  assert.match(etapy, /Następny niezakończony podetap: \\*\\*4I\\.1 — centralny wynik\\*\\*/);\n  assert.match(readme, /node testy\\/etap_4h_5\\.test\\.js/);\n  assert.match(readme, /Cały punkt \\*\\*4H — tryb „mam X pomp”\\*\\* jest zakończony/);\n\n  console.log(\n    "✓ Etap 4H.5 integracja: cały 4H jest zamknięty, a roadmapa wskazuje 4I.1 jako kolejny krok."\n  );\n}\n\nuruchomTesty();\n''',
    encoding="utf-8",
)

# Pliki są jednorazową pomocą do bezpiecznej aktualizacji dużych dokumentów.
Path("narzedzia/aktualizuj_4h_5.py").unlink()
Path(".github/workflows/przygotuj-4h-5.yml").unlink()
