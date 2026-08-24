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
    "js/budowy/budowy.js",
    "js/gruszki/gruszki.js"
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

function sprawdzZmianeIPrzywracanieStartu(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweReczna(
    {
      firma: "Firma testowa",
      budowa: "Budowa testowa",
      startPlanowany: "09:00",
      iloscBetonuM3: "8"
    },
    []
  );

  aplikacja.budowy.ustawCzasyRobocze(budowa, {
    czasDojazduRoboczyMinuty: 20,
    czasPowrotuRoboczyMinuty: 20
  });
  aplikacja.budowy.zmienStartZadanyBudowy(budowa, "09:45");

  assert.equal(budowa.startPlanowany, "09:00");
  assert.equal(budowa.startPlanowanyZrodlowy, "09:00");
  assert.equal(budowa.startZadany, "09:45");
  assert.equal(budowa.startRoboczy, "09:45");

  const kurs = aplikacja.gruszki.obliczCzasyKursow(
    aplikacja.gruszki.generujKursyDlaBudowy(budowa, 8),
    [budowa],
    {
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15
    }
  )[0];
  assert.equal(kurs.godzinaRozpoczeciaRozladunku, "09:45");

  aplikacja.budowy.przywrocStartPlanowanyBudowy(budowa);
  assert.equal(budowa.startPlanowany, "09:00");
  assert.equal(budowa.startZadany, "09:00");
  assert.equal(budowa.startRoboczy, "09:00");
}

function sprawdzWalidacjeKorektyStartu(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweReczna(
    {
      firma: "Firma walidacji",
      budowa: "Budowa walidacji",
      startPlanowany: "07:30",
      iloscBetonuM3: "8"
    },
    []
  );
  const niepoprawneGodziny = ["7:30", "24:00", "12:60", "12:30:00", "tekst"];

  assert.throws(function () {
    aplikacja.budowy.zmienStartZadanyBudowy(budowa, "");
  }, /Start do przeliczenia.*nie może być puste/i);

  niepoprawneGodziny.forEach(function (godzina) {
    assert.throws(function () {
      aplikacja.budowy.zmienStartZadanyBudowy(budowa, godzina);
    }, /formacie HH:MM.*00:00 do 23:59/i);
  });

  assert.equal(budowa.startPlanowany, "07:30");
  assert.equal(budowa.startPlanowanyZrodlowy, "07:30");
  assert.equal(budowa.startZadany, "07:30");
  assert.equal(budowa.startRoboczy, "07:30");

  aplikacja.budowy.zmienStartZadanyBudowy(budowa, "00:00");
  assert.equal(budowa.startZadany, "00:00");
  aplikacja.budowy.zmienStartZadanyBudowy(budowa, "23:59");
  assert.equal(budowa.startZadany, "23:59");

  assert.throws(function () {
    aplikacja.budowy.zmienStartZadanyBudowy(null, "08:00");
  }, /Nie znaleziono budowy/i);
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
  assert.match(kodAplikacji, /migracja-startow-zadanych/);
}

function sprawdzInterfejsKorektyStartu() {
  const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
  const interfejs = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/interfejs.js"),
    "utf8"
  );
  const css = fs.readFileSync(
    path.join(katalogProjektu, "style/glowny.css"),
    "utf8"
  );
  const kodAplikacji = fs.readFileSync(
    path.join(katalogProjektu, "js/aplikacja.js"),
    "utf8"
  );

  assert.match(html, /<th>Start do przeliczenia<\/th>/);
  assert.match(html, /4A\.1 · kwalifikacja budów do pomp/);
  assert.match(interfejs, /className = "pole-startu-budowy"/);
  assert.match(interfejs, /type = "time"/);
  assert.match(interfejs, /step = "60"/);
  assert.match(interfejs, /required = true/);
  assert.match(interfejs, /textContent = "Plan: " \+ opiszOknoStartu/);
  assert.match(interfejs, /className = "przycisk-przywroc-start"/);
  assert.match(interfejs, /obslugaZmianyStartuBudowy/);
  assert.match(kodAplikacji, /Nie znaleziono budowy o ID/);
  assert.match(css, /\.komorka-startu-budowy/);
  assert.match(css, /\.plan-zrodlowy-startu/);
}

function uruchomTesty() {
  const aplikacja = wczytajAplikacje();

  sprawdzModelImportu(aplikacja);
  sprawdzModelBudowyRecznej(aplikacja);
  sprawdzZgodnoscModelu(aplikacja);
  sprawdzZmianeIPrzywracanieStartu(aplikacja);
  sprawdzWalidacjeKorektyStartu(aplikacja);
  sprawdzPoleZapisuPlanu();
  sprawdzInterfejsKorektyStartu();

  console.log(
    "✓ KP-4: model, walidacja i pamięć korekty startu działają."
  );
}

uruchomTesty();
