from pathlib import Path


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f"Nie znaleziono wzorca w {path}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))


def insert_before_once(path, marker, block):
    text = read(path)
    if marker not in text:
        raise SystemExit(f"Nie znaleziono znacznika w {path}: {marker[:120]!r}")
    if block.strip() in text:
        raise SystemExit(f"Blok jest juz obecny w {path}")
    write(path, text.replace(marker, block + marker, 1))


# ---------------------------------------------------------------------------
# 6F.1 — brama geokodowania lokalizacji budowy
# ---------------------------------------------------------------------------
lokalizacje_path = "js/lokalizacje/lokalizacje.js"
marker = "  function pobierzFunkcjeTrasyMapowej(uslugaMapowa) {\n"
block = r'''  function pobierzFunkcjeGeokodowania(uslugaMapowa) {
    if (uslugaMapowa && typeof uslugaMapowa.geokoduj === "function") {
      return uslugaMapowa.geokoduj.bind(uslugaMapowa);
    }

    return null;
  }

  function czyWarstwaMaWspolrzedne(warstwa) {
    const wspolrzedne = warstwa && warstwa.wspolrzedne;

    return Boolean(
      wspolrzedne &&
      Number.isFinite(Number(wspolrzedne.szerokoscGeograficzna)) &&
      Number.isFinite(Number(wspolrzedne.dlugoscGeograficzna))
    );
  }

  function utworzKandydataZWarstwyLokalizacji(warstwa) {
    const dane = warstwa && typeof warstwa === "object" ? warstwa : {};

    return {
      adres: dane.adres || null,
      wspolrzedne: dane.wspolrzedne || null,
      statusJakosci: dane.statusJakosci || "nieoceniona",
      zrodlo: dane.zrodlo || "brak"
    };
  }

  function pobierzZapisanaPodpowiedzGeokodowania(budowa) {
    const model = budowa && budowa.modelLokalizacji || {};
    const warstwa = model.daneAutomatyczne || {};

    if (warstwa.zrodlo !== "mapa" || !czyWarstwaMaWspolrzedne(warstwa)) {
      return null;
    }

    return utworzKandydataZWarstwyLokalizacji(warstwa);
  }

  function pobierzDokladnaLokalizacjeZPamieci(budowa) {
    if (!budowa || !aplikacja.pamiecTras ||
        typeof aplikacja.pamiecTras.pobierzTrase !== "function") {
      return null;
    }

    const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);

    if (!opisLokalizacji) {
      return null;
    }

    let wynikPamieci;

    try {
      wynikPamieci = aplikacja.pamiecTras.pobierzTrase(
        opisLokalizacji,
        pobierzIdAktywnegoWezla(),
        pobierzDaneTozsamosciPamieciBudowy(budowa)
      );
    } catch (bladPamieci) {
      return null;
    }

    const trasa = wynikPamieci && wynikPamieci.trasa;

    if (!trasa || !trasa.wspolrzedneLokalizacji) {
      return null;
    }

    zastosujLokalizacjeZWybranejTrasy(budowa, trasa);
    const warstwaRobocza = budowa.modelLokalizacji &&
      budowa.modelLokalizacji.daneRobocze;

    if (!czyWarstwaMaWspolrzedne(warstwaRobocza)) {
      return null;
    }

    return {
      status: "uzyto-pamieci-lokalizacji",
      lokalizacja: warstwaRobocza,
      trasaPamieci: trasa,
      czyWywolanoInternet: false
    };
  }

  function zapiszAutomatycznyStanLokalizacji(budowa, daneAutomatyczne) {
    const model = budowa && budowa.modelLokalizacji || {};
    const dane = daneAutomatyczne && typeof daneAutomatyczne === "object"
      ? daneAutomatyczne
      : {};
    const adres = aplikacja.lokalizacje.utworzAdresRoboczy(dane.adres);

    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
      Object.assign({}, model, {
        idWezla: pobierzIdAktywnegoWezla(),
        daneAutomatyczne: {
          adres: adres,
          wspolrzedne: dane.wspolrzedne || null,
          statusJakosci: dane.statusJakosci || "nieoceniona",
          zrodlo: "mapa",
          czyKorektaReczna: false
        }
      })
    );

    return budowa.modelLokalizacji.daneAutomatyczne;
  }

  function pobierzPodpowiedziPamieciZWspolrzednymi(budowa) {
    const wynik = wyszukajPodpowiedziPamieciDlaBudowy(budowa);
    const podpowiedzi = Array.isArray(wynik.podpowiedzi)
      ? wynik.podpowiedzi.filter(function (trasa) {
        return Boolean(trasa && trasa.wspolrzedneLokalizacji);
      })
      : [];

    return {
      podpowiedzi: podpowiedzi,
      liczbaPodpowiedzi: podpowiedzi.length
    };
  }

  function wyszukajLokalizacjeBudowy(budowa, uslugaMapowa) {
    if (!budowa) {
      return Promise.resolve({
        status: "brak-budowy",
        kandydaci: [],
        czyWywolanoInternet: false
      });
    }

    migrujBudoweDoKontraktuTras(budowa);
    const model = budowa.modelLokalizacji || {};
    const warstwaRobocza = model.daneRobocze || {};

    if (warstwaRobocza.statusJakosci === "potwierdzona" &&
        czyWarstwaMaWspolrzedne(warstwaRobocza)) {
      return Promise.resolve({
        status: "uzyto-biezacej-lokalizacji",
        lokalizacja: warstwaRobocza,
        kandydaci: [utworzKandydataZWarstwyLokalizacji(warstwaRobocza)],
        czyWywolanoInternet: false,
        czyWymagaPotwierdzenia: false
      });
    }

    const zapisanaPodpowiedz = pobierzZapisanaPodpowiedzGeokodowania(budowa);

    if (zapisanaPodpowiedz) {
      return Promise.resolve({
        status: "uzyto-zapisanego-wyniku-geokodowania",
        lokalizacjaAutomatyczna: zapisanaPodpowiedz,
        kandydaci: [zapisanaPodpowiedz],
        czyWywolanoInternet: false,
        czyWymagaPotwierdzenia: true
      });
    }

    const wynikDokladnegoCache = pobierzDokladnaLokalizacjeZPamieci(budowa);

    if (wynikDokladnegoCache) {
      return Promise.resolve(Object.assign({
        kandydaci: [
          utworzKandydataZWarstwyLokalizacji(
            wynikDokladnegoCache.lokalizacja
          )
        ],
        czyWymagaPotwierdzenia: false
      }, wynikDokladnegoCache));
    }

    const wynikPodpowiedziPamieci =
      pobierzPodpowiedziPamieciZWspolrzednymi(budowa);

    if (wynikPodpowiedziPamieci.liczbaPodpowiedzi > 0) {
      return Promise.resolve({
        status: "wymagany-wybor-z-pamieci",
        kandydaci: [],
        podpowiedzi: wynikPodpowiedziPamieci.podpowiedzi,
        liczbaPodpowiedzi: wynikPodpowiedziPamieci.liczbaPodpowiedzi,
        czyWywolanoInternet: false,
        czyWymagaPotwierdzenia: true
      });
    }

    const informacjeAdresu = aplikacja.lokalizacje.pobierzInformacjeJakosciAdresu(
      warstwaRobocza.adres,
      warstwaRobocza.statusJakosci
    );

    if (!informacjeAdresu.czyMoznaSzukacAutomatycznie) {
      return Promise.resolve({
        status: "adres-niewystarczajacy-do-geokodowania",
        statusJakosci: informacjeAdresu.statusJakosci,
        komunikat: informacjeAdresu.komunikatOperatora,
        kandydaci: [],
        czyWywolanoInternet: false,
        czyWymagaPotwierdzenia: true
      });
    }

    const geokoduj = pobierzFunkcjeGeokodowania(uslugaMapowa);

    if (!geokoduj) {
      return Promise.resolve({
        status: "brak-uslugi-geokodowania",
        komunikat: "Brak skonfigurowanej usługi wyszukiwania lokalizacji.",
        kandydaci: [],
        czyWywolanoInternet: false,
        czyWymagaPotwierdzenia: true
      });
    }

    const tekstAdresu = String(
      warstwaRobocza.adres && warstwaRobocza.adres.tekst || ""
    ).trim();

    if (!tekstAdresu) {
      return Promise.resolve({
        status: "adres-niewystarczajacy-do-geokodowania",
        statusJakosci: informacjeAdresu.statusJakosci,
        komunikat: informacjeAdresu.komunikatOperatora,
        kandydaci: [],
        czyWywolanoInternet: false,
        czyWymagaPotwierdzenia: true
      });
    }

    return Promise.resolve().then(function () {
      return geokoduj({
        tekstAdresu: tekstAdresu,
        limitWynikow: 5
      });
    }).then(function (wynikGeokodowania) {
      const wynik = wynikGeokodowania && typeof wynikGeokodowania === "object"
        ? wynikGeokodowania
        : {};
      const kandydaci = Array.isArray(wynik.kandydaci)
        ? wynik.kandydaci
        : [];

      if (wynik.status && !["ok", "brak-wynikow"].includes(wynik.status)) {
        return {
          status: wynik.status,
          komunikat: wynik.komunikatOperatora ||
            "Nie udało się wyszukać lokalizacji.",
          kandydaci: [],
          czyWywolanoInternet: true,
          czyWymagaPotwierdzenia: true,
          czyPonowicPozniej: Boolean(wynik.czyPonowicPozniej),
          statusHttp: wynik.statusHttp || null
        };
      }

      if (wynik.status === "brak-wynikow" || kandydaci.length === 0) {
        const warstwaAutomatyczna = zapiszAutomatycznyStanLokalizacji(budowa, {
          adres: warstwaRobocza.adres,
          wspolrzedne: null,
          statusJakosci: "nieznaleziona"
        });

        return {
          status: "nieznaleziona",
          komunikat: aplikacja.lokalizacje.utworzKomunikatJakosciAdresu(
            "nieznaleziona"
          ),
          lokalizacjaAutomatyczna: warstwaAutomatyczna,
          kandydaci: [],
          czyWywolanoInternet: true,
          czyWymagaPotwierdzenia: true
        };
      }

      if (kandydaci.length > 1) {
        const warstwaAutomatyczna = zapiszAutomatycznyStanLokalizacji(budowa, {
          adres: warstwaRobocza.adres,
          wspolrzedne: null,
          statusJakosci: "niejednoznaczna"
        });

        return {
          status: "niejednoznaczna",
          komunikat: aplikacja.lokalizacje.utworzKomunikatJakosciAdresu(
            "niejednoznaczna"
          ),
          lokalizacjaAutomatyczna: warstwaAutomatyczna,
          kandydaci: kandydaci,
          liczbaKandydatow: kandydaci.length,
          czyWywolanoInternet: true,
          czyWymagaPotwierdzenia: true
        };
      }

      const kandydat = kandydaci[0];
      const warstwaAutomatyczna = zapiszAutomatycznyStanLokalizacji(budowa, {
        adres: kandydat.adres,
        wspolrzedne: kandydat.wspolrzedne,
        statusJakosci: kandydat.statusJakosci || "nieoceniona"
      });
      const zapisanyKandydat =
        utworzKandydataZWarstwyLokalizacji(warstwaAutomatyczna);

      return {
        status: "znaleziono-jedna-lokalizacje",
        komunikat:
          "Znaleziono jedną lokalizację. Wynik zapisano jako automatyczną podpowiedź i wymaga potwierdzenia.",
        lokalizacjaAutomatyczna: zapisanyKandydat,
        kandydaci: [zapisanyKandydat],
        liczbaKandydatow: 1,
        czyWywolanoInternet: true,
        czyWymagaPotwierdzenia: true
      };
    }).catch(function () {
      return {
        status: "blad-uslugi",
        komunikat:
          "Nie udało się wyszukać lokalizacji. Możesz nadal użyć pamięci tras lub ręcznych czasów.",
        kandydaci: [],
        czyWywolanoInternet: true,
        czyWymagaPotwierdzenia: true,
        czyPonowicPozniej: true,
        statusHttp: null
      };
    });
  }

'''
insert_before_once(lokalizacje_path, marker, block)

