from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f"Nie znaleziono wzorca w {path}: {old[:160]!r}")
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement):
    text = read(path)
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise SystemExit(f"Wzorzec regex w {path} wystapil {count} razy: {pattern!r}")
    write(path, new_text)


def append_once(path, marker, block):
    text = read(path)
    if marker in text:
        raise SystemExit(f"Blok juz istnieje w {path}: {marker}")
    write(path, text.rstrip() + "\n\n" + block.strip() + "\n")


# ---------------------------------------------------------------------------
# Domena: jawne zatwierdzanie kandydata albo korekty recznej
# ---------------------------------------------------------------------------
path = "js/lokalizacje/lokalizacje.js"
marker = "  function pobierzFunkcjeTrasyMapowej(uslugaMapowa) {\n"
block = r'''  function pobierzWspolrzedneKorektyLokalizacji(daneKorekty) {
    const dane = daneKorekty && typeof daneKorekty === "object"
      ? daneKorekty
      : {};
    const podaneWspolrzedne = dane.wspolrzedne &&
      typeof dane.wspolrzedne === "object"
      ? dane.wspolrzedne
      : {};
    const szerokoscSurowa = podaneWspolrzedne.szerokoscGeograficzna !== undefined
      ? podaneWspolrzedne.szerokoscGeograficzna
      : dane.szerokoscGeograficzna;
    const dlugoscSurowa = podaneWspolrzedne.dlugoscGeograficzna !== undefined
      ? podaneWspolrzedne.dlugoscGeograficzna
      : dane.dlugoscGeograficzna;
    const szerokoscTekst = String(
      szerokoscSurowa === null || szerokoscSurowa === undefined ? "" : szerokoscSurowa
    ).trim();
    const dlugoscTekst = String(
      dlugoscSurowa === null || dlugoscSurowa === undefined ? "" : dlugoscSurowa
    ).trim();

    if (!szerokoscTekst && !dlugoscTekst) {
      return null;
    }

    if (!szerokoscTekst || !dlugoscTekst) {
      throw new Error(
        "Ręczne współrzędne wymagają jednocześnie szerokości i długości geograficznej."
      );
    }

    const szerokosc = Number(szerokoscTekst);
    const dlugosc = Number(dlugoscTekst);

    if (!Number.isFinite(szerokosc) || szerokosc < -90 || szerokosc > 90 ||
        !Number.isFinite(dlugosc) || dlugosc < -180 || dlugosc > 180) {
      throw new Error("Podaj poprawne współrzędne geograficzne budowy.");
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function pobierzAdresKorektyLokalizacji(daneKorekty, adresBazowy) {
    const dane = daneKorekty && typeof daneKorekty === "object"
      ? daneKorekty
      : {};

    if (dane.adres && typeof dane.adres === "object") {
      return aplikacja.lokalizacje.utworzAdresRoboczy(dane.adres);
    }

    const tekstAdresu = String(
      dane.adres === null || dane.adres === undefined ? "" : dane.adres
    ).trim();

    if (tekstAdresu) {
      return aplikacja.lokalizacje.utworzAdresRoboczy({ tekst: tekstAdresu });
    }

    return aplikacja.lokalizacje.utworzAdresRoboczy(adresBazowy || {});
  }

  function zapiszRoboczaLokalizacjeBudowy(budowa, warstwaRobocza) {
    const model = budowa && budowa.modelLokalizacji || {};

    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
      Object.assign({}, model, {
        idWezla: pobierzIdAktywnegoWezla(),
        daneRobocze: warstwaRobocza
      })
    );

    return budowa.modelLokalizacji.daneRobocze;
  }

  function zatwierdzKandydataLokalizacji(budowa, kandydaci, indeksKandydata) {
    if (!budowa) {
      throw new Error("Nie wskazano budowy, której lokalizację chcesz zatwierdzić.");
    }

    migrujBudoweDoKontraktuTras(budowa);
    const lista = Array.isArray(kandydaci) ? kandydaci : [];
    const indeks = Number(indeksKandydata);

    if (!Number.isInteger(indeks) || indeks < 0 || indeks >= lista.length) {
      throw new Error("Wybierz istniejący wynik wyszukiwania lokalizacji.");
    }

    const kandydat = przygotujKandydataDoWyboru(lista[indeks], indeks);

    if (!czyWarstwaMaWspolrzedne(kandydat)) {
      throw new Error("Wybrany wynik nie zawiera poprawnych współrzędnych.");
    }

    const model = budowa.modelLokalizacji || {};
    const poprzedniaWarstwa = model.daneRobocze || {};
    const adres = kandydat.adres
      ? aplikacja.lokalizacje.utworzAdresRoboczy(kandydat.adres)
      : aplikacja.lokalizacje.utworzAdresRoboczy(poprzedniaWarstwa.adres || {});
    const zrodlo = kandydat.zrodlo === "pamiec" ? "pamiec" : "mapa";
    const warstwaRobocza = zapiszRoboczaLokalizacjeBudowy(budowa, {
      adres: adres,
      wspolrzedne: kandydat.wspolrzedne,
      statusJakosci: "potwierdzona",
      zrodlo: zrodlo,
      czyKorektaReczna: true
    });

    return {
      status: "zatwierdzono-kandydata",
      wybranyIndeksKandydata: indeks,
      czyPotwierdzona: true,
      lokalizacja: warstwaRobocza,
      kandydat: kandydat
    };
  }

  function ustawRecznaLokalizacjeBudowy(budowa, daneKorekty) {
    if (!budowa) {
      throw new Error("Nie wskazano budowy, której lokalizację chcesz poprawić.");
    }

    migrujBudoweDoKontraktuTras(budowa);
    const model = budowa.modelLokalizacji || {};
    const poprzedniaWarstwa = model.daneRobocze || {};
    const adres = pobierzAdresKorektyLokalizacji(
      daneKorekty,
      poprzedniaWarstwa.adres
    );
    const wspolrzedne = pobierzWspolrzedneKorektyLokalizacji(daneKorekty);
    const czyMaAdres = Boolean(adres.tekstZnormalizowany);

    if (!czyMaAdres && !wspolrzedne) {
      throw new Error("Podaj poprawiony adres albo pełne współrzędne budowy.");
    }

    if (wspolrzedne) {
      const warstwaRobocza = zapiszRoboczaLokalizacjeBudowy(budowa, {
        adres: adres,
        wspolrzedne: wspolrzedne,
        statusJakosci: "potwierdzona",
        zrodlo: "reczny",
        czyKorektaReczna: true
      });

      return {
        status: "zatwierdzono-reczna-lokalizacje",
        czyPotwierdzona: true,
        lokalizacja: warstwaRobocza
      };
    }

    const ocena = aplikacja.lokalizacje.ocenAdresLokalnie(adres);
    const warstwaRobocza = zapiszRoboczaLokalizacjeBudowy(budowa, {
      adres: adres,
      wspolrzedne: null,
      statusJakosci: ocena.statusJakosci,
      zrodlo: "reczny",
      czyKorektaReczna: true
    });

    return {
      status: "zaktualizowano-adres-do-wyszukania",
      czyPotwierdzona: false,
      czyMoznaSzukacAutomatycznie: ocena.czyMoznaSzukacAutomatycznie,
      lokalizacja: warstwaRobocza
    };
  }

'''
text = read(path)
if marker not in text:
    raise SystemExit("Brak znacznika domeny 6F.3")
