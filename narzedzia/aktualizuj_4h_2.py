from pathlib import Path


def zamien_raz(sciezka, stary, nowy):
    plik = Path(sciezka)
    tekst = plik.read_text(encoding="utf-8")
    liczba = tekst.count(stary)
    if liczba != 1:
        raise SystemExit(
            f"Oczekiwano dokładnie jednego dopasowania w {sciezka}, znaleziono {liczba}: {stary!r}"
        )
    plik.write_text(tekst.replace(stary, nowy, 1), encoding="utf-8")


zamien_raz(
    "index.html",
    '<span class="znacznik-etapu">Etap 4G.1</span>',
    '<span class="znacznik-etapu">Etap 4H.2</span>',
)
zamien_raz(
    "index.html",
    '    <script defer src="js/pompy/minimalna_liczba_pomp.js"></script>\n',
    '    <script defer src="js/pompy/minimalna_liczba_pomp.js"></script>\n'
    '    <script defer src="js/pompy/ograniczony_przydzial_pomp.js"></script>\n',
)

zamien_raz(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "4H.1"',
    'punktEtapu: "4H.2"',
)

zamien_raz(
    "ETAPY_ROZWOJU.md",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4G zakończone,\n"
    "  zamknięte 4H.1; następny podetap to 4H.2**",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4G zakończone,\n"
    "  zamknięte 4H.1–4H.2; następny podetap to 4H.3**",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "  - [ ] **4H.2 — ograniczony przydział:** silnik nie tworzy pompy ponad podaną\n"
    "    liczbę albo ponad aktywną listę i wylicza rzeczywisty skutek niedoboru.",
    "  - [x] **4H.2 — ograniczony przydział:** silnik nie tworzy pompy ponad podaną\n"
    "    liczbę albo ponad aktywną listę i wylicza rzeczywisty skutek niedoboru.",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "# Kolejny krok\n\n"
    "Rozpocząć **4H.2 — ograniczony przydział pomp**: wykorzystać rzeczywistą\n"
    "liczbę/listę aktywnych pomp bez tworzenia dodatkowych zasobów i wyliczyć\n"
    "jawny skutek niedoboru.",
    "# Kolejny krok\n\n"
    "Rozpocząć **4H.3 — jawne konsekwencje ograniczenia pomp**: pokazać operatorowi\n"
    "liczbę potrzebną i dostępną, przydział, wyliczone przesunięcie oraz pierwotny\n"
    "plan bez tworzenia fikcyjnych przydziałów dla `0` pomp.",
)

etapy = Path("ETAPY_ROZWOJU.md")
tekst_etapow = etapy.read_text(encoding="utf-8")
wpis = """

## Zamknięcie 4H.2 — ograniczony przydział pomp — 2026-08-29

- [x] ograniczony przydział korzysta wyłącznie z rzeczywistych, aktywnych pomp z listy;
- [x] liczba zasobów użytych przez silnik nie przekracza ani wartości operatora, ani liczby aktywnych pomp;
- [x] silnik nie tworzy dodatkowych pomp w celu ukrycia niedoboru;
- [x] zajęta pompa może otrzymać kolejną budowę z wyliczonym przesunięciem, a przesunięty pełny cykl jest rezerwowany przed rozpatrzeniem następnej budowy;
- [x] kolejne przesunięcia mogą narastać kaskadowo i pozostają częścią niezależnego wyniku pomp;
- [x] `0` pomp pozostawia budowy bez przydziału i nie tworzy fikcyjnego zasobu;
- [x] ograniczony wynik zachowuje planowany okres, rzeczywisty okres pompowy, wielkość przesunięcia i jego przyczynę;
- [x] 4H.2 nie zmienia jeszcze `StartRoboczy` ani kursów gruszek; połączenie obu zasobów pozostaje zakresem Etapu 5;
- [x] `testy/etap_4h_2.test.js` sprawdza niedobór, kaskadowe przesunięcia, `0`, limit operatora, aktywną listę, walidację, stabilność i brak mutacji danych wejściowych.

Zamknięty podetap: **4H.2**. Punkt nadrzędny **4H** pozostaje otwarty.
Następny niezakończony podetap: **4H.3 — jawne konsekwencje**.
"""
if "## Zamknięcie 4H.2 — ograniczony przydział pomp" not in tekst_etapow:
    etapy.write_text(tekst_etapow.rstrip() + wpis + "\n", encoding="utf-8")

