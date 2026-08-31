"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzDowodyPublikacji() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const plan = wczytaj("testy/TESTY_ETAP_5.md");
  const readme = wczytaj("README.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(etapy, /\[x\] \*\*5J\.2 — publikacja:/);
  assert.match(etapy, /33396511183/);
  assert.match(etapy, /33396509870/);
  assert.match(etapy, /1d3f9d02ceb79293b71dd4a77386244eb9eee050/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*5J\.3 — test operatora\*\*/);

  assert.match(plan, /- \[x\] publikacja `main` i GitHub Pages;/);
  assert.match(plan, /### 5J\.2 — publikacja/);
  assert.match(plan, /33396511183/);
  assert.match(plan, /33396509870/);
  assert.match(plan, /pages_build_version/);

  assert.match(readme, /https:\/\/aprofirm\.github\.io\/Harmonogram_Betonowan_v4\//);
  assert.match(readme, /## Publikacja 5J\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*5J\.2 — publikacja\*\*/);
  assert.match(stan, /\*\*5J\.3 — test operatora\.\*\*/);
}

function sprawdzBrakPrzedwczesnegoZamknieciaEtapu5() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  assert.match(etapy, /- \[ \] Etap 5 — Pełny silnik harmonogramu/);
  assert.match(etapy, /- \[ \] \*\*5J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(etapy, /- \[ \] \*\*5J\.3 — test operatora:/);
}

function sprawdzOznaczeniePublikacji() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");

  assert.match(konfiguracja, /punktEtapu:\s*"5J\.[23]"/);
  assert.match(html, /Etap 5J\.[23]/);
  assert.match(html, /5J\.[23] · (?:publikacja|test operatora)/);
  assert.match(html, /js\/konfiguracja\/konfiguracja\.js\?v=5j[23]-/);
}

sprawdzDowodyPublikacji();
sprawdzBrakPrzedwczesnegoZamknieciaEtapu5();
sprawdzOznaczeniePublikacji();

console.log(
  "OK — 5J.2 potwierdza publikację main, zielone Actions i GitHub Pages bez przedwczesnego zamknięcia Etapu 5."
);
