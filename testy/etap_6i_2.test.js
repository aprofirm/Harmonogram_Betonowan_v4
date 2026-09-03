"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomModul(opcje) {
  const ustawienia = opcje || {};
  const wywolaniaPodstawowe = [];
  const przywrocenia = [];
  const budowaZrodlowa = {
    idBudowy: "A",
    budowa: "Budowa A",
    czasDojazduRoboczyMinuty: 35,
    czasPowrotuRoboczyMinuty: 40,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  };
  const pustaFunkcja = function () {};
  const sandbox = {
    window: {
      HarmonogramBetonowan: {
        lokalizacje: {
          zmienCzasRoboczyBudowy: function (budowa, nazwaPola, wartosc) {
            wywolaniaPodstawowe.push({
              budowa: budowa,
              nazwaPola: nazwaPola,
              wartosc: wartosc
            });
            budowa[nazwaPola] = wartosc;
            return budowa;
          },
          przywrocAutomatycznaTraseBudowy: function (budowa, kierunek) {
            przywrocenia.push({ budowa: budowa, kierunek: kierunek });

            if (ustawienia.brakAutomatu) {
              return {
                status: "brak-wartosci-automatycznej",
                czyPrzywrocono: false
              };
            }

            if (kierunek === "do-budowy") {
              budowa.czasDojazduRoboczyMinuty = 21;
              budowa.zrodloCzasuDojazdu = "mapa";
            } else {
              budowa.czasPowrotuRoboczyMinuty = 24;
              budowa.zrodloCzasuPowrotu = "mapa";
            }

            return {
              status: "przywrocono-wartosc-automatyczna",
              czyPrzywrocono: true,
              kierunki: [kierunek]
            };
          },
          pobierzStanWartosciTrasyBudowy: function () {
            return {
              doBudowy: {
                kierunek: "do-budowy",
                czasRoboczyMinuty: 35,
                zrodloRobocze: "reczny",
                czyKorektaReczna: true,
                czasAutomatycznyMinuty: 21,
                dystansAutomatycznyMetry: 14000,
                zrodloAutomatyczne: "mapa",
                czyMaWartoscAutomatyczna: true,
                czyMoznaPrzywrocicAutomatyczna: true
              },
              doWezla: {
                kierunek: "do-wezla",
                czasRoboczyMinuty: 40,
                zrodloRobocze: "reczny",
                czyKorektaReczna: true,
                czasAutomatycznyMinuty: 24,
                dystansAutomatycznyMetry: 15000,
                zrodloAutomatyczne: "mapa",
                czyMaWartoscAutomatyczna: true,
                czyMoznaPrzywrocicAutomatyczna: true
              }
            };
          }
        },
        interfejs: {
          uruchomInterfejs: pustaFunkcja,
          pokazListeBudow: pustaFunkcja,
          pokazWynik: pustaFunkcja,
          pokazPrzywroconyPlan: pustaFunkcja,
          pokazUdanyImport: pustaFunkcja,
          pokazDodanaBudowe: pustaFunkcja,
          wyczyscPlan: pustaFunkcja
        }
      }
    }
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/interfejs/wynik_trasy_budowy.js"),
    sandbox,
    { filename: "js/interfejs/wynik_trasy_budowy.js" }
  );

  const aplikacja = sandbox.window.HarmonogramBetonowan;
  const wywolaniaHandlera = [];

  aplikacja.interfejs.uruchomInterfejs(
    {},
    pustaFunkcja,
    pustaFunkcja,
    pustaFunkcja,
    function (idBudowy, nazwaPola, wartosc) {
      wywolaniaHandlera.push({
        idBudowy: idBudowy,
        nazwaPola: nazwaPola,
        wartosc: wartosc
      });
      assert.equal(idBudowy, budowaZrodlowa.idBudowy);
      return aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
        budowaZrodlowa,
        nazwaPola,
        wartosc
      );
    }
  );

  return {
    aplikacja: aplikacja,
    budowaZrodlowa: budowaZrodlowa,
    wywolaniaPodstawowe: wywolaniaPodstawowe,
    przywrocenia: przywrocenia,
    wywolaniaHandlera: wywolaniaHandlera
  };
}

function sprawdzPrzywrocenieDojazdu() {
  const srodowisko = uruchomModul();

  const wynik = srodowisko.aplikacja.interfejs.przywrocAutomatTrasyBudowy(
    { idBudowy: "A", budowa: "Budowa A" },
    "do-budowy"
  );

  assert.equal(wynik.idBudowy, "A");
  assert.equal(srodowisko.wywolaniaHandlera.length, 1);
  assert.equal(
    srodowisko.wywolaniaHandlera[0].nazwaPola,
    "czasDojazduRoboczyMinuty"
  );
  assert.equal(
    srodowisko.wywolaniaHandlera[0].wartosc.typPolecenia,
    "przywroc-automatyczna-trase-budowy"
  );
  assert.equal(srodowisko.wywolaniaHandlera[0].wartosc.kierunek, "do-budowy");
  assert.equal(srodowisko.przywrocenia.length, 1);
  assert.equal(srodowisko.przywrocenia[0].kierunek, "do-budowy");
  assert.equal(srodowisko.wywolaniaPodstawowe.length, 0);
  assert.equal(srodowisko.budowaZrodlowa.czasDojazduRoboczyMinuty, 21);
  assert.equal(srodowisko.budowaZrodlowa.zrodloCzasuDojazdu, "mapa");
  assert.equal(srodowisko.budowaZrodlowa.czasPowrotuRoboczyMinuty, 40);
  assert.equal(srodowisko.budowaZrodlowa.zrodloCzasuPowrotu, "reczny");
}

