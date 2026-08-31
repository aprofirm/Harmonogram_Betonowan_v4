from pathlib import Path
import re

KATALOG = Path(__file__).resolve().parents[1]


def wczytaj(sciezka):
    return (KATALOG / sciezka).read_text(encoding="utf-8")


def zapisz(sciezka, tresc):
    (KATALOG / sciezka).write_text(tresc, encoding="utf-8")


def zamien_wymagane(sciezka, stara, nowa):
    tresc = wczytaj(sciezka)
    if stara not in tresc:
        raise RuntimeError(f"Nie znaleziono oczekiwanego fragmentu w {sciezka}: {stara!r}")
    zapisz(sciezka, tresc.replace(stara, nowa))


# 5J.2 nie zmienia logiki biznesowej. Aktualizujemy wyłącznie znacznik wersji,
# dokumentację publikacji i historyczne testy oznaczenia etapu.
zamien_wymagane(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "5J.1"',
    'punktEtapu: "5J.2"'
)

index = wczytaj("index.html")
for stara, nowa in [
    ('<span class="znacznik-etapu">Etap 5J.1</span>', '<span class="znacznik-etapu">Etap 5J.2</span>'),
    ('<span>5J.1 · pełna regresja automatyczna</span>', '<span>5J.2 · publikacja</span>'),
    ('js/konfiguracja/konfiguracja.js?v=5j1-pelna-regresja-20260831a', 'js/konfiguracja/konfiguracja.js?v=5j2-publikacja-20260831a')
]:
    if stara not in index:
        raise RuntimeError(f"Nie znaleziono znacznika index.html: {stara}")
    index = index.replace(stara, nowa)
zapisz("index.html", index)

# Historyczne testy funkcjonalne nie mogą przywiązywać się do ostatniego numeru
# bieżącego podetapu. Ograniczamy tolerancję wyłącznie do 5J.1–5J.3.
for plik in (KATALOG / "testy").glob("*.test.js"):
    tresc = plik.read_text(encoding="utf-8")
    nowa = re.sub(
        r'assert\.equal\(([^;\n]+?\.punktEtapu), "5J\.1"\);',
        r'assert.match(\1, /^5J\\.[1-3]$/);',
        tresc
    )
    nowa = nowa.replace(
        'assert.ok(html.includes("Etap 5J.1"));',
        'assert.match(html, /Etap 5J\\.[1-3]/);'
    )
    nowa = nowa.replace(
        'assert.ok(html.includes("5J.1 · pełna regresja automatyczna"));',
        'assert.match(html, /5J\\.[1-3] · (?:pełna regresja automatyczna|publikacja|test operatora)/);'
    )
    if nowa != tresc:
        plik.write_text(nowa, encoding="utf-8")

# 5J.1 pozostaje testem historycznym po przejściu do 5J.2 i 5J.3.
test_5j1 = wczytaj("testy/etap_5j_1.test.js")
test_5j1 = test_5j1.replace(
    'assert.match(plan, /- \\[ \\] publikacja `main` i GitHub Pages;/);',
    'assert.match(plan, /- \\[[ x]\\] publikacja `main` i GitHub Pages;/);'
)
test_5j1 = test_5j1.replace(
    'assert.ok(html.includes("5j1-pelna-regresja-20260831a"));',
    'assert.match(html, /js\\/konfiguracja\\/konfiguracja\\.js\\?v=5j[1-3]-/);'
)
test_5j1 = test_5j1.replace(
    'assert.match(etapy, /następny podetap 5J\\.2/);',
    'assert.match(etapy, /następny podetap 5J\\.[23]/);'
)
zapisz("testy/etap_5j_1.test.js", test_5j1)

