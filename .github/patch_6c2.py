from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"Nie znaleziono fragmentu: {label}")
    return text.replace(old, new, 1)


# 1. Osobna, bezpieczna pamięć aktywnego węzła.
pamiec_wezla = r'''(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI = "harmonogramBetonowan.aktywnyWezel.v1";
  const WERSJA_FORMATU = 1;
  let pamiecLokalna = null;
  let trybPamieci = "biezaca-sesja";
  let zapisBiezacejSesji = null;
  let czyUruchomiono = false;

  function skopiujDane(dane) {
    return dane === null || dane === undefined
      ? dane
      : JSON.parse(JSON.stringify(dane));
  }

  function rozpoznajPamiecLokalna() {
    const kluczTestowy = KLUCZ_PAMIECI + ".test";

    try {
      const magazyn = zakresGlobalny.localStorage;

      if (!magazyn) {
        return null;
      }

      magazyn.setItem(kluczTestowy, "1");
      magazyn.removeItem(kluczTestowy);
      return magazyn;
    } catch (bladPamieci) {
      return null;
    }
  }

  function zapewnijUruchomienie() {
    if (!czyUruchomiono) {
      pamiecLokalna = rozpoznajPamiecLokalna();
      trybPamieci = pamiecLokalna ? "trwala" : "biezaca-sesja";
      czyUruchomiono = true;
    }
  }

  function uruchomPamiecWezla() {
    zapewnijUruchomienie();
    return pobierzStanPamieci();
  }

  function pobierzTekstPamieci() {
    zapewnijUruchomienie();

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        return pamiecLokalna.getItem(KLUCZ_PAMIECI);
      } catch (bladOdczytu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return zapisBiezacejSesji;
  }

  function usunUszkodzonyZapis() {
    zapisBiezacejSesji = null;

    if (!pamiecLokalna) {
      return;
    }

    try {
      pamiecLokalna.removeItem(KLUCZ_PAMIECI);
    } catch (bladUsuwania) {
      // Uszkodzony zapis węzła nie może zatrzymać harmonogramu.
    }
  }

  function utworzWynik(status, szczegoly) {
    return Object.assign({
      status: status,
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU
    }, szczegoly || {});
  }

  function odczytajWezel() {
    const tekstPamieci = pobierzTekstPamieci();

    if (!tekstPamieci) {
      return utworzWynik("brak-zapisu", { wezel: null });
    }

    let zapis;

    try {
      zapis = JSON.parse(tekstPamieci);
    } catch (bladFormatu) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", { wezel: null });
    }

    if (!zapis || typeof zapis !== "object" || Array.isArray(zapis)) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", { wezel: null });
    }

    if (zapis.wersja !== WERSJA_FORMATU) {
      return utworzWynik("niezgodna-wersja", {
        wezel: null,
        wersjaZapisu: zapis.wersja
      });
    }

    try {
      const wezel = aplikacja.lokalizacje.utworzModelWezla(zapis.wezel);
      return utworzWynik("odczytano", {
        wezel: skopiujDane(wezel),
        zapisano: zapis.zapisano || null
      });
    } catch (bladWalidacji) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", {
        wezel: null,
        komunikat: bladWalidacji.message
      });
    }
  }

  function zapiszTekstPamieci(tekstPamieci) {
    zapisBiezacejSesji = tekstPamieci;

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        pamiecLokalna.setItem(KLUCZ_PAMIECI, tekstPamieci);
        return "zapisano-trwale";
      } catch (bladZapisu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return "zapisano-w-sesji";
  }

  function zapiszWezel(daneWezla) {
    zapewnijUruchomienie();

    let wezel;

    try {
      wezel = aplikacja.lokalizacje.utworzModelWezla(daneWezla);
    } catch (bladWalidacji) {
      return utworzWynik("blad-zapisu", {
        wezel: null,
        komunikat: bladWalidacji.message
      });
    }

    const zapis = {
      wersja: WERSJA_FORMATU,
      wezel: wezel,
      zapisano: new Date().toISOString()
    };
    const status = zapiszTekstPamieci(JSON.stringify(zapis));

    return utworzWynik(status, {
      wezel: skopiujDane(wezel),
      zapisano: zapis.zapisano
    });
  }

  function pobierzStanPamieci() {
    const tekstPamieci = pobierzTekstPamieci();

    return utworzWynik("gotowa", {
      kluczPamieci: KLUCZ_PAMIECI,
      czyMaZapis: Boolean(tekstPamieci)
    });
  }

  aplikacja.pamiecWezla = {
    uruchomPamiecWezla: uruchomPamiecWezla,
    pobierzStanPamieci: pobierzStanPamieci,
    odczytajWezel: odczytajWezel,
    zapiszWezel: zapiszWezel
  };
})(window);
'''
write("js/pamiec/pamiec_wezla.js", pamiec_wezla)


