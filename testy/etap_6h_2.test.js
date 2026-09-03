"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomModuly() {
  const sandbox = {
    window: {
      HarmonogramBetonowan: {
        pompy: {}
      }
    },
    Promise: Promise,
    Date: Date
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  [
    "js/pompy/edycja_przejazdow_pomp.js",
    "js/lokalizacje/routing_budowa_budowa.js",
    "js/lokalizacje/integracja_przejazdow_pomp.js"
  ].forEach(function (sciezka) {
    vm.runInContext(wczytaj(sciezka), sandbox, { filename: sciezka });
  });

  return sandbox.window.HarmonogramBetonowan;
}

function utworzBudowe(id, szerokosc, dlugosc) {
  return {
    idBudowy: id,
    modelLokalizacji: {
      idLokalizacji: id,
      typLokalizacji: "budowa",
      daneRobocze: {
        statusJakosci: "potwierdzona",
        zrodlo: "mapa",
        wspolrzedne: {
          szerokoscGeograficzna: szerokosc,
          dlugoscGeograficzna: dlugosc
        }
      }
    }
  };
}

function utworzWynikRoutingu(mod, pierwsza, druga, dane) {
  const ustawienia = dane || {};
  const data = ustawienia.data || "2026-09-03T09:00:00.000Z";

  return {
    status: "ok",
    pierwszaDoDrugiej: mod.utworzWynikKierunkowejTrasyBudowaBudowa({
      punktPoczatkowy: {
        idLokalizacji: pierwsza.idBudowy,
        typLokalizacji: "budowa",
        wspolrzedne: pierwsza.modelLokalizacji.daneRobocze.wspolrzedne
      },
      punktDocelowy: {
        idLokalizacji: druga.idBudowy,
        typLokalizacji: "budowa",
        wspolrzedne: druga.modelLokalizacji.daneRobocze.wspolrzedne
      },
      dystansDrogowyMetry: ustawienia.dystansPierwszy || 14000,
      czasPrzejazduMinuty: ustawienia.czasPierwszy || 21,
      zrodlo: ustawienia.zrodloPierwszy || "mapa",
      dataWyznaczenia: data
    }),
    drugaDoPierwszej: mod.utworzWynikKierunkowejTrasyBudowaBudowa({
      punktPoczatkowy: {
        idLokalizacji: druga.idBudowy,
        typLokalizacji: "budowa",
        wspolrzedne: druga.modelLokalizacji.daneRobocze.wspolrzedne
      },
      punktDocelowy: {
        idLokalizacji: pierwsza.idBudowy,
        typLokalizacji: "budowa",
        wspolrzedne: pierwsza.modelLokalizacji.daneRobocze.wspolrzedne
      },
      dystansDrogowyMetry: ustawienia.dystansDrugi || 15300,
      czasPrzejazduMinuty: ustawienia.czasDrugi || 27,
      zrodlo: ustawienia.zrodloDrugi || "mapa",
      dataWyznaczenia: data
    })
  };
}

function sprawdzZasilenieObuKierunkow(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  const wynikRoutingu = utworzWynikRoutingu(
    aplikacja.lokalizacje,
    pierwsza,
    druga
  );

  const wynik = aplikacja.lokalizacje.zastosujWynikTrasDoPrzejazdowPomp(
    pierwsza,
    druga,
    wynikRoutingu
  );

  assert.equal(wynik.status, "zasilono-provider-przejazdow-pomp");
  assert.equal(wynik.czyZastosowanoJakakolwiekWartosc, true);
  assert.equal(pierwsza.przejazdyPompyMinuty.B, 21);
  assert.equal(pierwsza.zrodlaPrzejazdowPompy.B, "mapa");
  assert.equal(druga.przejazdyPompyMinuty.A, 27);
  assert.equal(druga.zrodlaPrzejazdowPompy.A, "mapa");

  assert.deepEqual(
    aplikacja.lokalizacje.pobierzDanePrzejazduPompyBudowaBudowa(
      pierwsza,
      druga
    ),
    {
      czasPrzejazduMinuty: 21,
      zrodloCzasuPrzejazdu: "mapa"
    }
  );
}

