"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModulyPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/pompy/pompy.js",
    "js/pompy/przejazdy_pomp.js"
  ].forEach(function (sciezka) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
    new vm.Script(kod, { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, dodatkoweDane) {
  return Object.assign({
    idBudowy: idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  }, dodatkoweDane || {});
}

function utworzKurs(idBudowy, poczatek, koniec) {
  return {
    idKursu: idBudowy + "-KURS-001",
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: poczatek,
    minutaZakonczeniaRozladunku: koniec
  };
}

function pobierzWynikDlaZrodla(pompy, zrodlo) {
  const budowaA = utworzBudowe("BUDOWA-A");
  const budowaB = utworzBudowe("BUDOWA-B");
  const kursy = [
    utworzKurs("BUDOWA-A", 480, 495),
    utworzKurs("BUDOWA-B", 600, 615)
  ];

  return pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    budowaA,
    budowaB,
    kursy,
    {
      czasPrzejazduMinuty: 35,
      zrodloCzasuPrzejazdu: zrodlo
    }
  );
}

function sprawdzWspolnyKontraktWejscia(pompy) {
  const reczny = pobierzWynikDlaZrodla(pompy, "reczny");
  const pamiec = pobierzWynikDlaZrodla(pompy, "pamiec");
  const mapa = pobierzWynikDlaZrodla(pompy, "mapa");
  const routingCiezarowy = pobierzWynikDlaZrodla(pompy, "routing-ciezarowy");

  [pamiec, mapa, routingCiezarowy].forEach(function (wynik) {
    assert.equal(wynik.czasPrzejazduMinuty, reczny.czasPrzejazduMinuty);
    assert.equal(wynik.minutaWyjazduZBudowy, reczny.minutaWyjazduZBudowy);
    assert.equal(wynik.minutaPrzyjazduNaBudowe, reczny.minutaPrzyjazduNaBudowe);
    assert.equal(
      wynik.minutaGotowosciDoBetonowaniaPoPrzejezdzie,
      reczny.minutaGotowosciDoBetonowaniaPoPrzejezdzie
    );
  });

  assert.equal(reczny.zrodloCzasuPrzejazdu, "reczny");
  assert.equal(pamiec.zrodloCzasuPrzejazdu, "pamiec");
  assert.equal(mapa.zrodloCzasuPrzejazdu, "mapa");
  assert.equal(routingCiezarowy.zrodloCzasuPrzejazdu, "routing-ciezarowy");
}

function sprawdzNormalizacjeDanych(pompy) {
  assert.deepEqual(
    JSON.parse(JSON.stringify(pompy.normalizujDanePrzejazduPompy({
      czasPrzejazduMinuty: "27",
      zrodloCzasuPrzejazdu: "  pamiec  "
    }))),
    {
      czasPrzejazduMinuty: 27,
      zrodloCzasuPrzejazdu: "pamiec"
    }
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(pompy.normalizujDanePrzejazduPompy({
      czasPrzejazduMinuty: 12
    }))),
    {
      czasPrzejazduMinuty: 12,
      zrodloCzasuPrzejazdu: "reczny"
    }
  );
}

function sprawdzBrakZaleznosciSieciowej() {
  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pompy/przejazdy_pomp.js"),
    "utf8"
  );

  assert.doesNotMatch(kod, /\bfetch\s*\(/);
  assert.doesNotMatch(kod, /XMLHttpRequest/);
  assert.doesNotMatch(kod, /navigator\.geolocation/);
  assert.doesNotMatch(kod, /https?:\/\//);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzWspolnyKontraktWejscia(pompy);
  sprawdzNormalizacjeDanych(pompy);
  sprawdzBrakZaleznosciSieciowej();

  console.log(
    "✓ Etap 4E.3: silnik przejazdów przyjmuje gotowy czas niezależnie od źródła i działa bez mapy."
  );
}

uruchomTesty();
