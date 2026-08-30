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

function utworzParametry() {
  return {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: 1
  };
}

function utworzStanKaskady(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0",
    "B;Beta;Budowa B;09:20;16;Pompa;0;0",
    "X;Delta;Budowa X;09:40;8;Lej;0;0",
    "C;Gamma;Budowa C;10:50;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(
    csv,
    "etap-5e3-limit.csv"
  );

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5e3" };
  stanImportu.budowy[1].przejazdyPompyMinuty = { C: 0 };
  stanImportu.budowy[1].zrodlaPrzejazdowPompy = { C: "test-5e3" };

  return stanImportu;
}

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function pobierzKonfliktLimitu(wynik) {
  return wynik.konflikty.find(function (konflikt) {
    return konflikt.kod === "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI";
  }) || null;
}

function sprawdzNormalnaStabilizacjeNieUruchamiaOslony() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanKaskady(aplikacja);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry()
  });

  assert.equal(pobierzBudowe(wynik, "C").startRoboczy, "11:25");
  assert.equal(wynik.stabilizacja.status, "stabilny");
  assert.equal(wynik.stabilizacja.czyStabilny, true);
  assert.equal(wynik.stabilizacja.liczbaIteracji, 3);
  assert.equal(wynik.stabilizacja.maksymalnaLiczbaIteracji, 50);
  assert.equal(wynik.stabilizacja.czyPrzekroczonoLimit, false);
  assert.equal(pobierzKonfliktLimitu(wynik), null);
}

function sprawdzLimitZatrzymujeNiestabilnyPrzebiegIKonfliktJestJawny() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanKaskady(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const dane = {
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(),
    maksymalnaLiczbaIteracjiStabilizacji: 2
  };
  const wynikPierwszy = aplikacja.harmonogram.przeliczCalyHarmonogram(dane);
  const wynikDrugi = aplikacja.harmonogram.przeliczCalyHarmonogram(dane);
  const konflikt = pobierzKonfliktLimitu(wynikPierwszy);

  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikPierwszy.stabilizacja)),
    {
      status: "niestabilny",
      czyStabilny: false,
      powodZakonczenia: "limit-iteracji-stabilizacji",
      liczbaIteracji: 2,
      liczbaIteracjiZeZmiana: 2,
      czyPlanZmienilSieWOstatniejIteracji: true,
      maksymalnaLiczbaIteracji: 2,
      czyPrzekroczonoLimit: true
    }
  );
  assert.ok(konflikt, "Przekroczenie limitu musi utworzyć jawny konflikt.");
  assert.equal(konflikt.rodzaj, "stabilizacja");
  assert.equal(konflikt.liczbaIteracji, 2);
  assert.equal(konflikt.maksymalnaLiczbaIteracji, 2);
  assert.match(konflikt.opis, /nie osiągnął stabilności/i);
  assert.equal(
    wynikPierwszy.konflikty.filter(function (pozycja) {
      return pozycja.kod === "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI";
    }).length,
    1,
    "Konflikt limitu nie może być dublowany."
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikDrugi)),
    JSON.parse(JSON.stringify(wynikPierwszy)),
    "Nawet przypadek zatrzymany limitem musi być deterministyczny."
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzNormalnaStabilizacjeNieUruchamiaOslony();
sprawdzLimitZatrzymujeNiestabilnyPrzebiegIKonfliktJestJawny();

console.log(
  "OK — 5E.3 zatrzymuje stabilizację na limicie i zwraca jawny, deterministyczny konflikt."
);
