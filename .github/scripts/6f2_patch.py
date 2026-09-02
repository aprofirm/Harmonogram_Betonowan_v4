from pathlib import Path


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f"Nie znaleziono wzorca w {path}: {old[:140]!r}")
    write(path, text.replace(old, new, 1))


def insert_before_once(path, marker, block):
    text = read(path)
    if marker not in text:
        raise SystemExit(f"Nie znaleziono znacznika w {path}: {marker[:140]!r}")
    if block.strip() in text:
        raise SystemExit(f"Blok jest juz obecny w {path}")
    write(path, text.replace(marker, block + marker, 1))


def append_once(path, block, marker):
    text = read(path)
    if marker in text:
        raise SystemExit(f"Blok jest juz obecny w {path}: {marker}")
    write(path, text.rstrip() + "\n\n" + block.strip() + "\n")


# ---------------------------------------------------------------------------
# 6F.2 — neutralna pewnosc kandydatow w adapterze mapowym
# ---------------------------------------------------------------------------
adapter_path = "js/lokalizacje/adapter_uslug_mapowych.js"
marker = "  function normalizujKandydataGeokodowania(kandydat) {\n"
block = r'''  function normalizujPewnoscGeokodowania(wartosc) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    let liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    if (liczba > 1 && liczba <= 100) {
      liczba /= 100;
    }

    if (liczba > 1) {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    return {
      wartosc: liczba,
      poziom: liczba >= 0.8
        ? "wysoka"
        : (liczba >= 0.5 ? "srednia" : "niska")
    };
  }

'''
insert_before_once(adapter_path, marker, block)

replace_once(
    adapter_path,
    '''  function normalizujKandydataGeokodowania(kandydat) {
    const dane = czyObiekt(kandydat) ? kandydat : {};

    return {
      adres: normalizujAdresKandydata(dane.adres),
      wspolrzedne: normalizujWspolrzedne(
        dane.wspolrzedne,
        "Kandydat geokodowania"
      ),
      statusJakosci: "nieoceniona",
      zrodlo: "mapa"
    };
  }
''',
    '''  function normalizujKandydataGeokodowania(kandydat) {
    const dane = czyObiekt(kandydat) ? kandydat : {};
    const pewnosc = normalizujPewnoscGeokodowania(dane.pewnosc);

    return {
      adres: normalizujAdresKandydata(dane.adres),
      wspolrzedne: normalizujWspolrzedne(
        dane.wspolrzedne,
        "Kandydat geokodowania"
      ),
      statusJakosci: "nieoceniona",
      zrodlo: "mapa",
      pewnosc: pewnosc.wartosc,
      poziomPewnosci: pewnosc.poziom,
      typWyniku: pobierzTekst(dane.typWyniku) || null
    };
  }
'''
)

replace_once(
    adapter_path,
    '''              wspolrzedne: {
                szerokoscGeograficzna: Number(wspolrzedne[1]),
                dlugoscGeograficzna: Number(wspolrzedne[0])
              }
            });
''',
    '''              wspolrzedne: {
                szerokoscGeograficzna: Number(wspolrzedne[1]),
                dlugoscGeograficzna: Number(wspolrzedne[0])
              },
              pewnosc: wlasciwosci.confidence,
              typWyniku: pobierzTekst(
                wlasciwosci.layer || wlasciwosci.match_type
              ) || null
            });
'''
)

# ---------------------------------------------------------------------------
# 6F.2 — przygotowanie kandydatow bez wyboru
# ---------------------------------------------------------------------------
lokalizacje_path = "js/lokalizacje/lokalizacje.js"
replace_once(
    lokalizacje_path,
    '''  function utworzKandydataZWarstwyLokalizacji(warstwa) {
    const dane = warstwa && typeof warstwa === "object" ? warstwa : {};

    return {
      adres: dane.adres || null,
      wspolrzedne: dane.wspolrzedne || null,
      statusJakosci: dane.statusJakosci || "nieoceniona",
      zrodlo: dane.zrodlo || "brak"
    };
  }
''',
    '''  function utworzKandydataZWarstwyLokalizacji(warstwa) {
    const dane = warstwa && typeof warstwa === "object" ? warstwa : {};

    return {
      adres: dane.adres || null,
      wspolrzedne: dane.wspolrzedne || null,
      statusJakosci: dane.statusJakosci || "nieoceniona",
      zrodlo: dane.zrodlo || "brak",
      pewnosc: null,
      poziomPewnosci: "brak-oceny",
      typWyniku: null
    };
  }

  function przygotujPewnoscKandydata(kandydat) {
    const dane = kandydat && typeof kandydat === "object" ? kandydat : {};
    let wartosc = dane.pewnosc;

    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    wartosc = Number(wartosc);

    if (!Number.isFinite(wartosc) || wartosc < 0) {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    if (wartosc > 1 && wartosc <= 100) {
      wartosc /= 100;
    }

    if (wartosc > 1) {
      return { wartosc: null, poziom: "brak-oceny" };
    }

    const poziomPodany = String(dane.poziomPewnosci || "").trim();
    const dozwolonePoziomy = ["wysoka", "srednia", "niska"];

    return {
      wartosc: wartosc,
      poziom: dozwolonePoziomy.includes(poziomPodany)
        ? poziomPodany
        : (wartosc >= 0.8
          ? "wysoka"
          : (wartosc >= 0.5 ? "srednia" : "niska"))
    };
  }

  function przygotujKandydataDoWyboru(kandydat, indeks) {
    const dane = kandydat && typeof kandydat === "object" ? kandydat : {};
    const pewnosc = przygotujPewnoscKandydata(dane);

    return {
      indeksKandydata: Number.isInteger(indeks) ? indeks : 0,
      adres: dane.adres || null,
      wspolrzedne: dane.wspolrzedne || null,
      statusJakosci: dane.statusJakosci || "nieoceniona",
      zrodlo: dane.zrodlo || "mapa",
      pewnosc: pewnosc.wartosc,
      poziomPewnosci: pewnosc.poziom,
      typWyniku: String(dane.typWyniku || "").trim() || null
    };
  }

  function przygotujKandydatowDoWyboru(kandydaci) {
    return Array.isArray(kandydaci)
      ? kandydaci.map(function (kandydat, indeks) {
        return przygotujKandydataDoWyboru(kandydat, indeks);
      })
      : [];
  }
'''
)

