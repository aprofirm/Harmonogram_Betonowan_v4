"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function sprawdzZasobyLokalne() {
  const html = wczytaj("index.html");
  const css = wczytaj("style/glowny.css");
  const odniesienia = Array.from(
    html.matchAll(/\b(?:src|href)="([^"]+)"/g),
    function (dopasowanie) {
      return dopasowanie[1];
    }
  );

  assert.ok(
    odniesienia.length > 10,
    "Test powinien objąć lokalne skrypty, style i grafiki."
  );

  odniesienia.forEach(function (odniesienie) {
    assert.doesNotMatch(
      odniesienie,
      /^(?:https?:)?\/\//i,
      "Podstawowy interfejs nie może wymagać zewnętrznego zasobu: " + odniesienie
    );

    if (odniesienie.startsWith("#") || odniesienie.startsWith("data:")) {
      return;
    }

    const sciezka = odniesienie.split(/[?#]/)[0];
    assert.ok(
      fs.existsSync(path.join(katalogProjektu, sciezka)),
      "Brakuje lokalnego zasobu wskazanego przez index.html: " + sciezka
    );
  });

  assert.doesNotMatch(css, /@import\s+[^;]*(?:https?:)?\/\//i);
  assert.doesNotMatch(css, /url\(\s*["']?(?:https?:)?\/\//i);
}

function sprawdzDostepnoscTabeliPomp() {
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");
  const css = wczytaj("style/glowny.css");

  assert.match(
    kod,
    /panel\.setAttribute\("aria-labelledby", "tytul-wyniku-pomp"\)/
  );
  assert.match(kod, /opis\.setAttribute\("aria-live", "polite"\)/);
  assert.match(kod, /przewijanie\.tabIndex = 0/);
  assert.match(kod, /przewijanie\.setAttribute\("role", "region"\)/);
  assert.match(
    kod,
    /przewijanie\.setAttribute\("aria-describedby", "opis-tabeli-pomp"\)/
  );
  assert.match(kod, /th\.setAttribute\("scope", "col"\)/);
  assert.match(css, /\.tabela-przewijana--pomp:focus-visible/);
  assert.match(css, /\.tabela-pomp-wynik[\s\S]*min-width: 1120px/);
  assert.match(
    css,
    /@media \(max-width: 620px\)[\s\S]*\.tabela-pomp-wynik/
  );
}

function sprawdzKomunikatyNieTylkoKolorem() {
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");
  const css = wczytaj("style/glowny.css");

  assert.match(kod, /"Brak przydziału"/);
  assert.match(kod, /"Pompa: \+"/);
  assert.match(kod, /"Pompa: brak przydziału · "/);
  assert.match(
    kod,
    /notka\.setAttribute\("role", komunikat\.rodzaj === "blad" \? "alert" : "status"\)/
  );
  assert.match(css, /\.notka-pompy--ostrzezenie/);
  assert.match(css, /\.notka-pompy--blad/);
  assert.match(css, /\.notka-pompy[\s\S]*white-space: normal/);
}

function sprawdzStatusEtapuIGranice() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");

  assert.match(
    etapy,
    /\[x\] \*\*4I — integracja wyniku i interfejs operatora\.\*\*/
  );
  assert.match(
    etapy,
    /\[x\] \*\*4I\.5 — zgodność offline i dostępność interfejsu:/
  );
  assert.match(
    etapy,
    /- \[x\] \*\*4J — pełna regresja, publikacja i test operatora\.\*\*/
  );
  assert.match(
    etapy,
    /- \[x\] Etap 4 — Pompy — \*\*zakończony 2026-08-30;/
  );
  assert.doesNotMatch(kod, /startRoboczy\s*=/);
}

sprawdzZasobyLokalne();
sprawdzDostepnoscTabeliPomp();
sprawdzKomunikatyNieTylkoKolorem();
sprawdzStatusEtapuIGranice();

console.log(
  "OK — 4I.5 zachowuje pracę offline i dostępny, czytelny interfejs pomp także po zamknięciu Etapu 4."
);
