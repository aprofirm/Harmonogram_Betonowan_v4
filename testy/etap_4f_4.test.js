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

function sprawdzStartPoZajetejPompieIPrzejezdzie(pompy) {
  const budowaA = utworzBudowe("A");
  const budowaB = utworzBudowe("B");
  const budowy = [budowaA, budowaB];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 510, 525)
  ];
  const pompyWejsciowe = [utworzPompe("P-1")];
  const budowyPrzed = JSON.stringify(budowy);
  const kursyPrzed = JSON.stringify(kursy);
  const pompyPrzed = JSON.stringify(pompyWejsciowe);
  const wynik = pompy.przydzielPierwszePasujacePompy(
    budowy,
    pompyWejsciowe,
    kursy,
    {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 15,
          zrodloCzasuPrzejazdu: "test-4f4"
        };
      }
    }
  );
  const wynikB = wynik.wynikiBudow[1];
  const najwczesniejszy = wynikB.najwczesniejszyMozliwyStart;

  assert.equal(wynikB.statusPrzydzialuPompy, "brak-pasujacej-pompy");
  assert.equal(wynikB.probyKandydatow[0].powodOdrzucenia, "pompa-zajeta");
  assert.equal(najwczesniejszy.czyMoznaWyznaczyc, true);
  assert.equal(najwczesniejszy.idPompy, "P-1");
  assert.equal(najwczesniejszy.idPoprzedniejBudowy, "A");
  assert.equal(najwczesniejszy.minutaPlanowanegoStartuBetonowania, 510);
  assert.equal(najwczesniejszy.minutaNajwczesniejszegoStartuBetonowania, 560);
  assert.equal(najwczesniejszy.przesuniecieStartuMinuty, 50);
  assert.equal(
    najwczesniejszy.minutaNajwczesniejszegoRozpoczeciaPrzygotowania,
    540
  );
  assert.equal(
    najwczesniejszy.przyczynaOgraniczenia,
    "przejazd-miedzy-budowami"
  );
  assert.equal(
    najwczesniejszy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    15
  );
  assert.deepEqual(
    Array.from(najwczesniejszy.przyczynyOgraniczenia, function (ograniczenie) {
      return ograniczenie.rodzaj;
    }),
    ["pompa-zajeta", "przejazd-miedzy-budowami"]
  );
  assert.equal(JSON.stringify(budowy), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
  assert.equal(JSON.stringify(pompyWejsciowe), pompyPrzed);
}

function sprawdzStartOdDostepnaOd(pompy) {
  const budowa = utworzBudowe("B-OD");
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowa],
    [utworzPompe("P-OD", { dostepnaOd: "08:10" })],
    [utworzKurs("B-OD", 480, 495)]
  );
  const najwczesniejszy = wynik.wynikiBudow[0].najwczesniejszyMozliwyStart;

  assert.equal(wynik.wynikiBudow[0].statusPrzydzialuPompy, "brak-pasujacej-pompy");
  assert.equal(najwczesniejszy.czyMoznaWyznaczyc, true);
  assert.equal(najwczesniejszy.idPompy, "P-OD");
  assert.equal(najwczesniejszy.minutaNajwczesniejszegoRozpoczeciaPrzygotowania, 490);
  assert.equal(najwczesniejszy.minutaNajwczesniejszegoStartuBetonowania, 510);
  assert.equal(najwczesniejszy.przesuniecieStartuMinuty, 30);
  assert.equal(najwczesniejszy.przyczynaOgraniczenia, "przed-dostepnoscia");
}

function sprawdzWyborNajwczesniejszejPompy(pompy) {
  const budowa = utworzBudowe("B-WYBOR");
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowa],
    [
      utworzPompe("P-POZNA", { dostepnaOd: "09:00" }),
      utworzPompe("P-WCZESNA", { dostepnaOd: "08:30" })
    ],
    [utworzKurs("B-WYBOR", 480, 495)]
  );
  const najwczesniejszy = wynik.wynikiBudow[0].najwczesniejszyMozliwyStart;

  assert.equal(najwczesniejszy.czyMoznaWyznaczyc, true);
  assert.equal(najwczesniejszy.idPompy, "P-WCZESNA");
  assert.equal(najwczesniejszy.minutaNajwczesniejszegoStartuBetonowania, 530);
  assert.equal(najwczesniejszy.przesuniecieStartuMinuty, 50);
  assert.equal(najwczesniejszy.probyPomp.length, 2);
}

function sprawdzBrakWymyslonegoStartu(pompy) {
  const budowa = utworzBudowe("B-BRAK", 42);
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowa],
    [
      utworzPompe("P-NIEAKTYWNA", { aktywna: false, wysiegMetry: 52 }),
      utworzPompe("P-ZA-MALA", { wysiegMetry: 32 })
    ],
    [utworzKurs("B-BRAK", 600, 615)]
  );
  const najwczesniejszy = wynik.wynikiBudow[0].najwczesniejszyMozliwyStart;

  assert.equal(najwczesniejszy.czyMoznaWyznaczyc, false);
  assert.equal(
    najwczesniejszy.powodBrakuMozliwosci,
    "brak-mozliwego-kandydata"
  );
  assert.equal(najwczesniejszy.probyPomp.length, 2);
  assert.equal(
    najwczesniejszy.probyPomp[0].powodBrakuMozliwosci,
    "pompa-nieaktywna"
  );
  assert.equal(
    najwczesniejszy.probyPomp[1].powodBrakuMozliwosci,
    "niewystarczajacy-wysieg"
  );
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzStartPoZajetejPompieIPrzejezdzie(pompy);
  sprawdzStartOdDostepnaOd(pompy);
  sprawdzWyborNajwczesniejszejPompy(pompy);
  sprawdzBrakWymyslonegoStartu(pompy);

  console.log(
    "✓ Etap 4F.4: silnik podaje najwcześniejszy możliwy start bez przesuwania harmonogramu gruszek."
  );
}

uruchomTesty();
