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
  const sandbox = { window: {} };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/lokalizacje/kontrakt_trasy_kierunkowej.js"),
    sandbox,
    { filename: "kontrakt_trasy_kierunkowej.js" }
  );
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

function sprawdzWarunkiUruchomienia(mod) {
  const wezel = utworzWezel();
  const budowa = utworzLokalizacjeBudowy();

  assert.equal(mod.czyMoznaWyznaczycTraseWezelBudowa(wezel, budowa), true);

  const niepotwierdzona = utworzLokalizacjeBudowy();
  niepotwierdzona.daneRobocze.statusJakosci = "niejednoznaczna";
  assert.equal(
    mod.pobierzStanGotowosciTrasyWezelBudowa(wezel, niepotwierdzona).status,
    "lokalizacja-budowy-niepotwierdzona"
  );

  const bezWspolrzednychBudowy = utworzLokalizacjeBudowy();
  bezWspolrzednychBudowy.daneRobocze.wspolrzedne = null;
  assert.equal(
    mod.pobierzStanGotowosciTrasyWezelBudowa(
      wezel,
      bezWspolrzednychBudowy
    ).status,
    "brak-wspolrzednych-budowy"
  );

  const bezWspolrzednychWezla = utworzWezel();
  bezWspolrzednychWezla.modelLokalizacji.daneRobocze.wspolrzedne = null;
  assert.equal(
    mod.pobierzStanGotowosciTrasyWezelBudowa(
      bezWspolrzednychWezla,
      budowa
    ).status,
    "brak-wspolrzednych-wezla"
  );
}

function sprawdzKierunkiIPunkty(mod) {
  const wezel = utworzWezel();
  const budowa = utworzLokalizacjeBudowy();
  const stanPrzed = JSON.stringify({ wezel: wezel, budowa: budowa });
  const przygotowanie = mod.przygotujKierunkiTrasyWezelBudowa(wezel, budowa);

  assert.equal(przygotowanie.status, "gotowe");
  assert.equal(przygotowanie.doBudowy.kierunek, "do-budowy");
  assert.equal(przygotowanie.doWezla.kierunek, "do-wezla");
  assert.equal(przygotowanie.doBudowy.punktPoczatkowy.idLokalizacji, "W-01");
  assert.equal(przygotowanie.doBudowy.punktDocelowy.idLokalizacji, "B-001");
  assert.equal(przygotowanie.doWezla.punktPoczatkowy.idLokalizacji, "B-001");
  assert.equal(przygotowanie.doWezla.punktDocelowy.idLokalizacji, "W-01");
  assert.deepEqual(
    doZwyklegoObiektu(przygotowanie.doBudowy.punktPoczatkowy.wspolrzedne),
    { szerokoscGeograficzna: 50.847, dlugoscGeograficzna: 16.319 }
  );
  assert.deepEqual(
    doZwyklegoObiektu(przygotowanie.doBudowy.punktDocelowy.wspolrzedne),
    { szerokoscGeograficzna: 50.812, dlugoscGeograficzna: 16.284 }
  );
  assert.equal(JSON.stringify({ wezel: wezel, budowa: budowa }), stanPrzed);
}

function sprawdzPelnyWynikTrasy(mod) {
  const przygotowanie = mod.przygotujKierunkiTrasyWezelBudowa(
    utworzWezel(),
    utworzLokalizacjeBudowy()
  );
  const data = "2026-09-03T04:20:00.000Z";
  const doBudowy = mod.utworzWynikKierunkowejTrasyWezelBudowa({
    kierunek: przygotowanie.doBudowy.kierunek,
    punktPoczatkowy: przygotowanie.doBudowy.punktPoczatkowy,
    punktDocelowy: przygotowanie.doBudowy.punktDocelowy,
    dystansDrogowyMetry: 18450,
    czasPrzejazduMinuty: 26.5,
    zrodlo: "mapa",
    dataWyznaczenia: data
  });
  const doWezla = mod.utworzWynikKierunkowejTrasyWezelBudowa({
    kierunek: przygotowanie.doWezla.kierunek,
    punktPoczatkowy: przygotowanie.doWezla.punktPoczatkowy,
    punktDocelowy: przygotowanie.doWezla.punktDocelowy,
    dystansDrogowyMetry: 19120,
    czasPrzejazduMinuty: 29,
    zrodlo: "mapa",
    dataWyznaczenia: data
  });

  assert.equal(doBudowy.wersjaKontraktu, 1);
  assert.equal(doBudowy.rodzajRelacji, "wezel-budowa");
  assert.equal(doBudowy.kierunek, "do-budowy");
  assert.equal(doBudowy.dystansDrogowyMetry, 18450);
  assert.equal(doBudowy.czasPrzejazduMinuty, 26.5);
  assert.equal(doBudowy.zrodlo, "mapa");
  assert.equal(doBudowy.dataWyznaczenia, data);

  assert.equal(doWezla.kierunek, "do-wezla");
  assert.equal(doWezla.dystansDrogowyMetry, 19120);
  assert.equal(doWezla.czasPrzejazduMinuty, 29);
  assert.notEqual(doBudowy.czasPrzejazduMinuty, doWezla.czasPrzejazduMinuty);
  assert.notEqual(doBudowy.dystansDrogowyMetry, doWezla.dystansDrogowyMetry);
}

