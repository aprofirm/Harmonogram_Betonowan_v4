"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajModulyPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, rodzajRozladunku) {
  return {
    idBudowy: idBudowy,
    firma: "Firma " + idBudowy,
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    rodzajRozladunku: rodzajRozladunku || "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32,
    czasDojazduRoboczyMinuty: 0,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  };
}

function utworzKurs(idBudowy, minutaStartu, minutaKonca) {
  return {
    idKursu: "KURS-" + idBudowy,
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: minutaStartu,
    minutaZakonczeniaRozladunku: minutaKonca
  };
}

function utworzPompe(idPompy, dane) {
  return Object.assign({
    idPompy: idPompy,
    nazwa: idPompy,
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "",
    wysiegMetry: 32
  }, dane || {});
}

function pobierzPrzejazdZero() {
  return {
    czasPrzejazduMinuty: 0,
    zrodloCzasuPrzejazdu: "test-4h3"
  };
}

function sprawdzJawnyNiedobor(pompy) {
  const budowy = [utworzBudowe("A"), utworzBudowe("B"), utworzBudowe("C")];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 490, 505),
    utworzKurs("C", 500, 515)
  ];
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    [utworzPompe("P-1")],
    kursy,
    1,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynik.statusFlotyPomp, "niedobor-pomp");
  assert.equal(wynik.liczbaPompDostepnychDoPrzydzialu, 1);
  assert.equal(wynik.liczbaBrakujacychPomp, 2);
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynik.jawneKonsekwencjePomp)),
    {
      statusFlotyPomp: "niedobor-pomp",
      liczbaPotrzebnychPomp: 3,
      liczbaPompZadeklarowanych: 1,
      liczbaPompAktywnychNaLiscie: 1,
      liczbaPompDostepnychDoPrzydzialu: 1,
      liczbaBrakujacychPomp: 2,
      liczbaBudowBezPrzydzialu: 0,
      liczbaBudowPrzesunietych: 2,
      maksymalnePrzesuniecieMinuty: 110,
      czyPlanWymagaKorekty: true
    }
  );

  assert.equal(wynik.wynikiBudow[0].jawnySkutekPompy.status, "zgodnie-z-planem");
  assert.equal(wynik.wynikiBudow[0].jawnySkutekPompy.przydzielonaPompa.idPompy, "P-1");
  assert.equal(wynik.wynikiBudow[0].jawnySkutekPompy.przesuniecieStartuMinuty, 0);

  const drugaBudowa = wynik.wynikiBudow[1];
  assert.equal(drugaBudowa.pierwotnyPlanPompy.startPlanowany, "08:00");
  assert.equal(drugaBudowa.pierwotnyPlanPompy.startZadany, "08:00");
  assert.equal(drugaBudowa.pierwotnyPlanPompy.startRoboczyPrzedPompa, "08:00");
  assert.equal(drugaBudowa.pierwotnyPlanPompy.minutaPlanowanegoStartuBetonowania, 490);
  assert.equal(drugaBudowa.jawnySkutekPompy.status, "przesunieta");
  assert.equal(drugaBudowa.jawnySkutekPompy.przydzielonaPompa.idPompy, "P-1");
  assert.equal(drugaBudowa.jawnySkutekPompy.minutaMozliwegoStartuBetonowania, 545);
  assert.equal(drugaBudowa.jawnySkutekPompy.przesuniecieStartuMinuty, 55);
  assert.equal(drugaBudowa.jawnySkutekPompy.przyczyna, "pompa-zajeta");
  assert.equal(
    drugaBudowa.jawnySkutekPompy.przyczynyOgraniczenia.some(function (przyczyna) {
      return przyczyna.rodzaj === "pompa-zajeta";
    }),
    true
  );
}