write(path, text.replace(marker, block + marker, 1))

replace_once(
    path,
    "    przygotujKandydatowDoWyboru: przygotujKandydatowDoWyboru,\n    wyszukajLokalizacjeBudowy: wyszukajLokalizacjeBudowy,",
    "    przygotujKandydatowDoWyboru: przygotujKandydatowDoWyboru,\n    zatwierdzKandydataLokalizacji: zatwierdzKandydataLokalizacji,\n    ustawRecznaLokalizacjeBudowy: ustawRecznaLokalizacjeBudowy,\n    wyszukajLokalizacjeBudowy: wyszukajLokalizacjeBudowy,"
)


# ---------------------------------------------------------------------------
# Interfejs kandydatow: przycisk wyboru i formularz recznej korekty
# ---------------------------------------------------------------------------
path = "js/interfejs/kandydaci_lokalizacji.js"
replace_once(
    path,
    "  let ostatnioAktywnyElement = null;\n  let czyObslugaOknaGotowa = false;",
    "  let ostatnioAktywnyElement = null;\n  let czyObslugaOknaGotowa = false;\n  let aktualnyKontekstWyboru = null;"
)

marker = "  function utworzKarteKandydata(kandydat) {\n"
block = r'''  function zakonczWybor(wynik) {
    const kontekst = aktualnyKontekstWyboru;

    if (kontekst && typeof kontekst.poZatwierdzeniu === "function") {
      kontekst.poZatwierdzeniu(wynik);
    }

    zamknijOkno();
  }

  function utworzPrzyciskWyboru(kandydat) {
    const przycisk = zakresGlobalny.document.createElement("button");
    przycisk.className = "przycisk-drugoplanowy kandydat-lokalizacji__wybierz";
    przycisk.type = "button";
    przycisk.textContent = "Wybierz tę lokalizację";
    przycisk.addEventListener("click", function () {
      if (!aktualnyKontekstWyboru || !aktualnyKontekstWyboru.budowa ||
          !aplikacja.lokalizacje ||
          typeof aplikacja.lokalizacje.zatwierdzKandydataLokalizacji !== "function") {
        return;
      }

      try {
        const wynik = aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
          aktualnyKontekstWyboru.budowa,
          aktualnyKontekstWyboru.kandydaci,
          kandydat.indeksKandydata
        );
        zakonczWybor(wynik);
      } catch (blad) {
        const stan = pobierzElement("stan-recznej-lokalizacji");
        if (stan) {
          stan.textContent = blad && blad.message
            ? blad.message
            : "Nie udało się zatwierdzić lokalizacji.";
        }
      }
    });
    return przycisk;
  }

  function wypelnijFormularzRecznejKorekty(budowa) {
    const poleAdresu = pobierzElement("reczna-lokalizacja-adres");
    const poleSzerokosci = pobierzElement("reczna-lokalizacja-szerokosc");
    const poleDlugosci = pobierzElement("reczna-lokalizacja-dlugosc");
    const stan = pobierzElement("stan-recznej-lokalizacji");
    const model = budowa && budowa.modelLokalizacji || {};
    const warstwa = model.daneRobocze || {};
    const adres = warstwa.adres || {};
    const wspolrzedne = warstwa.wspolrzedne || {};

    if (poleAdresu) {
      poleAdresu.value = String(adres.tekst || "");
    }
    if (poleSzerokosci) {
      poleSzerokosci.value = Number.isFinite(Number(wspolrzedne.szerokoscGeograficzna))
        ? String(wspolrzedne.szerokoscGeograficzna)
        : "";
    }
    if (poleDlugosci) {
      poleDlugosci.value = Number.isFinite(Number(wspolrzedne.dlugoscGeograficzna))
        ? String(wspolrzedne.dlugoscGeograficzna)
        : "";
    }
    if (stan) {
      stan.textContent = "Wybierz wynik powyżej albo popraw adres / współrzędne ręcznie.";
    }
  }

  function obsluzRecznaKorekte(zdarzenie) {
    zdarzenie.preventDefault();

    if (!aktualnyKontekstWyboru || !aktualnyKontekstWyboru.budowa ||
        !aplikacja.lokalizacje ||
        typeof aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy !== "function") {
      return;
    }

    const poleAdresu = pobierzElement("reczna-lokalizacja-adres");
    const poleSzerokosci = pobierzElement("reczna-lokalizacja-szerokosc");
    const poleDlugosci = pobierzElement("reczna-lokalizacja-dlugosc");
    const stan = pobierzElement("stan-recznej-lokalizacji");

    try {
      const wynik = aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(
        aktualnyKontekstWyboru.budowa,
        {
          adres: poleAdresu ? poleAdresu.value : "",
          szerokoscGeograficzna: poleSzerokosci ? poleSzerokosci.value : "",
          dlugoscGeograficzna: poleDlugosci ? poleDlugosci.value : ""
        }
      );

      if (wynik.czyPotwierdzona) {
        zakonczWybor(wynik);
        return;
      }

      if (stan) {
        stan.textContent = wynik.czyMoznaSzukacAutomatycznie
          ? "Poprawiony adres zapisano. Wyszukaj lokalizację ponownie, aby uzyskać współrzędne."
          : "Adres zapisano, ale nadal jest zbyt słaby do automatycznego wyszukania.";
      }

      if (aktualnyKontekstWyboru &&
          typeof aktualnyKontekstWyboru.poZatwierdzeniu === "function") {
        aktualnyKontekstWyboru.poZatwierdzeniu(wynik);
      }
    } catch (blad) {
      if (stan) {
        stan.textContent = blad && blad.message
          ? blad.message
          : "Nie udało się zapisać ręcznej lokalizacji.";
      }
    }
  }

'''
text = read(path)
if marker not in text:
    raise SystemExit("Brak znacznika interfejsu 6F.3")
