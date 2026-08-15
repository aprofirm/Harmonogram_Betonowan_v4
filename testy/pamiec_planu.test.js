"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const sciezkaModulu = "js/pamiec/pamiec_planu.js";
const kluczPamieci = "harmonogramBetonowan.planDnia.v1";

function utworzPamiecLokalna() {
  const dane = new Map();

  return {
    getItem: function (klucz) {
      return dane.has(klucz) ? dane.get(klucz) : null;
    },
    setItem: function (klucz, wartosc) {
      dane.set(klucz, String(wartosc));
    },
    removeItem: function (klucz) {
      dane.delete(klucz);
    },
    ustawSurowaWartosc: function (klucz, wartosc) {
      dane.set(klucz, wartosc);
    }
  };
}

function utworzPamiecZBledemZapisu() {
  const dane = new Map();

  return {
    getItem: function (klucz) {
      return dane.has(klucz) ? dane.get(klucz) : null;
    },
    setItem: function (klucz, wartosc) {
      if (klucz === kluczPamieci) {
        throw new Error("Brak miejsca w pamięci.");
      }
      dane.set(klucz, String(wartosc));
    },
    removeItem: function (klucz) {
      dane.delete(klucz);
    }
  };
}

function uruchomModul(pamiecLokalna, czyDostepBlokowany) {
  const zakresOkna = {};

  if (czyDostepBlokowany) {
    Object.defineProperty(zakresOkna, "localStorage", {
      get: function () {
        throw new Error("Dostęp do localStorage jest zablokowany.");
      }
    });
  } else {
    zakresOkna.localStorage = pamiecLokalna;
  }

  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    Date: Date,
    JSON: JSON,
    Error: Error
  };
  vm.createContext(kontekst);

  const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaModulu), "utf8");
  new vm.Script(kod, { filename: sciezkaModulu }).runInContext(kontekst);

  return zakresOkna.HarmonogramBetonowan.pamiecPlanu;
}

function uproscDane(dane) {
  return JSON.parse(JSON.stringify(dane));
}

function sprawdzTrwalyZapisIOdczyt() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modulPierwszejStrony = uruchomModul(pamiecLokalna, false);
  const danePlanu = {
    nazwaPliku: "plan-testowy.csv",
    parametry: { pojemnoscGruszkiM3: 8 },
    budowy: [{ idBudowy: "B-001", czasDojazduRoboczyMinuty: 25 }]
  };

  assert.deepEqual(uproscDane(modulPierwszejStrony.pobierzStanPamieci()), {
    trybPamieci: "trwala",
    wersjaFormatu: 1,
    kluczPamieci: kluczPamieci
  });

  const wynikZapisu = modulPierwszejStrony.zapiszPlan(danePlanu);
  assert.equal(wynikZapisu.status, "zapisano-trwale");
  assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieci)).wersja, 1);

  danePlanu.budowy[0].czasDojazduRoboczyMinuty = 99;

  const modulPoOdswiezeniu = uruchomModul(pamiecLokalna, false);
  const wynikOdczytu = modulPoOdswiezeniu.odczytajPlan();

  assert.equal(wynikOdczytu.status, "odczytano");
  assert.equal(wynikOdczytu.trybPamieci, "trwala");
  assert.equal(wynikOdczytu.danePlanu.budowy[0].czasDojazduRoboczyMinuty, 25);
  assert.match(wynikOdczytu.zapisano, /^\d{4}-\d{2}-\d{2}T/);
}

function sprawdzBrakIUszkodzenieZapisu() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  assert.equal(modul.odczytajPlan().status, "brak-zapisu");

  pamiecLokalna.ustawSurowaWartosc(kluczPamieci, "{niepoprawny-json");
  const wynikUszkodzenia = modul.odczytajPlan();

  assert.equal(wynikUszkodzenia.status, "uszkodzony-zapis");
  assert.equal(wynikUszkodzenia.danePlanu, null);
  assert.equal(pamiecLokalna.getItem(kluczPamieci), null);
}

function sprawdzNiezgodnaWersje() {
  const pamiecLokalna = utworzPamiecLokalna();
  const zapisPrzyszlejWersji = JSON.stringify({
    wersja: 99,
    zapisano: "2026-08-15T10:00:00.000Z",
    danePlanu: { budowy: [] }
  });
  pamiecLokalna.ustawSurowaWartosc(kluczPamieci, zapisPrzyszlejWersji);

  const wynik = uruchomModul(pamiecLokalna, false).odczytajPlan();

  assert.equal(wynik.status, "niezgodna-wersja");
  assert.equal(wynik.wersjaZapisu, 99);
  assert.equal(wynik.danePlanu, null);
  assert.equal(pamiecLokalna.getItem(kluczPamieci), zapisPrzyszlejWersji);
}

function sprawdzPamiecBiezacejSesji() {
  const modul = uruchomModul(null, true);

  assert.equal(modul.pobierzStanPamieci().trybPamieci, "biezaca-sesja");
  assert.equal(modul.zapiszPlan({ budowy: [{ idBudowy: "B-SESJA" }] }).status, "zapisano-w-sesji");
  assert.equal(modul.odczytajPlan().danePlanu.budowy[0].idBudowy, "B-SESJA");
}

function sprawdzAwaryjnyTrybPoBledzieZapisu() {
  const modul = uruchomModul(utworzPamiecZBledemZapisu(), false);
  const wynikZapisu = modul.zapiszPlan({ budowy: [] });

  assert.equal(wynikZapisu.status, "zapisano-w-sesji");
  assert.equal(wynikZapisu.trybPamieci, "biezaca-sesja");
  assert.equal(modul.odczytajPlan().status, "odczytano");
}

function sprawdzNiepoprawneDaneDoZapisu() {
  const modul = uruchomModul(utworzPamiecLokalna(), false);
  const daneZPetla = {};
  daneZPetla.samaSiebie = daneZPetla;

  assert.equal(modul.zapiszPlan(null).status, "blad-zapisu");
  assert.equal(modul.zapiszPlan(daneZPetla).status, "blad-zapisu");
  assert.equal(modul.odczytajPlan().status, "brak-zapisu");
}

sprawdzTrwalyZapisIOdczyt();
sprawdzBrakIUszkodzenieZapisu();
sprawdzNiezgodnaWersje();
sprawdzPamiecBiezacejSesji();
sprawdzAwaryjnyTrybPoBledzieZapisu();
sprawdzNiepoprawneDaneDoZapisu();

console.log("✓ KP-1.2: wersjonowany moduł pamięci planu działa poprawnie.");
