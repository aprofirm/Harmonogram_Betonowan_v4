"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const kluczPamieci = "harmonogramBetonowan.diagnostyka.v1";

function utworzPamiecLokalna() {
  const dane = new Map();

  return {
    getItem: function (klucz) {
      return dane.has(klucz) ? dane.get(klucz) : null;
    },
    setItem: function (klucz, wartosc) {
      dane.set(klucz, String(wartosc));
    },
    removeItem: function (klucz) {
      dane.delete(klucz);
    }
  };
}

function utworzElement() {
  return {
    textContent: "",
    zdarzenia: {},
    addEventListener: function (nazwa, obsluga) {
      this.zdarzenia[nazwa] = obsluga;
    },
    click: function () {},
    remove: function () {}
  };
}

function uruchomDiagnostyke(pamiecLokalna) {
  const elementy = {
    "stan-diagnostyki": utworzElement(),
    "podglad-logow": utworzElement(),
    "przycisk-pobierz-raport": utworzElement(),
    "przycisk-wyczysc-logi": utworzElement()
  };
  const obslugiGlobalne = {};
  const pobrania = { liczba: 0, nazwaPliku: null };
  const dokument = {
    body: { appendChild: function () {} },
    getElementById: function (identyfikator) {
      return elementy[identyfikator] || null;
    },
    createElement: function (nazwaElementu) {
      const element = utworzElement();

      if (nazwaElementu === "a") {
        element.click = function () {
          pobrania.liczba += 1;
          pobrania.nazwaPliku = element.download;
        };
      }

      return element;
    }
  };
  const zakresOkna = {
    document: dokument,
    localStorage: pamiecLokalna,
    Blob: Blob,
    URL: {
      createObjectURL: function () {
        return "blob:test";
      },
      revokeObjectURL: function () {}
    },
    addEventListener: function (nazwa, obsluga) {
      obslugiGlobalne[nazwa] = obsluga;
    }
  };
  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    document: dokument,
    Date: Date,
    Math: Math,
    Error: Error,
    Blob: Blob
  };
  vm.createContext(kontekst);

  ["js/konfiguracja/konfiguracja.js", "js/diagnostyka/diagnostyka.js"]
    .forEach(function (sciezkaPliku) {
      const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
      new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
    });

  return {
    diagnostyka: zakresOkna.HarmonogramBetonowan.diagnostyka,
    obslugiGlobalne: obslugiGlobalne,
    elementy: elementy,
    pobrania: pobrania
  };
}

const pamiecLokalna = utworzPamiecLokalna();
let srodowisko;

for (let numerUruchomienia = 1; numerUruchomienia <= 12; numerUruchomienia += 1) {
  srodowisko = uruchomDiagnostyke(pamiecLokalna);
}

assert.equal(srodowisko.diagnostyka.pobierzStan().trybPamieci, "trwala");
assert.equal(srodowisko.diagnostyka.pobierzStan().liczbaSesji, 10);
assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieci)).length, 10);

srodowisko.diagnostyka.zapiszZdarzenie(
  "informacja",
  "test-importu",
  "Import zakończony.",
  {
    nazwaPliku: "plan.csv",
    rozmiarBajtow: 1234,
    naglowkiKolumn: ["Firma", "Budowa", "Czas rozładunku"]
  }
);
srodowisko.diagnostyka.zapiszBlad(
  {
    name: "Error",
    message: "Przykładowy błąd",
    stack: "Error: Przykładowy błąd\n    at file:///C:/Users/Operator/Harmonogram/js/aplikacja.js:42:3"
  },
  "test-bledu",
  "Test zapisu błędu."
);

const raport = srodowisko.diagnostyka.utworzRaport();
const raportJakoTekst = JSON.stringify(raport);

assert.equal(raport.sesje.length, 10);
assert.match(raportJakoTekst, /plan\.csv/);
assert.match(raportJakoTekst, /js[\\/]aplikacja\.js:42:3/);
assert.doesNotMatch(raportJakoTekst, /C:\\Users|Operator\/Harmonogram/);
assert.doesNotMatch(raportJakoTekst, /Przykładowa Firma A|Osiedle Zielone/);

srodowisko.obslugiGlobalne.error({
  message: "Błąd globalny",
  filename: "file:///C:/Prywatny/Harmonogram/js/interfejs/interfejs.js",
  lineno: 7,
  colno: 2
});
assert.match(JSON.stringify(srodowisko.diagnostyka.utworzRaport()), /js[\\/]interfejs[\\/]interfejs\.js/);
assert.doesNotMatch(JSON.stringify(srodowisko.diagnostyka.utworzRaport()), /C:\/Prywatny/);

srodowisko.diagnostyka.pobierzRaport();
assert.equal(srodowisko.pobrania.liczba, 1);
assert.match(
  srodowisko.pobrania.nazwaPliku,
  /^harmonogram-betonowan-raport-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/
);

srodowisko.diagnostyka.wyczyscLogi();
assert.equal(srodowisko.diagnostyka.pobierzStan().liczbaSesji, 0);
assert.equal(pamiecLokalna.getItem(kluczPamieci), null);

console.log("✓ Diagnostyka: zapis, limit sesji, prywatność i czyszczenie działają poprawnie.");
