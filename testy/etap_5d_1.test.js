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
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5d1.csv");
}

function przelicz(aplikacja, stanImportu, liczbaGruszek) {
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
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: liczbaGruszek
    }
  });
}

function pobierzWynikPompy(wynik) {
  assert.equal(wynik.pompy.wynikiBudow.length, 1);
  return wynik.pompy.wynikiBudow[0];
}

function sprawdzRzeczywisteOknoBetonowania() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynikJednejGruszki = przelicz(aplikacja, stanImportu, 1);
  const wynikDwochGruszek = przelicz(aplikacja, stanImportu, 2);
  const pompaJednaGruszka = pobierzWynikPompy(wynikJednejGruszki);
  const pompaDwieGruszki = pobierzWynikPompy(wynikDwochGruszek);

  assert.deepEqual(
    Array.from(wynikJednejGruszki.kursy, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["08:00", "08:25"]
  );
  assert.deepEqual(
    Array.from(wynikJednejGruszki.kursy, function (kurs) {
      return kurs.godzinaZakonczeniaRozladunku;
    }),
    ["08:15", "08:40"]
  );
  assert.deepEqual(
    Array.from(wynikJednejGruszki.kursy, function (kurs) {
      return kurs.opoznienieZPowoduGruszekMinuty;
    }),
    [0, 10]
  );

  assert.equal(
    pompaJednaGruszka.planowaneOknoBetonowania.minutaRozpoczeciaBetonowania,
    480
  );
  assert.equal(
    pompaJednaGruszka.planowaneOknoBetonowania.minutaZakonczeniaBetonowania,
    510
  );
  assert.equal(
    pompaJednaGruszka.planowaneOknoBetonowania.czasBetonowaniaMinuty,
    30
  );
  assert.equal(
    pompaJednaGruszka.rzeczywisteOknoBetonowania.minutaRozpoczeciaBetonowania,
    480
  );
  assert.equal(
    pompaJednaGruszka.rzeczywisteOknoBetonowania.minutaZakonczeniaBetonowania,
    520
  );
  assert.equal(
    pompaJednaGruszka.rzeczywisteOknoBetonowania.czasBetonowaniaMinuty,
    40
  );

  assert.equal(
    pompaJednaGruszka.okresZajetosci.minutaRozpoczeciaZajetosci,
    460
  );
  assert.equal(
    pompaJednaGruszka.okresZajetosci.minutaZakonczeniaZajetosci,
    540
  );
  assert.equal(
    pompaJednaGruszka.rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
    460
  );
  assert.equal(
    pompaJednaGruszka.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    550
  );
  assert.equal(
    pompaJednaGruszka.rzeczywistyOkresZajetosci.czasBetonowaniaMinuty,
    40
  );
  assert.equal(
    pompaJednaGruszka.rzeczywistyOkresZajetosci.czasZajetosciPompyMinuty,
    90
  );

  assert.equal(
    wynikJednejGruszki.pompy.okresyZajetosci[0]
      .rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    550
  );
  assert.equal(
    wynikJednejGruszki.pompy.stanPomp[0].przydzialy[0]
      .rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    550
  );

  assert.deepEqual(
    Array.from(wynikDwochGruszek.kursy, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["08:00", "08:15"]
  );
  assert.equal(
    pompaDwieGruszki.rzeczywisteOknoBetonowania.minutaZakonczeniaBetonowania,
    510
  );
  assert.equal(
    pompaDwieGruszki.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    540
  );

  assert.equal(wynikJednejGruszki.budowy[0].startRoboczy, "08:00");
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzRzeczywisteOknoBetonowania();

console.log(
  "OK — 5D.1 liczy okno i zajętość pompy z rzeczywistych rozładunków po przydziale gruszek."
);
