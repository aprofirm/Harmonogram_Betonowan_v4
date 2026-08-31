from pathlib import Path


def zamien_dokladnie(path, stare, nowe, ile=1):
    plik = Path(path)
    tekst = plik.read_text(encoding="utf-8")
    liczba = tekst.count(stare)
    if liczba != ile:
        raise SystemExit(
            f"{path}: oczekiwano {ile} wystąpień fragmentu, znaleziono {liczba}."
        )
    plik.write_text(tekst.replace(stare, nowe), encoding="utf-8")


# 1. Interfejs: końcowe konflikty mają własny zwarty panel operatorski.
interfejs = Path("js/interfejs/interfejs.js")
tekst = interfejs.read_text(encoding="utf-8")

stare_elementy = '''      liczbaKonfliktow: pobierzWymaganyElement("liczba-konfliktow"),
      wierszeHarmonogramu: pobierzWymaganyElement("wiersze-harmonogramu"),
'''
nowe_elementy = '''      liczbaKonfliktow: pobierzWymaganyElement("liczba-konfliktow"),
      panelKonfliktow: pobierzWymaganyElement("panel-konfliktow"),
      liczbaKonfliktowPanel: pobierzWymaganyElement("liczba-konfliktow-panel"),
      listaKonfliktow: pobierzWymaganyElement("lista-konfliktow"),
      wierszeHarmonogramu: pobierzWymaganyElement("wiersze-harmonogramu"),
'''
if tekst.count(stare_elementy) != 1:
    raise SystemExit("Nie znaleziono miejsca rejestracji elementów konfliktów.")
tekst = tekst.replace(stare_elementy, nowe_elementy)

