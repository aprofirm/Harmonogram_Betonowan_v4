"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const plikiLogiki = [
  "js/konfiguracja/konfiguracja.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/lokalizacje/lokalizacje.js",
  "js/harmonogram/harmonogram.js"
];

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  plikiLogiki.forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzPoprawnyImport(aplikacja) {
  const csv = [
    "\uFEFFID_Budowy;Firma;Budowa;StartPlanowany;Beton;Ilosc_m3",
    '0012;"Beton, Polska";"Osiedle ""Północ""";07:30;C25/30;16',
    "A-08;Firma Druga;Hala magazynowa;09:15;C30/37;8"
  ].join("\r\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "plan.csv");

  assert.equal(stanImportu.nazwaPliku, "plan.csv");
  assert.equal(stanImportu.separator, ";");
  assert.equal(stanImportu.budowy.length, 2);
  assert.equal(stanImportu.budowy[0].idBudowy, "0012");
  assert.equal(stanImportu.budowy[0].firma, "Beton, Polska");
  assert.equal(stanImportu.budowy[0].budowa, 'Osiedle "Północ"');
  assert.equal(stanImportu.budowy[0].startPlanowany, "07:30");
  assert.equal(stanImportu.budowy[0].startRoboczy, "07:30");
  assert.equal(stanImportu.budowy[0].daneZrodlowe.ID_Budowy, "0012");
  assert.equal(stanImportu.budowy[0].rodzajBetonu, "C25/30");
  assert.equal(stanImportu.budowy[0].iloscBetonuM3, "16");
}

function sprawdzAliasyINiektoreFormaty(aplikacja) {
  const csv = [
    "ID obiektu,Klient,Nazwa budowy,Godzina,Receptura",
    '0007,"Firma Testowa","Plac, sektor B",06:45,C20/25'
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "aliasy.csv");

  assert.equal(stanImportu.separator, ",");
  assert.equal(stanImportu.budowy[0].idBudowy, "0007");
  assert.equal(stanImportu.budowy[0].firma, "Firma Testowa");
  assert.equal(stanImportu.budowy[0].budowa, "Plac, sektor B");
}

function sprawdzTestowyUkladKdx(aplikacja) {
  const sciezkaPrzykladuKdx = path.join(
    katalogProjektu,
    "przyklady/przykladowy_eksport_kdx.csv"
  );
  const csv = fs.readFileSync(sciezkaPrzykladuKdx, "utf8");
  const stanImportu = aplikacja.importCsv.przetworzCsv(
    csv,
    "przykladowy_eksport_kdx.csv"
  );

  assert.equal(stanImportu.budowy.length, 2);
  assert.equal(stanImportu.budowy[0].idBudowy, "CSV-001");
  assert.equal(stanImportu.budowy[0].firma, "Przykładowa Firma A");
  assert.equal(stanImportu.budowy[0].budowa, "Osiedle Zielone");
  assert.equal(stanImportu.budowy[0].startPlanowany, "08:00");
  assert.equal(stanImportu.budowy[0].startRoboczy, "08:00");
  assert.equal(stanImportu.budowy[0].dataPlanowana, "7.08.2026");
  assert.equal(stanImportu.budowy[0].iloscBetonuM3, "8");
  assert.equal(stanImportu.budowy[0].rodzajRozladunku, "Pompa");
  assert.equal(stanImportu.budowy[0].daneZrodlowe.Nazwa, "Przykładowa Firma A");
  assert.equal(stanImportu.ostrzezenia.length, 1);
  assert.match(stanImportu.ostrzezenia[0], /liczba: 2/i);
}

function sprawdzTolerancjeIZrealizowanePozycje(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;Zam-o (mój zakład)",
    "Firma A;Budowa elastyczna;13:00 (+60 min);3,5 m3",
    "Firma B;Budowa wykonana;12:00;0,0 m3"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "rzeczywisty-kdx.csv");
  const elastyczna = stanImportu.budowy[0];
  const wykonana = stanImportu.budowy[1];

  assert.equal(elastyczna.startPlanowanyZrodlowy, "13:00 (+60 min)");
  assert.equal(elastyczna.startPlanowany, "13:00");
  assert.equal(elastyczna.startRoboczy, "13:00");
  assert.equal(elastyczna.tolerancjaStartuMinuty, 60);
  assert.equal(elastyczna.najpozniejszyStart, "14:00");
  assert.equal(elastyczna.iloscBetonuLiczbaM3, 3.5);
  assert.equal(elastyczna.statusRealizacji, "do-realizacji");
  assert.equal(wykonana.iloscBetonuLiczbaM3, 0);
  assert.equal(wykonana.statusRealizacji, "zrealizowana");
}

