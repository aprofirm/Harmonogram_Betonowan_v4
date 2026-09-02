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
  const kontekst = {
    window: {},
    TextDecoder: TextDecoder,
    FileReader: function () {}
  };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/import/import_csv.js",
    "js/budowy/budowy.js",
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzPelnyAdresStrukturalny(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Ulica;Numer budynku;Miejscowość",
    "B-301;Firma A;Hala A;08:00;Próbna;12A;Miasto Testowe"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "6b3-pelny.csv").budowy[0];

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.modelLokalizacji.daneZrodlowe.statusJakosci, "nieoceniona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "pelna");

  const informacje = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    budowa.modelLokalizacji.daneRobocze.adres,
    budowa.modelLokalizacji.daneRobocze.statusJakosci
  );
  assert.equal(informacje.czyMoznaSzukacAutomatycznie, true);
  assert.equal(informacje.czyWymagaUwagiOperatora, false);
  assert.match(informacje.komunikatOperatora, /kompletny/i);
}

function sprawdzAdresNiepelnyAleWyszukiwalny(aplikacja) {
  const adres = {
    czesci: {
      ulica: "Spacerowa",
      miejscowosc: "Miasto Próbne",
      wojewodztwo: "dolnośląskie"
    }
  };
  const ocena = aplikacja.lokalizacje.ocenAdresLokalnie(adres);
  const informacje = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    adres,
    "nieoceniona"
  );

  assert.equal(ocena.statusJakosci, "niepelna");
  assert.equal(ocena.czyMoznaSzukacAutomatycznie, true);
  assert.equal(informacje.statusJakosci, "niepelna");
  assert.equal(informacje.czyWymagaUwagiOperatora, true);
  assert.match(informacje.komunikatOperatora, /wynik wymaga sprawdzenia/i);
}

function sprawdzPelnyAdresWJednymPolu(aplikacja) {
  const ocenaPelna = aplikacja.lokalizacje.ocenAdresLokalnie({
    tekst: "ul. Testowa 7, Miasto Testowe"
  });
  const ocenaNiepelna = aplikacja.lokalizacje.ocenAdresLokalnie({
    tekst: "ul. Testowa, Miasto Testowe"
  });

  assert.equal(ocenaPelna.statusJakosci, "pelna");
  assert.equal(ocenaNiepelna.statusJakosci, "niepelna");
}

async function sprawdzNiewystarczajacyAdresNieBlokujeCzasow(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "B-302",
    firma: "Firma B",
    budowa: "Osiedle Zielone",
    startPlanowany: "09:00",
    iloscBetonuM3: "8"
  }, 2);

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.statusJakosci,
    "niewystarczajaca"
  );

  aplikacja.budowy.ustawCzasyRobocze(budowa, {
    czasDojazduRoboczyMinuty: 18,
    czasPowrotuRoboczyMinuty: 21,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  const wynik = await aplikacja.lokalizacje.pobierzLubUstalTrase(budowa);

  assert.equal(wynik.status, "uzyto-biezacych-czasow");
  assert.equal(wynik.czyWywolanoMape, false);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 18);
  assert.equal(budowa.czasPowrotuRoboczyMinuty, 21);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.statusJakosci,
    "niewystarczajaca"
  );
}

function sprawdzJawneStatusyWynikuWyszukiwania(aplikacja) {
  const adres = { tekst: "ul. Wieloznaczna 1, Miasto Testowe" };
  const niejednoznaczna = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    adres,
    "niejednoznaczna"
  );
  const nieznaleziona = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
    adres,
    "nieznaleziona"
  );
  const potwierdzona = aplikacja.lokalizacje.utworzModelLokalizacji({
    idLokalizacji: "B-303",
    daneRobocze: {
      adres: adres,
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });

  assert.equal(niejednoznaczna.statusJakosci, "niejednoznaczna");
  assert.equal(niejednoznaczna.czyMoznaSzukacAutomatycznie, false);
  assert.match(niejednoznaczna.komunikatOperatora, /więcej niż jedną/i);
  assert.equal(nieznaleziona.statusJakosci, "nieznaleziona");
  assert.match(nieznaleziona.komunikatOperatora, /nie znaleziono/i);
  assert.equal(potwierdzona.daneRobocze.statusJakosci, "potwierdzona");
}

function sprawdzBrakAdresu(aplikacja) {
  const ocena = aplikacja.lokalizacje.ocenAdresLokalnie({});
  const informacje = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu({}, "brak");

  assert.equal(ocena.statusJakosci, "brak");
  assert.equal(informacje.statusJakosci, "brak");
  assert.equal(informacje.czyMoznaSzukacAutomatycznie, false);
  assert.match(informacje.komunikatOperatora, /ręcznych czasów/i);
}

function sprawdzDokumentacjeIStatus() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const readme = wczytaj("README.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6B —/);
  assert.match(etapy, /- \[x\] \*\*6B\.3 —/);
  assert.match(planTestow, /### 6B\.3 — statusy i komunikaty/);
  assert.match(decyzje, /## 124\. Lokalna jakość adresu nie blokuje harmonogramu/);
  assert.match(readme, /Pełny[\s\S]*Niepełny[\s\S]*Niewystarczający/i);
  assert.match(kontrakt, /## Jakość adresu 6B\.3/);
}

async function uruchomTest() {
  const aplikacja = wczytajAplikacje();

  sprawdzPelnyAdresStrukturalny(aplikacja);
  sprawdzAdresNiepelnyAleWyszukiwalny(aplikacja);
  sprawdzPelnyAdresWJednymPolu(aplikacja);
  await sprawdzNiewystarczajacyAdresNieBlokujeCzasow(aplikacja);
  sprawdzJawneStatusyWynikuWyszukiwania(aplikacja);
  sprawdzBrakAdresu(aplikacja);
  sprawdzDokumentacjeIStatus();

  console.log(
    "OK — 6B.3 ocenia jakość adresu, daje komunikaty i nie blokuje ręcznych czasów."
  );
}

uruchomTest().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
