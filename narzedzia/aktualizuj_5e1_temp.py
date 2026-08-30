from pathlib import Path


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f"Nie znaleziono jednoznacznie fragmentu: {label} (liczba: {text.count(old)})")
    return text.replace(old, new, 1)


harmonogram = Path("js/harmonogram/harmonogram.js")
text = harmonogram.read_text(encoding="utf-8")

old_reset = '''    wynikiBudow.forEach(function (wynikBudowy) {
      wynikBudowy.korektaPoRzeczywistychDostawach = null;
    });

'''
text = replace_once(text, old_reset, "", "reset korekt wewnątrz pojedynczej iteracji")

marker_korekta = '''  function zastosujKorekteStartowPoRzeczywistychDostawach(przebieg) {
'''
helper = '''  function wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg) {
    const wynikPomp = przebieg.wynikPomp;
    const wynikiBudow = wynikPomp && Array.isArray(wynikPomp.wynikiBudow)
      ? wynikPomp.wynikiBudow
      : [];

    wynikiBudow.forEach(function (wynikBudowy) {
      wynikBudowy.korektaPoRzeczywistychDostawach = null;
    });

    return przebieg;
  }

  function przeliczZalezneFazyPoZmianieStartu(przebieg) {
    regenerujKursyPoStartachPomp(przebieg);
    obliczGruszkiPrzebiegu(przebieg);
    zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);
    return przebieg;
  }

'''
text = replace_once(text, marker_korekta, helper + marker_korekta, "helpery iteracji 5E.1")

old_flow = '''  function przeliczCalyHarmonogram(daneWejsciowe) {
    const przebieg = przygotujCentralnyPrzebieg(daneWejsciowe);

    obliczBazoweKursyPrzebiegu(przebieg);
    obliczPompyPrzebiegu(przebieg);
    zastosujMozliweStartyPomp(przebieg);
    regenerujKursyPoStartachPomp(przebieg);
    obliczGruszkiPrzebiegu(przebieg);
    zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);
    zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);

    if (przebieg.czySkorygowanoStartyPoRzeczywistychDostawach) {
      regenerujKursyPoStartachPomp(przebieg);
      obliczGruszkiPrzebiegu(przebieg);
      zaktualizujRzeczywisteOknaPompPoGruszkach(przebieg);
    }

    return zbudujKoncowyWynikPrzebiegu(przebieg);
  }
'''
new_flow = '''  function przeliczCalyHarmonogram(daneWejsciowe) {
    const przebieg = przygotujCentralnyPrzebieg(daneWejsciowe);

    obliczBazoweKursyPrzebiegu(przebieg);
    obliczPompyPrzebiegu(przebieg);
    zastosujMozliweStartyPomp(przebieg);
    przeliczZalezneFazyPoZmianieStartu(przebieg);
    wyczyscKorektyStartowPoRzeczywistychDostawach(przebieg);
    zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);

    // Każda następna iteracja ma sens wyłącznie wtedy, gdy poprzednia
    // rzeczywiście zmieniła StartRoboczy co najmniej jednej budowy. Nie
    // dokładamy tu jeszcze osobnego limitu iteracji — to zakres 5E.3.
    while (przebieg.czySkorygowanoStartyPoRzeczywistychDostawach) {
      przeliczZalezneFazyPoZmianieStartu(przebieg);
      zastosujKorekteStartowPoRzeczywistychDostawach(przebieg);
    }

    return zbudujKoncowyWynikPrzebiegu(przebieg);
  }
'''
text = replace_once(text, old_flow, new_flow, "centralny przepływ 5E.1")
harmonogram.write_text(text, encoding="utf-8")


konfiguracja = Path("js/konfiguracja/konfiguracja.js")
text = konfiguracja.read_text(encoding="utf-8")
text = replace_once(text, 'punktEtapu: "5D.3"', 'punktEtapu: "5E.1"', "punkt etapu")
konfiguracja.write_text(text, encoding="utf-8")


index = Path("index.html")
text = index.read_text(encoding="utf-8")
text = replace_once(text, '<span class="znacznik-etapu">Etap 5D.1</span>', '<span class="znacznik-etapu">Etap 5E.1</span>', "znacznik etapu w UI")
text = replace_once(text, '<span>5D.1 · rzeczywiste okno betonowania</span>', '<span>5E.1 · deterministyczna iteracja</span>', "stopka etapu")
text = replace_once(
    text,
    'js/harmonogram/harmonogram.js?v=5d2-wplyw-na-nastepna-budowe-20260830a',
    'js/harmonogram/harmonogram.js?v=5e1-deterministyczna-iteracja-20260830a',
    "cache harmonogramu",
)
index.write_text(text, encoding="utf-8")


