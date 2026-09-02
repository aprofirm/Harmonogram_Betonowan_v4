"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzPamiecLokalna() {
  const dane = new Map();
  return {
    getItem: function (klucz) {
      return dane.has(klucz) ? dane.get(klucz) : null;
    },
    setItem: function (klucz, wartosc) {
      dane.set(klucz, String(wartosc));
    },
    removeItem: function (klucz) {
      dane.delete(klucz);
    }
  };
}

function wczytajAplikacje() {
  const zakresOkna = { localStorage: utworzPamiecLokalna() };
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Date: Date,
    JSON: JSON,
    Error: Error,
    Promise: Promise
  };
  vm.createContext(kontekst);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/pamiec/pamiec_wezla.js",
    "js/pamiec/pamiec_tras.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function sprawdzKluczeLokalizacji(aplikacja) {
  const lokalizacjaA = aplikacja.lokalizacje.utworzModelLokalizacji({
    idWezla: "WEZEL-A",
    idLokalizacji: "B-001",
    typLokalizacji: "budowa"
  });
  const lokalizacjaB = aplikacja.lokalizacje.utworzModelLokalizacji({
    idWezla: "WEZEL-B",
    idLokalizacji: "B-001",
    typLokalizacji: "budowa"
  });

  assert.equal(lokalizacjaA.idWezla, "WEZEL-A");
  assert.equal(lokalizacjaA.kluczLokalizacji, "WEZEL-A::lokalizacja::B-001");
  assert.equal(lokalizacjaB.kluczLokalizacji, "WEZEL-B::lokalizacja::B-001");
  assert.notEqual(lokalizacjaA.kluczLokalizacji, lokalizacjaB.kluczLokalizacji);
}

function sprawdzKluczeTras(aplikacja) {
  const trasaA = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: { idLokalizacji: "WEZEL-A", typLokalizacji: "wezel" },
    punktDocelowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" }
  });
  const trasaB = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: { idLokalizacji: "WEZEL-B", typLokalizacji: "wezel" },
    punktDocelowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" }
  });
  const trasaPompyA = aplikacja.lokalizacje.utworzModelTrasy({
    idWezla: "WEZEL-A",
    punktPoczatkowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" },
    punktDocelowy: { idLokalizacji: "B-002", typLokalizacji: "budowa" }
  });
  const trasaPompyB = aplikacja.lokalizacje.utworzModelTrasy({
    idWezla: "WEZEL-B",
    punktPoczatkowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" },
    punktDocelowy: { idLokalizacji: "B-002", typLokalizacji: "budowa" }
  });

  assert.equal(trasaA.idWezla, "WEZEL-A");
  assert.equal(trasaA.kluczTrasy, "WEZEL-A::trasa::WEZEL-A->B-001");
  assert.equal(trasaB.kluczTrasy, "WEZEL-B::trasa::WEZEL-B->B-001");
  assert.equal(trasaPompyA.kluczTrasy, "WEZEL-A::trasa::B-001->B-002");
  assert.equal(trasaPompyB.kluczTrasy, "WEZEL-B::trasa::B-001->B-002");
  assert.notEqual(trasaPompyA.kluczTrasy, trasaPompyB.kluczTrasy);

  assert.throws(function () {
    aplikacja.lokalizacje.utworzModelTrasy({
      idWezla: "WEZEL-B",
      punktPoczatkowy: { idLokalizacji: "WEZEL-A", typLokalizacji: "wezel" },
      punktDocelowy: { idLokalizacji: "B-001", typLokalizacji: "budowa" }
    });
  }, /ID węzła trasy/);
}

function sprawdzPamiecRozdzielaWezly(aplikacja) {
  const wspolneDane = {
    opisLokalizacji: "Ta sama budowa testowa",
    czasDojazduMinuty: 20,
    czasPowrotuMinuty: 25,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  };

  assert.match(
    aplikacja.pamiecTras.zapiszTrase(Object.assign({ idWezla: "WEZEL-A" }, wspolneDane)).status,
    /^zapisano-/
  );
  assert.match(
    aplikacja.pamiecTras.zapiszTrase(Object.assign({ idWezla: "WEZEL-B" }, wspolneDane)).status,
    /^zapisano-/
  );
  assert.equal(aplikacja.pamiecTras.pobierzStanPamieci().liczbaTras, 2);
  assert.equal(
    aplikacja.pamiecTras.pobierzTrase("Ta sama budowa testowa", "WEZEL-A").trasa.idWezla,
    "WEZEL-A"
  );
  assert.equal(
    aplikacja.pamiecTras.pobierzTrase("Ta sama budowa testowa", "WEZEL-B").trasa.idWezla,
    "WEZEL-B"
  );
  assert.equal(
    aplikacja.pamiecTras.zapiszTrase(wspolneDane).status,
    "blad-zapisu"
  );
  assert.equal(
    aplikacja.pamiecTras.pobierzTrase("Ta sama budowa testowa").status,
    "blad-odczytu"
  );
}

function sprawdzModeleBudowyMajaZakresAktywnegoWezla(aplikacja) {
  aplikacja.pamiecWezla.zapiszWezel({
    idWezla: "WEZEL-TESTOWY",
    nazwa: "Betoniarnia testowa"
  });

  const budowa = {
    idBudowy: "B-603",
    firma: "Firma Testowa",
    budowa: "Plac Testowy",
    zrodlo: "reczny"
  };

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.modelLokalizacji.idWezla, "WEZEL-TESTOWY");
  assert.equal(
    budowa.modelLokalizacji.kluczLokalizacji,
    "WEZEL-TESTOWY::lokalizacja::B-603"
  );
  assert.equal(budowa.modelTrasyDojazdu.idWezla, "WEZEL-TESTOWY");
  assert.equal(
    budowa.modelTrasyDojazdu.kluczTrasy,
    "WEZEL-TESTOWY::trasa::WEZEL-TESTOWY->B-603"
  );
  assert.equal(
    budowa.modelTrasyPowrotu.kluczTrasy,
    "WEZEL-TESTOWY::trasa::B-603->WEZEL-TESTOWY"
  );
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6C — węzeł\/betoniarnia jako początek tras/);
  assert.match(etapy, /- \[x\] \*\*6C\.3 — gotowość na wiele węzłów/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6D\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6C\.3/);
  assert.match(stan, /\*\*104\/104 zestawów testów\*\*/);
  assert.match(plan, /### 6C\.3 — gotowość na wiele węzłów/);
  assert.match(decyzje, /## 127\. Klucze lokalizacji i tras są zakresowane ID węzła/);
  assert.match(kontrakt, /## Zakres wielu węzłów 6C\.3/);
}

const aplikacja = wczytajAplikacje();
sprawdzKluczeLokalizacji(aplikacja);
sprawdzKluczeTras(aplikacja);
sprawdzPamiecRozdzielaWezly(aplikacja);

const aplikacjaZDanymWezlem = wczytajAplikacje();
sprawdzModeleBudowyMajaZakresAktywnegoWezla(aplikacjaZDanymWezlem);
sprawdzDokumentacje();

console.log(
  "OK — 6C.3 zakresuje lokalizacje, trasy i cache ID węzła bez mieszania danych różnych betoniarni."
);
