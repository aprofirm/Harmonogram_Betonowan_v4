"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

const html = wczytaj("index.html");
const interfejs = wczytaj("js/interfejs/interfejs.js");
const interfejsRozladunku = wczytaj("js/interfejs/rodzaj_rozladunku.js");
const aplikacja = wczytaj("js/aplikacja.js");
const pompy = wczytaj("js/pompy/pompy.js");
const style = wczytaj("style/glowny.css");
const styleRozladunku = wczytaj("style/rodzaj_rozladunku.css");

assert.match(html, /STEROWANIE ZASOBAMI/);
assert.match(
  html,
  /id="tryb-gruszek"[\s\S]*id="tryb-pomp"[\s\S]*id="lista-pomp"/
);
assert.match(html, /id="minimalna-liczba-pomp">—<\/span>/);
assert.match(html, /id="liczba-dostepnych-pomp-wynik">—<\/span>/);
assert.equal((html.match(/id="tryb-pomp"/g) || []).length, 1);

assert.match(interfejs, /function pokazListePomp/);
assert.match(interfejs, /Dostępna od/);
assert.match(interfejs, /Wysięg \(m\)/);
assert.match(interfejs, /karta-pompy__aktywna/);
assert.match(aplikacja, /listaPomp: aplikacja\.pompy\.skopiujListePomp/);
assert.match(aplikacja, /"wymaganyWysiegPompyMetry"/);
assert.match(aplikacja, /"czasPrzygotowaniaPompyRoboczyMinuty"/);
assert.match(aplikacja, /"czasZakonczeniaObslugiPompyRoboczyMinuty"/);
assert.match(pompy, /DOMYSLNY_WYSIEG_POMPY_METRY = 32/);
assert.match(pompy, /DOMYSLNY_CZAS_PRZYGOTOWANIA_POMPY_MINUTY = 20/);
assert.match(pompy, /DOMYSLNY_CZAS_ZAKONCZENIA_OBSLUGI_POMPY_MINUTY = 30/);

assert.match(interfejsRozladunku, /wymagany-wysieg-pompy/);
assert.match(interfejsRozladunku, /Większa pompa/);
assert.match(interfejsRozladunku, /rodzaj-rozladunku-budowy--pompa/);
assert.match(interfejsRozladunku, /etykietaWysiegu\.hidden = !czyWiekszaPompa/);
assert.match(interfejsRozladunku, /obslugaZmianyWymaganegoWysieguPompy/);
assert.match(interfejsRozladunku, /Inne czasy/);
assert.match(interfejsRozladunku, /czasPrzygotowaniaPompyRoboczyMinuty/);
assert.match(interfejsRozladunku, /czasZakonczeniaObslugiPompyRoboczyMinuty/);
assert.match(style, /\.karta-pompy/);
assert.match(styleRozladunku, /\.wymagany-wysieg-pompy/);
assert.match(styleRozladunku, /\.wieksza-pompa/);
assert.match(styleRozladunku, /\.czasy-obslugi-pompy/);

console.log(
  "✓ Panel pomp: zasoby, dostępność, wysięg i wymaganie budowy są połączone z pamięcią planu."
);
