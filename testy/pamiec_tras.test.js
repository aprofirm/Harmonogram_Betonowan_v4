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
    },
    ustawSurowaWartosc: function (klucz, wartosc) {
      dane.set(klucz, wartosc);
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

function zapiszPrzykladowaTrase(modul, opis, dojazd, powrot) {
  return modul.zapiszTrase({
    idWezla: "Węzeł Świebodzice",
    opisLokalizacji: opis,
    czasDojazduMinuty: dojazd,
    czasPowrotuMinuty: powrot,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
}

function sprawdzTrwalyZapisINormalizacje() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);
  const stanPoczatkowy = modul.pobierzStanPamieci();

  assert.equal(stanPoczatkowy.trybPamieci, "trwala");
  assert.equal(stanPoczatkowy.liczbaTras, 0);
  assert.equal(stanPoczatkowy.maksymalnaLiczbaTras, 1000);
  assert.equal(stanPoczatkowy.maksymalnyRozmiarPamieciBajty, 1024 * 1024);

  const wynikZapisu = zapiszPrzykladowaTrase(
    modul,
    "  POLST, Jachimowicza 2  ",
    24,
    31
  );

  assert.equal(wynikZapisu.status, "zapisano-trwale");
  assert.equal(wynikZapisu.liczbaTras, 1);
  assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieci)).wersja, 1);

  const modulPoOdswiezeniu = uruchomModul(pamiecLokalna, false);
  const wynikOdczytu = modulPoOdswiezeniu.pobierzTrase(
    "polst jachimówicza 2",
    "wezel swiebodzice"
  );

  assert.equal(wynikOdczytu.status, "odczytano-trase");
  assert.equal(wynikOdczytu.zrodloOdczytu, "pamiec");
  assert.equal(wynikOdczytu.trasa.czasDojazduMinuty, 24);
  assert.equal(wynikOdczytu.trasa.czasPowrotuMinuty, 31);
  assert.equal(wynikOdczytu.trasa.zrodloCzasuDojazdu, "reczny");
}

function sprawdzDokladneDopasowanieINadpisanie() {
  const modul = uruchomModul(utworzPamiecLokalna(), false);

  zapiszPrzykladowaTrase(modul, "Budowa przedszkola", 20, 20);
  assert.equal(
    modul.pobierzTrase("Budowa przedszkola - etap 2", "Węzeł Świebodzice").status,
    "brak-trasy"
  );

  zapiszPrzykladowaTrase(modul, "Budowa przedszkola", 22, 27);
  const stan = modul.pobierzStanPamieci();
  const trasa = modul.pobierzTrase(
    "BUDOWA PRZEDSZKOLA",
    "Węzeł Świebodzice"
  ).trasa;

  assert.equal(stan.liczbaTras, 1);
  assert.equal(trasa.czasDojazduMinuty, 22);
  assert.equal(trasa.czasPowrotuMinuty, 27);
}

function sprawdzBledyIAwaryjnaPamiec() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  assert.equal(zapiszPrzykladowaTrase(modul, "", 20, 20).status, "blad-zapisu");
  assert.equal(zapiszPrzykladowaTrase(modul, "Adres", -1, 20).status, "blad-zapisu");

  pamiecLokalna.ustawSurowaWartosc(kluczPamieci, "{uszkodzony-json");
  assert.equal(modul.pobierzStanPamieci().liczbaTras, 0);
  assert.equal(pamiecLokalna.getItem(kluczPamieci), null);

  const modulSesyjny = uruchomModul(null, true);
  assert.equal(modulSesyjny.pobierzStanPamieci().trybPamieci, "biezaca-sesja");
  assert.equal(
    zapiszPrzykladowaTrase(modulSesyjny, "Trasa sesyjna", 18, 19).status,
    "zapisano-w-sesji"
  );
  assert.equal(
    modulSesyjny.pobierzTrase("Trasa sesyjna", "Węzeł Świebodzice").trasa
      .czasPowrotuMinuty,
    19
  );
}

function sprawdzLimitTysiacaTras() {
  const pamiecLokalna = utworzPamiecLokalna();
  const modul = uruchomModul(pamiecLokalna, false);

  for (let numerTrasy = 0; numerTrasy < 1000; numerTrasy += 1) {
    const wynik = zapiszPrzykladowaTrase(
      modul,
      "Trasa testowa " + numerTrasy,
      10 + (numerTrasy % 10),
      10 + (numerTrasy % 10)
    );
    assert.match(wynik.status, /^zapisano-/);
  }

  assert.equal(
    modul.pobierzTrase("Trasa testowa 0", "Węzeł Świebodzice").status,
    "odczytano-trase"
  );

  for (let numerTrasy = 1000; numerTrasy < 1005; numerTrasy += 1) {
    zapiszPrzykladowaTrase(
      modul,
      "Trasa testowa " + numerTrasy,
      10,
      10
    );
  }

  const stan = modul.pobierzStanPamieci();

  assert.equal(stan.liczbaTras, 1000);
  assert.equal(
    modul.pobierzTrase("Trasa testowa 1", "Węzeł Świebodzice").status,
    "brak-trasy"
  );
  assert.equal(
    modul.pobierzTrase("Trasa testowa 0", "Węzeł Świebodzice").status,
    "odczytano-trase"
  );
  assert.equal(
    modul.pobierzTrase("Trasa testowa 1004", "Węzeł Świebodzice").status,
    "odczytano-trase"
  );
  assert.equal(stan.rozmiarBajtow <= 1024 * 1024, true);
}

sprawdzTrwalyZapisINormalizacje();
sprawdzDokladneDopasowanieINadpisanie();
sprawdzBledyIAwaryjnaPamiec();
sprawdzLimitTysiacaTras();

console.log("✓ KP-2.2: wersjonowana pamięć 1000 znanych tras działa poprawnie.");
