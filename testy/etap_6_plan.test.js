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
    if (["A", "B", "C", "D", "E", "F"].includes(litera)) {
      assert.match(
        etapy,
        new RegExp("- \\[x\\] \\*\\*6" + litera + " —")
      );
    } else {
      assert.match(
        etapy,
        new RegExp("- \\[[ x]\\] \\*\\*6" + litera + " —")
      );
    }

    [1, 2, 3].forEach(function (numer) {
      if (["A", "B", "C", "D", "E", "F"].includes(litera)) {
        assert.match(
          etapy,
          new RegExp("- \\[x\\] \\*\\*6" + litera + "\\." + numer + " —")
        );
      } else {
        assert.match(
          etapy,
          new RegExp("- \\[[ x]\\] \\*\\*6" + litera + "\\." + numer + " —")
        );
      }
    });
  });

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
    /Etap 6 — Adresy, lokalizacje i trasy — \*\*rozpoczęty 2026-09-02;/
  );
  assert.match(etapy, /openrouteservice \/ HeiGIT/);
  assert.match(stan, /\*\*Etap 6\*\* jest rozpoczęty/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6J\.2/);
  assert.match(stan, /Punkty \*\*6A–6I\*\* są zakończone/);
  assert.match(stan, /Punkt \*\*6J\*\* jest rozpoczęty/);
  assert.match(stan, /6J\.1–6J\.2/);
  assert.match(stan, /Rozpocząć \*\*6J\.3/);
  assert.match(stan, /124\/124 zestawów testów/);
  assert.match(readme, /testy\/TESTY_ETAP_6\.md/);
  assert.match(planTestow, /całe punkty \*\*6A–6F\*\*/);
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
  "OK — Etap 6 ma zakończone 6A–6I oraz 6J.1–6J.2; po bezpiecznej publikacji następny krok to końcowy test operatora 6J.3."
);