replace_once(
    lokalizacje_path,
    '''      if (kandydaci.length > 1) {
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
''',
    '''      if (kandydaci.length > 1) {
        const kandydaciDoWyboru = przygotujKandydatowDoWyboru(kandydaci);
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
          kandydaci: kandydaciDoWyboru,
          liczbaKandydatow: kandydaciDoWyboru.length,
          wybranyIndeksKandydata: null,
          czyWywolanoInternet: true,
          czyWymagaPotwierdzenia: true
        };
      }

      const kandydat = przygotujKandydataDoWyboru(kandydaci[0], 0);
'''
)

replace_once(
    lokalizacje_path,
    '''      const zapisanyKandydat =
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
''',
    '''      const zapisanyKandydat = Object.assign(
        {},
        kandydat,
        utworzKandydataZWarstwyLokalizacji(warstwaAutomatyczna),
        {
          pewnosc: kandydat.pewnosc,
          poziomPewnosci: kandydat.poziomPewnosci,
          typWyniku: kandydat.typWyniku,
          indeksKandydata: 0
        }
      );

      return {
        status: "znaleziono-jedna-lokalizacje",
        komunikat:
          "Znaleziono jedną lokalizację. Wynik zapisano jako automatyczną podpowiedź i wymaga potwierdzenia.",
        lokalizacjaAutomatyczna: zapisanyKandydat,
        kandydaci: [zapisanyKandydat],
        liczbaKandydatow: 1,
        wybranyIndeksKandydata: null,
        czyWywolanoInternet: true,
        czyWymagaPotwierdzenia: true
      };
'''
)

replace_once(
    lokalizacje_path,
    '''    zmienCzasRoboczyBudowy: zmienCzasRoboczyBudowy,
    wyszukajLokalizacjeBudowy: wyszukajLokalizacjeBudowy,
    pobierzLubUstalTrase: pobierzLubUstalTrase
''',
    '''    zmienCzasRoboczyBudowy: zmienCzasRoboczyBudowy,
    przygotujKandydatowDoWyboru: przygotujKandydatowDoWyboru,
    wyszukajLokalizacjeBudowy: wyszukajLokalizacjeBudowy,
    pobierzLubUstalTrase: pobierzLubUstalTrase
'''
)

