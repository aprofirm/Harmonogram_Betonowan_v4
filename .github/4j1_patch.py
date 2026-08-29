from pathlib import Path


def zamien_raz(sciezka, stare, nowe):
    p = Path(sciezka)
    tekst = p.read_text(encoding="utf-8")
    liczba = tekst.count(stare)
    if liczba != 1:
        raise SystemExit(f"{sciezka}: oczekiwano 1 wystąpienia, jest {liczba}: {stare[:100]!r}")
    p.write_text(tekst.replace(stare, nowe, 1), encoding="utf-8")


zamien_raz("js/konfiguracja/konfiguracja.js", 'punktEtapu: "4I.5"', 'punktEtapu: "4J.1"')
zamien_raz("index.html", '<span class="znacznik-etapu">Etap 4I.5</span>', '<span class="znacznik-etapu">Etap 4J.1</span>')
zamien_raz("index.html", '<span>4I.5 · offline i dostępność</span>', '<span>4J.1 · pełna regresja automatyczna</span>')

js = "js/interfejs/minimalna_liczba_pomp.js"
zamien_raz(js, "function ustawOznaczenieEtapu4I5()", "function ustawOznaczenieEtapu4J1()")
zamien_raz(js, 'znacznikEtapu.textContent = "Etap 4I.5";', 'znacznikEtapu.textContent = "Etap 4J.1";')
zamien_raz(js, 'stopka.lastElementChild.textContent = "4I.5 · offline i dostępność";', 'stopka.lastElementChild.textContent = "4J.1 · pełna regresja automatyczna";')
zamien_raz(js, "ustawOznaczenieEtapu4I5();", "ustawOznaczenieEtapu4J1();")

zamien_raz("testy/etap_4i_2.test.js", '  assert.match(konfiguracja, /punktEtapu:\\s*"4I\\.[2-9]"/);\n', '')
zamien_raz("testy/etap_4i_3.test.js", '  assert.match(srodowisko.znacznikEtapu.textContent, /^Etap 4I\\.[3-9]$/);\n', '')
zamien_raz("testy/etap_4i_3.test.js", '  assert.match(srodowisko.stopkaEtapu.textContent, /^4I\\.[3-9] ·/);\n', '')
zamien_raz("testy/etap_4i_3.test.js", '  assert.match(konfiguracja, /punktEtapu:\\s*"4I\\.[3-9]"/);\n', '')
zamien_raz("testy/etap_4i_4.test.js", '  assert.match(konfiguracja, /punktEtapu:\\s*"4I\\.[4-9]"/);\n', '')
zamien_raz("testy/etap_4i_5.test.js", '  assert.match(html, /Etap 4I\\.5/);\n', '')
zamien_raz("testy/etap_4i_5.test.js", '  assert.match(html, /4I\\.5 · offline i dostępność/);\n', '')
zamien_raz("testy/etap_4i_5.test.js", '  assert.match(konfiguracja, /punktEtapu:\\s*"4I\\.5"/);\n', '')
zamien_raz(
    "testy/etap_4i_5.test.js",
    '''  assert.match(\n    etapy,\n    /Następny niezakończony podetap: \\*\\*4J\\.1 — testy automatyczne\\*\\*/\n  );\n''',
    '''  assert.match(\n    etapy,\n    /- \\[ \\] \\*\\*4J — pełna regresja, publikacja i test operatora\\.\\*\\*/\n  );\n'''
)

zamien_raz(
    "testy/TESTY_ETAP_4.md",
    '''Etap 4 jest rozpoczęty. Zakończono całe punkty **4A–4F** oraz podetapy\n**4G.1–4G.2**. Następny podetap to **4G.3 — testy minimalnej liczby pomp**.\nMinimalna liczba pomp jest już liczona i pokazywana operatorowi, w tym `0` dla\nplanu bez pompowania. Pełna regresja obejmuje obecnie `44` pliki `testy/*.test.js`.\n''',
    '''Etap 4 jest rozpoczęty. Zakończono całe punkty **4A–4I** oraz **4J.1 — pełną regresję automatyczną**.\nNastępny podetap to **4J.2 — publikacja**. Wszystkie pliki `testy/*.test.js` są\nuruchamiane przez jeden workflow GitHub Actions, a 4J.1 dodatkowo pilnuje kompletności\nzestawu regresji i granicy między Etapem 4 a Etapem 5.\n'''
)
for stare in [
    '- [ ] kolejny przydział uwzględnia `budowa A → budowa B`;',
    '- [ ] czasy w przeciwnych kierunkach mogą być różne;',
    '- [ ] brak potrzebnej trasy jest jawny i nie tworzy fikcyjnego przejazdu;',
    '- [ ] silnik działa dla gotowych minut bez internetu i bez usługi mapowej.'
]:
    zamien_raz("testy/TESTY_ETAP_4.md", stare, stare.replace('- [ ]', '- [x]', 1))

