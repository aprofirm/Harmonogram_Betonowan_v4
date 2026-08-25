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

function utworzBudowe(wysiegMetry) {
  return {
    idBudowy: "POMPA-4A2",
    budowa: "Budowa testowa",
    rodzajRozladunku: "pompa",
    wymaganyWysiegPompyMetry: wysiegMetry,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  };
}

function sprawdzCzasyDomyslne(pompy) {
  assert.equal(pompy.DOMYSLNY_CZAS_PRZYGOTOWANIA_POMPY_MINUTY, 20);
  assert.equal(pompy.DOMYSLNY_CZAS_ZAKONCZENIA_OBSLUGI_POMPY_MINUTY, 30);
  assert.equal(pompy.KROK_DODATKOWEGO_WYSIEGU_POMPY_METRY, 10);
  assert.equal(pompy.DODATKOWY_CZAS_NA_KROK_WYSIEGU_MINUTY, 5);

  assert.deepEqual(
    JSON.parse(JSON.stringify(pompy.obliczDomyslneCzasyObslugiPompy(32))),
    {
      liczbaKrokowWysiegu: 0,
      dodatkowyCzasMinuty: 0,
      czasPrzygotowaniaPompyMinuty: 20,
      czasZakonczeniaObslugiPompyMinuty: 30
    }
  );
  assert.equal(
    pompy.obliczDomyslneCzasyObslugiPompy(36)
      .czasPrzygotowaniaPompyMinuty,
    25
  );
  assert.equal(
    pompy.obliczDomyslneCzasyObslugiPompy(42)
      .czasZakonczeniaObslugiPompyMinuty,
    35
  );
  assert.equal(
    pompy.obliczDomyslneCzasyObslugiPompy(42.1)
      .czasZakonczeniaObslugiPompyMinuty,
    40
  );
}

function sprawdzReczneCzasyBudowy(pompy) {
  const budowa = utworzBudowe(36);
  let czasy = pompy.pobierzCzasyObslugiPompyBudowy(budowa);

  assert.equal(czasy.czasPrzygotowaniaPompyMinuty, 25);
  assert.equal(czasy.czasZakonczeniaObslugiPompyMinuty, 35);
  assert.equal(czasy.czyCzasPrzygotowaniaNadpisany, false);
  assert.equal(czasy.czyCzasZakonczeniaNadpisany, false);

  pompy.zmienCzasyObslugiPompyBudowy(budowa, {
    czasPrzygotowaniaPompyRoboczyMinuty: "18",
    czasZakonczeniaObslugiPompyRoboczyMinuty: "27"
  });
  czasy = pompy.pobierzCzasyObslugiPompyBudowy(budowa);

  assert.equal(czasy.czasPrzygotowaniaPompyMinuty, 18);
  assert.equal(czasy.czasZakonczeniaObslugiPompyMinuty, 27);
  assert.equal(czasy.czyCzasPrzygotowaniaNadpisany, true);
  assert.equal(czasy.czyCzasZakonczeniaNadpisany, true);

  pompy.zmienCzasyObslugiPompyBudowy(budowa, {
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  });
  czasy = pompy.pobierzCzasyObslugiPompyBudowy(budowa);

  assert.equal(czasy.czasPrzygotowaniaPompyMinuty, 25);
  assert.equal(czasy.czasZakonczeniaObslugiPompyMinuty, 35);

  assert.throws(function () {
    pompy.zmienCzasyObslugiPompyBudowy(budowa, {
      czasPrzygotowaniaPompyRoboczyMinuty: 19,
      czasZakonczeniaObslugiPompyRoboczyMinuty: -1
    });
  }, /nieujemną liczbę całkowitą/i);
  assert.equal(budowa.czasPrzygotowaniaPompyRoboczyMinuty, null);
  assert.equal(budowa.czasZakonczeniaObslugiPompyRoboczyMinuty, null);
}

function sprawdzOknoPompowania(pompy) {
  const budowa = utworzBudowe(32);
  const kursy = [
    {
      idKursu: "INNA-KURS-001",
      idBudowy: "INNA",
      minutaRozpoczeciaRozladunku: 470,
      minutaZakonczeniaRozladunku: 485
    },
    {
      idKursu: "POMPA-4A2-KURS-002",
      idBudowy: "POMPA-4A2",
      minutaRozpoczeciaRozladunku: 510,
      minutaZakonczeniaRozladunku: 525
    },
    {
      idKursu: "POMPA-4A2-KURS-001",
      idBudowy: "POMPA-4A2",
      minutaRozpoczeciaRozladunku: 480,
      minutaZakonczeniaRozladunku: 495
    }
  ];
  const okno = pompy.wyznaczOknoPompowaniaBudowy(budowa, kursy);

  assert.equal(okno.minutaRozpoczeciaPompowania, 480);
  assert.equal(okno.minutaZakonczeniaPompowania, 525);
  assert.equal(okno.czasPompowaniaMinuty, 45);
  assert.equal(okno.liczbaKursow, 2);
  assert.equal(
    pompy.wyznaczOknoPompowaniaBudowy(budowa, []),
    null
  );
  assert.equal(
    pompy.wyznaczOknoPompowaniaBudowy(
      { idBudowy: "LEJ", rodzajRozladunku: "lej" },
      kursy
    ),
    null
  );
  assert.throws(function () {
    pompy.wyznaczOknoPompowaniaBudowy(budowa, [
      {
        idKursu: "POMPA-4A2-KURS-BRAK-CZASU",
        idBudowy: "POMPA-4A2",
        minutaRozpoczeciaRozladunku: null,
        minutaZakonczeniaRozladunku: 525
      }
    ]);
  }, /nie ma początku rozładunku pompy/i);
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzCzasyDomyslne(pompy);
  sprawdzReczneCzasyBudowy(pompy);
  sprawdzOknoPompowania(pompy);

  console.log(
    "✓ Etap 4A.2: domyślne, większe i ręczne czasy obsługi pompy działają poprawnie."
  );
}

uruchomTesty();
