"use strict";

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
    "js/harmonogram/konflikty_przestojow.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStanImportu(aplikacja, iloscBetonuM3) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;" + iloscBetonuM3 + ";Lej;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5g3.csv");
}

function przelicz(aplikacja, stanImportu, czasZaladunkuMinuty, liczbaGruszek) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: czasZaladunkuMinuty,
      czasRozladunkuMinuty: 15,
      maksymalnyPrzestojMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 0,
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: liczbaGruszek
    }
  });
}

function pobierzKonfliktyPrzestoju(wynik) {
  return wynik.konflikty.filter(function (konflikt) {
    return konflikt.rodzaj === "przestoj-betonowania";
  });
}

function sprawdzGraniceLimitu() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja, 24);
  const wynik = przelicz(aplikacja, stanImportu, 15, 1);
  const analiza = wynik.budowy[0].analizaPrzestojowBetonowania;

  assert.deepEqual(
    Array.from(analiza.przerwyMiedzyDostawami, function (przerwa) {
      return przerwa.przestojMinuty;
    }),
    [15, 15],
    "Scenariusz graniczny powinien mieć dwie przerwy dokładnie po 15 min."
  );
  assert.equal(
    pobierzKonfliktyPrzestoju(wynik).length,
    0,
    "Przerwa równa limitowi 15 min nie może tworzyć konfliktu."
  );
}

function sprawdzPierwszePrzekroczenieIWielePar() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja, 24);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynik = przelicz(aplikacja, stanImportu, 16, 1);
  const konflikty = pobierzKonfliktyPrzestoju(wynik);

  assert.equal(konflikty.length, 2, "Każda problematyczna para ma mieć własny konflikt.");
  assert.deepEqual(
    JSON.parse(JSON.stringify(konflikty[0])),
    {
      kod: "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA",
      rodzaj: "przestoj-betonowania",
      idBudowy: "A",
      nazwaBudowy: "Budowa A",
      idPoprzedniegoKursu: "A-KURS-001",
      numerPoprzedniegoKursu: 1,
      idNastepnegoKursu: "A-KURS-002",
      numerNastepnegoKursu: 2,
      minutaZakonczeniaPoprzedniegoRozladunku: 495,
      godzinaZakonczeniaPoprzedniegoRozladunku: "08:15",
      minutaRozpoczeciaNastepnegoRozladunku: 511,
      godzinaRozpoczeciaNastepnegoRozladunku: "08:31",
      przestojMinuty: 16,
      maksymalnyPrzestojMinuty: 15,
      przekroczenieLimituMinuty: 1,
      opis: "Budowa „Budowa A” ma przerwę 16 min między końcem rozładunku kursu 1 o 08:15 a początkiem rozładunku kursu 2 o 08:31. Dopuszczalny limit 15 min został przekroczony o 1 min."
    },
    "Konflikt powinien wskazywać dokładną parę, godziny, limit i przekroczenie."
  );
  assert.equal(konflikty[1].idPoprzedniegoKursu, "A-KURS-002");
  assert.equal(konflikty[1].idNastepnegoKursu, "A-KURS-003");
  assert.equal(konflikty[1].godzinaZakonczeniaPoprzedniegoRozladunku, "08:46");
  assert.equal(konflikty[1].godzinaRozpoczeciaNastepnegoRozladunku, "09:02");
  assert.equal(konflikty[1].przestojMinuty, 16);
  assert.equal(konflikty[1].przekroczenieLimituMinuty, 1);
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed, "5G.3 nie może mutować źródła.");

  const wynikPowtorny = przelicz(aplikacja, stanImportu, 16, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(pobierzKonfliktyPrzestoju(wynikPowtorny))),
    JSON.parse(JSON.stringify(konflikty)),
    "Identyczne dane powinny dawać identyczne konflikty przestoju."
  );
}

function sprawdzBrakFikcyjnychKonfliktow() {
  const aplikacja = wczytajAplikacje();
  const jednaDostawa = utworzStanImportu(aplikacja, 8);
  const bezGruszek = utworzStanImportu(aplikacja, 24);

  assert.equal(
    pobierzKonfliktyPrzestoju(przelicz(aplikacja, jednaDostawa, 60, 1)).length,
    0,
    "Pierwsza i jedyna dostawa nie ma poprzednika, więc nie tworzy konfliktu."
  );
  assert.equal(
    pobierzKonfliktyPrzestoju(przelicz(aplikacja, bezGruszek, 16, 0)).length,
    0,
    "Kursy nieprzydzielone nie mogą tworzyć konfliktu ciągłości."
  );
}

sprawdzGraniceLimitu();
sprawdzPierwszePrzekroczenieIWielePar();
sprawdzBrakFikcyjnychKonfliktow();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5H.3");

console.log(
  "OK — 5G.3 zgłasza osobny konflikt dla każdej rzeczywistej pary dostaw przekraczającej limit i zachowuje granicę 15 min."
);