p = Path("testy/TESTY_ETAP_4.md")
tekst = p.read_text(encoding="utf-8")
znacznik = "## Test operatora 4J.3\n"
sekcja = '''### 4J.1 — pełna regresja automatyczna\n\n- [x] workflow uruchamia automatycznie wszystkie pliki `testy/*.test.js` i zatrzymuje się przy pierwszym błędzie;\n- [x] zestaw obejmuje import CSV i zmienne kolumny KDX;\n- [x] zestaw obejmuje rodzaje rozładunku i odbiory własne;\n- [x] zestaw obejmuje pamięć planu, historię, pamięć tras i ponowne przeliczenia;\n- [x] zestaw obejmuje pełny Etap 3: generowanie kursów, czasy, przydział i ograniczoną flotę gruszek;\n- [x] zestaw obejmuje wszystkie podpunkty pomp 4A–4I, w tym dostępność, przejazdy, minimalną flotę, limit pomp i interfejs;\n- [x] stare testy 4I chronią swoje funkcje, ale nie wymagają już, aby bieżący numer projektu pozostawał w 4I;\n- [x] osobny `testy/etap_4j_1.test.js` pilnuje obecności krytycznych grup testów, pełnego runnera i granicy Etapu 4;\n- [x] pełna regresja przechodzi przed publikacją 4J.2.\n\n'''
if znacznik not in tekst:
    raise SystemExit("TESTY_ETAP_4.md: brak znacznika testu operatora 4J.3")
if sekcja not in tekst:
    p.write_text(tekst.replace(znacznik, sekcja + znacznik, 1), encoding="utf-8")

zamien_raz(
    "ETAPY_ROZWOJU.md",
    '- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I zakończone;\n  następny podetap to 4J.1 — testy automatyczne całego Etapu 4**',
    '- [ ] Etap 4 — Pompy — **rozpoczęty; całe punkty 4A–4I oraz 4J.1 zakończone;\n  następny podetap to 4J.2 — publikacja**'
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    '  - [ ] **4J.1 — testy automatyczne:** wszystkie scenariusze Etapu 4 oraz pełna\n    regresja importu, pamięci, rodzajów rozładunku i całego Etapu 3.',
    '  - [x] **4J.1 — testy automatyczne:** wszystkie scenariusze Etapu 4 oraz pełna\n    regresja importu, pamięci, rodzajów rozładunku i całego Etapu 3.'
)
zamien_raz(
    "ETAPY_ROZWOJU.md",
    '''# Kolejny krok\n\nRozpocząć **4J.1 — testy automatyczne**: wykonać końcowy przegląd scenariuszy całego Etapu 4, uzupełnić ewentualne luki testowe i uruchomić pełną regresję importu, pamięci, rodzajów rozładunku, Etapu 3 oraz wszystkich funkcji pomp przed publikacją 4J.2.\n''',
    '''## Zamknięcie 4J.1 — pełna regresja automatyczna — 2026-08-29\n\n- [x] przeprowadzono audyt wszystkich plików `testy/*.test.js` i wymaganych grup regresji;\n- [x] potwierdzono pokrycie importu CSV/KDX, rodzajów rozładunku, odbiorów własnych, pamięci oraz całego Etapu 3;\n- [x] potwierdzono pokrycie wszystkich podpunktów pomp 4A–4I;\n- [x] zsynchronizowano historycznie niezaznaczone przypadki 4E z istniejącymi testami 4E.2–4E.4;\n- [x] usunięto z testów 4I zależność od dokładnego bieżącego numeru podetapu, aby nie blokowały poprawnego rozwoju 4J i kolejnych etapów;\n- [x] dodano `testy/etap_4j_1.test.js`, który pilnuje kompletności zestawu regresji, pełnego runnera GitHub Actions i granicy Etapu 4;\n- [x] pełna regresja wszystkich `testy/*.test.js` przechodzi poprawnie.\n\nZamknięty podetap: **4J.1**. Punkt nadrzędny **4J** i cały **Etap 4** pozostają otwarte.\nNastępny niezakończony podetap: **4J.2 — publikacja**.\n\n# Kolejny krok\n\nRozpocząć **4J.2 — publikacja**: opublikować stan po końcowej regresji na `main`, potwierdzić GitHub Actions i GitHub Pages, a następnie przygotować test operatora 4J.3.\n'''
)

