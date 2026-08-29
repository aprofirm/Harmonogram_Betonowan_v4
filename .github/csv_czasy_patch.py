from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected exactly one match, got {count}: {old!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "js/import/import_csv.js",
    '    dataPlanowana: ["dataplanowana", "databetonowania", "data"],\n    rodzajRozladunku: ["rodzajrozladunku", "sposobrozladunku", "rozladunek"]\n',
    '    dataPlanowana: ["dataplanowana", "databetonowania", "data"],\n'
    '    rodzajRozladunku: ["rodzajrozladunku", "sposobrozladunku", "rozladunek"],\n'
    '    czasDojazduMinuty: [\n'
    '      "czasdojazdu",\n'
    '      "czasdojazduminuty",\n'
    '      "dojazd",\n'
    '      "dojazdmin"\n'
    '    ],\n'
    '    czasPowrotuMinuty: [\n'
    '      "czaspowrotu",\n'
    '      "czaspowrotuminuty",\n'
    '      "powrot",\n'
    '      "powrotmin"\n'
    '    ]\n'
)

replace_once(
    "js/import/import_csv.js",
    '      "iloscBetonuM3",\n      "dataPlanowana",\n      "rodzajRozladunku"\n',
    '      "iloscBetonuM3",\n      "dataPlanowana",\n      "rodzajRozladunku",\n'
    '      "czasDojazduMinuty",\n      "czasPowrotuMinuty"\n'
)

replace_once(
    "js/import/import_csv.js",
    '      wierszeZrodlowe.push(daneZrodlowe);\n      budowy.push(budowa);\n',
    '      const czasDojazduZImportu = String(\n'
    '        pobierzWartoscOpcjonalna(wiersz, indeksyKolumn.czasDojazduMinuty)\n'
    '      ).trim();\n'
    '      const czasPowrotuZImportu = String(\n'
    '        pobierzWartoscOpcjonalna(wiersz, indeksyKolumn.czasPowrotuMinuty)\n'
    '      ).trim();\n\n'
    '      if (czasDojazduZImportu || czasPowrotuZImportu) {\n'
    '        aplikacja.budowy.ustawCzasyRobocze(budowa, {\n'
    '          czasDojazduRoboczyMinuty: czasDojazduZImportu,\n'
    '          czasPowrotuRoboczyMinuty: czasPowrotuZImportu,\n'
    '          zrodloCzasuDojazdu: czasDojazduZImportu ? "reczny" : "brak",\n'
    '          zrodloCzasuPowrotu: czasPowrotuZImportu ? "reczny" : "brak"\n'
    '        });\n'
    '      }\n\n'
    '      wierszeZrodlowe.push(daneZrodlowe);\n      budowy.push(budowa);\n'
)

Path("testy/csv_czasy_przejazdu.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/budowy/budowy.js",
    "js/import/import_csv.js"
  ].forEach(function (sciezka) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
    new vm.Script(kod, { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzImportObuCzasow(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;CzasDojazdu;CzasPowrotu",
    "T-001;Firma A;Budowa A;08:00;12;25;30"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "czasy.csv").budowy[0];

  assert.equal(budowa.czasDojazduRoboczyMinuty, 25);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 30);
  assert.equal(budowa.zrodloCzasuDojazdu, "reczny");
  assert.equal(budowa.zrodloCzasuPowrotu, "reczny");
}

function sprawdzAliasyCzasow(aplikacja) {
  const csv = [
    "Klient;Obiekt;Godzina;DojazdMin;PowrotMin",
    "Firma B;Budowa B;09:15;17;19"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "aliasy-czasow.csv").budowy[0];

  assert.equal(budowa.czasDojazduRoboczyMinuty, 17);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 19);
}

function sprawdzBrakKolumnNieZmieniaDotychczasowegoImportu(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany",
    "Firma C;Budowa C;10:00"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "bez-czasow.csv").budowy[0];

  assert.equal(budowa.czasDojazduRoboczyMinuty, null);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, null);
  assert.equal(budowa.zrodloCzasuDojazdu, "brak");
  assert.equal(budowa.zrodloCzasuPowrotu, "brak");
}

function sprawdzBlednyCzasJestOdrzucany(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;CzasDojazdu;CzasPowrotu",
    "Firma D;Budowa D;11:00;-1;abc"
  ].join("\n");

  assert.throws(
    function () {
      aplikacja.importCsv.przetworzCsv(csv, "bledne-czasy.csv");
    },
    /Czas dojazdu.*nie mniejszą niż 0/i
  );
}

const aplikacja = wczytajAplikacje();
sprawdzImportObuCzasow(aplikacja);
sprawdzAliasyCzasow(aplikacja);
sprawdzBrakKolumnNieZmieniaDotychczasowegoImportu(aplikacja);
sprawdzBlednyCzasJestOdrzucany(aplikacja);

console.log("✓ CSV: opcjonalne czasy dojazdu i powrotu są importowane poprawnie.");
''', encoding="utf-8")

replace_once(
    "README.md",
    "Importer nie wymaga kolumny ID budowy. Jeśli kolumny ID nie ma albo pojedynczy wiersz ma puste ID, program nadaje identyfikatory `CSV-001`, `CSV-002`, ... i pokazuje ostrzeżenie po imporcie.\n",
    "Importer nie wymaga kolumny ID budowy. Jeśli kolumny ID nie ma albo pojedynczy wiersz ma puste ID, program nadaje identyfikatory `CSV-001`, `CSV-002`, ... i pokazuje ostrzeżenie po imporcie. Opcjonalne kolumny `CzasDojazdu` i `CzasPowrotu` (w minutach) są wczytywane bezpośrednio do roboczych czasów budowy; ich brak zachowuje dotychczasowe działanie importu.\n"
)