test_content = r'''"use strict";

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
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzListePomp() {
  return [{
    idPompy: "P-1",
    nazwa: "Pompa 1",
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "07:00",
    wysiegMetry: 32
  }];
}

function utworzParametry(liczbaGruszek) {
  return {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: liczbaGruszek
  };
}

function liczWywolaniaOgraniczonegoPrzydzialuGruszek(aplikacja) {
  const oryginalnaFunkcja =
    aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow;
  let liczbaWywolan = 0;

  aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow = function () {
    liczbaWywolan += 1;
    return oryginalnaFunkcja.apply(this, arguments);
  };

  return function () {
    return liczbaWywolan;
  };
}

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function pobierzWynikPompy(wynik, idBudowy) {
  return wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === idBudowy;
  });
}

function pobierzKursyBudowy(wynik, idBudowy) {
  return wynik.kursy.filter(function (kurs) {
    return kurs.idBudowy === idBudowy;
  });
}

function sprawdzBrakDodatkowejIteracjiDlaStabilnegoPlanu() {
  const aplikacja = wczytajAplikacje();
  const pobierzLiczbeWywolan =
    liczWywolaniaOgraniczonegoPrzydzialuGruszek(aplikacja);
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5e1-stabilny.csv");
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(2)
  });

  assert.equal(pobierzBudowe(wynik, "A").startRoboczy, "08:00");
  assert.equal(
    pobierzLiczbeWywolan(),
    1,
    "Stabilny plan nie powinien uruchamiać zbędnej kolejnej iteracji gruszek."
  );
}

function sprawdzWielokrotnaIteracjePoKolejnychZmianachPlanu() {
  const aplikacja = wczytajAplikacje();
  const pobierzLiczbeWywolan =
    liczWywolaniaOgraniczonegoPrzydzialuGruszek(aplikacja);
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0",
    "B;Beta;Budowa B;09:20;16;Pompa;0;0",
    "X;Delta;Budowa X;09:40;8;Lej;0;0",
    "C;Gamma;Budowa C;10:50;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5e1-iteracja.csv");
  const zrodloPrzed = JSON.stringify(stanImportu);

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5e1" };
  stanImportu.budowy[1].przejazdyPompyMinuty = { C: 0 };
  stanImportu.budowy[1].zrodlaPrzejazdowPompy = { C: "test-5e1" };

  const zrodloPoTrasach = JSON.stringify(stanImportu);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(1)
  });
  const pompaB = pobierzWynikPompy(wynik, "B");
  const pompaC = pobierzWynikPompy(wynik, "C");

  assert.equal(pobierzBudowe(wynik, "A").startRoboczy, "08:00");
  assert.equal(pobierzBudowe(wynik, "B").startRoboczy, "09:30");
  assert.equal(pobierzBudowe(wynik, "X").startRoboczy, "09:40");
  assert.equal(pobierzBudowe(wynik, "C").startRoboczy, "11:25");

  assert.equal(
    pobierzLiczbeWywolan(),
    3,
    "Dwie kolejne zmiany planu powinny wymusić dokładnie dwa dodatkowe przeliczenia gruszek."
  );

  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "B"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:30", "10:20"]
  );
  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "C"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["11:25", "11:50"]
  );

  assert.equal(
    pompaB.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    665
  );
  assert.equal(
    pompaC.rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
    665
  );
  assert.equal(pompaC.opoznienieZPowoduPompMinuty, 35);
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.dodatkowePrzesuniecieStartuMinuty,
    25
  );
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.minutaStartuBetonowaniaPrzedKorekta,
    660
  );
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.minutaStartuBetonowaniaPoKorekcie,
    685
  );

  assert.equal(JSON.stringify(stanImportu), zrodloPoTrasach);
  assert.notEqual(zrodloPrzed, zrodloPoTrasach);
}

sprawdzBrakDodatkowejIteracjiDlaStabilnegoPlanu();
sprawdzWielokrotnaIteracjePoKolejnychZmianachPlanu();

console.log(
  "OK — 5E.1 powtarza zależne obliczenia tylko po zmianie planu i obsługuje kolejną korektę kaskady."
);
'''
Path("testy/etap_5e_1.test.js").write_text(test_content, encoding="utf-8")


testy = Path("testy/TESTY_ETAP_5.md")
text = testy.read_text(encoding="utf-8")
text = replace_once(
    text,
    "Punkty **5A–5D** są zakończone. Następny podetap: **5E.1 — deterministyczna iteracja**.",
    "Punkty **5A–5D** oraz podetap **5E.1** są zakończone. Następny podetap: **5E.2 — warunek zakończenia**.",
    "status planu testów",
)
text = replace_once(
    text,
    "- [ ] silnik powtarza zależne obliczenia tylko po zmianie planu;",
    "- [x] silnik powtarza zależne obliczenia tylko po zmianie planu;",
    "checkbox 5E.1",
)
marker = "- [ ] stabilny wynik kończy iterację;"
text = replace_once(
    text,
    marker,
    "Test automatyczny 5E.1: `testy/etap_5e_1.test.js` — stabilny plan wykonuje jeden przydział gruszek, a scenariusz A → B → X → C z jedną pompą i jedną gruszką wymaga trzech przebiegów zależnych oraz kończy z C o `11:25`.\n\n" + marker,
    "opis testu 5E.1",
)
testy.write_text(text, encoding="utf-8")


