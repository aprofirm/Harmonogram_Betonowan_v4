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
    "js/harmonogram/harmonogram.js",
    "js/harmonogram/konflikty_przestojow.js",
    "js/harmonogram/kontrakt_konfliktow.js",
    "js/interfejs/interfejs.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function sprawdzTrzyZnaczeniaPrzedPrzeliczeniem() {
  const aplikacja = wczytajAplikacje();
  const prezentacja = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy({
    startPlanowany: "13:00",
    startPlanowanyZrodlowy: "13:00 (+60 min)",
    tolerancjaStartuMinuty: 60,
    najpozniejszyStart: "14:00",
    startZadany: "13:15",
    startRoboczy: "13:15"
  });

  assert.equal(prezentacja.planZrodlowy, "13:00–14:00");
  assert.equal(prezentacja.startZadany, "13:15");
  assert.equal(prezentacja.startRoboczy, null);
  assert.equal(prezentacja.przesuniecieStartuMinuty, null);
  assert.equal(prezentacja.przyczynaPrzesuniecia, null);
}

function sprawdzPrzyczynyPrzesuniecia() {
  const aplikacja = wczytajAplikacje();
  const bazowaBudowa = {
    startPlanowany: "08:00",
    startZadany: "08:10",
    startRoboczy: "08:30",
    ocenaOpoznieniaStartu: {
      opoznienieStartuMinuty: 20
    }
  };

  const pompaZajeta = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    Object.assign({}, bazowaBudowa, {
      jawnySkutekPompy: { przyczyna: "pompa-zajeta" }
    })
  );
  const poprzedniaBudowa = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    Object.assign({}, bazowaBudowa, {
      jawnySkutekPompy: {
        przyczyna: "rzeczywiste-dostawy-poprzedniej-budowy"
      }
    })
  );
  const przyszlaPrzyczyna = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    bazowaBudowa
  );

  assert.equal(pompaZajeta.startRoboczy, "08:30");
  assert.equal(pompaZajeta.przesuniecieStartuMinuty, 20);
  assert.equal(pompaZajeta.przyczynaPrzesuniecia, "pompa zajęta");
  assert.equal(
    poprzedniaBudowa.przyczynaPrzesuniecia,
    "poprzednia budowa zakończyła się później"
  );
  assert.equal(przyszlaPrzyczyna.przyczynaPrzesuniecia, "korekta harmonogramu");
}

function sprawdzBrakPrzesuniecia() {
  const aplikacja = wczytajAplikacje();
  const prezentacja = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy({
    startPlanowany: "07:30",
    startZadany: "07:45",
    startRoboczy: "07:45",
    ocenaOpoznieniaStartu: {
      opoznienieStartuMinuty: 0
    },
    jawnySkutekPompy: {
      przyczyna: null
    }
  });

  assert.equal(prezentacja.planZrodlowy, "07:30");
  assert.equal(prezentacja.startZadany, "07:45");
  assert.equal(prezentacja.startRoboczy, "07:45");
  assert.equal(prezentacja.przesuniecieStartuMinuty, 0);
  assert.equal(prezentacja.przyczynaPrzesuniecia, null);
}

function sprawdzIntegracjeZRzeczywistymSilnikiem() {
  const aplikacja = wczytajAplikacje();
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;8;Pompa;0;0",
    "B;Beta;Budowa B;08:10;8;Pompa;0;0",
    "C;Gamma;Budowa C;08:20;8;Pompa;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5i1.csv");
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
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
      trybGruszek: "oblicz-potrzebne"
    },
    opcjePomp: {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 0,
          zrodloCzasuPrzejazdu: "test-5i1"
        };
      }
    }
  });
  const prezentacjaB = aplikacja.interfejs.pobierzPrezentacjeStartuBudowy(
    wynik.budowy[1]
  );

  assert.equal(prezentacjaB.planZrodlowy, "08:10");
  assert.equal(prezentacjaB.startZadany, "08:10");
  assert.equal(prezentacjaB.startRoboczy, "09:05");
  assert.equal(prezentacjaB.przesuniecieStartuMinuty, 55);
  assert.equal(prezentacjaB.przyczynaPrzesuniecia, "pompa zajęta");
  assert.equal(stanImportu.budowy[1].startPlanowany, "08:10");
  assert.equal(stanImportu.budowy[1].startZadany, "08:10");
}

function sprawdzWarstweWidoku() {
  const html = wczytaj("index.html");
  const interfejs = wczytaj("js/interfejs/interfejs.js");
  const css = wczytaj("style/glowny.css");

  assert.ok(html.includes("<th>Start budowy</th>"));
  assert.ok(html.includes("Etap 5I.1"));
  assert.ok(html.includes("5I.1 · trzy godziny startu"));
  assert.ok(html.includes("5i1-trzy-godziny-20260831a"));
  assert.ok(interfejs.includes('etykietaZadanego.textContent = "Zadany"'));
  assert.ok(interfejs.includes('"Roboczy: " + (prezentacja.startRoboczy || "—")'));
  assert.ok(interfejs.includes('"Plan: " + opiszOknoStartu(budowa)'));
  assert.ok(interfejs.includes('className = "przesuniecie-startu-budowy"'));
  assert.ok(css.includes(".etykieta-startu-zadanego"));
  assert.ok(css.includes(".start-roboczy-budowy"));
  assert.ok(css.includes(".przesuniecie-startu-budowy"));
}

sprawdzTrzyZnaczeniaPrzedPrzeliczeniem();
sprawdzPrzyczynyPrzesuniecia();
sprawdzBrakPrzesuniecia();
sprawdzIntegracjeZRzeczywistymSilnikiem();
sprawdzWarstweWidoku();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5I.1");

console.log(
  "OK — 5I.1 rozdziela plan źródłowy, start zadany i StartRoboczy oraz pokazuje wielkość i przyczynę przesunięcia."
);
