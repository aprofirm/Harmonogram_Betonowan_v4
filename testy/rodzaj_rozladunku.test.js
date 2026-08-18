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
  "js/gruszki/przydzial_gruszek.js",
  "js/lokalizacje/lokalizacje.js",
  "js/budowy/rodzaj_rozladunku.js",
  "js/harmonogram/harmonogram.js"
];

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {},
    Promise: Promise
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  plikiLogiki.forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function ustawCzasyDostawPlanowanych(aplikacja, budowy) {
  budowy.forEach(function (budowa) {
    if (aplikacja.budowy.czyOdbiorWlasny(budowa)) {
      return;
    }

    aplikacja.budowy.ustawCzasyRobocze(budowa, {
      czasDojazduRoboczyMinuty: 10,
      czasPowrotuRoboczyMinuty: 10,
      dodatkowyCzasZaladunkuMinuty: 0,
      dodatkowyCzasRozladunkuMinuty: 0
    });
  });
}

function sprawdzImportRodzajow(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;Zam-o (mój zakład);Rodzaj rozładunku",
    "Firma A;Odbiór z placu;07:00;8;",
    "Firma B;Budowa lej;08:00;8;Lej",
    "Firma C;Budowa pompa;09:00;8;Pompa",
    "Firma D;Budowa wywrotka;10:00;8;Wywrotka",
    "Firma E;Budowa taczka;11:00;8;Taczka"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "rodzaje.csv");

  assert.deepEqual(
    Array.from(stanImportu.budowy, function (budowa) {
      return budowa.rodzajRozladunku;
    }),
    ["odbior-wlasny", "lej", "pompa", "wywrotka", "taczka"]
  );

  const odbiorWlasny = stanImportu.budowy[0];
  assert.equal(aplikacja.budowy.czyOdbiorWlasny(odbiorWlasny), true);
  assert.equal(aplikacja.budowy.opiszRodzajRozladunku("odbior-wlasny"), "Odbiór własny");
  assert.deepEqual(
    Array.from(aplikacja.gruszki.generujKursyDlaBudowy(odbiorWlasny, 8)),
    []
  );
  assert.equal(
    aplikacja.lokalizacje.uzupelnijBudoweZPamieci(odbiorWlasny).status,
    "pominieto-odbior-wlasny"
  );

  ustawCzasyDostawPlanowanych(aplikacja, stanImportu.budowy);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15
    }
  });

  assert.equal(wynik.budowy.length, 5);
  assert.equal(wynik.kursy.length, 4);
  assert.equal(
    wynik.kursy.some(function (kurs) {
      return kurs.idBudowy === odbiorWlasny.idBudowy;
    }),
    false
  );
}

function sprawdzZgodnoscCsvBezKolumny(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;Zam-o (mój zakład)",
    "Firma starsza;Budowa bez kolumny;08:00;8"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "starszy.csv");
  const budowa = stanImportu.budowy[0];

  assert.equal(budowa.rodzajRozladunku, "");
  assert.equal(aplikacja.budowy.czyOdbiorWlasny(budowa), false);
  assert.equal(aplikacja.gruszki.generujKursyDlaBudowy(budowa, 8).length, 1);
}

function sprawdzBudowyReczne(aplikacja) {
  const odbiorWlasny = aplikacja.budowy.utworzBudoweReczna({
    firma: "Klient odbioru",
    budowa: "Odbiór własny",
    startPlanowany: "12:00",
    iloscBetonuM3: "5",
    rodzajRozladunku: "odbior-wlasny"
  }, []);
  const taczka = aplikacja.budowy.utworzBudoweReczna({
    firma: "Firma T",
    budowa: "Budowa taczka",
    startPlanowany: "13:00",
    iloscBetonuM3: "5",
    rodzajRozladunku: "taczka"
  }, [odbiorWlasny]);

  assert.equal(odbiorWlasny.rodzajRozladunku, "odbior-wlasny");
  assert.equal(taczka.rodzajRozladunku, "taczka");
  assert.equal(aplikacja.gruszki.generujKursyDlaBudowy(odbiorWlasny, 8).length, 0);
  assert.equal(aplikacja.gruszki.generujKursyDlaBudowy(taczka, 8).length, 1);

  assert.throws(function () {
    aplikacja.budowy.utworzBudoweReczna({
      firma: "Firma bez wyboru",
      budowa: "Budowa",
      startPlanowany: "14:00",
      iloscBetonuM3: "8",
      rodzajRozladunku: ""
    }, []);
  }, /Wybierz rodzaj rozładunku/i);
}

function sprawdzPodzialOdpowiedzialnosci() {
  const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
  const model = fs.readFileSync(
    path.join(katalogProjektu, "js/budowy/rodzaj_rozladunku.js"),
    "utf8"
  );
  const interfejs = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/rodzaj_rozladunku.js"),
    "utf8"
  );
  const odstep = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/odstep_dostaw.js"),
    "utf8"
  );

  assert.match(html, /style\/rodzaj_rozladunku\.css/);
  assert.match(html, /js\/budowy\/rodzaj_rozladunku\.js/);
  assert.match(html, /js\/interfejs\/rodzaj_rozladunku\.js/);
  assert.match(model, /pominieto-odbior-wlasny/);
  assert.match(model, /czyOdbiorWlasny/);
  assert.match(interfejs, /Odbiór własny/);
  assert.match(interfejs, /Lej/);
  assert.match(interfejs, /Pompa/);
  assert.match(interfejs, /Wywrotka/);
  assert.match(interfejs, /Taczka/);
  assert.match(interfejs, /Odbiory własne/);
  assert.match(interfejs, /Do wydania — poza harmonogramem/);
  assert.doesNotMatch(odstep, /rodzajRozladunku/);
  assert.doesNotMatch(odstep, /Odbiory własne/);
}

const aplikacja = wczytajAplikacje();
sprawdzImportRodzajow(aplikacja);
sprawdzZgodnoscCsvBezKolumny(aplikacja);
sprawdzBudowyReczne(aplikacja);
sprawdzPodzialOdpowiedzialnosci();

console.log("✓ Rodzaj rozładunku i odbiór własny są obsługiwane poprawnie i modułowo.");