# 2. Aktywny węzeł może zostać odtworzony i świadomie skorygowany.
path = "js/lokalizacje/lokalizacje.js"
text = read(path)
text = replace_once(
    text,
    '  let aktywnyWezel = null;\n',
    '  let aktywnyWezel = null;\n  let czyProbowanoOdtworzycWezel = false;\n',
    "flaga odtworzenia węzła",
)
old = '''  function utworzPoczatkowyModelWezla() {\n    return aplikacja.lokalizacje.utworzModelWezla({\n      idWezla: ID_WEZLA_STARTOWEGO,\n      nazwa: NAZWA_WEZLA_STARTOWEGO\n    });\n  }\n\n  function pobierzAktywnyWezel() {\n    if (!aktywnyWezel) {\n      aktywnyWezel = utworzPoczatkowyModelWezla();\n    }\n\n    return aktywnyWezel;\n  }\n\n  function pobierzIdAktywnegoWezla() {\n    return pobierzAktywnyWezel().idWezla;\n  }\n\n'''
new = r'''  function utworzPoczatkowyModelWezla() {
    return aplikacja.lokalizacje.utworzModelWezla({
      idWezla: ID_WEZLA_STARTOWEGO,
      nazwa: NAZWA_WEZLA_STARTOWEGO
    });
  }

  function sprobujOdtworzycAktywnyWezel() {
    if (czyProbowanoOdtworzycWezel) {
      return null;
    }

    czyProbowanoOdtworzycWezel = true;

    if (!aplikacja.pamiecWezla ||
        typeof aplikacja.pamiecWezla.odczytajWezel !== "function") {
      return null;
    }

    const wynik = aplikacja.pamiecWezla.odczytajWezel();

    if (wynik && wynik.wezel) {
      aktywnyWezel = aplikacja.lokalizacje.utworzModelWezla(wynik.wezel);
    }

    return wynik;
  }

  function pobierzAktywnyWezel() {
    if (!aktywnyWezel) {
      sprobujOdtworzycAktywnyWezel();
    }

    if (!aktywnyWezel) {
      aktywnyWezel = utworzPoczatkowyModelWezla();
    }

    return aktywnyWezel;
  }

  function pobierzIdAktywnegoWezla() {
    return pobierzAktywnyWezel().idWezla;
  }

  function pobierzTekstDanychWezla(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return "";
    }

    return String(wartosc).trim();
  }

  function przygotujWspolrzedneWezla(daneWezla) {
    const szerokosc = pobierzTekstDanychWezla(
      daneWezla && daneWezla.szerokoscGeograficzna
    );
    const dlugosc = pobierzTekstDanychWezla(
      daneWezla && daneWezla.dlugoscGeograficzna
    );
    const czyMaSzerokosc = szerokosc !== "";
    const czyMaDlugosc = dlugosc !== "";

    if (czyMaSzerokosc !== czyMaDlugosc) {
      throw new Error(
        "Współrzędne węzła wymagają jednocześnie szerokości i długości geograficznej."
      );
    }

    if (!czyMaSzerokosc) {
      return null;
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function ustawAktywnyWezel(daneWezla) {
    const dane = daneWezla && typeof daneWezla === "object"
      ? daneWezla
      : {};
    const poprzedniWezel = pobierzAktywnyWezel();
    const nazwa = pobierzTekstDanychWezla(dane.nazwa);
    const adresTekst = pobierzTekstDanychWezla(dane.adres);
    const wspolrzedne = przygotujWspolrzedneWezla(dane);

    if (!nazwa) {
      throw new Error("Nazwa betoniarni nie może być pusta.");
    }

    if (!adresTekst && !wspolrzedne) {
      throw new Error(
        "Podaj adres betoniarni albo pełną parę współrzędnych."
      );
    }

    const adresRoboczy = aplikacja.lokalizacje.utworzAdresRoboczy({
      tekst: adresTekst || null
    });
    const ocenaAdresu = aplikacja.lokalizacje.ocenAdresLokalnie(adresRoboczy);
    const statusRoboczy = wspolrzedne
      ? "potwierdzona"
      : ocenaAdresu.statusJakosci;
    const warstwaZrodlowa = {
      adres: { tekst: adresTekst || null },
      wspolrzedne: wspolrzedne,
      statusJakosci: "nieoceniona",
      zrodlo: "reczny",
      czyKorektaReczna: false
    };
    const warstwaRobocza = {
      adres: adresRoboczy,
      wspolrzedne: wspolrzedne,
      statusJakosci: statusRoboczy,
      zrodlo: "reczny",
      czyKorektaReczna: true
    };

    aktywnyWezel = aplikacja.lokalizacje.utworzModelWezla({
      idWezla: poprzedniWezel.idWezla,
      nazwa: nazwa,
      modelLokalizacji: {
        daneZrodlowe: warstwaZrodlowa,
        daneAutomatyczne:
          poprzedniWezel.modelLokalizacji.daneAutomatyczne || {},
        daneRobocze: warstwaRobocza
      }
    });
    czyProbowanoOdtworzycWezel = true;

    const wynikZapisu = aplikacja.pamiecWezla &&
      typeof aplikacja.pamiecWezla.zapiszWezel === "function"
      ? aplikacja.pamiecWezla.zapiszWezel(aktywnyWezel)
      : { status: "brak-modulu-pamieci", trybPamieci: "biezaca-sesja" };

    if (wynikZapisu.status === "blad-zapisu") {
      throw new Error(
        wynikZapisu.komunikat || "Nie udało się zapisać danych betoniarni."
      );
    }

    return {
      wezel: aktywnyWezel,
      statusZapisu: wynikZapisu.status,
      trybPamieci: wynikZapisu.trybPamieci
    };
  }

'''
text = replace_once(text, old, new, "ustawianie aktywnego węzła")
text = replace_once(
    text,
    '    pobierzAktywnyWezel: pobierzAktywnyWezel,\n',
    '    pobierzAktywnyWezel: pobierzAktywnyWezel,\n    ustawAktywnyWezel: ustawAktywnyWezel,\n',
    "eksport ustawAktywnyWezel",
)
write(path, text)


