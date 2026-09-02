"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");
const kluczV2 = "harmonogramBetonowan.pamiecTras.v2";

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function utworzPamiecLokalna() {
  const dane = new Map();
  return {
    getItem: (klucz) => dane.has(klucz) ? dane.get(klucz) : null,
    setItem: (klucz, wartosc) => dane.set(klucz, String(wartosc)),
    removeItem: (klucz) => dane.delete(klucz),
    ustaw: (klucz, wartosc) => dane.set(klucz, String(wartosc))
  };
}

function uruchomPamiec(pamiec) {
  const okno = { localStorage: pamiec };
  okno.window = okno;
  const kontekst = { window: okno, Date, JSON, Error };
  vm.createContext(kontekst);
  new vm.Script(wczytaj("js/pamiec/pamiec_tras.js")).runInContext(kontekst);
  return okno.HarmonogramBetonowan.pamiecTras;
}

function daneTrasy(opis, adres, dojazd, powrot, dodatki) {
  return Object.assign({
    idWezla: "WEZEL-A",
    opisLokalizacji: opis,
    adresLokalizacji: adres ? { tekst: adres } : undefined,
    czasDojazduMinuty: dojazd,
    czasPowrotuMinuty: powrot,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  }, dodatki || {});
}

function sprawdzAdresJakoStabilnyKlucz() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  modul.zapiszTrase(daneTrasy(
    "Firma A | Nazwa pierwsza",
    "ul. Testowa 12, 00-001 Miasto",
    20,
    22
  ));
  modul.zapiszTrase(daneTrasy(
    "Inna firma | Inna nazwa",
    "UL. TESTOWA 12 00-001 MIASTO",
    24,
    26
  ));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 1);
  const wynik = modul.pobierzTrase(
    "Dowolna etykieta",
    "WEZEL-A",
    { adresLokalizacji: { tekst: "ul testowa 12, 00 001 miasto" } }
  );
  assert.equal(wynik.status, "odczytano-trase");
  assert.equal(wynik.trasa.rodzajKluczaLokalizacji, "adres");
  assert.equal(wynik.trasa.czasDojazduMinuty, 24);
}

function sprawdzTaSamaNazwaNieLaczyRoznychAdresow() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  modul.zapiszTrase(daneTrasy("Firma X | Budowa", "Testowa 1, Miasto", 10, 11));
  modul.zapiszTrase(daneTrasy("Firma X | Budowa", "Testowa 2, Miasto", 30, 31));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 2);
  assert.equal(
    modul.pobierzTrase(
      "Firma X | Budowa",
      "WEZEL-A",
      { adresLokalizacji: { tekst: "Testowa 1, Miasto" } }
    ).trasa.czasDojazduMinuty,
    10
  );
  assert.equal(
    modul.pobierzTrase(
      "Firma X | Budowa",
      "WEZEL-A",
      { adresLokalizacji: { tekst: "Testowa 2, Miasto" } }
    ).trasa.czasDojazduMinuty,
    30
  );
  const bezAdresu = modul.pobierzTrase("Firma X | Budowa", "WEZEL-A");
  assert.equal(bezAdresu.status, "niejednoznaczna-lokalizacja");
  assert.equal(bezAdresu.trasa, null);
}

function sprawdzWspolrzedneMajaPierwszenstwo() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const wspolrzedne = {
    szerokoscGeograficzna: 50.85,
    dlugoscGeograficzna: 16.32
  };
  modul.zapiszTrase(daneTrasy(
    "Pierwsza nazwa",
    "Stary adres 1, Miasto",
    15,
    16,
    { wspolrzedneLokalizacji: wspolrzedne }
  ));
  modul.zapiszTrase(daneTrasy(
    "Druga nazwa",
    "Poprawiony adres 99, Miasto",
    18,
    19,
    { wspolrzedneLokalizacji: { szerokoscGeograficzna: "50.8500", dlugoscGeograficzna: "16.3200" } }
  ));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 1);
  const wynik = modul.pobierzTrase(
    "Jeszcze inna nazwa",
    "WEZEL-A",
    { wspolrzedneLokalizacji: wspolrzedne }
  );
  assert.equal(wynik.trasa.rodzajKluczaLokalizacji, "wspolrzedne");
  assert.equal(wynik.trasa.czasDojazduMinuty, 18);
}

function sprawdzZakresWezla() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const adres = { tekst: "Testowa 10, Miasto" };
  modul.zapiszTrase(Object.assign(daneTrasy("Budowa", null, 12, 13), {
    idWezla: "WEZEL-A",
    adresLokalizacji: adres
  }));
  modul.zapiszTrase(Object.assign(daneTrasy("Budowa", null, 32, 33), {
    idWezla: "WEZEL-B",
    adresLokalizacji: adres
  }));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 2);
  assert.equal(
    modul.pobierzTrase("Budowa", "WEZEL-A", { adresLokalizacji: adres }).trasa.czasDojazduMinuty,
    12
  );
  assert.equal(
    modul.pobierzTrase("Budowa", "WEZEL-B", { adresLokalizacji: adres }).trasa.czasDojazduMinuty,
    32
  );
}

function sprawdzOpisZgodnosciowyPozostajeBezpieczny() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const opisowyAdres = {
    tekst: "Plac A",
    czesci: { firma: "Firma A", nazwaBudowy: "Plac A" }
  };
  modul.zapiszTrase(daneTrasy(
    "Firma A | Plac A",
    null,
    21,
    22,
    { adresLokalizacji: opisowyAdres }
  ));

  const lista = modul.pobierzListeTras().trasy;
  assert.equal(lista[0].rodzajKluczaLokalizacji, "opis-zgodnosciowy");
  assert.equal(
    modul.pobierzTrase("Firma A | Plac A etap 2", "WEZEL-A").status,
    "brak-trasy"
  );
}

