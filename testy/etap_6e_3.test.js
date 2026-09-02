"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAdapter(zdarzenia) {
  const sandbox = {
    window: {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      HarmonogramBetonowan: {
        diagnostyka: {
          zapiszZdarzenie: function (poziom, kod, opis, szczegoly) {
            zdarzenia.push({
              poziom: poziom,
              kod: kod,
              opis: opis,
              szczegoly: szczegoly
            });
          }
        }
      }
    },
    URLSearchParams: URLSearchParams,
    Promise: Promise,
    console: console
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/lokalizacje/adapter_uslug_mapowych.js"),
    sandbox,
    { filename: "adapter_uslug_mapowych.js" }
  );
  return sandbox.window.HarmonogramBetonowan.uslugiMapowe;
}

function zapytanieTrasy() {
  return {
    punktPoczatkowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.0, dlugoscGeograficzna: 16.0 }
    },
    punktDocelowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.1, dlugoscGeograficzna: 16.2 }
    }
  };
}

async function sprawdzStatusyHttp() {
  const zdarzenia = [];
  const mod = uruchomAdapter(zdarzenia);

  async function statusDlaHttp(statusHttp) {
    const adapter = mod.utworzAdapterOpenrouteservice({
      kluczApi: "SEKRET-TESTOWY",
      wykonajZapytanie: function () {
        return { ok: false, status: statusHttp };
      }
    });
    return adapter.wyznaczTrase(zapytanieTrasy());
  }

  const limit = await statusDlaHttp(429);
  assert.equal(limit.status, "limit-uslugi");
  assert.equal(limit.statusHttp, 429);
  assert.equal(limit.czyPonowicPozniej, true);
  assert.match(limit.komunikatOperatora, /limit/i);

  const bladSerwera = await statusDlaHttp(503);
  assert.equal(bladSerwera.status, "blad-uslugi");
  assert.equal(bladSerwera.statusHttp, 503);
  assert.equal(bladSerwera.czyPonowicPozniej, true);

  const odrzucone = await statusDlaHttp(400);
  assert.equal(odrzucone.status, "blad-zapytania-uslugi");
  assert.equal(odrzucone.statusHttp, 400);
  assert.equal(odrzucone.czyPonowicPozniej, false);

  const zapisDiagnostyczny = JSON.stringify(zdarzenia);
  assert.doesNotMatch(zapisDiagnostyczny, /SEKRET-TESTOWY/);
  assert.doesNotMatch(zapisDiagnostyczny, /api\.heigit\.org/);
  assert.doesNotMatch(zapisDiagnostyczny, /50\.0|16\.0|50\.1|16\.2/);
  assert.match(zapisDiagnostyczny, /limit-uslugi/);
  assert.match(zapisDiagnostyczny, /503/);
}

async function sprawdzSiecTimeoutIFormat() {
  const zdarzenia = [];
  const mod = uruchomAdapter(zdarzenia);

  const bezSieci = mod.utworzAdapterOpenrouteservice({
    kluczApi: "K",
    wykonajZapytanie: function () {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
  });
  const wynikBezSieci = await bezSieci.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikBezSieci.status, "brak-sieci");
  assert.equal(wynikBezSieci.czyPonowicPozniej, true);

  const timeout = mod.utworzAdapterOpenrouteservice({
    kluczApi: "K",
    timeoutMs: 5,
    wykonajZapytanie: function () {
      return new Promise(function () {});
    }
  });
  const wynikTimeoutu = await timeout.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikTimeoutu.status, "timeout");
  assert.equal(wynikTimeoutu.czyPonowicPozniej, true);

  const zlyFormat = mod.utworzAdapterOpenrouteservice({
    kluczApi: "K",
    wykonajZapytanie: function () {
      return { routes: [{ summary: {} }] };
    }
  });
  const wynikFormatu = await zlyFormat.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikFormatu.status, "niepoprawna-odpowiedz");
  assert.equal(wynikFormatu.dystansDrogowyMetry, null);
  assert.equal(wynikFormatu.czasPrzejazduMinuty, null);

  const brakKlucza = mod.utworzAdapterOpenrouteservice({
    wykonajZapytanie: function () { return {}; }
  });
  const wynikBrakuKlucza = await brakKlucza.wyznaczTrase(zapytanieTrasy());
  assert.equal(wynikBrakuKlucza.status, "brak-konfiguracji");
  assert.equal(wynikBrakuKlucza.czyPonowicPozniej, false);
}

async function sprawdzMostNiePytaDrugiRazPoBledzie() {
  const zdarzenia = [];
  const mod = uruchomAdapter(zdarzenia);
  let liczbaWywolan = 0;
  const adapter = mod.utworzNeutralnyAdapter({
    geokoduj: function () { return { kandydaci: [] }; },
    wyznaczTrase: function () {
      liczbaWywolan += 1;
      throw new TypeError("Brak sieci");
    }
  });

  const wynik = await adapter.pobierzTraseDlaBudowy({
    wezel: {
      modelLokalizacji: {
        daneRobocze: {
          wspolrzedne: { szerokoscGeograficzna: 50.0, dlugoscGeograficzna: 16.0 }
        }
      }
    },
    lokalizacjaBudowy: {
      daneRobocze: {
        wspolrzedne: { szerokoscGeograficzna: 50.1, dlugoscGeograficzna: 16.2 }
      }
    }
  });

  assert.equal(wynik.status, "brak-sieci");
  assert.equal(wynik.czasDojazduMinuty, null);
  assert.equal(wynik.czasPowrotuMinuty, null);
  assert.equal(liczbaWywolan, 1);
}

function sprawdzIntegracjeIDokumentacje() {
  const adapter = wczytaj("js/lokalizacje/adapter_uslug_mapowych.js");
  const lokalizacje = wczytaj("js/lokalizacje/lokalizacje.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(adapter, /DOMYSLNY_TIMEOUT_MS = 10000/);
  assert.match(adapter, /limit-uslugi/);
  assert.match(adapter, /niepoprawna-odpowiedz/);
  assert.match(adapter, /usluga-mapowa-/);
  assert.match(lokalizacje, /trasaZMapy\.status !== "ok"/);
  assert.match(lokalizacje, /czyPonowicPozniej/);
  assert.match(etapy, /- \[x\] \*\*6E —/);
  assert.match(etapy, /- \[x\] \*\*6E\.3 — bezpieczne błędy:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6F\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6E\.3/);
  assert.match(stan, /110\/110 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6F\.1 — wyszukiwanie lokalizacji/);
  assert.match(decyzje, /## 132\. Błędy usług mapowych są danymi domenowymi/);
  assert.match(kontrakt, /## Bezpieczne błędy adaptera — 6E\.3/);
  assert.match(plan, /### 6E\.3 — bezpieczne błędy/);
}

(async function () {
  await sprawdzStatusyHttp();
  await sprawdzSiecTimeoutIFormat();
  await sprawdzMostNiePytaDrugiRazPoBledzie();
  sprawdzIntegracjeIDokumentacje();
  console.log(
    "OK — 6E.3 neutralizuje błędy usługi mapowej, chroni diagnostykę i nie blokuje harmonogramu."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