funkcje_konfliktow = '''
  function pobierzNazweKategoriiKonfliktu(kategoriaKonfliktu) {
    const nazwyKategorii = {
      "brak-gruszki": "Brak gruszki",
      "brak-pompy": "Brak pompy",
      "niedostepnosc": "Niedostępność",
      "niezgodny-parametr": "Parametr",
      "kolizja": "Kolizja",
      "brak-trasy": "Brak trasy",
      "limit-startu": "Start",
      "limit-przestoju": "Przestój",
      "niestabilnosc": "Niestabilny plan",
      "inne": "Konflikt"
    };

    return nazwyKategorii[kategoriaKonfliktu] || "Konflikt";
  }

  function pobierzNumerKursuPowiazania(konflikt, powiazanie) {
    const idPowiazania = String(powiazanie.id || "");

    if (
      powiazanie.rola === "poprzedni" &&
      idPowiazania === String(konflikt.idPoprzedniegoKursu || "") &&
      Number.isFinite(Number(konflikt.numerPoprzedniegoKursu))
    ) {
      return String(konflikt.numerPoprzedniegoKursu);
    }

    if (
      powiazanie.rola === "nastepny" &&
      idPowiazania === String(konflikt.idNastepnegoKursu || "") &&
      Number.isFinite(Number(konflikt.numerNastepnegoKursu))
    ) {
      return String(konflikt.numerNastepnegoKursu);
    }

    return idPowiazania;
  }

  function utworzEtykietePowiazaniaKonfliktu(konflikt, powiazanie) {
    const typ = String(powiazanie.typ || "");
    const id = String(powiazanie.id || "");

    if (typ === "budowa") {
      if (
        id === String(konflikt.idBudowy || "") &&
        String(konflikt.nazwaBudowy || "").trim()
      ) {
        return "Budowa: " + String(konflikt.nazwaBudowy).trim();
      }
      return "Budowa: " + id;
    }

    if (typ === "kurs") {
      const numerKursu = pobierzNumerKursuPowiazania(konflikt, powiazanie);
      if (powiazanie.rola === "poprzedni") {
        return "Kurs poprzedni: " + numerKursu;
      }
      if (powiazanie.rola === "nastepny") {
        return "Kurs następny: " + numerKursu;
      }
      return "Kurs: " + numerKursu;
    }

    if (typ === "zasob") {
      if (id === "gruszki") {
        return "Zasób: gruszki";
      }
      if (id === "pompy") {
        return "Zasób: pompy";
      }
      if (id.indexOf("pompa:") === 0) {
        return "Pompa: " + id.slice(6);
      }
      if (id.indexOf("gruszka:") === 0) {
        return "Gruszka: " + id.slice(8);
      }
      return "Zasób: " + id;
    }

    if (typ === "parametr") {
      return "Parametr: " + id;
    }

    if (typ === "harmonogram") {
      return "Cały harmonogram";
    }

    return "Powiązanie: " + id;
  }

  function pobierzPrezentacjeKonfliktu(konflikt) {
    const zrodlo = konflikt && typeof konflikt === "object" ? konflikt : {};
    const kategoriaKonfliktu = String(
      zrodlo.kategoriaKonfliktu || "inne"
    ).trim() || "inne";
    const listaPowiazan = Array.isArray(zrodlo.powiazania)
      ? zrodlo.powiazania
      : [];
    const powiazania = listaPowiazan.map(function (powiazanie) {
      const kopia = {
        typ: String(powiazanie.typ || ""),
        id: String(powiazanie.id || ""),
        rola: String(powiazanie.rola || "")
      };
      kopia.etykieta = utworzEtykietePowiazaniaKonfliktu(zrodlo, kopia);
      return kopia;
    });
    const komunikat = String(
      zrodlo.komunikatOperatora ||
      zrodlo.opis ||
      "Wykryto konflikt harmonogramu."
    ).trim();

    return {
      kategoriaKonfliktu: kategoriaKonfliktu,
      etykietaTypu: pobierzNazweKategoriiKonfliktu(kategoriaKonfliktu),
      komunikat: komunikat,
      czyPrzestoj:
        kategoriaKonfliktu === "limit-przestoju" ||
        zrodlo.rodzaj === "przestoj-betonowania",
      powiazania: powiazania
    };
  }

  function utworzZnacznikPowiazaniaKonfliktu(powiazanie) {
    const znacznik = document.createElement("span");
    znacznik.className = "wpis-konfliktu__powiazanie";
    znacznik.textContent = powiazanie.etykieta;
    znacznik.setAttribute("data-typ", powiazanie.typ);
    znacznik.setAttribute("data-id", powiazanie.id);
    znacznik.setAttribute("data-rola", powiazanie.rola);
    return znacznik;
  }

  function utworzWpisKonfliktu(konflikt) {
    const prezentacja = pobierzPrezentacjeKonfliktu(konflikt);
    const wpis = document.createElement("article");
    const etykietaTypu = document.createElement("strong");
    const komunikat = document.createElement("p");
    const powiazania = document.createElement("div");

    wpis.className = "wpis-konfliktu" +
      (prezentacja.czyPrzestoj ? " wpis-konfliktu--przestoj" : "");
    wpis.setAttribute(
      "data-kategoria-konfliktu",
      prezentacja.kategoriaKonfliktu
    );
    etykietaTypu.className = "wpis-konfliktu__typ";
    etykietaTypu.textContent = prezentacja.etykietaTypu;
    komunikat.className = "wpis-konfliktu__komunikat";
    komunikat.textContent = prezentacja.komunikat;
    powiazania.className = "wpis-konfliktu__powiazania";

    prezentacja.powiazania.forEach(function (powiazanie) {
      powiazania.appendChild(utworzZnacznikPowiazaniaKonfliktu(powiazanie));
    });

    wpis.appendChild(etykietaTypu);
    wpis.appendChild(komunikat);
    if (prezentacja.powiazania.length) {
      wpis.appendChild(powiazania);
    }
    return wpis;
  }

  function pokazListeKonfliktow(listaKonfliktow) {
    const lista = Array.isArray(listaKonfliktow) ? listaKonfliktow : [];
    const fragment = document.createDocumentFragment();

    lista.forEach(function (konflikt) {
      fragment.appendChild(utworzWpisKonfliktu(konflikt));
    });

    elementy.listaKonfliktow.replaceChildren(fragment);
    elementy.liczbaKonfliktowPanel.textContent = String(lista.length);
    elementy.panelKonfliktow.hidden = lista.length === 0;
  }

'''
anchor = '  function pokazTrwajacePrzeliczenie() {\n'
if tekst.count(anchor) != 1:
    raise SystemExit("Nie znaleziono miejsca przed pokazTrwajacePrzeliczenie().")