write(path, text.replace(marker, block + marker, 1))

replace_once(
    path,
    "    karta.appendChild(\n      utworzWierszMetadanych(\"Współrzędne\", kandydat.wspolrzedneTekst)\n    );\n    return karta;",
    "    karta.appendChild(\n      utworzWierszMetadanych(\"Współrzędne\", kandydat.wspolrzedneTekst)\n    );\n    karta.appendChild(utworzPrzyciskWyboru(kandydat));\n    return karta;"
)

replace_once(
    path,
    "    przyciskZamknij.addEventListener(\"click\", zamknijOkno);",
    "    przyciskZamknij.addEventListener(\"click\", zamknijOkno);\n    const formularzReczny = pobierzElement(\"formularz-recznej-lokalizacji\");\n    if (formularzReczny) {\n      formularzReczny.addEventListener(\"submit\", obsluzRecznaKorekte);\n    }"
)

replace_once(
    path,
    "  function pokazKandydatow(kandydaci, opisBudowy) {",
    "  function pokazKandydatow(kandydaci, opisBudowy, opcje) {"
)

replace_once(
    path,
    "    const przygotowani = przygotujListeKandydatow(kandydaci);\n    opis.textContent = przygotowani.length",
    "    const przygotowani = przygotujListeKandydatow(kandydaci);\n    const ustawienia = opcje && typeof opcje === \"object\" ? opcje : {};\n    aktualnyKontekstWyboru = {\n      budowa: ustawienia.budowa || null,\n      kandydaci: przygotowani.map(function (element) { return element.kandydat; }),\n      poZatwierdzeniu: ustawienia.poZatwierdzeniu || null\n    };\n    wypelnijFormularzRecznejKorekty(aktualnyKontekstWyboru.budowa);\n    opis.textContent = przygotowani.length"
)

