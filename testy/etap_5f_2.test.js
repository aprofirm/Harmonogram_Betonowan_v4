"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzLocalStorage() {
  const dane = new Map();
  return {
    setItem: function (klucz, wartosc) {
      dane.set(String(klucz), String(wartosc));
    },
    getItem: function (klucz) {
      return dane.has(String(klucz)) ? dane.get(String(klucz)) : null;
    },
    removeItem: function (klucz) {
      dane.delete(String(klucz));
    }
  };
}

function wczytajModelIPamiec() {
  const zakresOkna = { localStorage: utworzLocalStorage() };
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna, Map: Map, Set: Set };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/pamiec/pamiec_planu.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzBudowe(aplikacja) {
  return aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "A",
    firma: "Alfa",
    budowa: "Budowa A",
    startPlanowany: "08:00",
    iloscBetonuM3: "8",
    rodzajRozladunku: "Lej"
  }, 2);
}

function sprawdzDziedziczenieINadpisanie() {
  const aplikacja = wczytajModelIPamiec();
  const budowa = utworzBudowe(aplikacja);

  assert.equal(budowa.maksymalneOpoznienieStartuBudowyMinuty, null);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    30,
    "Brak wyjątku ma korzystać z globalnego limitu."
  );

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, "45");
  assert.equal(budowa.maksymalneOpoznienieStartuBudowyMinuty, 45);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    45,
    "Indywidualny limit ma mieć pierwszeństwo przed globalnym."
  );

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, 0);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    0,
    "Zero jest prawidłowym indywidualnym limitem."
  );

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, "");
  assert.equal(budowa.maksymalneOpoznienieStartuBudowyMinuty, null);
  assert.equal(
    aplikacja.budowy.pobierzEfektywnyLimitOpoznieniaStartuMinuty(budowa, 30),
    30,
    "Wyczyszczenie wyjątku ma przywrócić dziedziczenie globalne."
  );

  assert.throws(
    function () {
      aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, -1);
    },
    /Indywidualny limit opóźnienia startu.*nie mniejszą niż 0/
  );
  assert.throws(
    function () {
      aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(
        budowa,
        "nie-liczba"
      );
    },
    /Indywidualny limit opóźnienia startu.*nie mniejszą niż 0/
  );

  const starszaBudowa = Object.assign({}, budowa);
  delete starszaBudowa.maksymalneOpoznienieStartuBudowyMinuty;
  const listaRobocza = aplikacja.budowy.utworzListeRobocza([starszaBudowa], []);
  assert.equal(listaRobocza[0].maksymalneOpoznienieStartuBudowyMinuty, null);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      starszaBudowa,
      "maksymalneOpoznienieStartuBudowyMinuty"
    ),
    false,
    "Normalizacja listy roboczej nie może mutować starszego źródła."
  );
  assert.match(
    aplikacja.konfiguracja.punktEtapu,
    /^\d+[A-Z](?:\.\d+)+$/,
    "Po zamknięciu 5F.2 konfiguracja może wskazywać dowolny późniejszy etap projektu."
  );
}

function sprawdzPamiecPlanuIHistorie() {
  const aplikacja = wczytajModelIPamiec();
  const budowa = utworzBudowe(aplikacja);
  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, 45);
  aplikacja.pamiecPlanu.uruchomPamiecPlanu();

  const danePlanu = {
    nazwaPliku: "5f2.csv",
    budowyZImportu: [budowa],
    budowyReczne: [],
    parametry: { maksymalneOpoznienieStartuMinuty: 30 },
    czyHarmonogramPrzeliczony: true
  };

  aplikacja.pamiecPlanu.zapiszPlan(danePlanu);
  const biezacy = aplikacja.pamiecPlanu.odczytajPlan();
  assert.equal(
    biezacy.danePlanu.budowyZImportu[0].maksymalneOpoznienieStartuBudowyMinuty,
    45
  );

  const zapisHistorii = aplikacja.pamiecPlanu.zapiszPlanHistoryczny(danePlanu);
  const historyczny = aplikacja.pamiecPlanu.odczytajPlanHistoryczny(
    zapisHistorii.idZapisu
  );
  assert.equal(
    historyczny.danePlanu.budowyZImportu[0].maksymalneOpoznienieStartuBudowyMinuty,
    45
  );
}

function sprawdzWiringAplikacjiIInterfejsu() {
  const kodAplikacji = wczytaj("js/aplikacja.js");
  const html = wczytaj("index.html");
  const kodInterfejsu = wczytaj("js/interfejs/limit_opoznienia.js");

  assert.match(
    kodAplikacji,
    /"maksymalneOpoznienieStartuBudowyMinuty"/,
    "Wyjątek budowy musi należeć do whitelisty pamięci aplikacji."
  );
  assert.match(kodAplikacji, /obsluzZmianeLimituOpoznieniaBudowy/);
  assert.match(html, /<th>Limit opóźnienia<\/th>/);
  assert.match(html, /js\/interfejs\/limit_opoznienia\.js\?v=5f2-/);
  assert.match(kodInterfejsu, /Globalny.*min/);
  assert.match(kodInterfejsu, /argumenty\[14\]/);
}

sprawdzDziedziczenieINadpisanie();
sprawdzPamiecPlanuIHistorie();
sprawdzWiringAplikacjiIInterfejsu();

console.log(
  "OK — 5F.2 pozwala budowie nadpisać globalny limit, przywrócić dziedziczenie i zachowuje wyjątek w planie oraz historii."
);
