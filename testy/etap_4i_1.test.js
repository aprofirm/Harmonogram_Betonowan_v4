"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzBudowe(idBudowy, startRoboczy) {
  return {
    idBudowy: idBudowy,
    firma: "Firma " + idBudowy,
    budowa: "Budowa " + idBudowy,
    startPlanowany: "08:00",
    startZadany: "08:00",
    startRoboczy: startRoboczy || "08:00",
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32,
    czasDojazduRoboczyMinuty: 0,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  };
}

function utworzPompe(idPompy) {
  return {
    idPompy: idPompy,
    nazwa: idPompy,
    typ: "wlasna",
    aktywna: true,
    dostepnaOd: "07:00",
    wysiegMetry: 32
  };
}

function utworzKurs(idBudowy, poczatek, koniec) {
  return {
    idKursu: "KURS-" + idBudowy,
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: poczatek,
    minutaZakonczeniaRozladunku: koniec
  };
}

function utworzSrodowisko() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
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

  const aplikacja = zakresOkna.HarmonogramBetonowan;
  const bazoweKursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 490, 505),
    utworzKurs("C", 500, 515)
  ];

  aplikacja.importCsv = {
    utworzPustyStanImportu: function () {
      return { budowy: [] };
    }
  };
  aplikacja.budowy = {
    normalizujRodzajRozladunku: function (wartosc) {
      return String(wartosc || "").trim().toLowerCase();
    },
    czyOdbiorWlasny: function () {
      return false;
    },
    utworzListeRobocza: function (zImportu, reczne) {
      return (Array.isArray(zImportu) ? zImportu : []).concat(
        Array.isArray(reczne) ? reczne : []
      );
    }
  };
  aplikacja.gruszki = {
    generujKursy: function () {
      return bazoweKursy.map(function (kurs) {
        return Object.assign({}, kurs);
      });
    },
    obliczCzasyKursow: function (kursy) {
      return kursy.map(function (kurs) {
        return Object.assign({}, kurs);
      });
    },
    przydzielGruszkiDoKursow: function (kursy) {
      return {
        kursy: kursy.map(function (kurs) {
          return Object.assign({}, kurs);
        }),
        gruszki: [{ idGruszki: "G-1" }],
        minimalnaLiczbaGruszek: 1,
        liczbaNieprzydzielonychKursow: 0,
        liczbaOpoznionychKursow: 0,
        maksymalneOpoznienieKursuMinuty: 0,
        czyOgraniczenieWplyneloNaPlan: false
      };
    },
    przydzielOgraniczonaLiczbeGruszekDoKursow: function (kursy, liczba) {
      return {
        kursy: kursy.map(function (kurs) {
          return Object.assign({}, kurs, {
            minutaRozpoczeciaRozladunku:
              kurs.minutaRozpoczeciaRozladunku + 100,
            minutaZakonczeniaRozladunku:
              kurs.minutaZakonczeniaRozladunku + 100
          });
        }),
        gruszki: liczba > 0 ? [{ idGruszki: "G-1" }] : [],
        liczbaDostepnychGruszek: liczba,
        liczbaNieprzydzielonychKursow: liczba > 0 ? 0 : kursy.length,
        liczbaOpoznionychKursow: liczba > 0 ? kursy.length : 0,
        maksymalneOpoznienieKursuMinuty: liczba > 0 ? 100 : 0,
        czyOgraniczenieWplyneloNaPlan: true
      };
    }
  };
  aplikacja.lokalizacje = {
    utworzPustyStanLokalizacji: function () {
      return { status: "pusty" };
    }
  };

  new vm.Script(wczytaj("js/harmonogram/harmonogram.js"), {
    filename: "js/harmonogram/harmonogram.js"
  }).runInContext(kontekst);

  return {
    aplikacja: aplikacja,
    bazoweKursy: bazoweKursy
  };
}

function pobierzPrzejazdZero() {
  return {
    czasPrzejazduMinuty: 0,
    zrodloCzasuPrzejazdu: "test-4i1"
  };
}