replace_once(
    path,
    "    ostatnioAktywnyElement = null;\n  }",
    "    ostatnioAktywnyElement = null;\n    aktualnyKontekstWyboru = null;\n  }"
)


# ---------------------------------------------------------------------------
# HTML i CSS formularza recznego
# ---------------------------------------------------------------------------
path = "index.html"
replace_once(
    path,
    '          <div id="lista-kandydatow-lokalizacji" class="lista-kandydatow-lokalizacji"></div>\n        </section>',
    '''          <div id="lista-kandydatow-lokalizacji" class="lista-kandydatow-lokalizacji"></div>\n          <form id="formularz-recznej-lokalizacji" class="korekta-lokalizacji" novalidate>\n            <h3>Ręczna korekta lokalizacji</h3>\n            <label class="pole-formularza" for="reczna-lokalizacja-adres">\n              <span>Poprawiony adres</span>\n              <input id="reczna-lokalizacja-adres" type="text" autocomplete="street-address">\n            </label>\n            <div class="korekta-lokalizacji__wspolrzedne">\n              <label class="pole-formularza" for="reczna-lokalizacja-szerokosc">\n                <span>Szerokość</span>\n                <input id="reczna-lokalizacja-szerokosc" type="number" min="-90" max="90" step="any" inputmode="decimal">\n              </label>\n              <label class="pole-formularza" for="reczna-lokalizacja-dlugosc">\n                <span>Długość</span>\n                <input id="reczna-lokalizacja-dlugosc" type="number" min="-180" max="180" step="any" inputmode="decimal">\n              </label>\n            </div>\n            <button class="przycisk-drugoplanowy" type="submit">Zapisz ręczną lokalizację</button>\n            <p id="stan-recznej-lokalizacji" class="pamiec-tras__stan" aria-live="polite"></p>\n          </form>\n        </section>'''
)
replace_once(path, "?v=6f2-kandydaci-20260902a", "?v=6f3-wybor-20260902a")
replace_once(path, "?v=6f2-kandydaci-20260902a", "?v=6f3-wybor-20260902a")
replace_once(path, "?v=6f2-kandydaci-20260902a", "?v=6f3-wybor-20260902a")

path = "style/glowny.css"
append_once(path, "/* 6F.3 — ręczne wskazanie lokalizacji */", r'''
/* 6F.3 — ręczne wskazanie lokalizacji */
.kandydat-lokalizacji__wybierz {
  margin-top: 0.75rem;
  width: 100%;
}

.korekta-lokalizacji {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--kolor-obramowania, #d8e0e7);
  display: grid;
  gap: 0.75rem;
}

.korekta-lokalizacji h3 {
  margin: 0;
}

.korekta-lokalizacji__wspolrzedne {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (max-width: 700px) {
  .korekta-lokalizacji__wspolrzedne {
    grid-template-columns: 1fr;
  }
}
''')


