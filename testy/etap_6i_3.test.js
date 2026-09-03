"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

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

function uruchomSrodowisko(pamiecLokalna) {
  let liczbaProbSieciowych = 0;
  const zakresOkna = {
    localStorage: pamiecLokalna,
    fetch: function () {
      liczbaProbSieciowych += 1;
      return Promise.reject(new Error("Test 6I.3: sieć jest niedostępna."));
    }
  };
  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    fetch: zakresOkna.fetch,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Error: Error,
    Map: Map,
    Set: Set,
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/pamiec/pamiec_planu.js",
    "js/pamiec/pamiec_tras.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/edycja_przejazdow_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js",
    "js/lokalizacje/integracja_przejazdow_pomp.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  const aplikacja = zakresOkna.HarmonogramBetonowan;
  aplikacja.pamiecPlanu.uruchomPamiecPlanu();
  aplikacja.pamiecTras.uruchomPamiecTras();

  return {
    aplikacja: aplikacja,
    pobierzLiczbeProbSieciowych: function () {
      return liczbaProbSieciowych;
    }
  };
}

function utworzStanImportu(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;Adres budowy",
    "A;Firma A;Budowa A;08:00;8;Pompa;Testowa 1, Miasto Testowe",
    "B;Firma B;Budowa B;09:20;8;Pompa;Testowa 2, Miasto Testowe"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-6i3-offline.csv");
}

function utworzParametry() {
  return {
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    maksymalneOpoznienieStartuMinuty: 30,
    maksymalnyPrzestojMinuty: 15,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: 1,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: 1
  };
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

async function przygotujZapisanyPlanOnline(pamiecLokalna) {
  const srodowisko = uruchomSrodowisko(pamiecLokalna);
  const aplikacja = srodowisko.aplikacja;
  const stanImportu = utworzStanImportu(aplikacja);
  const budowaA = stanImportu.budowy[0];
  const budowaB = stanImportu.budowy[1];

  aplikacja.budowy.ustawCzasyRobocze(budowaA, {
    czasDojazduRoboczyMinuty: 12,
    czasPowrotuRoboczyMinuty: 14,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
  aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci(budowaA);

  let liczbaWywolanMapyPrzyPrzygotowaniu = 0;
  const wynikMapy = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    budowaB,
    function () {
      liczbaWywolanMapyPrzyPrzygotowaniu += 1;
      return {
        czasDojazduMinuty: 18,
        czasPowrotuMinuty: 20
      };
    }
  );

  assert.equal(wynikMapy.status, "uzyto-wyniku-mapy");
  assert.equal(liczbaWywolanMapyPrzyPrzygotowaniu, 1);
  assert.equal(budowaB.zrodloCzasuDojazdu, "mapa");
  assert.equal(budowaB.zrodloCzasuPowrotu, "mapa");

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    budowaA,
    "B",
    7,
    "mapa"
  );
  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    budowaB,
    "A",
    9,
    "mapa"
  );

  const danePlanu = {
    wersjaStanuAplikacji: 4,
    nazwaPliku: "etap-6i3-offline.csv",
    separator: ";",
    ostrzezeniaImportu: [],
    budowyZImportu: stanImportu.budowy,
    budowyReczne: [],
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(),
    czyHarmonogramPrzeliczony: true
  };
  const wynikZapisu = aplikacja.pamiecPlanu.zapiszPlan(danePlanu);

  assert.equal(wynikZapisu.status, "zapisano-trwale");
  return danePlanu;
}

function pobierzKonfliktyBrakuTrasy(wynik) {
  return (Array.isArray(wynik.konflikty) ? wynik.konflikty : []).filter(
    function (konflikt) {
      return konflikt && konflikt.przyczyna === "brak-trasy";
    }
  );
}

