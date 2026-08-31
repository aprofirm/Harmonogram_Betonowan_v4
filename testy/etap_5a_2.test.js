"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzSrodowisko() {
  const kolejnosc = [];
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna };
  vm.createContext(kontekst);

  new vm.Script(wczytaj("js/konfiguracja/konfiguracja.js"))
    .runInContext(kontekst);

  const aplikacja = zakresOkna.HarmonogramBetonowan;
  aplikacja.importCsv = {
    utworzPustyStanImportu: function () {
      return { budowy: [] };
    }
  };
  aplikacja.budowy = {
    utworzListeRobocza: function (zImportu, reczne) {
      kolejnosc.push("budowy");
      return zImportu.concat(reczne || []).map(function (budowa) {
        return Object.assign({}, budowa);
      });
    },
    czyOdbiorWlasny: function () {
      return false;
    },
    pobierzEfektywnyLimitOpoznieniaStartuMinuty: function (budowa, globalnyLimit) {
      const indywidualnyLimit = budowa &&
        budowa.maksymalneOpoznienieStartuBudowyMinuty;
      return indywidualnyLimit === null ||
        indywidualnyLimit === undefined ||
        indywidualnyLimit === ""
        ? Number(globalnyLimit)
        : Number(indywidualnyLimit);
    }
  };
  aplikacja.gruszki = {
    generujKursy: function () {
      kolejnosc.push("generowanie-kursow");
      return [{ idKursu: "K-1", idBudowy: "B-1" }];
    },
    obliczCzasyKursow: function (kursy) {
      kolejnosc.push("czasy-kursow");
      return kursy.map(function (kurs) {
        return Object.assign({}, kurs);
      });
    },
    przydzielGruszkiDoKursow: function (kursy) {
      kolejnosc.push("przydzial-gruszek");
      return {
        kursy: kursy,
        gruszki: [{ idGruszki: "G-1" }],
        minimalnaLiczbaGruszek: 1
      };
    },
    przydzielOgraniczonaLiczbeGruszekDoKursow: function () {
      throw new Error("Ograniczona flota nie należy do tego scenariusza.");
    }
  };
  aplikacja.pompy = {
    utworzPustyStanPomp: function () {
      kolejnosc.push("pompy");
      return {
        trybPomp: "oblicz-potrzebne",
        minimalnaLiczbaPomp: 0,
        liczbaDostepnychPomp: null
      };
    }
  };
  aplikacja.lokalizacje = {
    utworzPustyStanLokalizacji: function () {
      kolejnosc.push("wynik-koncowy");
      return { status: "pusty" };
    }
  };

  new vm.Script(wczytaj("js/harmonogram/harmonogram.js"))
    .runInContext(kontekst);

  return { aplikacja: aplikacja, kolejnosc: kolejnosc };
}

function sprawdzCentralnyPrzebieg() {
  const srodowisko = utworzSrodowisko();
  const wynik = srodowisko.aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: {
      budowy: [{
        idBudowy: "B-1",
        startPlanowany: "08:00",
        startZadany: "08:15",
        startRoboczy: "09:00",
        dodatkowyOdstepDostawMinuty: 0
      }]
    }
  });

  assert.deepEqual(srodowisko.kolejnosc, [
    "budowy",
    "generowanie-kursow",
    "czasy-kursow",
    "pompy",
    "generowanie-kursow",
    "czasy-kursow",
    "przydzial-gruszek",
    "wynik-koncowy"
  ]);
  assert.equal(wynik.status, "gotowy");
  assert.equal(wynik.budowy[0].startRoboczy, "08:15");
  assert.equal(wynik.kursy[0].idKursu, "K-1");
  assert.equal(wynik.gruszki.minimalnaLiczbaGruszek, 1);
  assert.equal(wynik.pompy.minimalnaLiczbaPomp, 0);
}

function sprawdzBrakLogikiInterfejsuWSilniku() {
  const kod = wczytaj("js/harmonogram/harmonogram.js");

  assert.doesNotMatch(kod, /document\.|querySelector|addEventListener|innerHTML/);
  assert.match(kod, /function przygotujCentralnyPrzebieg/);
  assert.match(kod, /function obliczBazoweKursyPrzebiegu/);
  assert.match(kod, /function obliczPompyPrzebiegu/);
  assert.match(kod, /function regenerujKursyPoStartachPomp/);
  assert.match(kod, /function obliczGruszkiPrzebiegu/);
  assert.match(kod, /function zbudujKoncowyWynikPrzebiegu/);
}

sprawdzCentralnyPrzebieg();
sprawdzBrakLogikiInterfejsuWSilniku();

console.log(
  "OK — 5A.2 prowadzi pełne obliczenie przez jeden czysty centralny przebieg."
);