function sprawdzWalidacje(mod) {
  const przygotowanie = mod.przygotujKierunkiTrasyWezelBudowa(
    utworzWezel(),
    utworzLokalizacjeBudowy()
  );
  const daneBazowe = {
    punktPoczatkowy: przygotowanie.doBudowy.punktPoczatkowy,
    punktDocelowy: przygotowanie.doBudowy.punktDocelowy,
    dystansDrogowyMetry: 1000,
    czasPrzejazduMinuty: 5,
    zrodlo: "mapa",
    dataWyznaczenia: "2026-09-03T04:20:00.000Z"
  };

  assert.throws(
    function () {
      mod.utworzWynikKierunkowejTrasyWezelBudowa(
        Object.assign({}, daneBazowe, { dystansDrogowyMetry: -1 })
      );
    },
    /Dystans drogowy.*nie mniejszą niż 0/i
  );
  assert.throws(
    function () {
      mod.utworzWynikKierunkowejTrasyWezelBudowa(
        Object.assign({}, daneBazowe, { czasPrzejazduMinuty: null })
      );
    },
    /Czas przejazdu.*poprawną liczbę/i
  );
  assert.throws(
    function () {
      mod.utworzWynikKierunkowejTrasyWezelBudowa(
        Object.assign({}, daneBazowe, { dataWyznaczenia: "nie-data" })
      );
    },
    /poprawnej daty/i
  );
  assert.throws(
    function () {
      mod.utworzWynikKierunkowejTrasyWezelBudowa(
        Object.assign({}, daneBazowe, { kierunek: "do-wezla" })
      );
    },
    /Kierunek trasy.*nie zgadza się/i
  );
  assert.throws(
    function () {
      const zlyPunkt = doZwyklegoObiektu(daneBazowe.punktPoczatkowy);
      zlyPunkt.wspolrzedne.dlugoscGeograficzna = null;
      mod.utworzWynikKierunkowejTrasyWezelBudowa(
        Object.assign({}, daneBazowe, { punktPoczatkowy: zlyPunkt })
      );
    },
    /długość geograficzna.*poprawną liczbę/i
  );
  assert.throws(
    function () {
      mod.utworzWynikKierunkowejTrasyWezelBudowa(
        Object.assign({}, daneBazowe, { zrodlo: "konkretny-dostawca" })
      );
    },
    /rozpoznanego źródła/i
  );
}

function sprawdzGraniceZmiany(mod) {
  const kod = wczytaj("js/lokalizacje/kontrakt_trasy_kierunkowej.js");

  assert.equal(mod.WERSJA_KONTRAKTU_KIERUNKOWEJ_TRASY, 1);
  assert.doesNotMatch(kod, /fetch\s*\(|api\.heigit\.org|openrouteservice/i);
  assert.doesNotMatch(kod, /czasDojazduMinuty\s*=|czasPowrotuMinuty\s*=/i);
}

(function () {
  const mod = uruchomModul();
  sprawdzWarunkiUruchomienia(mod);
  sprawdzKierunkiIPunkty(mod);
  sprawdzPelnyWynikTrasy(mod);
  sprawdzWalidacje(mod);
  sprawdzGraniceZmiany(mod);
  console.log(
    "OK — 6G.1 definiuje kierunkowy kontrakt węzeł ↔ budowa z punktami, dystansem, czasem, źródłem i datą bez nadpisywania danych roboczych."
  );
})();
