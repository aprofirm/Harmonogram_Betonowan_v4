"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAplikacje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Promise: Promise,
    Date: Date,
    JSON: JSON,
    Error: Error,
    Number: Number,
    String: String,
    Boolean: Boolean,
    Object: Object,
    Array: Array
  };
  vm.createContext(kontekst);

  [
    "js/budowy/budowy.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/kontrakt_trasy_kierunkowej.js",
    "js/lokalizacje/routing_wezel_budowa.js",
    "js/lokalizacje/lokalizacje.js",
    "js/lokalizacje/wartosci_trasy_wezel_budowa.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function doZwyklegoObiektu(wartosc) {
  return JSON.parse(JSON.stringify(wartosc));
}

function przygotujBudowe(aplikacja, idBudowy) {
  aplikacja.lokalizacje.ustawAktywnyWezel({
    nazwa: "Węzeł testowy",
    szerokoscGeograficzna: 50.847,
    dlugoscGeograficzna: 16.319
  });

  const budowa = aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa testowa",
    startPlanowany: "08:00",
    iloscBetonuM3: "8"
  }, 2);

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
    Object.assign({}, budowa.modelLokalizacji, {
      daneRobocze: {
        adres: { tekst: "Adres testowy 1" },
        wspolrzedne: {
          szerokoscGeograficzna: 50.812,
          dlugoscGeograficzna: 16.284
        },
        statusJakosci: "potwierdzona",
        zrodlo: "mapa",
        czyKorektaReczna: true
      }
    })
  );

  return budowa;
}

function utworzAdapter(dane) {
  const wyniki = dane || {};

  return {
    wyznaczTrase: function (zapytanie) {
      const start = zapytanie.punktPoczatkowy.wspolrzedne;
      const czyDojazd = Number(start.dlugoscGeograficzna) === 16.319;
      const kierunek = czyDojazd ? wyniki.doBudowy : wyniki.doWezla;

      return Promise.resolve(Object.assign({
        status: "ok",
        zrodlo: "mapa"
      }, kierunek));
    }
  };
}

async function sprawdzPierwszyAutomatZasilaWarstwy(aplikacja) {
  const budowa = przygotujBudowe(aplikacja, "B-6G3-A");
  const wynik = await aplikacja.lokalizacje.pobierzIZapiszAutomatycznaTraseWezelBudowa(
    budowa,
    utworzAdapter({
      doBudowy: { dystansDrogowyMetry: 18450, czasPrzejazduMinuty: 26.5 },
      doWezla: { dystansDrogowyMetry: 19120, czasPrzejazduMinuty: 29 }
    }),
    { dataWyznaczenia: "2026-09-03T06:00:00.000Z" }
  );

  assert.equal(wynik.status, "zapisano-wynik-automatyczny");
  assert.equal(wynik.czyZapisano, true);
  assert.equal(wynik.doBudowy.czyZastosowanoDoRoboczej, true);
  assert.equal(wynik.doWezla.czyZastosowanoDoRoboczej, true);

  assert.equal(
    budowa.modelTrasyDojazdu.daneAutomatyczne.dystansDrogowyMetry,
    18450
  );
  assert.equal(
    budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty,
    26.5
  );
  assert.equal(
    budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty,
    26.5
  );
  assert.equal(
    budowa.modelTrasyPowrotu.daneAutomatyczne.dystansDrogowyMetry,
    19120
  );
  assert.equal(budowa.modelTrasyPowrotu.daneRobocze.czasPrzejazduMinuty, 29);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 26.5);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 29);
  assert.equal(budowa.zrodloCzasuDojazdu, "mapa");
  assert.equal(budowa.zrodloCzasuPowrotu, "mapa");

  const stan = aplikacja.lokalizacje.pobierzStanWartosciTrasyBudowy(budowa);
  assert.equal(stan.doBudowy.zrodloRobocze, "mapa");
  assert.equal(stan.doBudowy.zrodloAutomatyczne, "mapa");
  assert.equal(stan.doBudowy.czyMoznaPrzywrocicAutomatyczna, false);
}