async function sprawdzPelnyPrzeplywOffline() {
  const pamiecLokalna = utworzPamiecLokalna();
  await przygotujZapisanyPlanOnline(pamiecLokalna);

  // Nowe środowisko symuluje ponowne uruchomienie aplikacji już bez sieci.
  const offline = uruchomSrodowisko(pamiecLokalna);
  const aplikacja = offline.aplikacja;
  const wynikOdczytu = aplikacja.pamiecPlanu.odczytajPlan();

  assert.equal(wynikOdczytu.status, "odczytano");
  const plan = wynikOdczytu.danePlanu;
  const budowaA = plan.budowyZImportu[0];
  const budowaB = plan.budowyZImportu[1];

  assert.equal(budowaA.czasDojazduRoboczyMinuty, 12);
  assert.equal(budowaA.czasPowrotuRoboczyMinuty, 14);
  assert.equal(budowaA.zrodloCzasuDojazdu, "reczny");
  assert.equal(budowaB.czasDojazduRoboczyMinuty, 18);
  assert.equal(budowaB.czasPowrotuRoboczyMinuty, 20);
  assert.equal(budowaB.zrodloCzasuDojazdu, "mapa");
  assert.equal(budowaA.przejazdyPompyMinuty.B, 7);
  assert.equal(budowaA.zrodlaPrzejazdowPompy.B, "mapa");
  assert.equal(budowaB.przejazdyPompyMinuty.A, 9);
  assert.equal(budowaB.zrodlaPrzejazdowPompy.A, "mapa");

  let liczbaWywolanJawnejMapy = 0;
  const wynikGotowejTrasy = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    budowaB,
    function () {
      liczbaWywolanJawnejMapy += 1;
      throw new Error("Mapa nie powinna być potrzebna dla zapisanej trasy.");
    }
  );

  assert.equal(wynikGotowejTrasy.status, "uzyto-biezacych-czasow");
  assert.equal(wynikGotowejTrasy.czyWywolanoMape, false);
  assert.equal(liczbaWywolanJawnejMapy, 0);

  const wynikPrzejazduPompy =
    await aplikacja.lokalizacje.pobierzIZastosujTrasyPrzejazdowPomp(
      budowaA,
      budowaB,
      null
    );

  assert.equal(
    wynikPrzejazduPompy.status,
    "uzyto-biezacych-przejazdow-pomp"
  );
  assert.equal(wynikPrzejazduPompy.czyWywolanoMape, false);
  assert.equal(budowaA.przejazdyPompyMinuty.B, 7);
  assert.equal(budowaB.przejazdyPompyMinuty.A, 9);

  const wynikHarmonogramu = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: {
      budowy: plan.budowyZImportu,
      ostrzezenia: []
    },
    budowyReczne: plan.budowyReczne,
    listaPomp: plan.listaPomp,
    parametry: plan.parametry
  });

  assert.equal(wynikHarmonogramu.status, "gotowy");
  assert.equal(wynikHarmonogramu.budowy.length, 2);
  assert.equal(wynikHarmonogramu.kursy.length, 2);
  assert.equal(pobierzKonfliktyBrakuTrasy(wynikHarmonogramu).length, 0);
  assert.equal(offline.pobierzLiczbeProbSieciowych(), 0);

  // Również dokładny cache działa po ponownym uruchomieniu bez mapy.
  const ponownieZaimportowanaB = utworzStanImportu(aplikacja).budowy[1];
  const wynikCache = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    ponownieZaimportowanaB,
    function () {
      liczbaWywolanJawnejMapy += 1;
      throw new Error("Dokładny cache powinien mieć pierwszeństwo przed mapą.");
    }
  );

  assert.equal(wynikCache.status, "uzyto-pamieci-tras");
  assert.equal(wynikCache.czyWywolanoMape, false);
  assert.equal(liczbaWywolanJawnejMapy, 0);
  assert.equal(ponownieZaimportowanaB.czasDojazduRoboczyMinuty, 18);
  assert.equal(ponownieZaimportowanaB.czasPowrotuRoboczyMinuty, 20);
  assert.equal(ponownieZaimportowanaB.zrodloCzasuDojazdu, "pamiec");
  assert.equal(offline.pobierzLiczbeProbSieciowych(), 0);
}

function sprawdzJawnyBrakTrasyIRecznyFallback() {
  const srodowisko = uruchomSrodowisko(utworzPamiecLokalna());
  const aplikacja = srodowisko.aplikacja;
  const stanImportu = utworzStanImportu(aplikacja);
  const budowaA = stanImportu.budowy[0];
  const budowaB = stanImportu.budowy[1];

  aplikacja.budowy.ustawCzasyRobocze(budowaA, {
    czasDojazduRoboczyMinuty: 12,
    czasPowrotuRoboczyMinuty: 14,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
  aplikacja.budowy.ustawCzasyRobocze(budowaB, {
    czasDojazduRoboczyMinuty: 18,
    czasPowrotuRoboczyMinuty: 20,
    zrodloCzasuDojazdu: "pamiec",
    zrodloCzasuPowrotu: "pamiec"
  });

  const dane = {
    stanImportu: stanImportu,
    listaPomp: utworzListePomp(),
    parametry: utworzParametry()
  };
  const wynikBezTrasy = aplikacja.harmonogram.przeliczCalyHarmonogram(dane);

  assert.ok(pobierzKonfliktyBrakuTrasy(wynikBezTrasy).length > 0);
  assert.equal(srodowisko.pobierzLiczbeProbSieciowych(), 0);

  aplikacja.pompy.ustawCzasPrzejazduPompyBudowy(
    budowaA,
    "B",
    7,
    "reczny"
  );

  const wynikPoRecznymUzupelnieniu =
    aplikacja.harmonogram.przeliczCalyHarmonogram(dane);

  assert.equal(wynikPoRecznymUzupelnieniu.status, "gotowy");
  assert.equal(pobierzKonfliktyBrakuTrasy(wynikPoRecznymUzupelnieniu).length, 0);
  assert.equal(budowaA.przejazdyPompyMinuty.B, 7);
  assert.equal(budowaA.zrodlaPrzejazdowPompy.B, "reczny");
  assert.equal(srodowisko.pobierzLiczbeProbSieciowych(), 0);
}

function sprawdzGraniceArchitektury() {
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");
  const aplikacja = wczytaj("js/aplikacja.js");

  assert.doesNotMatch(
    harmonogram,
    /fetch\s*\(|wyznaczTrase|pobierzIZastosujTrasyPrzejazdowPomp|api\.heigit\.org|Authorization/i
  );
  assert.match(harmonogram, /przejazdyPompyMinuty/);
  assert.match(harmonogram, /"brak-trasy"/);
  assert.match(aplikacja, /"modelTrasyDojazdu"/);
  assert.match(aplikacja, /"modelTrasyPowrotu"/);
  assert.match(aplikacja, /"przejazdyPompyMinuty"/);
  assert.match(aplikacja, /czyHarmonogramPrzeliczony/);
}

async function uruchomTest() {
  await sprawdzPelnyPrzeplywOffline();
  sprawdzJawnyBrakTrasyIRecznyFallback();
  sprawdzGraniceArchitektury();

  console.log(
    "OK — 6I.3 odtwarza plan i cache bez sieci, używa zapisanych tras i ręcznego fallbacku oraz tworzy harmonogram bez wywołania mapy."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
