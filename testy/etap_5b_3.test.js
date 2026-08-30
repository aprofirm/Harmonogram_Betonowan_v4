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

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5b3.csv");
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
          zrodloCzasuPrzejazdu: "test-5b3"
        };
      }
    }
  });
}

function sprawdzPropagacjeISprawnoscPonownegoPrzeliczenia() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const pierwszyWynik = przelicz(aplikacja, stanImportu);
  const pierwszyWynikPrzedZmiana = JSON.stringify(pierwszyWynik);

  assert.deepEqual(
    Array.from(pierwszyWynik.budowy, function (budowa) {
      return budowa.startRoboczy;
    }),
    ["08:00", "09:05", "10:10"]
  );
  assert.deepEqual(
    Array.from(pierwszyWynik.budowy, function (budowa) {
      return budowa.jawnySkutekPompy.przesuniecieStartuMinuty;
    }),
    [0, 55, 110]
  );
  assert.deepEqual(
    Array.from(pierwszyWynik.budowy, function (budowa) {
      return budowa.jawnySkutekPompy.przyczyna;
    }),
    [null, "pompa-zajeta", "pompa-zajeta"]
  );
  assert.deepEqual(
    Array.from(pierwszyWynik.budowy, function (budowa) {
      return budowa.jawnySkutekPompy.przydzielonaPompa.idPompy;
    }),
    ["P-1", "P-1", "P-1"]
  );
  assert.equal(
    pierwszyWynik.budowy[1].jawnySkutekPompy.przyczynyOgraniczenia
      .some(function (przyczyna) {
        return przyczyna.rodzaj === "pompa-zajeta";
      }),
    true
  );
  assert.notEqual(
    pierwszyWynik.budowy[1].jawnySkutekPompy,
    pierwszyWynik.pompy.wynikiBudow[1].jawnySkutekPompy
  );
  assert.notEqual(
    pierwszyWynik.budowy[1].jawnySkutekPompy.przyczynyOgraniczenia,
    pierwszyWynik.pompy.wynikiBudow[1].jawnySkutekPompy
      .przyczynyOgraniczenia
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      stanImportu.budowy[0],
      "jawnySkutekPompy"
    ),
    false
  );

  pierwszyWynik.budowy[0].jawnySkutekPompy.przesuniecieStartuMinuty = 999;
  pierwszyWynik.budowy[1].jawnySkutekPompy.przyczyna = "stary-wynik";
  pierwszyWynik.budowy[2].jawnySkutekPompy.przyczynyOgraniczenia.push({
    rodzaj: "stare-ograniczenie"
  });

  const drugiWynik = przelicz(aplikacja, stanImportu);

  assert.equal(JSON.stringify(drugiWynik), pierwszyWynikPrzedZmiana);
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzPropagacjeISprawnoscPonownegoPrzeliczenia();

console.log(
  "OK — 5B.3 zachowuje skutek pompy przy budowie i przelicza go od nowa."
);