# 3. Kompaktowy formularz ustawień betoniarni.
path = "index.html"
text = read(path)
marker = '''          <div class="panel__naglowek">\n'''
formularz = r'''          <details class="budowa-reczna ustawienia-wezla">
            <summary>Betoniarnia / węzeł</summary>
            <form id="formularz-wezla" class="formularz-budowy-recznej" novalidate>
              <label class="pole-formularza" for="wezel-nazwa">
                <span>Nazwa betoniarni</span>
                <input id="wezel-nazwa" name="nazwa" type="text" autocomplete="organization" required>
              </label>

              <label class="pole-formularza" for="wezel-adres">
                <span>Adres</span>
                <input id="wezel-adres" name="adres" type="text" autocomplete="street-address">
              </label>

              <label class="pole-formularza" for="wezel-szerokosc">
                <span>Szerokość geograficzna</span>
                <input id="wezel-szerokosc" name="szerokoscGeograficzna" type="number" min="-90" max="90" step="any" inputmode="decimal">
              </label>

              <label class="pole-formularza" for="wezel-dlugosc">
                <span>Długość geograficzna</span>
                <input id="wezel-dlugosc" name="dlugoscGeograficzna" type="number" min="-180" max="180" step="any" inputmode="decimal">
              </label>

              <button class="przycisk-drugoplanowy przycisk-dodaj-budowe" type="submit">
                Zapisz betoniarnię
              </button>
              <p id="stan-wezla" class="pamiec-tras__stan" aria-live="polite">
                Ustaw nazwę oraz adres lub pełne współrzędne betoniarni.
              </p>
            </form>
          </details>

'''
text = replace_once(text, marker, formularz + marker, "formularz betoniarni")
text = replace_once(
    text,
    '    <script defer src="js/lokalizacje/model_lokalizacji_i_trasy.js?v=6a2-model-20260902a"></script>\n',
    '    <script defer src="js/lokalizacje/model_lokalizacji_i_trasy.js?v=6a2-model-20260902a"></script>\n'
    '    <script defer src="js/pamiec/pamiec_wezla.js?v=6c2-wezel-20260902a"></script>\n',
    "ładowanie pamięci węzła",
)
write(path, text)


