"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModulPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pompy/pompy.js"),
    "utf8"
  );
  new vm.Script(kod, { filename: "js/pompy/pompy.js" }).runInContext(kontekst);
  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, rodzajRozladunku, dodatkoweDane) {
  const budowa = Object.assign({
    idBudowy: idBudowy,
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 8,
    kursy: [{ idKursu: "KURS-" + idBudowy }]
  }, dodatkoweDane || {});

  if (rodzajRozladunku !== undefined) {
    budowa.rodzajRozladunku = rodzajRozladunku;
  }

  return budowa;
}

function sprawdzPojedynczaKwalifikacje(pompy) {
  assert.equal(pompy.czyBudowaWymagaPompy(
    utworzBudowe("P-1", "pompa")
  ), true);
  assert.equal(pompy.czyBudowaWymagaPompy(
    utworzBudowe("P-2", " Pompa ")
  ), true);

  [
    "odbior-wlasny",
    "lej",
    "wywrotka",
    "taczka",
    "",
    "nieznany"
  ].forEach(function (rodzajRozladunku) {
    assert.equal(
      pompy.czyBudowaWymagaPompy(
        utworzBudowe("BEZ-POMPY", rodzajRozladunku)
      ),
      false
    );
  });

  assert.equal(pompy.czyBudowaWymagaPompy(
    utworzBudowe("STARY-PLAN", undefined)
  ), false);
  assert.equal(pompy.czyBudowaWymagaPompy(null), false);
}

function sprawdzPodzialListy(pompy) {
  const budowaPompa = utworzBudowe("POMPA-1", "pompa");
  const zrealizowanaPompa = utworzBudowe("POMPA-2", "pompa", {
    statusRealizacji: "zrealizowana",
    iloscBetonuLiczbaM3: 0
  });
  const budowaLej = utworzBudowe("LEJ-1", "lej");
  const odbiorWlasny = utworzBudowe("ODBIOR-1", "odbior-wlasny");
  const starszaBudowa = utworzBudowe("STARA-1", undefined);
  const listaBudow = [
    budowaLej,
    budowaPompa,
    odbiorWlasny,
    zrealizowanaPompa,
    starszaBudowa
  ];
  const danePrzedKwalifikacja = JSON.stringify(listaBudow);
  const wynik = pompy.zakwalifikujBudowyDoObslugiPomp(listaBudow);

  assert.equal(wynik.liczbaBudow, 5);
  assert.equal(wynik.liczbaBudowWymagajacychPompy, 2);
  assert.equal(wynik.liczbaBudowNiewymagajacychPompy, 3);
  assert.deepEqual(
    Array.from(wynik.budowyWymagajacePompy, function (budowa) {
      return budowa.idBudowy;
    }),
    ["POMPA-1", "POMPA-2"]
  );
  assert.deepEqual(
    Array.from(wynik.budowyNiewymagajacePompy, function (budowa) {
      return budowa.idBudowy;
    }),
    ["LEJ-1", "ODBIOR-1", "STARA-1"]
  );
  assert.strictEqual(wynik.budowyWymagajacePompy[0], budowaPompa);
  assert.equal(JSON.stringify(listaBudow), danePrzedKwalifikacja);
}

function sprawdzPusteDane(pompy) {
  [undefined, null, "pompa", {}].forEach(function (listaBudow) {
    const wynik = pompy.zakwalifikujBudowyDoObslugiPomp(listaBudow);

    assert.equal(wynik.liczbaBudow, 0);
    assert.equal(wynik.liczbaBudowWymagajacychPompy, 0);
    assert.equal(wynik.liczbaBudowNiewymagajacychPompy, 0);
    assert.deepEqual(Array.from(wynik.budowyWymagajacePompy), []);
    assert.deepEqual(Array.from(wynik.budowyNiewymagajacePompy), []);
  });
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzPojedynczaKwalifikacje(pompy);
  sprawdzPodzialListy(pompy);
  sprawdzPusteDane(pompy);

  console.log(
    "✓ Etap 4A.1: tylko budowy z rodzajem rozładunku Pompa wymagają pompy."
  );
}

uruchomTesty();
