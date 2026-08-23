"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/import/import_csv.js",
    "js/budowy/budowy.js"
  ].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzModelImportu(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany",
    "1;Firma A;Budowa A;07:30",
    "2;Firma B;Budowa B;13:00 (+60 min)"
  ].join("\n");
  const budowy = aplikacja.importCsv.przetworzCsv(csv, "kp-4.csv").budowy;

  assert.equal(budowy[0].startPlanowanyZrodlowy, "07:30");
  assert.equal(budowy[0].startPlanowany, "07:30");
  assert.equal(budowy[0].startZadany, "07:30");
  assert.equal(budowy[0].startRoboczy, "07:30");

  assert.equal(budowy[1].startPlanowanyZrodlowy, "13:00 (+60 min)");
  assert.equal(budowy[1].startPlanowany, "13:00");
  assert.equal(budowy[1].startZadany, "13:00");
  assert.equal(budowy[1].startRoboczy, "13:00");
}

function sprawdzModelBudowyRecznej(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweReczna(
    {
      firma: "Firma ręczna",
      budowa: "Budowa ręczna",
      startPlanowany: "09:15",
      iloscBetonuM3: "8"
    },
    []
  );

  assert.equal(budowa.startPlanowanyZrodlowy, "09:15");
  assert.equal(budowa.startPlanowany, "09:15");
  assert.equal(budowa.startZadany, "09:15");
  assert.equal(budowa.startRoboczy, "09:15");
}

function sprawdzZgodnoscModelu(aplikacja) {
  const starszaBudowa = {
    idBudowy: "STARA-1",
    startPlanowany: "10:00",
    startRoboczy: "10:20",
    dodatkowyOdstepDostawMinuty: 0
  };
  const listaRobocza = aplikacja.budowy.utworzListeRobocza(
    [starszaBudowa],
    []
  );

  assert.equal(listaRobocza[0].startZadany, "10:00");
  assert.equal(listaRobocza[0].startRoboczy, "10:20");
  assert.equal(
    Object.prototype.hasOwnProperty.call(starszaBudowa, "startZadany"),
    false
  );

  const bezStartuRoboczego = {
    startPlanowany: "11:00",
    startZadany: "11:15"
  };
  aplikacja.budowy.uzupelnijStartZadanyBudowy(bezStartuRoboczego);
  assert.equal(bezStartuRoboczego.startPlanowany, "11:00");
  assert.equal(bezStartuRoboczego.startZadany, "11:15");
  assert.equal(bezStartuRoboczego.startRoboczy, "11:15");

  assert.throws(function () {
    aplikacja.budowy.uzupelnijStartZadanyBudowy({
      startPlanowany: "12:00",
      startZadany: ""
    });
  }, /Start zadany.*nie może być puste/i);
}

function sprawdzPoleZapisuPlanu() {
  const kodAplikacji = fs.readFileSync(
    path.join(katalogProjektu, "js/aplikacja.js"),
    "utf8"
  );

  assert.match(
    kodAplikacji,
    /"startPlanowany",\s*"startZadany",\s*"startRoboczy"/
  );
}

function uruchomTesty() {
  const aplikacja = wczytajAplikacje();

  sprawdzModelImportu(aplikacja);
  sprawdzModelBudowyRecznej(aplikacja);
  sprawdzZgodnoscModelu(aplikacja);
  sprawdzPoleZapisuPlanu();

  console.log("✓ KP-4.1: model trzech godzin działa poprawnie.");
}

uruchomTesty();