replace_once(
    lokalizacje_path,
    "    zmienCzasRoboczyBudowy: zmienCzasRoboczyBudowy,\n    pobierzLubUstalTrase: pobierzLubUstalTrase\n",
    "    zmienCzasRoboczyBudowy: zmienCzasRoboczyBudowy,\n    wyszukajLokalizacjeBudowy: wyszukajLokalizacjeBudowy,\n    pobierzLubUstalTrase: pobierzLubUstalTrase\n"
)

# ---------------------------------------------------------------------------
# Nowy test 6F.1
# ---------------------------------------------------------------------------
test_path = Path("testy/etap_6f_1.test.js")
if test_path.exists():
    raise SystemExit("testy/etap_6f_1.test.js juz istnieje")

test_path.write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAplikacje() {
  const sandbox = { window: {}, console: console, Promise: Promise };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);

  [
    "js/lokalizacje/model_lokalizacji_i_trasy.js",
    "js/lokalizacje/lokalizacje.js"
  ].forEach(function (sciezka) {
    vm.runInContext(wczytaj(sciezka), sandbox, { filename: sciezka });
  });

  return sandbox.window.HarmonogramBetonowan;
}

function utworzBudowe(idBudowy, adres) {
  return {
    idBudowy: idBudowy,
    firma: "Firma Testowa",
    budowa: "Obiekt " + idBudowy,
    zrodlo: "csv",
    adresZrodlowy: adres || null
  };
}

