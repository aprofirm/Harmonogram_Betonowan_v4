"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function wczytajAplikacje() {
  const zakresOkna = {};
  zakresOkna.window = zakresOkna;
  const kontekst = {
    window: zakresOkna,
    TextDecoder: TextDecoder,
    FileReader: function () {},
    Map: Map,
    Set: Set
  };
  vm.createContext(kontekst);

  [
    "js/konfiguracja/konfiguracja.js",
    "js/budowy/budowy.js",
    "js/import/import_csv.js",
    "js/pompy/pompy.js",
    "js/pompy/dostepnosc_pomp.js",
    "js/pompy/przejazdy_pomp.js",
    "js/pompy/przydzial_pomp.js",
    "js/pompy/minimalna_liczba_pomp.js",
    "js/pompy/ograniczony_przydzial_pomp.js",
    "js/pompy/jawne_konsekwencje_pomp.js",
    "js/gruszki/gruszki.js",
    "js/gruszki/przydzial_gruszek.js",
    "js/lokalizacje/lokalizacje.js",
    "js/harmonogram/harmonogram.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka })
      .runInContext(kontekst);
  });

  return zakresOkna.HarmonogramBetonowan;
}

function utworzStanImportu(aplikacja, wiersze) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;IloscBetonu;RodzajRozladunku;CzasDojazdu;CzasPowrotu"
  ].concat(wiersze).join("\n");

  return aplikacja.importCsv.przetworzCsv(csv, "etap-5g1.csv");
}

function przelicz(aplikacja, stanImportu, liczbaGruszek) {
  return aplikacja.harmonogram.przeliczCalyHarmonogram({
    stanImportu: stanImportu,
    listaPomp: [],
    parametry: {
      pojemnoscGruszkiM3: 8,
      czasZaladunkuMinuty: 10,
      czasRozladunkuMinuty: 15,
      trybPomp: "mam-okreslona-liczbe",
      liczbaDostepnychPomp: 0,
      trybGruszek: "mam-okreslona-liczbe",
      liczbaDostepnychGruszek: liczbaGruszek
    }
  });
}

function pobierzBudowe(wynik, idBudowy) {
  const budowa = wynik.budowy.find(function (pozycja) {
    return pozycja.idBudowy === idBudowy;
  });

  assert.ok(budowa, "Wynik powinien zawierać budowę „" + idBudowy + "”.");
  return budowa;
}

function pobierzKursyBudowy(wynik, idBudowy) {
  return wynik.kursy.filter(function (kurs) {
    return kurs.idBudowy === idBudowy;
  });
}

function sprawdzPrzestojePoRzeczywistymPrzydziale() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja, [
    "A;Alfa;Budowa A;08:00;24;Lej;0;0"
  ]);
  const zrodloPrzed = JSON.stringify(stanImportu);
  const wynik = przelicz(aplikacja, stanImportu, 1);
  const analiza = pobierzBudowe(wynik, "A")
    .analizaPrzestojowBetonowania;

  assert.deepEqual(
    Array.from(pobierzKursyBudowy(wynik, "A"), function (kurs) {
      return kurs.godzinaRozpoczeciaRozladunku;
    }),
    ["08:00", "08:25", "08:50"],
    "Przestoje muszą korzystać z rzeczywistych godzin po przydziale gruszki."
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(analiza)),
    {
      liczbaPrzydzielonychDostaw: 3,
      liczbaPrzerwMiedzyDostawami: 2,
      liczbaPrzestojow: 2,
      najdluzszyPrzestojMinuty: 10,
      przerwyMiedzyDostawami: [{
        idPoprzedniegoKursu: "A-KURS-001",
        numerPoprzedniegoKursu: 1,
        idNastepnegoKursu: "A-KURS-002",
        numerNastepnegoKursu: 2,
        minutaZakonczeniaPoprzedniegoRozladunku: 495,
        godzinaZakonczeniaPoprzedniegoRozladunku: "08:15",
        minutaRozpoczeciaNastepnegoRozladunku: 505,
        godzinaRozpoczeciaNastepnegoRozladunku: "08:25",
        przestojMinuty: 10
      }, {
        idPoprzedniegoKursu: "A-KURS-002",
        numerPoprzedniegoKursu: 2,
        idNastepnegoKursu: "A-KURS-003",
        numerNastepnegoKursu: 3,
        minutaZakonczeniaPoprzedniegoRozladunku: 520,
        godzinaZakonczeniaPoprzedniegoRozladunku: "08:40",
        minutaRozpoczeciaNastepnegoRozladunku: 530,
        godzinaRozpoczeciaNastepnegoRozladunku: "08:50",
        przestojMinuty: 10
      }]
    },
    "Każda przerwa powinna wskazywać dokładną parę rzeczywistych dostaw."
  );
  assert.equal(
    wynik.konflikty.some(function (konflikt) {
      return konflikt.rodzaj === "przestoj-betonowania";
    }),
    false,
    "Przerwa 10 min pozostaje w domyślnym limicie 15 min także po 5G.3."
  );
  assert.equal(
    JSON.stringify(stanImportu),
    zrodloPrzed,
    "Analiza przestojów nie może mutować źródłowego stanu importu."
  );

  const wynikPowtorny = przelicz(aplikacja, stanImportu, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(
      pobierzBudowe(wynikPowtorny, "A").analizaPrzestojowBetonowania
    )),
    JSON.parse(JSON.stringify(analiza)),
    "Identyczne dane powinny dawać identyczną analizę przestojów."
  );
}