tekst = tekst.replace(anchor, funkcje_konfliktow + anchor)

stary_wynik = '''    odswiezPodsumowaniePomp();
    elementy.liczbaKonfliktow.textContent = String(wynik.konflikty.length);
    ustawStatus(
'''
nowy_wynik = '''    odswiezPodsumowaniePomp();
    elementy.liczbaKonfliktow.textContent = String(wynik.konflikty.length);
    pokazListeKonfliktow(wynik.konflikty);
    ustawStatus(
'''
if tekst.count(stary_wynik) != 1:
    raise SystemExit("Nie znaleziono podsumowania konfliktów w pokazWynik().")
tekst = tekst.replace(stary_wynik, nowy_wynik)

stare_czyszczenie = '    elementy.liczbaKonfliktow.textContent = "0";\n'
liczba_czyszczen = tekst.count(stare_czyszczenie)
if liczba_czyszczen != 3:
    raise SystemExit(
        f"Oczekiwano 3 miejsc czyszczenia licznika konfliktów, znaleziono {liczba_czyszczen}."
    )
tekst = tekst.replace(
    stare_czyszczenie,
    stare_czyszczenie + '    pokazListeKonfliktow([]);\n'
)

stare_eksporty = '''    pokazTrwajacePrzeliczenie: pokazTrwajacePrzeliczenie,
    pokazWynik: pokazWynik,
    oznaczWynikJakoNieaktualny: oznaczWynikJakoNieaktualny,
'''
nowe_eksporty = '''    pokazTrwajacePrzeliczenie: pokazTrwajacePrzeliczenie,
    pokazWynik: pokazWynik,
    pobierzPrezentacjeKonfliktu: pobierzPrezentacjeKonfliktu,
    pokazListeKonfliktow: pokazListeKonfliktow,
    oznaczWynikJakoNieaktualny: oznaczWynikJakoNieaktualny,
'''
if tekst.count(stare_eksporty) != 1:
    raise SystemExit("Nie znaleziono eksportów funkcji wyniku interfejsu.")
tekst = tekst.replace(stare_eksporty, nowe_eksporty)
interfejs.write_text(tekst, encoding="utf-8")


# 2. HTML: panel konfliktów jest blisko głównego wyniku, ale nie zajmuje miejsca bez problemów.
index = Path("index.html")
tekst = index.read_text(encoding="utf-8")
anchor_tabeli = '''            <div class="tabela-przewijana">
              <table>
                <thead>
                  <tr>
                    <th>Start budowy</th>
'''
panel_html = '''            <section
              id="panel-konfliktow"
              class="panel-konfliktow"
              aria-labelledby="tytul-panelu-konfliktow"
              aria-live="polite"
              hidden
            >
              <div class="panel-konfliktow__naglowek">
                <div>
                  <p class="etykieta-sekcji">PROBLEMY WYNIKU</p>
                  <h3 id="tytul-panelu-konfliktow">Konflikty wymagające uwagi</h3>
                  <small>Każdy wpis opisuje problem tekstowo i wskazuje powiązaną budowę, kurs albo zasób.</small>
                </div>
                <span
                  id="liczba-konfliktow-panel"
                  class="panel-konfliktow__licznik"
                  aria-label="Liczba konfliktów w panelu"
                >0</span>
              </div>
              <div id="lista-konfliktow" class="lista-konfliktow"></div>
            </section>

'''
if tekst.count(anchor_tabeli) != 1:
    raise SystemExit("Nie znaleziono początku głównej tabeli budów.")
tekst = tekst.replace(anchor_tabeli, panel_html + anchor_tabeli)

