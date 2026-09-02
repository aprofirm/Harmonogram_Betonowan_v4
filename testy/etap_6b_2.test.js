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

function sprawdzPelnyAdresBezUtratyZrodla(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany;Adres budowy",
    "B-001;Firma A;Magazyn Północ;08:00;ul. Łąkowa 12A, 58-100 Świdnica"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "6b2-pelny.csv").budowy[0];

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.daneZrodlowe["Adres budowy"], "ul. Łąkowa 12A, 58-100 Świdnica");
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.tekst,
    "ul. Łąkowa 12A, 58-100 Świdnica"
  );
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekstZnormalizowany, null);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Łąkowa 12A, 58-100 Świdnica"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "ul lakowa 12a 58 100 swidnica"
  );
}

function sprawdzSkladanieAdresuZCzesci(aplikacja) {
  const csv = [
    "Miasto;Nr domu;Firma;Kod pocztowy;StartPlanowany;Nazwa ulicy;Budowa;Gmina;Powiat;Województwo;Państwo;ID_Budowy",
    "Miasto Próbne;7A;Firma B;58-100;09:15;Spacerowa;Hala Północna;Gmina Próbna;Powiat Próbny;dolnośląskie;Polska;B-002"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "6b2-czesci.csv").budowy[0];

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekst, null);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "Spacerowa 7A, 58-100 Miasto Próbne, Gmina Próbna, Powiat Próbny, dolnośląskie, Polska"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "spacerowa 7a 58 100 miasto probne gmina probna powiat probny dolnoslaskie polska"
  );
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.czesci.wojewodztwo,
    "dolnośląskie"
  );
}

function sprawdzPowtarzalnoscINieZgadywanie(aplikacja) {
  const adresA = aplikacja.lokalizacje.utworzAdresRoboczy({
    tekst: "  UL. ŁĄKOWA 12, 58-100 ŚWIDNICA  "
  });
  const adresB = aplikacja.lokalizacje.utworzAdresRoboczy({
    tekst: "ul lakowa 12 / 58 100, swidnica"
  });
  const adresInny = aplikacja.lokalizacje.utworzAdresRoboczy({
    tekst: "ul. Łąkowa 12A, 58-100 Świdnica"
  });

  assert.equal(adresA.tekstZnormalizowany, "ul lakowa 12 58 100 swidnica");
  assert.equal(adresA.tekstZnormalizowany, adresB.tekstZnormalizowany);
  assert.notEqual(adresA.tekstZnormalizowany, adresInny.tekstZnormalizowany);
}

function sprawdzMigracjeStarszegoModeluIRecznaWarstwe(aplikacja) {
  const budowa = aplikacja.budowy.utworzBudoweZImportu({
    idBudowy: "B-003",
    firma: "Firma C",
    budowa: "Plac C",
    startPlanowany: "10:00",
    iloscBetonuM3: "8"
  }, 2);
  budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji({
    idLokalizacji: "B-003",
    typLokalizacji: "budowa",
    daneZrodlowe: {
      adres: { tekst: "ul. Źródłowa 1, Miasto C" },
      statusJakosci: "nieoceniona",
      zrodlo: "csv"
    },
    daneRobocze: {
      adres: { tekst: "ul. Ręczna 3, Miasto C" },
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });

  const wynik = aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);

  assert.equal(wynik.czyZmigrowano, true);
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekst, "ul. Źródłowa 1, Miasto C");
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.adres.tekstZnormalizowany, null);
  assert.equal(budowa.modelLokalizacji.daneRobocze.adres.tekst, "ul. Ręczna 3, Miasto C");
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "ul reczna 3 miasto c"
  );
  assert.equal(budowa.modelLokalizacji.daneRobocze.czyKorektaReczna, true);
  assert.equal(
    aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa).czyZmigrowano,
    false
  );
}

function sprawdzBrakLaczeniaPoSamejNazwie(aplikacja) {
  const csv = [
    "ID_Budowy;Firma;Budowa;StartPlanowany",
    "B-101;Firma D;Osiedle Zielone;11:00",
    "B-102;Firma D;Osiedle zielone;12:00"
  ].join("\n");
  const budowy = aplikacja.importCsv.przetworzCsv(csv, "6b2-nazwy.csv").budowy;

  budowy.forEach(function (budowa) {
    aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  });

  assert.equal(budowy[0].modelLokalizacji.daneRobocze.adres.tekstZnormalizowany, "osiedle zielone");
  assert.equal(budowy[1].modelLokalizacji.daneRobocze.adres.tekstZnormalizowany, "osiedle zielone");
  assert.equal(budowy[0].modelLokalizacji.idLokalizacji, "B-101");
  assert.equal(budowy[1].modelLokalizacji.idLokalizacji, "B-102");
  assert.notEqual(
    budowy[0].modelLokalizacji.idLokalizacji,
    budowy[1].modelLokalizacji.idLokalizacji
  );
}

function sprawdzDokumentacjeIStatus() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const readme = wczytaj("README.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6B\.2 —/);
  assert.match(stan, /\*\*Etap 6\*\* jest rozpoczęty/);
  assert.match(planTestow, /### 6B\.2 — normalizacja bez utraty źródła/);
  assert.match(readme, /znormalizowany tekst adresu roboczego/i);
  assert.match(kontrakt, /## Normalizacja 6B\.2/);
}

const aplikacja = wczytajAplikacje();
sprawdzPelnyAdresBezUtratyZrodla(aplikacja);
sprawdzSkladanieAdresuZCzesci(aplikacja);
sprawdzPowtarzalnoscINieZgadywanie(aplikacja);
sprawdzMigracjeStarszegoModeluIRecznaWarstwe(aplikacja);
sprawdzBrakLaczeniaPoSamejNazwie(aplikacja);
sprawdzDokumentacjeIStatus();

console.log(
  "OK — 6B.2 zachowuje źródło, tworzy powtarzalny adres roboczy i nie zgaduje podobnych budów."
);
