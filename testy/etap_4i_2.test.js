"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzSrodowisko() {
  const elementy = {
    "tryb-pomp": { value: "mam-okreslona-liczbe" },
    "minimalna-liczba-pomp": { textContent: "—" },
    "liczba-dostepnych-pomp-wynik": { textContent: "2" },
    "podsumowanie-dostepnosci-pomp": {
      textContent: "2 aktywne · puste Od/Do = bez ograniczeń."
    }
  };
  const sekcjaPomp = { dataset: {} };
  const wywolania = {
    pokazWynik: 0,
    oznaczWynikJakoNieaktualny: 0,
    pokazPrzywroconyPlan: 0,
    wyczyscPlan: 0
  };
  const interfejs = {
    pokazWynik: function () {
      wywolania.pokazWynik += 1;
      return "wynik-bazowy";
    },
    oznaczWynikJakoNieaktualny: function () {
      wywolania.oznaczWynikJakoNieaktualny += 1;
      return "nieaktualny-bazowy";
    },
    pokazPrzywroconyPlan: function () {
      wywolania.pokazPrzywroconyPlan += 1;
      return "przywrocony-bazowy";
    },
    wyczyscPlan: function () {
      wywolania.wyczyscPlan += 1;
      return "wyczyszczony-bazowy";
    }
  };
  const zakresOkna = {
    HarmonogramBetonowan: {
      interfejs: interfejs,
      pompy: {
        obliczMinimalnaLiczbePomp: function () {
          throw new Error("4I.2 nie może ponownie uruchamiać silnika minimalnej floty.");
        }
      }
    }
  };
  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    document: {
      getElementById: function (id) {
        return elementy[id] || null;
      },
      querySelector: function (selektor) {
        return selektor === ".sterowanie-zasobu--pompy" ? sekcjaPomp : null;
      }
    }
  };

  vm.createContext(kontekst);
  new vm.Script(wczytaj("js/interfejs/minimalna_liczba_pomp.js"), {
    filename: "js/interfejs/minimalna_liczba_pomp.js"
  }).runInContext(kontekst);

  return {
    interfejs: zakresOkna.HarmonogramBetonowan.interfejs,
    elementy: elementy,
    sekcjaPomp: sekcjaPomp,
    wywolania: wywolania
  };
}

function sprawdzOgraniczonaFlote() {
  const srodowisko = utworzSrodowisko();
  const zwrot = srodowisko.interfejs.pokazWynik({
    trybPomp: "mam-okreslona-liczbe",
    pompy: {
      status: "obliczono",
      trybPomp: "mam-okreslona-liczbe",
      minimalnaLiczbaPomp: 3,
      liczbaDostepnychPomp: 3,
      liczbaPompDostepnychDoPrzydzialu: 2,
      liczbaBrakujacychPomp: 1,
      statusFlotyPomp: "niedobor-pomp"
    }
  });

  assert.equal(zwrot, "wynik-bazowy");
  assert.equal(srodowisko.wywolania.pokazWynik, 1);
  assert.equal(srodowisko.elementy["minimalna-liczba-pomp"].textContent, "3");
  assert.equal(
    srodowisko.elementy["liczba-dostepnych-pomp-wynik"].textContent,
    "2"
  );
  assert.match(
    srodowisko.elementy["podsumowanie-dostepnosci-pomp"].textContent,
    /Potrzebne: 3 · dostępne: 2\./
  );
  assert.match(
    srodowisko.elementy["podsumowanie-dostepnosci-pomp"].textContent,
    /Brakuje: 1\./
  );
  assert.match(
    srodowisko.elementy["podsumowanie-dostepnosci-pomp"].textContent,
    /2 aktywne/
  );
  assert.equal(srodowisko.sekcjaPomp.dataset.statusPomp, "niedobor-pomp");
}