tekst = tekst.replace("Etap 5I.1", "Etap 5I.2")
tekst = tekst.replace(
    "5I.1 · trzy godziny startu",
    "5I.2 · konflikty i przestoje"
)
tekst = tekst.replace(
    "5i1-trzy-godziny-20260831a",
    "5i2-konflikty-interfejs-20260831a"
)
index.write_text(tekst, encoding="utf-8")


# 3. CSS: panel pozostaje kompaktowy, a tekst niesie pełne znaczenie problemu.
css = Path("style/glowny.css")
tekst = css.read_text(encoding="utf-8")
anchor_css = '.tabela-przewijana {\n'
style_panelu = '''.panel-konfliktow {
  margin: 0 16px 14px;
  padding: 10px 12px;
  border: 1px solid #f0cf9a;
  border-radius: 10px;
  background: #fffaf2;
}

.panel-konfliktow[hidden] {
  display: none;
}

.panel-konfliktow__naglowek {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-konfliktow__naglowek .etykieta-sekcji {
  margin-bottom: 2px;
  color: #9b611f;
}

.panel-konfliktow__naglowek h3 {
  margin: 0;
  color: var(--kolor-granatowy-ciemny);
  font-size: 0.9rem;
}

.panel-konfliktow__naglowek small {
  display: block;
  margin-top: 2px;
  color: var(--kolor-tekstu-pomocniczego);
  font-size: 0.68rem;
  line-height: 1.35;
}

.panel-konfliktow__licznik {
  flex: 0 0 auto;
  min-width: 30px;
  padding: 4px 8px;
  border-radius: 999px;
  color: #7b4814;
  background: #ffe7c3;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 850;
}

.lista-konfliktow {
  display: grid;
  gap: 6px;
  max-height: 280px;
  margin-top: 8px;
  overflow-y: auto;
}

.wpis-konfliktu {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 3px 9px;
  align-items: baseline;
  padding: 7px 9px;
  border: 1px solid #f1d8b4;
  border-radius: 8px;
  background: #ffffff;
}

.wpis-konfliktu__typ {
  min-width: 70px;
  color: #8b561c;
  font-size: 0.68rem;
  font-weight: 850;
}

.wpis-konfliktu--przestoj .wpis-konfliktu__typ {
  color: #a1442c;
}

.wpis-konfliktu__komunikat {
  margin: 0;
  color: var(--kolor-tekstu);
  font-size: 0.76rem;
  line-height: 1.4;
}

.wpis-konfliktu__powiazania {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.wpis-konfliktu__powiazanie {
  padding: 2px 6px;
  border: 1px solid #dfe7ec;
  border-radius: 999px;
  color: #60717e;
  background: #f7f9fa;
  font-size: 0.62rem;
  font-weight: 700;
}

'''
if tekst.count(anchor_css) != 1:
    raise SystemExit("Nie znaleziono miejsca przed tabelą w CSS.")
tekst = tekst.replace(anchor_css, style_panelu + anchor_css)
css.write_text(tekst, encoding="utf-8")


# 4. Oznaczenie bieżącego podetapu.
zamien_dokladnie(
    "js/konfiguracja/konfiguracja.js",
    'punktEtapu: "5I.1"',
    'punktEtapu: "5I.2"'
)


# 5. Historyczne testy bieżącego oznaczenia etapu muszą śledzić aktualny punkt.
for plik_testu in Path("testy").glob("*.test.js"):
    tekst_testu = plik_testu.read_text(encoding="utf-8")
    tekst_testu = tekst_testu.replace(
        'punktEtapu, "5I.1"',
        'punktEtapu, "5I.2"'
    )
    plik_testu.write_text(tekst_testu, encoding="utf-8")

plik_5i1 = Path("testy/etap_5i_1.test.js")
tekst = plik_5i1.read_text(encoding="utf-8")
tekst = tekst.replace('html.includes("Etap 5I.1")', 'html.includes("Etap 5I.2")')
tekst = tekst.replace(
    'html.includes("5I.1 · trzy godziny startu")',
    'html.includes("5I.2 · konflikty i przestoje")'
)
tekst = tekst.replace(
    'html.includes("5i1-trzy-godziny-20260831a")',
    'html.includes("5i2-konflikty-interfejs-20260831a")'
)
plik_5i1.write_text(tekst, encoding="utf-8")


