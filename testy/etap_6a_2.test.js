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
  const kontekst = { window: {} };
  kontekst.window.window = kontekst.window;
  vm.createContext(kontekst);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    const skrypt = new vm.Script(wczytaj(sciezka), { filename: sciezka });
    skrypt.runInContext(kontekst);
  });

  return kontekst.window.HarmonogramBetonowan;
}

function doZwyklegoObiektu(wartosc) {
  return JSON.parse(JSON.stringify(wartosc));
}

function sprawdzModelLokalizacji(aplikacja) {
  const daneWejsciowe = {
    idLokalizacji: "B-001",
    typLokalizacji: "budowa",
    daneZrodlowe: {
      adres: {
        tekst: "ul. Testowa 1, Miasto Testowe",
        czesci: {
          ulica: "Testowa",
          numerBudynku: "1",
          miejscowosc: "Miasto Testowe"
        }
      },
      statusJakosci: "nieoceniona",
      zrodlo: "csv"
    },
    daneAutomatyczne: {
      adres: {
        tekst: "Testowa 1, 00-001 Miasto Testowe",
        tekstZnormalizowany: "testowa 1 00-001 miasto testowe"
      },
      wspolrzedne: {
        szerokoscGeograficzna: 50.123,
        dlugoscGeograficzna: 16.456
      },
      statusJakosci: "niejednoznaczna",
      zrodlo: "mapa"
    },
    daneRobocze: {
      adres: {
        tekst: "Testowa 1A, 00-001 Miasto Testowe",
        tekstZnormalizowany: "testowa 1a 00-001 miasto testowe"
      },
      wspolrzedne: {
        szerokoscGeograficzna: 50.124,
        dlugoscGeograficzna: 16.457
      },
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  };
  const model = aplikacja.lokalizacje.utworzModelLokalizacji(daneWejsciowe);
  const zwyklyModel = doZwyklegoObiektu(model);

  assert.equal(zwyklyModel.wersjaKontraktu, 1);
  assert.equal(zwyklyModel.idLokalizacji, "B-001");
  assert.equal(
    zwyklyModel.daneZrodlowe.adres.tekst,
    daneWejsciowe.daneZrodlowe.adres.tekst
  );
  assert.equal(zwyklyModel.daneZrodlowe.zrodlo, "csv");
  assert.equal(zwyklyModel.daneAutomatyczne.statusJakosci, "niejednoznaczna");
  assert.equal(zwyklyModel.daneAutomatyczne.zrodlo, "mapa");
  assert.equal(zwyklyModel.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(zwyklyModel.daneRobocze.zrodlo, "reczny");
  assert.equal(zwyklyModel.daneRobocze.czyKorektaReczna, true);

  daneWejsciowe.daneZrodlowe.adres.czesci.ulica = "Zmieniona";
  assert.equal(model.daneZrodlowe.adres.czesci.ulica, "Testowa");

  model.daneAutomatyczne.wspolrzedne.szerokoscGeograficzna = 1;
  assert.equal(model.daneRobocze.wspolrzedne.szerokoscGeograficzna, 50.124);
}

function sprawdzModelKierunkowejTrasy(aplikacja) {
  const trasaDoBudowy = aplikacja.lokalizacje.utworzModelTrasy({
    idTrasy: "W-01->B-001",
    punktPoczatkowy: {
      idLokalizacji: "W-01",
      typLokalizacji: "wezel"
    },
    punktDocelowy: {
      idLokalizacji: "B-001",
      typLokalizacji: "budowa"
    },
    daneZrodlowe: {
      czasPrzejazduMinuty: 30,
      statusJakosci: "nieoceniona",
      zrodlo: "csv"
    },
    daneAutomatyczne: {
      dystansDrogowyMetry: 12500,
      czasPrzejazduMinuty: 22,
      statusJakosci: "pelna",
      zrodlo: "mapa"
    },
    daneRobocze: {
      dystansDrogowyMetry: 12800,
      czasPrzejazduMinuty: 25,
      statusJakosci: "potwierdzona",
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });
  const trasaPowrotna = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: {
      idLokalizacji: "B-001",
      typLokalizacji: "budowa"
    },
    punktDocelowy: {
      idLokalizacji: "W-01",
      typLokalizacji: "wezel"
    }
  });
  const trasaPompy = aplikacja.lokalizacje.utworzModelTrasy({
    punktPoczatkowy: {
      idLokalizacji: "B-001",
      typLokalizacji: "budowa"
    },
    punktDocelowy: {
      idLokalizacji: "B-002",
      typLokalizacji: "budowa"
    },
    daneRobocze: {
      czasPrzejazduMinuty: 17,
      zrodlo: "reczny",
      czyKorektaReczna: true
    }
  });

  assert.equal(trasaDoBudowy.wersjaKontraktu, 1);
  assert.equal(trasaDoBudowy.rodzajRelacji, "wezel-budowa");
  assert.equal(trasaDoBudowy.kierunek, "do-budowy");
  assert.equal(trasaPowrotna.rodzajRelacji, "wezel-budowa");
  assert.equal(trasaPowrotna.kierunek, "do-wezla");
  assert.equal(trasaPompy.rodzajRelacji, "budowa-budowa");
  assert.equal(trasaPompy.kierunek, "miedzy-budowami");
  assert.equal(trasaDoBudowy.daneAutomatyczne.dystansDrogowyMetry, 12500);
  assert.equal(trasaDoBudowy.daneAutomatyczne.czasPrzejazduMinuty, 22);
  assert.equal(trasaDoBudowy.daneRobocze.czasPrzejazduMinuty, 25);
  assert.equal(trasaDoBudowy.daneRobocze.czyKorektaReczna, true);
}

function sprawdzWalidacje(aplikacja) {
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelLokalizacji({
        daneRobocze: {
          wspolrzedne: { szerokoscGeograficzna: 50 }
        }
      });
    },
    /Długość geograficzna.*poprawną liczbę/i
  );
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelLokalizacji({
        daneRobocze: {
          wspolrzedne: {
            szerokoscGeograficzna: 91,
            dlugoscGeograficzna: 16
          }
        }
      });
    },
    /od -90 do 90/
  );
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelTrasy({
        daneRobocze: { czasPrzejazduMinuty: -1 }
      });
    },
    /Czas przejazdu.*nie mniejszą niż 0/i
  );
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelTrasy({
        daneAutomatyczne: { dystansDrogowyMetry: "nie-liczba" }
      });
    },
    /Dystans drogowy.*nie mniejszą niż 0/i
  );
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelTrasy({
        kierunek: "do-wezla",
        punktPoczatkowy: {
          idLokalizacji: "W-01",
          typLokalizacji: "wezel"
        },
        punktDocelowy: {
          idLokalizacji: "B-001",
          typLokalizacji: "budowa"
        }
      });
    },
    /Kierunek trasy.*nie zgadza się/i
  );
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelLokalizacji({
        daneRobocze: { zrodlo: "konkretny-dostawca" }
      });
    },
    /nieobsługiwaną wartość/i
  );
  assert.throws(
    function () {
      aplikacja.lokalizacje.utworzModelTrasy({
        daneRobocze: { czyKorektaReczna: "tak" }
      });
    },
    /Ręczna korekta.*wartość logiczną/i
  );
}

