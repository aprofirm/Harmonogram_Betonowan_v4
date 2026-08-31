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
    setItem: (klucz, wartosc) => dane.set(String(klucz), String(wartosc)),
    getItem: (klucz) => dane.has(String(klucz)) ? dane.get(String(klucz)) : null,
    removeItem: (klucz) => dane.delete(String(klucz))
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

function sprawdzPoleIOdczytInterfejsu() {
  const html = wczytaj("index.html");
  const interfejs = wczytaj("js/interfejs/interfejs.js");

  assert.ok(html.includes('id="maksymalny-przestoj"'));
  assert.ok(html.includes('name="maksymalnyPrzestojMinuty"'));
  assert.ok(html.includes("Maksymalny przestój między dostawami"));
  assert.ok(html.includes("Etap 5J.1"));
  assert.ok(html.includes("5J.1 · pełna regresja automatyczna"));
  assert.ok(html.includes("5i3-pamiec-stan-20260831a"));

  assert.ok(interfejs.includes('document.getElementById("maksymalny-przestoj")'));
  assert.ok(interfejs.includes("parametryDomyslne.maksymalnyPrzestojMinuty"));
  assert.ok(interfejs.includes('pobierzWartoscLubDomyslna(parametry, "maksymalnyPrzestojMinuty")'));
  assert.ok(interfejs.includes('"Maksymalny przestój między dostawami"'));
  assert.ok(interfejs.includes("].filter(Boolean).forEach"));
}

function sprawdzPamiecParametrowIWyjatkuBudowy() {
  const aplikacja = wczytajModelIPamiec();
  const budowa = aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "A",
    firma: "Alfa",
    budowa: "Budowa A",
    startPlanowany: "08:00",
    iloscBetonuM3: "8",
    rodzajRozladunku: "Lej"
  }, 2);

  aplikacja.budowy.ustawIndywidualnyLimitOpoznieniaStartuBudowy(budowa, 45);
  aplikacja.pamiecPlanu.uruchomPamiecPlanu();

  const danePlanu = {
    budowyZImportu: [budowa],
    budowyReczne: [],
    parametry: {
      maksymalneOpoznienieStartuMinuty: 30,
      maksymalnyPrzestojMinuty: 7
    },
    czyHarmonogramPrzeliczony: false
  };

  aplikacja.pamiecPlanu.zapiszPlan(danePlanu);
  const biezacy = aplikacja.pamiecPlanu.odczytajPlan().danePlanu;
  assert.equal(biezacy.parametry.maksymalnyPrzestojMinuty, 7);
  assert.equal(biezacy.budowyZImportu[0].maksymalneOpoznienieStartuBudowyMinuty, 45);

  const zapisHistorii = aplikacja.pamiecPlanu.zapiszPlanHistoryczny(danePlanu);
  const historyczny = aplikacja.pamiecPlanu.odczytajPlanHistoryczny(zapisHistorii.idZapisu).danePlanu;
  assert.equal(historyczny.parametry.maksymalnyPrzestojMinuty, 7);
  assert.equal(historyczny.budowyZImportu[0].maksymalneOpoznienieStartuBudowyMinuty, 45);
}

function sprawdzKompatybilnoscIStanNieaktualny() {
  const interfejs = wczytaj("js/interfejs/interfejs.js");
  const aplikacja = wczytaj("js/aplikacja.js");
  const konfiguracja = wczytajModelIPamiec().konfiguracja;

  assert.equal(konfiguracja.parametryDomyslne.maksymalnyPrzestojMinuty, 15);
  assert.ok(interfejs.includes('pobierzWartoscLubDomyslna(parametry, "maksymalnyPrzestojMinuty")'));
  assert.ok(interfejs.includes("parametryDomyslneInterfejsu.maksymalnyPrzestojMinuty"));

  assert.match(
    aplikacja,
    /function obsluzZmianeParametrow\(parametry\)[\s\S]*?oznaczPlanJakoNieprzeliczony\(true\)/
  );
  assert.match(
    aplikacja,
    /function obsluzZmianeLimituOpoznieniaBudowy\([\s\S]*?oznaczPlanJakoNieprzeliczony\(true\)/
  );
  assert.match(
    aplikacja,
    /czyOstatniPlanPrzeliczony = Boolean\(danePlanu\.czyHarmonogramPrzeliczony\)[\s\S]*?pokazPrzywroconyPlan[\s\S]*?if \(czyOstatniPlanPrzeliczony\)/
  );
}

sprawdzPoleIOdczytInterfejsu();
sprawdzPamiecParametrowIWyjatkuBudowy();
sprawdzKompatybilnoscIStanNieaktualny();

assert.equal(wczytajModelIPamiec().konfiguracja.punktEtapu, "5J.1");

console.log(
  "OK — 5I.3 zapisuje i odtwarza parametry Etapu 5, zachowuje wyjątki budów i unieważnia wynik po istotnej zmianie."
);