# ---------------------------------------------------------------------------
# Nowy test 6F.3
# ---------------------------------------------------------------------------
Path("testy/etap_6f_3.test.js").write_text(r'''"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const katalogProjektu = path.resolve(__dirname, "..");

function wczytaj(sciezka) {
  return fs.readFileSync(path.join(katalogProjektu, sciezka), "utf8");
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

function utworzBudowe(id) {
  return {
    idBudowy: id,
    firma: "Firma Testowa",
    budowa: "Obiekt " + id,
    zrodlo: "csv",
    adresZrodlowy: {
      tekst: "ul. Źródłowa 12, Miasto Testowe",
      czesci: {
        ulica: "Źródłowa",
        numerBudynku: "12",
        miejscowosc: "Miasto Testowe"
      }
    }
  };
}

function kandydat(numer) {
  return {
    indeksKandydata: numer - 1,
    adres: { tekst: "ul. Kandydacka " + numer + ", Miasto Testowe" },
    wspolrzedne: {
      szerokoscGeograficzna: 50 + numer / 100,
      dlugoscGeograficzna: 16 + numer / 100
    },
    statusJakosci: "nieoceniona",
    zrodlo: "mapa",
    pewnosc: 0.9 - numer / 10,
    poziomPewnosci: "wysoka",
    typWyniku: "address"
  };
}

function sprawdzJawnyWyborKandydata() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-631");
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  const adresZrodlowyPrzed = JSON.stringify(
    budowa.modelLokalizacji.daneZrodlowe.adres
  );
  const kandydaci = [kandydat(1), kandydat(2)];

  const wynik = aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
    budowa,
    kandydaci,
    1
  );

  assert.equal(wynik.status, "zatwierdzono-kandydata");
  assert.equal(wynik.wybranyIndeksKandydata, 1);
  assert.equal(wynik.czyPotwierdzona, true);
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "mapa");
  assert.equal(budowa.modelLokalizacji.daneRobocze.czyKorektaReczna, true);
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Kandydacka 2, Miasto Testowe"
  );
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.wspolrzedne.szerokoscGeograficzna,
    50.02
  );
  assert.equal(
    JSON.stringify(budowa.modelLokalizacji.daneZrodlowe.adres),
    adresZrodlowyPrzed
  );

  assert.throws(function () {
    aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(budowa, kandydaci, 9);
  }, /istniejący wynik/);
}

async function sprawdzPotwierdzonaLokalizacjaNieWywolujeInternetu() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-632");
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
    budowa,
    [kandydat(1)],
    0
  );
  let liczbaWywolan = 0;

  const wynik = await aplikacja.lokalizacje.wyszukajLokalizacjeBudowy(
    budowa,
    {
      geokoduj: function () {
        liczbaWywolan += 1;
        return { status: "ok", kandydaci: [kandydat(2)] };
      }
    }
  );

  assert.equal(wynik.status, "uzyto-biezacej-lokalizacji");
  assert.equal(wynik.czyWymagaPotwierdzenia, false);
  assert.equal(liczbaWywolan, 0);
}

function sprawdzReczneWspolrzedne() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-633");

  const wynik = aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(
    budowa,
    {
      adres: "ul. Ręczna 7, Miasto Testowe",
      szerokoscGeograficzna: "50.1234",
      dlugoscGeograficzna: "16.5678"
    }
  );

  assert.equal(wynik.status, "zatwierdzono-reczna-lokalizacje");
  assert.equal(wynik.czyPotwierdzona, true);
  assert.equal(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "reczny");
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne.dlugoscGeograficzna, 16.5678);

  assert.throws(function () {
    aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(budowa, {
      adres: "ul. Ręczna 7, Miasto Testowe",
      szerokoscGeograficzna: "50.1",
      dlugoscGeograficzna: ""
    });
  }, /jednocześnie szerokości i długości/);
}

function sprawdzKorekteSamegoAdresu() {
  const aplikacja = uruchomLokalizacje();
  const budowa = utworzBudowe("B-634");
  aplikacja.lokalizacje.migrujBudoweDoKontraktuTras(budowa);
  aplikacja.lokalizacje.zatwierdzKandydataLokalizacji(
    budowa,
    [kandydat(1)],
    0
  );

  const wynik = aplikacja.lokalizacje.ustawRecznaLokalizacjeBudowy(
    budowa,
    { adres: "ul. Poprawiona 19, Miasto Testowe" }
  );

  assert.equal(wynik.status, "zaktualizowano-adres-do-wyszukania");
  assert.equal(wynik.czyPotwierdzona, false);
  assert.equal(wynik.czyMoznaSzukacAutomatycznie, true);
  assert.equal(budowa.modelLokalizacji.daneRobocze.wspolrzedne, null);
  assert.notEqual(budowa.modelLokalizacji.daneRobocze.statusJakosci, "potwierdzona");
  assert.equal(budowa.modelLokalizacji.daneRobocze.zrodlo, "reczny");
  assert.equal(
    budowa.modelLokalizacji.daneRobocze.adres.tekst,
    "ul. Poprawiona 19, Miasto Testowe"
  );
}

function sprawdzInterfejs() {
  const index = wczytaj("index.html");
  const skrypt = wczytaj("js/interfejs/kandydaci_lokalizacji.js");

  assert.match(index, /id="formularz-recznej-lokalizacji"/);
  assert.match(index, /id="reczna-lokalizacja-adres"/);
  assert.match(index, /id="reczna-lokalizacja-szerokosc"/);
  assert.match(index, /id="reczna-lokalizacja-dlugosc"/);
  assert.match(skrypt, /Wybierz tę lokalizację/);
  assert.match(skrypt, /zatwierdzKandydataLokalizacji/);
  assert.match(skrypt, /ustawRecznaLokalizacjeBudowy/);
  assert.match(skrypt, /Poprawiony adres zapisano/);
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");

  assert.match(etapy, /- \[x\] \*\*6F —/);
  assert.match(etapy, /- \[x\] \*\*6F\.3 — ręczne wskazanie:/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6G\.1/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6F\.3/);
  assert.match(stan, /113\/113 zestawów testów/);
  assert.match(stan, /Rozpocząć \*\*6G\.1/);
  assert.match(decyzje, /## 135\. Lokalizacja robocza wymaga jawnego zatwierdzenia operatora/);
  assert.match(kontrakt, /## Zatwierdzenie lokalizacji — 6F\.3/);
  assert.match(plan, /### 6F\.3 — ręczne wskazanie/);
}

(async function () {
  sprawdzJawnyWyborKandydata();
  await sprawdzPotwierdzonaLokalizacjaNieWywolujeInternetu();
  sprawdzReczneWspolrzedne();
  sprawdzKorekteSamegoAdresu();
  sprawdzInterfejs();
  sprawdzDokumentacje();
  console.log(
    "OK — 6F.3 pozwala jawnie zatwierdzić kandydata lub ręczną lokalizację i zamyka punkt 6F."
  );
})().catch(function (blad) {
  console.error(blad);
  process.exitCode = 1;
});
''', encoding="utf-8")


