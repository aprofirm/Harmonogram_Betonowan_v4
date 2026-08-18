from pathlib import Path


def zamien_raz(sciezka, stary, nowy):
    plik = Path(sciezka)
    tresc = plik.read_text(encoding="utf-8")
    liczba = tresc.count(stary)
    if liczba != 1:
        raise RuntimeError(
            f"{sciezka}: oczekiwano dokładnie 1 wystąpienia wzorca, znaleziono {liczba}."
        )
    plik.write_text(tresc.replace(stary, nowy, 1), encoding="utf-8")


# Konfiguracja etapu.
zamien_raz(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "3C.3"',
    'punktEtapu: "3C.4"',
)

# Interfejs: dziewiąta kolumna tabeli kursów i numer technicznej gruszki.
zamien_raz(
    "js/interfejs/interfejs.js",
    '    komorka.colSpan = 8;\n    ikona.className = "pusty-wiersz__ikona";\n    ikona.setAttribute("aria-hidden", "true");\n    ikona.textContent = "◷";',
    '    komorka.colSpan = 9;\n    ikona.className = "pusty-wiersz__ikona";\n    ikona.setAttribute("aria-hidden", "true");\n    ikona.textContent = "◷";',
)

zamien_raz(
    "js/interfejs/interfejs.js",
    '''    wiersz.appendChild(\n      utworzKomorke(\n        String(kurs.numerKursu) + "/" + String(kurs.liczbaKursowBudowy),\n        "wartosc-wazna"\n      )\n    );\n    wiersz.appendChild(utworzKomorke(nazwaBudowy));''',
    '''    wiersz.appendChild(\n      utworzKomorke(\n        String(kurs.numerKursu) + "/" + String(kurs.liczbaKursowBudowy),\n        "wartosc-wazna"\n      )\n    );\n    wiersz.appendChild(\n      utworzKomorke(\n        "Gruszka " + String(kurs.numerGruszki),\n        "wartosc-wazna"\n      )\n    );\n    wiersz.appendChild(utworzKomorke(nazwaBudowy));''',
)

# HTML: nagłówek, opis, pusta tabela i etykiety etapu.
zamien_raz(
    "index.html",
    '<span class="znacznik-etapu">Etap 3C.3</span>',
    '<span class="znacznik-etapu">Etap 3C.4</span>',
)

zamien_raz(
    "index.html",
    '''          <p class="informacja-etapu">\n            Etap 3C.3 przydziela konkretne gruszki do kursów bez nakładania ich\n            pełnych cykli. Numery gruszek zostaną pokazane w tabeli operatora\n            w następnym podetapie 3C.4.\n          </p>''',
    '''          <p class="informacja-etapu">\n            Etap 3C.4 pokazuje przy każdym kursie numer technicznej gruszki.\n            Jest to pierwsza wolna gruszka wybrana przez silnik, a nie stałe\n            przypisanie konkretnego samochodu.\n          </p>''',
)

zamien_raz(
    "index.html",
    '''              <p class="opis-panelu">\n                Kursy są ułożone według planowanego startu załadunku. Przydział\n                numerów gruszek nastąpi dopiero w punkcie 3C.\n              </p>''',
    '''              <p class="opis-panelu">\n                Kursy są ułożone według planowanego startu załadunku. Kolumna\n                Gruszka pokazuje pierwszą wolną gruszkę przydzieloną do kursu.\n              </p>''',
)

zamien_raz(
    "index.html",
    '''                    <th>Kurs</th>\n                    <th>Budowa</th>''',
    '''                    <th>Kurs</th>\n                    <th>Gruszka</th>\n                    <th>Budowa</th>''',
)

zamien_raz(
    "index.html",
    '<td colspan="8">\n                      <span class="pusty-wiersz__ikona" aria-hidden="true">◷</span>',
    '<td colspan="9">\n                      <span class="pusty-wiersz__ikona" aria-hidden="true">◷</span>',
)

zamien_raz(
    "index.html",
    '<span>Etap 3C.3 · przydział gruszek w silniku</span>',
    '<span>Etap 3C.4 · numery gruszek w tabeli</span>',
)

# Decyzja: numery są oznaczeniem zasobu, nie tożsamością fizycznego pojazdu.
zamien_raz(
    "PROJECT_DECISIONS.md",
    '''- silnik najpierw ponownie wykorzystuje pierwszą wolną gruszkę o najniższym\n  numerze, a gdy żadna nie jest dostępna, tworzy kolejny numer;\n- identyfikatory techniczne mają format `GRUSZKA-001`, `GRUSZKA-002` itd.;''',
    '''- silnik najpierw ponownie wykorzystuje pierwszą wolną gruszkę o najniższym\n  numerze, a gdy żadna nie jest dostępna, tworzy kolejny numer;\n- numer gruszki jest technicznym oznaczeniem zasobu w harmonogramie, a nie\n  stałym przypisaniem konkretnego samochodu, kierowcy ani numeru rejestracyjnego;\n- identyfikatory techniczne mają format `GRUSZKA-001`, `GRUSZKA-002` itd.;''',
)

# Status etapu i następny krok.
zamien_raz(
    "ETAPY_ROZWOJU.md",
    '- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1–3C.3, następny jest 3C.4 — widok numeru gruszki**',
    '- [ ] Etap 3 — Podstawowy silnik gruszek — **w toku; zakończono 3C.1–3C.4, następny jest 3C.5 — testy integracyjne i przypadki brzegowe**',
)

