"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAdapter() {
  const sandbox = {
    window: {},
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

async function sprawdzNeutralnyKontrakt() {
  const mod = uruchomAdapter();
  const wywolania = [];
  const adapter = mod.utworzNeutralnyAdapter({
    geokoduj: function (zapytanie) {
      wywolania.push({ rodzaj: "geokodowanie", zapytanie: zapytanie });
      return {
        kandydaci: [{
          adres: {
            tekst: "Testowa 7, Miasto",
            czesci: { ulica: "Testowa", numerBudynku: "7", miejscowosc: "Miasto" }
          },
          wspolrzedne: {
            szerokoscGeograficzna: 50.1,
            dlugoscGeograficzna: 16.2
          },
          surowePoleDostawcy: "nie może wyjść poza implementację"
        }]
      };
    },
    wyznaczTrase: function (zapytanie) {
      wywolania.push({ rodzaj: "routing", zapytanie: zapytanie });
      return {
        dystansDrogowyMetry: 12500,
        czasPrzejazduMinuty: 18.5,
        surowaOdpowiedz: { provider: "dowolny" }
      };
    }
  });

  assert.equal(adapter.wersjaKontraktu, 1);

  const geokodowanie = await adapter.geokoduj({
    tekstAdresu: "  Testowa 7, Miasto  ",
    limitWynikow: 3
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(geokodowanie)),
    {
      wersjaKontraktu: 1,
      status: "ok",
      kandydaci: [{
        adres: {
          tekst: "Testowa 7, Miasto",
          czesci: {
            ulica: "Testowa",
            numerBudynku: "7",
            miejscowosc: "Miasto"
          }
        },
        wspolrzedne: {
          szerokoscGeograficzna: 50.1,
          dlugoscGeograficzna: 16.2
        },
        statusJakosci: "nieoceniona",
        zrodlo: "mapa"
      }]
    }
  );
  assert.equal(wywolania[0].zapytanie.tekstAdresu, "Testowa 7, Miasto");
  assert.equal(wywolania[0].zapytanie.limitWynikow, 3);
  assert.equal("surowePoleDostawcy" in geokodowanie.kandydaci[0], false);

  const trasa = await adapter.wyznaczTrase({
    punktPoczatkowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.1, dlugoscGeograficzna: 16.2 }
    },
    punktDocelowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.2, dlugoscGeograficzna: 16.3 }
    },
    profilPojazdu: { masaTony: 32 }
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(trasa)),
    {
      wersjaKontraktu: 1,
      status: "ok",
      dystansDrogowyMetry: 12500,
      czasPrzejazduMinuty: 18.5,
      zrodlo: "mapa"
    }
  );
  assert.equal("surowaOdpowiedz" in trasa, false);
}

async function sprawdzImplementacjeOpenrouteservice() {
  const mod = uruchomAdapter();
  const wywolania = [];
  const adapter = mod.utworzAdapterOpenrouteservice({
    kluczApi: "TESTOWY-KLUCZ-NIE-ZAPISYWAC",
    wykonajZapytanie: function (url, opcje) {
      wywolania.push({ url: url, opcje: opcje });

      if (url.includes("/geocode/search?")) {
        return {
          features: [{
            geometry: { coordinates: [16.2, 50.1] },
            properties: {
              label: "Testowa 7, 00-001 Miasto, Polska",
              street: "Testowa",
              housenumber: "7",
              postalcode: "00-001",
              locality: "Miasto",
              county: "Powiat Testowy",
              region: "Województwo Testowe",
              country: "Polska"
            }
          }]
        };
      }

      const body = JSON.parse(opcje.body);
      const start = body.coordinates[0];
      const cel = body.coordinates[1];
      const czyDojazd = start[0] === 16.0 && cel[0] === 16.2;

      return {
        routes: [{
          summary: {
            distance: czyDojazd ? 20000 : 21000,
            duration: czyDojazd ? 1200 : 1260
          }
        }]
      };
    }
  });

  const wynikGeokodowania = await adapter.geokoduj({
    tekstAdresu: "Testowa 7, Miasto",
    limitWynikow: 2
  });
  assert.equal(wynikGeokodowania.kandydaci.length, 1);
  assert.equal(
    wynikGeokodowania.kandydaci[0].wspolrzedne.szerokoscGeograficzna,
    50.1
  );
  assert.match(wywolania[0].url, /^https:\/\/api\.heigit\.org\/geocode\/search\?/);
  assert.match(wywolania[0].url, /text=Testowa\+7%2C\+Miasto/);
  assert.match(wywolania[0].url, /size=2/);
  assert.doesNotMatch(wywolania[0].url, /TESTOWY-KLUCZ/);
  assert.equal(
    wywolania[0].opcje.headers.Authorization,
    "TESTOWY-KLUCZ-NIE-ZAPISYWAC"
  );

  const wynikTrasy = await adapter.wyznaczTrase({
    punktPoczatkowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.0, dlugoscGeograficzna: 16.0 }
    },
    punktDocelowy: {
      wspolrzedne: { szerokoscGeograficzna: 50.1, dlugoscGeograficzna: 16.2 }
    },
    profilPojazdu: {
      dlugoscMetry: 9.5,
      szerokoscMetry: 2.55,
      wysokoscMetry: 3.8,
      naciskOsiTony: 10,
      masaTony: 32
    }
  });
  assert.equal(wynikTrasy.dystansDrogowyMetry, 20000);
  assert.equal(wynikTrasy.czasPrzejazduMinuty, 20);

  const routing = wywolania[1];
  assert.equal(
    routing.url,
    "https://api.heigit.org/v2/directions/driving-hgv"
  );
  assert.equal(routing.opcje.method, "POST");
  const body = JSON.parse(routing.opcje.body);
  assert.deepEqual(body.coordinates, [[16.0, 50.0], [16.2, 50.1]]);
  assert.deepEqual(body.options.profile_params.restrictions, {
    length: 9.5,
    width: 2.55,
    height: 3.8,
    axleload: 10,
    weight: 32
  });
}

