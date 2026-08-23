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

function utworzBudowe(
  idBudowy,
  startRoboczy,
  iloscBetonuM3,
  czasDojazduMinuty,
  czasPowrotuMinuty
) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: startRoboczy,
    startRoboczy: startRoboczy,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: czasDojazduMinuty,
    czasPowrotuRoboczyMinuty: czasPowrotuMinuty,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

function przelicz(aplikacja, budowy) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: budowy },
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15
    }
  });
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
assert.equal(pustyWynik.punktEtapu, "3D.4");
assert.equal(pustyWynik.minimalnaLiczbaGruszek, 0);
assert.equal(pustyWynik.gruszki.minimalnaLiczbaGruszek, 0);

const wynikSekwencyjny = aplikacja.gruszki.przydzielGruszkiDoKursow([
  utworzKurs("KURS-001", 0, 30),
  utworzKurs("KURS-002", 30, 30),
  utworzKurs("KURS-003", 60, 30)
]);
assert.equal(wynikSekwencyjny.minimalnaLiczbaGruszek, 1);

const wieleBudow = [
  utworzBudowe("A", "09:00", 16, 20, 20),
  utworzBudowe("B", "09:00", 8, 20, 20),
  utworzBudowe("C", "09:15", 16, 15, 15),
  utworzBudowe("D", "10:00", 8, 15, 15)
];
const wynikWieluBudow = przelicz(aplikacja, wieleBudow);

assert.equal(wynikWieluBudow.kursy.length, 6);
assert.equal(wynikWieluBudow.minimalnaLiczbaGruszek, 5);
assert.equal(wynikWieluBudow.gruszki.minimalnaLiczbaGruszek, 5);
assert.equal(wynikWieluBudow.gruszki.dostepneGruszki.length, 5);
assert.match(
  wynikWieluBudow.komunikaty[0],
  /Minimalna liczba gruszek potrzebna do realizacji bez nakładania kursów: 5\./
);

const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
const interfejs = fs.readFileSync(
  path.join(katalogProjektu, "js/interfejs/interfejs.js"),
  "utf8"
);

assert.match(html, /id="minimalna-liczba-gruszek">0<\/span>/);
assert.match(html, /potrzebnych gruszek/i);
assert.match(html, /Etap 3D\.4/);
assert.match(interfejs, /wynik\.minimalnaLiczbaGruszek/);
assert.match(
  interfejs,
  /elementy\.minimalnaLiczbaGruszek\.textContent = "0";/
);

console.log(
  "✓ Etap 3D: minimalna liczba gruszek jest obliczana, zwracana i pokazywana operatorowi."
);