# ---------------------------------------------------------------------------
# Test 6F.2 ma pozostac historycznym testem funkcji, nie przyszlego statusu
# ---------------------------------------------------------------------------
path = "testy/etap_6f_2.test.js"
for fragment in [
    '  assert.match(etapy, /- \\[ \\] \\*\\*6F —/);\n',
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.3/);\n',
    '  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6F\\.2/);\n',
    '  assert.match(stan, /112\\/112 zestawów testów/);\n',
    '  assert.match(stan, /Rozpocząć \\*\\*6F\\.3 — ręczne wskazanie/);\n'
]:
    text = read(path)
    if fragment in text:
        write(path, text.replace(fragment, "", 1))


# ---------------------------------------------------------------------------
# Plan testow automatycznych Etapu 6
# ---------------------------------------------------------------------------
path = "testy/etap_6_plan.test.js"
replace_once(
    path,
    '    const stanPunktu = ["A", "B", "C", "D", "E"].includes(litera) ? "x" : " ";',
    '    const stanPunktu = ["A", "B", "C", "D", "E", "F"].includes(litera) ? "x" : " ";'
)
replace_once(
    path,
    '      const stan = ["A", "B", "C", "D", "E"].includes(litera) ||\n        (litera === "F" && [1, 2].includes(numer))\n        ? "x"\n        : " ";',
    '      const stan = ["A", "B", "C", "D", "E", "F"].includes(litera)\n        ? "x"\n        : " ";'
)
replace_once(path, 'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6F\\.3/);', 'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6G\\.1/);')
replace_once(
    path,
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6E zakończone; 6F\\.1–6F\\.2 zakończone; następny podetap 6F\\.3\\*\\*/',
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6F zakończone; następny podetap 6G\\.1\\*\\*/'
)
replace_once(path, 'assert.match(stan, /Rozpocząć \\*\\*6F\\.3/);', 'assert.match(stan, /Rozpocząć \\*\\*6G\\.1/);')
replace_once(
    path,
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6E i 6F.1–6F.2 oraz następny krok 6F.3."',
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6F oraz następny krok 6G.1."'
)