function sprawdzOchroneRecznejWartosci(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  pierwsza.przejazdyPompyMinuty = { B: 44 };
  pierwsza.zrodlaPrzejazdowPompy = { B: "reczny" };

  const wynik = aplikacja.lokalizacje.zastosujWynikTrasDoPrzejazdowPomp(
    pierwsza,
    druga,
    utworzWynikRoutingu(aplikacja.lokalizacje, pierwsza, druga)
  );

  assert.equal(pierwsza.przejazdyPompyMinuty.B, 44);
  assert.equal(pierwsza.zrodlaPrzejazdowPompy.B, "reczny");
  assert.equal(wynik.pierwszaDoDrugiej.czyZastosowano, false);
  assert.equal(wynik.pierwszaDoDrugiej.czyZachowanoChronionaWartosc, true);
  assert.equal(wynik.pierwszaDoDrugiej.czasAutomatycznyMinuty, 21);
  assert.equal(druga.przejazdyPompyMinuty.A, 27);
}

function sprawdzOchroneCsvIPamieci(aplikacja) {
  ["csv", "pamiec"].forEach(function (zrodlo) {
    const pierwsza = utworzBudowe("A", 50.80, 16.20);
    const druga = utworzBudowe("B", 50.90, 16.40);
    pierwsza.przejazdyPompyMinuty = { B: 35 };
    pierwsza.zrodlaPrzejazdowPompy = { B: zrodlo };

    aplikacja.lokalizacje.zastosujWynikTrasDoPrzejazdowPomp(
      pierwsza,
      druga,
      utworzWynikRoutingu(aplikacja.lokalizacje, pierwsza, druga)
    );

    assert.equal(pierwsza.przejazdyPompyMinuty.B, 35);
    assert.equal(pierwsza.zrodlaPrzejazdowPompy.B, zrodlo);
  });
}

function sprawdzOdswiezenieMapy(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  pierwsza.przejazdyPompyMinuty = { B: 50 };
  pierwsza.zrodlaPrzejazdowPompy = { B: "mapa" };

  const wynik = aplikacja.lokalizacje.zastosujWynikTrasDoPrzejazdowPomp(
    pierwsza,
    druga,
    utworzWynikRoutingu(aplikacja.lokalizacje, pierwsza, druga, {
      czasPierwszy: 19
    })
  );

  assert.equal(pierwsza.przejazdyPompyMinuty.B, 19);
  assert.equal(pierwsza.zrodlaPrzejazdowPompy.B, "mapa");
  assert.equal(wynik.pierwszaDoDrugiej.czyZastosowano, true);
}

function sprawdzWynikZPamieciMozeZasilicBrak(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);

  aplikacja.lokalizacje.zastosujWynikTrasDoPrzejazdowPomp(
    pierwsza,
    druga,
    utworzWynikRoutingu(aplikacja.lokalizacje, pierwsza, druga, {
      czasPierwszy: 23,
      zrodloPierwszy: "pamiec",
      czasDrugi: 26,
      zrodloDrugi: "pamiec"
    })
  );

  assert.equal(pierwsza.przejazdyPompyMinuty.B, 23);
  assert.equal(pierwsza.zrodlaPrzejazdowPompy.B, "pamiec");
  assert.equal(druga.przejazdyPompyMinuty.A, 26);
  assert.equal(druga.zrodlaPrzejazdowPompy.A, "pamiec");
}