zamien_raz(
    "README.md",
    "    node testy/etap_4h_1.test.js\n",
    "    node testy/etap_4h_1.test.js\n    node testy/etap_4h_2.test.js\n",
)
zamien_raz(
    "README.md",
    "Podetap **4H.1 — dwa tryby pracy pomp** jest zakończony. Operator może wybrać\n"
    "**Oblicz, ile potrzeba** albo **Mam określoną liczbę**; w drugim trybie liczba\n"
    "musi być całkowita i nieujemna, a `0` jest poprawną wartością. Formalny test\n"
    "`etap_4h_1.test.js` chroni ten kontrakt. Następny krok to **4H.2 — ograniczony\n"
    "przydział pomp**. Pełne połączenie ograniczeń pomp i gruszek pozostaje świadomie\n"
    "zakresem Etapu 5.",
    "Podetapy **4H.1–4H.2** są zakończone. Operator może wybrać **Oblicz, ile\n"
    "potrzeba** albo **Mam określoną liczbę**. W trybie ograniczonym silnik korzysta\n"
    "wyłącznie z zadanej liczby rzeczywistych aktywnych pomp, nie tworzy brakujących\n"
    "zasobów i wylicza kaskadowe przesunięcia pełnych cykli pomp. `0` pomp nie tworzy\n"
    "fikcyjnego przydziału. Wynik 4H.2 pozostaje niezależny od kursów gruszek i nie\n"
    "zmienia jeszcze `StartRoboczy`. Następny krok to **4H.3 — jawne konsekwencje**.\n"
    "Pełne połączenie ograniczeń pomp i gruszek pozostaje świadomie zakresem Etapu 5.",
)

plan_testow = Path("testy/TESTY_ETAP_4.md")
tekst_testow = plan_testow.read_text(encoding="utf-8")
znacznik = "### 4H — tryb „mam X pomp”"
sekcja = """### 4H.2 — ograniczony przydział pomp

- silnik używa najwyżej liczby pomp podanej przez operatora i nigdy nie tworzy brakującej pompy;
- liczba zasobów jest dodatkowo ograniczona do rzeczywiście aktywnych pomp z listy;
- jedna pompa przy nakładających się budowach wylicza kolejne przesunięcia i rezerwuje przesunięte pełne cykle;
- `0` pomp nie tworzy przydziału ani stanu fikcyjnego zasobu;
- wynik zachowuje planowane i rzeczywiste okresy pracy pomp oraz wielkość i przyczynę przesunięcia;
- ponowne obliczenie tych samych danych jest stabilne, nie nakłada pracy jednej pompy i nie modyfikuje danych wejściowych;
- 4H.2 nie zmienia kursów gruszek ani `StartRoboczy` budów.

"""
if "### 4H.2 — ograniczony przydział pomp" not in tekst_testow:
    if znacznik not in tekst_testow:
        raise SystemExit("Nie znaleziono sekcji 4H w TESTY_ETAP_4.md")
    plan_testow.write_text(
        tekst_testow.replace(znacznik, sekcja + znacznik, 1),
        encoding="utf-8",
    )

# Test 4H.2 ma również pilnować, że moduł jest rzeczywiście ładowany przez lokalny index.html.
test_4h2 = Path("testy/etap_4h_2.test.js")
tekst_4h2 = test_4h2.read_text(encoding="utf-8")
znacznik_testu = '  const pompy = wczytajModulyPomp();\n\n'
if "ograniczony_przydzial_pomp.js" not in tekst_4h2.split("function uruchomTesty()", 1)[1]:
    tekst_4h2 = tekst_4h2.replace(
        znacznik_testu,
        znacznik_testu +
        '  const html = wczytaj("index.html");\n'
        '  assert.match(\n'
        '    html,\n'
        '    /js\\/pompy\\/minimalna_liczba_pomp\\.js[\\s\\S]*js\\/pompy\\/ograniczony_przydzial_pomp\\.js/\n'
        '  );\n\n',
        1,
    )
    test_4h2.write_text(tekst_4h2, encoding="utf-8")
