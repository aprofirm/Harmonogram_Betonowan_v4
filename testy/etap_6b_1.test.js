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

function sprawdzPelnyAdresWJednejKolumnie(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany;Adres;Adres budowy",
    "Firma A;Osiedle Zielone;08:00;Biuro 1;ul. Testowa 12, 00-001 Miasto Testowe"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "adres-pelny.csv")
    .budowy[0];

  assert.equal(
    budowa.adresZrodlowy.tekst,
    "ul. Testowa 12, 00-001 Miasto Testowe"
  );
  assert.equal(budowa.adresZrodlowy.czesci.ulica, "");
  assert.equal(
    budowa.daneZrodlowe["Adres budowy"],
    "ul. Testowa 12, 00-001 Miasto Testowe"
  );

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.tekst,
    "ul. Testowa 12, 00-001 Miasto Testowe"
  );
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.tekstZnormalizowany,
    null
  );
  assert.notEqual(
    budowa.modelLokalizacji.daneZrodlowe.adres.tekst,
    budowa.budowa
  );
}

function sprawdzAdresRozbityINiezaleznaKolejnosc(aplikacja) {
  const csv = [
    [
      "Miasto",
      "Nr domu",
      "Firma",
      "Kod pocztowy",
      "StartPlanowany",
      "Nazwa ulicy",
      "Budowa",
      "Gmina",
      "Powiat",
      "Województwo",
      "Państwo"
    ].join(";"),
    [
      "Miasto Próbne",
      "7A",
      "Firma B",
      "58-100",
      "09:15",
      "Spacerowa",
      "Hala Północna",
      "Gmina Próbna",
      "Powiat Próbny",
      "dolnośląskie",
      "Polska"
    ].join(";")
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "adres-czesci.csv")
    .budowy[0];
  const czesci = budowa.adresZrodlowy.czesci;

  assert.equal(budowa.adresZrodlowy.tekst, null);
  assert.equal(czesci.ulica, "Spacerowa");
  assert.equal(czesci.numerBudynku, "7A");
  assert.equal(czesci.kodPocztowy, "58-100");
  assert.equal(czesci.miejscowosc, "Miasto Próbne");
  assert.equal(czesci.gmina, "Gmina Próbna");
  assert.equal(czesci.powiat, "Powiat Próbny");
  assert.equal(czesci.wojewodztwo, "dolnośląskie");
  assert.equal(czesci.kraj, "Polska");

  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.czesci.ulica,
    "Spacerowa"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.czesci.miejscowosc,
    "Miasto Próbne"
  );
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.statusJakosci, "nieoceniona");
  assert.equal(budowa.modelLokalizacji.daneZrodlowe.zrodlo, "csv");
}

function sprawdzWariantyNazwIMieszanyAdres(aplikacja) {
  const csv = [
    "Klient;Tytuł;Godzina;Miejsce dostawy;Ulica budowy;Nr posesji;Postal code;City;Region;Country",
    "Firma C;Magazyn Zachodni;10:30;Testowa 4, Miasto C;Testowa;4;00-004;Miasto C;Region C;Polska"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "adres-mieszany.csv")
    .budowy[0];

  assert.equal(budowa.firma, "Firma C");
  assert.equal(budowa.budowa, "Magazyn Zachodni");
  assert.equal(budowa.startPlanowany, "10:30");
  assert.equal(budowa.adresZrodlowy.tekst, "Testowa 4, Miasto C");
  assert.equal(budowa.adresZrodlowy.czesci.ulica, "Testowa");
  assert.equal(budowa.adresZrodlowy.czesci.numerBudynku, "4");
  assert.equal(budowa.adresZrodlowy.czesci.kodPocztowy, "00-004");
  assert.equal(budowa.adresZrodlowy.czesci.miejscowosc, "Miasto C");
  assert.equal(budowa.adresZrodlowy.czesci.wojewodztwo, "Region C");
  assert.equal(budowa.adresZrodlowy.czesci.kraj, "Polska");
}

function sprawdzZgodnoscPlikuBezAdresu(aplikacja) {
  const csv = [
    "Firma;Budowa;StartPlanowany",
    "Firma D;Plac bez kolumn adresowych;11:00"
  ].join("\n");
  const budowa = aplikacja.importCsv.przetworzCsv(csv, "bez-adresu.csv")
    .budowy[0];

  assert.equal(budowa.adresZrodlowy, null);
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.tekst,
    "Plac bez kolumn adresowych"
  );
  assert.equal(
    budowa.modelLokalizacji.daneZrodlowe.adres.czesci.nazwaBudowy,
    "Plac bez kolumn adresowych"
  );
}

function sprawdzDokumentacjeIStatus() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const stan = wczytaj("STAN_PROJEKTU.md");

  assert.match(etapy, /- \[x\] \*\*6B\.1 —/);
  assert.match(etapy, /- \[ \] \*\*6B\.2 —/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6B\.2/);
  assert.match(decyzje, /## 123\. Importer rozdziela nazwę budowy od adresu/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6B\.1/);
  assert.match(stan, /\*\*99\/99 zestawów testów\*\*/);
}

const aplikacja = wczytajAplikacje();
sprawdzPelnyAdresWJednejKolumnie(aplikacja);
sprawdzAdresRozbityINiezaleznaKolejnosc(aplikacja);
sprawdzWariantyNazwIMieszanyAdres(aplikacja);
sprawdzZgodnoscPlikuBezAdresu(aplikacja);
sprawdzDokumentacjeIStatus();

console.log(
  "OK — 6B.1 rozpoznaje pełny i rozbity adres w zmiennych układach KDX/CSV."
);
