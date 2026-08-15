"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const kluczPlanu = "harmonogramBetonowan.planDnia.v1";
const kluczHistorii = "harmonogramBetonowan.historiaPlanu.v1";
const plikiJavaScript = [
  "js/konfiguracja/konfiguracja.js",
  "js/diagnostyka/diagnostyka.js",
  "js/pamiec/pamiec_planu.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/lokalizacje/lokalizacje.js",
  "js/harmonogram/harmonogram.js",
  "js/interfejs/interfejs.js",
  "js/aplikacja.js"
];

function utworzPamiecLokalna() {
  const dane = new Map();

  return {
    getItem: function (klucz) {
      return dane.has(klucz) ? dane.get(klucz) : null;
    },
    setItem: function (klucz, wartosc) {
      dane.set(klucz, String(wartosc));
    },
    removeItem: function (klucz) {
      dane.delete(klucz);
    }
  };
}

function utworzElementTestowy(czyFragment) {
  return {
    value: "",
    textContent: "",
    className: "",
    type: "",
    children: [],
    files: [],
    disabled: false,
    hidden: false,
    dataset: {},
    zdarzenia: {},
    czyFragment: Boolean(czyFragment),
    classList: {
      add: function () {},
      remove: function () {}
    },
    addEventListener: function (nazwaZdarzenia, obsluga) {
      this.zdarzenia[nazwaZdarzenia] = obsluga;
    },
    appendChild: function (element) {
      this.children.push(element);
      return element;
    },
    replaceChildren: function () {
      const noweDzieci = [];

      Array.from(arguments).forEach(function (element) {
        if (element && element.czyFragment) {
          element.children.forEach(function (dziecko) {
            noweDzieci.push(dziecko);
          });
        } else if (element) {
          noweDzieci.push(element);
        }
      });

      this.children = noweDzieci;
    },
    setAttribute: function (nazwa, wartosc) {
      this[nazwa] = wartosc;
    },
    click: function () {},
    remove: function () {},
    reset: function () {}
  };
}

function utworzDokumentTestowy() {
  const identyfikatory = [
    "poczatek-dnia",
    "pojemnosc-gruszki",
    "czas-zaladunku",
    "czas-rozladunku",
    "maksymalne-opoznienie",
    "przycisk-przelicz",
    "przycisk-wyczysc-plan",
    "sekcja-statusu",
    "tytul-statusu",
    "tresc-statusu",
    "liczba-budow",
    "liczba-kursow",
    "liczba-konfliktow",
    "wiersze-harmonogramu",
    "wiersze-kursow",
    "pole-pliku-csv",
    "przycisk-wybierz-csv",
    "pole-upuszczania-csv",
    "informacja-o-imporcie",
    "nazwa-pliku-csv",
    "szczegoly-pliku-csv",
    "formularz-budowy-recznej",
    "reczna-firma",
    "reczna-budowa",
    "reczny-start",
    "stan-diagnostyki",
    "podglad-logow",
    "przycisk-pobierz-raport",
    "przycisk-wyczysc-logi",
    "przycisk-historia-planow",
    "liczba-zapisow-historycznych",
    "stan-pamieci-planu",
    "okno-historii-planow",
    "przycisk-zamknij-historie",
    "lista-zapisow-historycznych"
  ];
  const elementy = {};

  identyfikatory.forEach(function (identyfikator) {
    elementy[identyfikator] = utworzElementTestowy(false);
  });
  elementy["okno-historii-planow"].hidden = true;

  return {
    readyState: "complete",
    body: { appendChild: function () {} },
    elementy: elementy,
    getElementById: function (identyfikator) {
      return elementy[identyfikator] || null;
    },
    createElement: function () {
      return utworzElementTestowy(false);
    },
    createDocumentFragment: function () {
      return utworzElementTestowy(true);
    },
    addEventListener: function () {}
  };
}

function uruchomAplikacje(pamiecLokalna, ustawieniaPotwierdzenia) {
  const dokument = utworzDokumentTestowy();
  const obslugiGlobalne = {};
  const zakresOkna = {
    document: dokument,
    localStorage: pamiecLokalna,
    Date: Date,
    Math: Math,
    Blob: Blob,
    URL: {
      createObjectURL: function () {
        return "blob:test";
      },
      revokeObjectURL: function () {}
    },
    confirm: function () {
      return ustawieniaPotwierdzenia.wynik;
    },
    addEventListener: function (nazwa, obsluga) {
      obslugiGlobalne[nazwa] = obsluga;
    }
  };
  zakresOkna.window = zakresOkna;

  const kontekst = {
    window: zakresOkna,
    document: dokument,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Error: Error,
    Blob: Blob,
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  vm.createContext(kontekst);

  plikiJavaScript.forEach(function (sciezkaPliku) {
    const kod = fs.readFileSync(path.join(katalogProjektu, sciezkaPliku), "utf8");
    new vm.Script(kod, { filename: sciezkaPliku }).runInContext(kontekst);
  });

  return {
    aplikacja: zakresOkna.HarmonogramBetonowan,
    dokument: dokument,
    obslugiGlobalne: obslugiGlobalne
  };
}

function odczytajDanePlanu(pamiecLokalna) {
  const pakiet = JSON.parse(pamiecLokalna.getItem(kluczPlanu));
  return pakiet.danePlanu;
}

function odczytajHistorie(pamiecLokalna) {
  return JSON.parse(pamiecLokalna.getItem(kluczHistorii));
}

function dodajBudoweReczna(srodowisko) {
  const elementy = srodowisko.dokument.elementy;
  elementy["reczna-firma"].value = "Firma ręczna";
  elementy["reczna-budowa"].value = "Plac ręczny";
  elementy["reczny-start"].value = "10:00";
  elementy["formularz-budowy-recznej"].zdarzenia.submit({
    preventDefault: function () {}
  });
}

async function wczytajCsv(srodowisko) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Beton;Ilosc_m3",
    "B-001;Firma CSV;Budowa CSV;08:00;C25/30;16"
  ].join("\n");
  const bufor = new TextEncoder().encode(csv);
  const polePliku = srodowisko.dokument.elementy["pole-pliku-csv"];

  polePliku.files = [{
    name: "plan-testowy.csv",
    size: bufor.byteLength,
    arrayBuffer: function () {
      return Promise.resolve(bufor.buffer);
    }
  }];
  polePliku.zdarzenia.change();
  await new Promise(function (zakoncz) {
    setImmediate(zakoncz);
  });
}

