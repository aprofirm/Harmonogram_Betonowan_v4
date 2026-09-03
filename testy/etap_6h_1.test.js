"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomModul() {
  const sandbox = {
    window: {},
    Promise: Promise,
    Date: Date
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/lokalizacje/routing_budowa_budowa.js"),
    sandbox,
    { filename: "js/lokalizacje/routing_budowa_budowa.js" }
  );
  return sandbox.window.HarmonogramBetonowan.lokalizacje;
}

function doZwyklegoObiektu(wartosc) {
  return JSON.parse(JSON.stringify(wartosc));
}

function utworzBudowe(id, szerokosc, dlugosc, statusJakosci) {
  return {
    idLokalizacji: id,
    typLokalizacji: "budowa",
    daneRobocze: {
      statusJakosci: statusJakosci || "potwierdzona",
      zrodlo: "mapa",
      wspolrzedne: {
        szerokoscGeograficzna: szerokosc,
        dlugoscGeograficzna: dlugosc
      }
    }
  };
}

function sprawdzGotowoscIKierunki(mod) {
  const pierwsza = utworzBudowe("B-A", 50.80, 16.20);
  const druga = utworzBudowe("B-B", 50.90, 16.40);
  const stanPrzed = JSON.stringify({ pierwsza: pierwsza, druga: druga });

  const stan = mod.pobierzStanGotowosciTrasyBudowaBudowa(pierwsza, druga);
  const kierunki = mod.przygotujKierunkiTrasyBudowaBudowa(pierwsza, druga);

  assert.equal(stan.status, "gotowe");
  assert.equal(kierunki.status, "gotowe");
  assert.equal(kierunki.pierwszaDoDrugiej.kierunek, "miedzy-budowami");
  assert.equal(kierunki.pierwszaDoDrugiej.punktPoczatkowy.idLokalizacji, "B-A");
  assert.equal(kierunki.pierwszaDoDrugiej.punktDocelowy.idLokalizacji, "B-B");
  assert.equal(kierunki.drugaDoPierwszej.punktPoczatkowy.idLokalizacji, "B-B");
  assert.equal(kierunki.drugaDoPierwszej.punktDocelowy.idLokalizacji, "B-A");
  assert.equal(JSON.stringify({ pierwsza: pierwsza, druga: druga }), stanPrzed);
}

async function sprawdzObaKierunki(mod) {
  const pierwsza = utworzBudowe("B-A", 50.80, 16.20);
  const druga = utworzBudowe("B-B", 50.90, 16.40);
  const wywolania = [];
  const adapter = {
    wyznaczTrase: function (zapytanie) {
      wywolania.push(doZwyklegoObiektu(zapytanie));
      const start = zapytanie.punktPoczatkowy.wspolrzedne;
      const czyPierwszaDoDrugiej = start.dlugoscGeograficzna === 16.20;

      return Promise.resolve({
        status: "ok",
        dystansDrogowyMetry: czyPierwszaDoDrugiej ? 18400 : 19750,
        czasPrzejazduMinuty: czyPierwszaDoDrugiej ? 24 : 31,
        zrodlo: "mapa"
      });
    }
  };
  const data = "2026-09-03T06:00:00.000Z";

  const wynik = await mod.pobierzKierunkoweTrasyBudowaBudowa(
    pierwsza,
    druga,
    adapter,
    {
      dataWyznaczenia: data,
      profilPojazdu: { masaTony: 32, wysokoscMetry: 3.8 }
    }
  );

  assert.equal(wynik.status, "ok");
  assert.equal(wywolania.length, 2);
  assert.deepEqual(wywolania[0].punktPoczatkowy.wspolrzedne, {
    szerokoscGeograficzna: 50.80,
    dlugoscGeograficzna: 16.20
  });
  assert.deepEqual(wywolania[0].punktDocelowy.wspolrzedne, {
    szerokoscGeograficzna: 50.90,
    dlugoscGeograficzna: 16.40
  });
  assert.deepEqual(wywolania[1].punktPoczatkowy.wspolrzedne, {
    szerokoscGeograficzna: 50.90,
    dlugoscGeograficzna: 16.40
  });
  assert.deepEqual(wywolania[1].punktDocelowy.wspolrzedne, {
    szerokoscGeograficzna: 50.80,
    dlugoscGeograficzna: 16.20
  });
  assert.deepEqual(wywolania[0].profilPojazdu, {
    masaTony: 32,
    wysokoscMetry: 3.8
  });
  assert.deepEqual(wywolania[1].profilPojazdu, {
    masaTony: 32,
    wysokoscMetry: 3.8
  });

  assert.equal(wynik.pierwszaDoDrugiej.rodzajRelacji, "budowa-budowa");
  assert.equal(wynik.pierwszaDoDrugiej.kierunek, "miedzy-budowami");
  assert.equal(wynik.pierwszaDoDrugiej.dystansDrogowyMetry, 18400);
  assert.equal(wynik.pierwszaDoDrugiej.czasPrzejazduMinuty, 24);
  assert.equal(wynik.pierwszaDoDrugiej.dataWyznaczenia, data);
  assert.equal(wynik.drugaDoPierwszej.dystansDrogowyMetry, 19750);
  assert.equal(wynik.drugaDoPierwszej.czasPrzejazduMinuty, 31);
  assert.equal(wynik.drugaDoPierwszej.dataWyznaczenia, data);
  assert.notEqual(
    wynik.pierwszaDoDrugiej.czasPrzejazduMinuty,
    wynik.drugaDoPierwszej.czasPrzejazduMinuty
  );
}

