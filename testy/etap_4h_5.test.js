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

function utworzBudowe(idBudowy, dane) {
  return Object.assign({
    idBudowy: idBudowy,
    firma: "Firma " + idBudowy,
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32,
    czasDojazduRoboczyMinuty: 0,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  }, dane || {});
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
    zrodloCzasuPrzejazdu: "test-4h5"
  };
}

function utworzScenariuszTrzechNakladajacychSieBudow() {
  return {
    budowy: [
      utworzBudowe("A"),
      utworzBudowe("B"),
      utworzBudowe("C")
    ],
    kursy: [
      utworzKurs("A", 480, 495),
      utworzKurs("B", 490, 505),
      utworzKurs("C", 500, 515)
    ],
    pompy: [
      utworzPompe("P-1"),
      utworzPompe("P-2"),
      utworzPompe("P-3")
    ],
    opcje: { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  };
}

function pobierzOpoznienia(wynik) {
  return Array.from(wynik.wynikiBudow, function (pozycja) {
    return pozycja.opoznienieZPowoduPompMinuty;
  });
}

function pobierzIdPrzydzielonychPomp(wynik) {
  return Array.from(wynik.wynikiBudow, function (pozycja) {
    return pozycja.przydzialPompy ? pozycja.przydzialPompy.idPompy : null;
  });
}

function sprawdzBrakNakladaniaPracyJednejPompy(wynik) {
  wynik.stanPomp.forEach(function (stanPompy) {
    const przydzialy = Array.from(stanPompy.przydzialy || []);

    for (let indeksPrzydzialu = 1; indeksPrzydzialu < przydzialy.length; indeksPrzydzialu += 1) {
      const poprzedni = przydzialy[indeksPrzydzialu - 1].rzeczywistyOkresZajetosci;
      const biezacy = przydzialy[indeksPrzydzialu].rzeczywistyOkresZajetosci;

      assert.ok(
        poprzedni.minutaZakonczeniaZajetosci <= biezacy.minutaRozpoczeciaZajetosci,
        "Jedna pompa nie może mieć nakładających się rzeczywistych okresów zajętości."
      );
    }
  });
}

function sprawdzFloteWystarczajaca(pompy) {
  const scenariusz = utworzScenariuszTrzechNakladajacychSieBudow();
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    scenariusz.budowy,
    scenariusz.pompy,
    scenariusz.kursy,
    3,
    scenariusz.opcje
  );

  assert.equal(wynik.statusFlotyPomp, "flota-wystarczajaca");
  assert.equal(wynik.minimalnaLiczbaPomp, 3);
  assert.equal(wynik.liczbaPompDostepnychDoPrzydzialu, 3);
  assert.equal(wynik.liczbaBrakujacychPomp, 0);
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, 0);
  assert.equal(wynik.liczbaOpoznionychBetonowan, 0);
  assert.deepEqual(pobierzOpoznienia(wynik), [0, 0, 0]);
  assert.deepEqual(pobierzIdPrzydzielonychPomp(wynik), ["P-1", "P-2", "P-3"]);
  assert.equal(wynik.jawneKonsekwencjePomp.czyPlanWymagaKorekty, false);
  sprawdzBrakNakladaniaPracyJednejPompy(wynik);
}

function sprawdzFloteZbytMala(pompy) {
  const scenariusz = utworzScenariuszTrzechNakladajacychSieBudow();
  const danePrzed = JSON.stringify({
    budowy: scenariusz.budowy,
    kursy: scenariusz.kursy,
    pompy: scenariusz.pompy
  });
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    scenariusz.budowy,
    scenariusz.pompy,
    scenariusz.kursy,
    1,
    scenariusz.opcje
  );

  assert.equal(wynik.statusFlotyPomp, "niedobor-pomp");
  assert.equal(wynik.minimalnaLiczbaPomp, 3);
  assert.equal(wynik.liczbaPompDostepnychDoPrzydzialu, 1);
  assert.equal(wynik.liczbaBrakujacychPomp, 2);
  assert.equal(wynik.liczbaPompUwzglednionychWPrzydziale, 1);
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, 0);
  assert.equal(wynik.liczbaOpoznionychBetonowan, 2);
  assert.equal(wynik.maksymalneOpoznienieBetonowaniaMinuty, 110);
  assert.deepEqual(pobierzOpoznienia(wynik), [0, 55, 110]);
  assert.deepEqual(pobierzIdPrzydzielonychPomp(wynik), ["P-1", "P-1", "P-1"]);
  assert.equal(wynik.jawneKonsekwencjePomp.czyPlanWymagaKorekty, true);
  assert.equal(
    JSON.stringify({
      budowy: scenariusz.budowy,
      kursy: scenariusz.kursy,
      pompy: scenariusz.pompy
    }),
    danePrzed
  );
  sprawdzBrakNakladaniaPracyJednejPompy(wynik);
}

