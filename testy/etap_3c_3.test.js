"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const plikiLogiki = [
  "js/konfiguracja/konfiguracja.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/gruszki/przydzial_gruszek.js",
  "js/lokalizacje/lokalizacje.js",
  "js/harmonogram/harmonogram.js"
];

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  plikiLogiki.forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function utworzBudowe(idBudowy, startRoboczy, iloscBetonuM3, dojazd, powrot) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: startRoboczy,
    startRoboczy: startRoboczy,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: dojazd,
    czasPowrotuRoboczyMinuty: powrot,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

const aplikacja = wczytajAplikacje();
const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
  stanImportu: {
    budowy: [
      utworzBudowe("A", "09:00", 16, 20, 20),
      utworzBudowe("B", "09:10", 8, 10, 10),
      utworzBudowe("C", "10:00", 8, 15, 15)
    ]
  },
  parametry: {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  }
});

assert.equal(wynik.kursy.length, 4);
assert.deepEqual(
  Array.from(wynik.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2, 3, 1]
);
assert.equal(wynik.gruszki.dostepneGruszki.length, 3);
assert.equal(wynik.gruszki.minimalnaLiczbaGruszek, 3);
assert.equal(wynik.minimalnaLiczbaGruszek, 3);
assert.equal(wynik.gruszki.przydzieloneKursy.length, wynik.kursy.length);
assert.equal(wynik.gruszki.przydzieloneKursy[0].idKursu, wynik.kursy[0].idKursu);
assert.equal(wynik.kursy[3].idGruszki, "GRUSZKA-001");
assert.equal(wynik.kursy[3].minutaRozpoczeciaZaladunku, 575);
assert.equal(wynik.kursy[0].minutaGotowosciDoKolejnegoKursu, 575);
assert.match(wynik.komunikaty[0], /Minimalna liczba gruszek[^:]*: 3/i);

wynik.kursy.forEach(function (kurs) {
  assert.equal(kurs.statusKursu, "przydzielony");
  assert.ok(kurs.idGruszki);
  assert.ok(Number.isInteger(kurs.numerGruszki));
});

console.log(
  "✓ Etap 3C.3: centralne przeliczenie zwraca kursy z przydziałem gruszek i wspólnym stanem pojazdów."
);
