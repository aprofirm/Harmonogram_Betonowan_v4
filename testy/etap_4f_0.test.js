"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajModulPomp() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  ["js/pompy/pompy.js", "js/pompy/dostepnosc_pomp.js"].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan.pompy;
}

function sprawdzPusteOkno(pompy) {
  const lista = pompy.dopasujLiczbePomp([], 1, "06:00");

  assert.equal(lista.length, 1);
  assert.equal(lista[0].dostepnaOd, null);
  assert.equal(lista[0].dostepnaDo, null);
  assert.equal(lista[0].wysiegMetry, 32);

  const wynik = pompy.sprawdzDostepnoscPompyDlaCyklu(lista[0], 0, 1400);
  assert.equal(wynik.czyMozeRozpoczac, true);
  assert.equal(wynik.czyPrzekraczaDostepnosc, false);
  assert.equal(wynik.przekroczenieDostepnosciMinuty, 0);
}

function sprawdzDostepnaOd(pompy) {
  const pompa = pompy.normalizujListePomp([{
    idPompy: "P-OD",
    nazwa: "Pompa od 08:00",
    aktywna: true,
    dostepnaOd: "08:00",
    dostepnaDo: "",
    wysiegMetry: 32
  }])[0];

  assert.equal(
    pompy.sprawdzDostepnoscPompyDlaCyklu(pompa, 479, 600).powodBrakuDostepnosci,
    "przed-dostepnoscia"
  );
  assert.equal(
    pompy.sprawdzDostepnoscPompyDlaCyklu(pompa, 480, 900).czyMozeRozpoczac,
    true
  );
}

function sprawdzDostepnaDoIDokonczenie(pompy) {
  const pompa = pompy.normalizujListePomp([{
    idPompy: "P-DO",
    nazwa: "Pompa do 15:00",
    aktywna: true,
    dostepnaOd: "",
    dostepnaDo: "15:00",
    wysiegMetry: 32
  }])[0];

  const naGranicy = pompy.sprawdzDostepnoscPompyDlaCyklu(pompa, 900, 950);
  assert.equal(naGranicy.czyMozeRozpoczac, true);
  assert.equal(naGranicy.czyPrzekraczaDostepnosc, true);
  assert.equal(naGranicy.przekroczenieDostepnosciMinuty, 50);
  assert.equal(naGranicy.czyWymagaInformacji, true);

  const poGranicy = pompy.sprawdzDostepnoscPompyDlaCyklu(pompa, 901, 950);
  assert.equal(poGranicy.czyMozeRozpoczac, false);
  assert.equal(poGranicy.powodBrakuDostepnosci, "po-dostepnosci");
  assert.equal(poGranicy.przekroczenieDostepnosciMinuty, 0);
}

function sprawdzPelneOknoIWysieg(pompy) {
  const lista = pompy.normalizujListePomp([{
    idPompy: "P-42",
    nazwa: "Pompa 42 m",
    typ: "zewnetrzna",
    aktywna: true,
    dostepnaOd: "07:00",
    dostepnaDo: "15:00",
    wysiegMetry: 42
  }]);

  assert.equal(lista[0].typ, "zewnetrzna");
  assert.equal(lista[0].wysiegMetry, 42);
  assert.equal(
    pompy.pobierzPompyAktywneDoPrzydzialu(lista)[0].idPompy,
    "P-42"
  );
  assert.equal(
    pompy.sprawdzDostepnoscPompyDlaCyklu(lista[0], 419, 500).czyMozeRozpoczac,
    false
  );
  assert.equal(
    pompy.sprawdzDostepnoscPompyDlaCyklu(lista[0], 420, 900).czyMozeRozpoczac,
    true
  );

  const kopia = pompy.skopiujListePomp(lista);
  assert.equal(kopia[0].dostepnaDo, "15:00");
  assert.equal(kopia[0].wysiegMetry, 42);
}

function sprawdzWalidacje(pompy) {
  assert.throws(function () {
    pompy.normalizujListePomp([{
      idPompy: "P-BLAD",
      dostepnaOd: "8:00",
      wysiegMetry: 32
    }]);
  }, /HH:MM/i);

  assert.throws(function () {
    pompy.normalizujListePomp([{
      idPompy: "P-ZAKRES",
      dostepnaOd: "16:00",
      dostepnaDo: "15:00",
      wysiegMetry: 32
    }]);
  }, /wcześniejsza/i);
}

function sprawdzPanelIUruchamianie() {
  const index = wczytaj("index.html");
  const interfejsDostepnosci = wczytaj("js/interfejs/dostepnosc_pomp.js");
  const pozycjaBazowegoModelu = index.indexOf("js/pompy/pompy.js");
  const pozycjaDostepnosciModelu = index.indexOf("js/pompy/dostepnosc_pomp.js");
  const pozycjaPrzejazdow = index.indexOf("js/pompy/przejazdy_pomp.js");
  const pozycjaBazowegoInterfejsu = index.indexOf("js/interfejs/interfejs.js");
  const pozycjaDostepnosciInterfejsu = index.indexOf("js/interfejs/dostepnosc_pomp.js");
  const pozycjaAplikacji = index.indexOf("js/aplikacja.js");

  assert.ok(pozycjaBazowegoModelu >= 0);
  assert.ok(pozycjaDostepnosciModelu > pozycjaBazowegoModelu);
  assert.ok(pozycjaPrzejazdow > pozycjaDostepnosciModelu);
  assert.ok(pozycjaBazowegoInterfejsu >= 0);
  assert.ok(pozycjaDostepnosciInterfejsu > pozycjaBazowegoInterfejsu);
  assert.ok(pozycjaAplikacji > pozycjaDostepnosciInterfejsu);
  assert.match(interfejsDostepnosci, /Dostępna od/);
  assert.match(interfejsDostepnosci, /Dostępna do/);
  assert.match(interfejsDostepnosci, /Wysięg \(m\)/);
  assert.match(interfejsDostepnosci, /puste Od\/Do = bez ograniczeń/);
  assert.doesNotMatch(interfejsDostepnosci, /utworzPoleKartyPompy\("Typ"/);
}

function uruchomTesty() {
  const pompy = wczytajModulPomp();

  sprawdzPusteOkno(pompy);
  sprawdzDostepnaOd(pompy);
  sprawdzDostepnaDoIDokonczenie(pompy);
  sprawdzPelneOknoIWysieg(pompy);
  sprawdzWalidacje(pompy);
  sprawdzPanelIUruchamianie();

  console.log(
    "✓ Etap 4F.0: puste Od/Do, granice dostępności, dokończenie rozpoczętej budowy i panel pomp działają poprawnie."
  );
}

uruchomTesty();