function sprawdzPrzywroceniePowrotu() {
  const srodowisko = uruchomModul();

  srodowisko.aplikacja.interfejs.przywrocAutomatTrasyBudowy(
    { idBudowy: "A", budowa: "Budowa A" },
    "do-wezla"
  );

  assert.equal(
    srodowisko.wywolaniaHandlera[0].nazwaPola,
    "czasPowrotuRoboczyMinuty"
  );
  assert.equal(srodowisko.przywrocenia[0].kierunek, "do-wezla");
  assert.equal(srodowisko.budowaZrodlowa.czasDojazduRoboczyMinuty, 35);
  assert.equal(srodowisko.budowaZrodlowa.zrodloCzasuDojazdu, "reczny");
  assert.equal(srodowisko.budowaZrodlowa.czasPowrotuRoboczyMinuty, 24);
  assert.equal(srodowisko.budowaZrodlowa.zrodloCzasuPowrotu, "mapa");
}

function sprawdzZwyklaZmianaNadalDeleguje() {
  const srodowisko = uruchomModul();
  const budowa = { idBudowy: "X" };

  srodowisko.aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
    budowa,
    "dodatkowyCzasZaladunkuMinuty",
    7
  );

  assert.equal(srodowisko.wywolaniaPodstawowe.length, 1);
  assert.equal(
    srodowisko.wywolaniaPodstawowe[0].nazwaPola,
    "dodatkowyCzasZaladunkuMinuty"
  );
  assert.equal(budowa.dodatkowyCzasZaladunkuMinuty, 7);
}

function sprawdzOdrzucenieNiespojnegoPolecenia() {
  const srodowisko = uruchomModul();
  const polecenie =
    srodowisko.aplikacja.lokalizacje.utworzPoleceniePrzywroceniaAutomatu(
      "do-budowy"
    );

  assert.throws(function () {
    srodowisko.aplikacja.lokalizacje.zmienCzasRoboczyBudowy(
      srodowisko.budowaZrodlowa,
      "czasPowrotuRoboczyMinuty",
      polecenie
    );
  }, /nie odpowiada kierunkowi/);
}

function sprawdzBrakAutomatuNieNadpisujeRoboczej() {
  const srodowisko = uruchomModul({ brakAutomatu: true });

  assert.throws(function () {
    srodowisko.aplikacja.interfejs.przywrocAutomatTrasyBudowy(
      { idBudowy: "A", budowa: "Budowa A" },
      "do-budowy"
    );
  }, /Brak automatycznej wartości trasy/);

  assert.equal(srodowisko.budowaZrodlowa.czasDojazduRoboczyMinuty, 35);
  assert.equal(srodowisko.budowaZrodlowa.zrodloCzasuDojazdu, "reczny");
  assert.equal(srodowisko.wywolaniaPodstawowe.length, 0);
}

function sprawdzGraniceEtapu() {
  const kod = wczytaj("js/interfejs/wynik_trasy_budowy.js");
  const aplikacja = wczytaj("js/aplikacja.js");
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");
  const index = wczytaj("index.html");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(kod, /Użyj automatu/);
  assert.match(kod, /przywrocAutomatycznaTraseBudowy/);
  assert.match(kod, /utworzPoleceniePrzywroceniaAutomatu/);
  assert.match(kod, /argumenty\[4\]/);
  assert.doesNotMatch(kod, /localStorage|sessionStorage/);
  assert.doesNotMatch(kod, /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization/i);

  const poczatekHandlera = aplikacja.indexOf("function obsluzZmianeCzasowBudowy");
  const koniecHandlera = aplikacja.indexOf(
    "function obsluzZmianePrzejazduPompy",
    poczatekHandlera
  );
  const handler = aplikacja.slice(poczatekHandlera, koniecHandlera);

  assert.match(handler, /zapiszCzasyBudowyWPamieci/);
  assert.match(handler, /oznaczPlanJakoNieprzeliczony\(true\)/);
  assert.match(handler, /pokazListeBudow/);
  assert.match(aplikacja, /"modelTrasyDojazdu"/);
  assert.match(aplikacja, /"modelTrasyPowrotu"/);
  assert.doesNotMatch(
    harmonogram,
    /przywroc-automatyczna-trase-budowy|przywrocAutomatycznaTraseBudowy/
  );
  assert.match(index, /js\/interfejs\/wynik_trasy_budowy\.js/);
  assert.ok(
    index.indexOf("js/interfejs/wynik_trasy_budowy.js") <
      index.indexOf("js/aplikacja.js")
  );
  assert.match(stan, /6I\.2 dodaje przy danym kierunku przycisk \*\*Użyj automatu\*\*/);
  assert.match(stan, /Centralny harmonogram nie zna polecenia interfejsu/);
}

sprawdzPrzywrocenieDojazdu();
sprawdzPrzywroceniePowrotu();
sprawdzZwyklaZmianaNadalDeleguje();
sprawdzOdrzucenieNiespojnegoPolecenia();
sprawdzBrakAutomatuNieNadpisujeRoboczej();
sprawdzGraniceEtapu();

console.log(
  "OK — 6I.2 pozwala świadomie przywrócić automat osobno dla dojazdu lub powrotu i korzysta z istniejącej ścieżki unieważnienia oraz zapisu planu."
);