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
    window: {
      HarmonogramBetonowan: {
        pompy: {}
      }
    },
    Promise: Promise,
    Date: Date
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  [
    "js/pompy/edycja_przejazdow_pomp.js",
    "js/lokalizacje/routing_budowa_budowa.js",
    "js/lokalizacje/integracja_przejazdow_pomp.js"
  ].forEach(function (sciezka) {
    vm.runInContext(wczytaj(sciezka), sandbox, { filename: sciezka });
  });

  return sandbox.window.HarmonogramBetonowan;
}

function utworzBudowe(id, szerokosc, dlugosc) {
  return {
    idBudowy: id,
    modelLokalizacji: {
      idLokalizacji: id,
      typLokalizacji: "budowa",
      daneRobocze: {
        statusJakosci: "potwierdzona",
        zrodlo: "mapa",
        wspolrzedne: {
          szerokoscGeograficzna: szerokosc,
          dlugoscGeograficzna: dlugosc
        }
      }
    }
  };
}

function ustawPrzejazd(aplikacja, zBudowy, doBudowy, czas, zrodlo) {
  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    zBudowy,
    doBudowy.idBudowy,
    czas,
    zrodlo
  );
}

function sprawdzJawnyStanBrakuTrasy(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  const stan = aplikacja.lokalizacje.pobierzStanTrasPrzejazdowPomp(
    pierwsza,
    druga
  );

  assert.equal(stan.status, "brak-trasy");
  assert.equal(stan.czyObaKierunkiGotowe, false);
  assert.equal(stan.czyMoznaPracowacCzesciowoOffline, false);
  assert.equal(stan.czyMoznaWpisacRecznie, true);
  assert.equal(stan.pierwszaDoDrugiej.status, "brak-trasy");
  assert.equal(stan.pierwszaDoDrugiej.czyMoznaWpisacRecznie, true);
  assert.equal(stan.drugaDoPierwszej.status, "brak-trasy");
}

async function sprawdzPamiecBezInternetu(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  let liczbaWywolan = 0;

  ustawPrzejazd(aplikacja, pierwsza, druga, 22, "pamiec");
  ustawPrzejazd(aplikacja, druga, pierwsza, 25, "pamiec");

  const wynik = await aplikacja.lokalizacje.pobierzIZastosujTrasyPrzejazdowPomp(
    pierwsza,
    druga,
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        throw new Error("Internet nie powinien być potrzebny.");
      }
    }
  );

  assert.equal(liczbaWywolan, 0);
  assert.equal(wynik.status, "uzyto-biezacych-przejazdow-pomp");
  assert.equal(wynik.czyWywolanoMape, false);
  assert.equal(wynik.czyUzytoIstniejacychWartosci, true);
  assert.equal(wynik.stanTras.czyObaKierunkiGotowe, true);
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.zrodloCzasuPrzejazdu, "pamiec");
  assert.equal(
    aplikacja.lokalizacje.pobierzDanePrzejazduPompyBudowaBudowa(
      pierwsza,
      druga
    ).czasPrzejazduMinuty,
    22
  );
}

async function sprawdzZachowanyWynikMapyDzialaOffline(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);

  ustawPrzejazd(aplikacja, pierwsza, druga, 18, "mapa");
  ustawPrzejazd(aplikacja, druga, pierwsza, 20, "mapa");

  const wynik = await aplikacja.lokalizacje.pobierzIZastosujTrasyPrzejazdowPomp(
    pierwsza,
    druga,
    null
  );

  assert.equal(wynik.status, "uzyto-biezacych-przejazdow-pomp");
  assert.equal(wynik.czyWywolanoMape, false);
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.czyMoznaUzycOffline, true);
  assert.equal(wynik.stanTras.drugaDoPierwszej.czyMoznaUzycOffline, true);
}

