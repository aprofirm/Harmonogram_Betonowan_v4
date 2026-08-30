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
    "A;Alfa;Budowa A;08:00;8;Lej;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5f1.csv");
}

function przelicz(aplikacja, stanImportu, parametry) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    parametry: parametry
  });
}

function sprawdzDomyslnyLimit() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);

  assert.equal(
    aplikacja.konfiguracja.parametryDomyslne.maksymalneOpoznienieStartuMinuty,
    30,
    "Domyślny globalny limit ma pochodzić z konfiguracji i wynosić 30 min."
  );

  const wynik = przelicz(aplikacja, stanImportu);

  assert.equal(wynik.parametry.maksymalneOpoznienieStartuMinuty, 30);
}

function sprawdzGlobalneNadpisanieBezZmianyDomyslnejKonfiguracji() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const wynik = przelicz(aplikacja, stanImportu, {
    maksymalneOpoznienieStartuMinuty: 45
  });

  assert.equal(wynik.parametry.maksymalneOpoznienieStartuMinuty, 45);
  assert.equal(
    aplikacja.konfiguracja.parametryDomyslne.maksymalneOpoznienieStartuMinuty,
    30,
    "Nadpisanie dla jednego przebiegu nie może zmieniać konfiguracji domyślnej."
  );
}

function sprawdzWalidacjeBezposredniegoWejsciaSilnika() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);

  assert.throws(
    function () {
      przelicz(aplikacja, stanImportu, {
        maksymalneOpoznienieStartuMinuty: -1
      });
    },
    /Maksymalne opóźnienie startu musi być liczbą nie mniejszą niż 0\./
  );

  assert.throws(
    function () {
      przelicz(aplikacja, stanImportu, {
        maksymalneOpoznienieStartuMinuty: "nie-liczba"
      });
    },
    /Maksymalne opóźnienie startu musi być liczbą nie mniejszą niż 0\./
  );
}

sprawdzDomyslnyLimit();
sprawdzGlobalneNadpisanieBezZmianyDomyslnejKonfiguracji();
sprawdzWalidacjeBezposredniegoWejsciaSilnika();

console.log(
  "OK — 5F.1 używa globalnego limitu 30 min z konfiguracji, pozwala go nadpisać i waliduje wejście silnika."
);
