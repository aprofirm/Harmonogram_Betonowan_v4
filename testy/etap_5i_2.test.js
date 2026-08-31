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

function utworzWynikZPrzestojem(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;24;Lej;0;0"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "etap-5i2.csv");

  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 16,
      czasRozladunkuMinuty: 15,
      maksymalnyPrzestojMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 0,
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: 1
    }
  });
}

function sprawdzPrzestojZRzeczywistegoSilnika() {
  const aplikacja = wczytajAplikacje();
  const wynik = utworzWynikZPrzestojem(aplikacja);
  const konflikt = wynik.konflikty.find(function (pozycja) {
    return pozycja.kategoriaKonfliktu === "limit-przestoju";
  });
  const zrodloPrzed = JSON.stringify(konflikt);
  const prezentacja = aplikacja.interfejs.pobierzPrezentacjeKonfliktu(konflikt);

  assert.ok(konflikt, "Scenariusz powinien utworzyć konflikt przestoju.");
  assert.equal(prezentacja.etykietaTypu, "Przestój");
  assert.equal(prezentacja.czyPrzestoj, true);
  assert.ok(prezentacja.komunikat.includes("16 min"));
  assert.ok(prezentacja.komunikat.includes("kursu 1"));
  assert.ok(prezentacja.komunikat.includes("kursu 2"));
  assert.deepEqual(
    Array.from(prezentacja.powiazania, function (powiazanie) {
      return powiazanie.etykieta;
    }),
    ["Budowa: Budowa A", "Kurs poprzedni: 1", "Kurs następny: 2"]
  );
  assert.deepEqual(
    Array.from(prezentacja.powiazania, function (powiazanie) {
      return [powiazanie.typ, powiazanie.id, powiazanie.rola];
    }),
    [
      ["budowa", "A", "dotyczy"],
      ["kurs", "A-KURS-001", "poprzedni"],
      ["kurs", "A-KURS-002", "nastepny"]
    ]
  );
  assert.equal(JSON.stringify(konflikt), zrodloPrzed);
}

function sprawdzZasobIFallbackTekstu() {
  const aplikacja = wczytajAplikacje();
  const prezentacjaPompy = aplikacja.interfejs.pobierzPrezentacjeKonfliktu({
    kategoriaKonfliktu: "brak-pompy",
    komunikatOperatora: "Nie znaleziono pompy dla budowy.",
    powiazania: [{ typ: "zasob", id: "pompy", rola: "dotyczy" }]
  });
  const prezentacjaNieznana = aplikacja.interfejs.pobierzPrezentacjeKonfliktu({
    kategoriaKonfliktu: "przyszla-kategoria",
    opis: "Czytelny opis przyszłego problemu.",
    powiazania: [{ typ: "harmonogram", id: "glowny", rola: "dotyczy" }]
  });

  assert.equal(prezentacjaPompy.etykietaTypu, "Brak pompy");
  assert.equal(prezentacjaPompy.powiazania[0].etykieta, "Zasób: pompy");
  assert.equal(prezentacjaNieznana.etykietaTypu, "Konflikt");
  assert.equal(
    prezentacjaNieznana.komunikat,
    "Czytelny opis przyszłego problemu."
  );
  assert.equal(prezentacjaNieznana.powiazania[0].etykieta, "Cały harmonogram");
}

function sprawdzWarstweWidoku() {
  const html = wczytaj("index.html");
  const interfejs = wczytaj("js/interfejs/interfejs.js");
  const css = wczytaj("style/glowny.css");

  assert.ok(html.includes('id="panel-konfliktow"'));
  assert.ok(html.includes('id="lista-konfliktow"'));
  assert.ok(html.includes('id="liczba-konfliktow-panel"'));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("Konflikty wymagające uwagi"));
  assert.ok(html.includes("Etap 5I.3"));
  assert.ok(html.includes("5I.3 · pamięć i stan nieaktualny"));
  assert.ok(html.includes("5i3-pamiec-stan-20260831a"));

  assert.ok(interfejs.includes("pokazListeKonfliktow(wynik.konflikty);"));
  assert.ok(interfejs.includes("elementy.panelKonfliktow.hidden = lista.length === 0;"));
  assert.ok(interfejs.includes("zrodlo.komunikatOperatora"));
  assert.ok(interfejs.includes('setAttribute("data-typ", powiazanie.typ)'));
  assert.ok(interfejs.includes('setAttribute("data-id", powiazanie.id)'));
  assert.ok(interfejs.includes('setAttribute("data-rola", powiazanie.rola)'));

  assert.ok(css.includes(".panel-konfliktow[hidden]"));
  assert.ok(css.includes(".wpis-konfliktu__komunikat"));
  assert.ok(css.includes(".wpis-konfliktu__powiazanie"));
  assert.ok(css.includes(".wpis-konfliktu--przestoj"));
}

sprawdzPrzestojZRzeczywistegoSilnika();
sprawdzZasobIFallbackTekstu();
sprawdzWarstweWidoku();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5I.3");

console.log(
  "OK — 5I.2 pokazuje końcowe konflikty i przestoje tekstowo, z jawnym powiązaniem do budowy, kursu albo zasobu."
);
