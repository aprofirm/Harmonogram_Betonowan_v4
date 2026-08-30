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

function utworzStan(aplikacja, wiersze) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu"
  ].concat(wiersze).join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5b2.csv");
}

function utworzPompe(dane) {
  return Object.assign({
    idPompy: "P-1",
    nazwa: "Pompa 1",
    aktywna: true,
    dostepnaOd: "07:00",
    dostepnaDo: null,
    wysiegMetry: 32
  }, dane || {});
}

function przelicz(aplikacja, stanImportu, listaPomp, liczbaPomp, opcjePomp) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: listaPomp,
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: liczbaPomp,
      trybGruszek: "oblicz-potrzebne"
    },
    opcjePomp: opcjePomp || {}
  });
}

function pobierzKonfliktPompy(wynik, idBudowy) {
  return wynik.konflikty.find(function (konflikt) {
    return konflikt.rodzaj === "pompy" && konflikt.idBudowy === idBudowy;
  });
}

function sprawdzBrakDostepnejPompy() {
  const aplikacja = wczytajAplikacje();
  const stan = utworzStan(aplikacja, [
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0"
  ]);
  const wynik = przelicz(aplikacja, stan, [utworzPompe()], 0);
  const konflikt = pobierzKonfliktPompy(wynik, "A");

  assert.equal(konflikt.kod, "BRAK_MOZLIWEJ_POMPY");
  assert.equal(konflikt.przyczyna, "brak-dostepnych-pomp");
  assert.match(konflikt.opis, /brak dostępnej pompy/i);
  assert.equal(konflikt.minutaMozliwegoStartuBetonowania, null);
  assert.equal(wynik.budowy[0].startRoboczy, "08:00");
}

function sprawdzNiewystarczajacyWysieg() {
  const aplikacja = wczytajAplikacje();
  const stan = utworzStan(aplikacja, [
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0"
  ]);
  stan.budowy[0].wymaganyWysiegPompyMetry = 42;
  const wynik = przelicz(aplikacja, stan, [utworzPompe()], 1);
  const konflikt = pobierzKonfliktPompy(wynik, "A");

  assert.equal(konflikt.przyczyna, "niewystarczajacy-wysieg");
  assert.match(konflikt.opis, /wymaganego wysięgu/i);
  assert.equal(wynik.budowy[0].startRoboczy, "08:00");
}

function sprawdzBrakTrasy() {
  const aplikacja = wczytajAplikacje();
  const stan = utworzStan(aplikacja, [
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0",
    "B;Beta;Budowa B;09:00;8;Pompa;0;0"
  ]);
  const wynik = przelicz(aplikacja, stan, [utworzPompe()], 1);
  const konflikt = pobierzKonfliktPompy(wynik, "B");

  assert.equal(konflikt.przyczyna, "brak-trasy");
  assert.match(konflikt.opis, /brak czasu przejazdu/i);
  assert.equal(wynik.budowy[1].startRoboczy, "09:00");
}

function sprawdzKoniecDostepnosci() {
  const aplikacja = wczytajAplikacje();
  const stan = utworzStan(aplikacja, [
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0"
  ]);
  const wynik = przelicz(
    aplikacja,
    stan,
    [utworzPompe({ dostepnaDo: "07:30" })],
    1
  );
  const konflikt = pobierzKonfliktPompy(wynik, "A");

  assert.equal(konflikt.przyczyna, "po-dostepnosci");
  assert.match(konflikt.opis, /nie jest dostępna/i);
  assert.equal(wynik.budowy[0].startRoboczy, "08:00");
}

sprawdzBrakDostepnejPompy();
sprawdzNiewystarczajacyWysieg();
sprawdzBrakTrasy();
sprawdzKoniecDostepnosci();

console.log(
  "OK — 5B.2 tworzy jawny konflikt bez wymyślania godziny pompy."
);
