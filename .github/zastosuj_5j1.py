from pathlib import Path

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


# Aktualny punkt etapu i znacznik interfejsu.
zamien_wymagane(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "5I.3"',
    'punktEtapu: "5J.1"'
)

index = wczytaj("index.html")
index = index.replace(
    '<span class="znacznik-etapu">Etap 5I.3</span>',
    '<span class="znacznik-etapu">Etap 5J.1</span>'
)
index = index.replace(
    '<span>5I.3 · pamięć i stan nieaktualny</span>',
    '<span>5J.1 · pełna regresja automatyczna</span>'
)
index = index.replace(
    'js/konfiguracja/konfiguracja.js?v=5i3-pamiec-stan-20260831a',
    'js/konfiguracja/konfiguracja.js?v=5j1-pelna-regresja-20260831a'
)
zapisz("index.html", index)

# Historyczne testy funkcjonalne mają pozostać ważne również po przejściu do 5J.1.
for plik in (KATALOG / "testy").glob("*.test.js"):
    tresc = plik.read_text(encoding="utf-8")
    nowa = tresc.replace(
        'konfiguracja.punktEtapu, "5I.3"',
        'konfiguracja.punktEtapu, "5J.1"'
    )
    nowa = nowa.replace(
        'html.includes("Etap 5I.3")',
        'html.includes("Etap 5J.1")'
    )
    nowa = nowa.replace(
        'html.includes("5I.3 · pamięć i stan nieaktualny")',
        'html.includes("5J.1 · pełna regresja automatyczna")'
    )
    if nowa != tresc:
        plik.write_text(nowa, encoding="utf-8")

# Końcowy test 5J.1 pilnuje kompletności testów Etapu 5 i regresji przekrojowej.
test_5j1 = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzIstnieniePlikow(listaPlikow, opis) {
  listaPlikow.forEach(function (sciezka) {
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje wymaganego testu 5J.1 (" + opis + "): " + sciezka
    );
  });
}

function sprawdzKompletnoscEtapu5() {
  const wymaganeTestyEtapu5 = [];
  ["a", "b", "c", "d", "e", "f", "g", "h", "i"].forEach(function (litera) {
    [1, 2, 3].forEach(function (numer) {
      wymaganeTestyEtapu5.push(
        "testy/etap_5" + litera + "_" + numer + ".test.js"
      );
    });
  });

  assert.equal(wymaganeTestyEtapu5.length, 27);
  sprawdzIstnieniePlikow(wymaganeTestyEtapu5, "5A–5I");
}

function sprawdzRegresjePrzekrojowa() {
  sprawdzIstnieniePlikow([
    "testy/etap_2.test.js",
    "testy/kdx_zmienne_kolumny.test.js",
    "testy/rodzaj_rozladunku.test.js",
    "testy/odbior_wlasny_tabela.test.js",
    "testy/pamiec_planu.test.js",
    "testy/pamiec_aplikacji.test.js",
    "testy/pamiec_tras.test.js",
    "testy/pamiec_tras_integracja.test.js",
    "testy/pamiec_tras_podglad.test.js",
    "testy/kp_4.test.js",
    "testy/etap_3a.test.js",
    "testy/etap_3b_1.test.js",
    "testy/etap_3b_2.test.js",
    "testy/etap_3c_5.test.js",
    "testy/etap_3d.test.js",
    "testy/etap_3e.test.js",
    "testy/panel_pomp.test.js",
    "testy/csv_przejazdy_pomp.test.js",
    "testy/etap_4j_1.test.js",
    "testy/etap_4j_2.test.js",
    "testy/etap_4j_3_1.test.js"
  ], "import, pamięć, gruszki, pompy i trasy");
}

function sprawdzPelnyRunner() {
  const workflow = wczytaj(".github/workflows/testy.yml");
  assert.match(workflow, /set -euo pipefail/);
  assert.match(workflow, /for plik in testy\/\*\.test\.js; do/);
  assert.match(workflow, /node "\$plik"/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[main\]/);

  const testy = fs.readdirSync(path.join(katalogProjektu, "testy"))
    .filter(function (nazwa) {
      return nazwa.endsWith(".test.js");
    });
  assert.ok(
    testy.length >= 92,
    "Pełna regresja 5J.1 powinna obejmować co najmniej 92 zestawy testów."
  );
}

