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
    "js/pompy/minimalna_liczba_pomp.js"
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
    wymaganyWysiegPompyMetry: 32,
    czasPrzygotowaniaPompyRoboczyMinuty: null,
    czasZakonczeniaObslugiPompyRoboczyMinuty: null
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

function oblicz(pompy, definicje) {
  const budowy = definicje.map(function (definicja) {
    return utworzBudowe(definicja.idBudowy, definicja.daneBudowy);
  });
  const kursy = definicje.map(function (definicja) {
    return utworzKurs(
      definicja.idBudowy,
      definicja.minutaStartu,
      definicja.minutaKonca
    );
  });

  return pompy.obliczMinimalnaLiczbePomp(budowy, kursy);
}

function sprawdzZgodnoscPrzydzialow(wynik) {
  assert.equal(
    wynik.przydzialyTechniczne.length,
    wynik.liczbaBudowDoPrzydzialu
  );
  assert.equal(wynik.pompyTechniczne.length, wynik.minimalnaLiczbaPomp);

  const numeryUzytychPomp = Array.from(new Set(
    wynik.przydzialyTechniczne.map(function (przydzial) {
      return przydzial.numerPompyTechnicznej;
    })
  )).sort(function (a, b) {
    return a - b;
  });

  assert.deepEqual(
    numeryUzytychPomp,
    Array.from({ length: wynik.minimalnaLiczbaPomp }, function (_, indeks) {
      return indeks + 1;
    })
  );

  wynik.pompyTechniczne.forEach(function (pompaTechniczna) {
    const przydzialyPompy = wynik.przydzialyTechniczne
      .filter(function (przydzial) {
        return przydzial.numerPompyTechnicznej ===
          pompaTechniczna.numerPompyTechnicznej;
      })
      .sort(function (lewy, prawy) {
        return lewy.okresZajetosci.minutaRozpoczeciaZajetosci -
          prawy.okresZajetosci.minutaRozpoczeciaZajetosci;
      });

    assert.equal(przydzialyPompy.length, pompaTechniczna.liczbaPrzydzialow);
    assert.ok(przydzialyPompy.length > 0);

    for (let indeks = 1; indeks < przydzialyPompy.length; indeks += 1) {
      const poprzedni = przydzialyPompy[indeks - 1].okresZajetosci;
      const kolejny = przydzialyPompy[indeks].okresZajetosci;

      assert.ok(
        poprzedni.minutaZakonczeniaZajetosci <=
          kolejny.minutaRozpoczeciaZajetosci,
        "Techniczne przydziały jednej pompy nie mogą się nakładać."
      );
    }
  });
}

function sprawdzZeroPomp(pompy) {
  const wynik = pompy.obliczMinimalnaLiczbePomp(
    [utworzBudowe("LEJ", { rodzajRozladunku: "lej" })],
    [utworzKurs("LEJ", 480, 495)]
  );

  assert.equal(wynik.minimalnaLiczbaPomp, 0);
  assert.equal(wynik.liczbaBudowDoPrzydzialu, 0);
  sprawdzZgodnoscPrzydzialow(wynik);
}

function sprawdzJednaPompe(pompy) {
  const wynik = oblicz(pompy, [
    { idBudowy: "A", minutaStartu: 480, minutaKonca: 495 },
    { idBudowy: "B", minutaStartu: 545, minutaKonca: 560 },
    { idBudowy: "C", minutaStartu: 610, minutaKonca: 625 }
  ]);

  assert.equal(wynik.minimalnaLiczbaPomp, 1);
  assert.deepEqual(
    Array.from(wynik.przydzialyTechniczne, function (przydzial) {
      return przydzial.numerPompyTechnicznej;
    }),
    [1, 1, 1]
  );
  sprawdzZgodnoscPrzydzialow(wynik);
}

function sprawdzWielePomp(pompy) {
  const wynik = oblicz(pompy, [
    { idBudowy: "A", minutaStartu: 480, minutaKonca: 495 },
    { idBudowy: "B", minutaStartu: 490, minutaKonca: 505 },
    { idBudowy: "C", minutaStartu: 500, minutaKonca: 515 },
    { idBudowy: "D", minutaStartu: 545, minutaKonca: 560 }
  ]);

  assert.equal(wynik.minimalnaLiczbaPomp, 3);
  assert.deepEqual(
    Array.from(wynik.przydzialyTechniczne, function (przydzial) {
      return przydzial.numerPompyTechnicznej;
    }),
    [1, 2, 3, 1]
  );
  sprawdzZgodnoscPrzydzialow(wynik);
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzZeroPomp(pompy);
  sprawdzJednaPompe(pompy);
  sprawdzWielePomp(pompy);

  console.log(
    "✓ Etap 4G.3: wyniki 0, 1 i wielu pomp są zgodne z technicznymi przydziałami bez nakładania pracy jednej pompy."
  );
}

uruchomTesty();