# 4. Interfejs potrafi pokazać, odczytać i zapisać formularz węzła.
path = "js/interfejs/interfejs.js"
text = read(path)
text = replace_once(
    text,
    '      formularzBudowyRecznej: pobierzWymaganyElement("formularz-budowy-recznej"),\n',
    '      formularzWezla: document.getElementById("formularz-wezla"),\n'
    '      wezelNazwa: document.getElementById("wezel-nazwa"),\n'
    '      wezelAdres: document.getElementById("wezel-adres"),\n'
    '      wezelSzerokosc: document.getElementById("wezel-szerokosc"),\n'
    '      wezelDlugosc: document.getElementById("wezel-dlugosc"),\n'
    '      stanWezla: document.getElementById("stan-wezla"),\n'
    '      formularzBudowyRecznej: pobierzWymaganyElement("formularz-budowy-recznej"),\n',
    "elementy formularza węzła",
)
marker = '''  function pobierzDaneBudowyRecznej() {\n'''
insert = r'''  function pobierzDaneWezlaZFormularza() {
    return {
      nazwa: elementy.wezelNazwa ? elementy.wezelNazwa.value : "",
      adres: elementy.wezelAdres ? elementy.wezelAdres.value : "",
      szerokoscGeograficzna: elementy.wezelSzerokosc
        ? elementy.wezelSzerokosc.value
        : "",
      dlugoscGeograficzna: elementy.wezelDlugosc
        ? elementy.wezelDlugosc.value
        : ""
    };
  }

  function pokazAktywnyWezel(wezel, stanPamieci) {
    if (!wezel || !elementy.formularzWezla) {
      return;
    }

    const modelLokalizacji = wezel.modelLokalizacji || {};
    const daneRobocze = modelLokalizacji.daneRobocze || {};
    const adres = daneRobocze.adres || {};
    const wspolrzedne = daneRobocze.wspolrzedne || {};
    const stan = stanPamieci || {};

    elementy.wezelNazwa.value = wezel.nazwa || "";
    elementy.wezelAdres.value = adres.tekst || "";
    elementy.wezelSzerokosc.value =
      wspolrzedne.szerokoscGeograficzna === null ||
      wspolrzedne.szerokoscGeograficzna === undefined
        ? ""
        : String(wspolrzedne.szerokoscGeograficzna);
    elementy.wezelDlugosc.value =
      wspolrzedne.dlugoscGeograficzna === null ||
      wspolrzedne.dlugoscGeograficzna === undefined
        ? ""
        : String(wspolrzedne.dlugoscGeograficzna);

    if (elementy.stanWezla) {
      const opisPamieci = stan.trybPamieci === "trwala"
        ? "Zapis trwały w tej przeglądarce."
        : "Dane węzła są dostępne tylko w bieżącej sesji.";
      const statusAdresu = daneRobocze.statusJakosci || "brak";
      elementy.stanWezla.textContent =
        "ID: " + wezel.idWezla + " · status: " + statusAdresu + ". " + opisPamieci;
    }
  }

  function pokazBladWezla(blad) {
    const trescBledu = blad instanceof Error
      ? blad.message
      : "Nie udało się zapisać danych betoniarni.";

    if (elementy.stanWezla) {
      elementy.stanWezla.textContent = trescBledu;
    }

    ustawStatus("blad", "Nie można zapisać betoniarni", trescBledu);
  }

  function podlaczUstawieniaWezla(obslugaZapisuWezla) {
    if (!elementy.formularzWezla) {
      return;
    }

    elementy.formularzWezla.addEventListener("submit", function (zdarzenie) {
      zdarzenie.preventDefault();
      obslugaZapisuWezla(pobierzDaneWezlaZFormularza());
    });
  }

'''
if marker not in text:
    raise SystemExit("Nie znaleziono miejsca na funkcje formularza węzła.")