# ---------------------------------------------------------------------------
# 6F.2 — warstwa prezentacji kandydatow (bez wyboru)
# ---------------------------------------------------------------------------
ui_path = "js/interfejs/kandydaci_lokalizacji.js"
write(ui_path, r'''(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const interfejsLokalizacji = aplikacja.interfejsLokalizacji =
    aplikacja.interfejsLokalizacji || {};
  let ostatnioAktywnyElement = null;
  let czyObslugaOknaGotowa = false;

  function pobierzPoziomPewnosci(kandydat) {
    const dane = kandydat && typeof kandydat === "object" ? kandydat : {};
    const podany = String(dane.poziomPewnosci || "").trim();

    if (["wysoka", "srednia", "niska", "brak-oceny"].includes(podany)) {
      return podany;
    }

    const wartosc = Number(dane.pewnosc);

    if (!Number.isFinite(wartosc) || wartosc < 0 || wartosc > 1) {
      return "brak-oceny";
    }

    return wartosc >= 0.8
      ? "wysoka"
      : (wartosc >= 0.5 ? "srednia" : "niska");
  }

  function pobierzEtykietePewnosci(kandydat) {
    const poziom = pobierzPoziomPewnosci(kandydat);
    const etykiety = {
      wysoka: "Wysoka",
      srednia: "Średnia",
      niska: "Niska",
      "brak-oceny": "Brak oceny dostawcy"
    };
    const wartosc = Number(kandydat && kandydat.pewnosc);

    if (!Number.isFinite(wartosc) || wartosc < 0 || wartosc > 1) {
      return etykiety[poziom];
    }

    return etykiety[poziom] + " · " + Math.round(wartosc * 100) + "%";
  }

  function opiszTypWyniku(typWyniku) {
    const typ = String(typWyniku || "").trim().toLowerCase();
    const etykiety = {
      address: "Adres",
      street: "Ulica",
      venue: "Obiekt",
      locality: "Miejscowość",
      localadmin: "Obszar lokalny",
      county: "Powiat",
      region: "Region"
    };

    return etykiety[typ] || (typ ? String(typWyniku) : "Nieokreślony");
  }

  function formatujWspolrzedne(wspolrzedne) {
    const dane = wspolrzedne && typeof wspolrzedne === "object"
      ? wspolrzedne
      : {};
    const szerokosc = Number(dane.szerokoscGeograficzna);
    const dlugosc = Number(dane.dlugoscGeograficzna);

    if (!Number.isFinite(szerokosc) || !Number.isFinite(dlugosc)) {
      return "Brak współrzędnych";
    }

    return szerokosc.toFixed(6) + ", " + dlugosc.toFixed(6);
  }

  function przygotujKandydataDoWyswietlenia(kandydat, indeks) {
    const dane = kandydat && typeof kandydat === "object" ? kandydat : {};
    const adres = dane.adres && typeof dane.adres === "object" ? dane.adres : {};

    return {
      numer: (Number.isInteger(indeks) ? indeks : 0) + 1,
      indeksKandydata: Number.isInteger(dane.indeksKandydata)
        ? dane.indeksKandydata
        : (Number.isInteger(indeks) ? indeks : 0),
      adresTekst: String(adres.tekst || "").trim() ||
        "Brak pełnego adresu w wyniku",
      wspolrzedneTekst: formatujWspolrzedne(dane.wspolrzedne),
      poziomPewnosci: pobierzPoziomPewnosci(dane),
      etykietaPewnosci: pobierzEtykietePewnosci(dane),
      typWyniku: opiszTypWyniku(dane.typWyniku),
      kandydat: dane
    };
  }

  function przygotujListeKandydatow(kandydaci) {
    return Array.isArray(kandydaci)
      ? kandydaci.map(przygotujKandydataDoWyswietlenia)
      : [];
  }

  function pobierzElement(identyfikator) {
    return zakresGlobalny.document &&
      zakresGlobalny.document.getElementById(identyfikator);
  }

  function zamknijOkno() {
    const okno = pobierzElement("okno-kandydatow-lokalizacji");

    if (!okno) {
      return;
    }

    okno.hidden = true;

    if (ostatnioAktywnyElement &&
        typeof ostatnioAktywnyElement.focus === "function") {
      ostatnioAktywnyElement.focus();
    }

    ostatnioAktywnyElement = null;
  }

  function zapewnijObslugeOkna() {
    if (czyObslugaOknaGotowa || !zakresGlobalny.document) {
      return;
    }

    const okno = pobierzElement("okno-kandydatow-lokalizacji");
    const przyciskZamknij = pobierzElement("przycisk-zamknij-kandydatow-lokalizacji");

    if (!okno || !przyciskZamknij) {
      return;
    }

    przyciskZamknij.addEventListener("click", zamknijOkno);
    okno.addEventListener("click", function (zdarzenie) {
      if (zdarzenie.target === okno) {
        zamknijOkno();
      }
    });
    zakresGlobalny.document.addEventListener("keydown", function (zdarzenie) {
      if (zdarzenie.key === "Escape" && !okno.hidden) {
        zamknijOkno();
      }
    });
    czyObslugaOknaGotowa = true;
  }

  function utworzWierszMetadanych(etykieta, wartosc, klasa) {
    const wiersz = zakresGlobalny.document.createElement("p");
    const nazwa = zakresGlobalny.document.createElement("strong");
    const tresc = zakresGlobalny.document.createElement("span");

    wiersz.className = "kandydat-lokalizacji__meta" + (klasa ? " " + klasa : "");
    nazwa.textContent = etykieta + ": ";
    tresc.textContent = wartosc;
    wiersz.appendChild(nazwa);
    wiersz.appendChild(tresc);
    return wiersz;
  }

  function utworzKarteKandydata(kandydat) {
    const karta = zakresGlobalny.document.createElement("article");
    const naglowek = zakresGlobalny.document.createElement("div");
    const numer = zakresGlobalny.document.createElement("strong");
    const pewnosc = zakresGlobalny.document.createElement("span");
    const adres = zakresGlobalny.document.createElement("p");

    karta.className = "kandydat-lokalizacji";
    karta.dataset.indeksKandydata = String(kandydat.indeksKandydata);
    naglowek.className = "kandydat-lokalizacji__naglowek";
    numer.textContent = "Wynik " + kandydat.numer;
    pewnosc.className = "kandydat-lokalizacji__pewnosc";
    pewnosc.dataset.poziom = kandydat.poziomPewnosci;
    pewnosc.textContent = kandydat.etykietaPewnosci;
    adres.className = "kandydat-lokalizacji__adres";
    adres.textContent = kandydat.adresTekst;

    naglowek.appendChild(numer);
    naglowek.appendChild(pewnosc);
    karta.appendChild(naglowek);
    karta.appendChild(adres);
    karta.appendChild(utworzWierszMetadanych("Typ", kandydat.typWyniku));
    karta.appendChild(
      utworzWierszMetadanych("Współrzędne", kandydat.wspolrzedneTekst)
    );
    return karta;
  }

  function pokazKandydatow(kandydaci, opisBudowy) {
    if (!zakresGlobalny.document) {
      return { status: "brak-dokumentu", liczbaKandydatow: 0 };
    }

    zapewnijObslugeOkna();
    const okno = pobierzElement("okno-kandydatow-lokalizacji");
    const lista = pobierzElement("lista-kandydatow-lokalizacji");
    const opis = pobierzElement("opis-kandydatow-lokalizacji");
    const przyciskZamknij = pobierzElement("przycisk-zamknij-kandydatow-lokalizacji");

    if (!okno || !lista || !opis) {
      return { status: "brak-elementow-interfejsu", liczbaKandydatow: 0 };
    }

    const przygotowani = przygotujListeKandydatow(kandydaci);
    opis.textContent = przygotowani.length
      ? "Znaleziono " + przygotowani.length + " możliwych lokalizacji" +
        (opisBudowy ? " dla „" + String(opisBudowy) + "”" : "") +
        ". Żaden wynik nie zostanie zastosowany bez świadomego wyboru."
      : "Nie ma kandydatów lokalizacji do pokazania.";

    const elementy = przygotowani.map(utworzKarteKandydata);

    if (!elementy.length) {
      const pusty = zakresGlobalny.document.createElement("p");
      pusty.className = "pusta-historia";
      pusty.textContent = "Brak wyników do pokazania.";
      elementy.push(pusty);
    }

    lista.replaceChildren.apply(lista, elementy);
    ostatnioAktywnyElement = zakresGlobalny.document.activeElement;
    okno.hidden = false;

    if (przyciskZamknij && typeof przyciskZamknij.focus === "function") {
      przyciskZamknij.focus();
    }

    return {
      status: przygotowani.length ? "pokazano-kandydatow" : "brak-kandydatow",
      liczbaKandydatow: przygotowani.length
    };
  }

  Object.assign(interfejsLokalizacji, {
    przygotujListeKandydatow: przygotujListeKandydatow,
    pokazKandydatow: pokazKandydatow,
    zamknijOknoKandydatow: zamknijOkno
  });
})(window);
''')

