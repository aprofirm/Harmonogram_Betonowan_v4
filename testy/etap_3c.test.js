"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModul() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/gruszki/przydzial_gruszek.js"),
    "utf8"
  );
  new vm.Script(kod, { filename: "przydzial_gruszek.js" }).runInContext(kontekst);

  return kontekst.window.HarmonogramBetonowan.gruszki;
}

function utworzKurs(idKursu, minutaStartu, czasy) {
  return Object.assign({
    idKursu: idKursu,
    minutaRozpoczeciaZaladunku: minutaStartu,
    calkowityCzasZaladunkuMinuty: 10,
    czasDojazduMinuty: 20,
    calkowityCzasRozladunkuMinuty: 15,
    czasPowrotuMinuty: 20,
    statusKursu: "oczekuje-na-przydzial"
  }, czasy || {});
}

const gruszki = wczytajModul();

const pustyWynik = gruszki.przydzielGruszkiDoKursow([]);
assert.equal(pustyWynik.kursy.length, 0);
assert.equal(pustyWynik.gruszki.length, 0);

const nakladajaceSie = gruszki.przydzielGruszkiDoKursow([
  utworzKurs("K-1", 100),
  utworzKurs("K-2", 120)
]);
assert.deepEqual(
  Array.from(nakladajaceSie.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2]
);
assert.equal(nakladajaceSie.gruszki.length, 2);

const dokladniePoPowrocie = gruszki.przydzielGruszkiDoKursow([
  utworzKurs("K-1", 100),
  utworzKurs("K-2", 165)
]);
assert.deepEqual(
  Array.from(dokladniePoPowrocie.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 1]
);
assert.equal(dokladniePoPowrocie.gruszki.length, 1);

const ponowneUzycie = gruszki.przydzielGruszkiDoKursow([
  utworzKurs("K-1", 100, {
    calkowityCzasZaladunkuMinuty: 10,
    czasDojazduMinuty: 10,
    calkowityCzasRozladunkuMinuty: 10,
    czasPowrotuMinuty: 10
  }),
  utworzKurs("K-2", 110, {
    calkowityCzasZaladunkuMinuty: 10,
    czasDojazduMinuty: 10,
    calkowityCzasRozladunkuMinuty: 10,
    czasPowrotuMinuty: 10
  }),
  utworzKurs("K-3", 140, {
    calkowityCzasZaladunkuMinuty: 10,
    czasDojazduMinuty: 10,
    calkowityCzasRozladunkuMinuty: 10,
    czasPowrotuMinuty: 10
  })
]);
assert.deepEqual(
  Array.from(ponowneUzycie.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 2, 1]
);
assert.equal(ponowneUzycie.kursy[2].idGruszki, "GRUSZKA-001");

const nieuporzadkowane = gruszki.przydzielGruszkiDoKursow([
  utworzKurs("K-2", 200),
  utworzKurs("K-1", 100),
  utworzKurs("K-3", 200)
]);
assert.deepEqual(
  Array.from(nieuporzadkowane.kursy, function (kurs) { return kurs.idKursu; }),
  ["K-1", "K-2", "K-3"]
);
assert.deepEqual(
  Array.from(nieuporzadkowane.kursy, function (kurs) { return kurs.numerGruszki; }),
  [1, 1, 2]
);

assert.throws(function () {
  gruszki.przydzielGruszkiDoKursow([
    utworzKurs("BLEDNY", 100, { czasPowrotuMinuty: undefined })
  ]);
}, /Czas powrotu/i);

assert.throws(function () {
  gruszki.przydzielGruszkiDoKursow([
    utworzKurs("BLEDNY-START", "brak")
  ]);
}, /minuty rozpoczęcia załadunku/i);

console.log(
  "✓ Etap 3C.2: przydział gruszek nie nakłada kursów i poprawnie wykorzystuje pojazd po jego powrocie."
);
