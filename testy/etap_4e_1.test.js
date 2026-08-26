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
    idBudowy: "BUDOWA-4E1",
    budowa: "Budowa testowa 4E.1",
    rodzajRozladunku: "pompa",
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 8,
    czasDojazduRoboczyMinuty: 25,
    zrodloCzasuDojazdu: "mapa",
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  }, dodatkoweDane || {});
}

function utworzKurs() {
  return {
    idKursu: "BUDOWA-4E1-KURS-001",
    idBudowy: "BUDOWA-4E1",
    minutaRozpoczeciaRozladunku: 480,
    minutaZakonczeniaRozladunku: 495
  };
}

function sprawdzDojazdZBetoniarni(pompy) {
  const budowa = utworzBudowe();
  const kursy = [utworzKurs()];
  const budowaPrzedObliczeniem = JSON.stringify(budowa);
  const kursyPrzedObliczeniem = JSON.stringify(kursy);
  const przejazd =
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(budowa, kursy);

  assert.deepEqual(JSON.parse(JSON.stringify(przejazd)), {
    idBudowy: "BUDOWA-4E1",
    rodzajTrasy: "betoniarnia-do-budowy",
    czyWplywaNaDostepnoscPompy: false,
    czasDojazduMinuty: 25,
    zrodloCzasuDojazdu: "mapa",
    minutaWyjazduZBetoniarni: 435,
    minutaPrzyjazduNaBudowe: 460,
    minutaRozpoczeciaPrzygotowaniaPompy: 460
  });
  assert.equal(
    przejazd.czasDojazduMinuty,
    budowa.czasDojazduRoboczyMinuty
  );
  assert.equal(JSON.stringify(budowa), budowaPrzedObliczeniem);
  assert.equal(JSON.stringify(kursy), kursyPrzedObliczeniem);
}

function sprawdzDojazdWWynikuSilnika(pompy) {
  const budowa = utworzBudowe();
  const kursy = [utworzKurs()];
  const wynik = pompy.utworzWynikSilnikaPomp(
    [budowa],
    [],
    { trybPomp: "oblicz-potrzebne" },
    kursy
  );
  const wynikBudowy = wynik.wynikiBudow[0];

  assert.equal(wynikBudowy.startPlanowany, "08:00");
  assert.equal(wynikBudowy.startZadany, "08:00");
  assert.equal(wynikBudowy.startRoboczyPrzedPompa, "08:00");
  assert.equal(wynikBudowy.okresZajetosci.minutaRozpoczeciaZajetosci, 460);
  assert.equal(
    wynikBudowy.informacyjnyPrzejazdZBazy.minutaWyjazduZBetoniarni,
    435
  );
  assert.equal(
    wynikBudowy.informacyjnyPrzejazdZBazy.minutaPrzyjazduNaBudowe,
    460
  );
  assert.equal(
    wynikBudowy.informacyjnyPrzejazdZBazy.czyWplywaNaDostepnoscPompy,
    false
  );
  assert.equal(wynikBudowy.przydzialPompy, null);
  assert.equal(budowa.startRoboczy, "08:00");
  assert.equal(kursy[0].minutaRozpoczeciaRozladunku, 480);
}

function sprawdzGraniceCzasuDojazdu(pompy) {
  const przejazdZerowy =
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(
      utworzBudowe({
        czasDojazduRoboczyMinuty: 0,
        zrodloCzasuDojazdu: "reczny"
      }),
      [utworzKurs()]
    );

  assert.equal(przejazdZerowy.czasDojazduMinuty, 0);
  assert.equal(przejazdZerowy.minutaWyjazduZBetoniarni, 460);
  assert.equal(przejazdZerowy.minutaPrzyjazduNaBudowe, 460);

  assert.throws(function () {
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(
      utworzBudowe({ czasDojazduRoboczyMinuty: null }),
      [utworzKurs()]
    );
  }, /ten sam czas jest używany dla gruszki i pompy/i);
  assert.throws(function () {
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(
      utworzBudowe({ czasDojazduRoboczyMinuty: -1 }),
      [utworzKurs()]
    );
  }, /czas dojazdu.*liczbę nie mniejszą niż 0/i);
  assert.throws(function () {
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(
      utworzBudowe({ czasDojazduRoboczyMinuty: "brak" }),
      [utworzKurs()]
    );
  }, /czas dojazdu.*liczbę nie mniejszą niż 0/i);

  assert.equal(
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(
      utworzBudowe({
        iloscBetonuLiczbaM3: 0,
        czasDojazduRoboczyMinuty: null
      }),
      [utworzKurs()]
    ),
    null
  );
  assert.equal(
    pompy.wyznaczInformacyjnyPrzejazdPompyZBazyDoBudowy(
      utworzBudowe({
        rodzajRozladunku: "lej",
        czasDojazduRoboczyMinuty: null
      }),
      [utworzKurs()]
    ),
    null
  );
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzDojazdZBetoniarni(pompy);
  sprawdzDojazdWWynikuSilnika(pompy);
  sprawdzGraniceCzasuDojazdu(pompy);

  console.log(
    "✓ Etap 4E.1: pompa wyjeżdża z betoniarni z użyciem czasu dojazdu budowy."
  );
}

uruchomTesty();