# ---------------------------------------------------------------------------
# index + CSS
# ---------------------------------------------------------------------------
index_path = "index.html"
insert_before_once(
    index_path,
    '''      <footer class="stopka">\n''',
    '''      <div id="okno-kandydatow-lokalizacji" class="okno-historii" hidden>
        <section
          class="okno-historii__panel okno-historii__panel--lokalizacje"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tytul-okna-kandydatow-lokalizacji"
        >
          <div class="okno-historii__naglowek">
            <div>
              <p class="etykieta-sekcji">LOKALIZACJA BUDOWY</p>
              <h2 id="tytul-okna-kandydatow-lokalizacji">Możliwe lokalizacje</h2>
            </div>
            <button
              id="przycisk-zamknij-kandydatow-lokalizacji"
              class="przycisk-zamknij"
              type="button"
              aria-label="Zamknij listę możliwych lokalizacji"
            >
              ×
            </button>
          </div>
          <p id="opis-kandydatow-lokalizacji" class="okno-historii__opis">
            Wyniki wyszukiwania zostaną pokazane tutaj bez automatycznego wyboru.
          </p>
          <div id="lista-kandydatow-lokalizacji" class="lista-kandydatow-lokalizacji"></div>
        </section>
      </div>

'''
)
replace_once(
    index_path,
    'js/lokalizacje/adapter_uslug_mapowych.js?v=6e2-adapter-20260902a',
    'js/lokalizacje/adapter_uslug_mapowych.js?v=6f2-kandydaci-20260902a'
)
replace_once(
    index_path,
    'js/lokalizacje/lokalizacje.js?v=6e2-adapter-20260902a',
    'js/lokalizacje/lokalizacje.js?v=6f2-kandydaci-20260902a'
)
replace_once(
    index_path,
    '''    <script defer src="js/interfejs/podglad_tras.js"></script>\n''',
    '''    <script defer src="js/interfejs/podglad_tras.js"></script>
    <script defer src="js/interfejs/kandydaci_lokalizacji.js?v=6f2-kandydaci-20260902a"></script>
'''
)

css_path = "style/glowny.css"
append_once(css_path, r'''
/* 6F.2 — czytelna lista kandydatów geokodowania bez automatycznego wyboru. */
.okno-historii__panel--lokalizacje {
  width: min(820px, 100%);
}

.lista-kandydatow-lokalizacji {
  display: grid;
  gap: 10px;
}

.kandydat-lokalizacji {
  display: grid;
  gap: 7px;
  padding: 13px 14px;
  border: 1px solid var(--kolor-obramowania);
  border-radius: 10px;
  background: #fbfcfd;
}

.kandydat-lokalizacji__naglowek {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kandydat-lokalizacji__naglowek > strong {
  color: var(--kolor-granatowy-ciemny);
  font-size: 0.8rem;
}

.kandydat-lokalizacji__pewnosc {
  padding: 3px 8px;
  border: 1px solid #d6e1e7;
  border-radius: 999px;
  color: #526875;
  background: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  white-space: nowrap;
}

.kandydat-lokalizacji__pewnosc[data-poziom="wysoka"] {
  border-color: #b9dfcf;
  color: #176b4d;
  background: #f0faf5;
}

.kandydat-lokalizacji__pewnosc[data-poziom="srednia"] {
  border-color: #f0cf9a;
  color: #8b561c;
  background: #fff8ec;
}

.kandydat-lokalizacji__pewnosc[data-poziom="niska"] {
  border-color: #edc8c8;
  color: #9c2f2f;
  background: #fff5f5;
}

.kandydat-lokalizacji__adres {
  margin: 0;
  color: var(--kolor-granatowy-ciemny);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.4;
}

.kandydat-lokalizacji__meta {
  margin: 0;
  color: var(--kolor-tekstu-pomocniczego);
  font-size: 0.72rem;
  line-height: 1.4;
}

.kandydat-lokalizacji__meta strong {
  color: #526875;
}
''', "6F.2 — czytelna lista kandydatów")

