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
    "liczba-dostepnych-pomp-wynik": { textContent: "—" },
    "podsumowanie-dostepnosci-pomp": { textContent: "" }
  };
  const znacznikEtapu = { textContent: "Etap 4I.2" };
  const stopkaEtapu = { textContent: "4I.2 · wspólne sterowanie zasobami" };
  const stopka = { lastElementChild: stopkaEtapu };
  const sekcjaPomp = { dataset: {} };
  const interfejs = {
    pokazWynik: function () {
      return "bazowy";
    },
    oznaczWynikJakoNieaktualny: function () {},
    pokazPrzywroconyPlan: function () {},
    wyczyscPlan: function () {}
  };
  const zakresOkna = {
    HarmonogramBetonowan: {
      interfejs: interfejs,
      pompy: {
        obliczMinimalnaLiczbePomp: function () {
          return { minimalnaLiczbaPomp: 0 };
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
        if (selektor === ".znacznik-etapu") {
          return znacznikEtapu;
        }
        if (selektor === ".stopka") {
          return stopka;
        }
        if (selektor === ".sterowanie-zasobu--pompy") {
          return sekcjaPomp;
        }
        return null;
      }
    }
  };

  vm.createContext(kontekst);
  new vm.Script(wczytaj("js/interfejs/minimalna_liczba_pomp.js"), {
    filename: "js/interfejs/minimalna_liczba_pomp.js"
  }).runInContext(kontekst);

  return {
    interfejs: zakresOkna.HarmonogramBetonowan.interfejs,
    znacznikEtapu: znacznikEtapu,
    stopkaEtapu: stopkaEtapu
  };
}

function okres(start, betonStart, betonKoniec, koniec) {
  return {
    minutaRozpoczeciaZajetosci: start,
    minutaRozpoczeciaBetonowania: betonStart,
    minutaZakonczeniaBetonowania: betonKoniec,
    minutaZakonczeniaZajetosci: koniec
  };
}

function sprawdzRzeczywistyPrzydzial() {
  const srodowisko = utworzSrodowisko();
  const dane = srodowisko.interfejs.przygotujDaneTabeliPomp({
    budowy: [
      { idBudowy: "A", budowa: "Hala A" },
      { idBudowy: "B", budowa: "Hala B" },
      { idBudowy: "C", budowa: "Hala C" }
    ],
    pompy: {
      status: "obliczono",
      trybPomp: "mam-okreslona-liczbe",
      wynikiBudow: [
        {
          idBudowy: "A",
          budowa: { idBudowy: "A", budowa: "Hala A" },
          statusPrzydzialuPompy: "przydzielona",
          przydzialPompy: {
            idPompy: "P-1",
            nazwaPompy: "Pompa 1",
            przejazdZPoprzedniejBudowy: null
          },
          informacyjnyPrzejazdZBazy: {
            czasDojazduMinuty: 20,
            minutaWyjazduZBetoniarni: 400,
            minutaPrzyjazduNaBudowe: 420
          },
          rzeczywistyOkresZajetosci: okres(420, 440, 500, 530),
          okresZajetosci: okres(420, 440, 500, 530),
          opoznienieZPowoduPompMinuty: 0
        },
        {
          idBudowy: "B",
          budowa: { idBudowy: "B", budowa: "Hala B" },
          statusPrzydzialuPompy: "przydzielona",
          przydzialPompy: {
            idPompy: "P-1",
            nazwaPompy: "Pompa 1",
            przejazdZPoprzedniejBudowy: {
              idBudowyZrodlowej: "A",
              idBudowyDocelowej: "B",
              czasPrzejazduMinuty: 15,
              minutaWyjazduZBudowy: 530,
              minutaPrzyjazduNaBudowe: 545
            }
          },
          rzeczywistyOkresZajetosci: okres(545, 565, 625, 655),
          okresZajetosci: okres(540, 560, 620, 650),
          opoznienieZPowoduPompMinuty: 5
        },
        {
          idBudowy: "C",
          budowa: { idBudowy: "C", budowa: "Hala C" },
          statusPrzydzialuPompy: "brak-pasujacej-pompy",
          przydzialPompy: null,
          informacyjnyPrzejazdZBazy: {
            czasDojazduMinuty: 10,
            minutaWyjazduZBetoniarni: 590,
            minutaPrzyjazduNaBudowe: 600
          },
          rzeczywistyOkresZajetosci: null,
          okresZajetosci: okres(600, 620, 660, 690),
          opoznienieZPowoduPompMinuty: null
        }
      ]
    }
  });

  assert.equal(dane.trybPomp, "mam-okreslona-liczbe");
  assert.equal(dane.wiersze.length, 3);
  assert.equal(dane.wiersze[0].budowa, "Hala A");
  assert.equal(dane.wiersze[0].pompa, "Pompa 1");
  assert.equal(dane.wiersze[0].przygotowanie, "07:00–07:20");
  assert.equal(dane.wiersze[0].betonowanie, "07:20–08:20");
  assert.equal(dane.wiersze[0].zakonczenie, "08:20–08:50");
  assert.equal(dane.wiersze[0].przejazd, "Baza · 20 min · 06:40–07:00");
  assert.equal(dane.wiersze[0].gotowaPonownie, "08:50");
  assert.equal(dane.wiersze[1].przejazd, "A → B · 15 min · 08:50–09:05");
  assert.equal(dane.wiersze[1].opoznienieMinuty, 5);
  assert.equal(dane.wiersze[2].pompa, "Brak przydziału");
  assert.equal(dane.wiersze[2].gotowaPonownie, "—");
  assert.match(dane.opis, /Rzeczywisty przydział pomp/);
}