function znajdzPierwszePoleDojazdu(srodowisko) {
  const wiersze = srodowisko.dokument.elementy["wiersze-harmonogramu"].children;
  return wiersze[0].children[3].children[0];
}

async function uruchomTest() {
  const pamiecLokalna = utworzPamiecLokalna();
  const ustawieniaPotwierdzenia = { wynik: true };
  const pierwszaStrona = uruchomAplikacje(
    pamiecLokalna,
    ustawieniaPotwierdzenia
  );

  dodajBudoweReczna(pierwszaStrona);
  assert.equal(odczytajDanePlanu(pamiecLokalna).budowyReczne.length, 1);

  await wczytajCsv(pierwszaStrona);

  let danePlanu = odczytajDanePlanu(pamiecLokalna);
  const tekstDanychPlanu = JSON.stringify(danePlanu);

  assert.equal(danePlanu.nazwaPliku, "plan-testowy.csv");
  assert.equal(danePlanu.budowyZImportu.length, 1);
  assert.equal(danePlanu.budowyReczne.length, 1);
  assert.equal(danePlanu.czyHarmonogramPrzeliczony, false);
  assert.equal(Object.prototype.hasOwnProperty.call(danePlanu, "wierszeZrodlowe"), false);
  assert.doesNotMatch(tekstDanychPlanu, /daneZrodlowe/);

  const poleDojazdu = znajdzPierwszePoleDojazdu(pierwszaStrona);
  poleDojazdu.value = "25";
  poleDojazdu.zdarzenia.change();

  danePlanu = odczytajDanePlanu(pamiecLokalna);
  assert.equal(danePlanu.budowyZImportu[0].czasDojazduRoboczyMinuty, 25);
  assert.equal(danePlanu.budowyZImportu[0].czasPowrotuRoboczyMinuty, 25);

  const polePojemnosci = pierwszaStrona.dokument.elementy["pojemnosc-gruszki"];
  polePojemnosci.value = "9";
  polePojemnosci.zdarzenia.change();
  assert.equal(odczytajDanePlanu(pamiecLokalna).parametry.pojemnoscGruszkiM3, "9");

  polePojemnosci.value = "8";
  polePojemnosci.zdarzenia.change();
  pierwszaStrona.dokument.elementy["przycisk-przelicz"].zdarzenia.click();

  danePlanu = odczytajDanePlanu(pamiecLokalna);
  assert.equal(danePlanu.czyHarmonogramPrzeliczony, true);
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);
  assert.equal(pierwszaStrona.dokument.elementy["liczba-kursow"].textContent, "2");

  pierwszaStrona.dokument.elementy["przycisk-przelicz"].zdarzenia.click();
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);

  const stronaPoOdswiezeniu = uruchomAplikacje(
    pamiecLokalna,
    ustawieniaPotwierdzenia
  );

  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "2");
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-kursow"].textContent, "2");
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["nazwa-pliku-csv"].textContent,
    "plan-testowy.csv"
  );

  ustawieniaPotwierdzenia.wynik = false;
  stronaPoOdswiezeniu.dokument.elementy["przycisk-wyczysc-plan"].zdarzenia.click();
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "2");
  assert.notEqual(pamiecLokalna.getItem(kluczPlanu), null);

  ustawieniaPotwierdzenia.wynik = true;
  stronaPoOdswiezeniu.dokument.elementy["przycisk-wyczysc-plan"].zdarzenia.click();
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "0");
  assert.equal(pamiecLokalna.getItem(kluczPlanu), null);
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);

  stronaPoOdswiezeniu.dokument.elementy["przycisk-historia-planow"].zdarzenia.click();
  const listaHistorii = stronaPoOdswiezeniu.dokument.elementy[
    "lista-zapisow-historycznych"
  ];
  assert.equal(listaHistorii.children.length, 1);
  listaHistorii.children[0].children[1].zdarzenia.click();

  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "2");
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-kursow"].textContent, "2");
  assert.notEqual(pamiecLokalna.getItem(kluczPlanu), null);
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);

  console.log(
    "✓ KP-1.3–KP-1.7: zapis automatyczny, odświeżenie, historia i czyszczenie działają."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
