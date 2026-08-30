"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomTestWidoku() {
  const elementy = {
    "minimalna-liczba-pomp": { textContent: "—" },
    "podsumowanie-dostepnosci-pomp": {
      textContent: "Po obliczeniu pokażemy potrzebną liczbę pomp."
    },
    "tryb-pomp": { value: "oblicz-potrzebne" }
  };
  const wywolania = [];
  let minimalnaLiczbaPomp = 0;
  const bazowyInterfejs = {
    pokazWynik: function (wynik) {
      wywolania.push(["pokazWynik", wynik]);
      elementy["minimalna-liczba-pomp"].textContent = "—";
      return "wynik-bazowy";
    },
    oznaczWynikJakoNieaktualny: function () {
      wywolania.push(["oznaczWynikJakoNieaktualny"]);
      elementy["minimalna-liczba-pomp"].textContent = "—";
      return "nieaktualny-bazowy";
    },
    pokazPrzywroconyPlan: function () {
      wywolania.push(["pokazPrzywroconyPlan"]);
    },
    wyczyscPlan: function () {
      wywolania.push(["wyczyscPlan"]);
    }
  };
  const kontekst = {
    window: {
      HarmonogramBetonowan: {
        interfejs: bazowyInterfejs,
        pompy: {
          obliczMinimalnaLiczbePomp: function (budowy, kursy) {
            wywolania.push(["obliczMinimalnaLiczbePomp", budowy, kursy]);
            return { minimalnaLiczbaPomp: minimalnaLiczbaPomp };
          }
        }
      }
    },
    document: {
      getElementById: function (identyfikator) {
        return elementy[identyfikator] || null;
      }
    }
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);
  new vm.Script(wczytaj("js/interfejs/minimalna_liczba_pomp.js"), {
    filename: "js/interfejs/minimalna_liczba_pomp.js"
  }).runInContext(kontekst);

  const interfejs = kontekst.window.HarmonogramBetonowan.interfejs;
  const daneWyniku = {
    budowy: [{ idBudowy: "A" }],
    kursy: [{ idKursu: "KURS-A" }]
  };

  assert.equal(interfejs.pokazWynik(daneWyniku), "wynik-bazowy");
  assert.equal(elementy["minimalna-liczba-pomp"].textContent, "0");
  assert.equal(
    elementy["podsumowanie-dostepnosci-pomp"].textContent,
    "Plan nie wymaga pompy."
  );
  assert.equal(wywolania[1][0], "obliczMinimalnaLiczbePomp");
  assert.equal(wywolania[1][1], daneWyniku.budowy);
  assert.equal(wywolania[1][2], daneWyniku.kursy);

  minimalnaLiczbaPomp = 2;
  interfejs.pokazWynik(daneWyniku);
  assert.equal(elementy["minimalna-liczba-pomp"].textContent, "2");
  assert.equal(
    elementy["podsumowanie-dostepnosci-pomp"].textContent,
    "Potrzebne pompy: 2."
  );

  elementy["tryb-pomp"].value = "mam-okreslona-liczbe";
  elementy["podsumowanie-dostepnosci-pomp"].textContent =
    "2 aktywne · bez ograniczeń godzinowych.";
  minimalnaLiczbaPomp = 3;
  interfejs.pokazWynik(daneWyniku);
  assert.equal(elementy["minimalna-liczba-pomp"].textContent, "3");
  assert.equal(
    elementy["podsumowanie-dostepnosci-pomp"].textContent,
    "2 aktywne · bez ograniczeń godzinowych."
  );

  elementy["tryb-pomp"].value = "oblicz-potrzebne";
  assert.equal(
    interfejs.oznaczWynikJakoNieaktualny(),
    "nieaktualny-bazowy"
  );
  assert.equal(elementy["minimalna-liczba-pomp"].textContent, "—");
  assert.equal(
    elementy["podsumowanie-dostepnosci-pomp"].textContent,
    "Po obliczeniu pokażemy potrzebną liczbę pomp."
  );
}

function sprawdzPodlaczenieModulu() {
  const html = wczytaj("index.html");
  const skryptDostepnosci =
    '<script defer src="js/interfejs/dostepnosc_pomp.js"></script>';
  const skryptMinimalnejLiczby =
    'src="js/interfejs/minimalna_liczba_pomp.js';

  assert.ok(html.includes(skryptMinimalnejLiczby));
  assert.ok(
    html.indexOf(skryptMinimalnejLiczby) > html.indexOf(skryptDostepnosci),
    "Widok 4G.2 musi być ładowany po rozszerzeniu dostępności pomp."
  );
  assert.match(html, /id="minimalna-liczba-pomp">—<\/span>/);
  assert.match(html, /potrzebnych pomp/i);
}

uruchomTestWidoku();
sprawdzPodlaczenieModulu();

console.log(
  "✓ Etap 4G.2: operator widzi minimalną liczbę pomp, a plan bez pompowania pokazuje 0 i czytelną informację."
);
