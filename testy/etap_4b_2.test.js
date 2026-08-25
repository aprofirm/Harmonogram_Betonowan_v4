"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModulPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pompy/pompy.js"),
    "utf8"
  );
  new vm.Script(kod, { filename: "js/pompy/pompy.js" }).runInContext(kontekst);
  return kontekst.window.HarmonogramBetonowan.pompy;
}

function sprawdzDodawaniePompy(pompy) {
  const listaPoczatkowa = pompy.dopasujLiczbePomp([], 2, "06:30");
  const stanPoczatkowy = JSON.stringify(listaPoczatkowa);
  const wynik = pompy.dodajPompe(listaPoczatkowa, {
    idPompy: "ID-NIE-MOZE-BYC-NARZUCONE",
    nazwa: "Pompa zewnętrzna 52 m",
    typ: "zewnetrzna",
    aktywna: false,
    dostepnaOd: "09:15",
    wysiegMetry: 52
  });

  assert.equal(wynik.length, 3);
  assert.equal(wynik[0].idPompy, "POMPA-001");
  assert.equal(wynik[1].idPompy, "POMPA-002");
  assert.equal(wynik[2].idPompy, "POMPA-003");
  assert.equal(wynik[2].nazwa, "Pompa zewnętrzna 52 m");
  assert.equal(wynik[2].typ, "zewnetrzna");
  assert.equal(wynik[2].aktywna, false);
  assert.equal(wynik[2].dostepnaOd, "09:15");
  assert.equal(wynik[2].wysiegMetry, 52);
  assert.equal(JSON.stringify(listaPoczatkowa), stanPoczatkowy);
  assert.notStrictEqual(wynik[0], listaPoczatkowa[0]);
}

function sprawdzEdycjePompy(pompy) {
  const listaPoczatkowa = pompy.dopasujLiczbePomp([], 2, "07:00");
  const stanPoczatkowy = JSON.stringify(listaPoczatkowa);
  const wynik = pompy.edytujPompe(listaPoczatkowa, "POMPA-001", {
    nazwa: "Pompa główna",
    typ: "zewnetrzna",
    dostepnaOd: "08:45",
    wysiegMetry: 42
  });

  assert.equal(wynik[0].idPompy, "POMPA-001");
  assert.equal(wynik[0].nazwa, "Pompa główna");
  assert.equal(wynik[0].typ, "zewnetrzna");
  assert.equal(wynik[0].dostepnaOd, "08:45");
  assert.equal(wynik[0].wysiegMetry, 42);
  assert.equal(wynik[1].idPompy, "POMPA-002");
  assert.equal(JSON.stringify(listaPoczatkowa), stanPoczatkowy);

  assert.throws(function () {
    pompy.edytujPompe(listaPoczatkowa, "POMPA-001", {
      nazwa: "Ta zmiana nie może częściowo zostać zapisana",
      dostepnaOd: "25:10"
    });
  }, /HH:MM/i);
  assert.equal(JSON.stringify(listaPoczatkowa), stanPoczatkowy);

  assert.throws(function () {
    pompy.edytujPompe(listaPoczatkowa, "POMPA-001", {
      idPompy: "NOWE-ID"
    });
  }, /stabilnego ID/i);
}

function sprawdzAktywnoscIUsuwaniePompy(pompy) {
  const listaPoczatkowa = pompy.dopasujLiczbePomp([], 3, "07:00");
  const stanPoczatkowy = JSON.stringify(listaPoczatkowa);
  const listaZWylaczonaPompa = pompy.ustawAktywnoscPompy(
    listaPoczatkowa,
    "POMPA-002",
    false
  );

  assert.equal(listaZWylaczonaPompa[1].aktywna, false);
  assert.equal(pompy.pobierzLiczbeAktywnychPomp(listaZWylaczonaPompa), 2);
  assert.equal(JSON.stringify(listaPoczatkowa), stanPoczatkowy);

  const listaPoUsunieciu = pompy.usunPompe(
    listaZWylaczonaPompa,
    "POMPA-002"
  );

  assert.deepEqual(
    Array.from(listaPoUsunieciu, function (pompa) {
      return pompa.idPompy;
    }),
    ["POMPA-001", "POMPA-003"]
  );
  assert.equal(listaZWylaczonaPompa.length, 3);

  assert.throws(function () {
    pompy.usunPompe(listaPoUsunieciu, "POMPA-999");
  }, /Nie znaleziono pompy/i);
  assert.throws(function () {
    pompy.ustawAktywnoscPompy(listaPoUsunieciu, "POMPA-999", false);
  }, /Nie znaleziono pompy/i);
}

function sprawdzDopasowanieLiczbyPrzezOperacje(pompy) {
  let lista = pompy.dopasujLiczbePomp([], 3, "06:45");
  lista = pompy.edytujPompe(lista, "POMPA-001", {
    nazwa: "Pompa zachowana",
    wysiegMetry: 36
  });
  lista = pompy.dopasujLiczbePomp(lista, 1, "06:45");

  assert.equal(lista.length, 1);
  assert.equal(lista[0].idPompy, "POMPA-001");
  assert.equal(lista[0].nazwa, "Pompa zachowana");
  assert.equal(lista[0].wysiegMetry, 36);

  lista = pompy.dopasujLiczbePomp(lista, 2, "06:45");
  assert.equal(lista[0].idPompy, "POMPA-001");
  assert.equal(lista[1].idPompy, "POMPA-002");
  assert.equal(lista[1].dostepnaOd, "06:45");
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzDodawaniePompy(pompy);
  sprawdzEdycjePompy(pompy);
  sprawdzAktywnoscIUsuwaniePompy(pompy);
  sprawdzDopasowanieLiczbyPrzezOperacje(pompy);

  console.log(
    "✓ Etap 4B.2: dodawanie, edycja, aktywność i usuwanie pomp są niezależnymi operacjami."
  );
}

uruchomTesty();
