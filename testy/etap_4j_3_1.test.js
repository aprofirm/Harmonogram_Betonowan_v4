"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Error: Error,
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/edycja_przejazdow_pomp.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStan(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu;PrzejazdyPompy",
    "B-001;Alfa;Budowa A;08:00;8;Pompa;20;20;B-002=20",
    "B-002;Beta;Budowa B;09:30;8;Pompa;10;10;B-001=25"
  ].join("\n");
  return aplikacja.importCsv.przetworzCsv(csv, "jawne-przejazdy.csv");
}

function sprawdzModelIRestore(aplikacja) {
  const stan = utworzStan(aplikacja);
  const zrodlo = stan.budowy[0];

  assert.equal(zrodlo.przejazdyPompyMinuty["B-002"], 20);
  assert.equal(zrodlo.przejazdyPompyBazoweMinuty["B-002"], 20);
  assert.equal(zrodlo.zrodlaPrzejazdowPompy["B-002"], "csv");

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    zrodlo,
    "B-002",
    "17",
    "reczny"
  );
  assert.equal(zrodlo.przejazdyPompyMinuty["B-002"], 17);
  assert.equal(zrodlo.zrodlaPrzejazdowPompy["B-002"], "reczny");

  aplikacja.pompy.przywrocBazowyCzasPrzejazduPompyBudowy(zrodlo, "B-002");
  assert.equal(zrodlo.przejazdyPompyMinuty["B-002"], 20);
  assert.equal(zrodlo.zrodlaPrzejazdowPompy["B-002"], "csv");

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(zrodlo, "B-002", "", "reczny");
  assert.equal(
    Object.prototype.hasOwnProperty.call(zrodlo.przejazdyPompyMinuty, "B-002"),
    false
  );
}

function sprawdzRecznaWartoscWHarmonogramie(aplikacja) {
  const stan = utworzStan(aplikacja);
  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    stan.budowy[0],
    "B-002",
    17,
    "reczny"
  );

  const parametry = Object.assign({}, aplikacja.konfiguracja.parametryDomyslne, {
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "oblicz-potrzebne",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  });
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stan,
    budowyReczne: [],
    listaPomp: [{
      idPompy: "P-1",
      nazwa: "Pompa 1",
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: 32
    }],
    parametry: parametry
  });
  const drugaBudowa = wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === "B-002";
  });

  assert.equal(drugaBudowa.statusPrzydzialuPompy, "przydzielona");
  assert.equal(
    drugaBudowa.przydzialPompy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    17
  );
  assert.equal(
    drugaBudowa.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu,
    "reczny"
  );
}

function sprawdzInterfejsIPamiec() {
  const html = wczytaj("index.html");
  const css = wczytaj("style/glowny.css");
  const aplikacja = wczytaj("js/aplikacja.js");
  const interfejs = wczytaj("js/interfejs/przejazdy_pomp.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");

  assert.match(html, /id="panel-przejazdow-pomp"/);
  assert.match(html, /id="wiersze-przejazdow-pomp"/);
  assert.match(html, /Przejazdy między budowami/);
  assert.match(html, /js\/pompy\/edycja_przejazdow_pomp\.js/);
  assert.match(html, /js\/interfejs\/przejazdy_pomp\.js/);
  assert.match(css, /\.pole-czasu-przejazdu-pompy/);
  assert.match(css, /\.zrodlo-przejazdu-pompy--reczny/);

  assert.match(aplikacja, /"przejazdyPompyBazoweMinuty"/);
  assert.match(aplikacja, /"zrodlaPrzejazdowPompy"/);
  assert.match(aplikacja, /function obsluzZmianePrzejazduPompy\(/);
  assert.match(aplikacja, /obsluzZmianePrzejazduPompy(?:,|\s*\n\s*\);)/);

  assert.match(interfejs, /pole\.type = "number"/);
  assert.match(interfejs, /pole\.min = "0"/);
  assert.match(interfejs, /obslugaZmianyPrzejazduPompy\(/);
  assert.match(interfejs, /slice\(indeksZrodlowy \+ 1\)/);
  assert.match(interfejs, /Przywróć wartość z CSV/);

  assert.match(etapy, /\[x\] \*\*4J\.3\.1 — jawne czasy przejazdów pomp:/);
  assert.match(etapy, /\[x\] \*\*4J\.3\.2 — ponowny test operatora:/);
  assert.match(etapy, /- \[x\] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(etapy, /- \[x\] Etap 4 — Pompy — \*\*zakończony 2026-08-30;/);
}

function sprawdzGraniceEtapu4() {
  const katalogPomp = path.join(katalogProjektu, "js", "pompy");
  const polaczonyKod = fs.readdirSync(katalogPomp)
    .filter(function (nazwa) { return nazwa.endsWith(".js"); })
    .map(function (nazwa) { return wczytaj("js/pompy/" + nazwa); })
    .join("\n");
  assert.doesNotMatch(polaczonyKod, /\.startRoboczy\s*=/);
}

const aplikacja = wczytajAplikacje();
sprawdzModelIRestore(aplikacja);
sprawdzRecznaWartoscWHarmonogramie(aplikacja);
sprawdzInterfejsIPamiec();
sprawdzGraniceEtapu4();

console.log(
  "✓ 4J.3.1: jawne czasy przejazdów pomp pozostają chronione po zaliczeniu 4J.3.2 i zamknięciu Etapu 4."
);
