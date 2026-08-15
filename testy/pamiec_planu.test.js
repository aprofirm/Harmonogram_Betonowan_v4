"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const sciezkaModulu = "js/pamiec/pamiec_planu.js";
const kluczPamieci = "harmonogramBetonowan.planDnia.v1";
const kluczHistorii = "harmonogramBetonowan.historiaPlanu.v1";

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
    kluczPamieci: kluczPamieci,
    kluczHistorii: kluczHistorii,
    maksymalnaLiczbaZapisowHistorycznych: 100,
    maksymalnyRozmiarHistoriiBajty: 3 * 1024 * 1024
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

function sprawdzHistorieBezDuplikatow() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);
  const danePlanu = {
    nazwaPliku: "plan-dnia.csv",
    budowyZImportu: [{ idBudowy: "B-001" }],
    budowyReczne: [],
    czyHarmonogramPrzeliczony: true
  };

  const pierwszyZapis = modul.zapiszPlanHistoryczny(danePlanu);
  const duplikat = modul.zapiszPlanHistoryczny(danePlanu);
  const historia = modul.pobierzHistoriePlanow();
  const odczytanyZapis = modul.odczytajPlanHistoryczny(pierwszyZapis.idZapisu);

  assert.equal(pierwszyZapis.status, "zapisano-historie-trwale");
  assert.equal(duplikat.status, "pominieto-duplikat");
  assert.equal(historia.liczbaZapisow, 1);
  assert.equal(historia.zapisy[0].podsumowanie.nazwaPliku, "plan-dnia.csv");
  assert.equal(historia.zapisy[0].podsumowanie.liczbaBudow, 1);
  assert.match(historia.zapisy[0].zapisano, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(odczytanyZapis.status, "odczytano-zapis-historyczny");
  assert.equal(odczytanyZapis.danePlanu.budowyZImportu[0].idBudowy, "B-001");
}

function sprawdzLimitStuZapisow() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  for (let numerZapisu = 0; numerZapisu < 105; numerZapisu += 1) {
    const wynik = modul.zapiszPlanHistoryczny({
      nazwaPliku: "plan-" + numerZapisu + ".csv",
      numerZapisu: numerZapisu,
      budowyZImportu: [],
      budowyReczne: []
    });
    assert.match(wynik.status, /^zapisano-historie-/);
  }

  const surowaHistoria = JSON.parse(pamiecLokalna.getItem(kluczHistorii));

  assert.equal(surowaHistoria.zapisy.length, 100);
  assert.equal(surowaHistoria.zapisy[0].danePlanu.numerZapisu, 5);
  assert.equal(surowaHistoria.zapisy[99].danePlanu.numerZapisu, 104);
}

function sprawdzCzyszczenieTylkoBiezacegoPlanu() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  modul.zapiszPlan({ budowyZImportu: [{ idBudowy: "B-PLAN" }] });
  modul.zapiszPlanHistoryczny({
    budowyZImportu: [{ idBudowy: "B-HISTORIA" }],
    czyHarmonogramPrzeliczony: true
  });
  const wynikUsuniecia = modul.usunBiezacyPlan();

  assert.equal(wynikUsuniecia.status, "usunieto-biezacy-plan");
  assert.equal(modul.odczytajPlan().status, "brak-zapisu");
  assert.equal(modul.pobierzHistoriePlanow().liczbaZapisow, 1);
  assert.notEqual(pamiecLokalna.getItem(kluczHistorii), null);
}

function sprawdzUszkodzonaHistorie() {
  const pamiecLokalna = utworzPamiecLokalna();
  pamiecLokalna.ustawSurowaWartosc(kluczHistorii, "{niepoprawna-historia");

  const modul = uruchomModul(pamiecLokalna, false);
  const wynik = modul.pobierzHistoriePlanow();

  assert.equal(wynik.status, "uszkodzona-historia");
  assert.equal(wynik.liczbaZapisow, 0);
  assert.equal(pamiecLokalna.getItem(kluczHistorii), null);
}

sprawdzTrwalyZapisIOdczyt();
sprawdzBrakIUszkodzenieZapisu();
sprawdzNiezgodnaWersje();
sprawdzPamiecBiezacejSesji();
sprawdzAwaryjnyTrybPoBledzieZapisu();
sprawdzNiepoprawneDaneDoZapisu();
sprawdzHistorieBezDuplikatow();
sprawdzLimitStuZapisow();
sprawdzCzyszczenieTylkoBiezacegoPlanu();
sprawdzUszkodzonaHistorie();

console.log("✓ KP-1.2–KP-1.4: pamięć planu i historia 100 zapisów działają poprawnie.");
