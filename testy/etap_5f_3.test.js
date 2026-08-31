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

function utworzParametry() {
  return {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    maksymalneOpoznienieStartuMinuty: 30,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: 1
  };
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
    "etap-5f3.csv"
  );

  stanImportu.budowy[0].przejazdyPompyMinuty = { B: 0 };
  stanImportu.budowy[0].zrodlaPrzejazdowPompy = { B: "test-5f3" };
  stanImportu.budowy[1].przejazdyPompyMinuty = { C: 0 };
  stanImportu.budowy[1].zrodlaPrzejazdowPompy = { C: "test-5f3" };

  return stanImportu;
}

function przelicz(aplikacja, stanImportu) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry()
  });
}

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function pobierzKonfliktyLimitu(wynik) {
  return wynik.konflikty.filter(function (konflikt) {
    return konflikt.kod === "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU";
  });
}

function sprawdzKlasyfikacjeGlobalnegoLimitu() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanKaskady(aplikacja);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynik = przelicz(aplikacja, stanImportu);
  const budowaA = pobierzBudowe(wynik, "A");
  const budowaB = pobierzBudowe(wynik, "B");
  const budowaC = pobierzBudowe(wynik, "C");
  const konfliktyLimitu = pobierzKonfliktyLimitu(wynik);

  assert.equal(budowaA.startRoboczy, "08:00");
  assert.deepEqual(
    JSON.parse(JSON.stringify(budowaA.ocenaOpoznieniaStartu)),
    {
      status: "bez-opoznienia",
      startZadany: "08:00",
      startRoboczy: "08:00",
      opoznienieStartuMinuty: 0,
      efektywnyLimitOpoznieniaStartuMinuty: 30,
      przekroczenieLimituMinuty: 0,
      czyPrzekroczonoLimit: false
    }
  );

  assert.equal(budowaB.startRoboczy, "09:30");
  assert.equal(budowaB.ocenaOpoznieniaStartu.status, "korekta-w-limicie");
  assert.equal(budowaB.ocenaOpoznieniaStartu.opoznienieStartuMinuty, 10);
  assert.equal(
    budowaB.ocenaOpoznieniaStartu.efektywnyLimitOpoznieniaStartuMinuty,
    30
  );
  assert.equal(budowaB.ocenaOpoznieniaStartu.czyPrzekroczonoLimit, false);

  assert.equal(budowaC.startRoboczy, "11:25");
  assert.equal(
    budowaC.ocenaOpoznieniaStartu.status,
    "konflikt-przekroczenia-limitu"
  );
  assert.equal(budowaC.ocenaOpoznieniaStartu.opoznienieStartuMinuty, 35);
  assert.equal(budowaC.ocenaOpoznieniaStartu.przekroczenieLimituMinuty, 5);
  assert.equal(konfliktyLimitu.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(konfliktyLimitu[0])),
    {
      kod: "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU",
      rodzaj: "limit-opoznienia-startu",
      idBudowy: "C",
      nazwaBudowy: "Budowa C",
      startZadany: "10:50",
      startRoboczy: "11:25",
      opoznienieStartuMinuty: 35,
      maksymalneOpoznienieStartuMinuty: 30,
      przekroczenieLimituMinuty: 5,
      opis: "Budowa „Budowa C” ma StartRoboczy 11:25, czyli 35 min po StartZadany 10:50. Dopuszczalny limit 30 min został przekroczony o 5 min."
    }
  );
  assert.equal(
    JSON.stringify(stanImportu),
    zrodloPrzed,
    "Klasyfikacja wyniku nie może dopisywać pól do źródłowego stanu importu."
  );
}

function sprawdzPierwszenstwoLimituIndywidualnegoIGranice() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanKaskady(aplikacja);
  const budowaB = stanImportu.budowy.find(function (budowa) {
    return budowa.idBudowy === "B";
  });
  const budowaC = stanImportu.budowy.find(function (budowa) {
    return budowa.idBudowy === "C";
  });

  budowaB.maksymalneOpoznienieStartuBudowyMinuty = 10;
  budowaC.maksymalneOpoznienieStartuBudowyMinuty = 40;

  const wynikNaGranicy = przelicz(aplikacja, stanImportu);

  assert.equal(pobierzKonfliktyLimitu(wynikNaGranicy).length, 0);
  assert.equal(
    pobierzBudowe(wynikNaGranicy, "B").ocenaOpoznieniaStartu.status,
    "korekta-w-limicie",
    "Opóźnienie równe limitowi nie jest przekroczeniem."
  );
  assert.equal(
    pobierzBudowe(wynikNaGranicy, "C")
      .ocenaOpoznieniaStartu.efektywnyLimitOpoznieniaStartuMinuty,
    40,
    "Indywidualne 40 min ma pierwszeństwo przed globalnymi 30 min."
  );

  budowaB.maksymalneOpoznienieStartuBudowyMinuty = 9;
  const wynikPoPrzekroczeniu = przelicz(aplikacja, stanImportu);
  const konfliktB = pobierzKonfliktyLimitu(wynikPoPrzekroczeniu)[0];

  assert.equal(pobierzKonfliktyLimitu(wynikPoPrzekroczeniu).length, 1);
  assert.equal(konfliktB.idBudowy, "B");
  assert.equal(konfliktB.opoznienieStartuMinuty, 10);
  assert.equal(konfliktB.maksymalneOpoznienieStartuMinuty, 9);
  assert.equal(konfliktB.przekroczenieLimituMinuty, 1);
  assert.equal(aplikacja.konfiguracja.punktEtapu, "5F.3");
}

function sprawdzPowtarzalnoscKlasyfikacji() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanKaskady(aplikacja);
  const wynikPierwszy = przelicz(aplikacja, stanImportu);
  const wynikDrugi = przelicz(aplikacja, stanImportu);

  assert.deepEqual(
    JSON.parse(JSON.stringify(wynikDrugi)),
    JSON.parse(JSON.stringify(wynikPierwszy)),
    "Identyczne dane muszą dawać identyczne oceny i konflikty limitu startu."
  );
}

sprawdzKlasyfikacjeGlobalnegoLimitu();
sprawdzPierwszenstwoLimituIndywidualnegoIGranice();
sprawdzPowtarzalnoscKlasyfikacji();

console.log(
  "OK — 5F.3 rozróżnia korektę w limicie od jawnego konfliktu i respektuje limit indywidualny."
);
