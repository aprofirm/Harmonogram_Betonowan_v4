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
    "js/harmonogram/kontrakt_konfliktow.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStanScenariusza(aplikacja) {
  const csv = wczytaj("przyklady/5j3_test_operatora.csv");
  const stan = aplikacja.importCsv.przetworzCsv(csv, "5j3_test_operatora.csv");
  const budowaA = stan.budowy.find(function (budowa) {
    return budowa.idBudowy === "A";
  });
  const budowaB = stan.budowy.find(function (budowa) {
    return budowa.idBudowy === "B";
  });

  budowaA.przejazdyPompyMinuty = { B: 0, C: 0 };
  budowaA.zrodlaPrzejazdowPompy = { B: "reczny", C: "reczny" };
  budowaB.przejazdyPompyMinuty = { C: 0 };
  budowaB.zrodlaPrzejazdowPompy = { C: "reczny" };
  return stan;
}

function utworzListePomp() {
  return [{
    idPompy: "P-1",
    nazwa: "Pompa 1",
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "07:00",
    wysiegMetry: 32
  }];
}

function utworzParametry(liczbaGruszek, liczbaPomp) {
  return {
    poczatekDnia: "07:00",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    maksymalneOpoznienieStartuMinuty: 30,
    maksymalnyPrzestojMinuty: 5,
    trybGruszek: "mam-okreslona-liczbe",
    liczbaDostepnychGruszek: liczbaGruszek,
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: liczbaPomp
  };
}

function przelicz(aplikacja, liczbaGruszek, liczbaPomp) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: utworzStanScenariusza(aplikacja),
    listaPomp: utworzListePomp(),
    parametry: utworzParametry(liczbaGruszek, liczbaPomp)
  });
}

function pobierzBudowe(wynik, idBudowy) {
  return wynik.budowy.find(function (budowa) {
    return budowa.idBudowy === idBudowy;
  });
}

function sprawdzScenariuszA() {
  const aplikacja = wczytajAplikacje();
  const wynik = przelicz(aplikacja, 1, 1);

  assert.equal(pobierzBudowe(wynik, "A").startRoboczy, "08:00");
  assert.equal(pobierzBudowe(wynik, "B").startRoboczy, "09:30");
  assert.equal(pobierzBudowe(wynik, "C").startRoboczy, "11:25");

  const kursyOpoznionePrzezGruszke = wynik.kursy.filter(function (kurs) {
    return Number(kurs.opoznienieZPowoduGruszekMinuty) > 0;
  });
  assert.ok(
    kursyOpoznionePrzezGruszke.length > 0,
    "Jedna gruszka ma wywołać widoczne opóźnienie co najmniej jednego kursu."
  );
  wynik.kursy.filter(function (kurs) {
    return kurs.statusKursu === "przydzielony";
  }).forEach(function (kurs) {
    assert.equal(kurs.numerGruszki, 1);
  });

  const konfliktStartuC = wynik.konflikty.find(function (konflikt) {
    return konflikt.kod === "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU" &&
      konflikt.idBudowy === "C";
  });
  assert.ok(konfliktStartuC, "Scenariusz musi tworzyć konflikt limitu startu dla C.");
  assert.equal(konfliktStartuC.startZadany, "10:50");
  assert.equal(konfliktStartuC.startRoboczy, "11:25");
  assert.equal(konfliktStartuC.opoznienieStartuMinuty, 35);
  assert.equal(konfliktStartuC.maksymalneOpoznienieStartuMinuty, 30);
  assert.equal(konfliktStartuC.przekroczenieLimituMinuty, 5);

  const konfliktyPrzestoju = wynik.konflikty.filter(function (konflikt) {
    return konflikt.kod === "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA";
  });
  assert.ok(
    konfliktyPrzestoju.length > 0,
    "Limit testowy 5 min ma ujawnić co najmniej jeden rzeczywisty przestój."
  );
  konfliktyPrzestoju.forEach(function (konflikt) {
    assert.equal(konflikt.maksymalnyPrzestojMinuty, 5);
    assert.ok(konflikt.przestojMinuty > 5);
    assert.ok(konflikt.idPoprzedniegoKursu);
    assert.ok(konflikt.idNastepnegoKursu);
  });
}

function sprawdzScenariuszB() {
  const aplikacja = wczytajAplikacje();
  const wynikBezGruszek = przelicz(aplikacja, 0, 1);
  const konfliktGruszek = wynikBezGruszek.konflikty.find(function (konflikt) {
    return konflikt.kod === "BRAK_DOSTEPNYCH_GRUSZEK";
  });

  assert.ok(konfliktGruszek, "Przy 0 gruszek musi powstać jawny konflikt zasobu.");
  assert.equal(konfliktGruszek.kategoriaKonfliktu, "brak-gruszki");

  const wynikBezPomp = przelicz(aplikacja, 1, 0);
  const konfliktPompy = wynikBezPomp.konflikty.find(function (konflikt) {
    return konflikt.kod === "BRAK_MOZLIWEJ_POMPY" &&
      konflikt.przyczyna === "brak-dostepnych-pomp";
  });

  assert.ok(konfliktPompy, "Przy 0 pomp musi powstać jawny konflikt braku pompy.");
  assert.equal(konfliktPompy.kategoriaKonfliktu, "brak-pompy");
  assert.equal(konfliktPompy.minutaMozliwegoStartuBetonowania, null);
}

function sprawdzDokumentacjePrzygotowania() {
  const scenariusz = wczytaj("testy/SCENARIUSZ_OPERATORA_5J_3.md");
  const csv = wczytaj("przyklady/5j3_test_operatora.csv");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");

  assert.match(scenariusz, /ZALICZONY PRZEZ OPERATORA/);
  assert.match(scenariusz, /A — OK/);
  assert.match(scenariusz, /B1 — OK/);
  assert.match(scenariusz, /B2 — OK/);
  assert.match(scenariusz, /A — OK \/ NIE/);
  assert.match(scenariusz, /B1 — OK \/ NIE/);
  assert.match(scenariusz, /B2 — OK \/ NIE/);
  assert.match(csv, /A;Alfa;Budowa A;08:00;16;Pompa;0;0/);
  assert.match(csv, /X;Delta;Budowa X;09:40;8;Lej;0;0/);
  assert.match(etapy, /\[x\] \*\*5J\.3 — test operatora:/);
}

sprawdzScenariuszA();
sprawdzScenariuszB();
sprawdzDokumentacjePrzygotowania();

console.log(
  "OK — 5J.3 ma powtarzalne dane, oczekiwany wynik i zapisane zaliczenie testu operatora."
);
