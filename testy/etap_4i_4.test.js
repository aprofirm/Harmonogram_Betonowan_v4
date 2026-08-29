"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzSrodowisko() {
  const elementy = {
    "tryb-pomp": { value: "mam-okreslona-liczbe" },
    "minimalna-liczba-pomp": { textContent: "—" },
    "liczba-dostepnych-pomp-wynik": { textContent: "—" },
    "podsumowanie-dostepnosci-pomp": { textContent: "" }
  };
  const interfejs = {
    pokazWynik: function () {},
    oznaczWynikJakoNieaktualny: function () {},
    pokazPrzywroconyPlan: function () {},
    wyczyscPlan: function () {}
  };
  const zakresOkna = {
    HarmonogramBetonowan: {
      interfejs: interfejs,
      pompy: {
        obliczMinimalnaLiczbePomp: function () {
          return { minimalnaLiczbaPomp: 0 };
        }
      }
    }
  };
  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    document: {
      getElementById: function (id) {
        return elementy[id] || null;
      },
      querySelector: function () {
        return null;
      }
    }
  };

  vm.createContext(kontekst);
  new vm.Script(wczytaj("js/interfejs/minimalna_liczba_pomp.js"), {
    filename: "js/interfejs/minimalna_liczba_pomp.js"
  }).runInContext(kontekst);

  return zakresOkna.HarmonogramBetonowan.interfejs;
}

function okres(start, betonStart, betonKoniec, koniec) {
  return {
    minutaRozpoczeciaZajetosci: start,
    minutaRozpoczeciaBetonowania: betonStart,
    minutaZakonczeniaBetonowania: betonKoniec,
    minutaZakonczeniaZajetosci: koniec
  };
}

function przygotujWynik() {
  return {
    trybPomp: "mam-okreslona-liczbe",
    budowy: [
      { idBudowy: "B", budowa: "Hala B" },
      { idBudowy: "C", budowa: "Hala C" },
      { idBudowy: "D", budowa: "Hala D" }
    ],
    pompy: {
      status: "obliczono",
      trybPomp: "mam-okreslona-liczbe",
      wynikiBudow: [
        {
          idBudowy: "B",
          budowa: { idBudowy: "B", budowa: "Hala B" },
          statusPrzydzialuPompy: "przydzielona",
          przydzialPompy: {
            idPompy: "P-1",
            nazwaPompy: "Pompa 1",
            przejazdZPoprzedniejBudowy: {
              idBudowyZrodlowej: "A",
              idBudowyDocelowej: "B",
              czasPrzejazduMinuty: 15,
              minutaWyjazduZBudowy: 530,
              minutaPrzyjazduNaBudowe: 545
            }
          },
          okresZajetosci: okres(520, 540, 600, 630),
          rzeczywistyOkresZajetosci: okres(545, 565, 625, 655),
          opoznienieZPowoduPompMinuty: 25,
          jawnySkutekPompy: {
            status: "przesunieta",
            przesuniecieStartuMinuty: 25,
            minutaMozliwegoStartuBetonowania: 565,
            przyczyna: "przejazd-miedzy-budowami",
            przyczynyOgraniczenia: [
              {
                rodzaj: "przejazd-miedzy-budowami",
                idPoprzedniejBudowy: "A",
                czasPrzejazduMinuty: 15,
                minutaPrzyjazduNaBudowe: 545
              }
            ],
            powodyOdrzuceniaPomp: []
          }
        },
        {
          idBudowy: "C",
          budowa: { idBudowy: "C", budowa: "Hala C" },
          statusPrzydzialuPompy: "brak-pasujacej-pompy",
          przydzialPompy: null,
          okresZajetosci: okres(600, 620, 660, 690),
          rzeczywistyOkresZajetosci: null,
          opoznienieZPowoduPompMinuty: null,
          powodBrakuPrzydzialu: "brak-mozliwego-kandydata",
          probyKandydatow: [
            {
              idPompy: "P-1",
              czyPasuje: false,
              powodOdrzucenia: "niewystarczajacy-wysieg",
              wysiegPompyMetry: 32,
              wymaganyWysiegPompyMetry: 42
            },
            {
              idPompy: "P-2",
              czyPasuje: false,
              powodOdrzucenia: "po-dostepnosci",
              dostepnosc: { dostepnaDoMinuta: 600 }
            }
          ],
          jawnySkutekPompy: {
            status: "bez-przydzialu",
            przyczyna: "brak-mozliwego-kandydata",
            przesuniecieStartuMinuty: null,
            minutaMozliwegoStartuBetonowania: null,
            przyczynyOgraniczenia: [],
            powodyOdrzuceniaPomp: [
              "niewystarczajacy-wysieg",
              "po-dostepnosci"
            ]
          }
        },
        {
          idBudowy: "D",
          budowa: { idBudowy: "D", budowa: "Hala D" },
          statusPrzydzialuPompy: "brak-pasujacej-pompy",
          przydzialPompy: null,
          okresZajetosci: okres(700, 720, 760, 790),
          rzeczywistyOkresZajetosci: null,
          opoznienieZPowoduPompMinuty: null,
          powodBrakuPrzydzialu: "brak-dostepnych-pomp",
          probyKandydatow: [],
          jawnySkutekPompy: {
            status: "bez-przydzialu",
            przyczyna: "brak-dostepnych-pomp",
            przesuniecieStartuMinuty: null,
            minutaMozliwegoStartuBetonowania: null,
            przyczynyOgraniczenia: [],
            powodyOdrzuceniaPomp: ["brak-dostepnych-pomp"]
          }
        }
      ]
    }
  };
}

