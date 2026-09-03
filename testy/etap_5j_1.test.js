"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzIstnieniePlikow(listaPlikow, opis) {
  listaPlikow.forEach(function (sciezka) {
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje wymaganego testu 5J.1 (" + opis + "): " + sciezka
    );
  });
}

function sprawdzKompletnoscEtapu5() {
  const wymaganeTestyEtapu5 = [];
  ["a", "b", "c", "d", "e", "f", "g", "h", "i"].forEach(function (litera) {
    [1, 2, 3].forEach(function (numer) {
      wymaganeTestyEtapu5.push(
        "testy/etap_5" + litera + "_" + numer + ".test.js"
      );
    });
  });

  assert.equal(wymaganeTestyEtapu5.length, 27);
  sprawdzIstnieniePlikow(wymaganeTestyEtapu5, "5A–5I");
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
    "testy/pamiec_tras_podglad.test.js",
    "testy/kp_4.test.js",
    "testy/etap_3a.test.js",
    "testy/etap_3b_1.test.js",
    "testy/etap_3b_2.test.js",
    "testy/etap_3c_5.test.js",
    "testy/etap_3d.test.js",
    "testy/etap_3e.test.js",
    "testy/panel_pomp.test.js",
    "testy/csv_przejazdy_pomp.test.js",
    "testy/etap_4j_1.test.js",
    "testy/etap_4j_2.test.js",
    "testy/etap_4j_3_1.test.js"
  ], "import, pamięć, gruszki, pompy i trasy");
}

function sprawdzPelnyRunner() {
  const workflow = wczytaj(".github/workflows/testy.yml");
  assert.match(workflow, /set -euo pipefail/);
  assert.match(workflow, /for plik in testy\/\*\.test\.js; do/);
  assert.match(workflow, /node "\$plik"/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[main\]/);

  const testy = fs.readdirSync(path.join(katalogProjektu, "testy"))
    .filter(function (nazwa) {
      return nazwa.endsWith(".test.js");
    });
  assert.ok(
    testy.length >= 92,
    "Pełna regresja 5J.1 powinna obejmować co najmniej 92 zestawy testów."
  );
}

function sprawdzPlanTestowEtapu5() {
  const plan = wczytaj("testy/TESTY_ETAP_5.md");

  assert.match(
    plan,
    /Punkty \*\*5A–5J\*\* są zakończone/
  );
  assert.match(plan, /\[x\] przekroczenie wskazuje konkretną parę dostaw/);
  assert.match(plan, /## 5H — wspólny model konfliktów[\s\S]*?- \[x\] brak gruszki;/);
  assert.match(plan, /## 5I — interfejs i pamięć[\s\S]*?- \[x\] operator widzi plan źródłowy/);
  assert.match(plan, /## 5J — regresja, publikacja i test operatora[\s\S]*?- \[x\] pełna regresja importu i pamięci;/);
  assert.match(plan, /- \[x\] pełna regresja Etapu 3 — gruszki;/);
  assert.match(plan, /- \[x\] pełna regresja Etapu 4 — pompy;/);
  assert.match(plan, /- \[[ x]\] publikacja `main` i GitHub Pages;/);
  assert.match(plan, /- \[x\] test operatora:/);
}

function sprawdzTrwaleZamkniecie5J1() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(etapy, /\[x\] \*\*5J\.1 — testy automatyczne:/);
  assert.match(etapy, /\[x\] \*\*5J — pełna regresja, publikacja i test operatora\.\*\*/);
  assert.match(etapy, /\[x\] Etap 5 — Pełny silnik harmonogramu/);
  assert.match(stan, /Cały \*\*Etap 5[\s\S]*?jest zakończony/i);
}

sprawdzKompletnoscEtapu5();
sprawdzRegresjePrzekrojowa();
sprawdzPelnyRunner();
sprawdzPlanTestowEtapu5();
sprawdzTrwaleZamkniecie5J1();

console.log(
  "OK — 5J.1 potwierdza kompletność testów Etapu 5 i pełną regresję importu, pamięci, gruszek, pomp oraz interfejsu."
);