function sprawdzZeroPomp(pompy) {
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    [utworzBudowe("ZERO")],
    [utworzPompe("P-1")],
    [utworzKurs("ZERO", 480, 495)],
    0,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynik.statusFlotyPomp, "brak-pomp");
  assert.equal(wynik.minimalnaLiczbaPomp, 1);
  assert.equal(wynik.liczbaPompDostepnychDoPrzydzialu, 0);
  assert.equal(wynik.liczbaPompUwzglednionychWPrzydziale, 0);
  assert.equal(wynik.liczbaPrzydzielonychBetonowan, 0);
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, 1);
  assert.equal(wynik.stanPomp.length, 0);
  assert.equal(wynik.przydzieloneBetonowania.length, 0);
  assert.equal(wynik.wynikiBudow[0].przydzialPompy, null);
  assert.equal(wynik.wynikiBudow[0].jawnySkutekPompy.status, "bez-przydzialu");
  assert.equal(wynik.wynikiBudow[0].jawnySkutekPompy.przydzielonaPompa, null);
  assert.equal(wynik.wynikiBudow[0].jawnySkutekPompy.przyczyna, "brak-dostepnych-pomp");
}

function sprawdzBledneDane(pompy) {
  const budowy = [utworzBudowe("BLEDNE")];
  const kursy = [utworzKurs("BLEDNE", 480, 495)];
  const listaPomp = [utworzPompe("P-1")];

  [-1, 1.5, ""].forEach(function (wartosc) {
    assert.throws(function () {
      pompy.obliczOgraniczonyWynikPomp(
        budowy,
        listaPomp,
        kursy,
        wartosc,
        { pobierzDanePrzejazdu: pobierzPrzejazdZero }
      );
    }, /nieujemną liczbę całkowitą/i);
  });

  assert.throws(function () {
    pompy.obliczOgraniczonyWynikPomp(
      [utworzBudowe("T1"), utworzBudowe("T2")],
      listaPomp,
      [utworzKurs("T1", 480, 495), utworzKurs("T2", 490, 505)],
      1,
      {
        pobierzDanePrzejazdu: function () {
          return "błędny format trasy";
        }
      }
    );
  }, /Dane przejazdu pompy muszą być obiektem/i);
}

function sprawdzStabilnoscPonownegoPrzeliczenia(pompy) {
  const scenariusz = utworzScenariuszTrzechNakladajacychSieBudow();
  const wynikPierwszy = pompy.obliczOgraniczonyWynikPomp(
    scenariusz.budowy,
    scenariusz.pompy,
    scenariusz.kursy,
    1,
    scenariusz.opcje
  );
  const wynikWystarczajacy = pompy.obliczOgraniczonyWynikPomp(
    scenariusz.budowy,
    scenariusz.pompy,
    scenariusz.kursy,
    3,
    scenariusz.opcje
  );
  const wynikPonowny = pompy.obliczOgraniczonyWynikPomp(
    scenariusz.budowy,
    scenariusz.pompy,
    scenariusz.kursy,
    1,
    scenariusz.opcje
  );

  assert.equal(JSON.stringify(wynikPierwszy), JSON.stringify(wynikPonowny));
  assert.deepEqual(pobierzOpoznienia(wynikWystarczajacy), [0, 0, 0]);
  assert.deepEqual(pobierzOpoznienia(wynikPonowny), [0, 55, 110]);
  sprawdzBrakNakladaniaPracyJednejPompy(wynikPonowny);
}

function sprawdzLimitAktywnejListy(pompy) {
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    [utworzBudowe("L1"), utworzBudowe("L2")],
    [utworzPompe("P-1"), utworzPompe("P-2", { aktywna: false })],
    [utworzKurs("L1", 480, 495), utworzKurs("L2", 480, 495)],
    2,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynik.liczbaPompDostepnychDoPrzydzialu, 1);
  assert.equal(wynik.liczbaPompUwzglednionychWPrzydziale, 1);
  assert.equal(wynik.stanPomp.length, 1);
  assert.equal(wynik.stanPomp[0].idPompy, "P-1");
  assert.equal(wynik.stanPomp.some(function (stanPompy) {
    return stanPompy.idPompy === "P-2";
  }), false);
  sprawdzBrakNakladaniaPracyJednejPompy(wynik);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzFloteWystarczajaca(pompy);
  sprawdzFloteZbytMala(pompy);
  sprawdzZeroPomp(pompy);
  sprawdzBledneDane(pompy);
  sprawdzStabilnoscPonownegoPrzeliczenia(pompy);
  sprawdzLimitAktywnejListy(pompy);

  console.log(
    "✓ Etap 4H.5: końcowy test trybu „mam X pomp” potwierdza flotę wystarczającą, niedobór, 0, błędne dane, stabilność i brak nakładania pracy jednej pompy."
  );
}

uruchomTesty();
