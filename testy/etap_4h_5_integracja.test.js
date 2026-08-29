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

  assert.match(html, /Etap 4H\.5/);
  assert.match(html, /4H\.5 · końcowe testy trybu mam X pomp/);
  assert.match(konfiguracja, /punktEtapu:\s*"4H\.5"/);
  assert.match(etapy, /\[x\] \*\*4H — tryb „mam X pomp”\.\*\*/);
  assert.match(etapy, /\[x\] \*\*4H\.5 — testy:/);
  assert.match(etapy, /\[x\] zmniejszenie liczby pomp powoduje pełne ponowne przeliczenie\./);
  assert.match(etapy, /Następny niezakończony podetap: \*\*4I\.1 — centralny wynik\*\*/);
  assert.match(readme, /node testy\/etap_4h_5\.test\.js/);
  assert.match(readme, /Cały punkt \*\*4H — tryb „mam X pomp”\*\* jest zakończony/);

  console.log(
    "✓ Etap 4H.5 integracja: cały 4H jest zamknięty, a roadmapa wskazuje 4I.1 jako kolejny krok."
  );
}

uruchomTesty();
