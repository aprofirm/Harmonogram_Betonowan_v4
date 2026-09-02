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
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzPelnyModelWezla(aplikacja) {
  const wezel = aplikacja.lokalizacje.utworzModelWezla({
    idWezla: "WEZEL-TEST-01",
    nazwa: "Betoniarnia testowa",
    modelLokalizacji: {
      daneZrodlowe: {
        adres: { tekst: "ul. Próbna 10, Miasto Testowe" },
        statusJakosci: "nieoceniona",
        zrodlo: "reczny"
      },
      daneRobocze: {
        adres: { tekst: "ul. Próbna 10, Miasto Testowe" },
        wspolrzedne: {
          szerokoscGeograficzna: 50.8491,
          dlugoscGeograficzna: 16.3198
        },
        statusJakosci: "potwierdzona",
        zrodlo: "reczny",
        czyKorektaReczna: true
      }
    }
  });

  assert.equal(wezel.wersjaKontraktu, 1);
  assert.equal(wezel.idWezla, "WEZEL-TEST-01");
  assert.equal(wezel.nazwa, "Betoniarnia testowa");
  assert.equal(wezel.modelLokalizacji.idLokalizacji, "WEZEL-TEST-01");
  assert.equal(wezel.modelLokalizacji.typLokalizacji, "wezel");
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Próbna 10, Miasto Testowe"
  );
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.wspolrzedne.szerokoscGeograficzna,
    50.8491
  );
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.wspolrzedne.dlugoscGeograficzna,
    16.3198
  );
}

function sprawdzNiezmiennikiModeluWezla(aplikacja) {
  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({ nazwa: "Bez ID" });
  }, /ID węzła/);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({ idWezla: "W-1" });
  }, /Nazwa węzła/);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({
      idWezla: "W-1",
      nazwa: "Węzeł 1",
      modelLokalizacji: { idLokalizacji: "W-2" }
    });
  }, /zgodne z ID węzła/);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelWezla({
      idWezla: "W-1",
      nazwa: "Węzeł 1",
      modelLokalizacji: { typLokalizacji: "budowa" }
    });
  }, /typ lokalizacji/);
}

async function sprawdzAktywnyWezelWTrasach(aplikacja) {
  const aktywnyPierwszy = aplikacja.lokalizacje.pobierzAktywnyWezel();
  const aktywnyDrugi = aplikacja.lokalizacje.pobierzAktywnyWezel();

  assert.equal(aktywnyPierwszy, aktywnyDrugi);
  assert.equal(aktywnyPierwszy.idWezla, "wezel-domyslny");
  assert.equal(aktywnyPierwszy.nazwa, "Węzeł domyślny");
  assert.equal(aktywnyPierwszy.modelLokalizacji.typLokalizacji, "wezel");

  const budowa = {
    idBudowy: "B-601",
    firma: "Firma Testowa",
    budowa: "Budowa Testowa",
    zrodlo: "reczny"
  };

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(
    budowa.modelTrasyDojazdu.punktPoczatkowy.idLokalizacji,
    aktywnyPierwszy.idWezla
  );
  assert.equal(
    budowa.modelTrasyPowrotu.punktDocelowy.idLokalizacji,
    aktywnyPierwszy.idWezla
  );
  assert.equal(
    budowa.modelTrasyDojazdu.idTrasy,
    aktywnyPierwszy.idWezla + "->B-601"
  );

  let zapytanieMapowe = null;
  const wynik = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    budowa,
    function (zapytanie) {
      zapytanieMapowe = zapytanie;
      return null;
    }
  );

  assert.equal(wynik.status, "brak-wyniku-mapy");
  assert.equal(zapytanieMapowe.idWezla, aktywnyPierwszy.idWezla);
  assert.equal(zapytanieMapowe.wezel, aktywnyPierwszy);
  assert.equal(
    zapytanieMapowe.wezel.modelLokalizacji.idLokalizacji,
    aktywnyPierwszy.idWezla
  );
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6C\.1 — model węzła/);
  assert.match(plan, /### 6C\.1 — model węzła/);
  assert.match(decyzje, /## 125\. Aktywny węzeł ma własny model lokalizacji/);
  assert.match(kontrakt, /## Model węzła 6C\.1/);
}

async function uruchomTest() {
  const aplikacja = wczytajAplikacje();

  sprawdzPelnyModelWezla(aplikacja);
  sprawdzNiezmiennikiModeluWezla(aplikacja);
  await sprawdzAktywnyWezelWTrasach(aplikacja);
  sprawdzDokumentacje();

  console.log(
    "OK — 6C.1 przechowuje model aktywnego węzła i używa jego ID w trasach."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