function pelnyAdres() {
  return {
    tekst: "ul. Próbna 12, Miasto Testowe",
    czesci: {
      ulica: "Próbna",
      numerBudynku: "12",
      miejscowosc: "Miasto Testowe"
    }
  };
}

function kandydat(numer, szerokosc, dlugosc) {
  return {
    adres: {
      tekst: "ul. Wynikowa " + numer + ", Miasto Testowe",
      czesci: {
        ulica: "Wynikowa",
        numerBudynku: String(numer),
        miejscowosc: "Miasto Testowe"
      }
    },
    wspolrzedne: {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    },
    statusJakosci: "nieoceniona",
    zrodlo: "mapa"
  };
}

async function sprawdzAdresNiewystarczajacy() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-601", null);
  let liczbaWywolan = 0;

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(1, 50.1, 16.2)] };
      }
    }
  );

  assert.equal(wynik.status, "adres-niewystarczajacy-do-geokodowania");
  assert.equal(wynik.czyWywolanoInternet, false);
  assert.equal(liczbaWywolan, 0);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.statusJakosci,
    "niewystarczajaca"
  );
}

async function sprawdzJednaLokalizacjeIZapisAutomatyczny() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-602", pelnyAdres());
  const zapytania = [];
  const adapter = {
    geokoduj: function (zapytanie) {
      zapytania.push(zapytanie);
      return {
        status: "ok",
        kandydaci: [kandydat(7, 50.8123, 16.2921)]
      };
    }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    adapter
  );

  assert.equal(wynik.status, "znaleziono-jedna-lokalizacje");
  assert.equal(wynik.czyWywolanoInternet, true);
  assert.equal(wynik.czyWymagaPotwierdzenia, true);
  assert.equal(zapytania.length, 1);
  assert.equal(zapytania[0].tekstAdresu, "ul. Próbna 12, Miasto Testowe");
  assert.equal(zapytania[0].limitWynikow, 5);

  const automatyczna = budowa.modelLokalizacji.daneAutomatyczne;
  const robocza = budowa.modelLokalizacji.daneRobocze;
  assert.equal(automatyczna.zrodlo, "mapa");
  assert.equal(automatyczna.czyKorektaReczna, false);
  assert.equal(automatyczna.wspolrzedne.szerokoscGeograficzna, 50.8123);
  assert.equal(automatyczna.wspolrzedne.dlugoscGeograficzna, 16.2921);
  assert.equal(robocza.wspolrzedne, null);
  assert.equal(robocza.statusJakosci, "pelna");

  const wynikPowtorny = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    adapter
  );
  assert.equal(wynikPowtorny.status, "uzyto-zapisanego-wyniku-geokodowania");
  assert.equal(wynikPowtorny.czyWywolanoInternet, false);
  assert.equal(zapytania.length, 1);
}

