from pathlib import Path


def zamien_raz(sciezka, stary, nowy):
    plik = Path(sciezka)
    tekst = plik.read_text(encoding="utf-8")
    liczba = tekst.count(stary)
    if liczba != 1:
        raise RuntimeError(f"{sciezka}: oczekiwano 1 wystąpienia, znaleziono {liczba}: {stary!r}")
    plik.write_text(tekst.replace(stary, nowy, 1), encoding="utf-8")


# Status projektu i kontrakt 4J.2.
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1 zakończone;\n  następny podetap to 4J.2 — publikacja**",
    "- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1–4J.2 zakończone;\n  następny podetap to 4J.3 — test operatora**",
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    "  - [ ] **4J.2 — publikacja:** commit na `main`, GitHub Actions i GitHub Pages.",
    "  - [x] **4J.2 — publikacja:** commit na `main`, GitHub Actions i GitHub Pages.",
)

stary_blok = """Zamknięty podetap: **4J.1**. Punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte.
Następny niezakończony podetap: **4J.2 — publikacja**.

# Kolejny krok

Rozpocząć **4J.2 — publikacja**: opublikować stan po końcowej regresji na `main`, potwierdzić GitHub Actions i GitHub Pages, a następnie przygotować test operatora 4J.3.
"""
nowy_blok = """Zamknięty podetap: **4J.1**. Punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte.
Następny niezakończony podetap: **4J.2 — publikacja**.

## Zamknięcie 4J.2 — publikacja — 2026-08-29

- [x] stan po końcowej regresji 4J.1 znajduje się na `main` w commicie `0a26a72`;
- [x] GitHub Actions `Testy automatyczne` dla tego commita zakończył się statusem `success` (run `33270058614`);
- [x] GitHub Pages opublikował ten sam commit `0a26a72` z wynikiem `success` (run `33270057938`);
- [x] publikacja korzysta z gałęzi `main` i nie wprowadza dodatkowej zależności potrzebnej do pracy offline;
- [x] adres wersji webowej pozostaje `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`;
- [x] 4J.2 nie zmienia logiki harmonogramu ani granicy Etapu 4.

Zamknięty podetap: **4J.2**. Punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte do testu operatora.
Następny niezakończony podetap: **4J.3 — test operatora**.

# Kolejny krok

Rozpocząć **4J.3 — test operatora** na opublikowanej stronie: sprawdzić rzeczywisty plan dla braku aktywnych pomp, jednej pompy i kilku budów, kilku pomp bez kolizji, pompy nieaktywnej, zbyt małej floty, przejazdu między budowami oraz odtworzenia ustawień po odświeżeniu. Dopiero po tym teście można zamknąć Etap 4.
"""
zamien_raz("ETAPY_ROZWOJU.md", stary_blok, nowy_blok)

# Bieżący znacznik aplikacji.
zamien_raz(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "4J.1"',
    'punktEtapu: "4J.2"',
)
zamien_raz("index.html", "Etap 4J.1", "Etap 4J.2")
zamien_raz(
    "index.html",
    "4J.1 · pełna regresja automatyczna",
    "4J.2 · publikacja",
)

zamien_raz(
    "js/interfejs/minimalna_liczba_pomp.js",
    "function ustawOznaczenieEtapu4J1()",
    "function ustawOznaczenieEtapu4J2()",
)
zamien_raz(
    "js/interfejs/minimalna_liczba_pomp.js",
    'znacznikEtapu.textContent = "Etap 4J.1";',
    'znacznikEtapu.textContent = "Etap 4J.2";',
)
zamien_raz(
    "js/interfejs/minimalna_liczba_pomp.js",
    'stopka.lastElementChild.textContent = "4J.1 · pełna regresja automatyczna";',
    'stopka.lastElementChild.textContent = "4J.2 · publikacja";',
)
zamien_raz(
    "js/interfejs/minimalna_liczba_pomp.js",
    "ustawOznaczenieEtapu4J1();",
    "ustawOznaczenieEtapu4J2();",
)

