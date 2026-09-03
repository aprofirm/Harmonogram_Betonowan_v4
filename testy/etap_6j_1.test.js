"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");
const znacznikWersji = "6j1-audyt-20260903a";

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzIstnieniePlikow(listaPlikow, opis) {
  listaPlikow.forEach(function (sciezka) {
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje wymaganego testu 6J.1 (" + opis + "): " + sciezka
    );
  });
}

function sprawdzKompletnosc6Ado6I() {
  const wymaganeTesty = [];

  ["a", "b", "c", "d", "e", "f", "g", "h", "i"].forEach(function (litera) {
    [1, 2, 3].forEach(function (numer) {
      wymaganeTesty.push(
        "testy/etap_6" + litera + "_" + numer + ".test.js"
      );
    });
  });

  assert.equal(wymaganeTesty.length, 27);
  sprawdzIstnieniePlikow(wymaganeTesty, "6A–6I");
}

function sprawdzRegresjePrzekrojowa() {
  sprawdzIstnieniePlikow([
    "testy/etap_2.test.js",
    "testy/kdx_zmienne_kolumny.test.js",
    "testy/etap_6b_1.test.js",
    "testy/etap_6b_2.test.js",
    "testy/etap_6b_3.test.js",
    "testy/etap_6c_1.test.js",
    "testy/etap_6c_2.test.js",
    "testy/etap_6c_3.test.js",
    "testy/pamiec_planu.test.js",
    "testy/pamiec_aplikacji.test.js",
    "testy/pamiec_tras.test.js",
    "testy/pamiec_tras_integracja.test.js",
    "testy/etap_6d_1.test.js",
    "testy/etap_6d_2.test.js",
    "testy/etap_6d_3.test.js",
    "testy/etap_6e_1.test.js",
    "testy/etap_6e_2.test.js",
    "testy/etap_6e_3.test.js",
    "testy/etap_6f_1.test.js",
    "testy/etap_6f_2.test.js",
    "testy/etap_6f_3.test.js",
    "testy/etap_6g_1.test.js",
    "testy/etap_6g_2.test.js",
    "testy/etap_6g_3.test.js",
    "testy/etap_6h_1.test.js",
    "testy/etap_6h_2.test.js",
    "testy/etap_6h_3.test.js",
    "testy/etap_6i_1.test.js",
    "testy/etap_6i_2.test.js",
    "testy/etap_6i_3.test.js",
    "testy/etap_3c_5.test.js",
    "testy/etap_3e.test.js",
    "testy/panel_pomp.test.js",
    "testy/csv_przejazdy_pomp.test.js",
    "testy/etap_4j_1.test.js",
    "testy/etap_5j_1.test.js",
    "testy/etap_5j_3_przygotowanie.test.js"
  ], "import, lokalizacje, pamięć, routing, offline, gruszki, pompy i konflikty");
}

function sprawdzPelnyRunner() {
  const workflow = wczytaj(".github/workflows/testy.yml");
  const testy = fs.readdirSync(path.join(katalogProjektu, "testy"))
    .filter(function (nazwa) {
      return nazwa.endsWith(".test.js");
    });

  assert.match(workflow, /set -euo pipefail/);
  assert.match(workflow, /for plik in testy\/\*\.test\.js; do/);
  assert.match(workflow, /node "\$plik"/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[main\]/);
  assert.ok(
    testy.length >= 123,
    "Pełna regresja 6J.1 powinna obejmować co najmniej 123 zestawy testów."
  );
}

function sprawdzGraniceArchitektury() {
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");

  assert.doesNotMatch(
    harmonogram,
    /fetch\s*\(|api\.heigit\.org|openrouteservice|Authorization|wyznaczTrase/i
  );
  assert.match(harmonogram, /przejazdyPompyMinuty/);
}

function sprawdzWersjonowaniePublikacji() {
  const html = wczytaj("index.html");
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const wymaganePlikiEtapu6 = [
    "style/glowny.css",
    "js/konfiguracja/konfiguracja.js",
    "js/import/import_csv.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/pamiec/pamiec_wezla.js",
    "js/lokalizacje/adapter_uslug_mapowych.js",
    "js/lokalizacje/kontrakt_trasy_kierunkowej.js",
    "js/lokalizacje/routing_wezel_budowa.js",
    "js/lokalizacje/routing_budowa_budowa.js",
    "js/lokalizacje/lokalizacje.js",
    "js/lokalizacje/wartosci_trasy_wezel_budowa.js",
    "js/lokalizacje/integracja_przejazdow_pomp.js",
    "js/interfejs/wynik_trasy_budowy.js",
    "js/interfejs/kandydaci_lokalizacji.js",
    "js/aplikacja.js"
  ];

  assert.match(konfiguracja, /numerEtapu:\s*6/);
  assert.match(konfiguracja, /punktEtapu:\s*"6J\.1"/);
  assert.match(html, /Etap 6J\.1/);
  assert.match(html, /6J\.1 · audyt testów automatycznych/);

  wymaganePlikiEtapu6.forEach(function (sciezka) {
    const wzorzec = new RegExp(
      sciezka.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
        "\\?v=" + znacznikWersji
    );
    assert.match(
      html,
      wzorzec,
      "Brak aktualnego znacznika cache 6J.1 dla " + sciezka
    );
  });
}

function sprawdzPlanIStan() {
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(stan, /Ostatni zakończony podetap: \*\*6J\.1/);
  assert.match(stan, /Punkty \*\*6A–6I\*\* są zakończone/);
  assert.match(stan, /Punkt \*\*6J\*\* jest rozpoczęty/);
  assert.match(stan, /Rozpocząć \*\*6J\.2/);
  assert.match(stan, /123\/123 zestawów testów/);
  assert.match(
    plan,
    /Testy automatyczne[\s\S]*?nie mogą zależeć od chwilowej dostępności publicznego serwera map/
  );
  assert.match(plan, /\*\*6J:\*\*[\s\S]*?tryb offline/);
  assert.match(plan, /pełną regresję gruszek, pomp i konfliktów/);
}

sprawdzKompletnosc6Ado6I();
sprawdzRegresjePrzekrojowa();
sprawdzPelnyRunner();
sprawdzGraniceArchitektury();
sprawdzWersjonowaniePublikacji();
sprawdzPlanIStan();

console.log(
  "OK — 6J.1 potwierdza kompletność 6A–6I, pełną regresję Etapu 6, izolację silnika oraz świeże zasoby przeglądarki przed publikacją."
);