function sprawdzTrybObliczPotrzebne() {
  const srodowisko = utworzSrodowisko();
  srodowisko.elementy["tryb-pomp"].value = "oblicz-potrzebne";

  srodowisko.interfejs.pokazWynik({
    trybPomp: "oblicz-potrzebne",
    pompy: {
      status: "obliczono",
      trybPomp: "oblicz-potrzebne",
      minimalnaLiczbaPomp: 4,
      liczbaDostepnychPomp: null
    }
  });

  assert.equal(srodowisko.elementy["minimalna-liczba-pomp"].textContent, "4");
  assert.equal(
    srodowisko.elementy["liczba-dostepnych-pomp-wynik"].textContent,
    "—"
  );
  assert.equal(
    srodowisko.elementy["podsumowanie-dostepnosci-pomp"].textContent,
    "Potrzebne pompy: 4."
  );
}

function sprawdzPlanBezPompowania() {
  const srodowisko = utworzSrodowisko();
  srodowisko.elementy["tryb-pomp"].value = "oblicz-potrzebne";

  srodowisko.interfejs.pokazWynik({
    pompy: {
      status: "obliczono",
      trybPomp: "oblicz-potrzebne",
      minimalnaLiczbaPomp: 0
    }
  });

  assert.equal(srodowisko.elementy["minimalna-liczba-pomp"].textContent, "0");
  assert.equal(
    srodowisko.elementy["podsumowanie-dostepnosci-pomp"].textContent,
    "Plan nie wymaga pompy."
  );
}

function sprawdzCzyszczenieStaregoWyniku() {
  const srodowisko = utworzSrodowisko();

  srodowisko.interfejs.pokazWynik({
    pompy: {
      status: "obliczono",
      trybPomp: "mam-okreslona-liczbe",
      minimalnaLiczbaPomp: 3,
      liczbaPompDostepnychDoPrzydzialu: 2,
      statusFlotyPomp: "flota-wystarczajaca"
    }
  });

  const dostepnePrzed =
    srodowisko.elementy["liczba-dostepnych-pomp-wynik"].textContent;
  srodowisko.interfejs.oznaczWynikJakoNieaktualny();

  assert.equal(srodowisko.wywolania.oznaczWynikJakoNieaktualny, 1);
  assert.equal(srodowisko.elementy["minimalna-liczba-pomp"].textContent, "—");
  assert.equal(
    srodowisko.elementy["liczba-dostepnych-pomp-wynik"].textContent,
    dostepnePrzed
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(srodowisko.sekcjaPomp.dataset, "statusPomp"),
    false
  );
}

function sprawdzWspolnyPanel() {
  const html = wczytaj("index.html");
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");
  const pozycjaGruszek = html.indexOf("tytul-sterowania-gruszkami");
  const pozycjaPomp = html.indexOf("tytul-sterowania-pompami");

  assert.match(html, /STEROWANIE ZASOBAMI/);
  assert.ok(pozycjaGruszek >= 0, "Brakuje sterowania gruszkami.");
  assert.ok(pozycjaPomp > pozycjaGruszek, "Sterowanie pompami ma być pod gruszkami.");
  assert.match(html, /id="minimalna-liczba-pomp"/);
  assert.match(html, /id="liczba-dostepnych-pomp-wynik"/);
  assert.match(html, /id="podsumowanie-dostepnosci-pomp"/);
  assert.match(konfiguracja, /punktEtapu:\s*"4I\.2"/);
}

function sprawdzBrakPonownegoLiczeniaWInterfejsie() {
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");

  assert.doesNotMatch(kod, /\.obliczMinimalnaLiczbePomp\s*\(/);
  assert.match(kod, /wynikHarmonogramu[\s\S]*\.pompy/);
}

sprawdzOgraniczonaFlote();
sprawdzTrybObliczPotrzebne();
sprawdzPlanBezPompowania();
sprawdzCzyszczenieStaregoWyniku();
sprawdzWspolnyPanel();
sprawdzBrakPonownegoLiczeniaWInterfejsie();

console.log("OK — 4I.2 wspólne sterowanie zasobami korzysta z centralnego wyniku pomp.");