text = text.replace(marker, insert + marker, 1)
text = replace_once(
    text,
    '    pokazBladPompy: pokazBladPompy,\n',
    '    pokazBladPompy: pokazBladPompy,\n'
    '    pokazBladWezla: pokazBladWezla,\n'
    '    pokazAktywnyWezel: pokazAktywnyWezel,\n'
    '    podlaczUstawieniaWezla: podlaczUstawieniaWezla,\n',
    "eksport interfejsu węzła",
)
write(path, text)


# 5. Aplikacja uruchamia pamięć węzła i obsługuje świadomy zapis operatora.
path = "js/aplikacja.js"
text = read(path)
marker = '''  function uruchomIOdtworzPamiecPlanu() {\n'''
insert = r'''  function obsluzZmianeWezla(daneWezla) {
    try {
      const wynik = aplikacja.lokalizacje.ustawAktywnyWezel(daneWezla);
      aplikacja.interfejs.pokazAktywnyWezel(wynik.wezel, {
        trybPamieci: wynik.trybPamieci
      });

      if (pobierzAktualnaListeBudow().length > 0) {
        oznaczPlanJakoNieprzeliczony(true);
      }

      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zmiana-aktywnego-wezla",
        "Zapisano dane aktywnego węzła.",
        {
          idWezla: wynik.wezel.idWezla,
          statusZapisu: wynik.statusZapisu
        }
      );
      return wynik.wezel;
    } catch (blad) {
      aplikacja.interfejs.pokazBladWezla(blad);
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-aktywnego-wezla",
        "Nie udało się zapisać danych aktywnego węzła."
      );
      return null;
    }
  }

  function uruchomIOdtworzPamiecWezla() {
    if (!aplikacja.pamiecWezla) {
      return null;
    }

    const stanPamieci = aplikacja.pamiecWezla.uruchomPamiecWezla();
    const wezel = aplikacja.lokalizacje.pobierzAktywnyWezel();
    aplikacja.interfejs.pokazAktywnyWezel(wezel, stanPamieci);
    return wezel;
  }

'''
if marker not in text:
    raise SystemExit("Nie znaleziono miejsca na obsługę pamięci węzła.")
