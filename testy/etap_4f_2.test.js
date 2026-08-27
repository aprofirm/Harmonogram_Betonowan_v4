"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajModulyPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, wymaganyWysiegPompyMetry) {
  return {
    idBudowy: idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry || 32,
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

function sprawdzPierwszaPasujacaPompe(pompy) {
  const budowa = utworzBudowe("B-42", 42);
  const kursy = [utworzKurs("B-42", 480, 495)];
  const listaPomp = [
    utworzPompe("P-0", { aktywna: false, wysiegMetry: 60 }),
    utworzPompe("P-1", { wysiegMetry: 32 }),
    utworzPompe("P-2", { typ: "zewnetrzna", wysiegMetry: 42 }),
    utworzPompe("P-3", { wysiegMetry: 52 })
  ];
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowa],
    listaPomp,
    kursy
  );
  const wynikBudowy = wynik.wynikiBudow[0];

  assert.equal(wynikBudowy.statusPrzydzialuPompy, "przydzielona");
  assert.equal(wynikBudowy.przydzialPompy.idPompy, "P-2");
  assert.equal(wynikBudowy.probyKandydatow[0].powodOdrzucenia, "pompa-nieaktywna");
  assert.equal(
    wynikBudowy.probyKandydatow[1].powodOdrzucenia,
    "niewystarczajacy-wysieg"
  );
  assert.equal(wynikBudowy.probyKandydatow.length, 3);
  assert.equal(wynik.liczbaPrzydzielonychBetonowan, 1);
}

function sprawdzOknoDostepnosciIPrzekroczenie(pompy) {
  const budowa = utworzBudowe("B-OKNO", 32);
  const kursy = [utworzKurs("B-OKNO", 480, 495)];
  const listaPomp = [
    utworzPompe("P-ZA-WCZESNA", {
      dostepnaOd: "07:50",
      wysiegMetry: 32
    }),
    utworzPompe("P-GRANICA", {
      dostepnaDo: "07:40",
      wysiegMetry: 32
    })
  ];
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowa],
    listaPomp,
    kursy
  );
  const wynikBudowy = wynik.wynikiBudow[0];

  assert.equal(
    wynikBudowy.probyKandydatow[0].powodOdrzucenia,
    "przed-dostepnoscia"
  );
  assert.equal(wynikBudowy.przydzialPompy.idPompy, "P-GRANICA");
  assert.equal(
    wynikBudowy.przydzialPompy.dostepnosc.czyPrzekraczaDostepnosc,
    true
  );
  assert.equal(
    wynikBudowy.przydzialPompy.dostepnosc.przekroczenieDostepnosciMinuty,
    65
  );
}

function sprawdzPrzejazdDoKolejnejBudowy(pompy) {
  const budowaA = utworzBudowe("A", 32);
  const budowaB = utworzBudowe("B", 32);
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 570, 585)
  ];
  const listaPomp = [
    utworzPompe("P-1"),
    utworzPompe("P-2")
  ];
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowaA, budowaB],
    listaPomp,
    kursy,
    {
      pobierzDanePrzejazdu: function (kontekst) {
        if (
          kontekst.idPompy === "P-1" &&
          kontekst.budowaZrodlowa.idBudowy === "A" &&
          kontekst.budowaDocelowa.idBudowy === "B"
        ) {
          return {
            czasPrzejazduMinuty: 30,
            zrodloCzasuPrzejazdu: "test"
          };
        }

        return null;
      }
    }
  );

  assert.equal(wynik.wynikiBudow[0].przydzialPompy.idPompy, "P-1");
  assert.equal(
    wynik.wynikiBudow[1].probyKandydatow[0].powodOdrzucenia,
    "przejazd-miedzy-budowami"
  );
  assert.equal(wynik.wynikiBudow[1].przydzialPompy.idPompy, "P-2");
  assert.equal(
    wynik.wynikiBudow[1].probyKandydatow[0]
      .przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    30
  );
}

function sprawdzPonowneUzycieTejSamejPompy(pompy) {
  const budowaA = utworzBudowe("A", 32);
  const budowaB = utworzBudowe("B", 32);
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 570, 585)
  ];
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowaA, budowaB],
    [utworzPompe("P-1")],
    kursy,
    {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 20,
          zrodloCzasuPrzejazdu: "test"
        };
      }
    }
  );

  assert.equal(wynik.wynikiBudow[0].przydzialPompy.idPompy, "P-1");
  assert.equal(wynik.wynikiBudow[1].przydzialPompy.idPompy, "P-1");
  assert.equal(
    wynik.wynikiBudow[1].przydzialPompy
      .przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    20
  );
  assert.equal(wynik.stanPomp[0].liczbaPrzydzialow, 2);
  assert.equal(wynik.stanPomp[0].ostatnieIdBudowy, "B");
}

function sprawdzBrakTrasyIBrakPasujacejPompy(pompy) {
  const budowaA = utworzBudowe("A", 32);
  const budowaB = utworzBudowe("B", 32);
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 570, 585)
  ];
  const budowyPrzed = JSON.stringify([budowaA, budowaB]);
  const kursyPrzed = JSON.stringify(kursy);
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowaA, budowaB],
    [utworzPompe("P-1")],
    kursy
  );

  assert.equal(wynik.wynikiBudow[0].statusPrzydzialuPompy, "przydzielona");
  assert.equal(
    wynik.wynikiBudow[1].statusPrzydzialuPompy,
    "brak-pasujacej-pompy"
  );
  assert.equal(wynik.wynikiBudow[1].przydzialPompy, null);
  assert.equal(
    wynik.wynikiBudow[1].probyKandydatow[0].powodOdrzucenia,
    "brak-trasy"
  );
  assert.equal(wynik.liczbaNieprzydzielonychBetonowan, 1);
  assert.equal(JSON.stringify([budowaA, budowaB]), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzPierwszaPasujacaPompe(pompy);
  sprawdzOknoDostepnosciIPrzekroczenie(pompy);
  sprawdzPrzejazdDoKolejnejBudowy(pompy);
  sprawdzPonowneUzycieTejSamejPompy(pompy);
  sprawdzBrakTrasyIBrakPasujacejPompy(pompy);

  console.log(
    "✓ Etap 4F.2: pierwsza aktywna, zgodna i osiągalna pompa jest wybierana deterministycznie."
  );
}

uruchomTesty();
