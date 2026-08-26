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

function utworzBudowe(idBudowy, rodzajRozladunku, godziny) {
  return Object.assign({
    idBudowy: idBudowy,
    budowa: "Budowa " + idBudowy,
    rodzajRozladunku: rodzajRozladunku,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 8
  }, godziny || {});
}

function sprawdzKontraktWyniku(pompy) {
  const budowaPompa = utworzBudowe("BUDOWA-POMPA", "pompa", {
    startZadany: "08:15",
    startRoboczy: "08:20"
  });
  const drugaBudowaPompa = utworzBudowe("BUDOWA-POMPA-2", "Pompa", {
    startZadany: null,
    startRoboczy: null
  });
  const budowaBezPompy = utworzBudowe("BUDOWA-LEJ", "lej");
  const listaBudow = [budowaPompa, budowaBezPompy, drugaBudowaPompa];
  const listaPomp = pompy.dopasujLiczbePomp([], 2, "07:00");
  listaPomp[1].aktywna = false;
  const budowyPrzedObliczeniem = JSON.stringify(listaBudow);
  const pompyPrzedObliczeniem = JSON.stringify(listaPomp);
  const wynik = pompy.utworzWynikSilnikaPomp(
    listaBudow,
    listaPomp,
    {
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 2
    }
  );

  assert.equal(wynik.status, "oczekuje-na-obliczenia");
  assert.equal(wynik.trybPomp, "mam-okreslona-liczbe");
  assert.equal(wynik.minimalnaLiczbaPomp, null);
  assert.equal(wynik.liczbaDostepnychPomp, 2);
  assert.equal(wynik.liczbaAktywnychPomp, 1);
  assert.equal(wynik.liczbaBudowWymagajacychPompy, 2);
  assert.equal(wynik.wynikiBudow.length, 2);
  assert.deepEqual(
    Array.from(wynik.wynikiBudow, function (pozycja) {
      return pozycja.idBudowy;
    }),
    ["BUDOWA-POMPA", "BUDOWA-POMPA-2"]
  );
  assert.deepEqual(Array.from(wynik.przydzieloneBetonowania), []);
  assert.deepEqual(Array.from(wynik.okresyZajetosci), []);
  assert.deepEqual(Array.from(wynik.konflikty), []);
  assert.deepEqual(Array.from(wynik.komunikaty), []);
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, null);
  assert.equal(wynik.liczbaOpoznionychBetonowan, null);
  assert.equal(wynik.maksymalneOpoznienieBetonowaniaMinuty, null);
  assert.equal(wynik.czyOgraniczenieWplyneloNaPlan, null);

  assert.deepEqual(
    JSON.parse(JSON.stringify(wynik.wynikiBudow[0])),
    {
      idBudowy: "BUDOWA-POMPA",
      statusPrzydzialuPompy: "oczekuje-na-obliczenie",
      startPlanowany: "08:00",
      startZadany: "08:15",
      startRoboczyPrzedPompa: "08:20",
      planowaneOknoBetonowania: null,
      przydzialPompy: null,
      okresZajetosci: null,
      informacyjnyPrzejazdZBazy: null,
      najwczesniejszyMozliwyStart: null,
      opoznienieZPowoduPompMinuty: null,
      skutekNiedoboruPomp: null
    }
  );
  assert.equal(wynik.wynikiBudow[1].startZadany, "08:00");
  assert.equal(wynik.wynikiBudow[1].startRoboczyPrzedPompa, "08:00");

  assert.notStrictEqual(wynik.dostepnePompy[0], listaPomp[0]);
  wynik.dostepnePompy[0].wysiegMetry = 99;
  wynik.wynikiBudow[0].startPlanowany = "23:59";
  assert.equal(listaPomp[0].wysiegMetry, 32);
  assert.equal(budowaPompa.startPlanowany, "08:00");
  assert.equal(JSON.stringify(listaBudow), budowyPrzedObliczeniem);
  assert.equal(JSON.stringify(listaPomp), pompyPrzedObliczeniem);
}

function sprawdzPustyWynik(pompy) {
  const wynik = pompy.utworzPustyStanPomp();

  assert.equal(wynik.status, "oczekuje-na-obliczenia");
  assert.equal(wynik.trybPomp, null);
  assert.equal(wynik.minimalnaLiczbaPomp, null);
  assert.equal(wynik.liczbaDostepnychPomp, null);
  assert.equal(wynik.liczbaAktywnychPomp, 0);
  assert.equal(wynik.liczbaBudowWymagajacychPompy, 0);
  assert.deepEqual(Array.from(wynik.dostepnePompy), []);
  assert.deepEqual(Array.from(wynik.wynikiBudow), []);
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzKontraktWyniku(pompy);
  sprawdzPustyWynik(pompy);

  console.log(
    "✓ Etap 4A.3: niezależny wynik pomp ma stabilny kontrakt i nie zmienia danych wejściowych."
  );
}

uruchomTesty();