text = text.replace(marker, insert + marker, 1)
text = replace_once(
    text,
    '      );\n      aplikacja.pamiecTras.uruchomPamiecTras();\n',
    '      );\n'
    '      aplikacja.interfejs.podlaczUstawieniaWezla(obsluzZmianeWezla);\n'
    '      uruchomIOdtworzPamiecWezla();\n'
    '      aplikacja.pamiecTras.uruchomPamiecTras();\n',
    "uruchomienie pamięci węzła",
)
write(path, text)


# 6. Historyczny test 6C.1 nie zamraża kolejnego kroku ani liczby testów.
path = "testy/etap_6c_1.test.js"
text = read(path)
text = text.replace(
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.2/);\n',
    '',
    1,
)
text = text.replace(
    '  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6C\\.1/);\n',
    '',
    1,
)
text = text.replace(
    '  assert.match(stan, /\\*\\*102\\/102 zestawów testów\\*\\*/);\n',
    '',
    1,
)
write(path, text)


# 7. Nowy test 6C.2.
test = r'''"use strict";

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
  assert.match(etapy, /Następny niezakończony podetap: \*\*6C\.3/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6C\.2/);
  assert.match(stan, /\*\*103\/103 zestawów testów\*\*/);
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
'''
write("testy/etap_6c_2.test.js", test)


# 8. Plan Etapu 6 przechodzi na 6C.3.
path = "testy/etap_6_plan.test.js"
text = read(path)
text = replace_once(
    text,
    '        (litera === "C" && numer === 1)\n',
    '        (litera === "C" && [1, 2].includes(numer))\n',
    "status 6C.2 w teście planu",
)
text = text.replace(
    'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.2/);',
    'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6C\\.3/);',
    1,
)
text = text.replace(
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6B i 6C\\.1 zakończone; następny podetap 6C\\.2\\*\\*/',
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6B i 6C\\.1–6C\\.2 zakończone; następny podetap 6C\\.3\\*\\*/',
    1,
)
text = text.replace(
    'assert.match(stan, /Rozpocząć \\*\\*6C\\.2 — ustawienie i pamięć\\*\\*/);',
    'assert.match(stan, /Rozpocząć \\*\\*6C\\.3 — gotowość na wiele węzłów\\*\\*/);',
    1,
)
text = text.replace(
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6B i 6C.1 oraz następny krok 6C.2."',
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6B i 6C.1–6C.2 oraz następny krok 6C.3."',
    1,
)
write(path, text)


# 9. Dokumentacja etapów.
path = "ETAPY_ROZWOJU.md"
text = read(path)
text = replace_once(
    text,
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6B i 6C.1 zakończone; następny podetap 6C.2**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6B i 6C.1–6C.2 zakończone; następny podetap 6C.3**',
    "status Etapu 6",
)
text = replace_once(
    text,
    '  - [ ] **6C.2 — ustawienie i pamięć:** walidować oraz lokalnie zapisywać dane\n',
    '  - [x] **6C.2 — ustawienie i pamięć:** walidować oraz lokalnie zapisywać dane\n',
    "checkbox 6C.2",
)
text = replace_once(
    text,
    'Następny niezakończony podetap: **6C.2 — ustawienie i pamięć**.',
    'Następny niezakończony podetap: **6C.3 — gotowość na wiele węzłów**.',
    "następny podetap 6C.3",
)
text += r'''

### Wynik podetapu 6C.2 — ustawienie i pamięć

- [x] operator ma kompaktowy formularz **Betoniarnia / węzeł** z nazwą,
  adresem oraz opcjonalną pełną parą współrzędnych;
- [x] zapis wymaga nazwy i co najmniej adresu albo obu współrzędnych, a model
  odrzuca niepełną parę oraz wartości poza zakresem geograficznym;
- [x] ręczna korekta zachowuje stabilne ID aktywnego węzła i zapisuje dane w
  roboczej warstwie ze źródłem `reczny` oraz znacznikiem korekty;
- [x] aktywny węzeł ma osobny wersjonowany zapis `v1` w `localStorage`, z
  bezpiecznym trybem bieżącej sesji przy blokadzie pamięci;
- [x] poprawny zapis jest odtwarzany przy następnym uruchomieniu, a uszkodzony
  zapis jest pomijany bez blokowania harmonogramu;
- [x] test `testy/etap_6c_2.test.js` oraz pełna regresja przechodzą **103/103
  zestawów testów**.

Podetap **6C.2** jest zakończony. Punkt **6C** i cały **Etap 6** pozostają
otwarte. Następny podetap: **6C.3 — gotowość na wiele węzłów**.
'''
write(path, text)


