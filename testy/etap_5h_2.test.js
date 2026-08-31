"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajPelnaAplikacje() {
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
    "js/harmonogram/kontrakt_konfliktow.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function wczytajKontraktNadSztucznymSilnikiem(listaKonfliktow) {
  const zakresOkna = {
    HarmonogramBetonowan: {
      harmonogram: {
        przeliczCalyHarmonogram: function () {
          return {
            znacznik: "wynik-testowy",
            konflikty: listaKonfliktow
          };
        }
      }
    }
  };
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);
  new vm.Script(
    wczytaj("js/harmonogram/kontrakt_konfliktow.js"),
    { filename: "js/harmonogram/kontrakt_konfliktow.js" }
  ).runInContext(kontekst);

  return zakresOkna.HarmonogramBetonowan;
}

function utworzBrakTrasy(idBudowy, opis) {
  return {
    kod: "BRAK_MOZLIWEJ_POMPY",
    rodzaj: "pompy",
    idBudowy: idBudowy,
    nazwaBudowy: "Budowa " + idBudowy,
    przyczyna: "brak-trasy",
    przyczyny: ["brak-trasy"],
    opis: opis
  };
}

function utworzPrzestoj(idPoprzedniegoKursu, idNastepnegoKursu) {
  return {
    kod: "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA",
    rodzaj: "przestoj-betonowania",
    idBudowy: "A",
    idPoprzedniegoKursu: idPoprzedniegoKursu,
    idNastepnegoKursu: idNastepnegoKursu,
    przestojMinuty: 16,
    maksymalnyPrzestojMinuty: 15,
    przekroczenieLimituMinuty: 1,
    opis: "Przerwa przekracza limit."
  };
}

function sprawdzUsuwanieRzeczywistychDuplikatow() {
  const aplikacja = wczytajPelnaAplikacje();
  const agreguj = aplikacja.konflikty.agregujListeKonfliktow;
  const lista = [
    utworzBrakTrasy("A", "Pierwszy pełny opis."),
    utworzBrakTrasy("A", "Ten sam problem zgłoszony drugi raz."),
    utworzBrakTrasy("B", "Inna budowa."),
    utworzPrzestoj("A-KURS-001", "A-KURS-002"),
    utworzPrzestoj("A-KURS-001", "A-KURS-002"),
    utworzPrzestoj("A-KURS-002", "A-KURS-003")
  ];
  const zrodloPrzed = JSON.stringify(lista);
  const wynik = agreguj(lista);

  assert.equal(wynik.length, 4);
  assert.equal(wynik[0].idBudowy, "A");
  assert.equal(wynik[0].opis, "Pierwszy pełny opis.");
  assert.deepEqual(Array.from(wynik[0].przyczyny), ["brak-trasy"]);
  assert.equal(wynik[1].idBudowy, "B");
  assert.equal(wynik[2].idPoprzedniegoKursu, "A-KURS-001");
  assert.equal(wynik[2].idNastepnegoKursu, "A-KURS-002");
  assert.equal(wynik[3].idPoprzedniegoKursu, "A-KURS-002");
  assert.equal(wynik[3].idNastepnegoKursu, "A-KURS-003");
  assert.equal(JSON.stringify(lista), zrodloPrzed);
}

function sprawdzKluczNieZalezyOdKolejnosciPowiazanAniOpisu() {
  const aplikacja = wczytajPelnaAplikacje();
  const klucz = aplikacja.konflikty.pobierzKluczTozsamosciKonfliktu;
  const pierwszy = {
    kod: "KOLIZJA_ZASOBU",
    rodzaj: "zasoby",
    kategoriaKonfliktu: "kolizja",
    opis: "Pierwszy opis.",
    powiazania: [
      { typ: "budowa", id: "A", rola: "dotyczy" },
      { typ: "zasob", id: "pompa:P-1", rola: "dotyczy" }
    ]
  };
  const drugi = {
    kod: "KOLIZJA_ZASOBU",
    rodzaj: "zasoby",
    kategoriaKonfliktu: "kolizja",
    opis: "Inne sformułowanie tego samego problemu.",
    powiazania: [
      { typ: "zasob", id: "pompa:P-1", rola: "dotyczy" },
      { typ: "budowa", id: "A", rola: "dotyczy" }
    ]
  };
  const innyZasob = Object.assign({}, drugi, {
    powiazania: [
      { typ: "zasob", id: "pompa:P-2", rola: "dotyczy" },
      { typ: "budowa", id: "A", rola: "dotyczy" }
    ]
  });

  assert.equal(klucz(pierwszy), klucz(drugi));
  assert.notEqual(klucz(pierwszy), klucz(innyZasob));
}

function sprawdzRoznePrzyczynyNieSaLaczone() {
  const aplikacja = wczytajPelnaAplikacje();
  const agreguj = aplikacja.konflikty.agregujListeKonfliktow;
  const brakTrasy = utworzBrakTrasy("A", "Brak trasy.");
  const brakPompy = Object.assign({}, brakTrasy, {
    przyczyna: "brak-dostepnych-pomp",
    przyczyny: ["brak-dostepnych-pomp"],
    opis: "Brak dostępnej pompy."
  });

  assert.equal(agreguj([brakTrasy, brakPompy]).length, 2);
}

function sprawdzIntegracjeZKoncowymWynikiem() {
  const duplikat = utworzBrakTrasy("A", "Powtarzany konflikt.");
  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([
    duplikat,
    Object.assign({}, duplikat),
    utworzBrakTrasy("B", "Inna budowa.")
  ]);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({});

  assert.equal(wynik.znacznik, "wynik-testowy");
  assert.equal(wynik.konflikty.length, 2);
  assert.equal(wynik.konflikty[0].idBudowy, "A");
  assert.equal(wynik.konflikty[1].idBudowy, "B");
  assert.ok(wynik.konflikty.every(function (konflikt) {
    return konflikt.wersjaKontraktu === 1 &&
      Array.isArray(konflikt.powiazania) &&
      konflikt.powiazania.length > 0;
  }));
}

function sprawdzDeterministycznosc() {
  const aplikacja = wczytajPelnaAplikacje();
  const agreguj = aplikacja.konflikty.agregujListeKonfliktow;
  const lista = [
    utworzBrakTrasy("A", "A"),
    utworzBrakTrasy("A", "A duplikat"),
    utworzPrzestoj("A-KURS-001", "A-KURS-002"),
    utworzPrzestoj("A-KURS-002", "A-KURS-003")
  ];

  assert.deepEqual(
    JSON.parse(JSON.stringify(agreguj(lista))),
    JSON.parse(JSON.stringify(agreguj(lista)))
  );
}

sprawdzUsuwanieRzeczywistychDuplikatow();
sprawdzKluczNieZalezyOdKolejnosciPowiazanAniOpisu();
sprawdzRoznePrzyczynyNieSaLaczone();
sprawdzIntegracjeZKoncowymWynikiem();
sprawdzDeterministycznosc();

assert.equal(wczytajPelnaAplikacje().konfiguracja.punktEtapu, "5J.1");

console.log(
  "OK — 5H.2 usuwa duplikaty według stabilnej tożsamości konfliktu, zachowuje pierwsze pełne zgłoszenie i nie łączy różnych obiektów ani przyczyn."
);
