"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");

assert.match(index, /js\/interfejs\/wynik_trasy_budowy\.js\?v=6i1-widocznosc-20260903a/);

console.log("OK — moduł wyniku trasy jest ładowany przez wersjonowany adres przeglądarkowy.");