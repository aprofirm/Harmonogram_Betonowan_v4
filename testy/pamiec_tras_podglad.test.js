"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const sciezkaModulu = "js/pamiec/pamiec_tras.js";
const kluczPamieci = "harmonogramBetonowan.pamiecTras.v1";

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

function uruchomModul(pamiecLokalna, czyDostepBlokowany) {
  const zakresOkna = {};

  if (czyDostepBlokowany) {
    Object.defineProperty(zakresOkna, "localStorage", {
      get: function () {
        throw new Error("Dostęp do localStorage jest zablokowany.");
      }
    });
  } else {
    zakresOkna.localStorage = pamiecLokalna;
  }

  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Date: Date,
    JSON: JSON,
    Error: Error
  };
  vm.createContext(kontekst);

  const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaModulu), "utf8");
  new vm.Script(kod, { filename: sciezkaModulu }).runInContext(kontekst);
  return zakresOkna.HarmonogramBetonowan.pamiecTras;
}

function zapiszTrase(modul, opis, dojazd, powrot) {
  return modul.zapiszTrase({
    idWezla: "Węzeł Świebodzice",
    opisLokalizacji: opis,
    czasDojazduMinuty: dojazd,
    czasPowrotuMinuty: powrot,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
}

function sprawdzListeBezZmianyDatyUzycia() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  zapiszTrase(modul, "Firma A | Budowa A", 10, 11);
  zapiszTrase(modul, "Firma B | Budowa B", 20, 21);
  zapiszTrase(modul, "Firma C | Budowa C", 30, 31);

  const zapisPrzedPodgladem = pamiecLokalna.getItem(kluczPamieci);
  const wynikListy = modul.pobierzListeTras();
  const zapisPoPodgladzie = pamiecLokalna.getItem(kluczPamieci);

  assert.equal(wynikListy.status, "odczytano-liste-tras");
  assert.equal(wynikListy.liczbaTras, 3);
  assert.deepEqual(
    Array.from(wynikListy.trasy, function (trasa) {
      return trasa.opisLokalizacji;
    }),
    ["Firma C | Budowa C", "Firma B | Budowa B", "Firma A | Budowa A"]
  );
  assert.equal(wynikListy.trasy[0].czasDojazduMinuty, 30);
  assert.equal(wynikListy.trasy[0].czasPowrotuMinuty, 31);
  assert.equal(zapisPoPodgladzie, zapisPrzedPodgladem);
}

function sprawdzUsuwanieJednegoWpisu() {
  const modul = uruchomModul(utworzPamiecLokalna(), false);

  zapiszTrase(modul, "Firma A | Budowa A", 10, 11);
  zapiszTrase(modul, "Firma B | Budowa B", 20, 21);
  zapiszTrase(modul, "Firma C | Budowa C", 30, 31);

  const listaPrzedUsunieciem = modul.pobierzListeTras();
  const trasaDoUsuniecia = listaPrzedUsunieciem.trasy.find(function (trasa) {
    return trasa.opisLokalizacji === "Firma B | Budowa B";
  });
  const wynikUsuniecia = modul.usunTrase(trasaDoUsuniecia.kluczTrasy);
  const listaPoUsunieciu = modul.pobierzListeTras();

  assert.equal(wynikUsuniecia.status, "usunieto-trase");
  assert.equal(wynikUsuniecia.liczbaTras, 2);
  assert.equal(wynikUsuniecia.trasa.opisLokalizacji, "Firma B | Budowa B");
  assert.deepEqual(
    Array.from(listaPoUsunieciu.trasy, function (trasa) {
      return trasa.opisLokalizacji;
    }),
    ["Firma C | Budowa C", "Firma A | Budowa A"]
  );
  assert.equal(modul.usunTrase(trasaDoUsuniecia.kluczTrasy).status, "brak-trasy");
  assert.equal(modul.usunTrase("").status, "blad-usuwania");
}

function sprawdzPodgladWTrybieSesji() {
  const modul = uruchomModul(null, true);

  zapiszTrase(modul, "Firma sesyjna | Budowa", 18, 19);
  const lista = modul.pobierzListeTras();

  assert.equal(lista.trybPamieci, "biezaca-sesja");
  assert.equal(lista.liczbaTras, 1);
  assert.equal(lista.trasy[0].opisLokalizacji, "Firma sesyjna | Budowa");
  assert.equal(modul.usunTrase(lista.trasy[0].kluczTrasy).status, "usunieto-trase");
  assert.equal(modul.pobierzListeTras().liczbaTras, 0);
}

sprawdzListeBezZmianyDatyUzycia();
sprawdzUsuwanieJednegoWpisu();
sprawdzPodgladWTrybieSesji();

console.log("✓ KP-2: podgląd i usuwanie zapisanych tras działa poprawnie.");
