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

function utworzBudowe(dodatkoweDane) {
  return Object.assign({
    idBudowy: "BUDOWA-4D2",
    budowa: "Budowa testowa 4D.2",
    rodzajRozladunku: "pompa",
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 24,
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  }, dodatkoweDane || {});
}

function utworzKursy() {
  return [
    {
      idKursu: "BUDOWA-4D2-KURS-003",
      idBudowy: "BUDOWA-4D2",
      minutaRozpoczeciaRozladunku: 540,
      minutaZakonczeniaRozladunku: 555
    },
    {
      idKursu: "BUDOWA-4D2-KURS-001",
      idBudowy: "BUDOWA-4D2",
      minutaRozpoczeciaRozladunku: 480,
      minutaZakonczeniaRozladunku: 495
    },
    {
      idKursu: "BUDOWA-4D2-KURS-002",
      idBudowy: "BUDOWA-4D2",
      minutaRozpoczeciaRozladunku: 510,
      minutaZakonczeniaRozladunku: 525
    }
  ];
}

function sprawdzStandardowyPelnyCykl(pompy) {
  const budowa = utworzBudowe();
  const kursy = utworzKursy();
  const budowaPrzedObliczeniem = JSON.stringify(budowa);
  const kursyPrzedObliczeniem = JSON.stringify(kursy);
  const okresZajetosci = pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
    budowa,
    kursy
  );

  assert.deepEqual(JSON.parse(JSON.stringify(okresZajetosci)), {
    idBudowy: "BUDOWA-4D2",
    minutaRozpoczeciaZajetosci: 460,
    minutaRozpoczeciaBetonowania: 480,
    minutaZakonczeniaBetonowania: 555,
    minutaZakonczeniaZajetosci: 585,
    czasPrzygotowaniaPompyMinuty: 20,
    czasBetonowaniaMinuty: 75,
    czasZakonczeniaObslugiPompyMinuty: 30,
    czasZajetosciPompyMinuty: 125,
    liczbaKursow: 3
  });
  assert.equal(JSON.stringify(budowa), budowaPrzedObliczeniem);
  assert.equal(JSON.stringify(kursy), kursyPrzedObliczeniem);
}

function sprawdzWysiegIReczneCzasy(pompy) {
  const okresWiekszejPompy = pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
    utworzBudowe({ wymaganyWysiegPompyMetry: 36 }),
    utworzKursy()
  );

  assert.equal(okresWiekszejPompy.minutaRozpoczeciaZajetosci, 455);
  assert.equal(okresWiekszejPompy.minutaZakonczeniaZajetosci, 590);
  assert.equal(okresWiekszejPompy.czasPrzygotowaniaPompyMinuty, 25);
  assert.equal(okresWiekszejPompy.czasZakonczeniaObslugiPompyMinuty, 35);
  assert.equal(okresWiekszejPompy.czasZajetosciPompyMinuty, 135);

  const okresZRecznymiCzasami =
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      utworzBudowe({
        wymaganyWysiegPompyMetry: 36,
        czasPrzygotowaniaPompyRoboczyMinuty: 10,
        czasZakonczeniaObslugiPompyRoboczyMinuty: 15
      }),
      utworzKursy()
    );

  assert.equal(okresZRecznymiCzasami.minutaRozpoczeciaZajetosci, 470);
  assert.equal(okresZRecznymiCzasami.minutaZakonczeniaZajetosci, 570);
  assert.equal(okresZRecznymiCzasami.czasPrzygotowaniaPompyMinuty, 10);
  assert.equal(okresZRecznymiCzasami.czasZakonczeniaObslugiPompyMinuty, 15);
  assert.equal(okresZRecznymiCzasami.czasZajetosciPompyMinuty, 100);
}

function sprawdzOkresWWynikuSilnika(pompy) {
  const wynik = pompy.utworzWynikSilnikaPomp(
    [utworzBudowe()],
    [],
    { trybPomp: "oblicz-potrzebne" },
    utworzKursy()
  );
  const wynikBudowy = wynik.wynikiBudow[0];

  assert.equal(wynikBudowy.statusPrzydzialuPompy, "oczekuje-na-obliczenie");
  assert.equal(wynikBudowy.przydzialPompy, null);
  assert.equal(wynikBudowy.okresZajetosci.minutaRozpoczeciaZajetosci, 460);
  assert.equal(wynikBudowy.okresZajetosci.minutaZakonczeniaZajetosci, 585);
  assert.equal(wynikBudowy.okresZajetosci.czasZajetosciPompyMinuty, 125);
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzStandardowyPelnyCykl(pompy);
  sprawdzWysiegIReczneCzasy(pompy);
  sprawdzOkresWWynikuSilnika(pompy);

  console.log(
    "✓ Etap 4D.2: przygotowanie, betonowanie i czynności po pracy tworzą pełny okres zajętości pompy."
  );
}

uruchomTesty();
