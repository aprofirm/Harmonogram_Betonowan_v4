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

function utworzBudowe(idBudowy, dodatkoweDane) {
  return Object.assign({
    idBudowy: idBudowy,
    budowa: "Budowa " + idBudowy,
    rodzajRozladunku: "pompa",
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: 16,
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  }, dodatkoweDane || {});
}

function utworzKurs(idBudowy, numer, poczatek, koniec) {
  return {
    idKursu: idBudowy + "-KURS-" + String(numer).padStart(3, "0"),
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: poczatek,
    minutaZakonczeniaRozladunku: koniec
  };
}

function sprawdzJednaIWieleDostaw(pompy) {
  const jednaBudowa = utworzBudowe("JEDNA-DOSTAWA", {
    iloscBetonuLiczbaM3: 8
  });
  const jedenOkres = pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
    jednaBudowa,
    [utworzKurs("JEDNA-DOSTAWA", 1, 480, 495)]
  );

  assert.deepEqual(JSON.parse(JSON.stringify(jedenOkres)), {
    idBudowy: "JEDNA-DOSTAWA",
    minutaRozpoczeciaZajetosci: 460,
    minutaRozpoczeciaBetonowania: 480,
    minutaZakonczeniaBetonowania: 495,
    minutaZakonczeniaZajetosci: 525,
    czasPrzygotowaniaPompyMinuty: 20,
    czasBetonowaniaMinuty: 15,
    czasZakonczeniaObslugiPompyMinuty: 30,
    czasZajetosciPompyMinuty: 65,
    liczbaKursow: 1
  });

  const wieleBudowa = utworzBudowe("WIELE-DOSTAW");
  const wieleOkresow = pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
    wieleBudowa,
    [
      utworzKurs("WIELE-DOSTAW", 2, 510, 525),
      utworzKurs("WIELE-DOSTAW", 1, 480, 495)
    ]
  );

  assert.equal(wieleOkresow.minutaRozpoczeciaZajetosci, 460);
  assert.equal(wieleOkresow.minutaZakonczeniaZajetosci, 555);
  assert.equal(wieleOkresow.czasBetonowaniaMinuty, 45);
  assert.equal(wieleOkresow.czasZajetosciPompyMinuty, 95);
  assert.equal(wieleOkresow.liczbaKursow, 2);
}

function sprawdzBudowyBezZajetosci(pompy) {
  const budowaZero = utworzBudowe("ZERO", {
    iloscBetonuLiczbaM3: 0
  });
  const staryKursBudowyZero = utworzKurs("ZERO", 1, 480, 495);
  const budowaZrealizowana = utworzBudowe("ZREALIZOWANA", {
    statusRealizacji: "zrealizowana"
  });
  const staryKursBudowyZrealizowanej = utworzKurs(
    "ZREALIZOWANA",
    1,
    500,
    515
  );
  const budowaBezPompy = utworzBudowe("LEJ", {
    rodzajRozladunku: "lej"
  });
  const kursBudowyBezPompy = utworzKurs("LEJ", 1, 510, 525);

  assert.equal(
    pompy.wyznaczPlanowaneOknoBetonowaniaBudowy(
      budowaZero,
      [staryKursBudowyZero]
    ),
    null
  );
  assert.equal(
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowaZero,
      [staryKursBudowyZero]
    ),
    null
  );
  assert.equal(
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowaZrealizowana,
      [staryKursBudowyZrealizowanej]
    ),
    null
  );
  assert.equal(
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowaBezPompy,
      [kursBudowyBezPompy]
    ),
    null
  );
  assert.equal(
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      utworzBudowe("BRAK-ILOSCI", { iloscBetonuLiczbaM3: null }),
      [utworzKurs("BRAK-ILOSCI", 1, 540, 555)]
    ),
    null
  );

  const wynik = pompy.utworzWynikSilnikaPomp(
    [budowaZero, budowaBezPompy],
    [],
    { trybPomp: "oblicz-potrzebne" },
    [staryKursBudowyZero, kursBudowyBezPompy]
  );

  assert.equal(wynik.wynikiBudow.length, 1);
  assert.equal(wynik.wynikiBudow[0].idBudowy, "ZERO");
  assert.equal(wynik.wynikiBudow[0].planowaneOknoBetonowania, null);
  assert.equal(wynik.wynikiBudow[0].okresZajetosci, null);
}

function sprawdzNieprawidloweDane(pompy) {
  const budowa = utworzBudowe("BLEDNE-CZASY", {
    iloscBetonuLiczbaM3: 8
  });

  assert.throws(function () {
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowa,
      [utworzKurs("BLEDNE-CZASY", 1, null, 495)]
    );
  }, /nie ma początku rozładunku pompy/i);
  assert.throws(function () {
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowa,
      [utworzKurs("BLEDNE-CZASY", 2, 480, "  ")]
    );
  }, /nie ma końca rozładunku pompy/i);
  assert.throws(function () {
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowa,
      [utworzKurs("BLEDNE-CZASY", 3, "niepoprawny", 495)]
    );
  }, /nie ma początku rozładunku pompy/i);
  assert.throws(function () {
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      budowa,
      [utworzKurs("BLEDNE-CZASY", 4, 500, 500)]
    );
  }, /musi kończyć rozładunek pompy później/i);
  assert.throws(function () {
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      utworzBudowe("UJEMNA-ILOSC", { iloscBetonuLiczbaM3: -1 }),
      []
    );
  }, /ilość betonu.*nie może być mniejsza od 0/i);
  assert.throws(function () {
    pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
      utworzBudowe("BLEDNY-CZAS-POMPY", {
        iloscBetonuLiczbaM3: 8,
        czasPrzygotowaniaPompyRoboczyMinuty: -1
      }),
      [utworzKurs("BLEDNY-CZAS-POMPY", 1, 480, 495)]
    );
  }, /czas rozstawiania pompy.*nieujemną liczbę całkowitą/i);
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzJednaIWieleDostaw(pompy);
  sprawdzBudowyBezZajetosci(pompy);
  sprawdzNieprawidloweDane(pompy);

  console.log(
    "✓ Etap 4D.3: przypadki brzegowe okresu zajętości pompy są obsługiwane bezpiecznie."
  );
}

uruchomTesty();
