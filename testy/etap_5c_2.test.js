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
    TextDecoder: TextDecoder,
    FileReader: function () {},
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
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStanImportu(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0",
    "B;Beta;Budowa B;08:10;16;Pompa;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5c2.csv");
}

function przelicz(aplikacja, stanImportu, trybGruszek, liczbaGruszek) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [{
      idPompy: "P-1",
      nazwa: "Pompa 1",
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: 32
    }],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 1,
      trybGruszek: trybGruszek,
      liczbaDostepnychGruszek: liczbaGruszek
    },
    opcjePomp: {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 0,
          zrodloCzasuPrzejazdu: "test-5c2"
        };
      }
    }
  });
}

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function pobierzKursyBudowy(wynik, idBudowy) {
  return wynik.kursy.filter(function (kurs) {
    return kurs.idBudowy === idBudowy;
  });
}

function sprawdzPonownyPrzydzialGruszek() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynikBezLimitu = przelicz(
    aplikacja,
    stanImportu,
    "oblicz-potrzebne",
    null
  );
  const wynikJednejGruszki = przelicz(
    aplikacja,
    stanImportu,
    "mam-okreslona-liczbe",
    1
  );
  const kursyBezLimitu = pobierzKursyBudowy(wynikBezLimitu, "B");
  const kursyJednejGruszki = pobierzKursyBudowy(
    wynikJednejGruszki,
    "B"
  );

  assert.equal(pobierzBudowe(wynikBezLimitu, "B").startRoboczy, "09:05");
  assert.equal(
    pobierzBudowe(wynikJednejGruszki, "B").startRoboczy,
    "09:05"
  );
  assert.deepEqual(
    Array.from(kursyBezLimitu, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:05", "09:20"]
  );
  assert.deepEqual(
    Array.from(kursyBezLimitu, function (kurs) {
      return kurs.idGruszki;
    }),
    ["GRUSZKA-001", "GRUSZKA-002"]
  );
  assert.equal(wynikBezLimitu.minimalnaLiczbaGruszek, 2);

  assert.deepEqual(
    Array.from(kursyJednejGruszki, function (kurs) {
      return kurs.planowanaGodzinaRozpoczeciaRozladunku;
    }),
    ["09:05", "09:20"]
  );
  assert.deepEqual(
    Array.from(kursyJednejGruszki, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:05", "09:30"]
  );
  assert.deepEqual(
    Array.from(kursyJednejGruszki, function (kurs) {
      return kurs.opoznienieZPowoduGruszekMinuty;
    }),
    [0, 10]
  );
  assert.deepEqual(
    Array.from(kursyJednejGruszki, function (kurs) {
      return kurs.idGruszki;
    }),
    ["GRUSZKA-001", "GRUSZKA-001"]
  );
  assert.equal(wynikJednejGruszki.gruszki.liczbaOpoznionychKursow, 1);
  assert.equal(
    wynikJednejGruszki.gruszki.maksymalneOpoznienieKursuMinuty,
    10
  );
  assert.equal(
    JSON.stringify(wynikBezLimitu.gruszki.przydzieloneKursy),
    JSON.stringify(wynikBezLimitu.kursy)
  );
  assert.equal(
    JSON.stringify(wynikJednejGruszki.gruszki.przydzieloneKursy),
    JSON.stringify(wynikJednejGruszki.kursy)
  );
  assert.equal(
    wynikJednejGruszki.kursy.some(function (kurs) {
      return kurs.idBudowy === "B" &&
        ["08:10", "08:25"].includes(
          kurs.planowanaGodzinaRozpoczeciaRozladunku
        );
    }),
    false
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzPonownyPrzydzialGruszek();

console.log(
  "OK — 5C.2 przydziela oba tryby gruszek wyłącznie do nowych kursów."
);
