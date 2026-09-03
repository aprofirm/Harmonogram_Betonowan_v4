"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomModuly() {
  const sandbox = {
    window: {},
    Promise: Promise,
    Date: Date
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  [
    "js/lokalizacje/kontrakt_trasy_kierunkowej.js",
    "js/lokalizacje/routing_wezel_budowa.js"
  ].forEach(function (sciezka) {
    vm.runInContext(wczytaj(sciezka), sandbox, { filename: sciezka });
  });

  return sandbox.window.HarmonogramBetonowan.lokalizacje;
}

function doZwyklegoObiektu(wartosc) {
  return JSON.parse(JSON.stringify(wartosc));
}

function utworzWezel() {
  return {
    idWezla: "W-01",
    modelLokalizacji: {
      idLokalizacji: "W-01",
      typLokalizacji: "wezel",
      daneRobocze: {
        wspolrzedne: {
          szerokoscGeograficzna: 50.847,
          dlugoscGeograficzna: 16.319
        }
      }
    }
  };
}

function utworzLokalizacjeBudowy() {
  return {
    idLokalizacji: "B-001",
    typLokalizacji: "budowa",
    daneRobocze: {
      statusJakosci: "potwierdzona",
      zrodlo: "mapa",
      wspolrzedne: {
        szerokoscGeograficzna: 50.812,
        dlugoscGeograficzna: 16.284
      }
    }
  };
}

async function sprawdzObaKierunki(mod) {
  const wywolania = [];
  const wezel = utworzWezel();
  const budowa = utworzLokalizacjeBudowy();
  const stanPrzed = JSON.stringify({ wezel: wezel, budowa: budowa });
  const adapter = {
    wyznaczTrase: function (zapytanie) {
      wywolania.push(doZwyklegoObiektu(zapytanie));
      const start = zapytanie.punktPoczatkowy.wspolrzedne;
      const czyDojazd = start.dlugoscGeograficzna === 16.319;

      return Promise.resolve({
        status: "ok",
        dystansDrogowyMetry: czyDojazd ? 18450 : 19120,
        czasPrzejazduMinuty: czyDojazd ? 26.5 : 29,
        zrodlo: "mapa"
      });
    }
  };
  const data = "2026-09-03T05:00:00.000Z";
  const wynik = await mod.pobierzKierunkoweTrasyWezelBudowa(
    wezel,
    budowa,
    adapter,
    {
      dataWyznaczenia: data,
      profilPojazdu: { masaTony: 32, wysokoscMetry: 3.8 }
    }
  );

  assert.equal(wynik.status, "ok");
  assert.equal(wywolania.length, 2);
  assert.deepEqual(wywolania[0].punktPoczatkowy.wspolrzedne, {
    szerokoscGeograficzna: 50.847,
    dlugoscGeograficzna: 16.319
  });
  assert.deepEqual(wywolania[0].punktDocelowy.wspolrzedne, {
    szerokoscGeograficzna: 50.812,
    dlugoscGeograficzna: 16.284
  });
  assert.deepEqual(wywolania[1].punktPoczatkowy.wspolrzedne, {
    szerokoscGeograficzna: 50.812,
    dlugoscGeograficzna: 16.284
  });
  assert.deepEqual(wywolania[1].punktDocelowy.wspolrzedne, {
    szerokoscGeograficzna: 50.847,
    dlugoscGeograficzna: 16.319
  });
  assert.deepEqual(wywolania[0].profilPojazdu, {
    masaTony: 32,
    wysokoscMetry: 3.8
  });
  assert.deepEqual(wywolania[1].profilPojazdu, {
    masaTony: 32,
    wysokoscMetry: 3.8
  });

  assert.equal(wynik.doBudowy.kierunek, "do-budowy");
  assert.equal(wynik.doBudowy.dystansDrogowyMetry, 18450);
  assert.equal(wynik.doBudowy.czasPrzejazduMinuty, 26.5);
  assert.equal(wynik.doBudowy.dataWyznaczenia, data);
  assert.equal(wynik.doWezla.kierunek, "do-wezla");
  assert.equal(wynik.doWezla.dystansDrogowyMetry, 19120);
  assert.equal(wynik.doWezla.czasPrzejazduMinuty, 29);
  assert.equal(wynik.doWezla.dataWyznaczenia, data);
  assert.notEqual(
    wynik.doBudowy.czasPrzejazduMinuty,
    wynik.doWezla.czasPrzejazduMinuty
  );
  assert.equal(JSON.stringify({ wezel: wezel, budowa: budowa }), stanPrzed);
}

