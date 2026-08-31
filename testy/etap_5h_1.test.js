"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    TextDecoder: TextDecoder,
    FileReader: function () {},
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js",
    "js/harmonogram/konflikty_przestojow.js",
    "js/harmonogram/kontrakt_konfliktow.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function sprawdzRdzenKontraktu(konflikt, oczekiwanaKategoria) {
  assert.equal(konflikt.wersjaKontraktu, 1);
  assert.equal(konflikt.poziom, "konflikt");
  assert.equal(typeof konflikt.kod, "string");
  assert.ok(konflikt.kod.length > 0);
  assert.equal(typeof konflikt.rodzaj, "string");
  assert.ok(konflikt.rodzaj.length > 0);
  assert.equal(konflikt.kategoriaKonfliktu, oczekiwanaKategoria);
  assert.equal(typeof konflikt.opis, "string");
  assert.ok(konflikt.opis.length > 0);
  assert.ok(Array.isArray(konflikt.powiazania));
  assert.ok(konflikt.powiazania.length > 0);

  konflikt.powiazania.forEach(function (powiazanie) {
    assert.equal(typeof powiazanie.typ, "string");
    assert.equal(typeof powiazanie.id, "string");
    assert.equal(typeof powiazanie.rola, "string");
  });
}

function sprawdzKategorieIPowiazania() {
  const aplikacja = wczytajAplikacje();
  const normalizuj = aplikacja.konflikty.normalizujKonflikt;
  const przyklady = [
    {
      konflikt: {
        kod: "BRAK_DOSTEPNYCH_GRUSZEK",
        rodzaj: "gruszki",
        opis: "Brak gruszki."
      },
      kategoria: "brak-gruszki"
    },
    {
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        przyczyna: "brak-dostepnych-pomp",
        opis: "Brak pompy."
      },
      kategoria: "brak-pompy"
    },
    {
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        przyczyna: "po-dostepnosci",
        opis: "Pompa niedostępna."
      },
      kategoria: "niedostepnosc"
    },
    {
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        przyczyna: "niewystarczajacy-wysieg",
        opis: "Niezgodny parametr pompy."
      },
      kategoria: "niezgodny-parametr"
    },
    {
      konflikt: {
        kod: "KOLIZJA_ZASOBU",
        rodzaj: "zasoby",
        kategoriaKonfliktu: "kolizja",
        opis: "Kolizja zasobu.",
        powiazania: [{ typ: "zasob", id: "P-1", rola: "dotyczy" }]
      },
      kategoria: "kolizja"
    },
    {
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "B",
        przyczyna: "brak-trasy",
        opis: "Brak trasy."
      },
      kategoria: "brak-trasy"
    },
    {
      konflikt: {
        kod: "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU",
        rodzaj: "limit-opoznienia-startu",
        idBudowy: "C",
        opis: "Przekroczony limit startu."
      },
      kategoria: "limit-startu"
    },
    {
      konflikt: {
        kod: "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA",
        rodzaj: "przestoj-betonowania",
        idBudowy: "A",
        idPoprzedniegoKursu: "A-KURS-001",
        idNastepnegoKursu: "A-KURS-002",
        opis: "Przekroczony limit przestoju."
      },
      kategoria: "limit-przestoju"
    }
  ];

  przyklady.forEach(function (przyklad) {
    const zrodloPrzed = JSON.stringify(przyklad.konflikt);
    const wynik = normalizuj(przyklad.konflikt);

    sprawdzRdzenKontraktu(wynik, przyklad.kategoria);
    assert.equal(JSON.stringify(przyklad.konflikt), zrodloPrzed);
  });

  const konfliktPrzestoju = normalizuj(przyklady[7].konflikt);
  assert.deepEqual(
    Array.from(konfliktPrzestoju.powiazania, function (powiazanie) {
      return [powiazanie.typ, powiazanie.id, powiazanie.rola];
    }),
    [
      ["budowa", "A", "dotyczy"],
      ["kurs", "A-KURS-001", "poprzedni"],
      ["kurs", "A-KURS-002", "nastepny"]
    ]
  );
}

function utworzStanImportu(aplikacja, iloscBetonuM3) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu",
    "A;Alfa;Budowa A;08:00;" + iloscBetonuM3 + ";Lej;0;0"
  ].join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5h1.csv");
}

function przelicz(aplikacja, stanImportu, liczbaGruszek, czasZaladunkuMinuty) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: czasZaladunkuMinuty,
      czasRozladunkuMinuty: 15,
      maksymalnyPrzestojMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 0,
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: liczbaGruszek
    }
  });
}

function sprawdzIntegracjeZPelnyWynikiem() {
  const aplikacja = wczytajAplikacje();
  const wynikBezGruszek = przelicz(
    aplikacja,
    utworzStanImportu(aplikacja, 8),
    0,
    10
  );
  const konfliktGruszek = wynikBezGruszek.konflikty.find(function (konflikt) {
    return konflikt.kod === "BRAK_DOSTEPNYCH_GRUSZEK";
  });

  sprawdzRdzenKontraktu(konfliktGruszek, "brak-gruszki");
  assert.ok(konfliktGruszek.powiazania.some(function (powiazanie) {
    return powiazanie.typ === "zasob" && powiazanie.id === "gruszki";
  }));
  assert.equal(konfliktGruszek.liczbaKursow, 1);

  const wynikPrzestoju = przelicz(
    aplikacja,
    utworzStanImportu(aplikacja, 24),
    1,
    16
  );
  const konfliktyPrzestoju = wynikPrzestoju.konflikty.filter(function (konflikt) {
    return konflikt.kod === "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA";
  });

  assert.equal(konfliktyPrzestoju.length, 2);
  konfliktyPrzestoju.forEach(function (konflikt) {
    sprawdzRdzenKontraktu(konflikt, "limit-przestoju");
    assert.ok(konflikt.powiazania.some(function (powiazanie) {
      return powiazanie.typ === "budowa" && powiazanie.id === "A";
    }));
    assert.equal(
      konflikt.powiazania.filter(function (powiazanie) {
        return powiazanie.typ === "kurs";
      }).length,
      2
    );
  });
}

function sprawdzWalidacjeKontraktu() {
  const aplikacja = wczytajAplikacje();

  assert.throws(function () {
    aplikacja.konflikty.utworzKonflikt({
      rodzaj: "test",
      opis: "Brak kodu."
    });
  }, /„kod”/i);

  assert.throws(function () {
    aplikacja.konflikty.utworzKonflikt({
      kod: "TEST",
      rodzaj: "test",
      opis: ""
    });
  }, /„opis”/i);
}

function sprawdzPodpiecieWersjiWebowej() {
  const html = wczytaj("index.html");
  const pozycjaPrzestojow = html.indexOf("js/harmonogram/konflikty_przestojow.js");
  const pozycjaKontraktu = html.indexOf("js/harmonogram/kontrakt_konfliktow.js");
  const pozycjaInterfejsu = html.indexOf("js/interfejs/interfejs.js");

  assert.ok(pozycjaPrzestojow >= 0);
  assert.ok(pozycjaKontraktu > pozycjaPrzestojow);
  assert.ok(pozycjaInterfejsu > pozycjaKontraktu);
}

sprawdzKategorieIPowiazania();
sprawdzIntegracjeZPelnyWynikiem();
sprawdzWalidacjeKontraktu();
sprawdzPodpiecieWersjiWebowej();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5I.1");

console.log(
  "OK — 5H.1 nadaje wszystkim konfliktom wspólny, wersjonowany kontrakt i zachowuje szczegóły wcześniejszych reguł."
);
