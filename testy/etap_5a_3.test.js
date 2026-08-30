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
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/dostepnosc_pomp.js",
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

function utworzDaneWejsciowe(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "B-001;Alfa;Budowa A;08:00;8;Pompa;20;20",
    "B-002;Beta;Budowa B;09:00;16;Lej;15;15",
    "B-003;Gamma;Budowa C;10:30;8;Pompa;25;25"
  ].join("\n");

  return {
    stanImportu: aplikacja.importCsv.przetworzCsv(csv, "etap-5a3.csv"),
    budowyReczne: [],
    listaPomp: [],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybGruszek: "oblicz-potrzebne",
      trybPomp: "oblicz-potrzebne"
    },
    kursy: [{ idKursu: "STARY-KURS" }],
    wynikPomp: { idPompy: "STARA-POMPA" }
  };
}

function obliczBezposredniWynikEtapow3I4(aplikacja, daneWejsciowe) {
  const budowy = aplikacja.budowy.utworzListeRobocza(
    daneWejsciowe.stanImportu.budowy,
    daneWejsciowe.budowyReczne
  );
  budowy.forEach(function (budowa) {
    budowa.startRoboczy = budowa.startZadany;
  });
  const kursy = aplikacja.gruszki.obliczCzasyKursow(
    aplikacja.gruszki.generujKursy(
      budowy,
      daneWejsciowe.parametry.pojemnoscGruszkiM3
    ),
    budowy,
    Object.assign(
      {},
      aplikacja.konfiguracja.parametryDomyslne,
      daneWejsciowe.parametry
    )
  );

  return {
    gruszki: aplikacja.gruszki.przydzielGruszkiDoKursow(kursy),
    pompy: aplikacja.pompy.obliczMinimalnaLiczbePomp(budowy, kursy)
  };
}

function sprawdzZgodnoscBazowa() {
  const aplikacja = wczytajAplikacje();
  const daneWejsciowe = utworzDaneWejsciowe(aplikacja);
  const danePrzed = JSON.stringify(daneWejsciowe);
  const wynikBezposredni = obliczBezposredniWynikEtapow3I4(
    aplikacja,
    daneWejsciowe
  );
  const wynikCentralny = aplikacja.harmonogram.przeliczCalyHarmonogram(
    daneWejsciowe
  );

  assert.equal(
    JSON.stringify(wynikCentralny.kursy),
    JSON.stringify(wynikBezposredni.gruszki.kursy)
  );
  assert.equal(
    JSON.stringify(wynikCentralny.pompy.wynikMinimalnejFloty),
    JSON.stringify(wynikBezposredni.pompy)
  );
  assert.equal(
    wynikCentralny.minimalnaLiczbaGruszek,
    wynikBezposredni.gruszki.minimalnaLiczbaGruszek
  );
  assert.equal(
    wynikCentralny.minimalnaLiczbaPomp,
    wynikBezposredni.pompy.minimalnaLiczbaPomp
  );
  assert.equal(JSON.stringify(daneWejsciowe), danePrzed);
}

function sprawdzCzystePowtorzenie() {
  const aplikacja = wczytajAplikacje();
  const daneWejsciowe = utworzDaneWejsciowe(aplikacja);
  const pierwszyWynik = aplikacja.harmonogram.przeliczCalyHarmonogram(
    daneWejsciowe
  );
  const zapisPierwszegoWyniku = JSON.stringify(pierwszyWynik);

  pierwszyWynik.kursy[0].idKursu = "ZMIENIONY-STARY-KURS";
  pierwszyWynik.budowy[0].startRoboczy = "23:59";
  pierwszyWynik.pompy.wynikMinimalnejFloty.przydzialyTechniczne.length = 0;

  const drugiWynik = aplikacja.harmonogram.przeliczCalyHarmonogram(
    daneWejsciowe
  );

  assert.equal(JSON.stringify(drugiWynik), zapisPierwszegoWyniku);
  assert.equal(
    drugiWynik.kursy.some(function (kurs) {
      return kurs.idKursu === "STARY-KURS" ||
        kurs.idKursu === "ZMIENIONY-STARY-KURS";
    }),
    false
  );
  assert.equal(
    JSON.stringify(drugiWynik).includes("STARA-POMPA"),
    false
  );
}

sprawdzZgodnoscBazowa();
sprawdzCzystePowtorzenie();

console.log(
  "OK — 5A.3 zachowuje wyniki Etapów 3–4 i nie dziedziczy starego stanu."
);
