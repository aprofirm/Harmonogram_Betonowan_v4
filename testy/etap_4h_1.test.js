"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajLogikePomp() {
  const kontekst = {
    window: {}
  };

  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/pompy/pompy.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

const html = wczytaj("index.html");
const interfejs = wczytaj("js/interfejs/interfejs.js");
const aplikacjaKod = wczytaj("js/aplikacja.js");
const aplikacja = wczytajLogikePomp();

assert.equal(aplikacja.konfiguracja.parametryDomyslne.trybPomp, "oblicz-potrzebne");
assert.equal(aplikacja.konfiguracja.parametryDomyslne.liczbaDostepnychPomp, null);

assert.match(
  html,
  /id="tryb-pomp"[\s\S]*value="oblicz-potrzebne">Oblicz, ile potrzeba<[\s\S]*value="mam-okreslona-liczbe">Mam określoną liczbę</
);
assert.match(
  html,
  /id="liczba-dostepnych-pomp"[^>]*type="number"[^>]*min="0"[^>]*step="1"/
);

assert.match(
  interfejs,
  /function aktualizujDostepnoscPolaLiczbyPomp\(\)[\s\S]*trybPomp\.value === "mam-okreslona-liczbe"[\s\S]*liczbaDostepnychPomp\.disabled = !czyOkreslonaLiczbaPomp[\s\S]*liczbaDostepnychPomp\.required = czyOkreslonaLiczbaPomp/
);
assert.match(
  interfejs,
  /trybPomp !== "oblicz-potrzebne"[\s\S]*trybPomp !== "mam-okreslona-liczbe"[\s\S]*Wybierz poprawny tryb pracy pomp/
);
assert.match(
  interfejs,
  /trybPomp === "mam-okreslona-liczbe"[\s\S]*Liczba dostępnych pomp” nie może być puste[\s\S]*pobierzLiczbe\([\s\S]*"Liczba dostępnych pomp",[\s\S]*0[\s\S]*Number\.isInteger\(liczbaDostepnychPomp\)[\s\S]*Liczba dostępnych pomp musi być liczbą całkowitą/
);
assert.match(
  interfejs,
  /liczbaDostepnychPomp:[\s\S]*trybPomp\.value === "mam-okreslona-liczbe"[\s\S]*liczbaDostepnychPomp\.value[\s\S]*: null/
);
assert.match(
  interfejs,
  /elementy\.trybPomp\.addEventListener\("change"[\s\S]*aktualizujDostepnoscPolaLiczbyPomp\(\)[\s\S]*obslugaZmianyParametrowAplikacji\(pobierzWartosciParametrowDoZapisu\(\)\)/
);

assert.match(
  aplikacjaKod,
  /dane\.trybPomp === "mam-okreslona-liczbe"[\s\S]*czyPoprawnaLiczbaPompDoUtworzenia\(dane\.liczbaDostepnychPomp\)[\s\S]*dopasujLiczbePomp/
);

const brakPomp = aplikacja.pompy.dopasujLiczbePomp([], 0, "07:00");
assert.equal(brakPomp.length, 0);

const dwiePompy = aplikacja.pompy.dopasujLiczbePomp([], 2, "07:00");
assert.equal(dwiePompy.length, 2);
assert.deepEqual(
  Array.from(dwiePompy, function (pompa) {
    return pompa.idPompy;
  }),
  ["POMPA-001", "POMPA-002"]
);

assert.throws(function () {
  aplikacja.pompy.dopasujLiczbePomp([], -1, "07:00");
}, /nieujemną liczbę całkowitą/i);

assert.throws(function () {
  aplikacja.pompy.dopasujLiczbePomp([], 1.5, "07:00");
}, /nieujemną liczbę całkowitą/i);

console.log(
  "✓ Etap 4H.1: oba tryby pomp są dostępne, a ograniczona liczba akceptuje wyłącznie całkowite wartości od 0 wzwyż."
);
