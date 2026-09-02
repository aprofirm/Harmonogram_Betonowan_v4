"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

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
    },
    pobierzSuroweDane: function () {
      return dane;
    }
  };
}

function wczytajAplikacje(pamiecLokalna) {
  const kontekst = { window: { localStorage: pamiecLokalna } };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/pamiec/pamiec_wezla.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    new vm.Script(wczytaj(sciezka), { filename: sciezka }).runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function sprawdzWalidacjeIRecznaKorekte() {
  const pamiec = utworzPamiecLokalna();
  const aplikacja = wczytajAplikacje(pamiec);

  assert.throws(function () {
    aplikacja.lokalizacje.ustawAktywnyWezel({
      nazwa: "",
      adres: "ul. Testowa 10, Miasto"
    });
  }, /Nazwa betoniarni/);

  assert.throws(function () {
    aplikacja.lokalizacje.ustawAktywnyWezel({ nazwa: "Betoniarnia Test" });
  }, /Podaj adres betoniarni/);

  assert.throws(function () {
    aplikacja.lokalizacje.ustawAktywnyWezel({
      nazwa: "Betoniarnia Test",
      szerokoscGeograficzna: "50.8"
    });
  }, /jednocześnie szerokości i długości/);

  const wynik = aplikacja.lokalizacje.ustawAktywnyWezel({
    nazwa: "Betoniarnia Test",
    adres: "UL. PRÓBNA 10, 58-100 MIASTO TESTOWE"
  });
  const wezel = wynik.wezel;

  assert.equal(wezel.idWezla, "wezel-domyslny");
  assert.equal(wezel.nazwa, "Betoniarnia Test");
  assert.equal(
    wezel.modelLokalizacji.daneZrodlowe.adres.tekst,
    "UL. PRÓBNA 10, 58-100 MIASTO TESTOWE"
  );
  assert.equal(
    wezel.modelLokalizacji.daneZrodlowe.adres.tekstZnormalizowany,
    null
  );
  assert.equal(
    wezel.modelLokalizacji.daneRobocze.adres.tekstZnormalizowany,
    "ul probna 10 58 100 miasto testowe"
  );
  assert.equal(wezel.modelLokalizacji.daneRobocze.zrodlo, "reczny");
  assert.equal(wezel.modelLokalizacji.daneRobocze.czyKorektaReczna, true);
  assert.equal(wynik.statusZapisu, "zapisano-trwale");
}

function sprawdzWspolrzednePotwierdzonePrzezOperatora() {
  const aplikacja = wczytajAplikacje(utworzPamiecLokalna());
  const wynik = aplikacja.lokalizacje.ustawAktywnyWezel({
    nazwa: "Węzeł współrzędne",
    adres: "",
    szerokoscGeograficzna: "50.8491",
    dlugoscGeograficzna: "16.3198"
  });
  const robocze = wynik.wezel.modelLokalizacji.daneRobocze;

  assert.equal(robocze.statusJakosci, "potwierdzona");
  assert.equal(robocze.wspolrzedne.szerokoscGeograficzna, 50.8491);
  assert.equal(robocze.wspolrzedne.dlugoscGeograficzna, 16.3198);
}

function sprawdzOdtworzeniePoPonownymUruchomieniu() {
  const pamiec = utworzPamiecLokalna();
  const pierwszaAplikacja = wczytajAplikacje(pamiec);

  pierwszaAplikacja.lokalizacje.ustawAktywnyWezel({
    nazwa: "Betoniarnia zapamiętana",
    adres: "ul. Pamięci 7, 58-100 Miasto"
  });

  const drugaAplikacja = wczytajAplikacje(pamiec);
  const odtworzony = drugaAplikacja.lokalizacje.pobierzAktywnyWezel();

  assert.equal(odtworzony.idWezla, "wezel-domyslny");
  assert.equal(odtworzony.nazwa, "Betoniarnia zapamiętana");
  assert.equal(
    odtworzony.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Pamięci 7, 58-100 Miasto"
  );
  assert.equal(
    drugaAplikacja.pamiecWezla.pobierzStanPamieci().trybPamieci,
    "trwala"
  );
}

function sprawdzAwaryjnaPamiecSesji() {
  const zablokowanaPamiec = {
    getItem: function () { throw new Error("blokada"); },
    setItem: function () { throw new Error("blokada"); },
    removeItem: function () { throw new Error("blokada"); }
  };
  const aplikacja = wczytajAplikacje(zablokowanaPamiec);
  const wynik = aplikacja.lokalizacje.ustawAktywnyWezel({
    nazwa: "Betoniarnia sesyjna",
    adres: "ul. Offline 1, Miasto"
  });

  assert.equal(wynik.statusZapisu, "zapisano-w-sesji");
  assert.equal(wynik.trybPamieci, "biezaca-sesja");
  assert.equal(aplikacja.pamiecWezla.odczytajWezel().status, "odczytano");
}

function sprawdzUszkodzonyZapisNieBlokujeAplikacji() {
  const pamiec = utworzPamiecLokalna();
  pamiec.setItem("harmonogramBetonowan.aktywnyWezel.v1", "{uszkodzony");
  const aplikacja = wczytajAplikacje(pamiec);
  const wezel = aplikacja.lokalizacje.pobierzAktywnyWezel();

  assert.equal(wezel.idWezla, "wezel-domyslny");
  assert.equal(wezel.nazwa, "Węzeł domyślny");
  assert.equal(
    pamiec.getItem("harmonogramBetonowan.aktywnyWezel.v1"),
    null
  );
}

function sprawdzInterfejsIDokumentacje() {
  const index = wczytaj("index.html");
  const interfejs = wczytaj("js/interfejs/interfejs.js");
  const aplikacja = wczytaj("js/aplikacja.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(index, /id="formularz-wezla"/);
  assert.match(index, /id="wezel-nazwa"/);
  assert.match(index, /id="wezel-adres"/);
  assert.match(index, /id="wezel-szerokosc"/);
  assert.match(index, /id="wezel-dlugosc"/);
  assert.match(index, /js\/pamiec\/pamiec_wezla\.js/);
  assert.match(interfejs, /function podlaczUstawieniaWezla/);
  assert.match(interfejs, /function pokazAktywnyWezel/);
  assert.match(aplikacja, /uruchomIOdtworzPamiecWezla/);
  assert.match(etapy, /- \[x\] \*\*6C\.2 — ustawienie i pamięć/);
  assert.match(plan, /### 6C\.2 — ustawienie i pamięć/);
  assert.match(decyzje, /## 126\. Dane aktywnego węzła są ustawiane świadomie i zapamiętywane lokalnie/);
  assert.match(kontrakt, /## Ustawienie i pamięć węzła 6C\.2/);
}

sprawdzWalidacjeIRecznaKorekte();
sprawdzWspolrzednePotwierdzonePrzezOperatora();
sprawdzOdtworzeniePoPonownymUruchomieniu();
sprawdzAwaryjnaPamiecSesji();
sprawdzUszkodzonyZapisNieBlokujeAplikacji();
sprawdzInterfejsIDokumentacje();

console.log(
  "OK — 6C.2 waliduje, zapisuje i odtwarza aktywny węzeł oraz daje formularz świadomej korekty."
);