zamien_raz(
    "ETAPY_ROZWOJU.md",
    '''  - [ ] **3C.4 — widok operatora:** pokazanie numeru gruszki przy każdym kursie\n    bez przebudowy pozostałych tabel.''',
    '''  - [x] **3C.4 — widok operatora:** pokazanie numeru gruszki przy każdym kursie\n    bez przebudowy pozostałych tabel; numer jest technicznym oznaczeniem pierwszej\n    wolnej gruszki, a nie stałą tożsamością konkretnego pojazdu.''',
)

# Dokument testów 3C.
zamien_raz(
    "testy/TESTY_ETAP_3C.md",
    '- [ ] 3C.4 — widok operatora.',
    '- [x] 3C.4 — widok operatora.',
)

plik_testow = Path("testy/TESTY_ETAP_3C.md")
tresc_testow = plik_testow.read_text(encoding="utf-8")
dodatek_testow = '''\n\n## Test 3C.4 — widok operatora\n\nTabela kursów pokazuje dodatkową kolumnę **Gruszka**. Wartości `Gruszka 1`,\n`Gruszka 2` itd. są technicznym oznaczeniem pierwszego wolnego zasobu. Nie są\nstałym przypisaniem do konkretnego samochodu ani kierowcy.\n\nUruchom:\n\n```text\nnode testy/etap_3c_4.test.js\n```\n\nTest sprawdza obecność kolumny, zgodną liczbę komórek pustego wiersza, użycie\n`numerGruszki` z wyniku silnika oraz aktualne oznaczenie etapu 3C.4.\n\nPo 3C.4 następny podetap to **3C.5 — testy integracyjne i przypadki brzegowe**.\n'''
if "## Test 3C.4 — widok operatora" not in tresc_testow:
    plik_testow.write_text(tresc_testow.rstrip() + dodatek_testow + "\n", encoding="utf-8")

# README: aktualny stan i lista testów.
zamien_raz(
    "README.md",
    '''    node testy/etap_3b_2.test.js\n    node testy/pamiec_planu.test.js''',
    '''    node testy/etap_3b_2.test.js\n    node testy/etap_3c.test.js\n    node testy/etap_3c_integracja.test.js\n    node testy/etap_3c_3.test.js\n    node testy/etap_3c_4.test.js\n    node testy/pamiec_planu.test.js''',
)

zamien_raz(
    "README.md",
    '''**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały\n**3B** oraz **3C.1–3C.3**. Centralne `przeliczCalyHarmonogram()` generuje kursy,\nliczy ich pełne czasy i następnie przypisuje konkretne gruszki tak, aby fizyczne\ncykle jednego pojazdu się nie nakładały. Wynik przechowuje zarówno kursy z\n`idGruszki`/`numerGruszki`, jak i wspólny stan użytych gruszek.''',
    '''**Etap 3 — podstawowy silnik gruszek** jest w toku. Zakończone są **3A**, cały\n**3B** oraz **3C.1–3C.4**. Centralne `przeliczCalyHarmonogram()` generuje kursy,\nliczy ich pełne czasy i następnie przypisuje pierwsze wolne gruszki tak, aby\nfizyczne cykle jednego zasobu się nie nakładały. Tabela kursów pokazuje teraz\n`Gruszka 1`, `Gruszka 2` itd. jako techniczne oznaczenia zasobów.''',
)

zamien_raz(
    "README.md",
    '''**Następny podetap: 3C.4 — widok operatora.** Dodamy numer gruszki do tabeli\nkursów bez zmiany działającego algorytmu przydziału. Następnie 3C.5 rozszerzy\nprzypadki brzegowe, a 3C.6 obejmie publikację i test operatorski. Punkt 3D\npozostaje odpowiedzialny za formalną minimalną liczbę gruszek, a 3E za tryb\n„mam X gruszek”.''',
    '''**Następny podetap: 3C.5 — testy integracyjne i przypadki brzegowe.**\nSprawdzimy wiele budów, jednoczesne starty, dokładną granicę powrotu, pusty plan,\nstabilność numerowania i brak nakładania cykli jednej gruszki. Następnie 3C.6\nobejmie publikację i test operatorski. Punkt 3D pozostaje odpowiedzialny za\nformalną minimalną liczbę gruszek, a 3E za tryb „mam X gruszek”.''',
)

# Osobny automatyczny test widoku 3C.4.
Path("testy/etap_3c_4.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
const interfejs = fs.readFileSync(
  path.join(katalogProjektu, "js/interfejs/interfejs.js"),
  "utf8"
);
const konfiguracja = fs.readFileSync(
  path.join(katalogProjektu, "js/konfiguracja/konfiguracja.js"),
  "utf8"
);

assert.match(html, /<th>Kurs<\/th>\s*<th>Gruszka<\/th>\s*<th>Budowa<\/th>/);
assert.match(
  html,
  /<tbody id="wiersze-kursow">[\s\S]*?<td colspan="9">[\s\S]*?Godziny kursów pojawią się po przeliczeniu/
);
assert.match(html, /pierwszą wolną gruszkę przydzieloną do kursu/i);
assert.match(interfejs, /komorka\.colSpan = 9;/);
assert.match(
  interfejs,
  /"Gruszka " \+ String\(kurs\.numerGruszki\)/
);
assert.match(konfiguracja, /punktEtapu: "3C\.4"/);
assert.doesNotMatch(html, /numery gruszek zostaną pokazane/i);

console.log(
  "✓ Etap 3C.4: tabela operatora pokazuje techniczny numer pierwszej wolnej gruszki przy każdym kursie."
);
''', encoding="utf-8")
