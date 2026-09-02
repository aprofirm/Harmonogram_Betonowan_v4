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
    window: {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      HarmonogramBetonowan: {}
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

function uruchomLokalizacje() {
  const sandbox = { window: {}, console: console, Promise: Promise };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    vm.runInContext(wczytaj(sciezka), sandbox, { filename: sciezka });
  });
  return sandbox.window.HarmonogramBetonowan;
}

function uruchomInterfejsLokalizacji() {
  const sandbox = { window: {}, console: console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/interfejs/kandydaci_lokalizacji.js"),
    sandbox,
    { filename: "kandydaci_lokalizacji.js" }
  );
  return sandbox.window.HarmonogramBetonowan.interfejsLokalizacji;
}

function kandydat(numer, pewnosc, typWyniku) {
  return {
    adres: {
      tekst: "ul. Wynikowa " + numer + ", Miasto Testowe",
      czesci: {
        ulica: "Wynikowa",
        numerBudynku: String(numer),
        miejscowosc: "Miasto Testowe"
      }
    },
    wspolrzedne: {
      szerokoscGeograficzna: 50 + numer / 100,
      dlugoscGeograficzna: 16 + numer / 100
    },
    statusJakosci: "nieoceniona",
    zrodlo: "mapa",
    pewnosc: pewnosc,
    typWyniku: typWyniku
  };
}

async function sprawdzNeutralnePoziomyPewnosci() {
  const mod = uruchomAdapter();
  const adapter = mod.utworzNeutralnyAdapter({
    geokoduj: function () {
      return {
        kandydaci: [
          kandydat(1, 0.91, "address"),
          kandydat(2, 0.64, "street"),
          kandydat(3, 0.31, "locality"),
          kandydat(4, null, "region")
        ]
      };
    },
    wyznaczTrase: function () {
      return { dystansDrogowyMetry: 1, czasPrzejazduMinuty: 1 };
    }
  });

  const wynik = await adapter.geokoduj({
    tekstAdresu: "ul. Próbna 12, Miasto Testowe",
    limitWynikow: 5
  });

  assert.equal(wynik.status, "ok");
  assert.deepEqual(
    Array.from(wynik.kandydaci, function (element) {
      return element.poziomPewnosci;
    }),
    ["wysoka", "srednia", "niska", "brak-oceny"]
  );
  assert.equal(wynik.kandydaci[0].pewnosc, 0.91);
  assert.equal(wynik.kandydaci[0].typWyniku, "address");
  assert.equal(wynik.kandydaci[3].pewnosc, null);
}

async function sprawdzMapowanieOpenrouteservice() {
  const mod = uruchomAdapter();
  const adapter = mod.utworzAdapterOpenrouteservice({
    kluczApi: "TEST",
    wykonajZapytanie: function (url) {
      assert.match(String(url), /\/geocode\/search\?/);
      return {
        features: [{
          geometry: { coordinates: [16.2921, 50.8123] },
          properties: {
            label: "ul. Wynikowa 7, Miasto Testowe",
            street: "Wynikowa",
            housenumber: "7",
            locality: "Miasto Testowe",
            confidence: 0.87,
            layer: "address"
          }
        }]
      };
    }
  });

  const wynik = await adapter.geokoduj({
    tekstAdresu: "ul. Wynikowa 7, Miasto Testowe",
    limitWynikow: 5
  });

  assert.equal(wynik.kandydaci.length, 1);
  assert.equal(wynik.kandydaci[0].pewnosc, 0.87);
  assert.equal(wynik.kandydaci[0].poziomPewnosci, "wysoka");
  assert.equal(wynik.kandydaci[0].typWyniku, "address");
}