async function sprawdzNiepotwierdzonaBudowe(mod) {
  let liczbaWywolan = 0;
  const wynik = await mod.pobierzKierunkoweTrasyBudowaBudowa(
    utworzBudowe("B-A", 50.80, 16.20),
    utworzBudowe("B-B", 50.90, 16.40, "niejednoznaczna"),
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return { status: "ok" };
      }
    }
  );

  assert.equal(wynik.status, "lokalizacja-budowy-niepotwierdzona");
  assert.equal(liczbaWywolan, 0);
  assert.equal(wynik.pierwszaDoDrugiej, null);
  assert.equal(wynik.drugaDoPierwszej, null);
}

async function sprawdzTaSamaBudowe(mod) {
  let liczbaWywolan = 0;
  const wynik = await mod.pobierzKierunkoweTrasyBudowaBudowa(
    utworzBudowe("B-A", 50.80, 16.20),
    utworzBudowe("B-A", 50.90, 16.40),
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return { status: "ok" };
      }
    }
  );

  assert.equal(wynik.status, "ta-sama-budowa");
  assert.equal(liczbaWywolan, 0);
}

async function sprawdzWalidacjeDrugiegoKierunku(mod) {
  let liczbaWywolan = 0;
  const wynik = await mod.pobierzKierunkoweTrasyBudowaBudowa(
    utworzBudowe("B-A", 50.80, 16.20),
    utworzBudowe("B-B", 50.90, 16.40),
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return {
          status: "ok",
          dystansDrogowyMetry: liczbaWywolan === 1 ? 10000 : -1,
          czasPrzejazduMinuty: 20,
          zrodlo: "mapa"
        };
      }
    },
    { dataWyznaczenia: "2026-09-03T06:00:00.000Z" }
  );

  assert.equal(liczbaWywolan, 2);
  assert.equal(wynik.status, "niepoprawny-wynik-trasy");
  assert.equal(wynik.relacjaBledu, "druga-do-pierwszej");
  assert.equal(wynik.pierwszaDoDrugiej, null);
  assert.equal(wynik.drugaDoPierwszej, null);
}

async function sprawdzBladPierwszegoKierunku(mod) {
  let liczbaWywolan = 0;
  const wynik = await mod.pobierzKierunkoweTrasyBudowaBudowa(
    utworzBudowe("B-A", 50.80, 16.20),
    utworzBudowe("B-B", 50.90, 16.40),
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return {
          status: "timeout",
          komunikatOperatora: "Przekroczono czas oczekiwania.",
          czyPonowicPozniej: true
        };
      }
    }
  );

  assert.equal(liczbaWywolan, 1);
  assert.equal(wynik.status, "timeout");
  assert.equal(wynik.relacjaBledu, "pierwsza-do-drugiej");
  assert.equal(wynik.czyPonowicPozniej, true);
}

async function sprawdzBrakAdaptera(mod) {
  const wynik = await mod.pobierzKierunkoweTrasyBudowaBudowa(
    utworzBudowe("B-A", 50.80, 16.20),
    utworzBudowe("B-B", 50.90, 16.40),
    null
  );

  assert.equal(wynik.status, "brak-adaptera-routingu");
  assert.equal(wynik.pierwszaDoDrugiej, null);
  assert.equal(wynik.drugaDoPierwszej, null);
}

function sprawdzGraniceModulu() {
  const kod = wczytaj("js/lokalizacje/routing_budowa_budowa.js");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.doesNotMatch(kod, /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization/i);
  assert.doesNotMatch(kod, /aplikacja\.pompy|czasPrzejazduRoboczyMinuty\s*=/i);
  assert.match(stan, /`js\/lokalizacje\/routing_budowa_budowa\.js` realizuje 6H\.1/);
  assert.match(stan, /Routing `A → B` oraz `B → A` jest wywoływany osobno/);
}

(async function () {
  const mod = uruchomModul();
  sprawdzGotowoscIKierunki(mod);
  await sprawdzObaKierunki(mod);
  await sprawdzNiepotwierdzonaBudowe(mod);
  await sprawdzTaSamaBudowe(mod);
  await sprawdzWalidacjeDrugiegoKierunku(mod);
  await sprawdzBladPierwszegoKierunku(mod);
  await sprawdzBrakAdaptera(mod);
  sprawdzGraniceModulu();
  console.log(
    "OK — 6H.1 wyznacza niezależne trasy A → B i B → A pomiędzy potwierdzonymi budowami bez sprzęgania z silnikiem pomp."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