async function sprawdzCzesciowyStanOffline(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);

  ustawPrzejazd(aplikacja, pierwsza, druga, 31, "reczny");

  const wynik = await aplikacja.lokalizacje.pobierzIZastosujTrasyPrzejazdowPomp(
    pierwsza,
    druga,
    null
  );

  assert.equal(wynik.status, "brak-adaptera-routingu");
  assert.equal(wynik.czyWywolanoMape, false);
  assert.equal(wynik.czyMoznaWpisacRecznie, true);
  assert.equal(wynik.stanTras.czyMoznaPracowacCzesciowoOffline, true);
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.status, "gotowy");
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.czasPrzejazduMinuty, 31);
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.zrodloCzasuPrzejazdu, "reczny");
  assert.equal(wynik.stanTras.drugaDoPierwszej.status, "brak-trasy");
}

async function sprawdzBladSieciNieKasujeDanych(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  let liczbaWywolan = 0;

  ustawPrzejazd(aplikacja, pierwsza, druga, 29, "reczny");

  const wynik = await aplikacja.lokalizacje.pobierzIZastosujTrasyPrzejazdowPomp(
    pierwsza,
    druga,
    {
      wyznaczTrase: function () {
        liczbaWywolan += 1;
        return Promise.resolve({
          status: "brak-sieci",
          komunikatOperatora: "Brak połączenia z usługą mapową.",
          czyPonowicPozniej: true
        });
      }
    }
  );

  assert.equal(liczbaWywolan, 1);
  assert.equal(wynik.status, "brak-sieci");
  assert.equal(wynik.czyWywolanoMape, true);
  assert.equal(wynik.czyMoznaWpisacRecznie, true);
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.czasPrzejazduMinuty, 29);
  assert.equal(wynik.stanTras.pierwszaDoDrugiej.zrodloCzasuPrzejazdu, "reczny");
  assert.equal(wynik.stanTras.drugaDoPierwszej.status, "brak-trasy");
}

function sprawdzReczneUzupelnienieBraku(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);

  assert.equal(
    aplikacja.lokalizacje.pobierzDanePrzejazduPompyBudowaBudowa(
      pierwsza,
      druga
    ),
    null
  );

  ustawPrzejazd(aplikacja, pierwsza, druga, 17, "reczny");

  const dane = aplikacja.lokalizacje.pobierzDanePrzejazduPompyBudowaBudowa(
    pierwsza,
    druga
  );

  assert.equal(dane.czasPrzejazduMinuty, 17);
  assert.equal(dane.zrodloCzasuPrzejazdu, "reczny");
}

function sprawdzGraniceTrybuOffline() {
  const integracja = wczytaj("js/lokalizacje/integracja_przejazdow_pomp.js");
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");
  const panel = wczytaj("js/interfejs/przejazdy_pomp.js");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.doesNotMatch(
    integracja,
    /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization/i
  );
  assert.doesNotMatch(
    harmonogram,
    /pobierzIZastosujTrasyPrzejazdowPomp|wyznaczTrase\s*\(|api\.heigit\.org/i
  );
  assert.match(harmonogram, /przejazdyPompyMinuty/);
  assert.match(harmonogram, /"brak-trasy"/);
  assert.match(harmonogram, /brak czasu przejazdu pompy z poprzedniej budowy/);
  assert.match(panel, /pole-czasu-przejazdu-pompy/);
  assert.match(panel, /obslugaZmianyPrzejazduPompy/);
  assert.match(stan, /Punkt \*\*6H\*\* jest zakończony/);
  assert.match(stan, /Centralne przeliczanie harmonogramu nadal wyłącznie odczytuje `przejazdyPompyMinuty`/);
}

(async function () {
  const aplikacja = uruchomModuly();
  sprawdzJawnyStanBrakuTrasy(aplikacja);
  await sprawdzPamiecBezInternetu(aplikacja);
  await sprawdzZachowanyWynikMapyDzialaOffline(aplikacja);
  await sprawdzCzesciowyStanOffline(aplikacja);
  await sprawdzBladSieciNieKasujeDanych(aplikacja);
  sprawdzReczneUzupelnienieBraku(aplikacja);
  sprawdzGraniceTrybuOffline();
  console.log(
    "OK — 6H.3 zachowuje przejazdy offline, nie wymusza mapy przy znanych czasach i pozostawia jawny brak trasy do ręcznego uzupełnienia."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
