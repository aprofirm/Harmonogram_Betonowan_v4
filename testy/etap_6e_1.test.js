"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajPlikiJs(katalogWzgledny) {
  const katalog = path.join(katalogProjektu, katalogWzgledny);

  return fs.readdirSync(katalog)
    .filter(function (nazwa) {
      return nazwa.endsWith(".js");
    })
    .map(function (nazwa) {
      return wczytaj(path.join(katalogWzgledny, nazwa));
    })
    .join("\n");
}

const porownanie = wczytaj("DOSTAWCA_MAP_6E1.md");
const etapy = wczytaj("ETAPY_ROZWOJU.md");
const stan = wczytaj("STAN_PROJEKTU.md");
const decyzje = wczytaj("PROJECT_DECISIONS.md");
const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
const kodSilnika = wczytajPlikiJs("js/harmonogram");

assert.match(
  porownanie,
  /wybieramy \*\*openrouteservice \/ HeiGIT\*\* jako\s+podstawowego dostawcę/i,
  "6E.1 powinien jawnie wskazywać podstawowego dostawcę."
);
assert.match(
  porownanie,
  /api\.heigit\.org/,
  "Nowa integracja musi używać aktualnego hosta HeiGIT."
);
assert.match(
  porownanie,
  /2000[\s\S]*Directions[\s\S]*1000[\s\S]*Geocoding/i,
  "Porównanie powinno zachowywać sprawdzone limity planu Standard."
);
assert.match(
  porownanie,
  /długość, szerokość, wysokość, nacisk osi, masę/i,
  "Wybór musi uwzględniać rzeczywiste ograniczenia pojazdu ciężarowego."
);
assert.match(
  porownanie,
  /\*\*TomTom\*\* pozostaje pierwszym kandydatem do późniejszego drugiego adaptera/i,
  "TomTom powinien pozostać zapisanym wariantem rezerwowym."
);
assert.match(
  porownanie,
  /Google[\s\S]*48 stanach USA[\s\S]*Japonii/i,
  "Decyzja powinna zapisywać aktualne ograniczenie geograficzne truck routingu Google."
);
assert.match(
  porownanie,
  /klucza API \*\*nie wolno zapisywać w repozytorium/i,
  "6E.1 musi jawnie chronić klucz API."
);

assert.match(etapy, /- \[x\] \*\*6E\.1 — porównanie i decyzja:/);
assert.match(etapy, /Podetap \*\*6E\.1 — porównanie i decyzja\*\* jest zakończony/);
assert.match(etapy, /108\/108 zestawów testów/);
assert.match(decyzje, /## 130\. openrouteservice jako pierwszy dostawca Etapu 6/);
assert.match(planTestow, /### 6E\.1 — porównanie i decyzja/);

assert.doesNotMatch(
  kodSilnika,
  /openrouteservice|api\.heigit\.org|tomtom|hereapi|geoapify/i,
  "Nazwa dostawcy nie może przeniknąć do silnika harmonogramu."
);

console.log(
  "OK — 6E.1 wybiera openrouteservice dla pierwszej integracji, zachowuje neutralną architekturę i zapisuje warianty rezerwowe."
);
