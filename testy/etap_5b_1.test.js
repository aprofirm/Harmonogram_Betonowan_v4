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
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStanImportu(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0",
    "B;Beta;Budowa B;08:10;8;Pompa;0;0",
    "C;Gamma;Budowa C;08:20;8;Pompa;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5b1.csv");
}

function utworzPompe() {
  return {
    idPompy: "P-1",
    nazwa: "Pompa 1",
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "07:00",
    wysiegMetry: 32
  };
}

function pobierzPrzejazdZero() {
  return {
    czasPrzejazduMinuty: 0,
    zrodloCzasuPrzejazdu: "test-5b1"
  };
}

function sprawdzZastosowanieStartuPompy() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [utworzPompe()],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 1,
      trybGruszek: "oblicz-potrzebne"
    },
    opcjePomp: {
      pobierzDanePrzejazdu: pobierzPrzejazdZero
    }
  });

  assert.deepEqual(
    Array.from(wynik.budowy, function (budowa) {
      return budowa.startRoboczy;
    }),
    ["08:00", "09:05", "10:10"]
  );
  assert.deepEqual(
    Array.from(wynik.budowy, function (budowa) {
      return budowa.startPlanowany;
    }),
    ["08:00", "08:10", "08:20"]
  );
  assert.deepEqual(
    Array.from(wynik.budowy, function (budowa) {
      return budowa.startZadany;
    }),
    ["08:00", "08:10", "08:20"]
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);

  // Od 5C.1 końcowe kursy są tworzone ponownie z aktualnych StartRoboczy.
  assert.deepEqual(
    Array.from(wynik.kursy, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["08:00", "09:05", "10:10"]
  );
}

function sprawdzBrakPrzesunieciaBezOgraniczenia() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    parametry: {
      trybPomp: "oblicz-potrzebne",
      trybGruszek: "oblicz-potrzebne"
    }
  });

  assert.deepEqual(
    Array.from(wynik.budowy, function (budowa) {
      return budowa.startRoboczy;
    }),
    ["08:00", "08:10", "08:20"]
  );
}

sprawdzZastosowanieStartuPompy();
sprawdzBrakPrzesunieciaBezOgraniczenia();

console.log(
  "OK — 5B.1 stosuje możliwy start pompy wyłącznie do StartRoboczy."
);
