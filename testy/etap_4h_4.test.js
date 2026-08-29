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

function utworzElementTestowy(czyFragment) {
  return {
    value: "",
    textContent: "",
    className: "",
    type: "",
    children: [],
    files: [],
    disabled: false,
    required: false,
    hidden: false,
    dataset: {},
    zdarzenia: {},
    czyFragment: Boolean(czyFragment),
    classList: {
      add: function () {},
      remove: function () {}
    },
    addEventListener: function (nazwaZdarzenia, obsluga) {
      this.zdarzenia[nazwaZdarzenia] = obsluga;
    },
    appendChild: function (element) {
      this.children.push(element);
      return element;
    },
    replaceChildren: function () {
      const noweDzieci = [];

      Array.from(arguments).forEach(function (element) {
        if (element && element.czyFragment) {
          element.children.forEach(function (dziecko) {
            noweDzieci.push(dziecko);
          });
        } else if (element) {
          noweDzieci.push(element);
        }
      });

      this.children = noweDzieci;
    },
    setAttribute: function (nazwa, wartosc) {
      this[nazwa] = wartosc;
    },
    click: function () {},
    reset: function () {}
  };
}

function utworzDokumentTestowy() {
  const identyfikatory = [
    "poczatek-dnia",
    "pojemnosc-gruszki",
    "czas-zaladunku",
    "czas-rozladunku",
    "maksymalne-opoznienie",
    "tryb-gruszek",
    "liczba-dostepnych-gruszek",
    "tryb-pomp",
    "liczba-dostepnych-pomp",
    "lista-pomp",
    "podsumowanie-dostepnosci-pomp",
    "przycisk-przelicz",
    "przycisk-wyczysc-plan",
    "sekcja-statusu",
    "tytul-statusu",
    "tresc-statusu",
    "liczba-budow",
    "liczba-kursow",
    "minimalna-liczba-gruszek",
    "liczba-dostepnych-gruszek-wynik",
    "minimalna-liczba-pomp",
    "liczba-dostepnych-pomp-wynik",
    "liczba-konfliktow",
    "wiersze-harmonogramu",
    "wiersze-kursow",
    "pole-pliku-csv",
    "przycisk-wybierz-csv",
    "pole-upuszczania-csv",
    "informacja-o-imporcie",
    "nazwa-pliku-csv",
    "szczegoly-pliku-csv",
    "formularz-budowy-recznej",
    "reczna-firma",
    "reczna-budowa",
    "reczny-start",
    "reczna-ilosc-betonu",
    "przycisk-historia-planow",
    "liczba-zapisow-historycznych",
    "stan-pamieci-planu",
    "liczba-znanych-tras",
    "stan-pamieci-tras",
    "okno-historii-planow",
    "przycisk-zamknij-historie",
    "lista-zapisow-historycznych"
  ];
  const elementy = {};

  identyfikatory.forEach(function (identyfikator) {
    elementy[identyfikator] = utworzElementTestowy(false);
  });
  elementy["okno-historii-planow"].hidden = true;

  return {
    elementy: elementy,
    getElementById: function (identyfikator) {
      return elementy[identyfikator] || null;
    },
    createElement: function () {
      return utworzElementTestowy(false);
    },
    createDocumentFragment: function () {
      return utworzElementTestowy(true);
    }
  };
}

function wczytajPamiecIInterfejs() {
  const dokument = utworzDokumentTestowy();
  const pamiecLokalna = utworzPamiecLokalna();
  const zakresOkna = {
    document: dokument,
    localStorage: pamiecLokalna,
    addEventListener: function () {}
  };
  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    document: dokument,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Error: Error
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/pamiec/pamiec_planu.js",
    "js/interfejs/interfejs.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  const aplikacja = zakresOkna.HarmonogramBetonowan;
  aplikacja.interfejs.uruchomInterfejs(
    aplikacja.konfiguracja.parametryDomyslne,
    function () {},
    function () {},
    function () {},
    function () {},
    function () {},
    function () {},
    function () {},
    function () {},
    function () {},
    function () {}
  );

  return {
    aplikacja: aplikacja,
    dokument: dokument,
    pamiecLokalna: pamiecLokalna
  };
}

function wczytajModulyPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy) {
  return {
    idBudowy: idBudowy,
    firma: "Firma " + idBudowy,
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: "08:00",
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32,
    czasDojazduRoboczyMinuty: 0,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  };
}

function utworzKurs(idBudowy, minutaStartu, minutaKonca) {
  return {
    idKursu: "KURS-" + idBudowy,
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: minutaStartu,
    minutaZakonczeniaRozladunku: minutaKonca
  };
}

function utworzPompe(idPompy, dane) {
  return Object.assign({
    idPompy: idPompy,
    nazwa: idPompy,
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "",
    wysiegMetry: 32
  }, dane || {});
}

function pobierzPrzejazdZero() {
  return {
    czasPrzejazduMinuty: 0,
    zrodloCzasuPrzejazdu: "test-4h4"
  };
}

function sprawdzPamiecTrybuILiczby() {
  const srodowisko = wczytajPamiecIInterfejs();
  const aplikacja = srodowisko.aplikacja;
  const elementy = srodowisko.dokument.elementy;
  const pamiec = aplikacja.pamiecPlanu;

  elementy["tryb-pomp"].value = "mam-okreslona-liczbe";
  elementy["tryb-pomp"].zdarzenia.change();
  elementy["liczba-dostepnych-pomp"].value = "2";
  elementy["liczba-dostepnych-pomp"].zdarzenia.change();

  const parametry = aplikacja.interfejs.pobierzWartosciParametrowDoZapisu();
  assert.equal(parametry.trybPomp, "mam-okreslona-liczbe");
  assert.equal(parametry.liczbaDostepnychPomp, "2");
  assert.equal(elementy["liczba-dostepnych-pomp"].disabled, false);
  assert.equal(elementy["liczba-dostepnych-pomp"].required, true);

  const danePlanu = {
    wersjaStanuAplikacji: 3,
    parametry: parametry,
    listaPomp: [utworzPompe("P-1"), utworzPompe("P-2")],
    czyHarmonogramPrzeliczony: false
  };

  assert.match(pamiec.zapiszPlan(danePlanu).status, /^zapisano-/);
  const odczytanyPlan = pamiec.odczytajPlan();
  assert.equal(odczytanyPlan.status, "odczytano");
  assert.equal(odczytanyPlan.danePlanu.parametry.trybPomp, "mam-okreslona-liczbe");
  assert.equal(odczytanyPlan.danePlanu.parametry.liczbaDostepnychPomp, "2");

  aplikacja.interfejs.ustawParametryZPamieci(
    aplikacja.konfiguracja.parametryDomyslne
  );
  assert.equal(elementy["tryb-pomp"].value, "oblicz-potrzebne");
  assert.equal(elementy["liczba-dostepnych-pomp"].disabled, true);

  aplikacja.interfejs.ustawParametryZPamieci(odczytanyPlan.danePlanu.parametry);
  assert.equal(elementy["tryb-pomp"].value, "mam-okreslona-liczbe");
  assert.equal(elementy["liczba-dostepnych-pomp"].value, "2");
  assert.equal(elementy["liczba-dostepnych-pomp"].disabled, false);
  assert.equal(elementy["liczba-dostepnych-pomp"].required, true);

  const zapisHistorii = pamiec.zapiszPlanHistoryczny(danePlanu);
  assert.match(zapisHistorii.status, /^zapisano-historie-/);
  const historia = pamiec.pobierzHistoriePlanow();
  assert.equal(historia.liczbaZapisow, 1);
  const planHistoryczny = pamiec.odczytajPlanHistoryczny(
    historia.zapisy[0].idZapisu
  );
  assert.equal(planHistoryczny.danePlanu.parametry.trybPomp, "mam-okreslona-liczbe");
  assert.equal(planHistoryczny.danePlanu.parametry.liczbaDostepnychPomp, "2");

  aplikacja.interfejs.ustawParametryZPamieci({
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: "0"
  });
  assert.equal(elementy["tryb-pomp"].value, "mam-okreslona-liczbe");
  assert.equal(elementy["liczba-dostepnych-pomp"].value, "0");
  assert.equal(elementy["liczba-dostepnych-pomp"].disabled, false);
}

