"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
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

function utworzBudowe(id) {
  return {
    idBudowy: id,
    firma: "Firma Testowa",
    budowa: "Obiekt " + id,
    zrodlo: "csv",
    adresZrodlowy: {
      tekst: "ul. Źródłowa 12, Miasto Testowe",
      czesci: {
        ulica: "Źródłowa",
        numerBudynku: "12",
        miejscowosc: "Miasto Testowe"
      }
    }
  };
}

function kandydat(numer) {
  return {
    indeksKandydata: numer - 1,
    adres: { tekst: "ul. Kandydacka " + numer + ", Miasto Testowe" },
    wspolrzedne: {
      szerokoscGeograficzna: 50 + numer / 100,
      dlugoscGeograficzna: 16 + numer / 100
    },
    statusJakosci: "nieoceniona",
    zrodlo: "mapa",
    pewnosc: 0.9 - numer / 10,
    poziomPewnosci: "wysoka",
    typWyniku: "address"
  };
}

function sprawdzJawnyWyborKandydata() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-631");
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  const adresZrodlowyPrzed = JSON.stringify(
    budowa.modelLokalizacji.daneZrodlowe.adres
  );
  const kandydaci = [kandydat(1), kandydat(2)];

  const wynik = aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
    budowa,
    kandydaci,
    1
  );

  assert.equal(wynik.status, "zatwierdzono-kandydata");
  assert.equal(wynik.wybranyIndeksKandydata, 1);
  assert.equal(wynik.czyPotwierdzona, true);
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "mapa");
  assert.equal(budowa.modelLokalizacji.daneRobocze.czyKorektaReczna, true);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Kandydacka 2, Miasto Testowe"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.wspolrzedne.szerokoscGeograficzna,
    50.02
  );
  assert.equal(
    JSON.stringify(budowa.modelLokalizacji.daneZrodlowe.adres),
    adresZrodlowyPrzed
  );

  assert.throws(function () {
    aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(budowa, kandydaci, 9);
  }, /istniejący wynik/);
}

async function sprawdzPotwierdzonaLokalizacjaNieWywolujeInternetu() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-632");
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
    budowa,
    [kandydat(1)],
    0
  );
  let liczbaWywolan = 0;

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(2)] };
      }
    }
  );

  assert.equal(wynik.status, "uzyto-biezacej-lokalizacji");
  assert.equal(wynik.czyWymagaPotwierdzenia, false);
  assert.equal(liczbaWywolan, 0);
}

function sprawdzReczneWspolrzedne() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-633");

  const wynik = aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(
    budowa,
    {
      adres: "ul. Ręczna 7, Miasto Testowe",
      szerokoscGeograficzna: "50.1234",
      dlugoscGeograficzna: "16.5678"
    }
  );

  assert.equal(wynik.status, "zatwierdzono-reczna-lokalizacje");
  assert.equal(wynik.czyPotwierdzona, true);
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "reczny");
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne.dlugoscGeograficzna, 16.5678);

  assert.throws(function () {
    aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(budowa, {
      adres: "ul. Ręczna 7, Miasto Testowe",
      szerokoscGeograficzna: "50.1",
      dlugoscGeograficzna: ""
    });
  }, /jednocześnie szerokości i długości/);
}

function sprawdzKorekteSamegoAdresu() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-634");
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
    budowa,
    [kandydat(1)],
    0
  );

  const wynik = aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(
    budowa,
    { adres: "ul. Poprawiona 19, Miasto Testowe" }
  );

  assert.equal(wynik.status, "zaktualizowano-adres-do-wyszukania");
  assert.equal(wynik.czyPotwierdzona, false);
  assert.equal(wynik.czyMoznaSzukacAutomatycznie, true);
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne, null);
  assert.notEqual(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "reczny");
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Poprawiona 19, Miasto Testowe"
  );
}

function sprawdzInterfejs() {
  const index = wczytaj("index.html");
  const skrypt = wczytaj("js/interfejs/kandydaci_lokalizacji.js");

  assert.match(index, /id="formularz-recznej-lokalizacji"/);
  assert.match(index, /id="reczna-lokalizacja-adres"/);
  assert.match(index, /id="reczna-lokalizacja-szerokosc"/);
  assert.match(index, /id="reczna-lokalizacja-dlugosc"/);
  assert.match(skrypt, /Wybierz tę lokalizację/);
  assert.match(skrypt, /zatwierdzKandydataLokalizacji/);
  assert.match(skrypt, /ustawRecznaLokalizacjeBudowy/);
  assert.match(skrypt, /Poprawiony adres zapisano/);
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(etapy, /- \[x\] \*\*6F —/);
  assert.match(etapy, /- \[x\] \*\*6F\.3 — ręczne wskazanie:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6G\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6F\.3/);
  assert.match(stan, /113\/113 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6G\.1/);
  assert.match(decyzje, /## 135\. Lokalizacja robocza wymaga jawnego zatwierdzenia operatora/);
  assert.match(kontrakt, /## Zatwierdzenie lokalizacji — 6F\.3/);
  assert.match(plan, /### 6F\.3 — ręczne wskazanie/);
}

(async function () {
  sprawdzJawnyWyborKandydata();
  await sprawdzPotwierdzonaLokalizacjaNieWywolujeInternetu();
  sprawdzReczneWspolrzedne();
  sprawdzKorekteSamegoAdresu();
  sprawdzInterfejs();
  sprawdzDokumentacje();
  console.log(
    "OK — 6F.3 pozwala jawnie zatwierdzić kandydata lub ręczną lokalizację i zamyka punkt 6F."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
