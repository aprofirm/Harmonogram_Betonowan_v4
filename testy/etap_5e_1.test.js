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

function utworzListePomp() {
  return [{
    idPompy: "P-1",
    nazwa: "Pompa 1",
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "07:00",
    wysiegMetry: 32
  }];
}

function utworzParametry(liczbaGruszek) {
  return {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: liczbaGruszek
  };
}

function liczWywolaniaOgraniczonegoPrzydzialuGruszek(aplikacja) {
  const oryginalnaFunkcja =
    aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow;
  let liczbaWywolan = 0;

  aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow = function () {
    liczbaWywolan += 1;
    return oryginalnaFunkcja.apply(this, arguments);
  };

  return function () {
    return liczbaWywolan;
  };
}

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function pobierzWynikPompy(wynik, idBudowy) {
  return wynik.pompy.wynikiBudow.find(function (pozycja) {
    return pozycja.idBudowy === idBudowy;
  });
}

function pobierzKursyBudowy(wynik, idBudowy) {
  return wynik.kursy.filter(function (kurs) {
    return kurs.idBudowy === idBudowy;
  });
}

function sprawdzBrakDodatkowejIteracjiDlaStabilnegoPlanu() {
  const aplikacja = wczytajAplikacje();
  const pobierzLiczbeWywolan =
    liczWywolaniaOgraniczonegoPrzydzialuGruszek(aplikacja);
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5e1-stabilny.csv");
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(2)
  });

  assert.equal(pobierzBudowe(wynik, "A").startRoboczy, "08:00");
  assert.equal(
    pobierzLiczbeWywolan(),
    1,
    "Stabilny plan nie powinien uruchamiać zbędnej kolejnej iteracji gruszek."
  );
}

function sprawdzWielokrotnaIteracjePoKolejnychZmianachPlanu() {
  const aplikacja = wczytajAplikacje();
  const pobierzLiczbeWywolan =
    liczWywolaniaOgraniczonegoPrzydzialuGruszek(aplikacja);
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0",
    "B;Beta;Budowa B;09:20;16;Pompa;0;0",
    "X;Delta;Budowa X;09:40;8;Lej;0;0",
    "C;Gamma;Budowa C;10:50;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5e1-iteracja.csv");
  const zrodloPrzed = JSON.stringify(stanImportu);

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5e1" };
  stanImportu.budowy[1].przejazdyPompyMinuty = { C: 0 };
  stanImportu.budowy[1].zrodlaPrzejazdowPompy = { C: "test-5e1" };

  const zrodloPoTrasach = JSON.stringify(stanImportu);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(1)
  });
  const pompaB = pobierzWynikPompy(wynik, "B");
  const pompaC = pobierzWynikPompy(wynik, "C");

  assert.equal(pobierzBudowe(wynik, "A").startRoboczy, "08:00");
  assert.equal(pobierzBudowe(wynik, "B").startRoboczy, "09:30");
  assert.equal(pobierzBudowe(wynik, "X").startRoboczy, "09:40");
  assert.equal(pobierzBudowe(wynik, "C").startRoboczy, "11:25");

  assert.equal(
    pobierzLiczbeWywolan(),
    3,
    "Dwie kolejne zmiany planu powinny wymusić dokładnie dwa dodatkowe przeliczenia gruszek."
  );

  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "B"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["09:30", "10:20"]
  );
  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "C"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["11:25", "11:50"]
  );

  assert.equal(
    pompaB.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci,
    665
  );
  assert.equal(
    pompaC.rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
    665
  );
  assert.equal(pompaC.opoznienieZPowoduPompMinuty, 35);
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.dodatkowePrzesuniecieStartuMinuty,
    25
  );
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.minutaStartuBetonowaniaPrzedKorekta,
    660
  );
  assert.equal(
    pompaC.korektaPoRzeczywistychDostawach.minutaStartuBetonowaniaPoKorekcie,
    685
  );

  assert.equal(JSON.stringify(stanImportu), zrodloPoTrasach);
  assert.notEqual(zrodloPrzed, zrodloPoTrasach);
}

sprawdzBrakDodatkowejIteracjiDlaStabilnegoPlanu();
sprawdzWielokrotnaIteracjePoKolejnychZmianachPlanu();

console.log(
  "OK — 5E.1 powtarza zależne obliczenia tylko po zmianie planu i obsługuje kolejną korektę kaskady."
);