async function sprawdzWieleWynikowBezCichegoWyboru() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-603", pelnyAdres());
  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        return {
          status: "ok",
          kandydaci: [
            kandydat(1, 50.1, 16.1),
            kandydat(2, 50.2, 16.2)
          ]
        };
      }
    }
  );

  assert.equal(wynik.status, "niejednoznaczna");
  assert.equal(wynik.kandydaci.length, 2);
  assert.equal(wynik.czyWymagaPotwierdzenia, true);
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.statusJakosci, "niejednoznaczna");
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.zrodlo, "mapa");
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.wspolrzedne, null);
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne, null);
}

async function sprawdzBrakWynikuIBladUslugi() {
  const aplikacja = uruchomAplikacje();
  const budowaBrak = utworzBudowe("B-604", pelnyAdres());
  const brak = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowaBrak,
    { geokoduj: function () { return { status: "brak-wynikow", kandydaci: [] }; } }
  );

  assert.equal(brak.status, "nieznaleziona");
  assert.equal(budowaBrak.modelLokalizacji.daneAutomatyczne.statusJakosci, "nieznaleziona");
  assert.equal(budowaBrak.modelLokalizacji.daneRobocze.statusJakosci, "pelna");

  const budowaTimeout = utworzBudowe("B-605", pelnyAdres());
  const timeout = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowaTimeout,
    {
      geokoduj: function () {
        return {
          status: "timeout",
          kandydaci: [],
          komunikatOperatora: "Timeout testowy",
          czyPonowicPozniej: true
        };
      }
    }
  );

  assert.equal(timeout.status, "timeout");
  assert.equal(timeout.czyPonowicPozniej, true);
  assert.equal(timeout.czyWywolanoInternet, true);
  assert.equal(budowaTimeout.modelLokalizacji.daneAutomatyczne.zrodlo, "brak");
}