async function sprawdzMostDoBiezacejBramy() {
  const mod = uruchomAdapter();
  const adapter = mod.utworzNeutralnyAdapter({
    geokoduj: function () {
      return { kandydaci: [] };
    },
    wyznaczTrase: function (zapytanie) {
      const start = zapytanie.punktPoczatkowy.wspolrzedne;
      const czyStartWezla = start.dlugoscGeograficzna === 16.0;
      return {
        dystansDrogowyMetry: czyStartWezla ? 20000 : 21000,
        czasPrzejazduMinuty: czyStartWezla ? 20 : 21
      };
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

  assert.deepEqual(JSON.parse(JSON.stringify(wynik)), {
    status: "ok",
    czasDojazduMinuty: 20,
    czasPowrotuMinuty: 21,
    dystansDojazduMetry: 20000,
    dystansPowrotuMetry: 21000,
    zrodlo: "mapa"
  });
}

function sprawdzGraniceArchitektury() {
  const index = wczytaj("index.html");
  const lokalizacje = wczytaj("js/lokalizacje/lokalizacje.js");
  const harmonogram = fs.readdirSync(path.join(katalogProjektu, "js/harmonogram"))
    .filter(function (nazwa) { return nazwa.endsWith(".js"); })
    .map(function (nazwa) { return wczytaj(path.join("js/harmonogram", nazwa)); })
    .join("\n");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(index, /js\/lokalizacje\/adapter_uslug_mapowych\.js/);
  assert.match(lokalizacje, /pobierzTraseDlaBudowy/);
  assert.match(lokalizacje, /lokalizacjaBudowy:\s*budowa\.modelLokalizacji/);
  assert.doesNotMatch(
    harmonogram,
    /openrouteservice|api\.heigit\.org|driving-hgv|Authorization/i,
    "Silnik harmonogramu nie może znać szczegółów dostawcy map."
  );
  assert.match(etapy, /- \[x\] \*\*6E\.2 — neutralny adapter:/);
  assert.match(etapy, /- \[ \] \*\*6E\.3 — bezpieczne błędy:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6E\.3/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6E\.2/);
  assert.match(stan, /109\/109 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6E\.3 — bezpieczne błędy/);
  assert.match(decyzje, /## 131\. Neutralny adapter jest granicą dostawcy map/);
  assert.match(kontrakt, /## Neutralny adapter usług mapowych — 6E\.2/);
  assert.match(plan, /### 6E\.2 — neutralny adapter/);
}

(async function () {
  await sprawdzNeutralnyKontrakt();
  await sprawdzImplementacjeOpenrouteservice();
  await sprawdzMostDoBiezacejBramy();
  sprawdzGraniceArchitektury();
  console.log(
    "OK — 6E.2 udostępnia wymienny kontrakt geokodowania i routingu oraz izoluje openrouteservice od silnika harmonogramu."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
