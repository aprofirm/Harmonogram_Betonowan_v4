"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function pobierzPlikiTekstowe(katalogWzgledny) {
  const katalog = path.join(katalogProjektu, katalogWzgledny);
  const wynik = [];

  fs.readdirSync(katalog, { withFileTypes: true }).forEach(function (wpis) {
    const sciezkaWzgledna = path.join(katalogWzgledny, wpis.name);

    if (wpis.isDirectory()) {
      wynik.push.apply(wynik, pobierzPlikiTekstowe(sciezkaWzgledna));
      return;
    }

    if (/\.(?:js|html|css|ya?ml)$/i.test(wpis.name)) {
      wynik.push(sciezkaWzgledna.replace(/\\/g, "/"));
    }
  });

  return wynik;
}

function sprawdzBrakZnanychFormatowSekretow() {
  const pliki = ["index.html"]
    .concat(pobierzPlikiTekstowe("js"))
    .concat(pobierzPlikiTekstowe(".github"));
  const wzorceSekretow = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
    /\bAIza[0-9A-Za-z_-]{30,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/,
    /\bsk_live_[0-9A-Za-z]{20,}\b/
  ];

  pliki.forEach(function (sciezka) {
    const tresc = wczytaj(sciezka);

    wzorceSekretow.forEach(function (wzorzec) {
      assert.doesNotMatch(
        tresc,
        wzorzec,
        "Plik produkcyjny wygląda jakby zawierał rzeczywisty sekret: " + sciezka
      );
    });
  });
}

function sprawdzKluczMapyTylkoWRuntime() {
  const adapter = wczytaj("js/lokalizacje/adapter_uslug_mapowych.js");
  const aplikacja = wczytaj("js/aplikacja.js");
  const pamiecPlanu = wczytaj("js/pamiec/pamiec_planu.js");
  const diagnostyka = wczytaj("js/diagnostyka/diagnostyka.js");
  const decyzjaDostawcy = wczytaj("DOSTAWCA_MAP_6E1.md");

  assert.match(adapter, /opcje\.kluczApi/);
  assert.match(adapter, /Authorization:\s*kluczApi/);
  assert.doesNotMatch(adapter, /localStorage|sessionStorage/);
  assert.doesNotMatch(aplikacja, /kluczApi\s*:/);
  assert.doesNotMatch(pamiecPlanu, /kluczApi|apiKey|authorization/i);
  assert.doesNotMatch(diagnostyka, /kluczApi|apiKey|authorization/i);
  assert.match(
    decyzjaDostawcy,
    /klucza API \*\*nie wolno zapisywać w repozytorium, historii planu ani logach\*\*/
  );
}

function sprawdzPrywatnoscDanychTestowych() {
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const testOffline = wczytaj("testy/etap_6i_3.test.js");
  const diagnostyka = wczytaj("js/diagnostyka/diagnostyka.js");

  assert.match(
    planTestow,
    /Rzeczywiste adresy użyte przez operatora nie trafiają do testów ani historii/
  );
  assert.match(testOffline, /Testowa|testow/i);
  assert.doesNotMatch(testOffline, /Świebodzice|Wałbrzych|Wrocław/i);
  assert.doesNotMatch(diagnostyka, /trescCsv|treśćCsv|surowyCsv/i);
}

function sprawdzSciezkePublikacji() {
  const workflow = wczytaj(".github/workflows/testy.yml");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /for plik in testy\/\*\.test\.js; do/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6J\.2/);
  assert.match(stan, /6J\.1–6J\.2/);
  assert.match(stan, /Rozpocząć \*\*6J\.3/);
  assert.match(stan, /124\/124 zestawów testów/);
}

sprawdzBrakZnanychFormatowSekretow();
sprawdzKluczMapyTylkoWRuntime();
sprawdzPrywatnoscDanychTestowych();
sprawdzSciezkePublikacji();

console.log(
  "OK — 6J.2 pilnuje bezpiecznej publikacji: brak sekretów w kodzie, klucz mapy tylko w runtime, prywatne dane poza testami i publikacja z main po pełnej regresji."
);