async function sprawdzCachePrzedInternetem() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-606", pelnyAdres());
  let liczbaWywolan = 0;

  aplikacja.pamiecTras = {
    pobierzTrase: function () {
      return {
        status: "znaleziono",
        trasa: {
          rodzajKluczaLokalizacji: "wspolrzedne",
          adresLokalizacji: {
            tekst: "ul. Zapamiętana 4, Miasto Testowe",
            czesci: {}
          },
          wspolrzedneLokalizacji: {
            szerokoscGeograficzna: 50.777,
            dlugoscGeograficzna: 16.333
          }
        }
      };
    },
    wyszukajTrasy: function () { return { trasy: [] }; }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(1, 51, 17)] };
      }
    }
  );

  assert.equal(wynik.status, "uzyto-pamieci-lokalizacji");
  assert.equal(wynik.czyWywolanoInternet, false);
  assert.equal(liczbaWywolan, 0);
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "pamiec");
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.wspolrzedne.szerokoscGeograficzna,
    50.777
  );
}

async function sprawdzLokalnePodpowiedziPrzedInternetem() {
  const aplikacja = uruchomAplikacje();
  const budowa = utworzBudowe("B-607", pelnyAdres());
  let liczbaWywolan = 0;

  aplikacja.pamiecTras = {
    pobierzTrase: function () { return { status: "brak", trasa: null }; },
    wyszukajTrasy: function () {
      return {
        trasy: [{
          klucz: "test",
          wspolrzedneLokalizacji: {
            szerokoscGeograficzna: 50.7,
            dlugoscGeograficzna: 16.4
          }
        }]
      };
    }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(1, 51, 17)] };
      }
    }
  );

  assert.equal(wynik.status, "wymagany-wybor-z-pamieci");
  assert.equal(wynik.liczbaPodpowiedzi, 1);
  assert.equal(wynik.czyWywolanoInternet, false);
  assert.equal(liczbaWywolan, 0);
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const planTestow = wczytaj("testy/TESTY_ETAP_6.md");
  const readme = wczytaj("README.md");

  assert.match(etapy, /- \[ \] \*\*6F —/);
  assert.match(etapy, /- \[x\] \*\*6F\.1 — wyszukiwanie lokalizacji:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6F\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6F\.1/);
  assert.match(stan, /111\/111 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6F\.2 — wiele wyników/);
  assert.match(decyzje, /## 133\. Wynik geokodowania jest podpowiedzią automatyczną/);
  assert.match(kontrakt, /## Wyszukiwanie lokalizacji — 6F\.1/);
  assert.match(planTestow, /### 6F\.1 — wyszukiwanie lokalizacji/);
  assert.match(readme, /warstwie automatycznej[\s\S]*wymaga potwierdzenia/i);
}

(async function () {
  await sprawdzAdresNiewystarczajacy();
  await sprawdzJednaLokalizacjeIZapisAutomatyczny();
  await sprawdzWieleWynikowBezCichegoWyboru();
  await sprawdzBrakWynikuIBladUslugi();
  await sprawdzCachePrzedInternetem();
  await sprawdzLokalnePodpowiedziPrzedInternetem();
  sprawdzDokumentacje();
  console.log(
    "OK — 6F.1 wyszukuje tylko wystarczające adresy, używa cache przed internetem i zapisuje wynik jako automatyczną podpowiedź."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
''', encoding="utf-8")

# ---------------------------------------------------------------------------
# Dokumentacja i status projektu
# ---------------------------------------------------------------------------
replace_once(
    "ETAPY_ROZWOJU.md",
    "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6E zakończone; następny podetap 6F.1**",
    "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6E zakończone; 6F.1 zakończone; następny podetap 6F.2**"
)
replace_once(
    "ETAPY_ROZWOJU.md",
    "  - [ ] **6F.1 — wyszukiwanie lokalizacji:** wysyłać tylko wystarczający adres,",
    "  - [x] **6F.1 — wyszukiwanie lokalizacji:** wysyłać tylko wystarczający adres,"
)
replace_once(
    "ETAPY_ROZWOJU.md",
    "Następny niezakończony podetap: **6F.1 — wyszukiwanie lokalizacji**.",
    "Następny niezakończony podetap: **6F.2 — wiele wyników**."
)
with Path("ETAPY_ROZWOJU.md").open("a", encoding="utf-8") as handle:
    handle.write(r'''

## Wynik 6F.1 — wyszukiwanie lokalizacji

- [x] geokodowanie jest uruchamiane wyłącznie dla adresu o jakości `pelna` lub
  `niepelna`; opis zgodnościowy, adres niewystarczający i brak adresu nie są
  wysyłane do internetu;
- [x] przed geokodowaniem brama sprawdza bieżącą potwierdzoną lokalizację,
  zapisaną podpowiedź automatyczną, dokładny cache i lokalne podpowiedzi z
  zapisanymi współrzędnymi;
- [x] pojedynczy wynik mapy trafia wyłącznie do `daneAutomatyczne` ze źródłem
  `mapa` i nie zmienia `daneRobocze` bez decyzji operatora;
- [x] brak wyniku zapisuje automatyczny status `nieznaleziona`, a wiele wyników
  status `niejednoznaczna`; żaden kandydat nie jest wybierany po cichu;
- [x] neutralne błędy adaptera są przekazywane bez nadpisania lokalizacji;
- [x] test `testy/etap_6f_1.test.js` wraz z pełną regresją przechodzi
  **111/111 zestawów testów**.

Punkt **6F — geokodowanie i potwierdzenie lokalizacji budowy** pozostaje
otwarty. Następny niezakończony podetap: **6F.2 — wiele wyników**.
''')

replace_once(
    "STAN_PROJEKTU.md",
    "- Ostatni zakończony podetap: **6E.3 — bezpieczne błędy**.",
    "- Ostatni zakończony podetap: **6F.1 — wyszukiwanie lokalizacji**."
)
replace_once(
    "STAN_PROJEKTU.md",
    "- **Etap 6** jest rozpoczęty. Punkty **6A–6E** są zakończone; cały Etap 6 pozostaje otwarty.",
    "- **Etap 6** jest rozpoczęty. Punkty **6A–6E** są zakończone, a **6F.1** jest zakończone; cały Etap 6 pozostaje otwarty."
)
replace_once(
    "STAN_PROJEKTU.md",
    "- Pełna regresja po 6E.3 przechodzi **110/110 zestawów testów**.",
    "- Pełna regresja po 6F.1 przechodzi **111/111 zestawów testów**."
)
replace_once(
    "STAN_PROJEKTU.md",
    "- Diagnostyka błędu mapy nie zapisuje adresów, URL-i, surowych odpowiedzi ani klucza API.",
    "- Diagnostyka błędu mapy nie zapisuje adresów, URL-i, surowych odpowiedzi ani klucza API.\n- Geokodowanie budowy jest uruchamiane tylko dla adresów wystarczających do wyszukania i dopiero po sprawdzeniu zapisanych danych lokalnych.\n- Pojedynczy wynik geokodowania jest zapisywany w `daneAutomatyczne` ze źródłem `mapa`; nie staje się roboczą, potwierdzoną lokalizacją bez decyzji operatora.\n- Brak wyniku i wiele wyników są jawnie rozróżniane, a pierwszy kandydat nigdy nie jest wybierany po cichu."
)
replace_once(
    "STAN_PROJEKTU.md",
    "Rozpocząć **6F.1 — wyszukiwanie lokalizacji**. Podłączyć geokodowanie tylko dla adresów wystarczających do wyszukania, nadal sprawdzając cache przed internetem, i zapisywać neutralny wynik lokalizacji wraz z metadanymi źródła bez automatycznego zatwierdzania niejednoznacznych wyników.",
    "Rozpocząć **6F.2 — wiele wyników**. Przygotować operatorski wybór kandydatów geokodowania bez cichego wskazywania pierwszego wyniku, z czytelną informacją o adresie i danych potrzebnych do świadomej decyzji."
)

replace_once(
    "KONTRAKT_LOKALIZACJI_I_TRAS.md",
    "Status: **6A–6D oraz 6E.1 zakończone 2026-09-02; następny podetap 6E.2**.",
    "Status: **6A–6E zakończone; 6F.1 zakończone 2026-09-02; następny podetap 6F.2**."
)
with Path("KONTRAKT_LOKALIZACJI_I_TRAS.md").open("a", encoding="utf-8") as handle:
    handle.write(r'''

## Wyszukiwanie lokalizacji — 6F.1

`aplikacja.lokalizacje.wyszukajLokalizacjeBudowy()` jest bramą geokodowania
budowy. Nie wywołuje sieci dla adresu `brak` lub `niewystarczajaca` i korzysta
z lokalnej oceny 6B.3, więc do adaptera trafia wyłącznie tekst adresu nadający
się do wyszukania.

Kolejność przed internetem jest bezpieczna: potwierdzona bieżąca lokalizacja →
zapisana automatyczna podpowiedź ze współrzędnymi → dokładny wpis pamięci tras →
lokalne podpowiedzi z zapisanymi współrzędnymi → geokodowanie. Lokalna
podpowiedź nie jest stosowana automatycznie.

Pojedynczy kandydat z mapy trafia tylko do `daneAutomatyczne` ze źródłem
`mapa`, `czyKorektaReczna: false` i zachowanymi adresem oraz współrzędnymi.
`daneRobocze` pozostają bez zmian, dlatego wynik wymaga późniejszego
potwierdzenia. Brak kandydatów daje automatyczny status `nieznaleziona`, a
więcej niż jeden kandydat `niejednoznaczna`; lista kandydatów jest zwracana do
warstwy operatorskiej bez wybierania pierwszego elementu.

Neutralny błąd 6E.3 nie zmienia żadnej warstwy lokalizacji. 6F.1 nie wyznacza
jeszcze trasy i nie zatwierdza wyniku geokodowania — te odpowiedzialności
pozostają odpowiednio w dalszych podetapach 6F i 6G.
''')

with Path("PROJECT_DECISIONS.md").open("a", encoding="utf-8") as handle:
    handle.write(r'''

## 133. Wynik geokodowania jest podpowiedzią automatyczną, nie lokalizacją roboczą

- Do geokodowania wolno wysłać wyłącznie adres oceniony lokalnie jako `pelna`
  albo `niepelna`; nazwa firmy, nazwa budowy i adres niewystarczający nie są
  wysyłane jako zastępczy adres.
- Przed internetem należy sprawdzić potwierdzoną lokalizację, zapisany wynik
  automatyczny oraz pamięć lokalną; lokalna podpowiedź nadal wymaga jawnego
  wyboru.
- Pojedynczy wynik geokodowania zapisujemy w `daneAutomatyczne` ze źródłem
  `mapa`. Nie zmienia on `daneRobocze` i nie otrzymuje statusu `potwierdzona`
  bez decyzji operatora.
- Przy wielu wynikach nie wolno wybrać pierwszego kandydata automatycznie.
  Wynik ma status `niejednoznaczna` i zachowuje pełną listę kandydatów dla
  kolejnego kroku operatorskiego.
- Brak kandydatów ma status `nieznaleziona`; błąd usługi mapowej zachowuje
  neutralny status z 6E.3 i nie modyfikuje lokalizacji.
- Geokodowanie nie zapisuje surowej odpowiedzi dostawcy ani klucza API w modelu,
  planie lub diagnostyce.
''')

replace_once(
    "testy/TESTY_ETAP_6.md",
    "i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Następny podetap to\n**6F.1 — wyszukiwanie lokalizacji**.",
    "i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Podetap **6F.1**\njest zakończony. Następny podetap to **6F.2 — wiele wyników**."
)
insert_before_once(
    "testy/TESTY_ETAP_6.md",
    "## Końcowy test operatora 6J.3\n",
    r'''### 6F.1 — wyszukiwanie lokalizacji

Test `testy/etap_6f_1.test.js` sprawdza:

- brak wywołania geokodowania dla adresu niewystarczającego;
- wysłanie do adaptera wyłącznie roboczego tekstu adresu ocenionego jako
  wystarczający do wyszukania;
- pierwszeństwo potwierdzonej lokalizacji, zapisanego wyniku automatycznego,
  dokładnego cache i lokalnych podpowiedzi ze współrzędnymi przed internetem;
- zapis pojedynczego wyniku tylko do `daneAutomatyczne` ze źródłem `mapa`, bez
  nadpisania `daneRobocze` i bez automatycznego potwierdzenia;
- jawny status `niejednoznaczna` przy wielu kandydatach bez wyboru pierwszego;
- jawny status `nieznaleziona` przy braku wyniku;
- przekazanie neutralnego błędu usługi bez zmiany modelu lokalizacji;
- ponowne użycie zapisanej automatycznej podpowiedzi bez kolejnego zapytania;
- aktualizację dokumentacji i przejście do 6F.2 przy pozostawieniu całego 6F
  jako punktu otwartego.

'''
)

# README: krótki opis realnego zachowania 6F.1.
readme_marker = "Brak lub słaba jakość adresu nie blokują zapamiętanych ani ręcznie\nwpisanych czasów. Plik bez kolumn adresowych nadal działa tak jak wcześniej.\n"
readme_add = readme_marker + (
    "\nDla adresu pełnego lub niepełnego aplikacja może uruchomić geokodowanie dopiero\n"
    "po sprawdzeniu danych lokalnych. Pojedynczy wynik jest zapisywany w **warstwie automatycznej**\n"
    "razem ze źródłem `mapa` i współrzędnymi, ale nie staje się od razu lokalizacją roboczą —\n"
    "**wymaga potwierdzenia**. Przy wielu wynikach program nie wybiera pierwszego kandydata po cichu.\n"
)
replace_once("README.md", readme_marker, readme_add)

# Test planu Etapu 6: 6F jest nadal otwarte, ale F.1 jest zakończone.
plan_path = "testy/etap_6_plan.test.js"
replace_once(
    plan_path,
    '      const stan = ["A", "B", "C", "D", "E"].includes(litera)\n        ? "x"\n        : " ";',
    '      const stan = ["A", "B", "C", "D", "E"].includes(litera) ||\n        (litera === "F" && numer === 1)\n        ? "x"\n        : " ";'
)
replace_once(
    plan_path,
    "  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.1/);",
    "  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.2/);"
)
replace_once(
    plan_path,
    "/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6E zakończone; następny podetap 6F\\.1\\*\\*/",
    "/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6E zakończone; 6F\\.1 zakończone; następny podetap 6F\\.2\\*\\*/"
)
replace_once(
    plan_path,
    "  assert.match(stan, /Rozpocząć \\*\\*6F\\.1/);",
    "  assert.match(stan, /Rozpocząć \\*\\*6F\\.2/);"
)
replace_once(
    plan_path,
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6E oraz następny krok 6F.1."',
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6E i 6F.1 oraz następny krok 6F.2."'
)

# Historyczny test 6E.3 ma chronić zakres 6E.3, a nie zamrażać późniejszy stan projektu.
e63_path = "testy/etap_6e_3.test.js"
for stale in [
    '  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6E\\.3/);\n',
    '  assert.match(stan, /110\\/110 zestawów testów/);\n',
    '  assert.match(stan, /Rozpocząć \\*\\*6F\\.1 — wyszukiwanie lokalizacji/);\n'
]:
    text = read(e63_path)
    if stale not in text:
        raise SystemExit(f"Nie znaleziono historycznego oczekiwania 6E.3: {stale!r}")
    write(e63_path, text.replace(stale, "", 1))

print("Pakiet 6F.1 przygotowany.")
