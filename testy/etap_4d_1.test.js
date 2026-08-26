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

function utworzBudowe() {
  return {
    idBudowy: "BUDOWA-4D1",
    budowa: "Budowa testowa 4D.1",
    rodzajRozladunku: "pompa",
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 24,
    czasDojazduRoboczyMinuty: 25,
    zrodloCzasuDojazdu: "mapa"
  };
}

function utworzKursy() {
  return [
    {
      idKursu: "INNA-BUDOWA-KURS-001",
      idBudowy: "INNA-BUDOWA",
      minutaRozpoczeciaRozladunku: 470,
      minutaZakonczeniaRozladunku: 485
    },
    {
      idKursu: "BUDOWA-4D1-KURS-003",
      idBudowy: "BUDOWA-4D1",
      minutaRozpoczeciaRozladunku: 540,
      minutaZakonczeniaRozladunku: 555
    },
    {
      idKursu: "BUDOWA-4D1-KURS-001",
      idBudowy: "BUDOWA-4D1",
      minutaRozpoczeciaRozladunku: 480,
      minutaZakonczeniaRozladunku: 495
    },
    {
      idKursu: "BUDOWA-4D1-KURS-002",
      idBudowy: "BUDOWA-4D1",
      minutaRozpoczeciaRozladunku: 510,
      minutaZakonczeniaRozladunku: 525
    }
  ];
}

function sprawdzPelneOknoPlanu(pompy) {
  const budowa = utworzBudowe();
  const kursy = utworzKursy();
  const budowaPrzedObliczeniem = JSON.stringify(budowa);
  const kursyPrzedObliczeniem = JSON.stringify(kursy);
  const okno = pompy.wyznaczPlanowaneOknoBetonowaniaBudowy(
    budowa,
    kursy
  );

  assert.deepEqual(JSON.parse(JSON.stringify(okno)), {
    idBudowy: "BUDOWA-4D1",
    minutaRozpoczeciaBetonowania: 480,
    minutaZakonczeniaBetonowania: 555,
    czasBetonowaniaMinuty: 75,
    liczbaKursow: 3
  });
  assert.equal(okno.minutaRozpoczeciaBetonowania, 480);
  assert.equal(okno.minutaZakonczeniaBetonowania, 555);
  assert.notEqual(okno.czasBetonowaniaMinuty, 15);
  assert.equal(JSON.stringify(budowa), budowaPrzedObliczeniem);
  assert.equal(JSON.stringify(kursy), kursyPrzedObliczeniem);
}

function sprawdzOknoWWynikuSilnika(pompy) {
  const budowa = utworzBudowe();
  const kursy = utworzKursy();
  const wynik = pompy.utworzWynikSilnikaPomp(
    [budowa],
    [],
    { trybPomp: "oblicz-potrzebne" },
    kursy
  );
  const wynikBudowy = wynik.wynikiBudow[0];

  assert.equal(wynikBudowy.statusPrzydzialuPompy, "oczekuje-na-obliczenie");
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikBudowy.planowaneOknoBetonowania)),
    {
      idBudowy: "BUDOWA-4D1",
      minutaRozpoczeciaBetonowania: 480,
      minutaZakonczeniaBetonowania: 555,
      czasBetonowaniaMinuty: 75,
      liczbaKursow: 3
    }
  );
}

function sprawdzZgodnoscZeStarszymKontraktem(pompy) {
  const okno = pompy.wyznaczOknoPompowaniaBudowy(
    utworzBudowe(),
    utworzKursy()
  );

  assert.deepEqual(JSON.parse(JSON.stringify(okno)), {
    minutaRozpoczeciaPompowania: 480,
    minutaZakonczeniaPompowania: 555,
    czasPompowaniaMinuty: 75,
    liczbaKursow: 3
  });
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzPelneOknoPlanu(pompy);
  sprawdzOknoWWynikuSilnika(pompy);
  sprawdzZgodnoscZeStarszymKontraktem(pompy);

  console.log(
    "✓ Etap 4D.1: okno betonowania obejmuje pełny plan dostaw budowy."
  );
}

uruchomTesty();