zamien_raz(
    "README.md",
    "`StartRoboczy` ani kursów gruszek. Końcowa regresja **4J.1** jest zakończona. Następny krok to **4J.2 — publikacja**.",
    "`StartRoboczy` ani kursów gruszek. Końcowa regresja **4J.1** oraz publikacja **4J.2** są zakończone. Wersja webowa jest publikowana z `main` pod adresem `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`. Następny krok to **4J.3 — test operatora**.",
)

# 4J.1 chroni swoją funkcję, ale nie może blokować późniejszych podetapów.
zamien_raz(
    "testy/etap_4j_1.test.js",
    '  assert.match(konfiguracja, /punktEtapu:\\s*"4J\\.1"/);\n  assert.match(html, /Etap 4J\\.1/);\n  assert.match(html, /4J\\.1 · pełna regresja automatyczna/);\n',
    '  assert.match(konfiguracja, /punktEtapu:\\s*"4J\\.[1-3]"/);\n  assert.match(html, /Etap 4J\\.[1-3]/);\n  assert.match(html, /4J\\.[1-3] ·/);\n',
)
zamien_raz(
    "testy/etap_4j_1.test.js",
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*4J\\.2 — publikacja\\*\\*/);\n',
    '',
)

# Plan testów Etapu 4 dostaje formalny zapis publikacji.
zamien_raz(
    "testy/TESTY_ETAP_4.md",
    "## Test operatora 4J.3\n",
    """### 4J.2 — publikacja

- stan po 4J.1 jest na `main`;
- `Testy automatyczne` dla commita `0a26a72` zakończyły się `success` (run `33270058614`);
- `pages build and deployment` dla tego samego commita zakończył się `success` (run `33270057938`);
- wersja webowa korzysta z publikacji GitHub Pages z `main`;
- publikacja nie zmienia logiki harmonogramu ani wymaga internetu do działania wariantu lokalnego.

## Test operatora 4J.3
""",
)

# Nowy test 4J.2 — bez zależności sieciowej.
Path("testy/etap_4j_2.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzStatusPublikacji() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const readme = wczytaj("README.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_4.md");

  assert.match(konfiguracja, /punktEtapu:\s*"4J\.2"/);
  assert.match(html, /Etap 4J\.2/);
  assert.match(html, /4J\.2 · publikacja/);
  assert.match(etapy, /\[x\] \*\*4J\.2 — publikacja:/);
  assert.match(
    etapy,
    /Następny niezakończony podetap: \*\*4J\.3 — test operatora\*\*/
  );
  assert.match(
    etapy,
    /- \[ \] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/
  );
  assert.match(
    etapy,
    /- \[ \] Etap 4 — Pompy — \*\*rozpoczęty;/
  );
  assert.match(readme, /https:\/\/aprofirm\.github\.io\/Harmonogram_Betonowan_v4\//);
  assert.match(planTestow, /### 4J\.2 — publikacja/);
  assert.match(planTestow, /33270058614/);
  assert.match(planTestow, /33270057938/);
}

function sprawdzGraniceEtapu4() {
  const katalogPomp = path.join(katalogProjektu, "js/pompy");

  fs.readdirSync(katalogPomp)
    .filter(function (nazwa) {
      return nazwa.endsWith(".js");
    })
    .forEach(function (nazwa) {
      const kod = wczytaj(path.join("js/pompy", nazwa));
      assert.doesNotMatch(
        kod,
        /\.startRoboczy\s*=/,
        "4J.2 nie może przekroczyć granicy Etapu 4 w module: " + nazwa
      );
    });
}

sprawdzStatusPublikacji();
sprawdzGraniceEtapu4();

console.log(
  "OK — 4J.2 formalizuje publikację na main i GitHub Pages bez zmiany logiki harmonogramu."
);
''', encoding="utf-8")