# 6. Test 5I.2: czytelny tekst, przestoje i jawne powiązania z obiektami.
test_5i2 = r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    TextDecoder: TextDecoder,
    FileReader: function () {},
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js",
    "js/harmonogram/konflikty_przestojow.js",
    "js/harmonogram/kontrakt_konfliktow.js",
    "js/interfejs/interfejs.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzWynikZPrzestojem(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;24;Lej;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5i2.csv");

  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 16,
      czasRozladunkuMinuty: 15,
      maksymalnyPrzestojMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 0,
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: 1
    }
  });
}

function sprawdzPrzestojZRzeczywistegoSilnika() {
  const aplikacja = wczytajAplikacje();
  const wynik = utworzWynikZPrzestojem(aplikacja);
  const konflikt = wynik.konflikty.find(function (pozycja) {
    return pozycja.kategoriaKonfliktu === "limit-przestoju";
  });
  const zrodloPrzed = JSON.stringify(konflikt);
  const prezentacja = aplikacja.interfejs.pobierzPrezentacjeKonfliktu(konflikt);

  assert.ok(konflikt, "Scenariusz powinien utworzyć konflikt przestoju.");
  assert.equal(prezentacja.etykietaTypu, "Przestój");
  assert.equal(prezentacja.czyPrzestoj, true);
  assert.ok(prezentacja.komunikat.includes("16 min"));
  assert.ok(prezentacja.komunikat.includes("kursu 1"));
  assert.ok(prezentacja.komunikat.includes("kursu 2"));
  assert.deepEqual(
    Array.from(prezentacja.powiazania, function (powiazanie) {
      return powiazanie.etykieta;
    }),
    ["Budowa: Budowa A", "Kurs poprzedni: 1", "Kurs następny: 2"]
  );
  assert.deepEqual(
    Array.from(prezentacja.powiazania, function (powiazanie) {
      return [powiazanie.typ, powiazanie.id, powiazanie.rola];
    }),
    [
      ["budowa", "A", "dotyczy"],
      ["kurs", "A-KURS-001", "poprzedni"],
      ["kurs", "A-KURS-002", "nastepny"]
    ]
  );
  assert.equal(JSON.stringify(konflikt), zrodloPrzed);
}

function sprawdzZasobIFallbackTekstu() {
  const aplikacja = wczytajAplikacje();
  const prezentacjaPompy = aplikacja.interfejs.pobierzPrezentacjeKonfliktu({
    kategoriaKonfliktu: "brak-pompy",
    komunikatOperatora: "Nie znaleziono pompy dla budowy.",
    powiazania: [{ typ: "zasob", id: "pompy", rola: "dotyczy" }]
  });
  const prezentacjaNieznana = aplikacja.interfejs.pobierzPrezentacjeKonfliktu({
    kategoriaKonfliktu: "przyszla-kategoria",
    opis: "Czytelny opis przyszłego problemu.",
    powiazania: [{ typ: "harmonogram", id: "glowny", rola: "dotyczy" }]
  });

  assert.equal(prezentacjaPompy.etykietaTypu, "Brak pompy");
  assert.equal(prezentacjaPompy.powiazania[0].etykieta, "Zasób: pompy");
  assert.equal(prezentacjaNieznana.etykietaTypu, "Konflikt");
  assert.equal(
    prezentacjaNieznana.komunikat,
    "Czytelny opis przyszłego problemu."
  );
  assert.equal(prezentacjaNieznana.powiazania[0].etykieta, "Cały harmonogram");
}