function sprawdzMinimalnaFloteTechniczna() {
  const srodowisko = utworzSrodowisko();
  const dane = srodowisko.interfejs.przygotujDaneTabeliPomp({
    budowy: [
      { idBudowy: "A", budowa: "Hala A" },
      { idBudowy: "B", budowa: "Hala B" },
      { idBudowy: "C", budowa: "Hala C" }
    ],
    pompy: {
      status: "obliczono",
      trybPomp: "oblicz-potrzebne",
      wynikiBudow: [
        {
          idBudowy: "A",
          informacyjnyPrzejazdZBazy: {
            czasDojazduMinuty: 20,
            minutaWyjazduZBetoniarni: 400,
            minutaPrzyjazduNaBudowe: 420
          }
        },
        { idBudowy: "B" },
        {
          idBudowy: "C",
          informacyjnyPrzejazdZBazy: {
            czasDojazduMinuty: 25,
            minutaWyjazduZBetoniarni: 455,
            minutaPrzyjazduNaBudowe: 480
          }
        }
      ],
      wynikMinimalnejFloty: {
        przydzialyTechniczne: [
          {
            idBudowy: "A",
            idPompyTechnicznej: "POMPA-TECH-001",
            numerPompyTechnicznej: 1,
            okresZajetosci: okres(420, 440, 500, 530)
          },
          {
            idBudowy: "C",
            idPompyTechnicznej: "POMPA-TECH-002",
            numerPompyTechnicznej: 2,
            okresZajetosci: okres(480, 500, 540, 570)
          },
          {
            idBudowy: "B",
            idPompyTechnicznej: "POMPA-TECH-001",
            numerPompyTechnicznej: 1,
            okresZajetosci: okres(540, 560, 620, 650)
          }
        ]
      }
    }
  });

  assert.equal(dane.trybPomp, "oblicz-potrzebne");
  assert.equal(dane.wiersze.length, 3);
  assert.equal(dane.wiersze[0].pompa, "Pompa techniczna 1");
  assert.equal(dane.wiersze[0].przejazd, "Baza · 20 min · 06:40–07:00");
  assert.equal(dane.wiersze[1].pompa, "Pompa techniczna 2");
  assert.equal(dane.wiersze[1].przejazd, "Baza · 25 min · 07:35–08:00");
  assert.equal(dane.wiersze[2].pompa, "Pompa techniczna 1");
  assert.equal(dane.wiersze[2].przejazd, "— · tryb techniczny");
  assert.match(dane.opis, /minimalny układ zajętości/);
  assert.match(dane.opis, /Przejazdy między budowami nie są/);
}

function sprawdzPlanBezPomp() {
  const srodowisko = utworzSrodowisko();
  const dane = srodowisko.interfejs.przygotujDaneTabeliPomp({
    pompy: {
      status: "obliczono",
      trybPomp: "oblicz-potrzebne",
      wynikMinimalnejFloty: { przydzialyTechniczne: [] },
      wynikiBudow: []
    }
  });

  assert.equal(dane.wiersze.length, 0);
  assert.equal(dane.opis, "Plan nie zawiera budów wymagających pompy.");
}

function sprawdzPodlaczenieWidoku() {
  const srodowisko = utworzSrodowisko();
  const kod = wczytaj("js/interfejs/minimalna_liczba_pomp.js");
  const konfiguracja = wczytaj("js/konfiguracja/konfiguracja.js");

  assert.equal(srodowisko.znacznikEtapu.textContent, "Etap 4I.3");
  assert.equal(srodowisko.stopkaEtapu.textContent, "4I.3 · tabela pomp");
  assert.match(konfiguracja, /punktEtapu:\s*"4I\.3"/);
  assert.match(kod, /panel-wyniku-pomp/);
  assert.match(kod, /wiersze-pomp-wynik/);
  assert.match(kod, /"Budowa",[\s\S]*"Pompa",[\s\S]*"Przygotowanie"/);
  assert.match(kod, /"Betonowanie",[\s\S]*"Zakończenie",[\s\S]*"Przejazd"/);
  assert.match(kod, /"Gotowa ponownie"/);
}

sprawdzRzeczywistyPrzydzial();
sprawdzMinimalnaFloteTechniczna();
sprawdzPlanBezPomp();
sprawdzPodlaczenieWidoku();

console.log("OK — 4I.3 tabela pomp pokazuje pełny cykl i przejazdy bez zmiany silnika.");
