"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajImporter() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  ["js/import/import_csv.js", "js/budowy/budowy.js"].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzKdxPelny(aplikacja) {
  const csv = [
    ";K.-Nazwa;Budowa;Zamawiający;Czas rozładunku;Nr materiału;Nazwa materiału;Zam-o (mój zakład);Dost-o. (mój zakład);Do dost-a. (mój zakład);Rodzaj rozładunku;Czas modyfikacji;Zmienione przez",
    'Status;Firma Testowa;"Budowa A";123;12:00;MAT-1;C30/37;300,0 m3;0,0 m3;300,0 m3;Pompa;10.08.2026 13:20;Operator',
    ";Normal;;;;;;;;;;;1.01.0001 00:00;"
  ].join("\r\n");

  const wynik = aplikacja.importCsv.przetworzCsv(csv, "pelny.csv");

  assert.equal(wynik.budowy.length, 1);
  assert.equal(wynik.budowy[0].firma, "Firma Testowa");
  assert.equal(wynik.budowy[0].budowa, "Budowa A");
  assert.equal(wynik.budowy[0].startPlanowany, "12:00");
  assert.equal(wynik.budowy[0].rodzajBetonu, "C30/37");
  assert.equal(wynik.budowy[0].iloscBetonuM3, "300,0 m3");
  assert.equal(wynik.budowy[0].rodzajRozladunku, "Pompa");
}

function sprawdzKdxSkrocony(aplikacja) {
  const csv = [
    ";;K.-Nazwa;Tytuł;Czas rozładunku;Zam-o (mój zakład);Dost-o. (mój zakład);Rodzaj rozładunku;Zamawiający;Czas modyfikacji;Zmienione przez",
    ';Status;Firma Testowa;"Budowa B";15:00;80,0 m3;0,0 m3;Pompa;123;10.08.2026 13:21;Operator',
    ";Normal;;;;;;;;1.01.0001 00:00;"
  ].join("\r\n");

  const wynik = aplikacja.importCsv.przetworzCsv(csv, "skrocony.csv");

  assert.equal(wynik.budowy.length, 1);
  assert.equal(wynik.budowy[0].firma, "Firma Testowa");
  assert.equal(wynik.budowy[0].budowa, "Budowa B");
  assert.equal(wynik.budowy[0].startPlanowany, "15:00");
  assert.equal(wynik.budowy[0].iloscBetonuM3, "80,0 m3");
  assert.equal(wynik.budowy[0].rodzajRozladunku, "Pompa");
}

const aplikacja = wczytajImporter();
sprawdzKdxPelny(aplikacja);
sprawdzKdxSkrocony(aplikacja);
console.log("✓ KDX: zmienne zestawy i kolejność kolumn są obsługiwane.");