function sprawdzKomunikatPrzesuniecia() {
  const interfejs = utworzSrodowisko();
  const komunikaty = interfejs.przygotujKomunikatyPomp(przygotujWynik());
  const komunikat = komunikaty.find(function (pozycja) {
    return pozycja.idBudowy === "B";
  });

  assert.ok(komunikat);
  assert.equal(komunikat.rodzaj, "ostrzezenie");
  assert.match(komunikat.tekst, /\+25 min/);
  assert.match(komunikat.tekst, /najwcześniej 09:25/);
  assert.match(komunikat.tekst, /przejazd z budowy A \(15 min\)/);
}

function sprawdzNiezgodnyParametrINiedostepnosc() {
  const interfejs = utworzSrodowisko();
  const komunikaty = interfejs.przygotujKomunikatyPomp(przygotujWynik());
  const komunikat = komunikaty.find(function (pozycja) {
    return pozycja.idBudowy === "C";
  });

  assert.ok(komunikat);
  assert.equal(komunikat.rodzaj, "blad");
  assert.match(komunikat.tekst, /za mały wysięg: 32 m \(wymagane 42 m\)/);
  assert.match(komunikat.tekst, /pompa niedostępna o tej godzinie/);
  assert.match(komunikat.tekst, /dostępna do 10:00/);
}

function sprawdzBrakPompy() {
  const interfejs = utworzSrodowisko();
  const komunikaty = interfejs.przygotujKomunikatyPomp(przygotujWynik());
  const komunikat = komunikaty.find(function (pozycja) {
    return pozycja.idBudowy === "D";
  });

  assert.ok(komunikat);
  assert.match(komunikat.tekst, /brak dostępnej aktywnej pompy/);
}

function sprawdzTabeleIKraniceEtapu() {
  const interfejs = utworzSrodowisko();
  const wynik = przygotujWynik();
  const tabela = interfejs.przygotujDaneTabeliPomp(wynik);
  const techniczny = interfejs.przygotujKomunikatyPomp({
    pompy: {
      status: "obliczono",
      trybPomp: "oblicz-potrzebne",
      wynikiBudow: []
    }
  });
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");

  assert.match(tabela.wiersze[0].komunikat, /\+25 min/);
  assert.match(tabela.wiersze[1].komunikat, /za mały wysięg/);
  assert.equal(techniczny.length, 0);
  assert.match(kod, /notka-pompy/);
  assert.match(kod, /"Komunikat"/);
  assert.match(konfiguracja, /punktEtapu:\s*"4I\.[4-9]"/);
  assert.doesNotMatch(kod, /startRoboczy\s*=/);
}

sprawdzKomunikatPrzesuniecia();
sprawdzNiezgodnyParametrINiedostepnosc();
sprawdzBrakPompy();
sprawdzTabeleIKraniceEtapu();

console.log("OK — 4I.4 pokazuje dokładne komunikaty pomp bez sprzęgania z gruszkami.");
