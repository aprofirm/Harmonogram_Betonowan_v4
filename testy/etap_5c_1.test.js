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
    "B;Beta;Budowa B;08:10;24;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(
    csv,
    "etap-5c1.csv"
  );

  stanImportu.budowy[1].dodatkowyOdstepDostawMinuty = 5;
  return stanImportu;
}

function przelicz(aplikacja, stanImportu) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [{
      idPompy: "P-1",
      nazwa: "Pompa 1",
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: 32
    }],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 1,
      trybGruszek: "oblicz-potrzebne"
    },
    opcjePomp: {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 0,
          zrodloCzasuPrzejazdu: "test-5c1"
        };
      }
    }
  });
}

function sprawdzNoweKursyOdStartuRoboczego() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynik = przelicz(aplikacja, stanImportu);
  const budowaB = wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === "B";
  });
  const kursyBudowyB = wynik.kursy.filter(function (kurs) {
    return kurs.idBudowy === "B";
  });

  assert.equal(budowaB.startPlanowany, "08:10");
  assert.equal(budowaB.startZadany, "08:10");
  assert.equal(budowaB.startRoboczy, "09:05");
  assert.equal(
    budowaB.jawnySkutekPompy.przesuniecieStartuMinuty,
    55
  );
  assert.deepEqual(
    Array.from(kursyBudowyB, function (kurs) {
      return kurs.idKursu;
    }),
    ["B-KURS-001", "B-KURS-002", "B-KURS-003"]
  );
  assert.deepEqual(
    Array.from(kursyBudowyB, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:05", "09:25", "09:45"]
  );
  assert.deepEqual(
    Array.from(kursyBudowyB, function (kurs) {
      return kurs.minutaRozpoczeciaZaladunku;
    }),
    [535, 555, 575]
  );
  assert.deepEqual(
    Array.from(kursyBudowyB, function (kurs) {
      return kurs.minutaRozpoczeciaRozladunku;
    }),
    [545, 565, 585]
  );
  assert.deepEqual(
    Array.from(kursyBudowyB, function (kurs) {
      return kurs.minutaZakonczeniaRozladunku;
    }),
    [560, 580, 600]
  );
  assert.equal(kursyBudowyB[0].rytmDostawMinuty, 20);
  assert.equal(kursyBudowyB[0].calkowityCzasZaladunkuMinuty, 10);
  assert.equal(kursyBudowyB[0].calkowityCzasRozladunkuMinuty, 15);
  assert.deepEqual(
    Array.from(kursyBudowyB, function (kurs) {
      return {
        zaladunek: kurs.godzinaRozpoczeciaZaladunku,
        wyjazd: kurs.godzinaWyjazduZBetoniarni,
        rozladunek: kurs.godzinaRozpoczeciaRozladunku,
        koniecRozladunku: kurs.godzinaZakonczeniaRozladunku,
        powrot: kurs.godzinaPowrotuDoBetoniarni,
        gotowosc: kurs.godzinaGotowosciDoKolejnegoKursu
      };
    }),
    [
      {
        zaladunek: "08:55",
        wyjazd: "09:05",
        rozladunek: "09:05",
        koniecRozladunku: "09:20",
        powrot: "09:20",
        gotowosc: "09:20"
      },
      {
        zaladunek: "09:15",
        wyjazd: "09:25",
        rozladunek: "09:25",
        koniecRozladunku: "09:40",
        powrot: "09:40",
        gotowosc: "09:40"
      },
      {
        zaladunek: "09:35",
        wyjazd: "09:45",
        rozladunek: "09:45",
        koniecRozladunku: "10:00",
        powrot: "10:00",
        gotowosc: "10:00"
      }
    ]
  );
  assert.equal(
    kursyBudowyB.some(function (kurs) {
      return ["08:10", "08:30", "08:50"].includes(
        kurs.godzinaRozpoczeciaRozladunku
      );
    }),
    false
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzNoweKursyOdStartuRoboczego();

console.log(
  "OK — 5C.1 tworzy wszystkie kursy od StartRoboczy po przesunięciu pompą."
);
