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

function utworzBudowe(idBudowy) {
  return {
    idBudowy: idBudowy,
    budowa: "Budowa " + idBudowy,
    rodzajRozladunku: "pompa",
    iloscBetonuLiczbaM3: 8,
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

function utworzDaneTestowe() {
  return {
    budowaA: utworzBudowe("BUDOWA-A"),
    budowaB: utworzBudowe("BUDOWA-B"),
    kursy: [
      utworzKurs("BUDOWA-A", 480, 495),
      utworzKurs("BUDOWA-B", 555, 570)
    ]
  };
}

function sprawdzBrakTrasy(pompy) {
  const dane = utworzDaneTestowe();

  assert.throws(function () {
    pompy.wyznaczPrzejazdPompyMiedzyBudowami(
      dane.budowaA,
      dane.budowaB,
      dane.kursy,
      {}
    );
  }, /BUDOWA-A → BUDOWA-B.*Uzupełnij czas ręcznie/i);

  assert.throws(function () {
    pompy.wyznaczPrzejazdPompyMiedzyBudowami(
      dane.budowaA,
      dane.budowaB,
      dane.kursy,
      { czasPrzejazduMinuty: -1 }
    );
  }, /BUDOWA-A → BUDOWA-B.*liczbą nie mniejszą niż 0/i);
}

function sprawdzTraseZerowa(pompy) {
  const dane = utworzDaneTestowe();
  const przejazd = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    dane.budowaA,
    dane.budowaB,
    dane.kursy,
    {
      czasPrzejazduMinuty: 0,
      zrodloCzasuPrzejazdu: "reczny"
    }
  );

  assert.equal(przejazd.czasPrzejazduMinuty, 0);
  assert.equal(przejazd.minutaWyjazduZBudowy, 525);
  assert.equal(przejazd.minutaPrzyjazduNaBudowe, 525);
  assert.equal(przejazd.minutaGotowosciDoBetonowaniaPoPrzejezdzie, 545);
  assert.equal(przejazd.minutaPlanowanegoStartuBetonowania, 555);
  assert.equal(przejazd.minutaNajwczesniejszegoStartuBetonowania, 555);
  assert.equal(przejazd.opoznienieStartuPrzezPrzejazdMinuty, 0);
  assert.equal(przejazd.czyPrzejazdWymuszaPozniejszyStart, false);
  assert.equal(przejazd.przyczynaOgraniczeniaPrzejazdu, null);
}

function sprawdzRozneCzasyWKierunkach(pompy) {
  const dane = utworzDaneTestowe();
  const przejazdAB = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    dane.budowaA,
    dane.budowaB,
    dane.kursy,
    { czasPrzejazduMinuty: 18, zrodloCzasuPrzejazdu: "pamiec" }
  );
  const przejazdBA = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    dane.budowaB,
    dane.budowaA,
    dane.kursy,
    { czasPrzejazduMinuty: 31, zrodloCzasuPrzejazdu: "pamiec" }
  );

  assert.equal(przejazdAB.idBudowyZrodlowej, "BUDOWA-A");
  assert.equal(przejazdAB.idBudowyDocelowej, "BUDOWA-B");
  assert.equal(przejazdAB.czasPrzejazduMinuty, 18);

  assert.equal(przejazdBA.idBudowyZrodlowej, "BUDOWA-B");
  assert.equal(przejazdBA.idBudowyDocelowej, "BUDOWA-A");
  assert.equal(przejazdBA.czasPrzejazduMinuty, 31);
  assert.notEqual(
    przejazdAB.czasPrzejazduMinuty,
    przejazdBA.czasPrzejazduMinuty
  );
}

function sprawdzPozniejszyStartPrzezPrzejazd(pompy) {
  const dane = utworzDaneTestowe();
  const przejazd = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
    dane.budowaA,
    dane.budowaB,
    dane.kursy,
    {
      czasPrzejazduMinuty: 25,
      zrodloCzasuPrzejazdu: "pamiec"
    }
  );

  assert.equal(przejazd.minutaWyjazduZBudowy, 525);
  assert.equal(przejazd.minutaPrzyjazduNaBudowe, 550);
  assert.equal(przejazd.minutaPlanowanegoRozpoczeciaPrzygotowania, 535);
  assert.equal(przejazd.opoznieniePrzygotowaniaPrzezPrzejazdMinuty, 15);
  assert.equal(przejazd.minutaGotowosciDoBetonowaniaPoPrzejezdzie, 570);
  assert.equal(przejazd.minutaPlanowanegoStartuBetonowania, 555);
  assert.equal(przejazd.minutaNajwczesniejszegoStartuBetonowania, 570);
  assert.equal(przejazd.opoznienieStartuPrzezPrzejazdMinuty, 15);
  assert.equal(przejazd.czyMoznaRozpoczacPrzygotowanieZgodnieZPlanem, false);
  assert.equal(przejazd.czyPrzejazdWymuszaPozniejszyStart, true);
  assert.equal(
    przejazd.przyczynaOgraniczeniaPrzejazdu,
    "przejazd-miedzy-budowami"
  );
}

function sprawdzDolaczenieModuluDoAplikacji() {
  const html = fs.readFileSync(
    path.join(katalogProjektu, "index.html"),
    "utf8"
  );
  const indeksModuluPomp = html.indexOf(
    'src="js/pompy/pompy.js"'
  );
  const indeksPrzejazdow = html.indexOf(
    'src="js/pompy/przejazdy_pomp.js"'
  );
  const indeksGruszek = html.indexOf(
    'src="js/gruszki/gruszki.js"'
  );

  assert.ok(indeksModuluPomp >= 0, "Brakuje modułu pomp w index.html.");
  assert.ok(indeksPrzejazdow >= 0, "Brakuje modułu przejazdów pomp w index.html.");
  assert.ok(indeksGruszek >= 0, "Brakuje modułu gruszek w index.html.");
  assert.ok(
    indeksModuluPomp < indeksPrzejazdow && indeksPrzejazdow < indeksGruszek,
    "Moduł przejazdów pomp musi być wczytany po pompy.js i przed dalszym silnikiem."
  );
}

function uruchomTesty() {
  const pompy = wczytajModulyPomp();

  sprawdzBrakTrasy(pompy);
  sprawdzTraseZerowa(pompy);
  sprawdzRozneCzasyWKierunkach(pompy);
  sprawdzPozniejszyStartPrzezPrzejazd(pompy);
  sprawdzDolaczenieModuluDoAplikacji();

  console.log(
    "✓ Etap 4E.4: przypadki brzegowe przejazdów pomp i skutek późniejszego startu działają poprawnie."
  );
}

uruchomTesty();