# ---------------------------------------------------------------------------
# Dokumentacja statusu
# ---------------------------------------------------------------------------
path = "STAN_PROJEKTU.md"
replace_once(path, "- Ostatni zakończony podetap: **6F.2 — wiele wyników**.", "- Ostatni zakończony podetap: **6F.3 — ręczne wskazanie**.")
replace_once(path, "- **Etap 6** jest rozpoczęty. Punkty **6A–6E** oraz **6F.1–6F.2** są zakończone; cały Etap 6 pozostaje otwarty.", "- **Etap 6** jest rozpoczęty. Punkty **6A–6F** są zakończone; cały Etap 6 pozostaje otwarty.")
replace_once(path, "- Pełna regresja po 6F.2 przechodzi **112/112 zestawów testów**.", "- Pełna regresja po 6F.3 przechodzi **113/113 zestawów testów**.")
replace_once(
    path,
    "- Gotowe okno kandydatów pokazuje adres, pewność, typ i współrzędne, ale 6F.2 nie stosuje jeszcze żadnego wyniku do warstwy roboczej.",
    "- Okno kandydatów pozwala świadomie wybrać konkretny wynik albo ręcznie poprawić adres i współrzędne. Wybrany kandydat staje się `potwierdzona` lokalizacją roboczą dopiero po kliknięciu operatora.\n- Ręczne współrzędne tworzą potwierdzoną lokalizację ze źródłem `reczny`; sama korekta adresu bez współrzędnych usuwa stare współrzędne i wymaga ponownego geokodowania zamiast udawać potwierdzony punkt."
)
regex_once(
    path,
    r"## Następny krok\n\nRozpocząć \*\*6F\.3 — ręczne wskazanie\*\*[\s\S]*?\n\n## Ważna zasada wznowienia",
    "## Następny krok\n\nRozpocząć **6G.1 — routing węzeł → budowa**. Wyznaczać kierunkową trasę dopiero dla budowy z potwierdzoną lokalizacją roboczą oraz aktywnego węzła z kompletnymi współrzędnymi, bez zmiany ręcznych i zapamiętanych czasów.\n\n## Ważna zasada wznowienia"
)

path = "ETAPY_ROZWOJU.md"
replace_once(
    path,
    "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6E zakończone; 6F.1–6F.2 zakończone; następny podetap 6F.3**",
    "- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6F zakończone; następny podetap 6G.1**"
)
regex_once(path, r"- \[ \] \*\*6F —", "- [x] **6F —")
regex_once(path, r"- \[ \] \*\*6F\.3 — ręczne wskazanie:", "- [x] **6F.3 — ręczne wskazanie:")
regex_once(path, r"Następny niezakończony podetap: \*\*6F\.3[^\n]*", "Następny niezakończony podetap: **6G.1 — routing węzeł → budowa**")
append_once(path, "## Wynik 6F.3 — ręczne wskazanie", r'''
## Wynik 6F.3 — ręczne wskazanie

- [x] operator może jawnie wybrać konkretny kandydat geokodowania; indeks jest
  walidowany i żaden wynik nie jest stosowany przez sam poziom pewności;
- [x] wybrany kandydat zapisuje adres i współrzędne do `daneRobocze` ze statusem
  `potwierdzona`, zachowując źródło `mapa` i jawny znacznik decyzji ręcznej;
- [x] operator może zamiast kandydata wpisać pełne współrzędne ręcznie; wtedy
  źródłem roboczym jest `reczny`;
- [x] poprawa samego adresu nie tworzy fikcyjnie potwierdzonego punktu: stare
  współrzędne są czyszczone, adres jest ponownie oceniany i może zostać
  ponownie wyszukany;
- [x] dane źródłowe importu pozostają nienadpisane, a potwierdzona lokalizacja
  jest ponownie używana bez kolejnego geokodowania;
- [x] okno kandydatów ma przyciski wyboru i formularz ręcznej korekty z
  czytelnymi komunikatami;
- [x] test `testy/etap_6f_3.test.js` oraz pełna regresja przechodzą **113/113
  zestawów testów**.

Podetap **6F.3** i cały punkt **6F — geokodowanie budów** są zakończone.
Następny niezakończony podetap: **6G.1 — routing węzeł → budowa**.
''')

path = "PROJECT_DECISIONS.md"
append_once(path, "## 135. Lokalizacja robocza wymaga jawnego zatwierdzenia operatora", r'''
## 135. Lokalizacja robocza wymaga jawnego zatwierdzenia operatora

- Kandydat geokodowania nie może stać się roboczą lokalizacją tylko dlatego,
  że jest pierwszy albo ma najwyższy poziom pewności.
- Dopiero jawny wybór operatora przenosi adres i współrzędne kandydata do
  `daneRobocze` ze statusem `potwierdzona`.
- Przy wyborze wyniku dostawcy źródłem danych pozostaje `mapa`, natomiast
  `czyKorektaReczna = true` zapisuje fakt świadomej decyzji operatora.
- Pełne współrzędne wpisane ręcznie tworzą potwierdzoną lokalizację ze źródłem
  `reczny`.
- Ręczna zmiana samego adresu bez współrzędnych nie jest potwierdzonym punktem:
  usuwa nieaktualne współrzędne, zapisuje korektę roboczą i wymaga ponownego
  wyszukania albo ręcznego podania współrzędnych.
- Warstwa `daneZrodlowe` pozostaje niezmieniona, aby zawsze było wiadomo, co
  pochodziło z KDX/CSV.
''')