# ---------------------------------------------------------------------------
# Test 6F.2
# ---------------------------------------------------------------------------
test_path = "testy/etap_6f_2.test.js"
write(test_path, r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
}

function uruchomAdapter() {
  const sandbox = {
    window: {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      HarmonogramBetonowan: {}
    },
    URLSearchParams: URLSearchParams,
    Promise: Promise,
    console: console
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/lokalizacje/adapter_uslug_mapowych.js"),
    sandbox,
    { filename: "adapter_uslug_mapowych.js" }
  );
  return sandbox.window.HarmonogramBetonowan.uslugiMapowe;
}

function uruchomLokalizacje() {
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

function uruchomInterfejsLokalizacji() {
  const sandbox = { window: {}, console: console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(
    wczytaj("js/interfejs/kandydaci_lokalizacji.js"),
    sandbox,
    { filename: "kandydaci_lokalizacji.js" }
  );
  return sandbox.window.HarmonogramBetonowan.interfejsLokalizacji;
}

function kandydat(numer, pewnosc, typWyniku) {
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
      szerokoscGeograficzna: 50 + numer / 100,
      dlugoscGeograficzna: 16 + numer / 100
    },
    statusJakosci: "nieoceniona",
    zrodlo: "mapa",
    pewnosc: pewnosc,
    typWyniku: typWyniku
  };
}

async function sprawdzNeutralnePoziomyPewnosci() {
  const mod = uruchomAdapter();
  const adapter = mod.utworzNeutralnyAdapter({
    geokoduj: function () {
      return {
        kandydaci: [
          kandydat(1, 0.91, "address"),
          kandydat(2, 0.64, "street"),
          kandydat(3, 0.31, "locality"),
          kandydat(4, null, "region")
        ]
      };
    },
    wyznaczTrase: function () {
      return { dystansDrogowyMetry: 1, czasPrzejazduMinuty: 1 };
    }
  });

  const wynik = await adapter.geokoduj({
    tekstAdresu: "ul. Próbna 12, Miasto Testowe",
    limitWynikow: 5
  });

  assert.equal(wynik.status, "ok");
  assert.deepEqual(
    Array.from(wynik.kandydaci, function (element) {
      return element.poziomPewnosci;
    }),
    ["wysoka", "srednia", "niska", "brak-oceny"]
  );
  assert.equal(wynik.kandydaci[0].pewnosc, 0.91);
  assert.equal(wynik.kandydaci[0].typWyniku, "address");
  assert.equal(wynik.kandydaci[3].pewnosc, null);
}

async function sprawdzMapowanieOpenrouteservice() {
  const mod = uruchomAdapter();
  const adapter = mod.utworzAdapterOpenrouteservice({
    kluczApi: "TEST",
    wykonajZapytanie: function (url) {
      assert.match(String(url), /\/geocode\/search\?/);
      return {
        features: [{
          geometry: { coordinates: [16.2921, 50.8123] },
          properties: {
            label: "ul. Wynikowa 7, Miasto Testowe",
            street: "Wynikowa",
            housenumber: "7",
            locality: "Miasto Testowe",
            confidence: 0.87,
            layer: "address"
          }
        }]
      };
    }
  });

  const wynik = await adapter.geokoduj({
    tekstAdresu: "ul. Wynikowa 7, Miasto Testowe",
    limitWynikow: 5
  });

  assert.equal(wynik.kandydaci.length, 1);
  assert.equal(wynik.kandydaci[0].pewnosc, 0.87);
  assert.equal(wynik.kandydaci[0].poziomPewnosci, "wysoka");
  assert.equal(wynik.kandydaci[0].typWyniku, "address");
}

