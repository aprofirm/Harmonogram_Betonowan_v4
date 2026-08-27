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

function utworzBudowe(idBudowy, dane) {
  return Object.assign({
    idBudowy: idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
    statusRealizacji: "planowana",
    wymaganyWysiegPompyMetry: 32
  }, dane || {});
}

function utworzKurs(idBudowy, minutaStartu, minutaKonca) {
  return {
    idKursu: "KURS-" + idBudowy,
    idBudowy: idBudowy,
    minutaRozpoczeciaRozladunku: minutaStartu,
    minutaZakonczeniaRozladunku: minutaKonca
  };
}

function pobierzIdZUlozenia(ulozenie) {
  return ulozenie.map(function (pozycja) {
    return pozycja.budowa.idBudowy;
  });
}

function sprawdzKolejnoscIRemisy(pompy) {
  const budowy = [
    utworzBudowe("ROWNA-1", { czasPrzygotowaniaPompyRoboczyMinuty: 20 }),
    utworzBudowe("POZNA"),
    utworzBudowe("LEJ", { rodzajRozladunku: "lej" }),
    utworzBudowe("ROWNA-2", { czasPrzygotowaniaPompyRoboczyMinuty: 60 }),
    utworzBudowe("WCZESNA"),
    utworzBudowe("ZERO", { iloscBetonuLiczbaM3: 0 }),
    utworzBudowe("ZREALIZOWANA", { statusRealizacji: "zrealizowana" })
  ];
  const kursy = [
    utworzKurs("ROWNA-1", 480, 495),
    utworzKurs("POZNA", 540, 555),
    utworzKurs("LEJ", 420, 435),
    utworzKurs("ROWNA-2", 480, 495),
    utworzKurs("WCZESNA", 450, 465),
    utworzKurs("ZERO", 430, 445),
    utworzKurs("ZREALIZOWANA", 440, 455)
  ];
  const budowyPrzed = JSON.stringify(budowy);
  const kursyPrzed = JSON.stringify(kursy);
  const wynik = pompy.uporzadkujBudowyDoPrzydzialuPomp(budowy, kursy);

  assert.deepEqual(
    pobierzIdZUlozenia(wynik),
    ["WCZESNA", "ROWNA-1", "ROWNA-2", "POZNA"]
  );
  assert.deepEqual(
    wynik.map(function (pozycja) {
      return pozycja.kolejnoscPrzydzialuPompy;
    }),
    [1, 2, 3, 4]
  );
  assert.deepEqual(
    wynik.map(function (pozycja) {
      return pozycja.minutaPlanowanegoStartuBetonowania;
    }),
    [450, 480, 480, 540]
  );
  assert.equal(wynik[1].budowa.idBudowy, "ROWNA-1");
  assert.equal(wynik[2].budowa.idBudowy, "ROWNA-2");
  assert.equal(JSON.stringify(budowy), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
}

function sprawdzPowtarzalnosc(pompy) {
  const budowy = [utworzBudowe("B"), utworzBudowe("A"), utworzBudowe("C")];
  const kursy = [
    utworzKurs("A", 600, 615),
    utworzKurs("B", 600, 615),
    utworzKurs("C", 590, 605)
  ];
  const pierwszy = pompy.uporzadkujBudowyDoPrzydzialuPomp(budowy, kursy);
  const drugi = pompy.uporzadkujBudowyDoPrzydzialuPomp(budowy, kursy);

  assert.deepEqual(pobierzIdZUlozenia(pierwszy), ["C", "B", "A"]);
  assert.deepEqual(pobierzIdZUlozenia(drugi), ["C", "B", "A"]);
}

function sprawdzPusteDane(pompy) {
  assert.equal(pompy.uporzadkujBudowyDoPrzydzialuPomp([], []).length, 0);
  assert.equal(pompy.uporzadkujBudowyDoPrzydzialuPomp(null, null).length, 0);
}

function sprawdzPodlaczenieModulu() {
  const index = wczytaj("index.html");
  const pozycjaDostepnosci = index.indexOf("js/pompy/dostepnosc_pomp.js");
  const pozycjaPrzejazdow = index.indexOf("js/pompy/przejazdy_pomp.js");
  const pozycjaPrzydzialu = index.indexOf("js/pompy/przydzial_pomp.js");
  const pozycjaGruszek = index.indexOf("js/gruszki/gruszki.js");

  assert.ok(pozycjaDostepnosci >= 0);
  assert.ok(pozycjaPrzejazdow > pozycjaDostepnosci);
  assert.ok(pozycjaPrzydzialu > pozycjaPrzejazdow);
  assert.ok(pozycjaGruszek > pozycjaPrzydzialu);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzKolejnoscIRemisy(pompy);
  sprawdzPowtarzalnosc(pompy);
  sprawdzPusteDane(pompy);
  sprawdzPodlaczenieModulu();

  console.log(
    "✓ Etap 4F.1: budowy pompowe mają stabilną kolejność według planowanego startu i kolejności wejściowej."
  );
}

uruchomTesty();