function sprawdzMigracjeStaregoV2IScalenieDuplikatu() {
  const pamiec = utworzPamiecLokalna();
  const baza = {
    idWezla: "WEZEL-A",
    idWezlaZnormalizowany: "wezel a",
    adresLokalizacji: { tekst: "Testowa 7, 00-001 Miasto", tekstZnormalizowany: null, czesci: {} },
    wspolrzedneLokalizacji: null,
    dystansDojazduMetry: null,
    dystansPowrotuMetry: null,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny",
    zrodloDanych: "reczny",
    dostawcaDanych: null,
    utworzono: "2026-09-02T10:00:00.000Z",
    zaktualizowano: "2026-09-02T10:00:00.000Z",
    ostatnioUzyto: "2026-09-02T10:00:00.000Z"
  };
  const pierwsza = Object.assign({}, baza, {
    kluczTrasy: "wezel a::pierwsza nazwa",
    opisLokalizacji: "Pierwsza nazwa",
    opisZnormalizowany: "pierwsza nazwa",
    czasDojazduMinuty: 11,
    czasPowrotuMinuty: 12
  });
  const druga = Object.assign({}, baza, {
    kluczTrasy: "wezel a::druga nazwa",
    opisLokalizacji: "Druga nazwa",
    opisZnormalizowany: "druga nazwa",
    czasDojazduMinuty: 31,
    czasPowrotuMinuty: 32,
    zaktualizowano: "2026-09-02T11:00:00.000Z",
    ostatnioUzyto: "2026-09-02T11:00:00.000Z"
  });
  pamiec.ustaw(kluczV2, JSON.stringify({ wersja: 2, trasy: [pierwsza, druga] }));

  const modul = uruchomPamiec(pamiec);
  const stan = modul.pobierzStanPamieci();
  assert.equal(stan.liczbaTras, 1);
  const ksiazka = JSON.parse(pamiec.getItem(kluczV2));
  assert.equal(ksiazka.trasy[0].rodzajKluczaLokalizacji, "adres");
  assert.equal(ksiazka.trasy[0].czasDojazduMinuty, 31);
  assert.match(ksiazka.trasy[0].kluczTrasy, /::adres::testowa 7 00 001 miasto$/);
}

function uruchomAplikacje() {
  const pamiec = utworzPamiecLokalna();
  const okno = { localStorage: pamiec };
  okno.window = okno;
  const kontekst = { window: okno, Date, JSON, Error, Promise };
  vm.createContext(kontekst);
  [
    "js/budowy/budowy.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/pamiec/pamiec_tras.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });
  return okno.HarmonogramBetonowan;
}

function sprawdzIntegracjeBudowZPamiecia() {
  const aplikacja = uruchomAplikacje();
  const budowaA = {
    idBudowy: "B-A",
    firma: "Firma A",
    budowa: "Nazwa A",
    zrodlo: "csv",
    adresZrodlowy: { tekst: "Testowa 15, 00-001 Miasto", czesci: {} },
    czasDojazduRoboczyMinuty: 23,
    czasPowrotuRoboczyMinuty: 25,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  };
  aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci(budowaA);

  const budowaTenSamAdres = {
    idBudowy: "B-B",
    firma: "Inna Firma",
    budowa: "Inna nazwa",
    zrodlo: "csv",
    adresZrodlowy: { tekst: "TESTOWA 15 00-001 MIASTO", czesci: {} }
  };
  const wynikTenSamAdres = aplikacja.lokalizacje.uzupelnijBudoweZPamieci(
    budowaTenSamAdres
  );
  assert.equal(wynikTenSamAdres.czyUzupelniono, true);
  assert.equal(budowaTenSamAdres.czasDojazduRoboczyMinuty, 23);

  const budowaTaSamaNazwaInnyAdres = {
    idBudowy: "B-C",
    firma: "Firma A",
    budowa: "Nazwa A",
    zrodlo: "csv",
    adresZrodlowy: { tekst: "Testowa 99, 00-001 Miasto", czesci: {} }
  };
  const wynikInnyAdres = aplikacja.lokalizacje.uzupelnijBudoweZPamieci(
    budowaTaSamaNazwaInnyAdres
  );
  assert.equal(wynikInnyAdres.czyUzupelniono, false);
  assert.equal(wynikInnyAdres.status, "brak-trasy");
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6D\.2 — stabilny klucz i duplikaty/);
  assert.match(plan, /### 6D\.2 — stabilny klucz i duplikaty/);
  assert.match(decyzje, /## 128\. Tożsamość pamięci tras preferuje współrzędne i adres/);
  assert.match(kontrakt, /## Stabilny klucz pamięci tras — 6D\.2/);
}

sprawdzAdresJakoStabilnyKlucz();
sprawdzTaSamaNazwaNieLaczyRoznychAdresow();
sprawdzWspolrzedneMajaPierwszenstwo();
sprawdzZakresWezla();
sprawdzOpisZgodnosciowyPozostajeBezpieczny();
sprawdzMigracjeStaregoV2IScalenieDuplikatu();
sprawdzIntegracjeBudowZPamiecia();
sprawdzDokumentacje();

console.log("OK — 6D.2 używa stabilnej tożsamości lokalizacji i nie scala różnych adresów po nazwie.");