async function sprawdzRecznaKorektaMaPierwszenstwo(aplikacja) {
  const budowa = przygotujBudowe(aplikacja, "B-6G3-B");

  await aplikacja.lokalizacje.pobierzIZapiszAutomatycznaTraseWezelBudowa(
    budowa,
    utworzAdapter({
      doBudowy: { dystansDrogowyMetry: 18000, czasPrzejazduMinuty: 26 },
      doWezla: { dystansDrogowyMetry: 19000, czasPrzejazduMinuty: 29 }
    }),
    { dataWyznaczenia: "2026-09-03T06:05:00.000Z" }
  );

  aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    40
  );

  const wynik = await aplikacja.lokalizacje.pobierzIZapiszAutomatycznaTraseWezelBudowa(
    budowa,
    utworzAdapter({
      doBudowy: { dystansDrogowyMetry: 17500, czasPrzejazduMinuty: 22 },
      doWezla: { dystansDrogowyMetry: 18800, czasPrzejazduMinuty: 24 }
    }),
    { dataWyznaczenia: "2026-09-03T06:10:00.000Z" }
  );

  assert.equal(wynik.doBudowy.czyZachowanoWartoscRobocza, true);
  assert.equal(wynik.doBudowy.czyChronionaWartoscRobocza, true);
  assert.equal(wynik.doWezla.czyZastosowanoDoRoboczej, true);

  assert.equal(budowa.czasDojazduRoboczyMinuty, 40);
  assert.equal(budowa.zrodloCzasuDojazdu, "reczny");
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty, 40);
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czyKorektaReczna, true);
  assert.equal(
    budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty,
    22
  );
  assert.equal(
    budowa.modelTrasyDojazdu.daneAutomatyczne.dystansDrogowyMetry,
    17500
  );

  assert.equal(budowa.czasPowrotuRoboczyMinuty, 24);
  assert.equal(budowa.zrodloCzasuPowrotu, "mapa");
  assert.equal(budowa.modelTrasyPowrotu.daneRobocze.czasPrzejazduMinuty, 24);

  const stan = aplikacja.lokalizacje.pobierzStanWartosciTrasyBudowy(budowa);
  assert.equal(stan.doBudowy.czasRoboczyMinuty, 40);
  assert.equal(stan.doBudowy.czasAutomatycznyMinuty, 22);
  assert.equal(stan.doBudowy.zrodloRobocze, "reczny");
  assert.equal(stan.doBudowy.zrodloAutomatyczne, "mapa");
  assert.equal(stan.doBudowy.czyMoznaPrzywrocicAutomatyczna, true);

  const przywrocenie = aplikacja.lokalizacje.przywrocAutomatycznaTraseBudowy(
    budowa,
    "do-budowy"
  );

  assert.equal(przywrocenie.status, "przywrocono-wartosc-automatyczna");
  assert.equal(przywrocenie.czyPrzywrocono, true);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 22);
  assert.equal(budowa.zrodloCzasuDojazdu, "mapa");
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czyKorektaReczna, false);
  assert.equal(
    aplikacja.lokalizacje.pobierzStanWartosciTrasyBudowy(budowa)
      .doBudowy.czyMoznaPrzywrocicAutomatyczna,
    false
  );
}

function sprawdzBrakAutomatuNieZmieniaBudowy(aplikacja) {
  const budowa = przygotujBudowe(aplikacja, "B-6G3-C");
  aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    31
  );
  const stanPrzed = JSON.stringify(budowa);
  const wynik = aplikacja.lokalizacje.przywrocAutomatycznaTraseBudowy(
    budowa,
    "oba"
  );

  assert.equal(wynik.status, "brak-wartosci-automatycznej");
  assert.equal(wynik.czyPrzywrocono, false);
  assert.equal(JSON.stringify(budowa), stanPrzed);
}

async function sprawdzBladRoutinguNieZmieniaWarstw(aplikacja) {
  const budowa = przygotujBudowe(aplikacja, "B-6G3-D");
  aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    33
  );
  const stanPrzed = JSON.stringify(budowa);

  const wynik = await aplikacja.lokalizacje.pobierzIZapiszAutomatycznaTraseWezelBudowa(
    budowa,
    {
      wyznaczTrase: function () {
        return Promise.resolve({
          status: "timeout",
          komunikatOperatora: "Przekroczono czas oczekiwania.",
          czyPonowicPozniej: true
        });
      }
    }
  );

  assert.equal(wynik.status, "timeout");
  assert.equal(wynik.czyZapisano, false);
  assert.equal(JSON.stringify(budowa), stanPrzed);
}

function sprawdzIntegracjePrzegladarkowa() {
  const index = wczytaj("index.html");
  const kod = wczytaj("js/lokalizacje/wartosci_trasy_wezel_budowa.js");
  const pozycjaModelu = index.indexOf("js/lokalizacje/model_lokalizacji_i_trasy.js");
  const pozycjaKontraktu = index.indexOf("js/lokalizacje/kontrakt_trasy_kierunkowej.js");
  const pozycjaRoutingu = index.indexOf("js/lokalizacje/routing_wezel_budowa.js");
  const pozycjaBramy = index.indexOf("js/lokalizacje/lokalizacje.js");
  const pozycjaWartosci = index.indexOf("js/lokalizacje/wartosci_trasy_wezel_budowa.js");

  assert.ok(pozycjaModelu >= 0);
  assert.ok(pozycjaKontraktu > pozycjaModelu);
  assert.ok(pozycjaRoutingu > pozycjaKontraktu);
  assert.ok(pozycjaBramy > pozycjaRoutingu);
  assert.ok(pozycjaWartosci > pozycjaBramy);

  assert.doesNotMatch(kod, /api\.heigit\.org|openrouteservice|Authorization/i);
  assert.doesNotMatch(kod, /fetch\s*\(/i);
  assert.doesNotMatch(
    kod,
    /czasDojazduRoboczyMinuty\s*=\s*[^=]|czasPowrotuRoboczyMinuty\s*=\s*[^=]/i
  );
}

async function uruchomTest() {
  const aplikacja = uruchomAplikacje();

  await sprawdzPierwszyAutomatZasilaWarstwy(aplikacja);
  await sprawdzRecznaKorektaMaPierwszenstwo(aplikacja);
  sprawdzBrakAutomatuNieZmieniaBudowy(aplikacja);
  await sprawdzBladRoutinguNieZmieniaWarstw(aplikacja);
  sprawdzIntegracjePrzegladarkowa();

  console.log(
    "OK — 6G.3 zapisuje wynik mapy jako dane automatyczne, chroni ręczne wartości i pozwala świadomie przywrócić automat."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
