"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  ["js/budowy/budowy.js", "js/gruszki/gruszki.js"].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function utworzBudowe(dane) {
  return Object.assign({
    idBudowy: "B-1",
    firma: "Firma testowa",
    budowa: "Budowa testowa",
    startPlanowany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 24,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: 20,
    czasPowrotuRoboczyMinuty: 20,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  }, dane || {});
}

function oblicz(aplikacja, budowy) {
  const lista = Array.isArray(budowy) ? budowy : [budowy];
  const kursy = aplikacja.gruszki.generujKursy(lista, 8);
  return aplikacja.gruszki.obliczCzasyKursow(kursy, lista, {
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  });
}

function sprawdzModelIWalidacje(aplikacja) {
  const budowa = utworzBudowe();
  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "dodatkowyOdstepDostawMinuty",
    "5"
  );
  assert.equal(budowa.dodatkowyOdstepDostawMinuty, 5);

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "dodatkowyOdstepDostawMinuty",
    ""
  );
  assert.equal(budowa.dodatkowyOdstepDostawMinuty, 0);

  assert.throws(function () {
    aplikacja.budowy.zmienCzasRoboczyBudowy(
      budowa,
      "dodatkowyOdstepDostawMinuty",
      -1
    );
  }, /Dodatkowy odstęp dostaw.*nie mniejszą niż 0/i);

  const starszaBudowa = utworzBudowe();
  delete starszaBudowa.dodatkowyOdstepDostawMinuty;
  aplikacja.budowy.uzupelnijDodatkowyOdstepDostawBudowy(starszaBudowa);
  assert.equal(starszaBudowa.dodatkowyOdstepDostawMinuty, 0);
}

function sprawdzRytmZero(aplikacja) {
  const kursy = oblicz(aplikacja, utworzBudowe());

  assert.deepEqual(
    Array.from(kursy, function (kurs) { return kurs.godzinaRozpoczeciaRozladunku; }),
    ["08:00", "08:15", "08:30"]
  );
  assert.equal(kursy[0].rytmDostawMinuty, 15);
  assert.equal(kursy[0].godzinaRozpoczeciaZaladunku, "07:30");
  assert.equal(kursy[0].godzinaGotowosciDoKolejnegoKursu, "08:35");
}

function sprawdzDodatkowyOdstep(aplikacja) {
  const kursy = oblicz(aplikacja, utworzBudowe({
    dodatkowyOdstepDostawMinuty: 5
  }));

  assert.deepEqual(
    Array.from(kursy, function (kurs) { return kurs.godzinaRozpoczeciaRozladunku; }),
    ["08:00", "08:20", "08:40"]
  );
  assert.equal(kursy[0].rytmDostawMinuty, 20);
  assert.equal(
    kursy[0].godzinaGotowosciDoKolejnegoKursu,
    "08:35",
    "Dodatkowy odstęp nie może wydłużać fizycznego cyklu pierwszej gruszki."
  );
}

function sprawdzRoznyCzasRozladunku(aplikacja) {
  const kursy = oblicz(aplikacja, utworzBudowe({
    iloscBetonuLiczbaM3: 16,
    czasRozladunkuRoboczyMinuty: 20,
    dodatkowyOdstepDostawMinuty: 5
  }));

  assert.equal(kursy[0].rytmDostawMinuty, 25);
  assert.equal(kursy[1].godzinaRozpoczeciaRozladunku, "08:25");
  assert.equal(kursy[0].godzinaZakonczeniaRozladunku, "08:20");
}

function sprawdzWydluzonyZaladunek(aplikacja) {
  const zwykle = oblicz(aplikacja, utworzBudowe({
    iloscBetonuLiczbaM3: 16,
    dodatkowyOdstepDostawMinuty: 5
  }));
  const wydluzone = oblicz(aplikacja, utworzBudowe({
    iloscBetonuLiczbaM3: 16,
    dodatkowyCzasZaladunkuMinuty: 5,
    dodatkowyOdstepDostawMinuty: 5
  }));

  assert.equal(zwykle[0].godzinaRozpoczeciaRozladunku, "08:00");
  assert.equal(wydluzone[0].godzinaRozpoczeciaRozladunku, "08:00");
  assert.equal(zwykle[0].godzinaRozpoczeciaZaladunku, "07:30");
  assert.equal(wydluzone[0].godzinaRozpoczeciaZaladunku, "07:25");
}

function sprawdzPrzeplatanieBudow(aplikacja) {
  const budowaA = utworzBudowe({
    idBudowy: "A",
    iloscBetonuLiczbaM3: 16,
    startRoboczy: "08:00",
    dodatkowyOdstepDostawMinuty: 15
  });
  const budowaB = utworzBudowe({
    idBudowy: "B",
    iloscBetonuLiczbaM3: 16,
    startRoboczy: "08:10",
    czasDojazduRoboczyMinuty: 10,
    czasPowrotuRoboczyMinuty: 10,
    dodatkowyOdstepDostawMinuty: 0
  });
  const kursy = oblicz(aplikacja, [budowaA, budowaB]);

  assert.deepEqual(
    Array.from(kursy, function (kurs) { return kurs.idKursu; }),
    ["A-KURS-001", "B-KURS-001", "A-KURS-002", "B-KURS-002"]
  );
  assert.deepEqual(
    Array.from(kursy, function (kurs) { return kurs.godzinaRozpoczeciaZaladunku; }),
    ["07:30", "07:50", "08:00", "08:05"]
  );
}

function sprawdzBlednyOdstepWObliczeniach(aplikacja) {
  const budowa = utworzBudowe({ dodatkowyOdstepDostawMinuty: -2 });
  const kurs = aplikacja.gruszki.generujKursyDlaBudowy(budowa, 8)[0];

  assert.throws(function () {
    aplikacja.gruszki.obliczCzasyKursu(kurs, budowa, {
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15
    });
  }, /Dodatkowy odstęp dostaw.*nie mniejszą niż 0/i);
}

function sprawdzPamiecIInterfejs() {
  const aplikacjaKod = fs.readFileSync(
    path.join(katalogProjektu, "js/aplikacja.js"),
    "utf8"
  );
  const interfejsKod = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/odstep_dostaw.js"),
    "utf8"
  );

  assert.match(aplikacjaKod, /"dodatkowyOdstepDostawMinuty"/);
  assert.match(interfejsKod, /dodatkowyOdstepDostawMinuty/);
  assert.doesNotMatch(interfejsKod, /Odbiory własne/);
  assert.doesNotMatch(interfejsKod, /rodzajRozladunku/);
}

const aplikacja = wczytajAplikacje();
sprawdzModelIWalidacje(aplikacja);
sprawdzRytmZero(aplikacja);
sprawdzDodatkowyOdstep(aplikacja);
sprawdzRoznyCzasRozladunku(aplikacja);
sprawdzWydluzonyZaladunek(aplikacja);
sprawdzPrzeplatanieBudow(aplikacja);
sprawdzBlednyOdstepWObliczeniach(aplikacja);
sprawdzPamiecIInterfejs();

console.log(
  "✓ Etap 3B.2: rytm, odstęp, różne czasy, przeplatanie, walidacja i pamięć działają poprawnie."
);
