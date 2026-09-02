"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

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

function wczytajModuly() {
  const zakresOkna = { localStorage: utworzPamiecLokalna() };
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Date: Date,
    JSON: JSON,
    Error: Error
  };
  vm.createContext(kontekst);

  [
    "js/pamiec/pamiec_tras.js",
    "js/budowy/budowy.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzBudowe(aplikacja, firma, miejsce) {
  return aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "B-TEST",
    firma: firma,
    budowa: miejsce,
    startPlanowany: "08:00",
    iloscBetonuM3: "8"
  }, 2);
}

async function uruchomTest() {
  const aplikacja = wczytajModuly();
  const pierwszaBudowa = utworzBudowe(
    aplikacja,
    "Firma Testowa",
    "Jachimowicza 2, Świebodzice"
  );

  aplikacja.budowy.zmienCzasRoboczyBudowy(
    pierwszaBudowa,
    "czasDojazduRoboczyMinuty",
    23
  );
  aplikacja.budowy.zmienCzasRoboczyBudowy(
    pierwszaBudowa,
    "czasPowrotuRoboczyMinuty",
    29
  );
  const wynikZapisu = aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci(
    pierwszaBudowa
  );

  assert.match(wynikZapisu.status, /^zapisano-/);
  assert.equal(wynikZapisu.liczbaTras, 1);

  const ponownieZaimportowana = utworzBudowe(
    aplikacja,
    "FIRMA TESTOWA",
    "jachimówicza 2 świebodzice"
  );
  const wynikOdtworzenia = aplikacja.lokalizacje.uzupelnijBudoweZPamieci(
    ponownieZaimportowana
  );

  assert.equal(wynikOdtworzenia.czyUzupelniono, true);
  assert.equal(ponownieZaimportowana.czasDojazduRoboczyMinuty, 23);
  assert.equal(ponownieZaimportowana.czasPowrotuRoboczyMinuty, 29);
  assert.equal(ponownieZaimportowana.zrodloCzasuDojazdu, "pamiec");
  assert.equal(ponownieZaimportowana.zrodloCzasuPowrotu, "pamiec");

  const budowaZBiezacymCzasem = utworzBudowe(
    aplikacja,
    "Firma Testowa",
    "Jachimowicza 2, Świebodzice"
  );
  aplikacja.budowy.ustawCzasyRobocze(budowaZBiezacymCzasem, {
    czasDojazduRoboczyMinuty: 40,
    czasPowrotuRoboczyMinuty: 41,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
  assert.equal(
    aplikacja.lokalizacje.uzupelnijBudoweZPamieci(budowaZBiezacymCzasem).status,
    "pozostawiono-istniejace-czasy"
  );
  assert.equal(budowaZBiezacymCzasem.czasDojazduRoboczyMinuty, 40);

  const podobnaAleInna = utworzBudowe(
    aplikacja,
    "Firma Testowa",
    "Jachimowicza 2, Świebodzice — etap 2"
  );
  assert.equal(
    aplikacja.lokalizacje.uzupelnijBudoweZPamieci(podobnaAleInna).czyUzupelniono,
    false
  );

  let liczbaWywolanMapy = 0;
  const znanaBudowaDlaPrzeplywu = utworzBudowe(
    aplikacja,
    "Firma Testowa",
    "Jachimowicza 2, Świebodzice"
  );
  const wynikZnanejTrasy = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    znanaBudowaDlaPrzeplywu,
    function () {
      liczbaWywolanMapy += 1;
      return { czasDojazduMinuty: 99, czasPowrotuMinuty: 99 };
    }
  );

  assert.equal(wynikZnanejTrasy.status, "uzyto-pamieci-tras");
  assert.equal(wynikZnanejTrasy.czyWywolanoMape, false);
  assert.equal(liczbaWywolanMapy, 0);
  assert.equal(znanaBudowaDlaPrzeplywu.czasDojazduRoboczyMinuty, 23);

  const nowaBudowaDlaMapy = utworzBudowe(
    aplikacja,
    "Inna Firma",
    "Nowy adres 10"
  );
  const wynikMapy = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    nowaBudowaDlaMapy,
    function () {
      liczbaWywolanMapy += 1;
      return { czasDojazduMinuty: 34, czasPowrotuMinuty: 38 };
    }
  );

  assert.equal(wynikMapy.status, "uzyto-wyniku-mapy");
  assert.equal(wynikMapy.czyWywolanoMape, true);
  assert.equal(liczbaWywolanMapy, 1);
  assert.equal(nowaBudowaDlaMapy.zrodloCzasuDojazdu, "mapa");
  assert.equal(nowaBudowaDlaMapy.czasPowrotuRoboczyMinuty, 38);

  const ponownieNowaBudowa = utworzBudowe(
    aplikacja,
    "Inna Firma",
    "Nowy adres 10"
  );
  const wynikMapyZPamieci = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    ponownieNowaBudowa,
    function () {
      liczbaWywolanMapy += 1;
      return { czasDojazduMinuty: 50, czasPowrotuMinuty: 50 };
    }
  );

  assert.equal(wynikMapyZPamieci.status, "uzyto-pamieci-tras");
  assert.equal(liczbaWywolanMapy, 1);
  assert.equal(ponownieNowaBudowa.czasDojazduRoboczyMinuty, 34);
  assert.equal(ponownieNowaBudowa.czasPowrotuRoboczyMinuty, 38);

  const pierwszaTrasaZeStarszegoPlanu = utworzBudowe(
    aplikacja,
    "Firma Plan A",
    "Plac budowy A"
  );
  aplikacja.budowy.ustawCzasyRobocze(pierwszaTrasaZeStarszegoPlanu, {
    czasDojazduRoboczyMinuty: 15,
    czasPowrotuRoboczyMinuty: 18,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
  const drugaTrasaZeStarszegoPlanu = utworzBudowe(
    aplikacja,
    "Firma Plan B",
    "Plac budowy B"
  );
  aplikacja.budowy.ustawCzasyRobocze(drugaTrasaZeStarszegoPlanu, {
    czasDojazduRoboczyMinuty: 21,
    czasPowrotuRoboczyMinuty: 24,
    zrodloCzasuDojazdu: "mapa",
    zrodloCzasuPowrotu: "mapa"
  });
  const budowaBezKompletuCzasow = utworzBudowe(
    aplikacja,
    "Firma Plan C",
    "Plac budowy C"
  );
  budowaBezKompletuCzasow.czasDojazduRoboczyMinuty = 12;

  const wynikZapisuListy =
    aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci([
      pierwszaTrasaZeStarszegoPlanu,
      drugaTrasaZeStarszegoPlanu,
      budowaBezKompletuCzasow
    ]);

  assert.deepEqual(JSON.parse(JSON.stringify(wynikZapisuListy)), {
    liczbaBudow: 3,
    liczbaKompletnych: 2,
    liczbaZapisanych: 2,
    liczbaPominietychNiekompletnych: 1,
    liczbaPominietychIstniejacych: 0
  });

  pierwszaTrasaZeStarszegoPlanu.czasDojazduRoboczyMinuty = 99;
  const wynikBezNadpisania =
    aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci(
      [pierwszaTrasaZeStarszegoPlanu, drugaTrasaZeStarszegoPlanu],
      { tylkoBrakujace: true }
    );
  const zachowanaTrasa = aplikacja.pamiecTras.pobierzTrase(
    "Firma Plan A | Plac budowy A",
    "wezel-domyslny"
  );

  assert.equal(wynikBezNadpisania.liczbaZapisanych, 0);
  assert.equal(wynikBezNadpisania.liczbaPominietychIstniejacych, 2);
  assert.equal(zachowanaTrasa.trasa.czasDojazduMinuty, 15);

  console.log(
    "✓ KP-2.3–KP-2.7.1: cache omija mapę i archiwizuje wszystkie kompletne trasy."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
