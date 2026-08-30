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

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function sprawdzJawnyStanStabilnyBezKorekty() {
  const aplikacja = wczytajAplikacje();
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(
    csv,
    "etap-5e2-stabilny.csv"
  );
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(2)
  });

  assert.equal(pobierzBudowe(wynik, "A").startRoboczy, "08:00");
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynik.stabilizacja)),
    {
      status: "stabilny",
      czyStabilny: true,
      powodZakonczenia: "brak-zmiany-startow-roboczych",
      liczbaIteracji: 1,
      liczbaIteracjiZeZmiana: 0,
      czyPlanZmienilSieWOstatniejIteracji: false,
      maksymalnaLiczbaIteracji: 50,
      czyPrzekroczonoLimit: false
    }
  );
}

function utworzStanKaskady(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;16;Pompa;0;0",
    "B;Beta;Budowa B;09:20;16;Pompa;0;0",
    "X;Delta;Budowa X;09:40;8;Lej;0;0",
    "C;Gamma;Budowa C;10:50;16;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(
    csv,
    "etap-5e2-kaskada.csv"
  );

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5e2" };
  stanImportu.budowy[1].przejazdyPompyMinuty = { C: 0 };
  stanImportu.budowy[1].zrodlaPrzejazdowPompy = { C: "test-5e2" };

  return stanImportu;
}

function przeliczKaskade(aplikacja, stanImportu) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(1)
  });
}

function sprawdzZakonczeniePoUstabilizowaniuIKolejneIdentycznePrzeliczenie() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanKaskady(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynikPierwszy = przeliczKaskade(aplikacja, stanImportu);
  const wynikDrugi = przeliczKaskade(aplikacja, stanImportu);

  assert.equal(pobierzBudowe(wynikPierwszy, "B").startRoboczy, "09:30");
  assert.equal(pobierzBudowe(wynikPierwszy, "C").startRoboczy, "11:25");
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikPierwszy.stabilizacja)),
    {
      status: "stabilny",
      czyStabilny: true,
      powodZakonczenia: "brak-zmiany-startow-roboczych",
      liczbaIteracji: 3,
      liczbaIteracjiZeZmiana: 2,
      czyPlanZmienilSieWOstatniejIteracji: false,
      maksymalnaLiczbaIteracji: 50,
      czyPrzekroczonoLimit: false
    }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikDrugi)),
    JSON.parse(JSON.stringify(wynikPierwszy)),
    "Identyczne dane wejściowe muszą dawać identyczny ustabilizowany wynik."
  );
  assert.equal(
    JSON.stringify(stanImportu),
    zrodloPrzed,
    "Pełne przeliczenie nie może zmieniać źródłowego stanu importu."
  );
}

sprawdzJawnyStanStabilnyBezKorekty();
sprawdzZakonczeniePoUstabilizowaniuIKolejneIdentycznePrzeliczenie();

console.log(
  "OK — 5E.2 kończy przeliczenie po stabilizacji StartRoboczy i zachowuje identyczny wynik dla identycznych danych."
);
