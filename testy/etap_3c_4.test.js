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
const css = fs.readFileSync(
  path.join(katalogProjektu, "style/glowny.css"),
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
assert.match(interfejs, /poczatek\.className = "czas-kursu__poczatek"/);
assert.match(
  interfejs,
  /utworzKomorkeZakresuZPogrubionymPoczatkiem\(\s*kurs\.godzinaRozpoczeciaZaladunku,\s*kurs\.godzinaWyjazduZBetoniarni/
);
assert.equal(
  (interfejs.match(/utworzKomorkeZakresuZPogrubionymPoczatkiem\(/g) || []).length,
  2
);
assert.match(css, /\.czas-kursu__poczatek\s*\{[\s\S]*?font-weight:\s*900;/);
assert.doesNotMatch(html, /numery gruszek zostaną pokazane/i);

console.log(
  "✓ Etap 3C.4: tabela operatora pokazuje techniczny numer pierwszej wolnej gruszki przy każdym kursie."
);
