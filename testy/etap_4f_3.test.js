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

function utworzBudowe(idBudowy) {
  return {
    idBudowy: idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32,
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

function utworzPompe(idPompy) {
  return {
    idPompy: idPompy,
    nazwa: idPompy,
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "",
    wysiegMetry: 32
  };
}

function utworzOkres(minutaStartu, minutaKonca) {
  return {
    minutaRozpoczeciaZajetosci: minutaStartu,
    minutaZakonczeniaZajetosci: minutaKonca
  };
}

function sprawdzReguleKolizji(pompy) {
  assert.equal(
    pompy.czyOkresyZajetosciPompKoliduja(
      utworzOkres(460, 525),
      utworzOkres(490, 555)
    ),
    true
  );
  assert.equal(
    pompy.czyOkresyZajetosciPompKoliduja(
      utworzOkres(460, 525),
      utworzOkres(525, 590)
    ),
    false
  );
  assert.equal(
    pompy.czyOkresyZajetosciPompKoliduja(
      utworzOkres(460, 600),
      utworzOkres(500, 520)
    ),
    true
  );
  assert.throws(function () {
    pompy.czyOkresyZajetosciPompKoliduja(
      utworzOkres(600, 500),
      utworzOkres(700, 800)
    );
  }, /poprawny początek i koniec pełnego cyklu/i);
}

function sprawdzKontroleCalejHistoriiPompy(pompy) {
  const kolidujacyPrzydzial = pompy.znajdzKolidujacyPrzydzialPompy(
    {
      przydzialy: [
        {
          idBudowy: "PIERWSZA",
          okresZajetosci: utworzOkres(460, 525)
        },
        {
          idBudowy: "DRUGA",
          okresZajetosci: utworzOkres(600, 660)
        }
      ]
    },
    utworzOkres(500, 510)
  );

  assert.equal(kolidujacyPrzydzial.idBudowy, "PIERWSZA");
}

function sprawdzKolizjePelnychCykli(pompy) {
  const budowaA = utworzBudowe("A");
  const budowaB = utworzBudowe("B");
  const budowy = [budowaA, budowaB];
  const kursy = [
    utworzKurs("A", 480, 495),
    utworzKurs("B", 510, 525)
  ];
  const budowyPrzed = JSON.stringify(budowy);
  const kursyPrzed = JSON.stringify(kursy);
  const wynik = pompy.przydzielPierwszePasujacePompy(
    budowy,
    [utworzPompe("P-1"), utworzPompe("P-2")],
    kursy
  );
  const wynikA = wynik.wynikiBudow[0];
  const wynikB = wynik.wynikiBudow[1];

  assert.equal(wynikA.okresZajetosci.minutaRozpoczeciaZajetosci, 460);
  assert.equal(wynikA.okresZajetosci.minutaZakonczeniaZajetosci, 525);
  assert.equal(wynikB.okresZajetosci.minutaRozpoczeciaZajetosci, 490);
  assert.equal(wynikB.okresZajetosci.minutaZakonczeniaZajetosci, 555);
  assert.equal(wynikA.przydzialPompy.idPompy, "P-1");
  assert.equal(wynikB.probyKandydatow[0].powodOdrzucenia, "pompa-zajeta");
  assert.equal(wynikB.probyKandydatow[0].idPoprzedniejBudowy, "A");
  assert.equal(
    wynikB.probyKandydatow[0].kolidujacyOkresZajetosci
      .minutaZakonczeniaZajetosci,
    525
  );
  assert.equal(wynikB.przydzialPompy.idPompy, "P-2");
  assert.equal(JSON.stringify(budowy), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
}

function sprawdzDozwolonaWspolnaGranice(pompy) {
  const budowaA = utworzBudowe("A");
  const budowaB = utworzBudowe("B");
  const wynik = pompy.przydzielPierwszePasujacePompy(
    [budowaA, budowaB],
    [utworzPompe("P-1")],
    [
      utworzKurs("A", 480, 495),
      utworzKurs("B", 545, 560)
    ],
    {
      pobierzDanePrzejazdu: function () {
        return {
          czasPrzejazduMinuty: 0,
          zrodloCzasuPrzejazdu: "test-granicy"
        };
      }
    }
  );
  const wynikA = wynik.wynikiBudow[0];
  const wynikB = wynik.wynikiBudow[1];
  const stanPompy = wynik.stanPomp[0];

  assert.equal(wynikA.okresZajetosci.minutaZakonczeniaZajetosci, 525);
  assert.equal(wynikB.okresZajetosci.minutaRozpoczeciaZajetosci, 525);
  assert.equal(wynikA.przydzialPompy.idPompy, "P-1");
  assert.equal(wynikB.przydzialPompy.idPompy, "P-1");
  assert.equal(
    wynikB.przydzialPompy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    0
  );
  assert.equal(stanPompy.liczbaPrzydzialow, 2);
  assert.deepEqual(
    Array.from(stanPompy.przydzialy, function (przydzial) {
      return przydzial.idBudowy;
    }),
    ["A", "B"]
  );
  assert.equal(
    pompy.czyOkresyZajetosciPompKoliduja(
      stanPompy.przydzialy[0].okresZajetosci,
      stanPompy.przydzialy[1].okresZajetosci
    ),
    false
  );
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzReguleKolizji(pompy);
  sprawdzKontroleCalejHistoriiPompy(pompy);
  sprawdzKolizjePelnychCykli(pompy);
  sprawdzDozwolonaWspolnaGranice(pompy);

  console.log(
    "✓ Etap 4F.3: pełne okresy jednej pompy nie nakładają się, a wspólna granica jest dozwolona."
  );
}

uruchomTesty();
