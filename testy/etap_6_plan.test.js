"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzKompletnyPodzialEtapu6() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");

  "ABCDEFGHIJ".split("").forEach(function (litera) {
    assert.match(etapy, new RegExp("- \\[ \\] \\*\\*6" + litera + " —"));

    [1, 2, 3].forEach(function (numer) {
      const stan = litera === "A" && numer === 1 ? "x" : " ";
      assert.match(
        etapy,
        new RegExp("- \\[" + stan + "\\] \\*\\*6" + litera + "\\." + numer + " —")
      );
    });
  });

  assert.match(etapy, /Następny niezakończony podetap: \*\*6A\.2/);
  assert.match(etapy, /brak sieci, limit, timeout lub zły wynik/);
  assert.match(etapy, /A → B` pozostaje niezależne od `B → A/);
  assert.match(etapy, /nie\s+nadpisuje ręcznej korekty/);
}

function sprawdzGranicePlanu() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const readme = wczytaj("README.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(
    etapy,
    /Etap 6 — Adresy, lokalizacje i trasy — \*\*rozpoczęty 2026-09-02; 6A\.1 zakończony; następny podetap 6A\.2\*\*/
  );
  assert.match(etapy, /wybór należy do 6E\.1/);
  assert.match(
    stan,
    /\*\*Etap 6\*\* jest rozpoczęty/
  );
  assert.match(
    stan,
    /Rozpocząć \*\*6A\.2 — wersjonowany model lokalizacji i trasy\*\*/
  );
  assert.match(readme, /testy\/TESTY_ETAP_6\.md/);
  assert.match(
    planTestow,
    /Podetap \*\*6A\.1[\s\S]*?jest zakończony/
  );
  assert.match(
    planTestow,
    /Testy automatyczne[\s\S]*?nie mogą zależeć od chwilowej dostępności publicznego serwera map/
  );
  assert.match(
    planTestow,
    /Rzeczywiste adresy użyte przez operatora nie trafiają do testów/
  );
}

sprawdzKompletnyPodzialEtapu6();
sprawdzGranicePlanu();

console.log(
  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A.1 i następny krok 6A.2."
);