function sprawdzZeroPompBezFikcyjnegoPrzydzialu(pompy) {
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    [utworzBudowe("ZERO")],
    [utworzPompe("P-1")],
    [utworzKurs("ZERO", 480, 495)],
    0,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );
  const budowa = wynik.wynikiBudow[0];

  assert.equal(wynik.statusFlotyPomp, "brak-pomp");
  assert.equal(wynik.jawneKonsekwencjePomp.liczbaPotrzebnychPomp, 1);
  assert.equal(wynik.jawneKonsekwencjePomp.liczbaPompDostepnychDoPrzydzialu, 0);
  assert.equal(wynik.jawneKonsekwencjePomp.liczbaBrakujacychPomp, 1);
  assert.equal(budowa.przydzialPompy, null);
  assert.equal(budowa.jawnySkutekPompy.status, "bez-przydzialu");
  assert.equal(budowa.jawnySkutekPompy.przydzielonaPompa, null);
  assert.equal(budowa.jawnySkutekPompy.minutaMozliwegoStartuBetonowania, null);
  assert.equal(budowa.jawnySkutekPompy.przesuniecieStartuMinuty, null);
  assert.equal(budowa.jawnySkutekPompy.przyczyna, "brak-dostepnych-pomp");
  assert.deepEqual(
    JSON.parse(JSON.stringify(budowa.jawnySkutekPompy.powodyOdrzuceniaPomp)),
    ["brak-dostepnych-pomp"]
  );
}

function sprawdzRzeczywistaDostepnoscListy(pompy) {
  const budowy = [utworzBudowe("L1"), utworzBudowe("L2")];
  const kursy = [
    utworzKurs("L1", 480, 495),
    utworzKurs("L2", 480, 495)
  ];
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    [utworzPompe("P-1"), utworzPompe("P-2", { aktywna: false })],
    kursy,
    3,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynik.jawneKonsekwencjePomp.liczbaPompZadeklarowanych, 3);
  assert.equal(wynik.jawneKonsekwencjePomp.liczbaPompAktywnychNaLiscie, 1);
  assert.equal(wynik.jawneKonsekwencjePomp.liczbaPompDostepnychDoPrzydzialu, 1);
  assert.equal(wynik.jawneKonsekwencjePomp.liczbaBrakujacychPomp, 1);
  assert.equal(wynik.statusFlotyPomp, "niedobor-pomp");
}

function sprawdzFloteWystarczajacaIPustyPlan(pompy) {
  const wynikWystarczajacy = pompy.obliczOgraniczonyWynikPomp(
    [utworzBudowe("E1"), utworzBudowe("E2")],
    [utworzPompe("P-1"), utworzPompe("P-2")],
    [utworzKurs("E1", 480, 495), utworzKurs("E2", 480, 495)],
    2,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynikWystarczajacy.statusFlotyPomp, "flota-wystarczajaca");
  assert.equal(wynikWystarczajacy.liczbaBrakujacychPomp, 0);
  assert.equal(wynikWystarczajacy.jawneKonsekwencjePomp.czyPlanWymagaKorekty, false);

  const budowaBezPompy = utworzBudowe("NP", "taczka");
  const wynikBezPompowania = pompy.obliczOgraniczonyWynikPomp(
    [budowaBezPompy],
    [],
    [utworzKurs("NP", 480, 495)],
    0,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynikBezPompowania.statusFlotyPomp, "brak-budow-pompowanych");
  assert.equal(wynikBezPompowania.jawneKonsekwencjePomp.liczbaPotrzebnychPomp, 0);
  assert.equal(wynikBezPompowania.wynikiBudow.length, 0);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzJawnyNiedobor(pompy);
  sprawdzZeroPompBezFikcyjnegoPrzydzialu(pompy);
  sprawdzRzeczywistaDostepnoscListy(pompy);
  sprawdzFloteWystarczajacaIPustyPlan(pompy);

  console.log(
    "✓ Etap 4H.3: wynik jawnie pokazuje potrzebne i dostępne pompy, przydział, pierwotny plan, przesunięcie oraz brak przydziału przy 0 pomp."
  );
}

uruchomTesty();