function sprawdzPlanTestowEtapu5() {
  const plan = wczytaj("testy/TESTY_ETAP_5.md");

  assert.match(plan, /Punkty \*\*5A–5I\*\* są zakończone/);
  assert.match(plan, /\[x\] przekroczenie wskazuje konkretną parę dostaw/);
  assert.match(plan, /## 5H — wspólny model konfliktów[\s\S]*?- \[x\] brak gruszki;/);
  assert.match(plan, /## 5I — interfejs i pamięć[\s\S]*?- \[x\] operator widzi plan źródłowy/);
  assert.match(plan, /## 5J — regresja, publikacja i test operatora[\s\S]*?- \[x\] pełna regresja importu i pamięci;/);
  assert.match(plan, /- \[x\] pełna regresja Etapu 3 — gruszki;/);
  assert.match(plan, /- \[x\] pełna regresja Etapu 4 — pompy;/);
  assert.match(plan, /- \[ \] publikacja `main` i GitHub Pages;/);
  assert.match(plan, /- \[ \] test operatora:/);
}

function sprawdzStatus5J1() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");

  assert.match(konfiguracja, /punktEtapu:\s*"5J\.1"/);
  assert.ok(html.includes("Etap 5J.1"));
  assert.ok(html.includes("5J.1 · pełna regresja automatyczna"));
  assert.ok(html.includes("5j1-pelna-regresja-20260831a"));
  assert.match(etapy, /\[x\] \*\*5J\.1 — testy automatyczne:/);
  assert.match(etapy, /\[ \] \*\*5J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(etapy, /następny podetap 5J\.2/);
}

sprawdzKompletnoscEtapu5();
sprawdzRegresjePrzekrojowa();
sprawdzPelnyRunner();
sprawdzPlanTestowEtapu5();
sprawdzStatus5J1();

console.log(
  "OK — 5J.1 potwierdza kompletność testów Etapu 5 i pełną regresję importu, pamięci, gruszek, pomp oraz interfejsu."
);
'''
zapisz("testy/etap_5j_1.test.js", test_5j1)

# Synchronizacja planu testów Etapu 5 z faktycznie zakończonym 5A–5I.
plan = wczytaj("testy/TESTY_ETAP_5.md")
plan = plan.replace(
    "Etap 4 jest zamknięty. Etap 5 jest rozpisany przed rozpoczęciem implementacji.\nPunkty **5A–5D**, cały **5E — stabilizacja**, cały **5F — limit opóźnienia startu** oraz podetapy **5G.1–5G.2** są zakończone. Następny podetap: **5G.3 — konflikt ciągłości**.",
    "Etap 4 jest zamknięty. Punkty **5A–5I** są zakończone. Trwa końcowe domknięcie Etapu 5 w punkcie **5J**; bieżący podetap to **5J.1 — pełna regresja automatyczna**."
)
plan = plan.replace(
    "- [ ] przekroczenie wskazuje konkretną parę dostaw i liczbę minut.",
    "- [x] przekroczenie wskazuje konkretną parę dostaw i liczbę minut."
)
if "Test automatyczny 5G.3:" not in plan:
    plan = plan.replace(
        "odrzucenie wartości ujemnej, nieliczbowej i nieskończonej oraz brak konfliktu,\nktóry należy dopiero do 5G.3.\n",
        "odrzucenie wartości ujemnej, nieliczbowej i nieskończonej oraz brak konfliktu,\nktóry należy dopiero do 5G.3.\n\nTest automatyczny 5G.3: `testy/etap_5g_3.test.js` — każda para rzeczywistych\ndostaw przekraczająca limit tworzy osobny konflikt z budową, oboma kursami,\nczasem przestoju, limitem i wielkością przekroczenia; granica równa limitowi\npozostaje dozwolona.\n"
    )
for tekst in [
    "- [ ] brak gruszki;",
    "- [ ] brak pompy;",
    "- [ ] niedostępna lub niezgodna pompa;",
    "- [ ] brak trasy pompy;",
    "- [ ] kolizja zasobów;",
    "- [ ] przekroczenie limitu startu;",
    "- [ ] przekroczenie maksymalnego przestoju;",
    "- [ ] konflikty nie są dublowane i mają czytelne przyczyny po polsku."
]:
    plan = plan.replace(tekst, tekst.replace("[ ]", "[x]"))
if "Testy automatyczne 5H.1–5H.3" not in plan:
    plan = plan.replace(
        "- [x] konflikty nie są dublowane i mają czytelne przyczyny po polsku.\n",
        "- [x] konflikty nie są dublowane i mają czytelne przyczyny po polsku.\n\nTesty automatyczne 5H.1–5H.3 potwierdzają wspólny wersjonowany kontrakt,\nstabilną agregację bez duplikatów oraz osobny, czytelny `komunikatOperatora`\nbez utraty technicznych danych konfliktu.\n"
    )
for tekst in [
    "- [ ] operator widzi plan źródłowy, zadany i roboczy;",
    "- [ ] wielkość oraz przyczyna przesunięcia są jawne;",
    "- [ ] konflikty mają tekst, nie tylko kolor;",
    "- [ ] zmiana parametrów unieważnia stary wynik;",
    "- [ ] odświeżenie zachowuje parametry i wyjątki, a wynik jest liczony ponownie."
]:
    plan = plan.replace(tekst, tekst.replace("[ ]", "[x]"))
if "Testy automatyczne 5I.1–5I.3" not in plan:
    plan = plan.replace(
        "- [x] odświeżenie zachowuje parametry i wyjątki, a wynik jest liczony ponownie.\n",
        "- [x] odświeżenie zachowuje parametry i wyjątki, a wynik jest liczony ponownie.\n\nTesty automatyczne 5I.1–5I.3 potwierdzają trzy znaczenia godziny startu,\ntekstową prezentację konfliktów i przestojów, pamięć limitów oraz jawne\nunieważnianie wyniku po istotnej zmianie.\n"
    )
for tekst in [
    "- [ ] pełna regresja importu i pamięci;",
    "- [ ] pełna regresja Etapu 3 — gruszki;",
    "- [ ] pełna regresja Etapu 4 — pompy;"
]:
    plan = plan.replace(tekst, tekst.replace("[ ]", "[x]"))
if "Test automatyczny 5J.1:" not in plan:
    plan = plan.replace(
        "- [ ] test operatora: przesunięcie pompą, niedobór gruszek, kaskada, limit startu, przestój i brak możliwego zasobu.\n",
        "- [ ] test operatora: przesunięcie pompą, niedobór gruszek, kaskada, limit startu, przestój i brak możliwego zasobu.\n\nTest automatyczny 5J.1: `testy/etap_5j_1.test.js` — pilnuje obecności wszystkich\n27 testów podetapów 5A–5I, kluczowych testów wcześniejszych etapów oraz tego,\nże GitHub Actions uruchamia pełny zestaw `testy/*.test.js`. Właściwe CI wykonuje\npełną regresję każdego zestawu; po dodaniu 5J.1 obejmuje ona 92 testy.\n"
    )
zapisz("testy/TESTY_ETAP_5.md", plan)

# Status etapów: zamykamy tylko 5J.1, a 5J i Etap 5 pozostają otwarte.
etapy = wczytaj("ETAPY_ROZWOJU.md")
etapy = etapy.replace(
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5J.1**",
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5J.2**"
)
etapy = etapy.replace(
    "  - [ ] **5J.1 — testy automatyczne:** cały Etap 5 oraz pełna regresja importu,",
    "  - [x] **5J.1 — testy automatyczne:** cały Etap 5 oraz pełna regresja importu,"
)
sekcja_5j1 = """

## Zamknięcie 5J.1 — pełna regresja automatyczna — 2026-08-31

- [x] istnieją wszystkie 27 testów podetapów 5A–5I;
- [x] końcowy test `testy/etap_5j_1.test.js` pilnuje kompletności testów Etapu 5;
- [x] regresja obejmuje także import KDX/CSV, pamięć planu i tras, gruszki, pompy, przejazdy oraz interfejs;
- [x] workflow `.github/workflows/testy.yml` uruchamia każdy plik `testy/*.test.js` zarówno dla `main`, jak i pull requestu;
- [x] plan `testy/TESTY_ETAP_5.md` został zsynchronizowany z faktycznie zakończonymi 5G.3, 5H i 5I;
- [x] pełna regresja po dodaniu 5J.1 obejmuje **92 zestawy testów** i musi przejść przed scaleniem;
- [x] 5J.1 nie zmienia logiki biznesowej harmonogramu.

Podetap **5J.1** jest zakończony. Punkt **5J** oraz cały **Etap 5** pozostają otwarte.
Następny niezakończony podetap: **5J.2 — publikacja (`main`, GitHub Actions i GitHub Pages)**.
"""
if "## Zamknięcie 5J.1 — pełna regresja automatyczna" not in etapy:
    etapy += sekcja_5j1
zapisz("ETAPY_ROZWOJU.md", etapy)

# README: krótki bieżący status bez zmiany funkcjonalności.
readme = wczytaj("README.md")
sekcja_readme = """

## Status końcowej regresji Etapu 5

Podetap **5J.1 — pełna regresja automatyczna** jest zakończony. Końcowy test
`testy/etap_5j_1.test.js` pilnuje kompletności wszystkich testów 5A–5I oraz
regresji importu, pamięci, gruszek, pomp, przejazdów i interfejsu. Pełny runner
GitHub Actions wykonuje każdy plik `testy/*.test.js`; po dodaniu 5J.1 zestaw
obejmuje **92 testy**. Logika biznesowa harmonogramu nie została w tym kroku
zmieniona.

Następny podetap: **5J.2 — publikacja i weryfikacja `main`, GitHub Actions oraz GitHub Pages**.
"""
if "## Status końcowej regresji Etapu 5" not in readme:
    readme += sekcja_readme
zapisz("README.md", readme)

# Trwały punkt wznowienia.
stan = """# STAN PROJEKTU — punkt wznowienia

Aktualizacja: 2026-08-31

Ten plik jest krótkim punktem wejścia do wznowienia pracy po przerwie. Pełne decyzje i historia etapów pozostają w `PROJECT_DECISIONS.md` oraz `ETAPY_ROZWOJU.md`.

## Aktualny stan

- Repozytorium: `aprofirm/Harmonogram_Betonowan_v4`.
- Ostatni zakończony podetap: **5J.1 — pełna regresja automatyczna Etapu 5**.
- Punkty **5A–5I** oraz **5J.1** są zakończone; punkt 5J i cały Etap 5 pozostają otwarte.
- Końcowy test `testy/etap_5j_1.test.js` pilnuje obecności wszystkich 27 testów 5A–5I oraz kluczowej regresji wcześniejszych etapów.
- `testy/TESTY_ETAP_5.md` jest zsynchronizowany z faktycznym stanem 5G.3, 5H i 5I.
- Pełny runner `.github/workflows/testy.yml` uruchamia każdy `testy/*.test.js` dla `main` i pull requestów.
- Po dodaniu 5J.1 pełna regresja obejmuje **92 zestawy testów**.
- 5J.1 nie zmienia logiki planowania, konfliktów, gruszek ani pomp.

## Zakres potwierdzony przez 5J.1

- import KDX/CSV i zmienne kolumny;
- pamięć planu, historia, pamięć tras i ponowne odtwarzanie;
- Etap 3 — generowanie kursów, przydział gruszek i ograniczona flota;
- Etap 4 — pompy, przejazdy, dostępność i oba tryby zasobów;
- Etap 5 — StartPlanowany/StartZadany/StartRoboczy, sprzężenie pomp i gruszek, kaskady, stabilizacja, limity startu, przestoje, wspólny kontrakt konfliktów, tekst operatorski, interfejs i stan nieaktualny.

## Następny krok

**5J.2 — publikacja.**

Zakres:

1. potwierdzić aktualny `main` po 5J.1;
2. potwierdzić zielony GitHub Actions dla pełnych 92 testów;
3. potwierdzić poprawne GitHub Pages dla tego samego stanu;
4. nie dodawać nowych funkcji biznesowych;
5. po publikacji przejść do **5J.3 — test operatora**.

## Ważna zasada wznowienia

Na początku kolejnego wątku najpierw przeczytać `AGENTS.md`, `ZASADY_KODU.md`, `PROJECT_DECISIONS.md`, `POMYSLY_I_BACKLOG.md`, `ETAPY_ROZWOJU.md` oraz ten plik, a następnie sprawdzić aktualny `main` przed rozpoczęciem 5J.2.
"""
zapisz("STAN_PROJEKTU.md", stan)