# 10. Stan projektu.
path = "STAN_PROJEKTU.md"
text = read(path)
text = replace_once(
    text,
    '- Ostatni zakończony podetap: **6C.1 — model węzła**.',
    '- Ostatni zakończony podetap: **6C.2 — ustawienie i pamięć**.',
    "ostatni podetap",
)
text = replace_once(
    text,
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6B** oraz podetap **6C.1** są\n  zakończone; punkt 6C i cały Etap 6 pozostają otwarte.',
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6B** oraz podetapy **6C.1–6C.2** są\n  zakończone; punkt 6C i cały Etap 6 pozostają otwarte.',
    "stan Etapu 6",
)
text = replace_once(
    text,
    '- Pełna regresja po 6C.1 przechodzi **102/102 zestawów testów**.',
    '- Pełna regresja po 6C.2 przechodzi **103/103 zestawów testów**.',
    "liczba testów",
)
text = replace_once(
    text,
    '- Bieżące modele tras, pamięć tras i przyszłe zapytanie mapowe pobierają ID z\n  modelu aktywnego węzła; formularz i trwała pamięć należą do 6C.2.',
    '- Bieżące modele tras, pamięć tras i przyszłe zapytanie mapowe pobierają ID z\n  modelu aktywnego węzła.\n- Operator może świadomie ustawić nazwę, adres albo pełne współrzędne aktywnego\n  węzła w kompaktowym formularzu; korekta nie zmienia jego stabilnego ID.\n- Dane węzła są wersjonowane i lokalnie zapamiętywane, a przy niedostępnej\n  pamięci trwałej działają do końca bieżącej sesji.',
    "opis 6C.2",
)
old_next = '''Rozpocząć **6C.2 — ustawienie i pamięć**. Dodać walidowane ustawianie danych\naktywnego węzła i lokalny trwały zapis, tak aby operator mógł raz podać nazwę,\nadres lub potwierdzone współrzędne i odzyskać je po ponownym uruchomieniu. Nadal\nnie podłączać konkretnego dostawcy map — jego wybór należy do **6E.1**.'''
new_next = '''Rozpocząć **6C.3 — gotowość na wiele węzłów**. Uporządkować klucze i kontrakt\ntak, aby każda lokalizacja i trasa jednoznacznie zawierała ID aktywnego węzła,\nchoć interfejs nadal może pracować z jednym wybranym węzłem. Nadal nie podłączać\nkonkretnego dostawcy map — jego wybór należy do **6E.1**.'''
text = replace_once(text, old_next, new_next, "następny krok w STAN_PROJEKTU")
write(path, text)