function sprawdzZeOpoznionaPierwszaDostawaNieJestPrzestojem() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja, [
    "X;Delta;Budowa X;07:50;8;Lej;0;0",
    "A;Alfa;Budowa A;08:00;16;Lej;0;0"
  ]);
  const wynik = przelicz(aplikacja, stanImportu, 1);
  const kursyBudowyA = pobierzKursyBudowy(wynik, "A");
  const analizaA = pobierzBudowe(wynik, "A")
    .analizaPrzestojowBetonowania;

  assert.equal(
    kursyBudowyA[0].godzinaRozpoczeciaRozladunku,
    "08:15",
    "Pierwsza dostawa A powinna być rzeczywiście opóźniona o 15 min."
  );
  assert.equal(analizaA.liczbaPrzydzielonychDostaw, 2);
  assert.equal(analizaA.liczbaPrzerwMiedzyDostawami, 1);
  assert.equal(analizaA.liczbaPrzestojow, 1);
  assert.equal(analizaA.najdluzszyPrzestojMinuty, 10);
  assert.equal(
    analizaA.przerwyMiedzyDostawami[0].przestojMinuty,
    10,
    "Analiza ma liczyć tylko 08:30 → 08:40, bez opóźnienia pierwszej dostawy."
  );
  assert.equal(
    pobierzBudowe(wynik, "X")
      .analizaPrzestojowBetonowania.liczbaPrzerwMiedzyDostawami,
    0,
    "Pojedyncza dostawa nie tworzy przerwy przed swoim początkiem."
  );
}

function sprawdzCiagloscIOdrzucenieNieprzydzielonychKursow() {
  const aplikacja = wczytajAplikacje();
  const stanImportu = utworzStanImportu(aplikacja, [
    "A;Alfa;Budowa A;08:00;24;Lej;0;0"
  ]);
  const wynikCiagly = przelicz(aplikacja, stanImportu, 2);
  const analizaCiagla = pobierzBudowe(wynikCiagly, "A")
    .analizaPrzestojowBetonowania;

  assert.equal(analizaCiagla.liczbaPrzerwMiedzyDostawami, 2);
  assert.equal(analizaCiagla.liczbaPrzestojow, 0);
  assert.equal(analizaCiagla.najdluzszyPrzestojMinuty, 0);
  assert.deepEqual(
    Array.from(analizaCiagla.przerwyMiedzyDostawami, function (przerwa) {
      return przerwa.przestojMinuty;
    }),
    [0, 0],
    "Rozładunki stykające się w czasie powinny mieć jawny przestój 0 min."
  );

  const wynikBezGruszek = przelicz(aplikacja, stanImportu, 0);
  const analizaBezGruszek = pobierzBudowe(wynikBezGruszek, "A")
    .analizaPrzestojowBetonowania;

  assert.equal(
    pobierzKursyBudowy(wynikBezGruszek, "A").every(function (kurs) {
      return kurs.statusKursu === "nieprzydzielony-brak-gruszki";
    }),
    true
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(analizaBezGruszek)),
    {
      liczbaPrzydzielonychDostaw: 0,
      liczbaPrzerwMiedzyDostawami: 0,
      liczbaPrzestojow: 0,
      najdluzszyPrzestojMinuty: 0,
      przerwyMiedzyDostawami: []
    },
    "Nieprzydzielone kursy nie mogą tworzyć fikcyjnych przestojów."
  );
}

sprawdzPrzestojePoRzeczywistymPrzydziale();
sprawdzZeOpoznionaPierwszaDostawaNieJestPrzestojem();
sprawdzCiagloscIOdrzucenieNieprzydzielonychKursow();

assert.equal(wczytajAplikacje().konfiguracja.punktEtapu, "5H.2");

console.log(
  "OK — 5G.1 liczy rzeczywiste przerwy między przydzielonymi dostawami bez mieszania pierwszego opóźnienia."
);
