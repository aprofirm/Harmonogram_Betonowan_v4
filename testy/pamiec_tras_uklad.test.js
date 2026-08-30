"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");
const cssGlowny = fs.readFileSync(
  path.join(katalogProjektu, "style/glowny.css"),
  "utf8"
);
const cssRozladunek = fs.readFileSync(
  path.join(katalogProjektu, "style/rodzaj_rozladunku.css"),
  "utf8"
);

assert.match(
  cssGlowny,
  /\.okno-historii__panel\s*\{[\s\S]*?width:\s*min\(720px,\s*100%\);/,
  "Bazowe okno historii planów powinno zachować dotychczasową szerokość 720 px."
);

assert.match(
  cssRozladunek,
  /#okno-pamieci-tras\s+\.okno-historii__panel\s*\{[\s\S]*?width:\s*min\(1180px,\s*100%\);/,
  "Okno pamięci tras powinno mieć osobny, szerszy limit szerokości."
);

assert.match(
  cssRozladunek,
  /#lista-zapisanych-tras\s+table\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?table-layout:\s*fixed;/,
  "Tabela zapisanych tras powinna dopasowywać kolumny do szerokości okna."
);

assert.match(
  cssRozladunek,
  /#lista-zapisanych-tras\s+th:nth-child\(7\),[\s\S]*?#lista-zapisanych-tras\s+td:nth-child\(7\)\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?right:\s*0;/,
  "Kolumna akcji z przyciskiem Usuń powinna pozostać widoczna podczas przewijania."
);

assert.match(
  cssRozladunek,
  /@media\s*\(max-width:\s*680px\)[\s\S]*?#lista-zapisanych-tras\s+table\s*\{[\s\S]*?min-width:\s*680px;/,
  "Na małych ekranach tabela powinna zachować bezpieczną szerokość i przewijanie."
);

console.log(
  "✓ UI pamięci tras: szeroki modal, dopasowana tabela i stale widoczna kolumna Usuń."
);
