"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomTesty() {
  const html = wczytaj("index.html");
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const readme = wczytaj("README.md");

  assert.match(html, /Etap 4H\.4/);
  assert.match(html, /4H\.4 · pamięć i ponowne przeliczenie pomp/);
  assert.match(konfiguracja, /punktEtapu:\s*"4H\.4"/);
  assert.match(etapy, /\[x\] \*\*4H\.4 — pamięć i ponowne przeliczenie:/);
  assert.match(etapy, /\[ \] \*\*4H\.5 — testy:/);
  assert.match(readme, /node testy\/etap_4h_4\.test\.js/);

  console.log(
    "✓ Etap 4H.4 integracja: status projektu wskazuje zamknięte 4H.4 i następny krok 4H.5."
  );
}

uruchomTesty();