function sprawdzAutomatyczneId(aplikacja) {
  const csvBezKolumnyId = [
    "Firma;Budowa;StartPlanowany",
    "Firma A;Budowa A;07:00",
    "Firma B;Budowa B;08:00"
  ].join("\n");
  const importBezKolumnyId = aplikacja.importCsv.przetworzCsv(
    csvBezKolumnyId,
    "bez-id.csv"
  );

  assert.deepEqual(
    Array.from(importBezKolumnyId.budowy, function (budowa) {
      return budowa.idBudowy;
    }),
    ["CSV-001", "CSV-002"]
  );
  assert.equal(importBezKolumnyId.ostrzezenia.length, 1);
  assert.match(importBezKolumnyId.ostrzezenia[0], /nie znaleziono kolumny ID budowy/i);
  assert.match(importBezKolumnyId.ostrzezenia[0], /liczba: 2/i);

  const csvZCzesciowymiId = [
    "ID_Budowy;Firma;Budowa;StartPlanowany",
    ";Firma A;Budowa A;07:00",
    "CSV-001;Firma B;Budowa B;08:00",
    ";Firma C;Budowa C;09:00",
    "0007;Firma D;Budowa D;10:00"
  ].join("\n");
  const importZCzesciowymiId = aplikacja.importCsv.przetworzCsv(
    csvZCzesciowymiId,
    "czesciowe-id.csv"
  );

  assert.deepEqual(
    Array.from(importZCzesciowymiId.budowy, function (budowa) {
      return budowa.idBudowy;
    }),
    ["CSV-002", "CSV-001", "CSV-003", "0007"]
  );
  assert.equal(importZCzesciowymiId.ostrzezenia.length, 1);
  assert.match(importZCzesciowymiId.ostrzezenia[0], /niektóre pozycje nie miały ID/i);
  assert.match(importZCzesciowymiId.ostrzezenia[0], /liczba: 2/i);
}

function sprawdzBlednePliki(aplikacja) {
  assert.throws(
    function () {
      aplikacja.importCsv.przetworzCsv("", "pusty.csv");
    },
    /plik CSV jest pusty/i
  );
  assert.throws(
    function () {
      aplikacja.importCsv.przetworzCsv(
        "ID_Budowy;Firma;Budowa;StartPlanowany",
        "bez-danych.csv"
      );
    },
    /nie zawiera żadnych budów/i
  );
  assert.throws(
    function () {
      aplikacja.importCsv.przetworzCsv(
        "ID_Budowy;Firma;StartPlanowany\n1;Firma;07:00",
        "brak-kolumny.csv"
      );
    },
    /kolumny „Budowa”/i
  );
  assert.throws(
    function () {
      aplikacja.importCsv.przetworzCsv(
        "ID_Budowy;Firma;Budowa;StartPlanowany\n1;A;B;07:00\n1;C;D;08:00",
        "duplikaty.csv"
      );
    },
    /występuje w pliku więcej niż raz/i
  );
}

function sprawdzBudowyReczne(aplikacja) {
  const pierwsza = aplikacja.budowy.utworzBudoweReczna(
    { firma: "Firma A", budowa: "Budowa A", startPlanowany: "08:00" },
    []
  );
  const druga = aplikacja.budowy.utworzBudoweReczna(
    { firma: "Firma B", budowa: "Budowa B", startPlanowany: "09:00" },
    [pierwsza]
  );

  assert.equal(pierwsza.idBudowy, "RECZNE-001");
  assert.equal(druga.idBudowy, "RECZNE-002");
  assert.equal(druga.zrodlo, "reczna");
  assert.equal(druga.startRoboczy, druga.startPlanowany);
  assert.equal(druga.daneZrodlowe, null);
  assert.throws(
    function () {
      aplikacja.budowy.utworzBudoweReczna(
        { firma: "", budowa: "Budowa C", startPlanowany: "10:00" },
        []
      );
    },
    /Pole „Firma” nie może być puste/i
  );
}

function sprawdzWymianeImportu(aplikacja) {
  const pierwszyStan = aplikacja.importCsv.przetworzCsv(
    "ID_Budowy;Firma;Budowa;StartPlanowany\n1;A;Pierwsza;07:00\n2;B;Druga;08:00",
    "pierwszy.csv"
  );
  const drugiStan = aplikacja.importCsv.przetworzCsv(
    "ID_Budowy;Firma;Budowa;StartPlanowany\n9;Z;Nowa;11:00",
    "drugi.csv"
  );
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: drugiStan,
    budowyReczne: []
  });

  assert.equal(pierwszyStan.budowy.length, 2);
  assert.equal(wynik.budowy.length, 1);
  assert.equal(wynik.budowy[0].idBudowy, "9");
  assert.deepEqual(Array.from(wynik.kursy), []);
  assert.deepEqual(Array.from(wynik.pompy.dostepnePompy), []);
  assert.deepEqual(Array.from(wynik.gruszki.dostepneGruszki), []);
}

async function sprawdzOdczytPliku(aplikacja) {
  const tresc = "ID_Budowy;Firma;Budowa;StartPlanowany\n003;A;B;07:00";
  const bufor = new TextEncoder().encode(tresc);
  const plik = {
    name: "z-komputera.csv",
    size: bufor.byteLength,
    arrayBuffer: function () {
      return Promise.resolve(bufor.buffer);
    }
  };
  const stanImportu = await aplikacja.importCsv.importujPlik(plik);

  assert.equal(stanImportu.budowy[0].idBudowy, "003");
  await assert.rejects(
    aplikacja.importCsv.importujPlik({ name: "plan.txt", size: 10 }),
    /rozszerzeniem \.csv/i
  );
}

async function uruchomTesty() {
  const aplikacja = wczytajAplikacje();

  sprawdzPoprawnyImport(aplikacja);
  sprawdzAliasyINiektoreFormaty(aplikacja);
  sprawdzTestowyUkladKdx(aplikacja);
  sprawdzTolerancjeIZrealizowanePozycje(aplikacja);
  sprawdzAutomatyczneId(aplikacja);
  sprawdzBlednePliki(aplikacja);
  sprawdzBudowyReczne(aplikacja);
  sprawdzWymianeImportu(aplikacja);
  await sprawdzOdczytPliku(aplikacja);

  console.log("✓ Etap 2: wszystkie testy zakończyły się powodzeniem.");
}

uruchomTesty().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
