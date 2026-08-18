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

function utworzBudowe(idBudowy, iloscBetonuM3, statusRealizacji) {
  return {
    idBudowy: idBudowy,
    firma: "Firma testowa",
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startRoboczy: "08:00",
    iloscBetonuLiczbaM3: iloscBetonuM3,
    statusRealizacji: statusRealizacji || "do-realizacji",
    czasDojazduRoboczyMinuty: 0,
    czasPowrotuRoboczyMinuty: 0,
    dodatkowyCzasZaladunkuMinuty: 0,
    dodatkowyCzasRozladunkuMinuty: 0
  };
}

function pobierzIlosciKursow(kursy) {
  return Array.from(kursy, function (kurs) {
    return kurs.iloscBetonuM3;
  });
}

function sprawdzPodstawoweDzielenie(aplikacja) {
  const pelneKursy = aplikacja.gruszki.generujKursyDlaBudowy(
    utworzBudowe("B-24", 24),
    8
  );
  const niepelnyOstatniKurs = aplikacja.gruszki.generujKursyDlaBudowy(
    utworzBudowe("B-18", 18),
    8
  );
  const malaDostawa = aplikacja.gruszki.generujKursyDlaBudowy(
    utworzBudowe("B-5", 5),
    8
  );

  assert.deepEqual(pobierzIlosciKursow(pelneKursy), [8, 8, 8]);
  assert.deepEqual(pobierzIlosciKursow(niepelnyOstatniKurs), [8, 8, 2]);
  assert.deepEqual(pobierzIlosciKursow(malaDostawa), [5]);
  assert.equal(niepelnyOstatniKurs[2].idKursu, "B-18-KURS-003");
  assert.equal(niepelnyOstatniKurs[2].statusKursu, "oczekuje-na-przydzial");
}

function sprawdzZrealizowanePozycje(aplikacja) {
  const kursyDlaZera = aplikacja.gruszki.generujKursyDlaBudowy(
    utworzBudowe("B-0", 0, "zrealizowana"),
    8
  );

  assert.deepEqual(Array.from(kursyDlaZera), []);
}

function sprawdzDzisiejszyScenariuszKdx(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;Zam-o (mój zakład)",
    "Firma A;Budowa 1;06:20;1,0 m3",
    "Firma B;Budowa 2;07:30;3,0 m3",
    "Firma C;Budowa 3;09:00;30,0 m3",
    "Firma D;Budowa 4;12:00;19,5 m3",
    "Firma E;Budowa 5;12:00;0,0 m3",
    "Firma F;Budowa 6;12:30;14,0 m3",
    "Firma G;Budowa 7;13:00 (+60 min);3,5 m3",
    "Firma H;Budowa 8;14:00;0,0 m3"
  ].join("\n");
  const stanImportu = aplikacja.importCsv.przetworzCsv(csv, "test-kdx.csv");
  stanImportu.budowy.forEach(function (budowa) {
    aplikacja.budowy.ustawCzasyRobocze(budowa, {
      czasDojazduRoboczyMinuty: 0,
      czasPowrotuRoboczyMinuty: 0,
      dodatkowyCzasZaladunkuMinuty: 0,
      dodatkowyCzasRozladunkuMinuty: 0
    });
  });
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    parametry: { pojemnoscGruszkiM3: 8 }
  });
  const kursy = wynik.kursy;

  assert.equal(kursy.length, 12);
  assert.deepEqual(
    pobierzIlosciKursow(kursy),
    [1, 3, 8, 8, 8, 6, 8, 8, 3.5, 8, 6, 3.5]
  );
  assert.equal(
    kursy.some(function (kurs) {
      return kurs.idBudowy === "CSV-005" || kurs.idBudowy === "CSV-008";
    }),
    false
  );
  assert.equal(wynik.budowy[6].startPlanowany, "13:00");
  assert.equal(wynik.budowy[6].najpozniejszyStart, "14:00");
}

function sprawdzPonownePrzeliczenie(aplikacja) {
  const stanImportu = {
    budowy: [utworzBudowe("B-18", 18)]
  };
  const pierwszyWynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    parametry: { pojemnoscGruszkiM3: 8 }
  });
  const drugiWynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    parametry: { pojemnoscGruszkiM3: 10 }
  });

  assert.deepEqual(pobierzIlosciKursow(pierwszyWynik.kursy), [8, 8, 2]);
  assert.deepEqual(pobierzIlosciKursow(drugiWynik.kursy), [10, 8]);
  assert.equal(pierwszyWynik.kursy.length, 3);
  assert.equal(drugiWynik.kursy.length, 2);
  assert.notEqual(pierwszyWynik.kursy, drugiWynik.kursy);
  assert.equal(stanImportu.budowy[0].startPlanowany, "08:00");
}

function sprawdzBlednaPojemnosc(aplikacja) {
  assert.throws(
    function () {
      aplikacja.gruszki.generujKursy([utworzBudowe("B-8", 8)], 0);
    },
    /Pojemność gruszki musi być liczbą większą od 0 m³/i
  );

  assert.throws(
    function () {
      aplikacja.gruszki.generujKursy([utworzBudowe("B-UJEMNA", -1)], 8);
    },
    /Ilość betonu.*nie może być mniejsza od 0 m³/i
  );
}

const aplikacja = wczytajAplikacje();
sprawdzPodstawoweDzielenie(aplikacja);
sprawdzZrealizowanePozycje(aplikacja);
sprawdzDzisiejszyScenariuszKdx(aplikacja);
sprawdzPonownePrzeliczenie(aplikacja);
sprawdzBlednaPojemnosc(aplikacja);

console.log("✓ Etap 3A: generowanie kursów i ponowne przeliczanie działają poprawnie.");
