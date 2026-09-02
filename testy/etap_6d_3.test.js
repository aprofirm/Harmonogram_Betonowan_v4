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
    removeItem: (klucz) => dane.delete(klucz)
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

function zapisz(modul, idWezla, opis, adres, dojazd, powrot) {
  return modul.zapiszTrase({
    idWezla: idWezla,
    opisLokalizacji: opis,
    adresLokalizacji: adres ? { tekst: adres } : undefined,
    czasDojazduMinuty: dojazd,
    czasPowrotuMinuty: powrot,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
}

function sprawdzWyszukiwanieOffline() {
  const pamiec = utworzPamiecLokalna();
  const modul = uruchomPamiec(pamiec);
  zapisz(modul, "WEZEL-A", "Firma X | Centrum", "Testowa 12, 00-001 Miasto", 12, 13);
  zapisz(modul, "WEZEL-A", "Firma X | Centrum", "Testowa 99, 00-001 Miasto", 32, 33);
  zapisz(modul, "WEZEL-B", "Firma X | Centrum", "Testowa 12, 00-001 Miasto", 52, 53);

  const zapisPrzed = pamiec.getItem(kluczV2);
  const poAdresie = modul.wyszukajTrasy("testowa 12 miasto", "WEZEL-A");
  const poNazwie = modul.wyszukajTrasy("firma x centrum", "WEZEL-A");
  const bezFuzzy = modul.wyszukajTrasy("testova", "WEZEL-A");

  assert.equal(poAdresie.status, "znaleziono-trasy");
  assert.equal(poAdresie.liczbaTras, 1);
  assert.equal(poAdresie.trasy[0].czasDojazduMinuty, 12);
  assert.equal(poNazwie.liczbaTras, 2);
  assert.equal(bezFuzzy.liczbaTras, 0);
  assert.equal(pamiec.getItem(kluczV2), zapisPrzed, "Samo wyszukiwanie nie oznacza użycia trasy.");
}

function sprawdzJawnyWyborPoKluczu() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const pierwsza = zapisz(
    modul,
    "WEZEL-A",
    "Firma X | Centrum",
    "Testowa 12, 00-001 Miasto",
    12,
    13
  ).trasa;
  const druga = zapisz(
    modul,
    "WEZEL-A",
    "Firma X | Centrum",
    "Testowa 99, 00-001 Miasto",
    32,
    33
  ).trasa;

  assert.equal(
    modul.pobierzTrasePoKluczu(druga.kluczTrasy, "WEZEL-A").trasa.czasDojazduMinuty,
    32
  );
  assert.equal(
    modul.pobierzTrasePoKluczu(pierwsza.kluczTrasy, "WEZEL-B").status,
    "brak-trasy"
  );
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

function utworzBudowe(id, adres) {
  return {
    idBudowy: id,
    firma: "Firma X",
    budowa: "Centrum",
    zrodlo: "csv",
    adresZrodlowy: { tekst: adres, czesci: {} }
  };
}

async function sprawdzCachePrzedInternetemIPodpowiedz() {
  const aplikacja = uruchomAplikacje();
  const wpis = aplikacja.pamiecTras.zapiszTrase({
    idWezla: "wezel-domyslny",
    opisLokalizacji: "Firma X | Centrum",
    adresLokalizacji: { tekst: "ul. Testowa 12, 00-001 Miasto" },
    czasDojazduMinuty: 21,
    czasPowrotuMinuty: 24,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  let liczbaWywolanMapy = 0;
  const budowaNiepelna = utworzBudowe("B-1", "Testowa 12 Miasto");
  const wynik = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    budowaNiepelna,
    function () {
      liczbaWywolanMapy += 1;
      return { czasDojazduMinuty: 99, czasPowrotuMinuty: 99 };
    }
  );

  assert.equal(wynik.status, "wymagany-wybor-z-pamieci");
  assert.equal(wynik.liczbaPodpowiedzi, 1);
  assert.equal(wynik.czyWywolanoMape, false);
  assert.equal(liczbaWywolanMapy, 0);
  assert.equal(budowaNiepelna.czasDojazduRoboczyMinuty, undefined);

  const zastosowano = aplikacja.lokalizacje.zastosujWybranaTraseZPamieci(
    budowaNiepelna,
    wpis.trasa.kluczTrasy
  );
  assert.equal(zastosowano.status, "zastosowano-wybrana-trase-z-pamieci");
  assert.equal(zastosowano.czyUzupelniono, true);
  assert.equal(budowaNiepelna.czasDojazduRoboczyMinuty, 21);
  assert.equal(budowaNiepelna.czasPowrotuRoboczyMinuty, 24);
  assert.equal(budowaNiepelna.zrodloCzasuDojazdu, "pamiec");
  assert.equal(budowaNiepelna.modelLokalizacji.daneZrodlowe.adres.tekst, "Testowa 12 Miasto");
  assert.equal(
    budowaNiepelna.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Testowa 12, 00-001 Miasto"
  );
  assert.equal(budowaNiepelna.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowaNiepelna.modelLokalizacji.daneRobocze.zrodlo, "pamiec");
}

async function sprawdzDokladnyCacheINastepnieMape() {
  const aplikacja = uruchomAplikacje();
  aplikacja.pamiecTras.zapiszTrase({
    idWezla: "wezel-domyslny",
    opisLokalizacji: "Firma X | Centrum",
    adresLokalizacji: { tekst: "Testowa 7, 00-001 Miasto" },
    czasDojazduMinuty: 17,
    czasPowrotuMinuty: 19,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });

  let wywolanoMape = 0;
  const dokladna = utworzBudowe("B-2", "TESTOWA 7 00-001 MIASTO");
  const wynikDokladny = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    dokladna,
    function () {
      wywolanoMape += 1;
      return { czasDojazduMinuty: 80, czasPowrotuMinuty: 81 };
    }
  );
  assert.equal(wynikDokladny.status, "uzyto-pamieci-tras");
  assert.equal(wywolanoMape, 0);

  const nieznana = utworzBudowe("B-3", "Inna 44, 11-111 Drugie Miasto");
  const wynikMapy = await aplikacja.lokalizacje.pobierzLubUstalTrase(
    nieznana,
    function () {
      wywolanoMape += 1;
      return { czasDojazduMinuty: 41, czasPowrotuMinuty: 42 };
    }
  );
  assert.equal(wynikMapy.status, "uzyto-wyniku-mapy");
  assert.equal(wynikMapy.czyWywolanoMape, true);
  assert.equal(wywolanoMape, 1);
}

function sprawdzWyborNieNadpisujeIstniejacegoCzasu() {
  const aplikacja = uruchomAplikacje();
  const wpis = aplikacja.pamiecTras.zapiszTrase({
    idWezla: "wezel-domyslny",
    opisLokalizacji: "Firma X | Centrum",
    adresLokalizacji: { tekst: "Testowa 20, Miasto" },
    czasDojazduMinuty: 20,
    czasPowrotuMinuty: 21,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  });
  const budowa = utworzBudowe("B-4", "Testowa 20 Miasto");
  budowa.czasDojazduRoboczyMinuty = 77;
  budowa.zrodloCzasuDojazdu = "reczny";

  const wynik = aplikacja.lokalizacje.zastosujWybranaTraseZPamieci(
    budowa,
    wpis.trasa.kluczTrasy
  );
  assert.equal(wynik.status, "pozostawiono-istniejace-czasy");
  assert.equal(wynik.czyUzupelniono, false);
  assert.equal(budowa.czasDojazduRoboczyMinuty, 77);
}

function sprawdzPodgladSzukaPoAdresie() {
  const okno = { HarmonogramBetonowan: {} };
  okno.window = okno;
  const kontekst = { window: okno, Date, JSON, Error };
  vm.createContext(kontekst);
  new vm.Script(wczytaj("js/interfejs/podglad_tras.js")).runInContext(kontekst);
  const podglad = okno.HarmonogramBetonowan.podgladTras;
  const trasy = [
    {
      opisLokalizacji: "Firma X | Centrum",
      adresLokalizacji: { tekst: "Testowa 12, Miasto", czesci: {} }
    },
    {
      opisLokalizacji: "Firma X | Centrum",
      adresLokalizacji: { tekst: "Testowa 99, Miasto", czesci: {} }
    }
  ];
  const wynik = podglad.filtrujISortujTrasy(trasy, "testowa 99", "nazwa-az");
  assert.equal(wynik.length, 1);
  assert.equal(wynik[0].adresLokalizacji.tekst, "Testowa 99, Miasto");
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const readme = wczytaj("README.md");

  assert.match(etapy, /- \[x\] \*\*6D — pamięć lokalizacji i tras/);
  assert.match(etapy, /- \[x\] \*\*6D\.3 — cache i lokalne podpowiedzi/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6E\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6D\.3/);
  assert.match(stan, /107\/107 zestawów testów/);
  assert.match(plan, /### 6D\.3 — cache i lokalne podpowiedzi/);
  assert.match(decyzje, /## 129\. Podpowiedź cache nie jest automatycznym wyborem lokalizacji/);
  assert.match(kontrakt, /## Cache i lokalne podpowiedzi — 6D\.3/);
  assert.match(readme, /Wyszukiwanie zapisanych tras działa lokalnie/);
}

(async function () {
  sprawdzWyszukiwanieOffline();
  sprawdzJawnyWyborPoKluczu();
  await sprawdzCachePrzedInternetemIPodpowiedz();
  await sprawdzDokladnyCacheINastepnieMape();
  sprawdzWyborNieNadpisujeIstniejacegoCzasu();
  sprawdzPodgladSzukaPoAdresie();
  sprawdzDokumentacje();
  console.log("OK — 6D.3 używa cache przed internetem i nie stosuje lokalnej podpowiedzi bez jawnego wyboru.");
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
