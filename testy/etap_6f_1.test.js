"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAplikacje() {
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

function utworzBudowe(idBudowy, adres) {
  return {
    idBudowy: idBudowy,
    firma: "Firma Testowa",
    budowa: "Obiekt " + idBudowy,
    zrodlo: "csv",
    adresZrodlowy: adres || null
  };
}

function pelnyAdres() {
  return {
    tekst: "ul. Próbna 12, Miasto Testowe",
    czesci: {
      ulica: "Próbna",
      numerBudynku: "12",
      miejscowosc: "Miasto Testowe"
    }
  };
}

function kandydat(numer, szerokosc, dlugosc) {
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
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    },
    statusJakosci: "nieoceniona",
    zrodlo: "mapa"
  };
}

async function sprawdzAdresNiewystarczajacy() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-601", null);
  let liczbaWywolan = 0;

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(1, 50.1, 16.2)] };
      }
    }
  );

  assert.equal(wynik.status, "adres-niewystarczajacy-do-geokodowania");
  assert.equal(wynik.czyWywolanoInternet, false);
  assert.equal(liczbaWywolan, 0);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.statusJakosci,
    "niewystarczajaca"
  );
}

async function sprawdzJednaLokalizacjeIZapisAutomatyczny() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-602", pelnyAdres());
  const zapytania = [];
  const adapter = {
    geokoduj: function (zapytanie) {
      zapytania.push(zapytanie);
      return {
        status: "ok",
        kandydaci: [kandydat(7, 50.8123, 16.2921)]
      };
    }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    adapter
  );

  assert.equal(wynik.status, "znaleziono-jedna-lokalizacje");
  assert.equal(wynik.czyWywolanoInternet, true);
  assert.equal(wynik.czyWymagaPotwierdzenia, true);
  assert.equal(zapytania.length, 1);
  assert.equal(zapytania[0].tekstAdresu, "ul. Próbna 12, Miasto Testowe");
  assert.equal(zapytania[0].limitWynikow, 5);

  const automatyczna = budowa.modelLokalizacji.daneAutomatyczne;
  const robocza = budowa.modelLokalizacji.daneRobocze;
  assert.equal(automatyczna.zrodlo, "mapa");
  assert.equal(automatyczna.czyKorektaReczna, false);
  assert.equal(automatyczna.wspolrzedne.szerokoscGeograficzna, 50.8123);
  assert.equal(automatyczna.wspolrzedne.dlugoscGeograficzna, 16.2921);
  assert.equal(robocza.wspolrzedne, null);
  assert.equal(robocza.statusJakosci, "pelna");

  const wynikPowtorny = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    adapter
  );
  assert.equal(wynikPowtorny.status, "uzyto-zapisanego-wyniku-geokodowania");
  assert.equal(wynikPowtorny.czyWywolanoInternet, false);
  assert.equal(zapytania.length, 1);
}

async function sprawdzWieleWynikowBezCichegoWyboru() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-603", pelnyAdres());
  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        return {
          status: "ok",
          kandydaci: [
            kandydat(1, 50.1, 16.1),
            kandydat(2, 50.2, 16.2)
          ]
        };
      }
    }
  );

  assert.equal(wynik.status, "niejednoznaczna");
  assert.equal(wynik.kandydaci.length, 2);
  assert.equal(wynik.czyWymagaPotwierdzenia, true);
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.statusJakosci, "niejednoznaczna");
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.zrodlo, "mapa");
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.wspolrzedne, null);
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne, null);
}

async function sprawdzBrakWynikuIBladUslugi() {
  const aplikacja = uruchomAplikacje();
  const budowaBrak = utworzBudowe("B-604", pelnyAdres());
  const brak = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowaBrak,
    { geokoduj: function () { return { status: "brak-wynikow", kandydaci: [] }; } }
  );

  assert.equal(brak.status, "nieznaleziona");
  assert.equal(budowaBrak.modelLokalizacji.daneAutomatyczne.statusJakosci, "nieznaleziona");
  assert.equal(budowaBrak.modelLokalizacji.daneRobocze.statusJakosci, "pelna");

  const budowaTimeout = utworzBudowe("B-605", pelnyAdres());
  const timeout = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowaTimeout,
    {
      geokoduj: function () {
        return {
          status: "timeout",
          kandydaci: [],
          komunikatOperatora: "Timeout testowy",
          czyPonowicPozniej: true
        };
      }
    }
  );

  assert.equal(timeout.status, "timeout");
  assert.equal(timeout.czyPonowicPozniej, true);
  assert.equal(timeout.czyWywolanoInternet, true);
  assert.equal(budowaTimeout.modelLokalizacji.daneAutomatyczne.zrodlo, "brak");
}

async function sprawdzCachePrzedInternetem() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-606", pelnyAdres());
  let liczbaWywolan = 0;

  aplikacja.pamiecTras = {
    pobierzTrase: function () {
      return {
        status: "znaleziono",
        trasa: {
          rodzajKluczaLokalizacji: "wspolrzedne",
          adresLokalizacji: {
            tekst: "ul. Zapamiętana 4, Miasto Testowe",
            czesci: {}
          },
          wspolrzedneLokalizacji: {
            szerokoscGeograficzna: 50.777,
            dlugoscGeograficzna: 16.333
          }
        }
      };
    },
    wyszukajTrasy: function () { return { trasy: [] }; }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(1, 51, 17)] };
      }
    }
  );

  assert.equal(wynik.status, "uzyto-pamieci-lokalizacji");
  assert.equal(wynik.czyWywolanoInternet, false);
  assert.equal(liczbaWywolan, 0);
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "pamiec");
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.wspolrzedne.szerokoscGeograficzna,
    50.777
  );
}

async function sprawdzLokalnePodpowiedziPrzedInternetem() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-607", pelnyAdres());
  let liczbaWywolan = 0;

  aplikacja.pamiecTras = {
    pobierzTrase: function () { return { status: "brak", trasa: null }; },
    wyszukajTrasy: function () {
      return {
        trasy: [{
          klucz: "test",
          wspolrzedneLokalizacji: {
            szerokoscGeograficzna: 50.7,
            dlugoscGeograficzna: 16.4
          }
        }]
      };
    }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(1, 51, 17)] };
      }
    }
  );

  assert.equal(wynik.status, "wymagany-wybor-z-pamieci");
  assert.equal(wynik.liczbaPodpowiedzi, 1);
  assert.equal(wynik.czyWywolanoInternet, false);
  assert.equal(liczbaWywolan, 0);
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const readme = wczytaj("README.md");

  assert.match(etapy, /- \[x\] \*\*6F\.1 — wyszukiwanie lokalizacji:/);
  assert.match(decyzje, /## 133\. Wynik geokodowania jest podpowiedzią automatyczną/);
  assert.match(kontrakt, /## Wyszukiwanie lokalizacji — 6F\.1/);
  assert.match(planTestow, /### 6F\.1 — wyszukiwanie lokalizacji/);
  assert.match(readme, /warstwie automatycznej[\s\S]*wymaga potwierdzenia/i);
}

(async function () {
  await sprawdzAdresNiewystarczajacy();
  await sprawdzJednaLokalizacjeIZapisAutomatyczny();
  await sprawdzWieleWynikowBezCichegoWyboru();
  await sprawdzBrakWynikuIBladUslugi();
  await sprawdzCachePrzedInternetem();
  await sprawdzLokalnePodpowiedziPrzedInternetem();
  sprawdzDokumentacje();
  console.log(
    "OK — 6F.1 wyszukuje tylko wystarczające adresy, używa cache przed internetem i zapisuje wynik jako automatyczną podpowiedź."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
