"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytajAplikacje() {
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/gruszki/gruszki.js"
  ].forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzIloscBudowyRecznej() {
  const aplikacja = wczytajAplikacje();
  const budowa = aplikacja.budowy.utworzBudoweReczna({
    firma: "Firma testowa",
    budowa: "Plac testowy",
    startPlanowany: "08:00",
    iloscBetonuM3: "17.5"
  }, []);

  assert.equal(budowa.iloscBetonuLiczbaM3, 17.5);
  assert.equal(budowa.iloscBetonuBazowaLiczbaM3, 17.5);
  assert.deepEqual(
    Array.from(
      aplikacja.gruszki.generujKursyDlaBudowy(budowa, 8),
      function (kurs) {
        return kurs.iloscBetonuM3;
      }
    ),
    [8, 8, 1.5]
  );

  aplikacja.budowy.zmienIloscBetonuRoboczaBudowy(budowa, "8");
  assert.equal(aplikacja.gruszki.generujKursyDlaBudowy(budowa, 8).length, 1);
  assert.equal(budowa.iloscBetonuBazowaLiczbaM3, 17.5);

  aplikacja.budowy.przywrocBazowaIloscBetonuBudowy(budowa);
  assert.equal(budowa.iloscBetonuLiczbaM3, 17.5);
  assert.equal(aplikacja.gruszki.generujKursyDlaBudowy(budowa, 8).length, 3);
}

function sprawdzFormularzIPrzyciskPrzywracania() {
  const html = fs.readFileSync(path.join(katalogProjektu, "index.html"), "utf8");
  const interfejs = fs.readFileSync(
    path.join(katalogProjektu, "js/interfejs/interfejs.js"),
    "utf8"
  );

  assert.match(html, /id="reczna-ilosc-betonu"/);
  assert.match(html, /name="iloscBetonuM3"/);
  assert.match(html, /min="0\.1"/);
  assert.match(interfejs, /className = "przycisk-przywroc-ilosc"/);
  assert.match(interfejs, /textContent = "↺"/);
}

function sprawdzSzerokiKompaktowyUklad() {
  const css = fs.readFileSync(
    path.join(katalogProjektu, "style/glowny.css"),
    "utf8"
  );

  assert.match(css, /\.aplikacja\s*{[^}]*width:\s*100%;/s);
  assert.match(
    css,
    /grid-template-columns:\s*clamp\(280px,\s*18vw,\s*304px\)\s+minmax\(0,\s*1fr\);/
  );
  assert.match(css, /padding:\s*18px\s+clamp\(16px,\s*1\.25vw,\s*24px\)\s+16px;/);
  assert.match(css, /\.panel-harmonogramu table\s*{[^}]*min-width:\s*1240px;/s);
  assert.match(css, /\.tabela-kursow\s*{[^}]*min-width:\s*980px;/s);
  assert.match(
    css,
    /@media\s*\(max-width:\s*920px\)[\s\S]*?\.uklad-glowny\s*{[^}]*grid-template-columns:\s*1fr;/
  );
  assert.doesNotMatch(css, /(^|[;{]\s*)zoom\s*:/m);
  assert.doesNotMatch(css, /transform\s*:\s*scale\s*\(/i);
}

sprawdzIloscBudowyRecznej();
sprawdzFormularzIPrzyciskPrzywracania();
sprawdzSzerokiKompaktowyUklad();

console.log("✓ KP-3: ilość ręczna, wariant roboczy i kompaktowy układ działają.");
