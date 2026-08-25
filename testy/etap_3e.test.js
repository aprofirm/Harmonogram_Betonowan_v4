"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const plikiLogiki = [
  "js/konfiguracja/konfiguracja.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/gruszki/przydzial_gruszek.js",
  "js/lokalizacje/lokalizacje.js",
  "js/harmonogram/harmonogram.js"
];

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  plikiLogiki.forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function utworzBudowe(idBudowy) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: "09:00",
    startRoboczy: "09:00",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: 20,
    czasPowrotuRoboczyMinuty: 20,
    dodatkowyCzasZaladunkuMinuty: 0,
    czasRozladunkuRoboczyMinuty: null,
    dodatkowyCzasRozladunkuMinuty: 0,
    dodatkowyOdstepDostawMinuty: 0
  };
}

function przelicz(aplikacja, trybGruszek, liczbaDostepnychGruszek) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: {
      budowy: [utworzBudowe("A"), utworzBudowe("B"), utworzBudowe("C")]
    },
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybGruszek: trybGruszek,
      liczbaDostepnychGruszek: liczbaDostepnychGruszek
    }
  });
}

const aplikacja = wczytajAplikacje();
const wynikPotrzebnejFloty = przelicz(
  aplikacja,
  "oblicz-potrzebne",
  null
);

assert.equal(wynikPotrzebnejFloty.minimalnaLiczbaGruszek, 3);
assert.equal(wynikPotrzebnejFloty.liczbaDostepnychGruszek, null);
assert.deepEqual(
  Array.from(wynikPotrzebnejFloty.kursy, function (kurs) {
    return kurs.minutaRozpoczeciaZaladunku;
  }),
  [510, 510, 510]
);

const wynikJednejGruszki = przelicz(
  aplikacja,
  "mam-okreslona-liczbe",
  1
);

assert.equal(wynikJednejGruszki.minimalnaLiczbaGruszek, 3);
assert.equal(wynikJednejGruszki.liczbaDostepnychGruszek, 1);
assert.equal(wynikJednejGruszki.gruszki.liczbaOpoznionychKursow, 2);
assert.equal(wynikJednejGruszki.gruszki.maksymalneOpoznienieKursuMinuty, 130);
assert.deepEqual(
  Array.from(wynikJednejGruszki.kursy, function (kurs) {
    return kurs.numerGruszki;
  }),
  [1, 1, 1]
);
assert.deepEqual(
  Array.from(wynikJednejGruszki.kursy, function (kurs) {
    return kurs.minutaRozpoczeciaZaladunku;
  }),
  [510, 575, 640]
);
assert.deepEqual(
  Array.from(wynikJednejGruszki.kursy, function (kurs) {
    return kurs.opoznienieZPowoduGruszekMinuty;
  }),
  [0, 65, 130]
);
assert.deepEqual(
  Array.from(wynikJednejGruszki.kursy, function (kurs) {
    return kurs.godzinaRozpoczeciaRozladunku;
  }),
  ["09:00", "10:05", "11:10"]
);
assert.equal(
  wynikJednejGruszki.kursy[1].planowanaGodzinaRozpoczeciaRozladunku,
  "09:00"
);
assert.match(
  wynikJednejGruszki.komunikaty[0],
  /Dostępne gruszki: 1.*Przeliczono kursy.*Opóźnionych kursów: 2.*130 min/i
);

wynikJednejGruszki.kursy.slice(1).forEach(function (kurs, indeks) {
  assert.ok(
    kurs.minutaRozpoczeciaZaladunku >=
      wynikJednejGruszki.kursy[indeks].minutaGotowosciDoKolejnegoKursu
  );
});

const wynikTrzechGruszek = przelicz(
  aplikacja,
  "mam-okreslona-liczbe",
  3
);
assert.equal(wynikTrzechGruszek.gruszki.liczbaOpoznionychKursow, 0);
assert.deepEqual(
  Array.from(wynikTrzechGruszek.kursy, function (kurs) {
    return kurs.opoznienieZPowoduGruszekMinuty;
  }),
  [0, 0, 0]
);

const wynikBezGruszek = przelicz(
  aplikacja,
  "mam-okreslona-liczbe",
  0
);
assert.equal(wynikBezGruszek.konflikty.length, 1);
assert.equal(wynikBezGruszek.gruszki.liczbaNieprzydzielonychKursow, 3);
assert.ok(wynikBezGruszek.kursy.every(function (kurs) {
  return kurs.statusKursu === "nieprzydzielony-brak-gruszki";
}));

assert.throws(function () {
  przelicz(aplikacja, "mam-okreslona-liczbe", -1);
}, /liczba dostępnych gruszek/i);
assert.throws(function () {
  przelicz(aplikacja, "mam-okreslona-liczbe", 1.5);
}, /liczba dostępnych gruszek/i);
assert.throws(function () {
  przelicz(aplikacja, "nieznany-tryb", 2);
}, /nie rozpoznano.*trybu/i);

const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
const interfejs = fs.readFileSync(
  path.join(katalogProjektu, "js/interfejs/interfejs.js"),
  "utf8"
);

assert.match(html, /id="tryb-gruszek"/);
assert.match(html, /id="liczba-dostepnych-gruszek"/);
assert.match(html, /id="liczba-dostepnych-gruszek-wynik">—<\/span>/);
assert.match(
  html,
  /class="sterowanie-flota"[\s\S]*id="tryb-gruszek"[\s\S]*id="liczba-dostepnych-gruszek"[\s\S]*class="podsumowanie"/
);
assert.equal((html.match(/id="tryb-gruszek"/g) || []).length, 1);
assert.equal((html.match(/id="liczba-dostepnych-gruszek"/g) || []).length, 1);
assert.match(html, /<th>Skutek floty<\/th>/);
assert.match(html, /4B\.3/);
assert.match(interfejs, /plan rozładunku/);
assert.match(interfejs, /liczbaDostepnychGruszekWynik\.textContent/);

console.log(
  "✓ Etap 3E: ograniczona flota przelicza kursy, pokazuje opóźnienia i obsługuje brak gruszek."
);
