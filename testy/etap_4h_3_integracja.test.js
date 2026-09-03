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

  assert.match(
    html,
    /ograniczony_przydzial_pomp\.js[\s\S]*jawne_konsekwencje_pomp\.js/
  );
  assert.match(konfiguracja, /punktEtapu:\s*"\d+[A-Z](?:\.\d+)+"/);
  assert.match(etapy, /\[x\] \*\*4H\.3 — jawne konsekwencje:/);

  console.log(
    "✓ Etap 4H.3 integracja: moduł jawnych konsekwencji pozostaje załadowany, a 4H.3 jest nadal oznaczone jako zakończone."
  );
}

uruchomTesty();
