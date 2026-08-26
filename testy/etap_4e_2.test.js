"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajModulyPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/pompy/pompy.js",
    "js/pompy/przejazdy_pomp.js"
  ].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(
      path.join(katalogProjektu, sciezkaPliku),
      "utf8"
    );
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function utworzBudowe(idBudowy, startPlanowany) {
  return {
    idBudowy: idBudowy,
    budowa: "Budowa " + idBudowy,
    rodzajRozladunku: "pompa",
    startPlanowany: startPlanowany,
    startZadany: startPlanowany,
    startRoboczy: startPlanowany,
    iloscBetonuLiczbaM3: 8,
    czasDojazduRoboczyMinuty: 20,
    zrodloCzasuDojazdu: "reczny",
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
  };
}

function utworzKurs(idBudowy, minutaRozpoczecia, minutaZakonczenia) {
  return {
    idKursu: idBudowy + "-KURS-001",
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: minutaRozpoczecia,
    minutaZakonczeniaRozladunku: minutaZakonczenia
  };
}

function sprawdzPrzejazdMiedzyBudowami(pompy) {
  const budowaA = utworzBudowe("BUDOWA-A", "08:00");
  const budowaB = utworzBudowe("BUDOWA-B", "10:00");
  const kursy = [
    utworzKurs("BUDOWA-A", 480, 495),
    utworzKurs("BUDOWA-B", 600, 615)
  ];
  const budowaAPrzedObliczeniem = JSON.stringify(budowaA);
  const budowaBPrzedObliczeniem = JSON.stringify(budowaB);
  const kursyPrzedObliczeniem = JSON.stringify(kursy);

  const przejazd = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    budowaA,
    budowaB,
    kursy,
    {
      czasPrzejazduMinuty: 40,
      zrodloCzasuPrzejazdu: "pamiec"
    }
  );

  assert.deepEqual(JSON.parse(JSON.stringify(przejazd)), {
    idBudowyZrodlowej: "BUDOWA-A",
    idBudowyDocelowej: "BUDOWA-B",
    rodzajTrasy: "budowa-do-budowy",
    czyWplywaNaDostepnoscPompy: true,
    czasPrzejazduMinuty: 40,
    zrodloCzasuPrzejazdu: "pamiec",
    minutaWyjazduZBudowy: 525,
    minutaPrzyjazduNaBudowe: 565,
    minutaPlanowanegoRozpoczeciaPrzygotowania: 580,
    minutaNajwczesniejszegoRozpoczeciaPrzygotowania: 565,
    opoznieniePrzygotowaniaPrzezPrzejazdMinuty: 0,
    czasPrzygotowaniaPompyNaBudowieDocelowejMinuty: 20,
    minutaPlanowanegoStartuBetonowania: 600,
    minutaGotowosciDoBetonowaniaPoPrzejezdzie: 585,
    minutaNajwczesniejszegoStartuBetonowania: 600,
    opoznienieStartuPrzezPrzejazdMinuty: 0,
    czyMoznaRozpoczacPrzygotowanieZgodnieZPlanem: true,
    czyPrzejazdWymuszaPozniejszyStart: false,
    przyczynaOgraniczeniaPrzejazdu: null
  });

  assert.equal(JSON.stringify(budowaA), budowaAPrzedObliczeniem);
  assert.equal(JSON.stringify(budowaB), budowaBPrzedObliczeniem);
  assert.equal(JSON.stringify(kursy), kursyPrzedObliczeniem);
}

function sprawdzBrakPrzydzialuIPrzesuniecia(pompy) {
  const budowaA = utworzBudowe("BUDOWA-A", "08:00");
  const budowaB = utworzBudowe("BUDOWA-B", "10:00");
  const kursy = [
    utworzKurs("BUDOWA-A", 480, 495),
    utworzKurs("BUDOWA-B", 600, 615)
  ];

  const przejazd = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    budowaA,
    budowaB,
    kursy,
    { czasPrzejazduMinuty: 40 }
  );

  assert.equal(przejazd.zrodloCzasuPrzejazdu, "reczny");
  assert.equal(przejazd.czyWplywaNaDostepnoscPompy, true);
  assert.equal(przejazd.opoznienieStartuPrzezPrzejazdMinuty, 0);
  assert.equal(budowaB.startPlanowany, "10:00");
  assert.equal(budowaB.startZadany, "10:00");
  assert.equal(budowaB.startRoboczy, "10:00");
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzPrzejazdMiedzyBudowami(pompy);
  sprawdzBrakPrzydzialuIPrzesuniecia(pompy);

  console.log(
    "✓ Etap 4E.2: przejazd pompy między budowami uwzględnia pełny cykl obu prac."
  );
}

uruchomTesty();
