"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const kluczV1 = "harmonogramBetonowan.pamiecTras.v1";
const kluczV2 = "harmonogramBetonowan.pamiecTras.v2";

function utworzPamiecLokalna() {
  const dane = new Map();
  return {
    getItem: (klucz) => dane.has(klucz) ? dane.get(klucz) : null,
    setItem: (klucz, wartosc) => dane.set(klucz, String(wartosc)),
    removeItem: (klucz) => dane.delete(klucz),
    ustaw: (klucz, wartosc) => dane.set(klucz, String(wartosc))
  };
}

function uruchomModul(pamiec) {
  const okno = { localStorage: pamiec };
  okno.window = okno;
  const kontekst = { window: okno, Date, JSON, Error };
  vm.createContext(kontekst);
  const kod = fs.readFileSync(
    path.join(katalogProjektu, "js/pamiec/pamiec_tras.js"),
    "utf8"
  );
  new vm.Script(kod).runInContext(kontekst);
  return okno.HarmonogramBetonowan.pamiecTras;
}

function sprawdzBogatyFormatV2() {
  const pamiec = utworzPamiecLokalna();
  const modul = uruchomModul(pamiec);
  const wynik = modul.zapiszTrase({
    idWezla: "W-A",
    opisLokalizacji: "Budowa testowa A",
    adresLokalizacji: {
      tekst: "Testowa 12, 00-001 Miasto",
      tekstZnormalizowany: "testowa 12 00 001 miasto",
      czesci: { ulica: "Testowa", numerBudynku: "12", miejscowosc: "Miasto" }
    },
    wspolrzedneLokalizacji: {
      szerokoscGeograficzna: 50.85,
      dlugoscGeograficzna: 16.32
    },
    dystansDojazduMetry: 12345,
    dystansPowrotuMetry: 12510,
    czasDojazduMinuty: 21,
    czasPowrotuMinuty: 24,
    zrodloCzasuDojazdu: "mapa",
    zrodloCzasuPowrotu: "mapa",
    dostawcaDanych: "testowy-adapter"
  });

  assert.equal(wynik.status, "zapisano-trwale");
  const ksiazka = JSON.parse(pamiec.getItem(kluczV2));
  assert.equal(ksiazka.wersja, 2);
  assert.equal(ksiazka.trasy.length, 1);
  const trasa = ksiazka.trasy[0];
  assert.equal(trasa.adresLokalizacji.tekst, "Testowa 12, 00-001 Miasto");
  assert.equal(trasa.wspolrzedneLokalizacji.szerokoscGeograficzna, 50.85);
  assert.equal(trasa.dystansDojazduMetry, 12345);
  assert.equal(trasa.dystansPowrotuMetry, 12510);
  assert.equal(trasa.czasDojazduMinuty, 21);
  assert.equal(trasa.czasPowrotuMinuty, 24);
  assert.equal(trasa.zrodloDanych, "mapa");
  assert.equal(trasa.dostawcaDanych, "testowy-adapter");
  assert.ok(trasa.utworzono && trasa.zaktualizowano && trasa.ostatnioUzyto);
}

function sprawdzMigracjeV1BezUtratyDanych() {
  const pamiec = utworzPamiecLokalna();
  const staraTrasa = {
    kluczTrasy: "stary-klucz",
    opisLokalizacji: "Firma X | Plac A",
    opisZnormalizowany: "firma x plac a",
    czasDojazduMinuty: 17,
    czasPowrotuMinuty: 19,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny",
    utworzono: "2026-08-20T08:00:00.000Z",
    zaktualizowano: "2026-08-20T09:00:00.000Z",
    ostatnioUzyto: "2026-08-21T09:00:00.000Z"
  };
  pamiec.ustaw(kluczV1, JSON.stringify({ wersja: 1, trasy: [staraTrasa] }));

  const modul = uruchomModul(pamiec);
  const stan = modul.pobierzStanPamieci();
  assert.equal(stan.wersjaFormatu, 2);
  assert.equal(stan.liczbaTras, 1);
  assert.notEqual(pamiec.getItem(kluczV1), null, "v1 ma pozostać kopią bezpieczeństwa");

  const ksiazkaV2 = JSON.parse(pamiec.getItem(kluczV2));
  assert.equal(ksiazkaV2.wersja, 2);
  const trasa = ksiazkaV2.trasy[0];
  assert.equal(trasa.idWezla, "wezel-domyslny");
  assert.equal(trasa.czasDojazduMinuty, 17);
  assert.equal(trasa.czasPowrotuMinuty, 19);
  assert.equal(trasa.zrodloDanych, "reczny");
  assert.equal(trasa.utworzono, staraTrasa.utworzono);
  assert.equal(trasa.adresLokalizacji.tekst, null);
  assert.equal(trasa.wspolrzedneLokalizacji, null);
  assert.equal(trasa.dystansDojazduMetry, null);
}

function sprawdzStaryInterfejsINienadpisywanieMetadanych() {
  const pamiec = utworzPamiecLokalna();
  const modul = uruchomModul(pamiec);
  modul.zapiszTrase({
    idWezla: "W-A",
    opisLokalizacji: "Budowa A",
    adresLokalizacji: { tekst: "Testowa 1, Miasto" },
    wspolrzedneLokalizacji: { szerokoscGeograficzna: 50, dlugoscGeograficzna: 16 },
    dystansDojazduMetry: 10000,
    dystansPowrotuMetry: 10100,
    czasDojazduMinuty: 20,
    czasPowrotuMinuty: 22,
    zrodloCzasuDojazdu: "mapa",
    zrodloCzasuPowrotu: "mapa",
    dostawcaDanych: "adapter-a"
  });

  modul.zapiszTrase({
    idWezla: "W-A",
    opisLokalizacji: "Budowa A",
    czasDojazduMinuty: 25,
    czasPowrotuMinuty: 27,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  const trasa = modul.pobierzTrase("Budowa A", "W-A").trasa;
  assert.equal(trasa.czasDojazduMinuty, 25);
  assert.equal(trasa.adresLokalizacji.tekst, "Testowa 1, Miasto");
  assert.equal(trasa.dystansDojazduMetry, 10000);
  assert.equal(trasa.dostawcaDanych, "adapter-a");
}

function sprawdzGraniceEtapu() {
  const etapy = fs.readFileSync(path.join(katalogProjektu, "ETAPY_ROZWOJU.md"), "utf8");
  const stan = fs.readFileSync(path.join(katalogProjektu, "STAN_PROJEKTU.md"), "utf8");
  assert.match(etapy, /- \[x\] \*\*6D\.1 — rozszerzenie formatu pamięci/);
  assert.match(etapy, /- \[ \] \*\*6D\.2 — stabilny klucz i duplikaty/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6D\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6D\.1/);
  assert.match(stan, /105\/105 zestawów testów/);
}

sprawdzBogatyFormatV2();
sprawdzMigracjeV1BezUtratyDanych();
sprawdzStaryInterfejsINienadpisywanieMetadanych();
sprawdzGraniceEtapu();
console.log("OK — 6D.1 rozszerza pamięć tras do v2 i bezpiecznie migruje v1.");
