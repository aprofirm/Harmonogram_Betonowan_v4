"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzInwentaryzacjeIJednaBrame() {
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  [
    "js/import/import_csv.js",
    "js/budowy/budowy.js",
    "js/lokalizacje/lokalizacje.js",
    "js/pamiec/pamiec_tras.js",
    "js/pompy/przejazdy_pomp.js",
    "js/harmonogram/harmonogram.js",
    "js/aplikacja.js"
  ].forEach(function (modul) {
    assert.match(kontrakt, new RegExp(modul.replace(/[./]/g, "\\$&")));
  });

  assert.match(
    kontrakt,
    /Jedyną bramą domenową[\s\S]*?\*\*\`aplikacja\.lokalizacje\`\*\*/
  );
  assert.match(kontrakt, /bieżące czasy → pamięć tras →[\s\S]*?mapow/);
  assert.match(kontrakt, /wynik inwentaryzacji 6A\.1/);
}

function sprawdzGraniceIstniejacegoKodu() {
  const lokalizacje = wczytaj("js/lokalizacje/lokalizacje.js");
  const harmonogram = wczytaj("js/harmonogram/harmonogram.js");
  const przejazdyPomp = wczytaj("js/pompy/przejazdy_pomp.js");

  assert.match(lokalizacje, /function pobierzLubUstalTrase\(/);
  assert.match(lokalizacje, /pobierzLubUstalTrase: pobierzLubUstalTrase/);
  assert.doesNotMatch(harmonogram, /fetch\s*\(/);
  assert.doesNotMatch(harmonogram, /Nominatim|OSRM|Google Maps|localStorage/i);
  assert.match(przejazdyPomp, /czasPrzejazduMinuty/);
  assert.match(przejazdyPomp, /zrodloCzasuPrzejazdu/);
}

function sprawdzStatusPlanuIDecyzje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(etapy, /- \[ \] \*\*6A —/);
  assert.match(etapy, /- \[x\] \*\*6A\.1 —/);
  assert.match(
    etapy,
    /## Zamknięcie 6A\.1 — inwentaryzacja i granice modułów/
  );
  assert.match(
    decyzje,
    /## 120\. `aplikacja\.lokalizacje` jest jedyną bramą roboczego wyniku trasy/
  );
  assert.match(stan, /`KONTRAKT_LOKALIZACJI_I_TRAS\.md` wskazuje/);
}

sprawdzInwentaryzacjeIJednaBrame();
sprawdzGraniceIstniejacegoKodu();
sprawdzStatusPlanuIDecyzje();

console.log(
  "OK — 6A.1 ustala jedną bramę lokalizacji i tras bez sprzęgania silnika z mapami."
);