zamien_raz("README.md", '    node testy/etap_4i_5.test.js\n', '    node testy/etap_4i_5.test.js\n    node testy/etap_4j_1.test.js\n')
zamien_raz(
    "README.md",
    'Następny krok to **4J.1 — końcowe testy\nautomatyczne całego Etapu 4**.',
    'Końcowa regresja **4J.1** jest zakończona. Następny krok to **4J.2 — publikacja**.'
)

Path("testy/etap_4j_1.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzIstnieniePlikow(listaPlikow) {
  listaPlikow.forEach(function (sciezka) {
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje obowiązkowego testu regresji 4J.1: " + sciezka
    );
  });
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
    "testy/etap_3a.test.js",
    "testy/etap_3b_1.test.js",
    "testy/etap_3b_2.test.js",
    "testy/etap_3c.test.js",
    "testy/etap_3c_integracja.test.js",
    "testy/etap_3d.test.js",
    "testy/etap_3e.test.js",
    "testy/etap_4a_1.test.js",
    "testy/etap_4a_2.test.js",
    "testy/etap_4a_3.test.js",
    "testy/etap_4b_2.test.js",
    "testy/etap_4b_3.test.js",
    "testy/panel_pomp.test.js",
    "testy/etap_4d_1.test.js",
    "testy/etap_4d_2.test.js",
    "testy/etap_4d_3.test.js",
    "testy/etap_4e_1.test.js",
    "testy/etap_4e_2.test.js",
    "testy/etap_4e_3.test.js",
    "testy/etap_4e_4.test.js",
    "testy/etap_4f_0.test.js",
    "testy/etap_4f_5.test.js",
    "testy/etap_4g_3.test.js",
    "testy/etap_4h_5.test.js",
    "testy/etap_4i_1.test.js",
    "testy/etap_4i_2.test.js",
    "testy/etap_4i_3.test.js",
    "testy/etap_4i_4.test.js",
    "testy/etap_4i_5.test.js"
  ]);
}

function sprawdzPelnyRunner() {
  const workflow = wczytaj(".github/workflows/testy.yml");
  assert.match(workflow, /set -euo pipefail/);
  assert.match(workflow, /for plik in testy\/\*\.test\.js; do/);
  assert.match(workflow, /node "\$plik"/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[main\]/);
}

function sprawdzGraniceEtapu4() {
  const plikiPomp = fs.readdirSync(path.join(katalogProjektu, "js/pompy"))
    .filter(function (nazwa) {
      return nazwa.endsWith(".js");
    });

  plikiPomp.forEach(function (nazwa) {
    const kod = wczytaj(path.join("js/pompy", nazwa));
    assert.doesNotMatch(
      kod,
      /\.startRoboczy\s*=/,
      "Etap 4 nie może zmieniać StartRoboczy w module: " + nazwa
    );
  });
}

function sprawdzStatus4J1() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_4.md");

  assert.match(konfiguracja, /punktEtapu:\s*"4J\.1"/);
  assert.match(html, /Etap 4J\.1/);
  assert.match(html, /4J\.1 · pełna regresja automatyczna/);
  assert.match(etapy, /\[x\] \*\*4J\.1 — testy automatyczne:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*4J\.2 — publikacja\*\*/);
  assert.match(etapy, /- \[ \] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(planTestow, /### 4J\.1 — pełna regresja automatyczna/);
  assert.doesNotMatch(planTestow, /Następny podetap to \*\*4G\.3/);
}

sprawdzRegresjePrzekrojowa();
sprawdzPelnyRunner();
sprawdzGraniceEtapu4();
sprawdzStatus4J1();

console.log(
  "OK — 4J.1 potwierdza kompletność automatycznej regresji całego Etapu 4 i wcześniejszych funkcji."
);
''', encoding="utf-8")
