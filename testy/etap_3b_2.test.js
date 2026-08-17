"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const srodowisko = {
    console: console
  };
  srodowisko.window = srodowisko;
  vm.createContext(srodowisko);

  const kodModulu = fs.readFileSync(
    path.join(katalogProjektu, "js/budowy/budowy.js"),
    "utf8"
  );
  vm.runInContext(kodModulu, srodowisko, {
    filename: "js/budowy/budowy.js"
  });
  return srodowisko.HarmonogramBetonowan;
}

function utworzBudoweZImportu(aplikacja) {
  return aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "BUD-001",
    firma: "Firma testowa",
    budowa: "Budowa testowa",
    startPlanowany: "08:00",
    iloscBetonuM3: "16",
    rodzajBetonu: "C25/30",
    dataPlanowana: "",
    rodzajRozladunku: "Pompa",
    daneZrodlowe: null
  }, 2);
}

function sprawdzWartoscDomyslna(aplikacja) {
  const budowaZImportu = utworzBudoweZImportu(aplikacja);
  const budowaReczna = aplikacja.budowy.utworzBudoweReczna({
    firma: "Firma ręczna",
    budowa: "Budowa ręczna",
    startPlanowany: "09:00",
    iloscBetonuM3: "8"
  }, [budowaZImportu]);

  assert.equal(budowaZImportu.dodatkowyOdstepDostawMinuty, 0);
  assert.equal(budowaReczna.dodatkowyOdstepDostawMinuty, 0);
}

function sprawdzZmianeIWalidacje(aplikacja) {
  const budowa = utworzBudoweZImportu(aplikacja);

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "dodatkowyOdstepDostawMinuty",
    "5"
  );
  assert.equal(budowa.dodatkowyOdstepDostawMinuty, 5);

  aplikacja.budowy.ustawCzasyRobocze(budowa, {
    czasDojazduRoboczyMinuty: 20,
    czasPowrotuRoboczyMinuty: 25
  });
  assert.equal(
    budowa.dodatkowyOdstepDostawMinuty,
    5,
    "Zmiana innych czasów nie może zerować odstępu dostaw."
  );

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "dodatkowyOdstepDostawMinuty",
    ""
  );
  assert.equal(budowa.dodatkowyOdstepDostawMinuty, 0);

  assert.throws(
    function () {
      aplikacja.budowy.zmienCzasRoboczyBudowy(
        budowa,
        "dodatkowyOdstepDostawMinuty",
        -1
      );
    },
    /Pole „Dodatkowy odstęp dostaw” musi zawierać liczbę nie mniejszą niż 0\./
  );

  assert.throws(
    function () {
      aplikacja.budowy.zmienCzasRoboczyBudowy(
        budowa,
        "dodatkowyOdstepDostawMinuty",
        "niepoprawna wartość"
      );
    },
    /Pole „Dodatkowy odstęp dostaw” musi zawierać liczbę nie mniejszą niż 0\./
  );
}

function sprawdzZgodnoscStarszychDanych(aplikacja) {
  const starszaBudowa = utworzBudoweZImportu(aplikacja);
  delete starszaBudowa.dodatkowyOdstepDostawMinuty;

  const listaRobocza = aplikacja.budowy.utworzListeRobocza(
    [starszaBudowa],
    []
  );

  assert.equal(listaRobocza[0].dodatkowyOdstepDostawMinuty, 0);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      starszaBudowa,
      "dodatkowyOdstepDostawMinuty"
    ),
    false,
    "Tworzenie listy roboczej nie powinno zmieniać starszych danych źródłowych."
  );

  aplikacja.budowy.uzupelnijDodatkowyOdstepDostawBudowy(starszaBudowa);
  assert.equal(starszaBudowa.dodatkowyOdstepDostawMinuty, 0);

  const budowaZBlednaWartoscia = utworzBudoweZImportu(aplikacja);
  budowaZBlednaWartoscia.dodatkowyOdstepDostawMinuty = -4;

  assert.throws(
    function () {
      aplikacja.budowy.utworzListeRobocza([budowaZBlednaWartoscia], []);
    },
    /Pole „Dodatkowy odstęp dostaw” musi zawierać liczbę nie mniejszą niż 0\./
  );
}

const aplikacja = wczytajAplikacje();
sprawdzWartoscDomyslna(aplikacja);
sprawdzZmianeIWalidacje(aplikacja);
sprawdzZgodnoscStarszychDanych(aplikacja);

console.log(
  "✓ Etap 3B.2.2: model odstępu dostaw, walidacja i starsze dane działają poprawnie."
);
