"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomModul(stanDoBudowy, stanDoWezla) {
  const pustaFunkcja = function () {};
  const sandbox = {
    window: {
      HarmonogramBetonowan: {
        lokalizacje: {
          pobierzStanWartosciTrasyBudowy: function () {
            return {
              doBudowy: stanDoBudowy,
              doWezla: stanDoWezla
            };
          }
        },
        interfejs: {
          pokazListeBudow: pustaFunkcja,
          pokazWynik: pustaFunkcja,
          pokazPrzywroconyPlan: pustaFunkcja,
          pokazUdanyImport: pustaFunkcja,
          pokazDodanaBudowe: pustaFunkcja,
          wyczyscPlan: pustaFunkcja
        }
      }
    }
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/interfejs/wynik_trasy_budowy.js"),
    sandbox,
    { filename: "js/interfejs/wynik_trasy_budowy.js" }
  );
  return sandbox.window.HarmonogramBetonowan;
}

function stanKierunku(dane) {
  return Object.assign({
    kierunek: "do-budowy",
    czasRoboczyMinuty: null,
    dystansRoboczyMetry: null,
    zrodloRobocze: "brak",
    czyKorektaReczna: false,
    czasAutomatycznyMinuty: null,
    dystansAutomatycznyMetry: null,
    zrodloAutomatyczne: "brak",
    czyMaWartoscAutomatyczna: false,
    czyMoznaPrzywrocicAutomatyczna: false
  }, dane || {});
}

function sprawdzGotowyWynikMapy() {
  const aplikacja = uruchomModul(
    stanKierunku({
      czasRoboczyMinuty: 21,
      dystansRoboczyMetry: 14000,
      zrodloRobocze: "mapa",
      czasAutomatycznyMinuty: 21,
      dystansAutomatycznyMetry: 14000,
      zrodloAutomatyczne: "mapa",
      czyMaWartoscAutomatyczna: true
    }),
    stanKierunku({ kierunek: "do-wezla" })
  );

  const wynik = aplikacja.interfejs.pobierzPrezentacjeTrasyBudowy(
    { idBudowy: "A" },
    "do-budowy"
  );

  assert.equal(wynik.status, "gotowa");
  assert.equal(wynik.czyWymagaUwagi, false);
  assert.equal(wynik.tekstRoboczy, "Robocza: 21 min · OpenMap");
  assert.equal(wynik.tekstAutomatyczny, "Automat: 21 min · 14,0 km · OpenMap");
  assert.equal(wynik.tekstStanu, "Trasa gotowa");
}

function sprawdzRecznaRozniSieOdAutomatu() {
  const aplikacja = uruchomModul(
    stanKierunku({
      czasRoboczyMinuty: 35,
      zrodloRobocze: "reczny",
      czyKorektaReczna: true,
      czasAutomatycznyMinuty: 21,
      dystansAutomatycznyMetry: 15350,
      zrodloAutomatyczne: "mapa",
      czyMaWartoscAutomatyczna: true,
      czyMoznaPrzywrocicAutomatyczna: true
    }),
    stanKierunku({ kierunek: "do-wezla" })
  );

  const wynik = aplikacja.interfejs.pobierzPrezentacjeTrasyBudowy(
    { idBudowy: "A" },
    "do-budowy"
  );

  assert.equal(wynik.status, "rozni-sie-od-automatu");
  assert.equal(wynik.czyWymagaUwagi, true);
  assert.equal(wynik.tekstRoboczy, "Robocza: 35 min · Ręcznie");
  assert.equal(wynik.tekstAutomatyczny, "Automat: 21 min · 15,4 km · OpenMap");
  assert.equal(wynik.tekstStanu, "Robocza różni się od automatu");
}

function sprawdzBrakCzasuRoboczego() {
  const aplikacja = uruchomModul(
    stanKierunku({
      czasAutomatycznyMinuty: 18,
      dystansAutomatycznyMetry: 850,
      zrodloAutomatyczne: "mapa",
      czyMaWartoscAutomatyczna: true,
      czyMoznaPrzywrocicAutomatyczna: true
    }),
    stanKierunku({ kierunek: "do-wezla" })
  );

  const wynik = aplikacja.interfejs.pobierzPrezentacjeTrasyBudowy(
    { idBudowy: "A" },
    "do-budowy"
  );

  assert.equal(wynik.status, "brak-czasu-roboczego");
  assert.equal(wynik.czyWymagaUwagi, true);
  assert.equal(wynik.tekstRoboczy, "Robocza: brak · Brak");
  assert.equal(wynik.tekstAutomatyczny, "Automat: 18 min · 850 m · OpenMap");
  assert.match(wynik.tekstStanu, /Wymaga uwagi/);
}

function sprawdzPamiecBezAutomatu() {
  const aplikacja = uruchomModul(
    stanKierunku({
      czasRoboczyMinuty: 24,
      zrodloRobocze: "pamiec"
    }),
    stanKierunku({ kierunek: "do-wezla" })
  );

  const wynik = aplikacja.interfejs.pobierzPrezentacjeTrasyBudowy(
    { idBudowy: "A" },
    "do-budowy"
  );

  assert.equal(wynik.status, "gotowa");
  assert.equal(wynik.tekstRoboczy, "Robocza: 24 min · Z pamięci");
  assert.equal(wynik.tekstAutomatyczny, "Automat: brak");
}

function sprawdzZrodloCsvIPowrot() {
  const aplikacja = uruchomModul(
    stanKierunku(),
    stanKierunku({
      kierunek: "do-wezla",
      czasRoboczyMinuty: 29,
      zrodloRobocze: "csv"
    })
  );

  const wynik = aplikacja.interfejs.pobierzPrezentacjeTrasyBudowy(
    { idBudowy: "A" },
    "do-wezla"
  );

  assert.equal(wynik.kierunek, "do-wezla");
  assert.equal(wynik.tekstRoboczy, "Robocza: 29 min · CSV");
}

function sprawdzGraniceEtapu() {
  const kod = wczytaj("js/interfejs/wynik_trasy_budowy.js");
  const index = wczytaj("index.html");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(kod, /pobierzStanWartosciTrasyBudowy/);
  assert.match(kod, /wynik-trasy-budowy/);
  assert.match(kod, /Robocza:/);
  assert.match(kod, /Automat:/);
  assert.match(kod, /Wymaga uwagi/);
  assert.doesNotMatch(kod, /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization/i);
  assert.doesNotMatch(kod, /aplikacja\.pompy|przeliczCalyHarmonogram/);
  assert.match(index, /js\/interfejs\/wynik_trasy_budowy\.js/);
  assert.ok(
    index.indexOf("js/interfejs/podglad_tras.js") <
      index.indexOf("js/interfejs/wynik_trasy_budowy.js")
  );
  assert.ok(
    index.indexOf("js/interfejs/wynik_trasy_budowy.js") <
      index.indexOf("js/aplikacja.js")
  );
  assert.match(stan, /Ostatni zakończony podetap: \*\*6I\.1/);
  assert.match(stan, /Rozpocząć \*\*6I\.2/);
  assert.match(stan, /120\/120 zestawów testów/);
}

sprawdzGotowyWynikMapy();
sprawdzRecznaRozniSieOdAutomatu();
sprawdzBrakCzasuRoboczego();
sprawdzPamiecBezAutomatu();
sprawdzZrodloCsvIPowrot();
sprawdzGraniceEtapu();

console.log(
  "OK — 6I.1 pokazuje przy budowie wartość roboczą, automat, dystans, źródło i stan wymagający uwagi bez zmiany silnika."
);
