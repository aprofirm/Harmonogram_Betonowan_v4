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
    "js/pamiec/pamiec_tras.js",
    "js/budowy/budowy.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzBudowe(aplikacja, idBudowy, firma, miejsce) {
  return aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: idBudowy,
    firma: firma,
    budowa: miejsce,
    startPlanowany: "08:00",
    iloscBetonuM3: "8"
  }, 2);
}

function sprawdzMigracjePlaskichCzasow(aplikacja) {
  const budowa = utworzBudowe(
    aplikacja,
    "STARY-001",
    "Firma testowa",
    "Plac testowy 1"
  );
  aplikacja.budowy.ustawCzasyRobocze(budowa, {
    czasDojazduRoboczyMinuty: 21,
    czasPowrotuRoboczyMinuty: 24,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  const wynik = aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(wynik.czyZmigrowano, true);
  assert.equal(budowa.modelLokalizacji.wersjaKontraktu, 1);
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekst, "Plac testowy 1");
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.zrodlo, "csv");
  assert.equal(budowa.modelTrasyDojazdu.kierunek, "do-budowy");
  assert.equal(budowa.modelTrasyPowrotu.kierunek, "do-wezla");
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty, 21);
  assert.equal(budowa.modelTrasyPowrotu.daneRobocze.czasPrzejazduMinuty, 24);
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czyKorektaReczna, true);
  assert.equal(
    aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa).czyZmigrowano,
    false
  );
}

function sprawdzMigracjeKsiazkiTras(aplikacja) {
  aplikacja.pamiecTras.zapiszTrase({
    idWezla: "wezel-domyslny",
    opisLokalizacji: "Firma cache | Plac cache",
    czasDojazduMinuty: 17,
    czasPowrotuMinuty: 19,
    zrodloCzasuDojazdu: "mapa",
    zrodloCzasuPowrotu: "mapa"
  });
  const budowa = utworzBudowe(
    aplikacja,
    "CACHE-001",
    "Firma cache",
    "Plac cache"
  );

  const wynik = aplikacja.lokalizacje.uzupelnijBudoweZPamieci(budowa);

  assert.equal(wynik.czyUzupelniono, true);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 17);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 19);
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.zrodlo, "pamiec");
  assert.equal(budowa.modelTrasyPowrotu.daneRobocze.zrodlo, "pamiec");
}

function sprawdzPierwszenstwoRecznejKorekty(aplikacja) {
  const budowa = utworzBudowe(
    aplikacja,
    "RECZNY-001",
    "Firma ręczna",
    "Plac ręczny"
  );
  budowa.czasDojazduRoboczyMinuty = 18;
  budowa.zrodloCzasuDojazdu = "mapa";
  budowa.modelTrasyDojazdu = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: {
      idLokalizacji: "wezel-domyslny",
      typLokalizacji: "wezel"
    },
    punktDocelowy: {
      idLokalizacji: "RECZNY-001",
      typLokalizacji: "budowa"
    },
    daneAutomatyczne: {
      czasPrzejazduMinuty: 18,
      statusJakosci: "pelna",
      zrodlo: "mapa"
    },
    daneRobocze: {
      czasPrzejazduMinuty: 31,
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 31);
  assert.equal(budowa.zrodloCzasuDojazdu, "reczny");
  assert.equal(budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty, 18);

  aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    35
  );
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty, 35);
  assert.equal(budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty, 18);

  aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    ""
  );
  assert.equal(budowa.czasDojazduRoboczyMinuty, null);
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty, null);
  assert.equal(budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty, 18);
}

async function sprawdzWarstweAutomatycznaIBrame(aplikacja) {
  const budowa = utworzBudowe(
    aplikacja,
    "MAPA-001",
    "Firma mapowa",
    "Plac mapowy"
  );
  let liczbaWywolanMapy = 0;
  const wynik = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    budowa,
    function () {
      liczbaWywolanMapy += 1;
      return { czasDojazduMinuty: 26, czasPowrotuMinuty: 29 };
    }
  );

  assert.equal(wynik.status, "uzyto-wyniku-mapy");
  assert.equal(budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty, 26);
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty, 26);

  aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "czasDojazduRoboczyMinuty",
    41
  );
  await aplikacja.lokalizacje.pobierzLubUstalTrase(budowa, function () {
    liczbaWywolanMapy += 1;
    return { czasDojazduMinuty: 10, czasPowrotuMinuty: 10 };
  });

  assert.equal(liczbaWywolanMapy, 1);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 41);
  assert.equal(budowa.modelTrasyDojazdu.daneRobocze.czasPrzejazduMinuty, 41);
  assert.equal(budowa.modelTrasyDojazdu.daneAutomatyczne.czasPrzejazduMinuty, 26);
}

function sprawdzGraniceIPamiecPlanu() {
  const aplikacja = wczytaj("js/aplikacja.js");
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(aplikacja, /wersjaStanuAplikacji:\s*4/);
  assert.match(aplikacja, /"modelLokalizacji"/);
  assert.match(aplikacja, /"modelTrasyDojazdu"/);
  assert.match(aplikacja, /"modelTrasyPowrotu"/);
  assert.match(
    aplikacja,
    /aplikacja\.lokalizacje\.zmienCzasRoboczyBudowy\([\s\S]*?nazwaPola,[\s\S]*?wartosc/
  );
  assert.doesNotMatch(harmonogram, /modelLokalizacji|modelTrasyDojazdu|modelTrasyPowrotu/);
  assert.doesNotMatch(harmonogram, /fetch\s*\(|localStorage|Nominatim|OSRM|Google Maps/i);
  assert.match(etapy, /- \[x\] \*\*6A —/);
  assert.match(etapy, /- \[x\] \*\*6A\.3 —/);
  assert.match(stan, /Starsze plany i książka tras `v1` są podłączane/);
}

async function uruchomTest() {
  const aplikacja = wczytajAplikacje();

  sprawdzMigracjePlaskichCzasow(aplikacja);
  sprawdzMigracjeKsiazkiTras(aplikacja);
  sprawdzPierwszenstwoRecznejKorekty(aplikacja);
  await sprawdzWarstweAutomatycznaIBrame(aplikacja);
  sprawdzGraniceIPamiecPlanu();

  console.log(
    "OK — 6A.3 migruje starsze czasy i cache, chroni ręczne wartości oraz granicę silnika."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
