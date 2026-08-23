"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const kluczPlanu = "harmonogramBetonowan.planDnia.v1";
const kluczHistorii = "harmonogramBetonowan.historiaPlanu.v1";
const kluczPamieciTras = "harmonogramBetonowan.pamiecTras.v1";
const plikiJavaScript = [
  "js/konfiguracja/konfiguracja.js",
  "js/diagnostyka/diagnostyka.js",
  "js/pamiec/pamiec_planu.js",
  "js/pamiec/pamiec_tras.js",
  "js/import/import_csv.js",
  "js/budowy/budowy.js",
  "js/pompy/pompy.js",
  "js/gruszki/gruszki.js",
  "js/gruszki/przydzial_gruszek.js",
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
    "tryb-gruszek",
    "liczba-dostepnych-gruszek",
    "przycisk-przelicz",
    "przycisk-wyczysc-plan",
    "sekcja-statusu",
    "tytul-statusu",
    "tresc-statusu",
    "liczba-budow",
    "liczba-kursow",
    "minimalna-liczba-gruszek",
    "liczba-dostepnych-gruszek-wynik",
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
    "reczna-ilosc-betonu",
    "stan-diagnostyki",
    "podglad-logow",
    "przycisk-pobierz-raport",
    "przycisk-wyczysc-logi",
    "przycisk-historia-planow",
    "liczba-zapisow-historycznych",
    "stan-pamieci-planu",
    "liczba-znanych-tras",
    "stan-pamieci-tras",
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
  elementy["reczna-ilosc-betonu"].value = "8";
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

function znajdzPierwszaKomorkeRozladunku(srodowisko) {
  const wiersze = srodowisko.dokument.elementy["wiersze-harmonogramu"].children;
  return wiersze[0].children[6];
}

function znajdzPierwszaKomorkeStartu(srodowisko) {
  const wiersze = srodowisko.dokument.elementy["wiersze-harmonogramu"].children;
  return wiersze[0].children[0];
}

function sprawdzMigracjeTrasZeStarszegoPlanu() {
  const pamiecLokalna = utworzPamiecLokalna();
  const ustawieniaPotwierdzenia = { wynik: true };
  const srodowiskoPrzygotowawcze = uruchomAplikacje(
    pamiecLokalna,
    ustawieniaPotwierdzenia
  );
  const pierwszaBudowa = srodowiskoPrzygotowawcze.aplikacja.budowy
    .utworzBudoweZImportu({
      idBudowy: "PLAN-001",
      firma: "Firma starszego planu A",
      budowa: "Budowa starszego planu A",
      startPlanowany: "08:00",
      iloscBetonuM3: "8"
    }, 2);
  const drugaBudowa = srodowiskoPrzygotowawcze.aplikacja.budowy
    .utworzBudoweZImportu({
      idBudowy: "PLAN-002",
      firma: "Firma starszego planu B",
      budowa: "Budowa starszego planu B",
      startPlanowany: "09:00",
      iloscBetonuM3: "8"
    }, 3);
  const niekompletnaBudowa = srodowiskoPrzygotowawcze.aplikacja.budowy
    .utworzBudoweZImportu({
      idBudowy: "PLAN-003",
      firma: "Firma bez powrotu",
      budowa: "Budowa bez powrotu",
      startPlanowany: "10:00",
      iloscBetonuM3: "8"
    }, 4);

  srodowiskoPrzygotowawcze.aplikacja.budowy.ustawCzasyRobocze(
    pierwszaBudowa,
    {
      czasDojazduRoboczyMinuty: 14,
      czasPowrotuRoboczyMinuty: 16,
      zrodloCzasuDojazdu: "reczny",
      zrodloCzasuPowrotu: "reczny"
    }
  );
  srodowiskoPrzygotowawcze.aplikacja.budowy.ustawCzasyRobocze(
    drugaBudowa,
    {
      czasDojazduRoboczyMinuty: 22,
      czasPowrotuRoboczyMinuty: 25,
      zrodloCzasuDojazdu: "mapa",
      zrodloCzasuPowrotu: "mapa"
    }
  );
  niekompletnaBudowa.czasDojazduRoboczyMinuty = 11;
  pierwszaBudowa.dodatkowyCzasRozladunkuMinuty = 10;
  delete pierwszaBudowa.czasRozladunkuRoboczyMinuty;
  delete drugaBudowa.czasRozladunkuRoboczyMinuty;
  delete niekompletnaBudowa.czasRozladunkuRoboczyMinuty;

  pamiecLokalna.removeItem(kluczPamieciTras);
  pamiecLokalna.setItem(kluczPlanu, JSON.stringify({
    wersja: 1,
    zapisano: "2026-08-15T12:00:00.000Z",
    danePlanu: {
      wersjaStanuAplikacji: 1,
      nazwaPliku: "starszy-plan.csv",
      separator: ";",
      ostrzezeniaImportu: [],
      budowyZImportu: [pierwszaBudowa, drugaBudowa, niekompletnaBudowa],
      budowyReczne: [],
      parametry: { czasRozladunkuMinuty: "15" },
      czyHarmonogramPrzeliczony: false
    }
  }));

  const stronaPoAktualizacji = uruchomAplikacje(
    pamiecLokalna,
    ustawieniaPotwierdzenia
  );
  const ksiazkaTras = JSON.parse(
    pamiecLokalna.getItem(kluczPamieciTras)
  );

  assert.equal(ksiazkaTras.trasy.length, 2);
  assert.equal(
    stronaPoAktualizacji.dokument.elementy["liczba-znanych-tras"].textContent,
    "2"
  );
  assert.deepEqual(
    ksiazkaTras.trasy.map(function (trasa) {
      return [trasa.czasDojazduMinuty, trasa.czasPowrotuMinuty];
    }),
    [[14, 16], [22, 25]]
  );
  const zmigrowanyPlan = odczytajDanePlanu(pamiecLokalna);
  assert.equal(
    zmigrowanyPlan.budowyZImportu[0].czasRozladunkuRoboczyMinuty,
    25
  );
  assert.equal(
    zmigrowanyPlan.budowyZImportu[0].dodatkowyCzasRozladunkuMinuty,
    0
  );
  assert.equal(
    stronaPoAktualizacji.dokument.elementy["wiersze-harmonogramu"]
      .children[0].children[6].children[0].children[0].value,
    "25"
  );
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
  assert.equal(danePlanu.budowyReczne[0].iloscBetonuLiczbaM3, 8);
  assert.equal(danePlanu.budowyReczne[0].iloscBetonuBazowaLiczbaM3, 8);
  assert.equal(danePlanu.czyHarmonogramPrzeliczony, false);
  assert.equal(Object.prototype.hasOwnProperty.call(danePlanu, "wierszeZrodlowe"), false);
  assert.doesNotMatch(tekstDanychPlanu, /daneZrodlowe/);

  const poleDojazdu = znajdzPierwszePoleDojazdu(pierwszaStrona);
  poleDojazdu.value = "25";
  poleDojazdu.zdarzenia.change();

  danePlanu = odczytajDanePlanu(pamiecLokalna);
  assert.equal(danePlanu.budowyZImportu[0].czasDojazduRoboczyMinuty, 25);
  assert.equal(danePlanu.budowyZImportu[0].czasPowrotuRoboczyMinuty, 25);
  assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieciTras)).trasy.length, 1);

  await wczytajCsv(pierwszaStrona);
  const poleDojazduZPamieci = znajdzPierwszePoleDojazdu(pierwszaStrona);
  assert.equal(poleDojazduZPamieci.value, "25");
  assert.equal(
    odczytajDanePlanu(pamiecLokalna).budowyZImportu[0].zrodloCzasuDojazdu,
    "pamiec"
  );
  assert.equal(
    pierwszaStrona.dokument.elementy["liczba-znanych-tras"].textContent,
    "1"
  );
  assert.equal(
    pierwszaStrona.dokument.elementy["wiersze-harmonogramu"]
      .children[0].children[3].children[1].textContent,
    "Z pamięci"
  );

  let komorkaRozladunku = znajdzPierwszaKomorkeRozladunku(pierwszaStrona);
  assert.equal(komorkaRozladunku.children[0].children[0].value, "15");
  assert.equal(komorkaRozladunku.children[0].children[1].disabled, true);
  assert.equal(komorkaRozladunku.children[1].textContent, "Z ustawień");

  const poleGlobalnegoRozladunku =
    pierwszaStrona.dokument.elementy["czas-rozladunku"];
  poleGlobalnegoRozladunku.value = "18";
  poleGlobalnegoRozladunku.zdarzenia.change();
  komorkaRozladunku = znajdzPierwszaKomorkeRozladunku(pierwszaStrona);
  assert.equal(komorkaRozladunku.children[0].children[0].value, "18");

  komorkaRozladunku.children[0].children[0].value = "20";
  komorkaRozladunku.children[0].children[0].zdarzenia.change();
  komorkaRozladunku = znajdzPierwszaKomorkeRozladunku(pierwszaStrona);
  assert.equal(komorkaRozladunku.children[0].children[0].value, "20");
  assert.equal(komorkaRozladunku.children[0].children[1].disabled, false);
  assert.equal(komorkaRozladunku.children[1].textContent, "Ręcznie");

  poleGlobalnegoRozladunku.value = "16";
  poleGlobalnegoRozladunku.zdarzenia.change();
  komorkaRozladunku = znajdzPierwszaKomorkeRozladunku(pierwszaStrona);
  assert.equal(komorkaRozladunku.children[0].children[0].value, "20");
  komorkaRozladunku.children[0].children[1].zdarzenia.click();
  komorkaRozladunku = znajdzPierwszaKomorkeRozladunku(pierwszaStrona);
  assert.equal(komorkaRozladunku.children[0].children[0].value, "16");
  assert.equal(komorkaRozladunku.children[1].textContent, "Z ustawień");

  poleGlobalnegoRozladunku.value = "15";
  poleGlobalnegoRozladunku.zdarzenia.change();
  komorkaRozladunku = znajdzPierwszaKomorkeRozladunku(pierwszaStrona);
  komorkaRozladunku.children[0].children[0].value = "19";
  komorkaRozladunku.children[0].children[0].zdarzenia.change();
  assert.equal(
    odczytajDanePlanu(pamiecLokalna).budowyZImportu[0]
      .czasRozladunkuRoboczyMinuty,
    19
  );

  let wierszBudowyRecznej = pierwszaStrona.dokument.elementy[
    "wiersze-harmonogramu"
  ].children[1];
  let kontrolkiIlosci = wierszBudowyRecznej.children[7].children[0];
  kontrolkiIlosci.children[0].value = "12";
  kontrolkiIlosci.children[0].zdarzenia.change();
  assert.equal(odczytajDanePlanu(pamiecLokalna).budowyReczne[0].iloscBetonuLiczbaM3, 12);
  assert.equal(
    odczytajDanePlanu(pamiecLokalna).budowyReczne[0].iloscBetonuBazowaLiczbaM3,
    8
  );

  wierszBudowyRecznej = pierwszaStrona.dokument.elementy[
    "wiersze-harmonogramu"
  ].children[1];
  kontrolkiIlosci = wierszBudowyRecznej.children[7].children[0];
  assert.equal(kontrolkiIlosci.children[2].disabled, false);
  kontrolkiIlosci.children[2].zdarzenia.click();
  assert.equal(odczytajDanePlanu(pamiecLokalna).budowyReczne[0].iloscBetonuLiczbaM3, 8);

  wierszBudowyRecznej = pierwszaStrona.dokument.elementy[
    "wiersze-harmonogramu"
  ].children[1];
  const poleDojazduBudowyRecznej = wierszBudowyRecznej.children[3].children[0];
  poleDojazduBudowyRecznej.value = "10";
  poleDojazduBudowyRecznej.zdarzenia.change();

  const polePojemnosci = pierwszaStrona.dokument.elementy["pojemnosc-gruszki"];
  polePojemnosci.value = "9";
  polePojemnosci.zdarzenia.change();
  assert.equal(odczytajDanePlanu(pamiecLokalna).parametry.pojemnoscGruszkiM3, "9");

  polePojemnosci.value = "8";
  polePojemnosci.zdarzenia.change();
  const poleTrybuGruszek = pierwszaStrona.dokument.elementy["tryb-gruszek"];
  const poleLiczbyGruszek = pierwszaStrona.dokument.elementy[
    "liczba-dostepnych-gruszek"
  ];
  poleTrybuGruszek.value = "mam-okreslona-liczbe";
  poleTrybuGruszek.zdarzenia.change();
  poleLiczbyGruszek.value = "1";
  poleLiczbyGruszek.zdarzenia.change();
  assert.equal(poleLiczbyGruszek.disabled, false);
  assert.equal(
    odczytajDanePlanu(pamiecLokalna).parametry.trybGruszek,
    "mam-okreslona-liczbe"
  );
  assert.equal(
    odczytajDanePlanu(pamiecLokalna).parametry.liczbaDostepnychGruszek,
    "1"
  );
  pierwszaStrona.dokument.elementy["przycisk-przelicz"].zdarzenia.click();

  danePlanu = odczytajDanePlanu(pamiecLokalna);
  assert.equal(danePlanu.czyHarmonogramPrzeliczony, true);
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);
  assert.equal(pierwszaStrona.dokument.elementy["liczba-kursow"].textContent, "3");
  assert.equal(
    pierwszaStrona.dokument.elementy["minimalna-liczba-gruszek"].textContent,
    "2"
  );
  assert.equal(
    pierwszaStrona.dokument.elementy["liczba-dostepnych-gruszek-wynik"].textContent,
    "1"
  );

  pierwszaStrona.dokument.elementy["przycisk-przelicz"].zdarzenia.click();
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);

  let komorkaStartu = znajdzPierwszaKomorkeStartu(pierwszaStrona);
  assert.equal(komorkaStartu.children[0].children[0].type, "time");
  assert.equal(komorkaStartu.children[0].children[0].value, "08:00");
  assert.equal(komorkaStartu.children[0].children[1].disabled, true);
  assert.equal(komorkaStartu.children[1].textContent, "Plan: 08:00");

  komorkaStartu.children[0].children[0].value = "08:30";
  komorkaStartu.children[0].children[0].zdarzenia.change();
  danePlanu = odczytajDanePlanu(pamiecLokalna);
  assert.equal(danePlanu.budowyZImportu[0].startPlanowany, "08:00");
  assert.equal(danePlanu.budowyZImportu[0].startZadany, "08:30");
  assert.equal(danePlanu.budowyZImportu[0].startRoboczy, "08:30");
  assert.equal(danePlanu.czyHarmonogramPrzeliczony, false);
  assert.equal(pierwszaStrona.dokument.elementy["liczba-kursow"].textContent, "0");
  assert.equal(
    pierwszaStrona.dokument.elementy["tytul-statusu"].textContent,
    "Dane planu zostały zmienione"
  );

  komorkaStartu = znajdzPierwszaKomorkeStartu(pierwszaStrona);
  assert.equal(komorkaStartu.children[0].children[0].value, "08:30");
  assert.equal(komorkaStartu.children[0].children[1].disabled, false);
  assert.equal(komorkaStartu.children[1].textContent, "Plan: 08:00");
  komorkaStartu.children[0].children[1].zdarzenia.click();

  danePlanu = odczytajDanePlanu(pamiecLokalna);
  assert.equal(danePlanu.budowyZImportu[0].startPlanowany, "08:00");
  assert.equal(danePlanu.budowyZImportu[0].startZadany, "08:00");
  assert.equal(danePlanu.budowyZImportu[0].startRoboczy, "08:00");
  komorkaStartu = znajdzPierwszaKomorkeStartu(pierwszaStrona);
  assert.equal(komorkaStartu.children[0].children[1].disabled, true);

  pierwszaStrona.dokument.elementy["przycisk-przelicz"].zdarzenia.click();
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);

  const stronaPoOdswiezeniu = uruchomAplikacje(
    pamiecLokalna,
    ustawieniaPotwierdzenia
  );

  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "2");
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-kursow"].textContent, "3");
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["minimalna-liczba-gruszek"].textContent,
    "2"
  );
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["tryb-gruszek"].value,
    "mam-okreslona-liczbe"
  );
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["liczba-dostepnych-gruszek"].value,
    "1"
  );
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["liczba-dostepnych-gruszek-wynik"].textContent,
    "1"
  );
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["nazwa-pliku-csv"].textContent,
    "plan-testowy.csv"
  );
  assert.equal(
    znajdzPierwszaKomorkeRozladunku(stronaPoOdswiezeniu)
      .children[0].children[0].value,
    "19"
  );

  ustawieniaPotwierdzenia.wynik = false;
  stronaPoOdswiezeniu.dokument.elementy["przycisk-wyczysc-plan"].zdarzenia.click();
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "2");
  assert.notEqual(pamiecLokalna.getItem(kluczPlanu), null);

  ustawieniaPotwierdzenia.wynik = true;
  stronaPoOdswiezeniu.dokument.elementy["przycisk-wyczysc-plan"].zdarzenia.click();
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "0");
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["minimalna-liczba-gruszek"].textContent,
    "0"
  );
  assert.equal(pamiecLokalna.getItem(kluczPlanu), null);
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);
  assert.equal(JSON.parse(pamiecLokalna.getItem(kluczPamieciTras)).trasy.length, 2);

  stronaPoOdswiezeniu.dokument.elementy["przycisk-historia-planow"].zdarzenia.click();
  const listaHistorii = stronaPoOdswiezeniu.dokument.elementy[
    "lista-zapisow-historycznych"
  ];
  assert.equal(listaHistorii.children.length, 1);
  listaHistorii.children[0].children[1].zdarzenia.click();

  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-budow"].textContent, "2");
  assert.equal(stronaPoOdswiezeniu.dokument.elementy["liczba-kursow"].textContent, "3");
  assert.equal(
    stronaPoOdswiezeniu.dokument.elementy["minimalna-liczba-gruszek"].textContent,
    "2"
  );
  assert.notEqual(pamiecLokalna.getItem(kluczPlanu), null);
  assert.equal(odczytajHistorie(pamiecLokalna).zapisy.length, 1);

  console.log(
    "✓ KP-1 i KP-2.7.1: plan, historia, czyszczenie i migracja tras działają."
  );
}

sprawdzMigracjeTrasZeStarszegoPlanu();
uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