path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
append_once(path, "## Zatwierdzenie lokalizacji — 6F.3", r'''
## Zatwierdzenie lokalizacji — 6F.3

Zatwierdzona lokalizacja budowy istnieje wyłącznie po jawnej decyzji operatora.

### Wybór kandydata

`zatwierdzKandydataLokalizacji(budowa, kandydaci, indeksKandydata)`:

- odrzuca nieistniejący indeks i wynik bez poprawnej pary współrzędnych;
- nie zmienia `daneZrodlowe` ani listy kandydatów;
- zapisuje adres i współrzędne wybranego wyniku do `daneRobocze`;
- ustawia `statusJakosci = "potwierdzona"`;
- zachowuje `zrodlo = "mapa"` (lub `pamiec` dla kandydata z pamięci) i zapisuje
  `czyKorektaReczna = true` jako dowód świadomego wyboru operatora.

### Ręczna korekta

`ustawRecznaLokalizacjeBudowy(budowa, daneKorekty)` ma dwa tryby:

1. pełna para współrzędnych — tworzy `potwierdzona` lokalizację roboczą ze
   źródłem `reczny`;
2. sam poprawiony adres — czyści poprzednie współrzędne, ponownie ocenia jakość
   adresu i pozostawia go do ponownego geokodowania. Taki adres nie otrzymuje
   statusu `potwierdzona`.

Częściowa para współrzędnych jest błędem. Routing nie powinien korzystać z
niepotwierdzonego kandydata geokodowania.
''')

path = "testy/TESTY_ETAP_6.md"
replace_once(
    path,
    "i **6B.1–6B.3** oraz całe punkty **6A–6E** są zakończone. Podetap **6F.1**\njest zakończony. Następny podetap to **6F.2 — wiele wyników**.",
    "i **6B.1–6B.3** oraz całe punkty **6A–6F** są zakończone. Następny podetap\nto **6G.1 — routing węzeł → budowa**."
) if "Następny podetap to **6F.2 — wiele wyników**." in read(path) else None
# Aktualny naglowek po 6F.2.
text = read(path)
text = re.sub(
    r"Plan punktów \*\*6A–6J\*\* został przygotowany 2026-09-02\.[\s\S]*?\n\n## Zasada nadrzędna",
    "Plan punktów **6A–6J** został przygotowany 2026-09-02. Podetapy **6A.1–6A.3**\ni **6B.1–6B.3** oraz całe punkty **6A–6F** są zakończone. Następny podetap to\n**6G.1 — routing węzeł → budowa**.\n\n## Zasada nadrzędna",
    text,
    count=1
)
write(path, text)
append_once(path, "### 6F.3 — ręczne wskazanie", r'''
### 6F.3 — ręczne wskazanie

- wybór konkretnego kandydata ustawia roboczą lokalizację jako `potwierdzona`;
- wybrany indeks musi istnieć, a kandydat musi mieć pełne współrzędne;
- poziom pewności nie może sam wybrać wyniku;
- ręcznie wpisana pełna para współrzędnych tworzy potwierdzony punkt ze źródłem
  `reczny`;
- poprawa samego adresu usuwa stare współrzędne i wymaga ponownego wyszukania;
- dane źródłowe z importu pozostają niezmienione;
- potwierdzona lokalizacja jest ponownie używana bez wywołania geokodera;
- interfejs pokazuje przycisk wyboru oraz formularz ręcznej korekty.
''')

path = "README.md"
append_once(path, "### Zatwierdzanie lokalizacji 6F.3", r'''
### Zatwierdzanie lokalizacji 6F.3

Wynik geokodowania jest tylko podpowiedzią. Operator może jawnie wybrać
konkretną lokalizację albo podać własny adres i współrzędne. Dopiero wybór
kandydata lub pełna ręczna para współrzędnych ustawia roboczą lokalizację jako
`potwierdzona`. Sama poprawa adresu usuwa stare współrzędne i przygotowuje
budowę do ponownego wyszukania.
''')

print("Pakiet 6F.3 przygotowany.")
