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
  assert.match(html, /Etap 4H\.3/);
  assert.match(html, /4H\.3 · jawne konsekwencje ograniczenia pomp/);
  assert.match(konfiguracja, /punktEtapu:\s*"4H\.3"/);
  assert.match(etapy, /\[x\] \*\*4H\.3 — jawne konsekwencje:/);
  assert.match(etapy, /\[ \] \*\*4H\.4 — pamięć i ponowne przeliczenie:/);

  console.log(
    "✓ Etap 4H.3 integracja: moduł jest ładowany w aplikacji, a roadmapa wskazuje 4H.4 jako kolejny krok."
  );
}

uruchomTesty();