function sprawdzTrybObliczPotrzebne() {
  const srodowisko = utworzSrodowisko();
  const budowy = [utworzBudowe("A"), utworzBudowe("B"), utworzBudowe("C")];
  const wynik = srodowisko.aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: budowy },
    listaPomp: [utworzPompe("STARA-POMPA")],
    parametry: {
      trybPomp: "oblicz-potrzebne"
    }
  });

  assert.equal(wynik.pompy.status, "obliczono");
  assert.equal(wynik.pompy.trybPomp, "oblicz-potrzebne");
  assert.equal(wynik.pompy.minimalnaLiczbaPomp, 3);
  assert.equal(wynik.minimalnaLiczbaPomp, 3);
  assert.equal(wynik.liczbaDostepnychPomp, null);
  assert.equal(wynik.pompy.dostepnePompy.length, 0);
  assert.equal(wynik.pompy.wynikMinimalnejFloty.przydzialyTechniczne.length, 3);
  assert.deepEqual(
    JSON.parse(JSON.stringify(wynik.pompy.wynikMinimalnejFloty.przydzialyTechniczne.map(function (p) {
      return p.idPompyTechnicznej;
    }))),
    ["POMPA-TECH-001", "POMPA-TECH-002", "POMPA-TECH-003"]
  );
}

function sprawdzTrybOgraniczonyICzystaGranice() {
  const srodowisko = utworzSrodowisko();
  const budowy = [utworzBudowe("A"), utworzBudowe("B"), utworzBudowe("C")];
  const startyPrzed = budowy.map(function (budowa) {
    return budowa.startRoboczy;
  });
  const wynik = srodowisko.aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: budowy },
    listaPomp: [utworzPompe("P-1")],
    parametry: {
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 1,
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: 1
    },
    opcjePomp: {
      pobierzDanePrzejazdu: pobierzPrzejazdZero
    }
  });

  assert.equal(wynik.pompy.status, "obliczono");
  assert.equal(wynik.pompy.trybPomp, "mam-okreslona-liczbe");
  assert.equal(wynik.pompy.minimalnaLiczbaPomp, 3);
  assert.equal(wynik.pompy.liczbaPompUwzglednionychWPrzydziale, 1);
  assert.equal(wynik.pompy.statusFlotyPomp, "niedobor-pomp");
  assert.equal(wynik.pompy.wynikiBudow[1].opoznienieZPowoduPompMinuty, 55);
  assert.equal(wynik.pompy.wynikiBudow[2].opoznienieZPowoduPompMinuty, 110);

  // Wynik gruszek w tym teście jest sztucznie przesunięty o 100 minut.
  // Pompy muszą nadal bazować na kursach sprzed tej korekty.
  assert.equal(wynik.kursy[0].minutaRozpoczeciaRozladunku, 580);
  assert.equal(
    wynik.pompy.wynikiBudow[0].minutaPlanowanegoStartuBetonowania,
    480
  );

  assert.deepEqual(
    budowy.map(function (budowa) {
      return budowa.startRoboczy;
    }),
    startyPrzed
  );
}

function sprawdzZeroPomp() {
  const srodowisko = utworzSrodowisko();
  const wynik = srodowisko.aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: { budowy: [utworzBudowe("A")] },
    listaPomp: [utworzPompe("P-1")],
    parametry: {
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 0
    }
  });

  assert.equal(wynik.pompy.statusFlotyPomp, "brak-pomp");
  assert.equal(wynik.pompy.liczbaPompUwzglednionychWPrzydziale, 0);
  assert.equal(wynik.pompy.wynikiBudow[0].przydzialPompy, null);
}

function sprawdzWalidacje() {
  const srodowisko = utworzSrodowisko();
  const dane = {
    stanImportu: { budowy: [utworzBudowe("A")] },
    listaPomp: [utworzPompe("P-1")]
  };

  assert.throws(function () {
    srodowisko.aplikacja.harmonogram.przeliczCalyHarmonogram(
      Object.assign({}, dane, {
        parametry: { trybPomp: "nieznany" }
      })
    );
  }, /Nie rozpoznano wybranego trybu pracy pomp/);

  assert.throws(function () {
    srodowisko.aplikacja.harmonogram.przeliczCalyHarmonogram(
      Object.assign({}, dane, {
        parametry: {
          trybPomp: "mam-okreslona-liczbe",
          liczbaDostepnychPomp: 1.5
        }
      })
    );
  }, /Liczba dostępnych pomp musi być liczbą całkowitą/);
}

function uruchomTesty() {
  sprawdzTrybObliczPotrzebne();
  sprawdzTrybOgraniczonyICzystaGranice();
  sprawdzZeroPomp();
  sprawdzWalidacje();

  console.log(
    "✓ Etap 4I.1: centralny harmonogram zwraca niezależny wynik pomp w obu trybach bez zmiany StartRoboczy ani kursów przez pompy."
  );
}

uruchomTesty();
