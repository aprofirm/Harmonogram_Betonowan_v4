"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzIstnieniePlikow(listaPlikow) {
  listaPlikow.forEach(function (sciezka) {
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje obowiązkowego testu regresji 4J.1: " + sciezka
    );
  });
}

function sprawdzRegresjePrzekrojowa() {
  sprawdzIstnieniePlikow([
    "testy/etap_2.test.js",
    "testy/kdx_zmienne_kolumny.test.js",
    "testy/rodzaj_rozladunku.test.js",
    "testy/odbior_wlasny_tabela.test.js",
    "testy/pamiec_planu.test.js",
    "testy/pamiec_aplikacji.test.js",
    "testy/pamiec_tras.test.js",
    "testy/pamiec_tras_integracja.test.js",
    "testy/etap_3a.test.js",
    "testy/etap_3b_1.test.js",
    "testy/etap_3b_2.test.js",
    "testy/etap_3c.test.js",
    "testy/etap_3c_integracja.test.js",
    "testy/etap_3d.test.js",
    "testy/etap_3e.test.js",
    "testy/etap_4a_1.test.js",
    "testy/etap_4a_2.test.js",
    "testy/etap_4a_3.test.js",
    "testy/etap_4b_2.test.js",
    "testy/etap_4b_3.test.js",
    "testy/panel_pomp.test.js",
    "testy/etap_4d_1.test.js",
    "testy/etap_4d_2.test.js",
    "testy/etap_4d_3.test.js",
    "testy/etap_4e_1.test.js",
    "testy/etap_4e_2.test.js",
    "testy/etap_4e_3.test.js",
    "testy/etap_4e_4.test.js",
    "testy/etap_4f_0.test.js",
    "testy/etap_4f_5.test.js",
    "testy/etap_4g_3.test.js",
    "testy/etap_4h_5.test.js",
    "testy/etap_4i_1.test.js",
    "testy/etap_4i_2.test.js",
    "testy/etap_4i_3.test.js",
    "testy/etap_4i_4.test.js",
    "testy/etap_4i_5.test.js"
  ]);
}

function sprawdzPelnyRunner() {
  const workflow = wczytaj(".github/workflows/testy.yml");
  assert.match(workflow, /set -euo pipefail/);
  assert.match(workflow, /for plik in testy\/\*\.test\.js; do/);
  assert.match(workflow, /node "\$plik"/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[main\]/);
}

function sprawdzGraniceEtapu4() {
  const plikiPomp = fs.readdirSync(path.join(katalogProjektu, "js/pompy"))
    .filter(function (nazwa) {
      return nazwa.endsWith(".js");
    });

  plikiPomp.forEach(function (nazwa) {
    const kod = wczytaj(path.join("js/pompy", nazwa));
    assert.doesNotMatch(
      kod,
      /\.startRoboczy\s*=/,
      "Etap 4 nie może zmieniać StartRoboczy w module: " + nazwa
    );
  });
}

function sprawdzStatus4J1() {
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const html = wczytaj("index.html");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_4.md");

  assert.match(konfiguracja, /punktEtapu:\s*"4J\.1"/);
  assert.match(html, /Etap 4J\.1/);
  assert.match(html, /4J\.1 · pełna regresja automatyczna/);
  assert.match(etapy, /\[x\] \*\*4J\.1 — testy automatyczne:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*4J\.2 — publikacja\*\*/);
  assert.match(etapy, /- \[ \] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(planTestow, /### 4J\.1 — pełna regresja automatyczna/);
  assert.doesNotMatch(planTestow, /Następny podetap to \*\*4G\.3/);
}

sprawdzRegresjePrzekrojowa();
sprawdzPelnyRunner();
sprawdzGraniceEtapu4();
sprawdzStatus4J1();

console.log(
  "OK — 4J.1 potwierdza kompletność automatycznej regresji całego Etapu 4 i wcześniejszych funkcji."
);
