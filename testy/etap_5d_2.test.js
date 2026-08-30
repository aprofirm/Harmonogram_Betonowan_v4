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
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0",
    "B;Beta;Budowa B;09:20;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5d2.csv");

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5d2" };

  return stanImportu;
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

function pobierzWynikBudowy(wynik, idBudowy) {
  return wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === idBudowy;
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

function sprawdzWplywRzeczywistejZajetosciNaNastepnaBudowe() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynikJednejGruszki = przelicz(aplikacja, stanImportu, 1);
  const wynikDwochGruszek = przelicz(aplikacja, stanImportu, 2);
  const pompaAJedna = pobierzWynikBudowy(wynikJednejGruszki, "A");
  const pompaBJedna = pobierzWynikBudowy(wynikJednejGruszki, "B");
  const pompaBDwie = pobierzWynikBudowy(wynikDwochGruszek, "B");
  const budowaBJedna = pobierzBudowe(wynikJednejGruszki, "B");
  const budowaBDwie = pobierzBudowe(wynikDwochGruszek, "B");
  const kursyBJedna = pobierzKursyBudowy(wynikJednejGruszki, "B");

  assert.equal(
    pompaAJedna.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    550
  );

  assert.equal(budowaBJedna.startRoboczy, "09:30");
  assert.equal(pompaBJedna.minutaRzeczywistegoStartuBetonowania, 570);
  assert.equal(pompaBJedna.opoznienieZPowoduPompMinuty, 10);
  assert.equal(
    pompaBJedna.rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
    550
  );
  assert.equal(
    pompaBJedna.korektaPoRzeczywistychDostawach.idPoprzedniejBudowy,
    "A"
  );
  assert.equal(
    pompaBJedna.korektaPoRzeczywistychDostawach.minutaGotowosciPompyPoPoprzedniejBudowie,
    550
  );
  assert.equal(
    pompaBJedna.korektaPoRzeczywistychDostawach.dodatkowePrzesuniecieStartuMinuty,
    10
  );
  assert.deepEqual(
    Array.from(kursyBJedna, function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:30", "09:55"]
  );

  assert.equal(budowaBDwie.startRoboczy, "09:20");
  assert.equal(pompaBDwie.minutaRzeczywistegoStartuBetonowania, 560);
  assert.equal(pompaBDwie.korektaPoRzeczywistychDostawach, null);

  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzWplywRzeczywistejZajetosciNaNastepnaBudowe();

console.log(
  "OK — 5D.2 przenosi wydłużoną rzeczywistą zajętość pompy na start następnej budowy."
);