async function sprawdzBrakGotowosciNieWywolujeAdaptera(mod) {
  const budowa = utworzLokalizacjeBudowy();
  budowa.daneRobocze.statusJakosci = "niejednoznaczna";
  let liczbaWywolan = 0;

  const wynik = await mod.pobierzKierunkoweTrasyWezelBudowa(
    utworzWezel(),
    budowa,
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return { status: "ok" };
      }
    }
  );

  assert.equal(wynik.status, "lokalizacja-budowy-niepotwierdzona");
  assert.equal(liczbaWywolan, 0);
  assert.equal(wynik.doBudowy, null);
  assert.equal(wynik.doWezla, null);
}

async function sprawdzWalidacjeWyniku(mod) {
  let liczbaWywolan = 0;
  const wynik = await mod.pobierzKierunkoweTrasyWezelBudowa(
    utworzWezel(),
    utworzLokalizacjeBudowy(),
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
    { dataWyznaczenia: "2026-09-03T05:00:00.000Z" }
  );

  assert.equal(liczbaWywolan, 2);
  assert.equal(wynik.status, "niepoprawny-wynik-trasy");
  assert.equal(wynik.kierunekBledu, "do-wezla");
  assert.equal(wynik.doBudowy, null);
  assert.equal(wynik.doWezla, null);
  assert.match(wynik.komunikat, /Dystans drogowy/i);
}

async function sprawdzBladPierwszegoKierunkuZatrzymujeDrugi(mod) {
  let liczbaWywolan = 0;
  const wynik = await mod.pobierzKierunkoweTrasyWezelBudowa(
    utworzWezel(),
    utworzLokalizacjeBudowy(),
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return {
          status: "timeout",
          komunikatOperatora: "Przekroczono czas oczekiwania.",
          czyPonowicPozniej: true,
          statusHttp: null
        };
      }
    }
  );

  assert.equal(liczbaWywolan, 1);
  assert.equal(wynik.status, "timeout");
  assert.equal(wynik.kierunekBledu, "do-budowy");
  assert.equal(wynik.czyPonowicPozniej, true);
  assert.equal(wynik.doBudowy, null);
  assert.equal(wynik.doWezla, null);
}

async function sprawdzBrakAdaptera(mod) {
  const wynik = await mod.pobierzKierunkoweTrasyWezelBudowa(
    utworzWezel(),
    utworzLokalizacjeBudowy(),
    null
  );

  assert.equal(wynik.status, "brak-adaptera-routingu");
  assert.equal(wynik.doBudowy, null);
  assert.equal(wynik.doWezla, null);
}

function sprawdzGraniceModulu() {
  const kod = wczytaj("js/lokalizacje/routing_wezel_budowa.js");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.doesNotMatch(kod, /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization/i);
  assert.doesNotMatch(kod, /czasDojazduRoboczyMinuty\s*=|czasPowrotuRoboczyMinuty\s*=/i);
  assert.match(
    stan,
    /`js\/lokalizacje\/routing_wezel_budowa\.js` realizuje 6G\.2:/
  );
  assert.match(
    stan,
    /Błąd pierwszego kierunku zatrzymuje drugi/
  );
}

(async function () {
  const mod = uruchomModuly();
  await sprawdzObaKierunki(mod);
  await sprawdzBrakGotowosciNieWywolujeAdaptera(mod);
  await sprawdzWalidacjeWyniku(mod);
  await sprawdzBladPierwszegoKierunkuZatrzymujeDrugi(mod);
  await sprawdzBrakAdaptera(mod);
  sprawdzGraniceModulu();
  console.log(
    "OK — 6G.2 pobiera i waliduje oba kierunki węzeł ↔ budowa przez neutralny adapter bez nadpisywania wartości roboczych."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
