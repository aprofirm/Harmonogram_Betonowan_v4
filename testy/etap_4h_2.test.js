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
    "js/pompy/ograniczony_przydzial_pomp.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, wymaganyWysiegPompyMetry) {
  return {
    idBudowy: idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry || 32,
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
    zrodloCzasuPrzejazdu: "test-4h2"
  };
}

function sprawdzKaskadowePrzesunieciaJednejPompy(pompy) {
  const budowy = [
    utworzBudowe("A"),
    utworzBudowe("B"),
    utworzBudowe("C")
  ];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 490, 505),
    utworzKurs("C", 500, 515)
  ];
  const listaPomp = [utworzPompe("P-1")];
  const budowyPrzed = JSON.stringify(budowy);
  const kursyPrzed = JSON.stringify(kursy);
  const pompyPrzed = JSON.stringify(listaPomp);
  const opcje = { pobierzDanePrzejazdu: pobierzPrzejazdZero };

  const wynik = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    listaPomp,
    kursy,
    1,
    opcje
  );
  const wynikPonowny = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    listaPomp,
    kursy,
    1,
    opcje
  );

  assert.equal(wynik.status, "obliczono");
  assert.equal(wynik.trybPomp, "mam-okreslona-liczbe");
  assert.equal(wynik.minimalnaLiczbaPomp, 3);
  assert.equal(wynik.liczbaDostepnychPomp, 1);
  assert.equal(wynik.liczbaAktywnychPompNaLiscie, 1);
  assert.equal(wynik.liczbaPompUwzglednionychWPrzydziale, 1);
  assert.equal(wynik.liczbaPrzydzielonychBetonowan, 3);
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, 0);
  assert.equal(wynik.liczbaOpoznionychBetonowan, 2);
  assert.equal(wynik.maksymalneOpoznienieBetonowaniaMinuty, 110);
  assert.equal(wynik.czyOgraniczenieWplyneloNaPlan, true);

  assert.equal(
    JSON.stringify(wynik.wynikiBudow.map(function (pozycja) {
      return pozycja.opoznienieZPowoduPompMinuty;
    })),
    JSON.stringify([0, 55, 110])
  );
  assert.equal(
    JSON.stringify(wynik.wynikiBudow.map(function (pozycja) {
      return pozycja.przydzialPompy.idPompy;
    })),
    JSON.stringify(["P-1", "P-1", "P-1"])
  );

  const przydzialy = wynik.stanPomp[0].przydzialy;
  assert.equal(przydzialy.length, 3);
  assert.equal(
    przydzialy[0].rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    przydzialy[1].rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci
  );
  assert.equal(
    przydzialy[1].rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    przydzialy[2].rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci
  );
  assert.equal(
    wynik.wynikiBudow[1].skutekNiedoboruPomp.rodzaj,
    "pompa-zajeta"
  );

  assert.equal(JSON.stringify(wynik), JSON.stringify(wynikPonowny));
  assert.equal(JSON.stringify(budowy), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
  assert.equal(JSON.stringify(listaPomp), pompyPrzed);
}

function sprawdzZeroPomp(pompy) {
  const wynik = pompy.obliczOgraniczonyWynikPomp(
    [utworzBudowe("ZERO")],
    [utworzPompe("P-1")],
    [utworzKurs("ZERO", 480, 495)],
    0,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynik.minimalnaLiczbaPomp, 1);
  assert.equal(wynik.liczbaDostepnychPomp, 0);
  assert.equal(wynik.liczbaPompUwzglednionychWPrzydziale, 0);
  assert.equal(wynik.liczbaPrzydzielonychBetonowan, 0);
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, 1);
  assert.equal(wynik.stanPomp.length, 0);
  assert.equal(wynik.przydzieloneBetonowania.length, 0);
  assert.equal(wynik.wynikiBudow[0].przydzialPompy, null);
  assert.equal(
    wynik.wynikiBudow[0].powodBrakuPrzydzialu,
    "brak-dostepnych-pomp"
  );
  assert.equal(wynik.czyOgraniczenieWplyneloNaPlan, true);
}

function sprawdzLimityListyZasobow(pompy) {
  const budowy = [
    utworzBudowe("L1"),
    utworzBudowe("L2"),
    utworzBudowe("L3")
  ];
  const kursy = [
    utworzKurs("L1", 480, 495),
    utworzKurs("L2", 480, 495),
    utworzKurs("L3", 480, 495)
  ];
  const trzyAktywne = [
    utworzPompe("P-1"),
    utworzPompe("P-2"),
    utworzPompe("P-3")
  ];
  const wynikLimitu = pompy.przydzielOgraniczonaLiczbePompDoBudow(
    budowy,
    trzyAktywne,
    kursy,
    2,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynikLimitu.liczbaPompUwzglednionychWPrzydziale, 2);
  assert.equal(wynikLimitu.stanPomp.length, 2);
  assert.equal(
    JSON.stringify(wynikLimitu.stanPomp.map(function (stanPompy) {
      return stanPompy.idPompy;
    })),
    JSON.stringify(["P-1", "P-2"])
  );

  const tylkoDwieAktywne = [
    utworzPompe("P-1"),
    utworzPompe("P-2", { aktywna: false }),
    utworzPompe("P-3")
  ];
  const wynikAktywnych = pompy.przydzielOgraniczonaLiczbePompDoBudow(
    budowy,
    tylkoDwieAktywne,
    kursy,
    5,
    { pobierzDanePrzejazdu: pobierzPrzejazdZero }
  );

  assert.equal(wynikAktywnych.liczbaDostepnychPomp, 5);
  assert.equal(wynikAktywnych.liczbaAktywnychPompNaLiscie, 2);
  assert.equal(wynikAktywnych.liczbaPompUwzglednionychWPrzydziale, 2);
  assert.equal(wynikAktywnych.stanPomp.length, 2);
  assert.equal(
    JSON.stringify(wynikAktywnych.stanPomp.map(function (stanPompy) {
      return stanPompy.idPompy;
    })),
    JSON.stringify(["P-1", "P-3"])
  );
  assert.equal(
    wynikAktywnych.stanPomp.some(function (stanPompy) {
      return stanPompy.idPompy === "P-4" || stanPompy.idPompy === "P-5";
    }),
    false
  );
}

function sprawdzWalidacje(pompy) {
  const budowy = [utworzBudowe("W")];
  const kursy = [utworzKurs("W", 480, 495)];
  const listaPomp = [utworzPompe("P-1")];

  [-1, 1.5, ""].forEach(function (wartosc) {
    assert.throws(function () {
      pompy.przydzielOgraniczonaLiczbePompDoBudow(
        budowy,
        listaPomp,
        kursy,
        wartosc,
        { pobierzDanePrzejazdu: pobierzPrzejazdZero }
      );
    }, /nieujemną liczbę całkowitą/i);
  });
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  // Granica 4H.2: liczymy niezależny wynik pomp; kursy gruszek i StartRoboczy
  // pozostają bez zmian aż do wspólnego silnika zasobów w Etapie 5.
  const html = wczytaj("index.html");
  assert.match(
    html,
    /js\/pompy\/minimalna_liczba_pomp\.js[\s\S]*js\/pompy\/ograniczony_przydzial_pomp\.js/
  );

  sprawdzKaskadowePrzesunieciaJednejPompy(pompy);
  sprawdzZeroPomp(pompy);
  sprawdzLimityListyZasobow(pompy);
  sprawdzWalidacje(pompy);

  console.log(
    "✓ Etap 4H.2: ograniczony przydział nie tworzy dodatkowych pomp i wylicza kaskadowy skutek niedoboru."
  );
}

uruchomTesty();
