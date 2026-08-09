"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const plikiJavaScript = [
  "js/konfiguracja/konfiguracja.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/lokalizacje/lokalizacje.js",
  "js/harmonogram/harmonogram.js",
  "js/interfejs/interfejs.js",
  "js/aplikacja.js"
];

function wczytajPlik(sciezkaWzgledna) {
  return fs.readFileSync(path.join(katalogProjektu, sciezkaWzgledna), "utf8");
}

function utworzElementTestowy() {
  return {
    value: "",
    textContent: "",
    disabled: false,
    dataset: {},
    zdarzenia: {},
    addEventListener: function (nazwaZdarzenia, obsluga) {
      this.zdarzenia[nazwaZdarzenia] = obsluga;
    }
  };
}

function utworzDokumentTestowy() {
  const identyfikatory = [
    "poczatek-dnia",
    "pojemnosc-gruszki",
    "czas-zaladunku",
    "maksymalne-opoznienie",
    "przycisk-przelicz",
    "sekcja-statusu",
    "tytul-statusu",
    "tresc-statusu",
    "liczba-budow",
    "liczba-kursow",
    "liczba-konfliktow"
  ];
  const elementy = {};

  identyfikatory.forEach(function (identyfikator) {
    elementy[identyfikator] = utworzElementTestowy();
  });

  return {
    readyState: "complete",
    elementy: elementy,
    getElementById: function (identyfikator) {
      return elementy[identyfikator] || null;
    },
    addEventListener: function () {}
  };
}

function uruchomSkryptyAplikacji() {
  const dokumentTestowy = utworzDokumentTestowy();
  const kontekst = {
    console: console,
    document: dokumentTestowy,
    window: {}
  };
  kontekst.window.window = kontekst.window;
  kontekst.window.document = dokumentTestowy;
  vm.createContext(kontekst);

  plikiJavaScript.forEach(function (sciezkaPliku) {
    const kod = wczytajPlik(sciezkaPliku);
    const skrypt = new vm.Script(kod, { filename: sciezkaPliku });
    skrypt.runInContext(kontekst);
  });

  return {
    aplikacja: kontekst.window.HarmonogramBetonowan,
    dokument: dokumentTestowy
  };
}

function sprawdzPlikiEtapu() {
  ["index.html", "style/glowny.css"].concat(plikiJavaScript).forEach(function (sciezkaPliku) {
    assert.equal(fs.existsSync(path.join(katalogProjektu, sciezkaPliku)), true, sciezkaPliku);
  });
}

function sprawdzTrybOffline() {
  const dokumentHtml = wczytajPlik("index.html");

  assert.equal(/(?:src|href)=["']https?:\/\//i.test(dokumentHtml), false);
  assert.equal(/<script[^>]+type=["']module["']/i.test(dokumentHtml), false);

  plikiJavaScript.forEach(function (sciezkaPliku) {
    assert.equal(dokumentHtml.includes("src=\"" + sciezkaPliku + "\""), true, sciezkaPliku);
  });
}

function sprawdzPrzeliczenie() {
  const srodowisko = uruchomSkryptyAplikacji();
  const aplikacja = srodowisko.aplikacja;
  const parametry = {
    poczatekDnia: "06:30",
    pojemnoscGruszkiM3: 7,
    czasZaladunkuMinuty: 9,
    maksymalneOpoznienieStartuMinuty: 25
  };
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({ parametry: parametry });

  assert.equal(wynik.status, "gotowy");
  assert.equal(wynik.etap, 1);
  assert.equal(wynik.parametry.pojemnoscGruszkiM3, 7);
  assert.deepEqual(Array.from(wynik.budowy), []);
  assert.deepEqual(Array.from(wynik.kursy), []);
  assert.deepEqual(Array.from(wynik.konflikty), []);
  assert.equal(Object.isFrozen(aplikacja.konfiguracja.parametryDomyslne), true);

  const przycisk = srodowisko.dokument.elementy["przycisk-przelicz"];
  przycisk.zdarzenia.click();

  assert.equal(
    srodowisko.dokument.elementy["tytul-statusu"].textContent,
    "Przeliczenie zakończone"
  );
  assert.equal(srodowisko.dokument.elementy["sekcja-statusu"].dataset.rodzaj, "sukces");
  assert.equal(przycisk.disabled, false);

  srodowisko.dokument.elementy["pojemnosc-gruszki"].value = "0";
  przycisk.zdarzenia.click();

  assert.equal(
    srodowisko.dokument.elementy["tytul-statusu"].textContent,
    "Nie można przeliczyć harmonogramu"
  );
  assert.equal(srodowisko.dokument.elementy["sekcja-statusu"].dataset.rodzaj, "blad");
  assert.equal(przycisk.disabled, false);
}

sprawdzPlikiEtapu();
sprawdzTrybOffline();
sprawdzPrzeliczenie();

console.log("✓ Etap 1: wszystkie testy zakończyły się powodzeniem.");