async function sprawdzBrakCichegoWyboru() {
  const aplikacja = uruchomLokalizacje();
  const budowa = {
    idBudowy: "B-620",
    firma: "Firma Testowa",
    budowa: "Obiekt B-620",
    zrodlo: "csv",
    adresZrodlowy: {
      tekst: "ul. Próbna 12, Miasto Testowe",
      czesci: {
        ulica: "Próbna",
        numerBudynku: "12",
        miejscowosc: "Miasto Testowe"
      }
    }
  };

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        return {
          status: "ok",
          kandydaci: [
            kandydat(1, 0.94, "address"),
            kandydat(2, 0.72, "address"),
            kandydat(3, 0.41, "street")
          ]
        };
      }
    }
  );

  assert.equal(wynik.status, "niejednoznaczna");
  assert.equal(wynik.liczbaKandydatow, 3);
  assert.equal(wynik.wybranyIndeksKandydata, null);
  assert.deepEqual(
    Array.from(wynik.kandydaci, function (element) {
      return element.indeksKandydata;
    }),
    [0, 1, 2]
  );
  assert.deepEqual(
    Array.from(wynik.kandydaci, function (element) {
      return element.poziomPewnosci;
    }),
    ["wysoka", "srednia", "niska"]
  );
  assert.equal(
    budowa.modelLokalizacji.daneAutomatyczne.statusJakosci,
    "niejednoznaczna"
  );
  assert.equal(budowa.modelLokalizacji.daneAutomatyczne.wspolrzedne, null);
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne, null);
}

function sprawdzPrezentacjeKandydatow() {
  const interfejs = uruchomInterfejsLokalizacji();
  const lista = interfejs.przygotujListeKandydatow([
    Object.assign(kandydat(1, 0.91, "address"), {
      indeksKandydata: 0,
      poziomPewnosci: "wysoka"
    }),
    Object.assign(kandydat(2, null, "region"), {
      indeksKandydata: 1,
      poziomPewnosci: "brak-oceny"
    })
  ]);

  assert.equal(lista.length, 2);
  assert.equal(lista[0].numer, 1);
  assert.equal(lista[0].adresTekst, "ul. Wynikowa 1, Miasto Testowe");
  assert.equal(lista[0].etykietaPewnosci, "Wysoka · 91%");
  assert.equal(lista[0].typWyniku, "Adres");
  assert.match(lista[0].wspolrzedneTekst, /^50\.010000, 16\.010000$/);
  assert.equal(lista[1].etykietaPewnosci, "Brak oceny dostawcy");
  assert.equal(lista[1].typWyniku, "Region");
}