# 11. Plan testów 6C.2.
path = "testy/TESTY_ETAP_6.md"
text = read(path)
text = replace_once(
    text,
    'również **6C.1 — model węzła**. Następny podetap to **6C.2 — ustawienie i pamięć**.',
    'również **6C.1–6C.2**. Następny podetap to **6C.3 — gotowość na wiele węzłów**.',
    "status planu testów",
)
marker = '''## Końcowy test operatora 6J.3\n'''
section = r'''### 6C.2 — ustawienie i pamięć

Test `testy/etap_6c_2.test.js` sprawdza:

- wymaganie nazwy oraz adresu albo pełnej pary współrzędnych;
- odrzucenie pojedynczej współrzędnej i pozostawienie walidacji zakresów
  wspólnemu modelowi lokalizacji;
- zachowanie źródłowego tekstu adresu oraz osobnej normalizacji roboczej;
- ręczne źródło i jawny znacznik korekty operatora;
- zachowanie stabilnego ID węzła przy korekcie nazwy, adresu lub współrzędnych;
- wersjonowany zapis `localStorage` i odtworzenie po ponownym uruchomieniu;
- bezpieczny tryb bieżącej sesji przy zablokowanym `localStorage`;
- pominięcie uszkodzonego zapisu bez blokowania harmonogramu;
- obecność kompaktowego formularza ustawień betoniarni w interfejsie;
- aktualizację dokumentacji i przejście do 6C.3 bez podłączania dostawcy map.

'''
if marker not in text:
    raise SystemExit("Nie znaleziono miejsca na opis testu 6C.2.")
text = text.replace(marker, section + marker, 1)
write(path, text)


# 12. Trwałe decyzje i kontrakt.
path = "PROJECT_DECISIONS.md"
text = read(path)
text += r'''

---

## 126. Dane aktywnego węzła są ustawiane świadomie i zapamiętywane lokalnie

Od **6C.2** operator może ustawić aktywną betoniarnię w osobnym, kompaktowym
formularzu. Wymagana jest nazwa oraz co najmniej adres albo pełna para
współrzędnych. Pojedyncza współrzędna jest błędem.

Ręczna korekta:

- nie zmienia stabilnego `idWezla`,
- zachowuje oryginalny tekst adresu w warstwie źródłowej,
- tworzy osobny tekst roboczy i jego normalizację,
- zapisuje warstwę roboczą ze źródłem `reczny` i `czyKorektaReczna = true`,
- przy pełnej parze ręcznie podanych współrzędnych oznacza lokalizację jako
  `potwierdzona`.

Model aktywnego węzła jest przechowywany osobno od planu dnia pod wersjonowanym
kluczem `harmonogramBetonowan.aktywnyWezel.v1`. Jeżeli trwały `localStorage` jest
niedostępny, program zachowuje dane w bieżącej sesji i nadal działa offline.
Uszkodzony zapis nie może zablokować uruchomienia aplikacji.

Zmiana na inny fizyczny węzeł i obsługa wielu identyfikatorów należą do **6C.3**.
'''
write(path, text)

path = "KONTRAKT_LOKALIZACJI_I_TRAS.md"
text = read(path)
text += r'''

## Ustawienie i pamięć węzła 6C.2

Aktywny węzeł korzysta z tego samego modelu `v1`, ale od 6C.2 jego dane mogą być
świadomie ustawione przez operatora i odtworzone z pamięci lokalnej.

Kontrakt zapisu:

- klucz: `harmonogramBetonowan.aktywnyWezel.v1`;
- wersja zapisu: `1`;
- wartość: pełny `modelWezla` oraz znacznik czasu zapisu;
- poprawny odczyt jest ponownie walidowany przez `utworzModelWezla`;
- niezgodna wersja nie jest automatycznie nadpisywana;
- uszkodzony zapis jest pomijany, a aplikacja wraca do modelu startowego;
- brak `localStorage` przełącza pamięć na bieżącą sesję.

Korekta operatora nie zmienia `idWezla`. Różne fizyczne węzły i osobne ID są
zakresem 6C.3.
'''
write(path, text)


# 13. Krótka instrukcja w README.
path = "README.md"
text = read(path)
text += r'''

## Ustawienie betoniarni

W panelu ustawień dostępna jest sekcja **Betoniarnia / węzeł**. Operator podaje
nazwę oraz adres albo pełną parę współrzędnych i wybiera **Zapisz betoniarnię**.
Dane są zapamiętywane lokalnie w przeglądarce i odtwarzane przy następnym
uruchomieniu. Brak trwałej pamięci nie blokuje programu — wtedy ustawienie działa
do końca bieżącej sesji.
'''
write(path, text)
