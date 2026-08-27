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
    wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry,
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

function pobierzDanePrzejazdu(kontekst) {
  const klucz = [
    kontekst.idPompy,
    kontekst.budowaZrodlowa.idBudowy,
    kontekst.budowaDocelowa.idBudowy
  ].join("|");

  const czasyPrzejazdu = {
    "P-42|ROWNA-42|PRZEJAZD-42": 30,
    "P-32|ROWNA-32|POZNA-32": 20
  };

  if (!Object.prototype.hasOwnProperty.call(czasyPrzejazdu, klucz)) {
    return null;
  }

  return {
    czasPrzejazduMinuty: czasyPrzejazdu[klucz],
    zrodloCzasuPrzejazdu: "test-integracyjny-4f5"
  };
}

function pobierzIdBudow(wynik) {
  return wynik.wynikiBudow.map(function (wynikBudowy) {
    return wynikBudowy.idBudowy;
  });
}

function pobierzIdPrzydzielonychPomp(wynik) {
  return wynik.wynikiBudow.map(function (wynikBudowy) {
    return wynikBudowy.przydzialPompy
      ? wynikBudowy.przydzialPompy.idPompy
      : null;
  });
}

function sprawdzPelnePolaczenieRegul4F(pompy) {
  const budowy = [
    utworzBudowe("ROWNA-42", 42),
    utworzBudowe("ROWNA-32", 32),
    utworzBudowe("PRZEJAZD-42", 42),
    utworzBudowe("POZNA-32", 32)
  ];
  const kursy = [
    utworzKurs("ROWNA-42", 480, 495),
    utworzKurs("ROWNA-32", 480, 495),
    utworzKurs("PRZEJAZD-42", 540, 555),
    utworzKurs("POZNA-32", 600, 615)
  ];
  const listaPomp = [
    utworzPompe("P-WYL", { aktywna: false, wysiegMetry: 52 }),
    utworzPompe("P-32", { wysiegMetry: 32 }),
    utworzPompe("P-42", { wysiegMetry: 42 })
  ];
  const budowyPrzed = JSON.stringify(budowy);
  const kursyPrzed = JSON.stringify(kursy);
  const pompyPrzed = JSON.stringify(listaPomp);
  const opcje = { pobierzDanePrzejazdu: pobierzDanePrzejazdu };

  const pierwszyWynik = pompy.przydzielPierwszePasujacePompy(
    budowy,
    listaPomp,
    kursy,
    opcje
  );
  const drugiWynik = pompy.przydzielPierwszePasujacePompy(
    budowy,
    listaPomp,
    kursy,
    opcje
  );

  assert.deepEqual(
    pobierzIdBudow(pierwszyWynik),
    ["ROWNA-42", "ROWNA-32", "PRZEJAZD-42", "POZNA-32"]
  );
  assert.deepEqual(
    pierwszyWynik.wynikiBudow.map(function (wynikBudowy) {
      return wynikBudowy.kolejnoscPrzydzialuPompy;
    }),
    [1, 2, 3, 4]
  );
  assert.deepEqual(
    pobierzIdPrzydzielonychPomp(pierwszyWynik),
    ["P-42", "P-32", null, "P-32"]
  );

  const pierwszaBudowa = pierwszyWynik.wynikiBudow[0];
  assert.equal(
    pierwszaBudowa.probyKandydatow[0].powodOdrzucenia,
    "pompa-nieaktywna"
  );
  assert.equal(
    pierwszaBudowa.probyKandydatow[1].powodOdrzucenia,
    "niewystarczajacy-wysieg"
  );
  assert.equal(pierwszaBudowa.przydzialPompy.idPompy, "P-42");

  const budowaZPrzejazdem = pierwszyWynik.wynikiBudow[2];
  assert.equal(
    budowaZPrzejazdem.statusPrzydzialuPompy,
    "brak-pasujacej-pompy"
  );
  assert.equal(
    budowaZPrzejazdem.probyKandydatow[2].powodOdrzucenia,
    "pompa-zajeta"
  );
  assert.equal(
    budowaZPrzejazdem.najwczesniejszyMozliwyStart.idPompy,
    "P-42"
  );
  assert.equal(
    budowaZPrzejazdem.najwczesniejszyMozliwyStart
      .minutaNajwczesniejszegoStartuBetonowania,
    575
  );
  assert.equal(
    budowaZPrzejazdem.najwczesniejszyMozliwyStart.przesuniecieStartuMinuty,
    35
  );
  assert.equal(
    budowaZPrzejazdem.najwczesniejszyMozliwyStart.przyczynaOgraniczenia,
    "przejazd-miedzy-budowami"
  );

  const poznaBudowa = pierwszyWynik.wynikiBudow[3];
  assert.equal(poznaBudowa.przydzialPompy.idPompy, "P-32");
  assert.equal(
    poznaBudowa.przydzialPompy.przejazdZPoprzedniejBudowy.czasPrzejazduMinuty,
    20
  );
  assert.equal(pierwszyWynik.liczbaBudowDoPrzydzialu, 4);
  assert.equal(pierwszyWynik.liczbaPrzydzielonychBetonowan, 3);
  assert.equal(pierwszyWynik.liczbaNieprzydzielonychBetonowan, 1);

  assert.equal(JSON.stringify(pierwszyWynik), JSON.stringify(drugiWynik));
  assert.equal(JSON.stringify(budowy), budowyPrzed);
  assert.equal(JSON.stringify(kursy), kursyPrzed);
  assert.equal(JSON.stringify(listaPomp), pompyPrzed);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzPelnePolaczenieRegul4F(pompy);

  console.log(
    "✓ Etap 4F.5: reguły 4F.1–4F.4 współdziałają deterministycznie w jednym scenariuszu integracyjnym."
  );
}

uruchomTesty();
