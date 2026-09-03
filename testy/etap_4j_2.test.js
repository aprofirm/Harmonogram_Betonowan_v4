"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzStatusPublikacji() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const readme = wczytaj("README.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_4.md");

  assert.match(konfiguracja, /punktEtapu:\s*"\d+[A-Z](?:\.\d+)+"/);
  assert.match(html, /class="znacznik-etapu">Etap \d+[A-Z](?:\.\d+)+<\/span>/);
  assert.match(etapy, /\[x\] \*\*4J\.2 — publikacja:/);
  assert.match(
    etapy,
    /Następny niezakończony podetap: \*\*4J\.3 — test operatora\*\*/
  );
  assert.match(
    etapy,
    /- \[x\] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/
  );
  assert.match(
    etapy,
    /- \[x\] Etap 4 — Pompy — \*\*zakończony 2026-08-30;/
  );
  assert.match(readme, /https:\/\/aprofirm\.github\.io\/Harmonogram_Betonowan_v4\//);
  assert.match(planTestow, /### 4J\.2 — publikacja/);
  assert.match(planTestow, /33270058614/);
  assert.match(planTestow, /33270057938/);
}

function sprawdzGraniceEtapu4() {
  const katalogPomp = path.join(katalogProjektu, "js/pompy");

  fs.readdirSync(katalogPomp)
    .filter(function (nazwa) {
      return nazwa.endsWith(".js");
    })
    .forEach(function (nazwa) {
      const kod = wczytaj(path.join("js/pompy", nazwa));
      assert.doesNotMatch(
        kod,
        /\.startRoboczy\s*=/,
        "Zamknięty Etap 4 nie może przekroczyć swojej granicy w module: " + nazwa
      );
    });
}

sprawdzStatusPublikacji();
sprawdzGraniceEtapu4();

console.log(
  "OK — 4J.2 zachowuje historyczny test publikacji po zamknięciu całego Etapu 4."
);
