from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one match, got {count}: {old!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


# 1. Import CSV: opcjonalna mapa przejazdów pompy z danej budowy do innych budów.
replace_once(
    "js/import/import_csv.js",
    '''    czasPowrotuMinuty: [\n      "czaspowrotu",\n      "czaspowrotuminuty",\n      "powrot",\n      "powrotmin"\n    ]\n''',
    '''    czasPowrotuMinuty: [\n      "czaspowrotu",\n      "czaspowrotuminuty",\n      "powrot",\n      "powrotmin"\n    ],\n    przejazdyPompy: [\n      "przejazdypompy",\n      "czasyprzejazdowpompy",\n      "trasypompy"\n    ]\n'''
)

replace_once(
    "js/import/import_csv.js",
    '''      "rodzajRozladunku",\n      "czasDojazduMinuty",\n      "czasPowrotuMinuty"\n''',
    '''      "rodzajRozladunku",\n      "czasDojazduMinuty",\n      "czasPowrotuMinuty",\n      "przejazdyPompy"\n'''
)

replace_once(
    "js/import/import_csv.js",
    '''  function utworzOstrzezeniaId(indeksKolumnyId, liczbaAutomatycznychId) {\n''',
    '''  function parsujPrzejazdyPompy(wartosc, numerWiersza) {\n    const tekst = String(wartosc || "").trim();\n\n    if (!tekst) {\n      return null;\n    }\n\n    const wynik = {};\n\n    tekst.split("|").forEach(function (surowyWpis) {\n      const wpis = String(surowyWpis || "").trim();\n      const indeksRownosci = wpis.indexOf("=");\n\n      if (indeksRownosci <= 0 || indeksRownosci === wpis.length - 1) {\n        throw new Error(\n          "Wiersz " + numerWiersza +\n            " ma niepoprawny wpis w kolumnie PrzejazdyPompy. " +\n            "Użyj formatu ID=MINUTY, np. B-002=30|B-003=20."\n        );\n      }\n\n      const idBudowyDocelowej = wpis.slice(0, indeksRownosci).trim();\n      const tekstCzasu = wpis.slice(indeksRownosci + 1).trim().replace(",", ".");\n      const czasPrzejazduMinuty = Number(tekstCzasu);\n\n      if (\n        !idBudowyDocelowej ||\n        !Number.isFinite(czasPrzejazduMinuty) ||\n        czasPrzejazduMinuty < 0\n      ) {\n        throw new Error(\n          "Wiersz " + numerWiersza +\n            " ma niepoprawny czas w kolumnie PrzejazdyPompy dla budowy „" +\n            idBudowyDocelowej + "”. Czas musi być liczbą nie mniejszą niż 0."\n        );\n      }\n\n      if (Object.prototype.hasOwnProperty.call(wynik, idBudowyDocelowej)) {\n        throw new Error(\n          "Wiersz " + numerWiersza +\n            " zawiera powtórzony cel „" + idBudowyDocelowej +\n            "” w kolumnie PrzejazdyPompy."\n        );\n      }\n\n      wynik[idBudowyDocelowej] = czasPrzejazduMinuty;\n    });\n\n    return wynik;\n  }\n\n  function utworzOstrzezeniaId(indeksKolumnyId, liczbaAutomatycznychId) {\n'''
)

replace_once(
    "js/import/import_csv.js",
    '''      const czasPowrotuZImportu = String(\n        pobierzWartoscOpcjonalna(wiersz, indeksyKolumn.czasPowrotuMinuty)\n      ).trim();\n\n      if (czasDojazduZImportu || czasPowrotuZImportu) {\n''',
    '''      const czasPowrotuZImportu = String(\n        pobierzWartoscOpcjonalna(wiersz, indeksyKolumn.czasPowrotuMinuty)\n      ).trim();\n      const przejazdyPompyZImportu = parsujPrzejazdyPompy(\n        pobierzWartoscOpcjonalna(wiersz, indeksyKolumn.przejazdyPompy),\n        numerWiersza\n      );\n\n      if (przejazdyPompyZImportu) {\n        budowa.przejazdyPompyMinuty = przejazdyPompyZImportu;\n      }\n\n      if (czasDojazduZImportu || czasPowrotuZImportu) {\n'''
)

# 2. Harmonogram: CSV jest tylko fallbackiem. Jawny provider (np. mapa/adresy) ma pierwszeństwo.
replace_once(
    "js/harmonogram/harmonogram.js",
    '''  function obliczCentralnyWynikPomp(\n''',
    '''  function utworzOpcjePompZBudow(listaBudow, opcjePomp) {\n    const opcje = opcjePomp && typeof opcjePomp === "object"\n      ? opcjePomp\n      : {};\n\n    if (typeof opcje.pobierzDanePrzejazdu === "function") {\n      return opcje;\n    }\n\n    return Object.assign({}, opcje, {\n      pobierzDanePrzejazdu: function (danePrzejazdu) {\n        const dane = danePrzejazdu && typeof danePrzejazdu === "object"\n          ? danePrzejazdu\n          : {};\n        const budowaZrodlowa = dane.budowaZrodlowa;\n        const budowaDocelowa = dane.budowaDocelowa;\n        const mapaPrzejazdow = budowaZrodlowa &&\n          budowaZrodlowa.przejazdyPompyMinuty;\n        const idBudowyDocelowej = String(\n          budowaDocelowa && budowaDocelowa.idBudowy || ""\n        ).trim();\n\n        if (\n          !mapaPrzejazdow ||\n          typeof mapaPrzejazdow !== "object" ||\n          Array.isArray(mapaPrzejazdow) ||\n          !idBudowyDocelowej ||\n          !Object.prototype.hasOwnProperty.call(\n            mapaPrzejazdow,\n            idBudowyDocelowej\n          )\n        ) {\n          return null;\n        }\n\n        return {\n          czasPrzejazduMinuty: mapaPrzejazdow[idBudowyDocelowej],\n          zrodloCzasuPrzejazdu: "csv"\n        };\n      }\n    });\n  }\n\n  function obliczCentralnyWynikPomp(\n'''
)

replace_once(
    "js/harmonogram/harmonogram.js",
    '''      parametry,\n      aktualneDane.opcjePomp\n    );\n''',
    '''      parametry,\n      utworzOpcjePompZBudow(listaBudow, aktualneDane.opcjePomp)\n    );\n'''
)

# 3. Pamięć planu: zachowaj testową mapę po odświeżeniu / historii.
replace_once(
    "js/aplikacja.js",
    '''    "wymaganyWysiegPompyMetry",\n    "zrodlo",\n''',
    '''    "wymaganyWysiegPompyMetry",\n    "przejazdyPompyMinuty",\n    "zrodlo",\n'''
)

# 4. Dokumentacja.
replace_once(
    "README.md",
    '''Opcjonalne kolumny `CzasDojazdu` i `CzasPowrotu` podają czasy w minutach i są wczytywane bezpośrednio do roboczych czasów budowy. Jeśli tych kolumn nie ma, importer zachowuje dotychczasowe działanie.\n''',
    '''Opcjonalne kolumny `CzasDojazdu` i `CzasPowrotu` podają czasy w minutach i są wczytywane bezpośrednio do roboczych czasów budowy. Jeśli tych kolumn nie ma, importer zachowuje dotychczasowe działanie.\n\nDo testów operatora 4J.3 można dodatkowo użyć kolumny `PrzejazdyPompy`. Wartość ma format `ID=MINUTY|ID=MINUTY`, np. `B-002=30|B-003=20`, i opisuje czasy przejazdu pompy z bieżącej budowy do wskazanych budów. Jest to źródło pomocnicze do testów. Jeżeli silnik dostanie jawny provider przejazdów, np. późniejszy routing na podstawie adresów, ma on pierwszeństwo przed danymi z CSV.\n'''
)

# 5. Test regresyjny integracji CSV -> centralny harmonogram pomp oraz priorytetu przyszłego routingu.
Path("testy/csv_przejazdy_pomp.test.js").write_text(r'''"use strict";

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
sprawdzBlednyFormat(aplikacja);
sprawdzGraniceEtapu4();

console.log(
  "✓ 4J.3 przygotowanie: CSV zasila przejazdy pomp, a jawny provider map ma pierwszeństwo."
);
''', encoding="utf-8")
