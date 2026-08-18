"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
const interfejs = fs.readFileSync(
  path.join(katalogProjektu, "js/interfejs/interfejs.js"),
  "utf8"
);
const konfiguracja = fs.readFileSync(
  path.join(katalogProjektu, "js/konfiguracja/konfiguracja.js"),
  "utf8"
);

assert.match(html, /<th>Kurs<\/th>\s*<th>Gruszka<\/th>\s*<th>Budowa<\/th>/);
assert.match(
  html,
  /<tbody id="wiersze-kursow">[\s\S]*?<td colspan="9">[\s\S]*?Godziny kursów pojawią się po przeliczeniu/
);
assert.match(html, /pierwszą wolną gruszkę przydzieloną do kursu/i);
assert.match(interfejs, /komorka\.colSpan = 9;/);
assert.match(
  interfejs,
  /"Gruszka " \+ String\(kurs\.numerGruszki\)/
);
assert.match(konfiguracja, /punktEtapu: "3C\.4"/);
assert.doesNotMatch(html, /numery gruszek zostaną pokazane/i);

console.log(
  "✓ Etap 3C.4: tabela operatora pokazuje techniczny numer pierwszej wolnej gruszki przy każdym kursie."
);