etapy = Path("ETAPY_ROZWOJU.md")
text = etapy.read_text(encoding="utf-8")
text = replace_once(
    text,
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5E.1**",
    "- [ ] Etap 5 — Pełny silnik harmonogramu, konflikty i korekty — **rozpoczęty; następny podetap 5E.2**",
    "status Etapu 5",
)
text = replace_once(
    text,
    "  - [ ] **5E.1 — deterministyczna iteracja:** powtarzać zależne obliczenia pomp,\n    startów i gruszek tylko wtedy, gdy wynik poprzedniego przebiegu zmienił plan.",
    "  - [x] **5E.1 — deterministyczna iteracja:** powtarzać zależne obliczenia pomp,\n    startów i gruszek tylko wtedy, gdy wynik poprzedniego przebiegu zmienił plan.",
    "checkbox 5E.1",
)
closure_marker = "\n\n## Weryfikacja produkcyjnego KDX — 2026-08-14"
closure = '''

## Zamknięcie 5E.1 — deterministyczna iteracja — 2026-08-30

- [x] zależne fazy kursów, przydziału gruszek i rzeczywistych okien pomp są powtarzane wyłącznie po rzeczywistej zmianie `StartRoboczy`;
- [x] stabilny plan bez korekty nie uruchamia zbędnego drugiego przydziału gruszek;
- [x] scenariusz A → B → X → C potwierdza drugi poziom sprzężenia: po pierwszej korekcie B zwykła budowa X przejmuje jedyną gruszkę i wydłuża rzeczywisty cykl B;
- [x] kolejna iteracja przesuwa C z pośredniego `11:00` do ostatecznego `11:25`, a następny przebieg nie wprowadza już nowej korekty;
- [x] dotychczasowa informacja `korektaPoRzeczywistychDostawach` nie jest kasowana przez końcowy przebieg bez zmiany;
- [x] 5E.1 nie wprowadza jeszcze osobnego limitu liczby iteracji — zabezpieczenie przed niestabilnym przypadkiem pozostaje zakresem 5E.3.

Podetap **5E.1** jest zakończony. Punkt nadrzędny **5E** i cały Etap 5 pozostają otwarte.
Następny niezakończony podetap: **5E.2 — warunek zakończenia**.
'''
if closure.strip() not in text:
    if closure_marker not in text:
        raise SystemExit("Nie znaleziono miejsca na wpis zamknięcia 5E.1")
    text = text.replace(closure_marker, closure + closure_marker, 1)
etapy.write_text(text, encoding="utf-8")


readme = Path("README.md")
text = readme.read_text(encoding="utf-8")
text = replace_once(
    text,
    "Następny krok to **5E.1 — deterministyczna iteracja**.",
    "Podetap **5E.1 — deterministyczna iteracja** jest zakończony: zależne fazy są ponawiane tylko wtedy, gdy poprzedni przebieg zmienił `StartRoboczy`. Test A → B → X → C potwierdza wielokrotną propagację aż do C `11:25`, a plan bez zmiany nie wykonuje zbędnej kolejnej iteracji. Następny krok to **5E.2 — warunek zakończenia**.",
    "README następny krok",
)
readme.write_text(text, encoding="utf-8")


decyzje = Path("PROJECT_DECISIONS.md")
text = decyzje.read_text(encoding="utf-8")
sekcja = '''

---

## 105. Sprzężone fazy są ponawiane tylko po zmianie StartRoboczy

W 5E.1 centralny silnik po rzeczywistych dostawach ponownie generuje kursy,
przydziela gruszki, aktualizuje rzeczywiste okresy pracy pomp i sprawdza dalszą
korektę startów tylko wtedy, gdy poprzedni przebieg rzeczywiście zmienił
`StartRoboczy` co najmniej jednej budowy.

Przebieg bez nowej korekty nie uruchamia kolejnego przydziału gruszek. Dzięki
temu sprzężenie jest deterministyczne i nie wykonuje pustych, zbędnych obliczeń.
Informacja o ostatniej rzeczywistej korekcie budowy pozostaje zachowana także
wtedy, gdy końcowa kontrola nie wymaga już dalszego przesunięcia.

5E.1 nie wprowadza jeszcze osobnego limitu liczby iteracji. Formalny warunek
stabilnego zakończenia jest doprecyzowany w 5E.2, a zabezpieczenie przed
niestabilnym przypadkiem należy do 5E.3.
'''
if "## 105. Sprzężone fazy są ponawiane tylko po zmianie StartRoboczy" not in text:
    text = text.rstrip() + sekcja + "\n"
decyzje.write_text(text, encoding="utf-8")
