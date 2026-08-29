"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

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
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
    new vm.Script(kod, { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzPompe() {
  return {
    idPompy: "P-1",
    nazwa: "Pompa 1",
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "",
    wysiegMetry: 32
  };
}

function utworzStanImportu(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu;PrzejazdyPompy",
    "B-001;Firma A;Budowa A;08:00;8;Pompa;10;10;B-002=20|B-003=35",
    "B-002;Firma B;Budowa B;09:00;8;Pompa;10;10;B-001=20",
    "B-003;Firma C;Budowa C;12:00;8;Pompa;10;10;B-001=35"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "przejazdy-pomp.csv");
}

function pobierzParametry(aplikacja) {
  return Object.assign({}, aplikacja.konfiguracja.parametryDomyslne, {
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "oblicz-potrzebne",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  });
}

function sprawdzImportMapy(aplikacja) {
  const stan = utworzStanImportu(aplikacja);

  assert.equal(stan.budowy[0].przejazdyPompyMinuty["B-002"], 20);
  assert.equal(stan.budowy[0].przejazdyPompyMinuty["B-003"], 35);
  assert.equal(stan.budowy[1].przejazdyPompyMinuty["B-001"], 20);
}

function sprawdzIntegracjeZHarmonogramem(aplikacja) {
  const stan = utworzStanImportu(aplikacja);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stan,
    budowyReczne: [],
    listaPomp: [utworzPompe()],
    parametry: pobierzParametry(aplikacja)
  });

  assert.equal(wynik.pompy.wynikiBudow.length, 3);
  assert.equal(wynik.pompy.wynikiBudow[0].statusPrzydzialuPompy, "przydzielona");
  assert.equal(wynik.pompy.wynikiBudow[1].statusPrzydzialuPompy, "przydzielona");
  assert.equal(
    wynik.pompy.wynikiBudow[1].przydzialPompy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    20
  );
  assert.equal(
    wynik.pompy.wynikiBudow[1].przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu,
    "csv"
  );
  assert.ok(wynik.pompy.wynikiBudow[1].opoznienieZPowoduPompMinuty > 0);
}

function sprawdzPriorytetJawnegoProvidera(aplikacja) {
  const stan = utworzStanImportu(aplikacja);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stan,
    budowyReczne: [],
    listaPomp: [utworzPompe()],
    parametry: pobierzParametry(aplikacja),
    opcjePomp: {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 5,
          zrodloCzasuPrzejazdu: "mapa-test"
        };
      }
    }
  });

  assert.equal(
    wynik.pompy.wynikiBudow[1].przydzialPompy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    5
  );
  assert.equal(
    wynik.pompy.wynikiBudow[1].przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu,
    "mapa-test"
  );
}

function utworzPompeZNumerem(numer) {
  return {
    idPompy: "P-" + String(numer),
    nazwa: "Pompa " + String(numer),
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "",
    wysiegMetry: 32
  };
}

function sprawdzDwiePompyICzteryBudowy(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Beton;IloscBetonu;DataPlanowana;RodzajRozladunku;CzasDojazdu;CzasPowrotu;PrzejazdyPompy",
    "B-001;Alfa Bud;Świdnica - Osiedle Północ;08:00;C25/30;24;2026-08-30;Pompa;18;20;B-002=30|B-003=20|B-004=18",
    "B-002;Beta Konstrukcje;Wałbrzych - Hala A;08:45;C30/37;18;2026-08-30;Pompa;28;30;B-001=30|B-003=20|B-004=35",
    "B-003;Gamma Invest;Świebodzice - Fundament;09:30;C20/25;12;2026-08-30;Pompa;12;14;B-001=20|B-002=20|B-004=25",
    "B-004;Delta Dom;Jaworzyna Śląska - Dom 12;11:00;C25/30;8;2026-08-30;Pompa;22;24;B-001=18|B-002=35|B-003=25"
  ].join("\n");
  const stan = aplikacja.importCsv.przetworzCsv(csv, "plan-4j3-pelny.csv");
  const parametry = Object.assign({}, aplikacja.konfiguracja.parametryDomyslne, {
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 2,
    trybGruszek: "oblicz-potrzebne",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15
  });
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stan,
    budowyReczne: [],
    listaPomp: [utworzPompeZNumerem(1), utworzPompeZNumerem(2)],
    parametry: parametry
  });
  const b003 = wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === "B-003";
  });
  const b004 = wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === "B-004";
  });

  assert.ok(b003);
  assert.equal(b003.statusPrzydzialuPompy, "przydzielona");
  assert.ok(b003.przydzialPompy.przejazdZPoprzedniejBudowy);
  assert.equal(b003.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu, "csv");
  b003.probyKandydatow.forEach(function (proba) {
    assert.notEqual(proba.powodOdrzucenia, "brak-trasy");
  });

  assert.ok(b004);
  assert.equal(b004.statusPrzydzialuPompy, "przydzielona");
  assert.ok(b004.przydzialPompy.przejazdZPoprzedniejBudowy);
  assert.equal(b004.przydzialPompy.przejazdZPoprzedniejBudowy.zrodloCzasuPrzejazdu, "csv");
}

function sprawdzWersjonowanieSkryptow() {
  const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
  [
    "js/import/import_csv.js?v=",
    "js/harmonogram/harmonogram.js?v=",
    "js/aplikacja.js?v="
  ].forEach(function (fragment) {
    assert.ok(html.includes(fragment), "Brak wersjonowanego skryptu: " + fragment);
  });
}

function sprawdzBlednyFormat(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;PrzejazdyPompy",
    "Firma A;Budowa A;08:00;B-002=abc"
  ].join("\n");

  assert.throws(
    function () {
      aplikacja.importCsv.przetworzCsv(csv, "bledne-przejazdy.csv");
    },
    /PrzejazdyPompy|niepoprawny czas/i
  );
}

function sprawdzGraniceEtapu4() {
  const katalogPomp = path.join(katalogProjektu, "js", "pompy");
  const polaczonyKod = fs.readdirSync(katalogPomp)
    .filter(function (nazwa) { return nazwa.endsWith(".js"); })
    .map(function (nazwa) {
      return fs.readFileSync(path.join(katalogPomp, nazwa), "utf8");
    })
    .join("\n");

  assert.doesNotMatch(polaczonyKod, /\.startRoboczy\s*=/);
}

const aplikacja = wczytajAplikacje();
sprawdzImportMapy(aplikacja);
sprawdzIntegracjeZHarmonogramem(aplikacja);
sprawdzPriorytetJawnegoProvidera(aplikacja);
sprawdzDwiePompyICzteryBudowy(aplikacja);
sprawdzWersjonowanieSkryptow();
sprawdzBlednyFormat(aplikacja);
sprawdzGraniceEtapu4();

console.log(
  "✓ 4J.3 przygotowanie: CSV zasila przejazdy pomp, a jawny provider map ma pierwszeństwo."
);
