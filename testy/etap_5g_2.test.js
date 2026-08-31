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
    "A;Alfa;Budowa A;08:00;24;Lej;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5g2.csv");
}

function przelicz(aplikacja, stanImportu, nadpisanieParametrow) {
  const parametry = Object.assign({
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 0,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: 1
  }, nadpisanieParametrow || {});

  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [],
    parametry: parametry
  });
}

function pobierzAnalizeBudowy(wynik) {
  assert.equal(wynik.budowy.length, 1);
  return wynik.budowy[0].analizaPrzestojowBetonowania;
}

function sprawdzDomyslnyParametr() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const wynik = przelicz(aplikacja, stanImportu);

  assert.equal(
    aplikacja.konfiguracja.parametryDomyslne.maksymalnyPrzestojMinuty,
    15,
    "Domyślny maksymalny przestój ma pochodzić z konfiguracji."
  );
  assert.equal(
    wynik.parametry.maksymalnyPrzestojMinuty,
    15,
    "Skuteczny limit powinien być jawny w wyniku bieżącego przeliczenia."
  );
  assert.equal(pobierzAnalizeBudowy(wynik).najdluzszyPrzestojMinuty, 10);
}

function sprawdzNadpisanieBezZmianyKonfiguracji() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const nadpisanie = { maksymalnyPrzestojMinuty: "20" };
  const wynik = przelicz(aplikacja, stanImportu, nadpisanie);

  assert.equal(
    wynik.parametry.maksymalnyPrzestojMinuty,
    20,
    "Silnik powinien normalizować poprawną wartość liczbową."
  );
  assert.equal(
    nadpisanie.maksymalnyPrzestojMinuty,
    "20",
    "Normalizacja nie może mutować parametrów wejściowych."
  );
  assert.equal(
    aplikacja.konfiguracja.parametryDomyslne.maksymalnyPrzestojMinuty,
    15,
    "Nadpisanie jednego przebiegu nie może zmieniać wartości domyślnej."
  );

  const wynikZerowegoLimitu = przelicz(aplikacja, stanImportu, {
    maksymalnyPrzestojMinuty: 0
  });
  assert.equal(wynikZerowegoLimitu.parametry.maksymalnyPrzestojMinuty, 0);
  assert.equal(pobierzAnalizeBudowy(wynikZerowegoLimitu).liczbaPrzestojow, 2);
  assert.equal(
    wynikZerowegoLimitu.konflikty.some(function (konflikt) {
      return konflikt.rodzaj === "przestoj-betonowania";
    }),
    false,
    "Sam moduł 5G.2 przechowuje limit; klasyfikację dodaje osobny moduł 5G.3."
  );
}

function sprawdzWalidacjeBezposredniegoWejsciaSilnika() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const bledneWartosci = [-1, "nie-liczba", Number.POSITIVE_INFINITY];

  bledneWartosci.forEach(function (blednaWartosc) {
    assert.throws(
      function () {
        przelicz(aplikacja, stanImportu, {
          maksymalnyPrzestojMinuty: blednaWartosc
        });
      },
      /Maksymalny przestój musi być liczbą nie mniejszą niż 0\./
    );
  });
}

sprawdzDomyslnyParametr();
sprawdzNadpisanieBezZmianyKonfiguracji();
sprawdzWalidacjeBezposredniegoWejsciaSilnika();

assert.match(wczytajAplikacje().konfiguracja.punktEtapu, /^5J\.[1-3]$/);

console.log(
  "OK — 5G.2 nadal niezależnie przechowuje, normalizuje i waliduje limit przestoju 15 min."
);
