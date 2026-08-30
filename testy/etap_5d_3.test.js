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
    "B;Beta;Budowa B;09:20;16;Pompa;0;0",
    "C;Gamma;Budowa C;10:50;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5d3.csv");

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5d3" };
  stanImportu.budowy[1].przejazdyPompyMinuty = { C: 0 };
  stanImportu.budowy[1].zrodlaPrzejazdowPompy = { C: "test-5d3" };

  return stanImportu;
}

function przelicz(aplikacja, stanImportu) {
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
      liczbaDostepnychGruszek: 1
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

function sprawdzBrakNakladaniaPompy(wynik) {
  const okresy = ["A", "B", "C"].map(function (idBudowy) {
    return pobierzWynikBudowy(wynik, idBudowy).rzeczywistyOkresZajetosci;
  });

  for (let indeks = 1; indeks < okresy.length; indeks += 1) {
    assert.ok(
      okresy[indeks].minutaRozpoczeciaZajetosci >=
        okresy[indeks - 1].minutaZakonczeniaZajetosci,
      "Rzeczywiste okresy jednej pompy nie mogą się nakładać."
    );
  }
}

function sprawdzBrakNakladaniaGruszki(wynik) {
  const kursy = wynik.kursy
    .filter(function (kurs) {
      return kurs.statusKursu === "przydzielony";
    })
    .slice()
    .sort(function (a, b) {
      return a.minutaRozpoczeciaZaladunku - b.minutaRozpoczeciaZaladunku;
    });

  kursy.slice(1).forEach(function (kurs, indeks) {
    assert.ok(
      kurs.minutaRozpoczeciaZaladunku >=
        kursy[indeks].minutaGotowosciDoKolejnegoKursu,
      "Kursy jednej gruszki nie mogą się nakładać."
    );
  });
}

function sprawdzKaskadeTrzechBudow() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynik = przelicz(aplikacja, stanImportu);
  const wynikPowtorny = przelicz(aplikacja, stanImportu);
  const pompaA = pobierzWynikBudowy(wynik, "A");
  const pompaB = pobierzWynikBudowy(wynik, "B");
  const pompaC = pobierzWynikBudowy(wynik, "C");
  const budowaA = pobierzBudowe(wynik, "A");
  const budowaB = pobierzBudowe(wynik, "B");
  const budowaC = pobierzBudowe(wynik, "C");

  assert.equal(budowaA.startRoboczy, "08:00");
  assert.equal(budowaB.startRoboczy, "09:30");
  assert.equal(budowaC.startRoboczy, "11:00");

  assert.equal(
    pompaA.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    550
  );
  assert.equal(
    pompaB.rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
    550
  );
  assert.equal(
    pompaB.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    640
  );
  assert.equal(
    pompaC.rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
    640
  );

  assert.equal(pompaB.korektaPoRzeczywistychDostawach.idPoprzedniejBudowy, "A");
  assert.equal(
    pompaB.korektaPoRzeczywistychDostawach.dodatkowePrzesuniecieStartuMinuty,
    10
  );
  assert.equal(pompaC.korektaPoRzeczywistychDostawach.idPoprzedniejBudowy, "B");
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.dodatkowePrzesuniecieStartuMinuty,
    10
  );

  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "A"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["08:00", "08:25"]
  );
  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "B"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:30", "09:55"]
  );
  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "C"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["11:00", "11:25"]
  );

  sprawdzBrakNakladaniaPompy(wynik);
  sprawdzBrakNakladaniaGruszki(wynik);

  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikPowtorny)),
    JSON.parse(JSON.stringify(wynik)),
    "Identyczne dane wejściowe powinny dawać identyczny wynik kaskady."
  );
  assert.equal(JSON.stringify(stanImportu), zrodloPrzed);
}

sprawdzKaskadeTrzechBudow();

console.log(
  "OK — 5D.3 potwierdza kaskadę A → B → C bez nakładania pracy jednej pompy i jednej gruszki."
);