function sprawdzZmianeTrybuUsuwaLimitZZapisu() {
  const srodowisko = wczytajPamiecIInterfejs();
  const elementy = srodowisko.dokument.elementy;
  const interfejs = srodowisko.aplikacja.interfejs;

  interfejs.ustawParametryZPamieci({
    trybPomp: "mam-okreslona-liczbe",
    liczbaDostepnychPomp: "3"
  });
  assert.equal(interfejs.pobierzWartosciParametrowDoZapisu().liczbaDostepnychPomp, "3");

  elementy["tryb-pomp"].value = "oblicz-potrzebne";
  elementy["tryb-pomp"].zdarzenia.change();
  const poZmianie = interfejs.pobierzWartosciParametrowDoZapisu();

  assert.equal(poZmianie.trybPomp, "oblicz-potrzebne");
  assert.equal(poZmianie.liczbaDostepnychPomp, null);
  assert.equal(elementy["liczba-dostepnych-pomp"].disabled, true);
  assert.equal(elementy["liczba-dostepnych-pomp"].required, false);
}

function sprawdzPonownePrzeliczenieOdZera() {
  const pompy = wczytajModulyPomp();
  const budowy = [utworzBudowe("A"), utworzBudowe("B"), utworzBudowe("C")];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 490, 505),
    utworzKurs("C", 500, 515)
  ];
  const trzyPompy = [
    utworzPompe("P-1"),
    utworzPompe("P-2"),
    utworzPompe("P-3")
  ];
  const opcje = { pobierzDanePrzejazdu: pobierzPrzejazdZero };

  const wynikJednejPompy = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    trzyPompy,
    kursy,
    1,
    opcje
  );
  const wynikTrzechPomp = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    trzyPompy,
    kursy,
    3,
    opcje
  );
  const wynikJednejPompyPonownie = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    trzyPompy,
    kursy,
    1,
    opcje
  );

  assert.deepEqual(
    Array.from(wynikJednejPompy.wynikiBudow, function (wynik) {
      return wynik.opoznienieZPowoduPompMinuty;
    }),
    [0, 55, 110]
  );
  assert.deepEqual(
    Array.from(wynikTrzechPomp.wynikiBudow, function (wynik) {
      return wynik.opoznienieZPowoduPompMinuty;
    }),
    [0, 0, 0]
  );
  assert.equal(
    JSON.stringify(wynikJednejPompy),
    JSON.stringify(wynikJednejPompyPonownie)
  );
  assert.equal(wynikTrzechPomp.liczbaOpoznionychBetonowan, 0);
  assert.equal(wynikJednejPompyPonownie.liczbaOpoznionychBetonowan, 2);
}

function sprawdzZmianeAktywnejListyBezStaregoStanu() {
  const pompy = wczytajModulyPomp();
  const budowy = [utworzBudowe("A"), utworzBudowe("B")];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 480, 495)
  ];
  const opcje = { pobierzDanePrzejazdu: pobierzPrzejazdZero };

  const wynikPierwszy = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    [utworzPompe("P-1"), utworzPompe("P-2", { aktywna: false })],
    kursy,
    2,
    opcje
  );
  const wynikPoZmianie = pompy.obliczOgraniczonyWynikPomp(
    budowy,
    [utworzPompe("P-1", { aktywna: false }), utworzPompe("P-2")],
    kursy,
    2,
    opcje
  );

  assert.equal(wynikPierwszy.liczbaPompDostepnychDoPrzydzialu, 1);
  assert.equal(wynikPoZmianie.liczbaPompDostepnychDoPrzydzialu, 1);
  assert.equal(wynikPierwszy.wynikiBudow[0].przydzialPompy.idPompy, "P-1");
  assert.equal(wynikPoZmianie.wynikiBudow[0].przydzialPompy.idPompy, "P-2");
  assert.equal(wynikPoZmianie.stanPomp[0].idPompy, "P-2");
}

function uruchomTesty() {
  sprawdzPamiecTrybuILiczby();
  sprawdzZmianeTrybuUsuwaLimitZZapisu();
  sprawdzPonownePrzeliczenieOdZera();
  sprawdzZmianeAktywnejListyBezStaregoStanu();

  console.log(
    "✓ Etap 4H.4: tryb i liczba pomp wracają z pamięci, a każde przeliczenie zaczyna od czystego stanu zasobów."
  );
}

uruchomTesty();
