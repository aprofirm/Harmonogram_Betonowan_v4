"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajKontraktNadSztucznymSilnikiem(listaKonfliktow) {
  const zakresOkna = {
    HarmonogramBetonowan: {
      harmonogram: {
        przeliczCalyHarmonogram: function () {
          return {
            konflikty: listaKonfliktow
          };
        }
      }
    }
  };
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  new vm.Script(
    wczytaj("js/harmonogram/kontrakt_konfliktow.js"),
    { filename: "js/harmonogram/kontrakt_konfliktow.js" }
  ).runInContext(kontekst);

  return zakresOkna.HarmonogramBetonowan;
}

function wczytajKonfiguracje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = { window: zakresOkna };
  vm.createContext(kontekst);
  new vm.Script(
    wczytaj("js/konfiguracja/konfiguracja.js"),
    { filename: "js/konfiguracja/konfiguracja.js" }
  ).runInContext(kontekst);
  return zakresOkna.HarmonogramBetonowan.konfiguracja;
}

function sprawdzCzytelneKomunikatyKategorii() {
  const przyklady = [
    {
      fragment: "Nie można przydzielić 2 kursów",
      konflikt: {
        kod: "BRAK_DOSTEPNYCH_GRUSZEK",
        rodzaj: "gruszki",
        liczbaKursow: 2,
        opis: "Techniczny opis gruszek."
      }
    },
    {
      fragment: "Budowa „Budowa A”: nie znaleziono dostępnej pompy",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "brak-dostepnych-pomp",
        opis: "Techniczny opis pompy."
      }
    },
    {
      fragment: "żadna zgodna pompa nie jest dostępna w wymaganym czasie",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "po-dostepnosci",
        opis: "Techniczny opis dostępności."
      }
    },
    {
      fragment: "nie mają wystarczającego wysięgu",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "niewystarczajacy-wysieg",
        opis: "Techniczny opis wysięgu."
      }
    },
    {
      fragment: "Uzupełnij czas przejazdu między budowami",
      konflikt: {
        kod: "BRAK_MOZLIWEJ_POMPY",
        rodzaj: "pompy",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        przyczyna: "brak-trasy",
        opis: "Techniczny opis trasy."
      }
    },
    {
      fragment: "start przesunął się z 08:00 na 08:41",
      konflikt: {
        kod: "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU",
        rodzaj: "limit-opoznienia-startu",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        startZadany: "08:00",
        startRoboczy: "08:41",
        opoznienieStartuMinuty: 41,
        maksymalneOpoznienieStartuMinuty: 30,
        przekroczenieLimituMinuty: 11,
        opis: "Techniczny opis limitu startu."
      }
    },
    {
      fragment: "przerwa między końcem rozładunku kursu 1 a początkiem rozładunku kursu 2 wynosi 16 min",
      konflikt: {
        kod: "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA",
        rodzaj: "przestoj-betonowania",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        idPoprzedniegoKursu: "A-KURS-001",
        numerPoprzedniegoKursu: 1,
        idNastepnegoKursu: "A-KURS-002",
        numerNastepnegoKursu: 2,
        przestojMinuty: 16,
        maksymalnyPrzestojMinuty: 15,
        przekroczenieLimituMinuty: 1,
        opis: "Techniczny opis przestoju."
      }
    },
    {
      fragment: "nie osiągnął stabilności po 50 iteracjach",
      konflikt: {
        kod: "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI",
        rodzaj: "stabilizacja",
        liczbaIteracji: 50,
        maksymalnaLiczbaIteracji: 50,
        opis: "Techniczny opis stabilizacji."
      }
    },
    {
      fragment: "wykryto kolizję zasobu",
      konflikt: {
        kod: "KOLIZJA_ZASOBU",
        rodzaj: "zasoby",
        kategoriaKonfliktu: "kolizja",
        idBudowy: "A",
        nazwaBudowy: "Budowa A",
        opis: "Techniczny opis kolizji."
      }
    }
  ];

  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([]);
  przyklady.forEach(function (przyklad) {
    const zrodloPrzed = JSON.stringify(przyklad.konflikt);
    const wynik = aplikacja.konflikty.normalizujKonflikt(przyklad.konflikt);

    assert.ok(wynik.komunikatOperatora.includes(przyklad.fragment));
    assert.equal(wynik.opis, przyklad.konflikt.opis);
    assert.equal(JSON.stringify(przyklad.konflikt), zrodloPrzed);
    assert.ok(!wynik.komunikatOperatora.includes(wynik.kod));
  });
}

function sprawdzFallbackINiezaleznoscOdDeduplikacji() {
  const pierwszy = {
    kod: "NOWY_TYP",
    rodzaj: "inne",
    kategoriaKonfliktu: "inne",
    idBudowy: "A",
    opis: "Czytelny opis nowego typu konfliktu."
  };
  const drugi = Object.assign({}, pierwszy, {
    opis: "Inne sformułowanie tego samego konfliktu."
  });
  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([pierwszy, drugi]);
  const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({});

  assert.equal(wynik.konflikty.length, 1);
  assert.equal(
    wynik.konflikty[0].komunikatOperatora,
    "Czytelny opis nowego typu konfliktu."
  );
  assert.equal(wynik.konflikty[0].opis, pierwszy.opis);
}

function sprawdzPublicznaFunkcje() {
  const aplikacja = wczytajKontraktNadSztucznymSilnikiem([]);
  const konflikt = {
    kod: "BRAK_MOZLIWEJ_POMPY",
    rodzaj: "pompy",
    idBudowy: "B",
    nazwaBudowy: "Magazyn B",
    przyczyna: "brak-trasy",
    opis: "Opis techniczny."
  };
  const zrodloPrzed = JSON.stringify(konflikt);
  const komunikat = aplikacja.konflikty.utworzKomunikatOperatora(
    aplikacja.konflikty.normalizujKonflikt(konflikt)
  );

  assert.ok(komunikat.includes("Magazyn B"));
  assert.ok(komunikat.includes("Uzupełnij czas przejazdu"));
  assert.equal(JSON.stringify(konflikt), zrodloPrzed);
}

function sprawdzOznaczenieWersjiWebowej() {
  const html = wczytaj("index.html");

  assert.ok(html.includes("Etap 5H.3"));
  assert.ok(html.includes("5H.3 · czytelne przyczyny konfliktów"));
  assert.ok(html.includes("5h3-komunikaty-konfliktow-20260831a"));
}

sprawdzCzytelneKomunikatyKategorii();
sprawdzFallbackINiezaleznoscOdDeduplikacji();
sprawdzPublicznaFunkcje();
sprawdzOznaczenieWersjiWebowej();

assert.equal(wczytajKonfiguracje().punktEtapu, "5H.3");

console.log(
  "OK — 5H.3 dodaje każdemu konfliktowi czytelny polski komunikat operatorski bez zmiany danych technicznych ani agregacji."
);
