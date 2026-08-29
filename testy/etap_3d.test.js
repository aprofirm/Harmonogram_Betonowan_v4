"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    console: console
  };

  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/import/import_csv.js",
    "js/budowy/budowy.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
    vm.runInContext(kod, kontekst, { filename: sciezka });
  });

  return kontekst.window.HarmonogramBetonowan;
}

function przelicz(aplikacja, budowy) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    parametry: aplikacja.konfiguracja.parametryDomyslne,
    stanImportu: {
      budowy: budowy || []
    },
    budowyReczne: []
  });
}

function utworzBudowe(idBudowy, startPlanowany, iloscBetonuM3) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: startPlanowany,
    startRoboczy: startPlanowany,
    iloscBetonuM3: iloscBetonuM3,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: "NIEZREALIZOWANE",
    czasDojazduRoboczyMinuty: 20,
    czasPowrotuRoboczyMinuty: 20,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: 15,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

function utworzKurs(idKursu, minutaPoczatku, czasCykluMinuty) {
  return {
    idKursu: idKursu,
    minutaRozpoczeciaZaladunku: minutaPoczatku,
    calkowityCzasZaladunkuMinuty: czasCykluMinuty,
    czasDojazduMinuty: 0,
    calkowityCzasRozladunkuMinuty: 0,
    czasPowrotuMinuty: 0
  };
}

const aplikacja = wczytajAplikacje();

const pustyWynik = przelicz(aplikacja, []);
assert.match(pustyWynik.punktEtapu, /^4[A-Z](?:\.\d+)+$/);
assert.equal(pustyWynik.minimalnaLiczbaGruszek, 0);
assert.equal(pustyWynik.gruszki.minimalnaLiczbaGruszek, 0);

const wynikSekwencyjny = aplikacja.gruszki.przydzielGruszkiDoKursow([
  utworzKurs("KURS-001", 0, 30),
  utworzKurs("KURS-002", 30, 30),
  utworzKurs("KURS-003", 60, 30)
]);
assert.equal(wynikSekwencyjny.minimalnaLiczbaGruszek, 1);

const wynikNakladajacy = aplikacja.gruszki.przydzielGruszkiDoKursow([
  utworzKurs("KURS-001", 0, 60),
  utworzKurs("KURS-002", 15, 60),
  utworzKurs("KURS-003", 30, 60)
]);
assert.equal(wynikNakladajacy.minimalnaLiczbaGruszek, 3);
assert.deepEqual(
  Array.from(wynikNakladajacy.kursy, function (kurs) {
    return kurs.numerGruszki;
  }),
  [1, 2, 3]
);

const wynikPlanowy = przelicz(aplikacja, [
  utworzBudowe("BUD-001", "08:00", 24)
]);
assert.equal(wynikPlanowy.minimalnaLiczbaGruszek, 3);
assert.equal(wynikPlanowy.gruszki.minimalnaLiczbaGruszek, 3);
assert.deepEqual(
  Array.from(wynikPlanowy.kursy, function (kurs) {
    return kurs.numerGruszki;
  }),
  [1, 2, 3]
);

console.log(
  "✓ Etap 3D: minimalna liczba gruszek jest liczona i zwracana przez pełne przeliczenie."
);
