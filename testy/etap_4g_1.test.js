"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajModulyPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/pompy/pompy.js",
    "js/pompy/minimalna_liczba_pomp.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, dane) {
  return Object.assign({
    idBudowy: idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  }, dane || {});
}

function utworzKurs(idBudowy, minutaStartu, minutaKonca) {
  return {
    idKursu: "KURS-" + idBudowy,
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: minutaStartu,
    minutaZakonczeniaRozladunku: minutaKonca
  };
}

function pobierzNumeryPompTechnicznych(wynik) {
  return wynik.przydzialyTechniczne.map(function (przydzial) {
    return przydzial.numerPompyTechnicznej;
  });
}

function sprawdzMinimalnaFloteTechniczna(pompy) {
  const budowy = [
    utworzBudowe("A"),
    utworzBudowe("B"),
    utworzBudowe("C"),
    utworzBudowe("LEJ", { rodzajRozladunku: "lej" }),
    utworzBudowe("ZERO", { iloscBetonuLiczbaM3: 0 })
  ];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 500, 515),
    utworzKurs("C", 545, 560),
    utworzKurs("LEJ", 490, 505),
    utworzKurs("ZERO", 510, 525)
  ];
  const budowyPrzed = JSON.stringify(budowy);
  const kursyPrzed = JSON.stringify(kursy);

  const pierwszyWynik = pompy.obliczMinimalnaLiczbePomp(budowy, kursy);
  const drugiWynik = pompy.obliczMinimalnaLiczbePomp(budowy, kursy);

  assert.equal(pierwszyWynik.status, "obliczono");
  assert.equal(pierwszyWynik.minimalnaLiczbaPomp, 2);
  assert.equal(pierwszyWynik.liczbaBudowDoPrzydzialu, 3);
  assert.deepEqual(
    pierwszyWynik.przydzialyTechniczne.map(function (przydzial) {
      return przydzial.idBudowy;
    }),
    ["A", "B", "C"]
  );
  assert.deepEqual(
    pobierzNumeryPompTechnicznych(pierwszyWynik),
    [1, 2, 1]
  );

  const przydzialA = pierwszyWynik.przydzialyTechniczne[0];
  const przydzialC = pierwszyWynik.przydzialyTechniczne[2];

  assert.equal(
    przydzialA.okresZajetosci.minutaZakonczeniaZajetosci,
    przydzialC.okresZajetosci.minutaRozpoczeciaZajetosci
  );
  assert.equal(
    Math.max.apply(null, pobierzNumeryPompTechnicznych(pierwszyWynik)),
    pierwszyWynik.minimalnaLiczbaPomp
  );
  assert.equal(JSON.stringify(pierwszyWynik), JSON.stringify(drugiWynik));
  assert.equal(JSON.stringify(budowy), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
}

function sprawdzPustyPlan(pompy) {
  const wynik = pompy.obliczMinimalnaLiczbePomp([], []);

  assert.equal(wynik.minimalnaLiczbaPomp, 0);
  assert.equal(wynik.liczbaBudowDoPrzydzialu, 0);
  assert.deepEqual(wynik.przydzialyTechniczne, []);
  assert.deepEqual(wynik.pompyTechniczne, []);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzMinimalnaFloteTechniczna(pompy);
  sprawdzPustyPlan(pompy);

  console.log(
    "✓ Etap 4G.1: techniczny przydział wyznacza minimalną liczbę pomp bez nakładania pełnych cykli."
  );
}

uruchomTesty();
