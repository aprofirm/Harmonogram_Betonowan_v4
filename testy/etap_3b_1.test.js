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

function utworzBudowe(daneCzasow) {
  return Object.assign({
    idBudowy: "B-TEST",
    firma: "Firma testowa",
    budowa: "Budowa testowa",
    startPlanowany: "11:00",
    startRoboczy: "11:00",
    iloscBetonuLiczbaM3: 16,
    statusRealizacji: "do-realizacji",
    czasDojazduRoboczyMinuty: 25,
    czasPowrotuRoboczyMinuty: 25,
    dodatkowyCzasZaladunkuMinuty: 0,
    dodatkowyCzasRozladunkuMinuty: 0
  }, daneCzasow || {});
}

function przelicz(aplikacja, budowa) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: [budowa] },
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15
    }
  });
}

function sprawdzPodstawowyCykl(aplikacja) {
  const wynik = przelicz(aplikacja, utworzBudowe());
  const pierwszyKurs = wynik.kursy[0];
  const drugiKurs = wynik.kursy[1];

  assert.equal(wynik.punktEtapu, "3B.1");
  assert.equal(wynik.kursy.length, 2);
  assert.equal(pierwszyKurs.godzinaRozpoczeciaZaladunku, "10:25");
  assert.equal(pierwszyKurs.godzinaWyjazduZBetoniarni, "10:35");
  assert.equal(pierwszyKurs.godzinaPrzyjazduNaBudowe, "11:00");
  assert.equal(pierwszyKurs.godzinaZakonczeniaRozladunku, "11:15");
  assert.equal(pierwszyKurs.godzinaPowrotuDoBetoniarni, "11:40");
  assert.equal(drugiKurs.godzinaRozpoczeciaRozladunku, "11:15");
  assert.equal(drugiKurs.godzinaGotowosciDoKolejnegoKursu, "11:55");
}

function sprawdzWydluzoneCzasy(aplikacja) {
  const wynik = przelicz(aplikacja, utworzBudowe({
    dodatkowyCzasZaladunkuMinuty: 5,
    dodatkowyCzasRozladunkuMinuty: 10
  }));
  const pierwszyKurs = wynik.kursy[0];
  const drugiKurs = wynik.kursy[1];

  assert.equal(pierwszyKurs.calkowityCzasZaladunkuMinuty, 15);
  assert.equal(pierwszyKurs.calkowityCzasRozladunkuMinuty, 25);
  assert.equal(pierwszyKurs.godzinaRozpoczeciaZaladunku, "10:20");
  assert.equal(pierwszyKurs.godzinaZakonczeniaRozladunku, "11:25");
  assert.equal(pierwszyKurs.godzinaPowrotuDoBetoniarni, "11:50");
  assert.equal(drugiKurs.godzinaRozpoczeciaRozladunku, "11:25");
  assert.equal(drugiKurs.godzinaPowrotuDoBetoniarni, "12:15");
}

function sprawdzBrakCzasuPrzejazdu(aplikacja) {
  assert.throws(
    function () {
      przelicz(aplikacja, utworzBudowe({ czasDojazduRoboczyMinuty: null }));
    },
    /Uzupełnij „Czas dojazdu” dla budowy „B-TEST”/i
  );

  assert.throws(
    function () {
      przelicz(aplikacja, utworzBudowe({ czasPowrotuRoboczyMinuty: null }));
    },
    /Uzupełnij „Czas powrotu” dla budowy „B-TEST”/i
  );
}

function sprawdzRoboczeCzasyBudowy(aplikacja) {
  const budowa = utworzBudowe({
    czasDojazduRoboczyMinuty: null,
    czasPowrotuRoboczyMinuty: null
  });

  aplikacja.budowy.ustawCzasyRobocze(budowa, {
    czasDojazduRoboczyMinuty: 20,
    czasPowrotuRoboczyMinuty: 30,
    dodatkowyCzasZaladunkuMinuty: 4,
    dodatkowyCzasRozladunkuMinuty: 6
  });

  assert.equal(budowa.czasDojazduRoboczyMinuty, 20);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 30);
  assert.equal(budowa.dodatkowyCzasZaladunkuMinuty, 4);
  assert.equal(budowa.dodatkowyCzasRozladunkuMinuty, 6);
  assert.equal(budowa.zrodloCzasuDojazdu, "reczny");
  assert.equal(budowa.zrodloCzasuPowrotu, "reczny");
}

function sprawdzDomyslnaRownoscDojazduIPowrotu(aplikacja) {
  const budowa = utworzBudowe({
    czasDojazduRoboczyMinuty: null,
    czasPowrotuRoboczyMinuty: null
  });

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    25
  );
  assert.equal(budowa.czasDojazduRoboczyMinuty, 25);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 25);

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    30
  );
  assert.equal(budowa.czasDojazduRoboczyMinuty, 30);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 25);

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowa,
    "czasPowrotuRoboczyMinuty",
    20
  );
  assert.equal(budowa.czasDojazduRoboczyMinuty, 30);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 20);

  const budowaZPowrotemWpisanymNajpierw = utworzBudowe({
    czasDojazduRoboczyMinuty: null,
    czasPowrotuRoboczyMinuty: null
  });

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowaZPowrotemWpisanymNajpierw,
    "czasPowrotuRoboczyMinuty",
    15
  );
  assert.equal(budowaZPowrotemWpisanymNajpierw.czasDojazduRoboczyMinuty, 15);
  assert.equal(budowaZPowrotemWpisanymNajpierw.czasPowrotuRoboczyMinuty, 15);

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowaZPowrotemWpisanymNajpierw,
    "czasPowrotuRoboczyMinuty",
    ""
  );
  assert.equal(budowaZPowrotemWpisanymNajpierw.czasDojazduRoboczyMinuty, 15);
  assert.equal(budowaZPowrotemWpisanymNajpierw.czasPowrotuRoboczyMinuty, null);

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    budowaZPowrotemWpisanymNajpierw,
    "czasDojazduRoboczyMinuty",
    18
  );
  assert.equal(budowaZPowrotemWpisanymNajpierw.czasDojazduRoboczyMinuty, 18);
  assert.equal(budowaZPowrotemWpisanymNajpierw.czasPowrotuRoboczyMinuty, null);
}

const aplikacja = wczytajAplikacje();
sprawdzPodstawowyCykl(aplikacja);
sprawdzWydluzoneCzasy(aplikacja);
sprawdzBrakCzasuPrzejazdu(aplikacja);
sprawdzRoboczeCzasyBudowy(aplikacja);
sprawdzDomyslnaRownoscDojazduIPowrotu(aplikacja);

console.log("✓ Etap 3B.1: pełne czasy kursów są obliczane poprawnie.");