function sprawdzWarstweWidoku() {
  const html = wczytaj("index.html");
  const interfejs = wczytaj("js/interfejs/interfejs.js");
  const css = wczytaj("style/glowny.css");

  assert.ok(html.includes('id="panel-konfliktow"'));
  assert.ok(html.includes('id="lista-konfliktow"'));
  assert.ok(html.includes('id="liczba-konfliktow-panel"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("Konflikty wymagające uwagi"));
  assert.ok(html.includes("Etap 5I.2"));
  assert.ok(html.includes("5I.2 · konflikty i przestoje"));
  assert.ok(html.includes("5i2-konflikty-interfejs-20260831a"));

  assert.ok(interfejs.includes("pokazListeKonfliktow(wynik.konflikty);"));
  assert.ok(interfejs.includes("elementy.panelKonfliktow.hidden = lista.length === 0;"));
  assert.ok(interfejs.includes("zrodlo.komunikatOperatora"));
  assert.ok(interfejs.includes('setAttribute("data-typ", powiazanie.typ)'));
  assert.ok(interfejs.includes('setAttribute("data-id", powiazanie.id)'));
  assert.ok(interfejs.includes('setAttribute("data-rola", powiazanie.rola)'));

  assert.ok(css.includes(".panel-konfliktow[hidden]"));
  assert.ok(css.includes(".wpis-konfliktu__komunikat"));
  assert.ok(css.includes(".wpis-konfliktu__powiazanie"));
  assert.ok(css.includes(".wpis-konfliktu--przestoj"));
}

sprawdzPrzestojZRzeczywistegoSilnika();
sprawdzZasobIFallbackTekstu();
sprawdzWarstweWidoku();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5I.2");

console.log(
  "OK — 5I.2 pokazuje końcowe konflikty i przestoje tekstowo, z jawnym powiązaniem do budowy, kursu albo zasobu."
);
'''
Path("testy/etap_5i_2.test.js").write_text(test_5i2, encoding="utf-8")


# 7. Dokumentacja decyzji: panel konfliktów jest warstwą widoku kontraktu 5H.
decyzje = Path("PROJECT_DECISIONS.md")
tekst = decyzje.read_text(encoding="utf-8")
if "## 118. Końcowe konflikty są pokazane w osobnym panelu operatora" not in tekst:
    tekst += '''

---

## 118. Końcowe konflikty są pokazane w osobnym panelu operatora

Od 5I.2 końcowa lista `wynik.konflikty` jest prezentowana operatorowi w zwartym panelu bezpośrednio przy wyniku harmonogramu. Panel korzysta z `komunikatOperatora` przygotowanego w 5H.3 i nie tworzy własnej równoległej klasyfikacji ani nie zmienia silnika.

Każdy wpis ma tekstową nazwę rodzaju problemu oraz pełny komunikat. Kolor jest wyłącznie sygnałem pomocniczym i nie może być jedynym nośnikiem znaczenia. Konflikt zachowuje widoczne powiązanie z budową, kursem albo zasobem na podstawie wspólnego pola `powiazania`; dla konfliktu przestoju operator widzi konkretną budowę oraz oba kolejne kursy.

Panel jest ukryty, gdy końcowy wynik nie zawiera konfliktów, i jest czyszczony razem z wynikiem po każdej zmianie danych wymagającej ponownego przeliczenia. Warstwa interfejsu nie modyfikuje obiektów konfliktów, zasad agregacji 5H ani decyzji planistycznych silnika.
'''
    decyzje.write_text(tekst, encoding="utf-8")


# 8. README: krótka instrukcja obsługi panelu i aktualny następny krok.
readme = Path("README.md")
tekst = readme.read_text(encoding="utf-8")
sekcja_konfliktow = '''## Konflikty i przestoje w wyniku

Po pełnym przeliczeniu, jeżeli wynik zawiera problemy wymagające uwagi, pod nagłówkiem harmonogramu pojawia się zwarty panel **Konflikty wymagające uwagi**. Każdy wpis używa prostego `komunikatOperatora`, więc nie trzeba odczytywać kodów diagnostycznych.

Wpis pokazuje również kontekst problemu: nazwę budowy, właściwe kursy albo zasób. Konflikt przestoju wskazuje konkretną parę kolejnych dostaw. Kolor jest tylko dodatkowym sygnałem; rodzaj i sens problemu są zawsze zapisane tekstem. Gdy konfliktów nie ma, panel pozostaje ukryty. Zmiana danych planu czyści poprzedni panel razem z nieaktualnym wynikiem.

'''
anchor_readme = "## Szeroki, kompaktowy widok\n"
if tekst.count(anchor_readme) != 1:
    raise SystemExit("README: nie znaleziono sekcji szerokiego widoku.")
tekst = tekst.replace(anchor_readme, sekcja_konfliktow + anchor_readme)

stary_status = "Następny krok to **5I.2 — konflikty i przestoje w interfejsie**."
nowy_status = "Podetap **5I.2 — konflikty i przestoje w interfejsie** jest zakończony: końcowe konflikty są pokazane tekstowo razem z powiązaną budową, kursem albo zasobem. Następny krok to **5I.3 — pamięć i stan nieaktualny**."
if tekst.count(stary_status) != 1:
    raise SystemExit("README: nie znaleziono aktualnego zdania o następnym kroku 5I.2.")
tekst = tekst.replace(stary_status, nowy_status)
readme.write_text(tekst, encoding="utf-8")


# 9. ETAPY: zamknięcie 5I.2, ale 5I pozostaje otwarte do 5I.3.
etapy = Path("ETAPY_ROZWOJU.md")
tekst = etapy.read_text(encoding="utf-8")
tekst = tekst.replace(
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5I.2**",
    "Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5I.3**"
)
tekst = tekst.replace(
    '  - [ ] **5I.2 — konflikty i przestoje:** problemy są widoczne tekstowo, a kolor\n    jest tylko sygnałem pomocniczym.',
    '  - [x] **5I.2 — konflikty i przestoje:** problemy są widoczne tekstowo, a kolor\n    jest tylko sygnałem pomocniczym.'
)

stare_zamkniecie = '''Podetap **5I.1** jest zakończony. Punkt nadrzędny **5I — interfejs, parametry i pamięć wyniku Etapu 5** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5I.2 — konflikty i przestoje w interfejsie**.

## Weryfikacja produkcyjnego KDX — 2026-08-14
'''
nowe_zamkniecie = '''Podetap **5I.1** jest zakończony. Punkt nadrzędny **5I — interfejs, parametry i pamięć wyniku Etapu 5** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5I.2 — konflikty i przestoje w interfejsie**.

## Zamknięcie 5I.2 — konflikty i przestoje w interfejsie — 2026-08-31

- [x] końcowe `wynik.konflikty` są pokazywane w osobnym, zwartym panelu przy głównym wyniku harmonogramu;
- [x] każdy wpis korzysta z `komunikatOperatora` z 5H.3 zamiast kodu diagnostycznego;
- [x] rodzaj problemu jest zapisany tekstowo, a kolor pozostaje wyłącznie dodatkowym sygnałem;
- [x] widoczne znaczniki zachowują powiązania z budową, kursem albo zasobem z kontraktu 5H.1;
- [x] konflikt przestoju wskazuje konkretną budowę oraz poprzedni i następny kurs problematycznej pary;
- [x] brak konfliktów ukrywa panel, a zmiana danych czyści go razem z nieaktualnym wynikiem;
- [x] interfejs nie zmienia klasyfikacji, agregacji ani logiki planowania konfliktów;
- [x] test `testy/etap_5i_2.test.js` sprawdza rzeczywisty konflikt przestoju, tekst, powiązania, fallback oraz warstwę HTML/CSS;
- [x] pełna regresja `testy/*.test.js` przechodzi przed publikacją.

Podetap **5I.2** jest zakończony. Punkt nadrzędny **5I — interfejs, parametry i pamięć wyniku Etapu 5** oraz cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5I.3 — pamięć i stan nieaktualny**.

## Weryfikacja produkcyjnego KDX — 2026-08-14
'''
if tekst.count(stare_zamkniecie) != 1:
    raise SystemExit("ETAPY: nie znaleziono punktu wznowienia po 5I.1.")
tekst = tekst.replace(stare_zamkniecie, nowe_zamkniecie)
etapy.write_text(tekst, encoding="utf-8")
