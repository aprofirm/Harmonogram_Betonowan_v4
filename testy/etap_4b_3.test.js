"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModulPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pompy/pompy.js"),
    "utf8"
  );
  new vm.Script(kod, { filename: "js/pompy/pompy.js" }).runInContext(kontekst);
  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzDanePompy(idPompy, dodatkoweDane) {
  return Object.assign({
    idPompy: idPompy,
    nazwa: "Pompa " + idPompy,
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "07:00",
    wysiegMetry: 32
  }, dodatkoweDane || {});
}

function sprawdzUnikalneId(pompy) {
  assert.throws(function () {
    pompy.normalizujListePomp([
      utworzDanePompy("POMPA-001"),
      utworzDanePompy(" POMPA-001 ")
    ]);
  }, /powtórzony identyfikator/i);

  const listaWejsciowa = [
    utworzDanePompy("POMPA-002"),
    utworzDanePompy("", { nazwa: "Pompa bez ID" }),
    utworzDanePompy(null, { nazwa: "Druga pompa bez ID" })
  ];
  const stanWejsciowy = JSON.stringify(listaWejsciowa);
  const wynik = pompy.normalizujListePomp(listaWejsciowa);

  assert.deepEqual(
    Array.from(wynik, function (pompa) {
      return pompa.idPompy;
    }),
    ["POMPA-002", "POMPA-001", "POMPA-003"]
  );
  assert.equal(new Set(wynik.map(function (pompa) {
    return pompa.idPompy;
  })).size, 3);
  assert.equal(JSON.stringify(listaWejsciowa), stanWejsciowy);
}

function sprawdzTypyPomp(pompy) {
  const wynik = pompy.normalizujListePomp([
    utworzDanePompy("TYP-001", { typ: " WLASNA " }),
    utworzDanePompy("TYP-002", { typ: "ZeWnEtRzNa" }),
    utworzDanePompy("TYP-003", { typ: "   " })
  ]);

  assert.deepEqual(
    Array.from(wynik, function (pompa) {
      return pompa.typ;
    }),
    ["wlasna", "zewnetrzna", "wlasna"]
  );
  assert.throws(function () {
    pompy.normalizujListePomp([
      utworzDanePompy("TYP-BLEDNY", { typ: "wynajeta" })
    ]);
  }, /własna.*zewnętrzna/i);
}

function sprawdzBezpieczneWartosciPuste(pompy) {
  const wynik = pompy.normalizujListePomp([
    {
      idPompy: "   ",
      nazwa: "   ",
      typ: "   ",
      aktywna: null,
      dostepnaOd: "   ",
      wysiegMetry: "   "
    }
  ], "06:30");

  assert.deepEqual(JSON.parse(JSON.stringify(wynik[0])), {
    idPompy: "POMPA-001",
    nazwa: "Pompa 1",
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "06:30",
    wysiegMetry: 32
  });

  assert.throws(function () {
    pompy.dopasujLiczbePomp([], "   ", "07:00");
  }, /Liczba pomp/i);
  assert.throws(function () {
    pompy.edytujPompe(wynik, "POMPA-001", { aktywna: "false" });
  }, /wartość logiczną/i);
  assert.throws(function () {
    pompy.edytujPompe(wynik, "POMPA-001", { dostepnaOd: "24:00" });
  }, /HH:MM/i);
  assert.throws(function () {
    pompy.edytujPompe(wynik, "POMPA-001", { wysiegMetry: 0 });
  }, /większą niż 0/i);
}

function sprawdzPompyDoPrzydzialu(pompy) {
  const listaWejsciowa = [
    utworzDanePompy("POMPA-AKTYWNA-1"),
    utworzDanePompy("POMPA-NIEAKTYWNA", { aktywna: false }),
    utworzDanePompy("POMPA-AKTYWNA-2", { typ: "zewnetrzna" })
  ];
  const stanWejsciowy = JSON.stringify(listaWejsciowa);
  const kandydaci = pompy.pobierzPompyAktywneDoPrzydzialu(listaWejsciowa);

  assert.deepEqual(
    Array.from(kandydaci, function (pompa) {
      return pompa.idPompy;
    }),
    ["POMPA-AKTYWNA-1", "POMPA-AKTYWNA-2"]
  );
  assert.equal(kandydaci.every(function (pompa) {
    return pompa.aktywna === true;
  }), true);
  assert.equal(pompy.pobierzLiczbeAktywnychPomp(listaWejsciowa), 2);
  assert.equal(JSON.stringify(listaWejsciowa), stanWejsciowy);
  assert.notStrictEqual(kandydaci[0], listaWejsciowa[0]);
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzUnikalneId(pompy);
  sprawdzTypyPomp(pompy);
  sprawdzBezpieczneWartosciPuste(pompy);
  sprawdzPompyDoPrzydzialu(pompy);

  console.log(
    "✓ Etap 4B.3: ID, typy, puste wartości i wykluczanie nieaktywnych pomp są bezpieczne."
  );
}

uruchomTesty();
