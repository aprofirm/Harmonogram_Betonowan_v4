"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajPlik(kontekst, sciezka) {
  const kod = fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
  new vm.Script(kod, { filename: sciezka }).runInContext(kontekst);
}

function wczytajSilnik() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  wczytajPlik(kontekst, "js/budowy/budowy.js");
  wczytajPlik(kontekst, "js/gruszki/gruszki.js");
  wczytajPlik(kontekst, "js/gruszki/przydzial_gruszek.js");

  return kontekst.window.HarmonogramBetonowan;
}

function utworzBudowe(idBudowy, startRoboczy, iloscBetonuM3, czasDojazdu, czasPowrotu) {
  return {
    idBudowy: idBudowy,
    startRoboczy: startRoboczy,
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: czasDojazdu,
    czasPowrotuRoboczyMinuty: czasPowrotu,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

const aplikacja = wczytajSilnik();
const parametry = {
  pojemnoscGruszkiM3: 8,
  czasZaladunkuMinuty: 10,
  czasRozladunkuMinuty: 15
};

const budowy = [
  utworzBudowe("A", "09:00", 16, 20, 20),
  utworzBudowe("B", "09:10", 8, 10, 10),
  utworzBudowe("C", "10:00", 8, 15, 15)
];

const wygenerowaneKursy = aplikacja.gruszki.generujKursy(
  budowy,
  parametry.pojemnoscGruszkiM3
);
const kursyZCzasami = aplikacja.gruszki.obliczCzasyKursow(
  wygenerowaneKursy,
  budowy,
  parametry
);
const wynik = aplikacja.gruszki.przydzielGruszkiDoKursow(kursyZCzasami);

assert.deepEqual(
  Array.from(kursyZCzasami, function (kurs) { return kurs.idKursu; }),
  ["A-KURS-001", "A-KURS-002", "B-KURS-001", "C-KURS-001"]
);
assert.deepEqual(
  Array.from(kursyZCzasami, function (kurs) { return kurs.godzinaRozpoczeciaZaladunku; }),
  ["08:30", "08:45", "08:50", "09:35"]
);
assert.deepEqual(
  Array.from(wynik.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2, 3, 1]
);
assert.equal(wynik.gruszki.length, 3);
assert.equal(wynik.kursy[0].minutaGotowosciDoKolejnegoKursu, 575);
assert.equal(wynik.kursy[3].minutaRozpoczeciaZaladunku, 575);
assert.equal(wynik.kursy[3].idGruszki, "GRUSZKA-001");

const kursyWedlugGruszki = new Map();
wynik.kursy.forEach(function (kurs) {
  const lista = kursyWedlugGruszki.get(kurs.idGruszki) || [];
  lista.push(kurs);
  kursyWedlugGruszki.set(kurs.idGruszki, lista);
});

kursyWedlugGruszki.forEach(function (kursyGruszki) {
  for (let indeks = 1; indeks < kursyGruszki.length; indeks += 1) {
    const poprzedni = kursyGruszki[indeks - 1];
    const aktualny = kursyGruszki[indeks];
    assert.ok(
      aktualny.minutaRozpoczeciaZaladunku >= poprzedni.minutaGotowosciDoKolejnegoKursu,
      "Kursy jednej gruszki nie mogą się nakładać."
    );
  }
});

wynik.kursy.forEach(function (kurs) {
  assert.ok(Number.isInteger(kurs.numerGruszki) && kurs.numerGruszki > 0);
  assert.match(kurs.idGruszki, /^GRUSZKA-\d{3}$/);
  assert.equal(kurs.statusKursu, "przydzielony");
});

console.log(
  "✓ Integracja 3B → 3C.2: rzeczywiste kursy z czasami są poprawnie przydzielane do gruszek bez nakładania cykli."
);
