"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const plikiJavaScript = [
  "js/konfiguracja/konfiguracja.js",
  "js/diagnostyka/diagnostyka.js",
  "js/pamiec/pamiec_planu.js",
  "js/pamiec/pamiec_tras.js",
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
    className: "",
    children: [],
    files: [],
    disabled: false,
    dataset: {},
    zdarzenia: {},
    classList: {
      add: function () {},
      remove: function () {}
    },
    addEventListener: function (nazwaZdarzenia, obsluga) {
      this.zdarzenia[nazwaZdarzenia] = obsluga;
    },
    appendChild: function (element) {
      this.children.push(element);
      return element;
    },
    replaceChildren: function () {
      this.children = Array.from(arguments);
    },
    setAttribute: function () {},
    click: function () {},
    reset: function () {}
  };
}

function utworzDokumentTestowy() {
  const identyfikatory = [
    "poczatek-dnia",
    "pojemnosc-gruszki",
    "czas-zaladunku",
    "czas-rozladunku",
    "maksymalne-opoznienie",
    "przycisk-przelicz",
    "przycisk-wyczysc-plan",
    "sekcja-statusu",
    "tytul-statusu",
    "tresc-statusu",
    "liczba-budow",
    "liczba-kursow",
    "liczba-konfliktow",
    "wiersze-harmonogramu",
    "wiersze-kursow",
    "pole-pliku-csv",
    "przycisk-wybierz-csv",
    "pole-upuszczania-csv",
    "informacja-o-imporcie",
    "nazwa-pliku-csv",
    "szczegoly-pliku-csv",
    "formularz-budowy-recznej",
    "reczna-firma",
    "reczna-budowa",
    "reczny-start",
    "przycisk-historia-planow",
    "liczba-zapisow-historycznych",
    "stan-pamieci-planu",
    "liczba-znanych-tras",
    "stan-pamieci-tras",
    "okno-historii-planow",
    "przycisk-zamknij-historie",
    "lista-zapisow-historycznych",
    "stan-diagnostyki",
    "podglad-logow",
    "przycisk-pobierz-raport",
    "przycisk-wyczysc-logi"
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
    createElement: function () {
      return utworzElementTestowy();
    },
    createDocumentFragment: function () {
      return utworzElementTestowy();
    },
    addEventListener: function () {}
  };
}

function uruchomSkryptyAplikacji() {
  const dokumentTestowy = utworzDokumentTestowy();
  const kontekst = {
    console: console,
    document: dokumentTestowy,
    window: {},
    Date: Date,
    Math: Math
  };
  kontekst.window.window = kontekst.window;
  kontekst.window.document = dokumentTestowy;
  kontekst.window.Date = Date;
  kontekst.window.Math = Math;
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
  ["index.html", "style/glowny.css", "logo.png", "favicon.png"]
    .concat(plikiJavaScript)
    .forEach(function (sciezkaPliku) {
      assert.equal(fs.existsSync(path.join(katalogProjektu, sciezkaPliku)), true, sciezkaPliku);
    });
}

function sprawdzTrybOffline() {
  const dokumentHtml = wczytajPlik("index.html");
  const logoPng = fs.readFileSync(path.join(katalogProjektu, "logo.png"));
  const faviconPng = fs.readFileSync(path.join(katalogProjektu, "favicon.png"));

  assert.equal(/(?:src|href)=["']https?:\/\//i.test(dokumentHtml), false);
  assert.equal(/<script[^>]+type=["']module["']/i.test(dokumentHtml), false);
  assert.equal(dokumentHtml.includes('src="logo.png"'), true);
  assert.equal(dokumentHtml.includes('href="favicon.png"'), true);
  assert.deepEqual(
    Array.from(logoPng.subarray(0, 8)),
    [137, 80, 78, 71, 13, 10, 26, 10]
  );
  assert.equal(logoPng.includes(Buffer.from("IEND")), true);
  assert.deepEqual(
    Array.from(faviconPng.subarray(0, 8)),
    [137, 80, 78, 71, 13, 10, 26, 10]
  );
  assert.equal(faviconPng.includes(Buffer.from("IEND")), true);

  plikiJavaScript.forEach(function (sciezkaPliku) {
    assert.equal(dokumentHtml.includes("src=\"" + sciezkaPliku + "\""), true, sciezkaPliku);
  });
}

function sprawdzPolozeniePrzyciskuPrzelicz() {
  const dokumentHtml = wczytajPlik("index.html");
  const pozycjaPrzycisku = dokumentHtml.indexOf('id="przycisk-przelicz"');
  const pozycjaUstawien = dokumentHtml.indexOf('id="tytul-parametrow"');

  assert.notEqual(pozycjaPrzycisku, -1, "Brakuje przycisku przeliczania.");
  assert.notEqual(pozycjaUstawien, -1, "Brakuje nagłówka ustawień.");
  assert.equal(
    pozycjaPrzycisku < pozycjaUstawien,
    true,
    "Przycisk przeliczania powinien znajdować się nad ustawieniami."
  );
}

function sprawdzPrzeliczenie() {
  const srodowisko = uruchomSkryptyAplikacji();
  const aplikacja = srodowisko.aplikacja;
  const parametry = {
    poczatekDnia: "06:30",
    pojemnoscGruszkiM3: 7,
    czasZaladunkuMinuty: 9,
    czasRozladunkuMinuty: 14,
    maksymalneOpoznienieStartuMinuty: 25
  };
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({ parametry: parametry });

  assert.equal(wynik.status, "gotowy");
  assert.equal(wynik.etap, aplikacja.konfiguracja.numerEtapu);
  assert.equal(wynik.parametry.pojemnoscGruszkiM3, 7);
  assert.equal(wynik.parametry.czasRozladunkuMinuty, 14);
  assert.deepEqual(Array.from(wynik.budowy), []);
  assert.deepEqual(Array.from(wynik.kursy), []);
  assert.deepEqual(Array.from(wynik.konflikty), []);
  assert.equal(Object.isFrozen(aplikacja.konfiguracja.parametryDomyslne), true);
  assert.equal(srodowisko.dokument.elementy["czas-rozladunku"].value, "15");

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
sprawdzPolozeniePrzyciskuPrzelicz();
sprawdzPrzeliczenie();

console.log("✓ Etap 1: wszystkie testy zakończyły się powodzeniem.");
