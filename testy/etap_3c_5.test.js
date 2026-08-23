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
  czasPowrotuMinuty,
  statusRealizacji
) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: startRoboczy,
    startRoboczy: startRoboczy,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: statusRealizacji || "do-realizacji",
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

function pobierzSkrotPrzydzialu(kursy) {
  return kursy.map(function (kurs) {
    return [
      kurs.idKursu,
      kurs.idGruszki,
      kurs.numerGruszki,
      kurs.minutaRozpoczeciaZaladunku,
      kurs.minutaGotowosciDoKolejnegoKursu
    ].join("|");
  });
}

function sprawdzBrakNakladania(kursy) {
  const kursyWedlugGruszki = new Map();

  kursy.forEach(function (kurs) {
    const lista = kursyWedlugGruszki.get(kurs.idGruszki) || [];
    lista.push(kurs);
    kursyWedlugGruszki.set(kurs.idGruszki, lista);
  });

  kursyWedlugGruszki.forEach(function (kursyGruszki, idGruszki) {
    kursyGruszki.sort(function (lewy, prawy) {
      return lewy.minutaRozpoczeciaZaladunku - prawy.minutaRozpoczeciaZaladunku;
    });

    for (let indeksKursu = 1; indeksKursu < kursyGruszki.length; indeksKursu += 1) {
      const poprzedniKurs = kursyGruszki[indeksKursu - 1];
      const aktualnyKurs = kursyGruszki[indeksKursu];

      assert.ok(
        aktualnyKurs.minutaRozpoczeciaZaladunku >=
          poprzedniKurs.minutaGotowosciDoKolejnegoKursu,
        idGruszki + " ma nakładające się kursy " +
          poprzedniKurs.idKursu + " i " + aktualnyKurs.idKursu + "."
      );
    }
  });
}

const aplikacja = wczytajAplikacje();

const pustyWynik = przelicz(aplikacja, []);
assert.equal(pustyWynik.kursy.length, 0);
assert.equal(pustyWynik.gruszki.dostepneGruszki.length, 0);
assert.equal(pustyWynik.gruszki.przydzieloneKursy.length, 0);

const wynikBezKursow = przelicz(aplikacja, [
  utworzBudowe("ZERO", "08:00", 0, 10, 10),
  utworzBudowe("GOTOWA", "08:30", 8, 10, 10, "zrealizowana")
]);
assert.equal(wynikBezKursow.kursy.length, 0);
assert.equal(wynikBezKursow.gruszki.dostepneGruszki.length, 0);

const wieleBudow = [
  utworzBudowe("A", "09:00", 16, 20, 20),
  utworzBudowe("B", "09:00", 8, 20, 20),
  utworzBudowe("C", "09:15", 16, 15, 15),
  utworzBudowe("D", "10:00", 8, 15, 15)
];

const pierwszyWynik = przelicz(aplikacja, wieleBudow);
const drugiWynik = przelicz(aplikacja, wieleBudow);

assert.equal(pierwszyWynik.kursy.length, 6);
assert.deepEqual(
  Array.from(pierwszyWynik.kursy, function (kurs) { return kurs.idKursu; }),
  [
    "A-KURS-001",
    "B-KURS-001",
    "A-KURS-002",
    "C-KURS-001",
    "C-KURS-002",
    "D-KURS-001"
  ]
);
assert.deepEqual(
  Array.from(pierwszyWynik.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2, 3, 4, 5, 1]
);
assert.equal(pierwszyWynik.gruszki.dostepneGruszki.length, 5);

const pierwszyKurs = pierwszyWynik.kursy[0];
const jednoczesnyKurs = pierwszyWynik.kursy[1];
const kursNaGranicyPowrotu = pierwszyWynik.kursy[5];

assert.equal(pierwszyKurs.minutaRozpoczeciaZaladunku, 510);
assert.equal(jednoczesnyKurs.minutaRozpoczeciaZaladunku, 510);
assert.equal(pierwszyKurs.idGruszki, "GRUSZKA-001");
assert.equal(jednoczesnyKurs.idGruszki, "GRUSZKA-002");
assert.equal(pierwszyKurs.minutaGotowosciDoKolejnegoKursu, 575);
assert.equal(kursNaGranicyPowrotu.minutaRozpoczeciaZaladunku, 575);
assert.equal(kursNaGranicyPowrotu.idGruszki, "GRUSZKA-001");

assert.deepEqual(
  Array.from(pobierzSkrotPrzydzialu(drugiWynik.kursy)),
  Array.from(pobierzSkrotPrzydzialu(pierwszyWynik.kursy))
);

sprawdzBrakNakladania(pierwszyWynik.kursy);
sprawdzBrakNakladania(drugiWynik.kursy);

pierwszyWynik.kursy.forEach(function (kurs) {
  assert.equal(kurs.statusKursu, "przydzielony");
  assert.match(kurs.idGruszki, /^GRUSZKA-\d{3}$/);
  assert.ok(Number.isInteger(kurs.numerGruszki) && kurs.numerGruszki > 0);
  assert.ok(
    kurs.minutaGotowosciDoKolejnegoKursu > kurs.minutaRozpoczeciaZaladunku
  );
});

console.log(
  "✓ Etap 3C.5: integracja wielu budów, granice cykli i stabilny przydział gruszek działają poprawnie."
);
