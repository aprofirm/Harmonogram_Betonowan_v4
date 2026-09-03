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
  assert.match(etapy, /5J\.3 — test operatora zaliczony/);

  assert.match(plan, /- \[x\] publikacja `main` i GitHub Pages;/);
  assert.match(plan, /### 5J\.2 — publikacja/);
  assert.match(plan, /33396511183/);
  assert.match(plan, /33396509870/);
  assert.match(plan, /pages_build_version/);

  assert.match(readme, /https:\/\/aprofirm\.github\.io\/Harmonogram_Betonowan_v4\//);
  assert.match(readme, /## Publikacja 5J\.2/);
  assert.match(stan, /## Wynik testu operatora 5J\.3 — 2026-09-02/);
  assert.match(stan, /Cały \*\*Etap 5[\s\S]*?jest zakończony/i);
}

function sprawdzZamknieciePoTescieOperatora() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  assert.match(etapy, /- \[x\] Etap 5 — Pełny silnik harmonogramu/);
  assert.match(etapy, /- \[x\] \*\*5J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(etapy, /- \[x\] \*\*5J\.3 — test operatora:/);
}

function sprawdzTrwaleDowody5J2() {
  const readme = wczytaj("README.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(readme, /## Publikacja 5J\.2/);
  assert.match(stan, /## Potwierdzenie końcowej publikacji 5J\.2/);
  assert.match(stan, /GitHub Actions `Testy automatyczne`/);
  assert.match(stan, /GitHub Pages/);
}

sprawdzDowodyPublikacji();
sprawdzZamknieciePoTescieOperatora();
sprawdzTrwaleDowody5J2();

console.log(
  "OK — 5J.2 zachowuje dowody publikacji, a Etap 5 jest zamknięty dopiero po zaliczeniu 5J.3."
);
