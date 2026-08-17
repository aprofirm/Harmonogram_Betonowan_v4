"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {},
    Promise: Promise
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/import/import_csv.js",
    "js/budowy/budowy.js",
    "js/pompy/pompy.js",
    "js/gruszki/gruszki.js",
    "js/lokalizacje/lokalizacje.js",
    "js/budowy/rodzaj_rozladunku.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzRzeczywistyUkladKdx(aplikacja) {
  const csv = [
    ";K.-Nazwa;Budowa;Czas rozładunku;Nazwa materiału;Zam-o (mój zakład);Rodzaj rozładunku",
    "Normal;\"DUR-BUD\" Maciej Durko;odbiory własne WBT Świebodzice;06:20;C20/25 X0 Dmax8 Cl 1.0 V0;1,0 m3;",
    "Normal;Małgorzata Gabryańczyk;Dostawa Walim;07:30;C20/25 XC1 Dmax8 Cl 0.40 S4;3,0 m3;Pompa"
  ].join("\n");

  const stan = aplikacja.importCsv.przetworzCsv(csv, "rzeczywisty-kdx.csv");
  const odbior = stan.budowy[0];
  const dostawa = stan.budowy[1];

  assert.equal(odbior.rodzajRozladunku, "odbior-wlasny");
  assert.equal(aplikacja.budowy.czyOdbiorWlasny(odbior), true);
  assert.equal(dostawa.rodzajRozladunku, "pompa");
  assert.deepEqual(Array.from(aplikacja.gruszki.generujKursyDlaBudowy(odbior, 8)), []);
  assert.equal(
    aplikacja.lokalizacje.uzupelnijBudoweZPamieci(odbior).status,
    "pominieto-odbior-wlasny"
  );
}

function sprawdzRozdzielenieModulow() {
  const interfejsRozladunku = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/rodzaj_rozladunku.js"),
    "utf8"
  );
  const interfejsOdstepu = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/odstep_dostaw.js"),
    "utf8"
  );
  const css = fs.readFileSync(
    path.join(katalogProjektu, "style/rodzaj_rozladunku.css"),
    "utf8"
  );

  assert.match(interfejsRozladunku, /Odbiory własne/);
  assert.match(interfejsRozladunku, /POZA AUTOMATYCZNYM HARMONOGRAMEM/);
  assert.match(interfejsRozladunku, /wiersze-odbiorow-wlasnych/);
  assert.match(interfejsRozladunku, /nie wymagają czasów przejazdu/i);
  assert.match(interfejsRozladunku, /closest\("\.pole-formularza"\)/);
  assert.match(interfejsRozladunku, /rodzajRozladunku/);
  assert.doesNotMatch(interfejsOdstepu, /Odbiory własne/);
  assert.doesNotMatch(interfejsOdstepu, /rodzajRozladunku/);
  assert.match(css, /\.panel-odbiorow-wlasnych/);
  assert.match(css, /\.tabela-odbiorow-wlasnych/);
}

const aplikacja = wczytajAplikacje();
sprawdzRzeczywistyUkladKdx(aplikacja);
sprawdzRozdzielenieModulow();

console.log(
  "✓ Odbiór własny z rzeczywistego KDX jest poza harmonogramem, a interfejs ma osobny moduł."
);