async function sprawdzBrakCichegoWyboru() {
  const aplikacja = uruchomLokalizacje();
  const budowa = {
    idBudowy: "B-620",
    firma: "Firma Testowa",
    budowa: "Obiekt B-620",
    zrodlo: "csv",
    adresZrodlowy: {
      tekst: "ul. Próbna 12, Miasto Testowe",
      czesci: {
        ulica: "Próbna",
        numerBudynku: "12",
        miejscowosc: "Miasto Testowe"
      }
    }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        return {
          status: "ok",
          kandydaci: [
            kandydat(1, 0.94, "address"),
            kandydat(2, 0.72, "address"),
            kandydat(3, 0.41, "street")
          ]
        };
      }
    }
  );

  assert.equal(wynik.status, "niejednoznaczna");
  assert.equal(wynik.liczbaKandydatow, 3);
  assert.equal(wynik.wybranyIndeksKandydata, null);
  assert.deepEqual(
    Array.from(wynik.kandydaci, function (element) {
      return element.indeksKandydata;
    }),
    [0, 1, 2]
  );
  assert.deepEqual(
    Array.from(wynik.kandydaci, function (element) {
      return element.poziomPewnosci;
    }),
    ["wysoka", "srednia", "niska"]
  );
  assert.equal(
    budowa.modelLokalizacji.daneAutomatyczne.statusJakosci,
    "niejednoznaczna"
  );
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.wspolrzedne, null);
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne, null);
}

function sprawdzPrezentacjeKandydatow() {
  const interfejs = uruchomInterfejsLokalizacji();
  const lista = interfejs.przygotujListeKandydatow([
    Object.assign(kandydat(1, 0.91, "address"), {
      indeksKandydata: 0,
      poziomPewnosci: "wysoka"
    }),
    Object.assign(kandydat(2, null, "region"), {
      indeksKandydata: 1,
      poziomPewnosci: "brak-oceny"
    })
  ]);

  assert.equal(lista.length, 2);
  assert.equal(lista[0].numer, 1);
  assert.equal(lista[0].adresTekst, "ul. Wynikowa 1, Miasto Testowe");
  assert.equal(lista[0].etykietaPewnosci, "Wysoka · 91%");
  assert.equal(lista[0].typWyniku, "Adres");
  assert.match(lista[0].wspolrzedneTekst, /^50\.010000, 16\.010000$/);
  assert.equal(lista[1].etykietaPewnosci, "Brak oceny dostawcy");
  assert.equal(lista[1].typWyniku, "Region");
}

function sprawdzInterfejsBezWyboru() {
  const index = wczytaj("index.html");
  const skrypt = wczytaj("js/interfejs/kandydaci_lokalizacji.js");
  const css = wczytaj("style/glowny.css");

  assert.match(index, /id="okno-kandydatow-lokalizacji"/);
  assert.match(index, /id="lista-kandydatow-lokalizacji"/);
  assert.match(index, /js\/interfejs\/kandydaci_lokalizacji\.js/);
  assert.match(skrypt, /Żaden wynik nie zostanie zastosowany bez świadomego wyboru/);
  assert.doesNotMatch(skrypt, /zastosujWybran|zatwierdzKandydat/);
  assert.match(css, /\.kandydat-lokalizacji__pewnosc/);
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const readme = wczytaj("README.md");

  assert.match(etapy, /- \[ \] \*\*6F —/);
  assert.match(etapy, /- \[x\] \*\*6F\.2 — wiele wyników:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6F\.3/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6F\.2/);
  assert.match(stan, /112\/112 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6F\.3 — ręczne wskazanie/);
  assert.match(decyzje, /## 134\. Pewność geokodowania jest wskazówką, nie decyzją/);
  assert.match(kontrakt, /## Kandydaci geokodowania — 6F\.2/);
  assert.match(plan, /### 6F\.2 — wiele wyników/);
  assert.match(readme, /poziom pewności[\s\S]*nie wybiera/i);
}

(async function () {
  await sprawdzNeutralnePoziomyPewnosci();
  await sprawdzMapowanieOpenrouteservice();
  await sprawdzBrakCichegoWyboru();
  sprawdzPrezentacjeKandydatow();
  sprawdzInterfejsBezWyboru();
  sprawdzDokumentacje();
  console.log(
    "OK — 6F.2 pokazuje wiele kandydatów z poziomem pewności i nie wybiera żadnego bez decyzji operatora."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