# Plan testów — zapisujemy konkretne dowody publikacji wersji po 5J.1.
plan = wczytaj("testy/TESTY_ETAP_5.md")
plan = plan.replace(
    "- [ ] publikacja `main` i GitHub Pages;",
    "- [x] publikacja `main` i GitHub Pages;"
)
if "### 5J.2 — publikacja" not in plan:
    plan = plan.replace(
        "Etap 5 można zamknąć dopiero po wykonaniu całego 5J.",
        "### 5J.2 — publikacja\n\n- commit zweryfikowany przed zamknięciem publikacji: `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;\n- GitHub Actions `Testy automatyczne`: run `33396511183` — `success`, pełne 92 zestawy;\n- GitHub Pages `pages build and deployment`: run `33396509870` — `success`;\n- deployment Pages wskazał `pages_build_version` dokładnie `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;\n- docelowy adres: `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`;\n- 5J.2 nie zmienia reguł harmonogramu.\n\nTest automatyczny 5J.2: `testy/etap_5j_2.test.js` pilnuje trwałego zapisu tych dowodów publikacji i pozostawia 5J otwarte do testu operatora.\n\nEtap 5 można zamknąć dopiero po wykonaniu całego 5J."
    )
zapisz("testy/TESTY_ETAP_5.md", plan)

# Etapy — zamykamy tylko publikację, nie 5J i nie Etap 5.
etapy = wczytaj("ETAPY_ROZWOJU.md")
etapy = etapy.replace(
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5J.2**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5J.3**"
)
etapy = etapy.replace(
    "  - [ ] **5J.2 — publikacja:** `main`, GitHub Actions i GitHub Pages.",
    "  - [x] **5J.2 — publikacja:** `main`, GitHub Actions i GitHub Pages."
)
etapy = etapy.replace(
    "Podetap **5J.1** jest zakończony. Punkt **5J** oraz cały **Etap 5** pozostają otwarte.\nNastępny niezakończony podetap: **5J.2 — publikacja (`main`, GitHub Actions i GitHub Pages)**.",
    "Podetapy **5J.1–5J.2** są zakończone. Punkt **5J** oraz cały **Etap 5** pozostają otwarte.\nNastępny niezakończony podetap: **5J.3 — test operatora**."
)
if "### 5J.2 — publikacja potwierdzona" not in etapy:
    etapy += "\n\n### 5J.2 — publikacja potwierdzona — 2026-08-31\n\n- [x] `main` po 5J.1 wskazywał commit `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;\n- [x] `Testy automatyczne`, run `33396511183`, zakończyły się `success`;\n- [x] `pages build and deployment`, run `33396509870`, zakończył się `success`;\n- [x] deployment użył `pages_build_version = 1d3f9d02ceb79293b71dd4a77386244eb9eee050`;\n- [x] środowisko Pages wskazało adres `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`;\n- [x] 5J.2 nie dodaje funkcji biznesowych.\n\nPodetap **5J.2** jest zakończony. Następny niezakończony podetap: **5J.3 — test operatora**.\n"
zapisz("ETAPY_ROZWOJU.md", etapy)

# README — jawny adres i stan publikacji dla operatora.
readme = wczytaj("README.md")
if "## Publikacja 5J.2" not in readme:
    readme += "\n\n## Publikacja 5J.2 — 2026-08-31\n\nWersja po pełnej regresji Etapu 5 została poprawnie opublikowana przez GitHub Pages.\nAdres: `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`.\n\nDla commita `1d3f9d02ceb79293b71dd4a77386244eb9eee050` GitHub Actions zakończył pełne 92 testy powodzeniem (run `33396511183`), a GitHub Pages zakończył build i deployment powodzeniem (run `33396509870`). Kolejny krok projektu to **5J.3 — test operatora**.\n"
zapisz("README.md", readme)