function sprawdzIntegracjeIDokumentacje(aplikacja) {
  const index = wczytaj("index.html");
  const kodModelu = wczytaj("js/lokalizacje/model_lokalizacji_i_trasy.js");
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const pozycjaModelu = index.indexOf(
    "js/lokalizacje/model_lokalizacji_i_trasy.js"
  );
  const pozycjaBramy = index.indexOf("js/lokalizacje/lokalizacje.js");

  assert.equal(
    aplikacja.lokalizacje.WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
    1
  );
  assert.equal(typeof aplikacja.lokalizacje.pobierzLubUstalTrase, "function");
  assert.ok(pozycjaModelu >= 0);
  assert.ok(pozycjaModelu < pozycjaBramy);
  assert.doesNotMatch(kodModelu, /Nominatim|OSRM|Google Maps/i);
  assert.match(etapy, /- \[x\] \*\*6A\.2 —/);
  assert.match(
    decyzje,
    /## 121\. Kontrakt lokalizacji i trasy ma wersję `1`/
  );
  assert.match(stan, /`js\/lokalizacje\/model_lokalizacji_i_trasy\.js` rozdziela/);
}

const aplikacja = wczytajAplikacje();
sprawdzModelLokalizacji(aplikacja);
sprawdzModelKierunkowejTrasy(aplikacja);
sprawdzWalidacje(aplikacja);
sprawdzIntegracjeIDokumentacje(aplikacja);

console.log(
  "OK — 6A.2 ma wersjonowany model lokalizacji i kierunkowej trasy z trzema warstwami danych."
);