function sprawdzInterfejsBezWyboru() {
  const index = wczytaj("index.html");
  const skrypt = wczytaj("js/interfejs/kandydaci_lokalizacji.js");
  const css = wczytaj("style/glowny.css");

  assert.match(index, /id="okno-kandydatow-lokalizacji"/);
  assert.match(index, /id="lista-kandydatow-lokalizacji"/);
  assert.match(index, /js\/interfejs\/kandydaci_lokalizacji\.js/);
  assert.match(skrypt, /Żaden wynik nie zostanie zastosowany bez świadomego wyboru/);
  assert.doesNotMatch(skrypt, /zastosujWybran|zatwierdzKandydat/);
  assert.match(css, /\.kandydat-lokalizacji__pewnosc/);
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const readme = wczytaj("README.md");

  assert.match(etapy, /- \[ \] \*\*6F —/);
  assert.match(etapy, /- \[x\] \*\*6F\.2 — wiele wyników:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6F\.3/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6F\.2/);
  assert.match(stan, /112\/112 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6F\.3 — ręczne wskazanie/);
  assert.match(decyzje, /## 134\. Pewność geokodowania jest wskazówką, nie decyzją/);
  assert.match(kontrakt, /## Kandydaci geokodowania — 6F\.2/);
  assert.match(plan, /### 6F\.2 — wiele wyników/);
  assert.match(readme, /poziom pewności[\s\S]*nie wybiera/i);
}

(async function () {
  await sprawdzNeutralnePoziomyPewnosci();
  await sprawdzMapowanieOpenrouteservice();
  await sprawdzBrakCichegoWyboru();
  sprawdzPrezentacjeKandydatow();
  sprawdzInterfejsBezWyboru();
  sprawdzDokumentacje();
  console.log(
    "OK — 6F.2 pokazuje wiele kandydatów z poziomem pewności i nie wybiera żadnego bez decyzji operatora."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
''')

# ---------------------------------------------------------------------------
# Historyczny test 6F.1 nie zamraza aktualnego kroku projektu
# ---------------------------------------------------------------------------
old_test_path = "testy/etap_6f_1.test.js"
replace_once(
    old_test_path,
    '''  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.2/);
  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6F\\.1/);
  assert.match(stan, /111\\/111 zestawów testów/);
  assert.match(stan, /Rozpocząć \\*\\*6F\\.2 — wiele wyników/);
''',
    '''  assert.match(stan, /\\*\\*6F\\.1\\*\\* jest zakończone|\\*\\*6F\\.1\\*\\* jest zakończony|6F\\.1.*zakończone/i);
'''
)

# ---------------------------------------------------------------------------
# Plan testow i status planu
# ---------------------------------------------------------------------------
plan_test_path = "testy/etap_6_plan.test.js"
replace_once(
    plan_test_path,
    '''      const stan = ["A", "B", "C", "D", "E"].includes(litera) ||
        (litera === "F" && numer === 1)
''',
    '''      const stan = ["A", "B", "C", "D", "E"].includes(litera) ||
        (litera === "F" && [1, 2].includes(numer))
'''
)
replace_once(
    plan_test_path,
    '''  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.2/);
''',
    '''  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.3/);
'''
)
replace_once(
    plan_test_path,
    '''/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6E zakończone; 6F\\.1 zakończone; następny podetap 6F\\.2\\*\\*/
''',
    '''/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6E zakończone; 6F\\.1–6F\\.2 zakończone; następny podetap 6F\\.3\\*\\*/
'''
)
replace_once(
    plan_test_path,
    '''  assert.match(stan, /Rozpocząć \\*\\*6F\\.2/);
''',
    '''  assert.match(stan, /Rozpocząć \\*\\*6F\\.3/);
'''
)
replace_once(
    plan_test_path,
    '''  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6E i 6F.1 oraz następny krok 6F.2."
''',
    '''  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6E i 6F.1–6F.2 oraz następny krok 6F.3."
'''
)

# ---------------------------------------------------------------------------
# Dokumentacja
# ---------------------------------------------------------------------------
etapy_path = "ETAPY_ROZWOJU.md"
replace_once(
    etapy_path,
    '''- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6E zakończone; 6F.1 zakończone; następny podetap 6F.2**
''',
    '''- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6E zakończone; 6F.1–6F.2 zakończone; następny podetap 6F.3**
'''
)
replace_once(
    etapy_path,
    '''  - [ ] **6F.2 — wiele wyników:** nie wybierać po cichu pierwszego dopasowania;
    pokazać kandydatów i poziom pewności do decyzji operatora.
''',
    '''  - [x] **6F.2 — wiele wyników:** nie wybierać po cichu pierwszego dopasowania;
    pokazać kandydatów i poziom pewności do decyzji operatora.
'''
)
replace_once(
    etapy_path,
    '''Następny niezakończony podetap: **6F.2''',
    '''Następny niezakończony podetap: **6F.3'''
)
append_once(etapy_path, r'''
## Wynik 6F.2 — wiele wyników geokodowania

- Neutralny kontrakt kandydata zawiera opcjonalny wynik pewności dostawcy,
  sprowadzony do zakresu `0–1`, poziom `wysoka`, `srednia`, `niska` albo
  `brak-oceny` oraz neutralny typ wyniku.
- Dla openrouteservice wykorzystywane są dostępne metadane `confidence` i typ
  wyniku, ale surowy format dostawcy nadal nie przechodzi poza adapter.
- Lista kandydatów zachowuje kolejność odpowiedzi i jawny indeks, lecz ma
  `wybranyIndeksKandydata = null`; poziom pewności nie jest mechanizmem
  automatycznego wyboru.
- Dodano gotowe okno prezentacji wielu lokalizacji. Pokazuje adres, poziom
  pewności, typ i współrzędne, ale nie ma jeszcze operacji zastosowania wyniku.
- Punkt **6F** pozostaje otwarty. Następny podetap to **6F.3 — ręczne wskazanie**.
''', "## Wynik 6F.2 — wiele wyników geokodowania")

stan_path = "STAN_PROJEKTU.md"
replace_once(
    stan_path,
    '''- Ostatni zakończony podetap: **6F.1 — wyszukiwanie lokalizacji**.
''',
    '''- Ostatni zakończony podetap: **6F.2 — wiele wyników**.
'''
)
replace_once(
    stan_path,
    '''- **Etap 6** jest rozpoczęty. Punkty **6A–6E** są zakończone, a **6F.1** jest zakończone; cały Etap 6 pozostaje otwarty.
- Pełna regresja po 6F.1 przechodzi **111/111 zestawów testów**.
''',
    '''- **Etap 6** jest rozpoczęty. Punkty **6A–6E** oraz **6F.1–6F.2** są zakończone; cały Etap 6 pozostaje otwarty.
- Pełna regresja po 6F.2 przechodzi **112/112 zestawów testów**.
'''
)
replace_once(
    stan_path,
    '''- Brak wyniku i wiele wyników są jawnie rozróżniane, a pierwszy kandydat nigdy nie jest wybierany po cichu.
''',
    '''- Brak wyniku i wiele wyników są jawnie rozróżniane, a pierwszy kandydat nigdy nie jest wybierany po cichu.
- Kandydaci geokodowania mają neutralny poziom pewności `wysoka`, `srednia`, `niska` albo `brak-oceny`; jest to wyłącznie wskazówka dla operatora.
- Gotowe okno kandydatów pokazuje adres, pewność, typ i współrzędne, ale 6F.2 nie stosuje jeszcze żadnego wyniku do warstwy roboczej.
'''
)
replace_once(
    stan_path,
    '''Rozpocząć **6F.2 — wiele wyników**. Przygotować operatorski wybór kandydatów geokodowania bez cichego wskazywania pierwszego wyniku, z czytelną informacją o adresie i danych potrzebnych do świadomej decyzji.
''',
    '''Rozpocząć **6F.3 — ręczne wskazanie**. Pozwolić operatorowi świadomie wybrać jednego z kandydatów, poprawić adres albo podać pełne współrzędne; dopiero zatwierdzona lokalizacja ma trafić do warstwy roboczej jako `potwierdzona`.
'''
)

kontrakt_path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
append_once(kontrakt_path, r'''
## Kandydaci geokodowania — 6F.2

Wynik geokodowania może zawierać wiele kandydatów. Kandydat przekazywany poza
adapter ma neutralny format:

- `adres`,
- `wspolrzedne`,
- `zrodlo = mapa`,
- opcjonalne `pewnosc` w zakresie `0–1`,
- `poziomPewnosci`: `wysoka`, `srednia`, `niska` albo `brak-oceny`,
- opcjonalny neutralny `typWyniku`,
- jawny `indeksKandydata` nadany przez aplikację.

Progi prezentacyjne wynoszą: `>= 0.8` — wysoka, `>= 0.5` — średnia, poniżej
`0.5` — niska. Są wyłącznie ułatwieniem prezentacji wyniku dostawcy. Nie są
gwarancją poprawności adresu i nie mogą uruchamiać automatycznego wyboru.

Przy wielu wynikach aplikacja zachowuje kolejność otrzymanych kandydatów oraz
`wybranyIndeksKandydata = null`. Warstwa automatyczna ma status
`niejednoznaczna` i nie otrzymuje współrzędnych pierwszego wyniku. Warstwa
robocza pozostaje bez zmian.

Okno kandydatów może pokazać operatorowi adres, poziom pewności, typ oraz
współrzędne. W 6F.2 nie ma jeszcze operacji zastosowania kandydata. Świadomy
wybór, poprawa adresu i ręczne współrzędne należą do 6F.3.
''', "## Kandydaci geokodowania — 6F.2")

# decyzja 134
append_once("PROJECT_DECISIONS.md", r'''
## 134. Pewność geokodowania jest wskazówką, nie decyzją

- Jeżeli dostawca geokodowania zwraca liczbową pewność dopasowania, adapter
  sprowadza ją do neutralnego zakresu `0–1`; brak albo niepoprawna wartość jest
  jawnie opisywana jako `brak-oceny`.
- Do prezentacji używamy czterech stanów: `wysoka`, `srednia`, `niska` i
  `brak-oceny`. Progi są wyłącznie czytelną klasyfikacją wyniku dostawcy, a nie
  dowodem poprawności lokalizacji.
- Aplikacja nie sortuje kandydatów na własną rękę według pewności, nie wybiera
  pierwszego wyniku i nie przenosi jego współrzędnych do warstwy roboczej.
- Przy wielu wynikach `wybranyIndeksKandydata` pozostaje `null`, dopóki operator
  nie wykona świadomej operacji w 6F.3.
- Lista kandydatów jest wynikiem bieżącego wyszukiwania i nie jest zapisywana w
  historii planu ani diagnostyce. Zapisujemy jedynie neutralny stan
  `niejednoznaczna`; ogranicza to zbędne utrwalanie danych dostawcy.
- Okno 6F.2 służy tylko do porównania adresu, typu, współrzędnych i pewności.
  Zastosowanie wyniku, poprawa adresu oraz ręczne współrzędne należą do 6F.3.
''', "## 134. Pewność geokodowania jest wskazówką, nie decyzją")

plan_path = "testy/TESTY_ETAP_6.md"
replace_once(
    plan_path,
    '''i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Następny podetap to
**6F.1 — wyszukiwanie lokalizacji**.
''',
    '''i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Podetapy
**6F.1–6F.2** są zakończone. Następny podetap to **6F.3 — ręczne wskazanie**.
'''
)
# poprzedni status po 6F.1 może miec juz inny tekst
text = read(plan_path)
text = text.replace(
    "Podetap **6F.1** jest zakończony. Następny podetap to\n**6F.2 — wiele wyników**.",
    "Podetapy **6F.1–6F.2** są zakończone. Następny podetap to\n**6F.3 — ręczne wskazanie**."
)
write(plan_path, text)
append_once(plan_path, r'''
### 6F.2 — wiele wyników

Test `testy/etap_6f_2.test.js` sprawdza:

- neutralne przeniesienie opcjonalnej pewności geokodowania bez surowego
  formatu dostawcy;
- poziomy `wysoka`, `srednia`, `niska` i `brak-oceny` oraz ich granice;
- mapowanie `confidence` i typu wyniku openrouteservice na neutralnego
  kandydata;
- zachowanie kolejności wielu wyników i jawne
  `wybranyIndeksKandydata = null`;
- brak współrzędnych pierwszego wyniku w warstwie automatycznej oraz brak zmian
  warstwy roboczej przy statusie `niejednoznaczna`;
- prezentację adresu, pewności, typu i współrzędnych w gotowym oknie kandydatów;
- brak funkcji zastosowania kandydata przed 6F.3;
- aktualizację dokumentacji i przejście do 6F.3.
''', "### 6F.2 — wiele wyników")

readme_path = "README.md"
needle = "Brak lub słaba jakość adresu nie blokują zapamiętanych ani ręcznie\nwpisanych czasów. Plik bez kolumn adresowych nadal działa tak jak wcześniej.\n"
replacement = needle + "\nJeżeli geokodowanie zwróci kilka możliwych lokalizacji, aplikacja zachowuje je\njako kandydatów i pokazuje adres, współrzędne, typ wyniku oraz poziom pewności\ndostawcy: wysoki, średni, niski albo brak oceny. Poziom pewności jest tylko\nwskazówką — program nie wybiera pierwszego ani najwyżej ocenionego wyniku bez\nświadomej decyzji operatora. Samo zastosowanie kandydata należy do kolejnego\nkroku 6F.3.\n"
replace_once(readme_path, needle, replacement)

print("Pakiet 6F.2 przygotowany.")