function sprawdzWalidacjePrzedMutacja(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  const wynikRoutingu = utworzWynikRoutingu(
    aplikacja.lokalizacje,
    pierwsza,
    druga
  );
  wynikRoutingu.drugaDoPierwszej.punktDocelowy.idLokalizacji = "INNA";

  assert.throws(function () {
    aplikacja.lokalizacje.zastosujWynikTrasDoPrzejazdowPomp(
      pierwsza,
      druga,
      wynikRoutingu
    );
  }, /nie odpowiada wskazanej parze budów/i);

  assert.equal(pierwsza.przejazdyPompyMinuty, undefined);
  assert.equal(druga.przejazdyPompyMinuty, undefined);
}

async function sprawdzPobranieIZastosowanie(aplikacja) {
  const pierwsza = utworzBudowe("A", 50.80, 16.20);
  const druga = utworzBudowe("B", 50.90, 16.40);
  let liczbaWywolan = 0;
  const adapter = {
    wyznaczTrase: function () {
      liczbaWywolan += 1;
      return Promise.resolve({
        status: "ok",
        dystansDrogowyMetry: liczbaWywolan === 1 ? 12000 : 12500,
        czasPrzejazduMinuty: liczbaWywolan === 1 ? 18 : 20,
        zrodlo: "mapa"
      });
    }
  };

  const wynik = await aplikacja.lokalizacje.pobierzIZastosujTrasyPrzejazdowPomp(
    pierwsza,
    druga,
    adapter,
    { dataWyznaczenia: "2026-09-03T09:30:00.000Z" }
  );

  assert.equal(liczbaWywolan, 2);
  assert.equal(wynik.status, "zasilono-provider-przejazdow-pomp");
  assert.equal(pierwsza.przejazdyPompyMinuty.B, 18);
  assert.equal(druga.przejazdyPompyMinuty.A, 20);
}

function sprawdzGraniceIntegracji() {
  const kod = wczytaj("js/lokalizacje/integracja_przejazdow_pomp.js");
  const routing = wczytaj("js/lokalizacje/routing_budowa_budowa.js");
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");
  const panel = wczytaj("js/interfejs/przejazdy_pomp.js");
  const index = wczytaj("index.html");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.doesNotMatch(kod, /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization/i);
  assert.doesNotMatch(routing, /aplikacja\.pompy/i);
  assert.match(harmonogram, /przejazdyPompyMinuty/);
  assert.match(harmonogram, /zrodlaPrzejazdowPompy/);
  assert.match(panel, /przejazdyPompyMinuty/);
  assert.match(panel, /zrodlaPrzejazdowPompy/);
  assert.match(index, /js\/lokalizacje\/routing_budowa_budowa\.js/);
  assert.match(index, /js\/lokalizacje\/integracja_przejazdow_pomp\.js/);
  assert.ok(
    index.indexOf("routing_budowa_budowa.js") <
      index.indexOf("integracja_przejazdow_pomp.js")
  );
  assert.ok(
    index.indexOf("integracja_przejazdow_pomp.js") <
      index.indexOf("js/harmonogram/harmonogram.js")
  );
  assert.match(stan, /Ostatni zakończony podetap: \*\*6H\.2/);
  assert.match(stan, /Rozpocząć \*\*6H\.3/);
  assert.match(stan, /118\/118 zestawów testów/);
}

(async function () {
  const aplikacja = uruchomModuly();
  sprawdzZasilenieObuKierunkow(aplikacja);
  sprawdzOchroneRecznejWartosci(aplikacja);
  sprawdzOchroneCsvIPamieci(aplikacja);
  sprawdzOdswiezenieMapy(aplikacja);
  sprawdzWynikZPamieciMozeZasilicBrak(aplikacja);
  sprawdzWalidacjePrzedMutacja(aplikacja);
  await sprawdzPobranieIZastosowanie(aplikacja);
  sprawdzGraniceIntegracji();
  console.log(
    "OK — 6H.2 zasila istniejący provider przejazdów pomp mapą lub pamięcią bez nadpisywania ręcznych, CSV ani zapamiętanych wartości."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
