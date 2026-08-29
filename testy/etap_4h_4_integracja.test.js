"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomTesty() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const readme = wczytaj("README.md");

  // Test 4H.4 pilnuje trwałego faktu zakończenia tego podetapu. Nie może
  // blokować późniejszych etapów tylko dlatego, że zmienił się znacznik wersji.
  assert.match(etapy, /\[x\] \*\*4H\.4 — pamięć i ponowne przeliczenie:/);
  assert.match(readme, /node testy\/etap_4h_4\.test\.js/);

  console.log(
    "✓ Etap 4H.4 integracja: pamięć i czysty stan ponownego przeliczenia pozostają objęte testem po przejściu do kolejnych etapów."
  );
}

uruchomTesty();
