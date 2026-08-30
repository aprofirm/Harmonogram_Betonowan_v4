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
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  const aplikacja = zakresOkna.HarmonogramBetonowan;
  aplikacja.importCsv = {
    utworzPustyStanImportu: function () {
      return { budowy: [] };
    }
  };
  aplikacja.gruszki = {
    generujKursy: function (budowy) {
      budowy[0].daneZrodlowe.naglowki[0] = "zmiana-tylko-w-kopii";
      return [];
    },
    obliczCzasyKursow: function () {
      return [];
    },
    przydzielGruszkiDoKursow: function () {
      return {
        kursy: [],
        gruszki: [],
        minimalnaLiczbaGruszek: 0
      };
    },
    przydzielOgraniczonaLiczbeGruszekDoKursow: function () {
      throw new Error("Ten wariant nie jest używany w teście 5A.1.");
    }
  };
  aplikacja.pompy = {
    utworzPustyStanPomp: function () {
      return {
        trybPomp: "oblicz-potrzebne",
        minimalnaLiczbaPomp: 0,
        liczbaDostepnychPomp: null
      };
    }
  };
  aplikacja.lokalizacje = {
    utworzPustyStanLokalizacji: function () {
      return { status: "pusty" };
    }
  };

  new vm.Script(wczytaj("js/harmonogram/harmonogram.js"), {
    filename: "js/harmonogram/harmonogram.js"
  }).runInContext(kontekst);

  return aplikacja;
}

function utworzBudowe() {
  return {
    idBudowy: "B-001",
    firma: "Firma testowa",
    budowa: "Budowa testowa",
    startPlanowany: "08:00",
    startZadany: "08:30",
    startRoboczy: "09:15",
    statusRealizacji: "do-realizacji",
    rodzajRozladunku: "lej",
    iloscBetonuLiczbaM3: 0,
    dodatkowyOdstepDostawMinuty: 0,
    daneZrodlowe: {
      naglowki: ["wartosc-zrodlowa"]
    }
  };
}

function sprawdzKontraktTrzechGodzin() {
  const aplikacja = utworzSrodowisko();
  const budowaZrodlowa = utworzBudowe();
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: [budowaZrodlowa] }
  });

  assert.equal(wynik.budowy[0].startPlanowany, "08:00");
  assert.equal(wynik.budowy[0].startZadany, "08:30");
  assert.equal(wynik.budowy[0].startRoboczy, "08:30");

  assert.equal(budowaZrodlowa.startPlanowany, "08:00");
  assert.equal(budowaZrodlowa.startZadany, "08:30");
  assert.equal(budowaZrodlowa.startRoboczy, "09:15");
  assert.equal(
    budowaZrodlowa.daneZrodlowe.naglowki[0],
    "wartosc-zrodlowa"
  );
}

function sprawdzCzystyPonownyStart() {
  const aplikacja = utworzSrodowisko();
  const budowaZrodlowa = utworzBudowe();
  const pierwszyWynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: [budowaZrodlowa] }
  });

  pierwszyWynik.budowy[0].startRoboczy = "11:00";

  const drugiWynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: [budowaZrodlowa] }
  });

  assert.equal(drugiWynik.budowy[0].startRoboczy, "08:30");
  assert.notStrictEqual(pierwszyWynik.budowy[0], drugiWynik.budowy[0]);
  assert.notStrictEqual(
    pierwszyWynik.budowy[0].daneZrodlowe,
    drugiWynik.budowy[0].daneZrodlowe
  );
}

sprawdzKontraktTrzechGodzin();
sprawdzCzystyPonownyStart();

console.log(
  "OK — 5A.1 rozdziela plan, decyzję operatora i wynik silnika bez mutowania danych źródłowych."
);
