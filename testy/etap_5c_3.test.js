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

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5c3.csv");
}

function utworzPompy(liczbaPomp) {
  return [1, 2].slice(0, liczbaPomp).map(function (numerPompy) {
    return {
      idPompy: "P-" + numerPompy,
      nazwa: "Pompa " + numerPompy,
      typ: "wlasna",
      aktywna: true,
      dostepnaOd: "07:00",
      wysiegMetry: 32
    };
  });
}

function utworzParametry(aplikacja, liczbaPomp) {
  return Object.assign({}, aplikacja.konfiguracja.parametryDomyslne, {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: liczbaPomp,
    trybGruszek: "oblicz-potrzebne"
  });
}

function przelicz(aplikacja, stanImportu, liczbaPomp) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzPompy(liczbaPomp),
    parametry: utworzParametry(aplikacja, liczbaPomp),
    opcjePomp: {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 0,
          zrodloCzasuPrzejazdu: "test-5c3"
        };
      }
    }
  });
}

function obliczBezposrednioEtap3(aplikacja, stanImportu) {
  const kopiaBudow = JSON.parse(JSON.stringify(stanImportu.budowy));
  const budowy = aplikacja.budowy.utworzListeRobocza(kopiaBudow, []);
  const parametry = utworzParametry(aplikacja, 2);

  budowy.forEach(function (budowa) {
    budowa.startRoboczy = budowa.startZadany;
  });

  const kursy = aplikacja.gruszki.obliczCzasyKursow(
    aplikacja.gruszki.generujKursy(
      budowy,
      parametry.pojemnoscGruszkiM3
    ),
    budowy,
    parametry
  );

  return aplikacja.gruszki.przydzielGruszkiDoKursow(kursy).kursy;
}

function pobierzStartRoboczy(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  }).startRoboczy;
}

function pobierzGodzinyKursow(wynik, idBudowy) {
  return Array.from(
    wynik.kursy.filter(function (kurs) {
      return kurs.idBudowy === idBudowy;
    }),
    function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }
  );
}

function sprawdzZgodnoscBezPrzesunieciaIBrakStarychKursow() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const kursyEtapu3 = obliczBezposrednioEtap3(aplikacja, stanImportu);
  const wynikJednejPompy = przelicz(aplikacja, stanImportu, 1);
  const zapisWynikuJednejPompy = JSON.stringify(wynikJednejPompy);

  assert.equal(pobierzStartRoboczy(wynikJednejPompy, "B"), "09:05");
  assert.deepEqual(
    pobierzGodzinyKursow(wynikJednejPompy, "B"),
    ["09:05", "09:20"]
  );

  wynikJednejPompy.kursy[0].godzinaRozpoczeciaRozladunku = "23:59";
  wynikJednejPompy.kursy.push({
    idKursu: "STARY-KURS",
    idBudowy: "B",
    godzinaRozpoczeciaRozladunku: "22:22"
  });

  const wynikDwochPomp = przelicz(aplikacja, stanImportu, 2);

  assert.equal(pobierzStartRoboczy(wynikDwochPomp, "B"), "08:10");
  assert.deepEqual(
    pobierzGodzinyKursow(wynikDwochPomp, "B"),
    ["08:10", "08:25"]
  );
  assert.equal(
    JSON.stringify(wynikDwochPomp.kursy),
    JSON.stringify(kursyEtapu3)
  );
  assert.equal(
    wynikDwochPomp.kursy.some(function (kurs) {
      return kurs.idKursu === "STARY-KURS" ||
        ["09:05", "09:20", "22:22", "23:59"].includes(
          kurs.godzinaRozpoczeciaRozladunku
        );
    }),
    false
  );

  const ponownyWynikJednejPompy = przelicz(aplikacja, stanImportu, 1);

  assert.equal(
    JSON.stringify(ponownyWynikJednejPompy),
    zapisWynikuJednejPompy
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzZgodnoscBezPrzesunieciaIBrakStarychKursow();

console.log(
  "OK — 5C.3 zachowuje wynik Etapu 3 i nie dziedziczy starych kursów."
);