# Krótki punkt wznowienia po 5J.2.
stan = '''# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5J.2 — publikacja**.
- Punkty **5A–5I** oraz **5J.1–5J.2** są zakończone.
- Punkt **5J** i cały **Etap 5** pozostają otwarte wyłącznie dlatego, że nie wykonano jeszcze testu operatora 5J.3.
- Pełna regresja po 5J.1 obejmuje **92 zestawy testów**; po dodaniu strażnika 5J.2 repo zawiera **93 zestawy**.
- 5J.2 nie zmienia logiki planowania, konfliktów, gruszek ani pomp.

## Potwierdzenie publikacji 5J.2

- zweryfikowany commit `main`: `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;
- GitHub Actions `Testy automatyczne`: run `33396511183` — `success`;
- GitHub Pages: run `33396509870` — `success`;
- `pages_build_version`: `1d3f9d02ceb79293b71dd4a77386244eb9eee050`;
- środowisko deploymentu wskazało: `https://aprofirm.github.io/Harmonogram_Betonowan_v4/`.

Po scaleniu zapisu 5J.2 trzeba ponownie potwierdzić zielone Actions i Pages dla końcowego commita `main`.

## Następny krok

**5J.3 — test operatora.**

Test ma objąć na rzeczywistym planie co najmniej:

1. przesunięcie budowy przez pompę;
2. niedobór gruszek;
3. kaskadę kilku budów;
4. przekroczenie limitu startu;
5. przestój pomiędzy dostawami;
6. brak możliwego zasobu.

Dopiero po zaliczeniu 5J.3 można zamknąć **5J i cały Etap 5**.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5J.3.
'''
zapisz("STAN_PROJEKTU.md", stan)

# Nowy test publikacji 5J.2.
test_5j2 = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzDowodyPublikacji() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const plan = wczytaj("testy/TESTY_ETAP_5.md");
  const readme = wczytaj("README.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(etapy, /\[x\] \*\*5J\.2 — publikacja:/);
  assert.match(etapy, /33396511183/);
  assert.match(etapy, /33396509870/);
  assert.match(etapy, /1d3f9d02ceb79293b71dd4a77386244eb9eee050/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*5J\.3 — test operatora\*\*/);

  assert.match(plan, /- \[x\] publikacja `main` i GitHub Pages;/);
  assert.match(plan, /### 5J\.2 — publikacja/);
  assert.match(plan, /33396511183/);
  assert.match(plan, /33396509870/);
  assert.match(plan, /pages_build_version/);

  assert.match(readme, /https:\/\/aprofirm\.github\.io\/Harmonogram_Betonowan_v4\//);
  assert.match(readme, /## Publikacja 5J\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*5J\.2 — publikacja\*\*/);
  assert.match(stan, /\*\*5J\.3 — test operatora\.\*\*/);
}

function sprawdzBrakPrzedwczesnegoZamknieciaEtapu5() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  assert.match(etapy, /- \[ \] Etap 5 — Pełny silnik harmonogramu/);
  assert.match(etapy, /- \[ \] \*\*5J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(etapy, /- \[ \] \*\*5J\.3 — test operatora:/);
}

function sprawdzOznaczeniePublikacji() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");

  assert.match(konfiguracja, /punktEtapu:\s*"5J\.[23]"/);
  assert.match(html, /Etap 5J\.[23]/);
  assert.match(html, /5J\.[23] · (?:publikacja|test operatora)/);
  assert.match(html, /js\/konfiguracja\/konfiguracja\.js\?v=5j[23]-/);
}

sprawdzDowodyPublikacji();
sprawdzBrakPrzedwczesnegoZamknieciaEtapu5();
sprawdzOznaczeniePublikacji();

console.log(
  "OK — 5J.2 potwierdza publikację main, zielone Actions i GitHub Pages bez przedwczesnego zamknięcia Etapu 5."
);
'''
zapisz("testy/etap_5j_2.test.js", test_5j2)

# Kontrola, że nie zostały stare, kruche asercje bieżącego etapu.
pozostale = []
for plik in (KATALOG / "testy").glob("*.test.js"):
    tresc = plik.read_text(encoding="utf-8")
    if re.search(r'assert\.equal\([^;\n]*punktEtapu[^;\n]*"5J\.1"', tresc):
        pozostale.append(str(plik.relative_to(KATALOG)))
    if 'assert.ok(html.includes("Etap 5J.1"));' in tresc:
        pozostale.append(str(plik.relative_to(KATALOG)))
if pozostale:
    raise RuntimeError("Pozostały kruche asercje 5J.1: " + ", ".join(sorted(set(pozostale))))
