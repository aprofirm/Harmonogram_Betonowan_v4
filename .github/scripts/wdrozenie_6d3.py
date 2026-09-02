from pathlib import Path
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f'Nie znaleziono fragmentu do zmiany: {label}')
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=0):
    result, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f'Nie znaleziono dokładnie jednego fragmentu: {label}; count={count}')
    return result


# 1. Pamięć tras: wyszukiwanie offline i jawny odczyt po wybranym kluczu.
path = 'js/pamiec/pamiec_tras.js'
text = read(path)
marker = '  function pobierzTrase(opisLokalizacji, idWezla, daneLokalizacji) {\n'
insert = r'''  function pobierzTekstWyszukiwaniaTrasy(trasa) {
    const adres = przygotujAdresLokalizacji(
      trasa && trasa.adresLokalizacji
    );
    const wartosciCzesci = Object.keys(adres.czesci || {}).map(function (nazwaPola) {
      return adres.czesci[nazwaPola];
    });

    return normalizujOpisLokalizacji([
      trasa && trasa.opisLokalizacji,
      adres.tekst,
      adres.tekstZnormalizowany
    ].concat(wartosciCzesci).filter(Boolean).join(" "));
  }

  function pobierzLimitPodpowiedzi(wartosc) {
    const liczba = Number(wartosc);

    if (!Number.isInteger(liczba) || liczba <= 0) {
      return 20;
    }

    return Math.min(liczba, 100);
  }

  function wyszukajTrasy(fraza, idWezla, limitWynikow) {
    zapewnijUruchomienie();

    let idWezlaZnormalizowany;
    let frazaZnormalizowana;

    try {
      idWezlaZnormalizowany = pobierzZnormalizowanyIdWezla(idWezla);
      frazaZnormalizowana = normalizujOpisLokalizacji(fraza);

      if (!frazaZnormalizowana) {
        throw new Error("Fraza wyszukiwania nie może być pusta.");
      }
    } catch (bladDanych) {
      return utworzWynik("blad-wyszukiwania", {
        trasy: [],
        liczbaTras: 0,
        komunikat: bladDanych.message
      });
    }

    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        trasy: [],
        liczbaTras: 0,
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const slowa = frazaZnormalizowana.split(" ").filter(Boolean);
    const limit = pobierzLimitPodpowiedzi(limitWynikow);
    const znalezione = wynikOdczytu.ksiazka.trasy
      .filter(function (trasa) {
        if (trasa.idWezlaZnormalizowany !== idWezlaZnormalizowany) {
          return false;
        }

        const tekst = pobierzTekstWyszukiwaniaTrasy(trasa);
        return slowa.every(function (slowo) {
          return tekst.includes(slowo);
        });
      })
      .slice()
      .reverse()
      .slice(0, limit);

    return utworzWynik(
      znalezione.length ? "znaleziono-trasy" : "brak-trasy",
      {
        trasy: skopiujDane(znalezione),
        liczbaTras: znalezione.length,
        frazaZnormalizowana: frazaZnormalizowana
      }
    );
  }

  function pobierzTrasePoKluczu(kluczTrasy, idWezla) {
    zapewnijUruchomienie();
    const klucz = String(kluczTrasy || "").trim();
    let idWezlaZnormalizowany;

    try {
      if (!klucz) {
        throw new Error("Klucz wybranej trasy nie może być pusty.");
      }

      idWezlaZnormalizowany = pobierzZnormalizowanyIdWezla(idWezla);
    } catch (bladDanych) {
      return utworzWynik("blad-odczytu", {
        trasa: null,
        komunikat: bladDanych.message
      });
    }

    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        trasa: null,
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const indeks = wynikOdczytu.ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === klucz &&
        trasa.idWezlaZnormalizowany === idWezlaZnormalizowany;
    });

    if (indeks === -1) {
      return utworzWynik("brak-trasy", { trasa: null });
    }

    const trasa = wynikOdczytu.ksiazka.trasy[indeks];
    trasa.ostatnioUzyto = new Date().toISOString();
    wynikOdczytu.ksiazka.trasy.splice(indeks, 1);
    wynikOdczytu.ksiazka.trasy.push(trasa);
    const ograniczona = ograniczKsiazke(wynikOdczytu.ksiazka);
    const statusAktualizacji = zapiszTekstPamieci(ograniczona.tekstPamieci);

    return utworzWynik("odczytano-trase", {
      trasa: skopiujDane(trasa),
      zrodloOdczytu: "pamiec",
      statusAktualizacji: statusAktualizacji
    });
  }

'''
text = replace_once(text, marker, insert + marker, 'funkcje podpowiedzi pamięci')
old_export = '''    utworzTozsamoscLokalizacji: utworzTozsamoscLokalizacji,
    zapiszTrase: zapiszTrase,
    pobierzTrase: pobierzTrase,
    pobierzListeTras: pobierzListeTras,
'''
new_export = '''    utworzTozsamoscLokalizacji: utworzTozsamoscLokalizacji,
    zapiszTrase: zapiszTrase,
    pobierzTrase: pobierzTrase,
    wyszukajTrasy: wyszukajTrasy,
    pobierzTrasePoKluczu: pobierzTrasePoKluczu,
    pobierzListeTras: pobierzListeTras,
'''
text = replace_once(text, old_export, new_export, 'eksport API pamięci 6D.3')
write(path, text)


# 2. Brama lokalizacji: podpowiedzi oraz świadome zastosowanie konkretnego wpisu.
path = 'js/lokalizacje/lokalizacje.js'
text = read(path)
marker = '  function pobierzPierwotneZrodlo(zrodloBudowy, zrodloZapamietane) {\n'
insert = r'''  function pobierzFrazePodpowiedziPamieciBudowy(budowa) {
    const modelLokalizacji = budowa && budowa.modelLokalizacji || {};
    const warstwa = modelLokalizacji.daneRobocze || {};
    const adres = warstwa.adres || {};
    const status = String(warstwa.statusJakosci || "").trim();
    const tekstAdresu = String(
      adres.tekstZnormalizowany || adres.tekst || ""
    ).trim();

    if (tekstAdresu && !["brak", "niewystarczajaca"].includes(status)) {
      return tekstAdresu;
    }

    return utworzOpisLokalizacjiBudowy(budowa);
  }

  function wyszukajPodpowiedziPamieciDlaBudowy(budowa) {
    if (!budowa || !aplikacja.pamiecTras ||
        typeof aplikacja.pamiecTras.wyszukajTrasy !== "function") {
      return {
        status: "brak-modulu-podpowiedzi-pamieci",
        podpowiedzi: [],
        liczbaPodpowiedzi: 0
      };
    }

    migrujBudoweDoKontraktuTras(budowa);
    const fraza = pobierzFrazePodpowiedziPamieciBudowy(budowa);

    if (!fraza) {
      return {
        status: "brak-frazy-podpowiedzi",
        podpowiedzi: [],
        liczbaPodpowiedzi: 0
      };
    }

    const wynik = aplikacja.pamiecTras.wyszukajTrasy(
      fraza,
      pobierzIdAktywnegoWezla(),
      10
    );
    const podpowiedzi = Array.isArray(wynik.trasy) ? wynik.trasy : [];

    return Object.assign({}, wynik, {
      status: podpowiedzi.length ? "znaleziono-podpowiedzi" : "brak-podpowiedzi",
      podpowiedzi: podpowiedzi,
      liczbaPodpowiedzi: podpowiedzi.length
    });
  }

  function zastosujLokalizacjeZWybranejTrasy(budowa, trasa) {
    if (!trasa ||
        !["adres", "wspolrzedne"].includes(trasa.rodzajKluczaLokalizacji)) {
      return;
    }

    const model = budowa.modelLokalizacji || {};
    const warstwaRobocza = model.daneRobocze || {};
    const adresTrasy = trasa.adresLokalizacji || {};
    const czyTrasaMaAdres = Boolean(
      String(adresTrasy.tekst || adresTrasy.tekstZnormalizowany || "").trim()
    );
    const nowaWarstwa = Object.assign({}, warstwaRobocza, {
      adres: czyTrasaMaAdres ? adresTrasy : warstwaRobocza.adres,
      wspolrzedne: trasa.wspolrzedneLokalizacji || warstwaRobocza.wspolrzedne,
      statusJakosci: "potwierdzona",
      zrodlo: "pamiec",
      czyKorektaReczna: true
    });

    budowa.modelLokalizacji = aplikacja.lokalizacje.utworzModelLokalizacji(
      Object.assign({}, model, {
        idWezla: pobierzIdAktywnegoWezla(),
        daneRobocze: nowaWarstwa
      })
    );
  }

  function zastosujWybranaTraseZPamieci(budowa, kluczTrasy) {
    if (!budowa || !aplikacja.pamiecTras ||
        typeof aplikacja.pamiecTras.pobierzTrasePoKluczu !== "function") {
      return {
        status: "brak-modulu-pamieci-tras",
        czyUzupelniono: false,
        trasa: null
      };
    }

    migrujBudoweDoKontraktuTras(budowa);

    if (czyJestCzas(budowa.czasDojazduRoboczyMinuty) ||
        czyJestCzas(budowa.czasPowrotuRoboczyMinuty)) {
      return {
        status: "pozostawiono-istniejace-czasy",
        czyUzupelniono: false,
        trasa: null
      };
    }

    const wynik = aplikacja.pamiecTras.pobierzTrasePoKluczu(
      kluczTrasy,
      pobierzIdAktywnegoWezla()
    );

    if (!wynik.trasa) {
      return Object.assign({}, wynik, { czyUzupelniono: false });
    }

    zastosujLokalizacjeZWybranejTrasy(budowa, wynik.trasa);
    aplikacja.budowy.ustawCzasyRobocze(budowa, {
      czasDojazduRoboczyMinuty: wynik.trasa.czasDojazduMinuty,
      czasPowrotuRoboczyMinuty: wynik.trasa.czasPowrotuMinuty,
      dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
      czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
      dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
      zrodloCzasuDojazdu: "pamiec",
      zrodloCzasuPowrotu: "pamiec"
    });
    migrujBudoweDoKontraktuTras(budowa, {
      czyWymusicWartoscRobocza: true
    });

    return Object.assign({}, wynik, {
      status: "zastosowano-wybrana-trase-z-pamieci",
      czyUzupelniono: true
    });
  }

'''
text = replace_once(text, marker, insert + marker, 'brama podpowiedzi 6D.3')
old_flow = '''    const wynikPamieci = uzupelnijBudoweZPamieci(budowa);

    if (wynikPamieci.czyUzupelniono) {
      return Promise.resolve({
        status: "uzyto-pamieci-tras",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: false
      });
    }

    if (typeof pobierzTraseZMapy !== "function") {
'''
new_flow = '''    const wynikPamieci = uzupelnijBudoweZPamieci(budowa);

    if (wynikPamieci.czyUzupelniono) {
      return Promise.resolve({
        status: "uzyto-pamieci-tras",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: false
      });
    }

    const wynikPodpowiedzi = wyszukajPodpowiedziPamieciDlaBudowy(budowa);

    if (wynikPodpowiedzi.liczbaPodpowiedzi > 0) {
      return Promise.resolve({
        status: "wymagany-wybor-z-pamieci",
        trasa: null,
        podpowiedzi: wynikPodpowiedzi.podpowiedzi,
        liczbaPodpowiedzi: wynikPodpowiedzi.liczbaPodpowiedzi,
        czyWywolanoMape: false
      });
    }

    if (typeof pobierzTraseZMapy !== "function") {
'''
text = replace_once(text, old_flow, new_flow, 'cache przed internetem')
old_export = '''    uzupelnijBudoweZPamieci: uzupelnijBudoweZPamieci,
    uzupelnijListeBudowZPamieci: uzupelnijListeBudowZPamieci,
    migrujBudoweDoKontraktuTras: migrujBudoweDoKontraktuTras,
'''
new_export = '''    uzupelnijBudoweZPamieci: uzupelnijBudoweZPamieci,
    uzupelnijListeBudowZPamieci: uzupelnijListeBudowZPamieci,
    wyszukajPodpowiedziPamieciDlaBudowy: wyszukajPodpowiedziPamieciDlaBudowy,
    zastosujWybranaTraseZPamieci: zastosujWybranaTraseZPamieci,
    migrujBudoweDoKontraktuTras: migrujBudoweDoKontraktuTras,
'''
text = replace_once(text, old_export, new_export, 'eksport bramy 6D.3')
write(path, text)


# 3. Istniejący podgląd zapisanych tras: wyszukiwanie także po adresie i widoczny adres.
path = 'js/interfejs/podglad_tras.js'
text = read(path)
marker = '  function porownajNazwyTras(trasaPierwsza, trasaDruga) {\n'
insert = r'''  function pobierzTekstWyszukiwaniaTrasy(trasa) {
    const adres = trasa && trasa.adresLokalizacji || {};
    const czesci = adres.czesci && typeof adres.czesci === "object"
      ? adres.czesci
      : {};

    return [
      trasa && trasa.opisLokalizacji,
      adres.tekst,
      adres.tekstZnormalizowany
    ].concat(Object.keys(czesci).map(function (nazwaPola) {
      return czesci[nazwaPola];
    })).filter(Boolean).join(" ");
  }

  function opiszAdresTrasy(trasa) {
    const adres = trasa && trasa.adresLokalizacji || {};
    return String(adres.tekst || "").trim() || "—";
  }

'''
text = replace_once(text, marker, insert + marker, 'tekst wyszukiwania podglądu')
old_filter = '''      ? listaTras.filter(function (trasa) {
          return normalizujTekstWyszukiwania(
            trasa && trasa.opisLokalizacji
          ).includes(szukanaFraza);
        })
'''
new_filter = '''      ? listaTras.filter(function (trasa) {
          return normalizujTekstWyszukiwania(
            pobierzTekstWyszukiwaniaTrasy(trasa)
          ).includes(szukanaFraza);
        })
'''
text = replace_once(text, old_filter, new_filter, 'filtr nazwa lub adres')
text = replace_once(
    text,
    '    poleWyszukiwania.placeholder = "np. Świebodzice, POLST, Jachimowicza";\n',
    '    poleWyszukiwania.placeholder = "np. nazwa budowy albo adres";\n',
    'placeholder wyszukiwania'
)
old_headers = '''    [
      "Lokalizacja",
      "Dojazd",
      "Powrót",
      "Źródło",
      "Aktualizacja",
      "Ostatnie użycie",
      "Akcja"
    ].forEach(function (etykieta) {
'''
new_headers = '''    [
      "Lokalizacja",
      "Adres",
      "Dojazd",
      "Powrót",
      "Źródło",
      "Aktualizacja",
      "Ostatnie użycie",
      "Akcja"
    ].forEach(function (etykieta) {
'''
text = replace_once(text, old_headers, new_headers, 'kolumna adresu')
text = replace_once(
    text,
    '      wiersz.appendChild(utworzKomorke(trasa.opisLokalizacji));\n      wiersz.appendChild(utworzKomorke(trasa.czasDojazduMinuty + " min"));\n',
    '      wiersz.appendChild(utworzKomorke(trasa.opisLokalizacji));\n      wiersz.appendChild(utworzKomorke(opiszAdresTrasy(trasa)));\n      wiersz.appendChild(utworzKomorke(trasa.czasDojazduMinuty + " min"));\n',
    'adres w wierszu'
)
write(path, text)


# 4. CSS tabeli zapisanych tras po dodaniu kolumny adresu.
path = 'style/rodzaj_rozladunku.css'
text = read(path)
old = r'''#lista-zapisanych-tras th:nth-child(1),
#lista-zapisanych-tras td:nth-child(1) {
  width: 28%;
}

#lista-zapisanych-tras th:nth-child(2),
#lista-zapisanych-tras td:nth-child(2),
#lista-zapisanych-tras th:nth-child(3),
#lista-zapisanych-tras td:nth-child(3) {
  width: 9%;
}

#lista-zapisanych-tras th:nth-child(4),
#lista-zapisanych-tras td:nth-child(4) {
  width: 14%;
}

#lista-zapisanych-tras th:nth-child(5),
#lista-zapisanych-tras td:nth-child(5),
#lista-zapisanych-tras th:nth-child(6),
#lista-zapisanych-tras td:nth-child(6) {
  width: 16%;
}

#lista-zapisanych-tras th:nth-child(7),
#lista-zapisanych-tras td:nth-child(7) {
  position: sticky;
  right: 0;
  z-index: 1;
  width: 8%;
  min-width: 58px;
  text-align: center;
  background: #ffffff;
}

#lista-zapisanych-tras th:nth-child(7) {
  z-index: 2;
  background: #f7f9fa;
}
'''
new = r'''#lista-zapisanych-tras th:nth-child(1),
#lista-zapisanych-tras td:nth-child(1) {
  width: 20%;
}

#lista-zapisanych-tras th:nth-child(2),
#lista-zapisanych-tras td:nth-child(2) {
  width: 22%;
}

#lista-zapisanych-tras th:nth-child(3),
#lista-zapisanych-tras td:nth-child(3),
#lista-zapisanych-tras th:nth-child(4),
#lista-zapisanych-tras td:nth-child(4) {
  width: 7%;
}

#lista-zapisanych-tras th:nth-child(5),
#lista-zapisanych-tras td:nth-child(5) {
  width: 12%;
}

#lista-zapisanych-tras th:nth-child(6),
#lista-zapisanych-tras td:nth-child(6),
#lista-zapisanych-tras th:nth-child(7),
#lista-zapisanych-tras td:nth-child(7) {
  width: 13%;
}

#lista-zapisanych-tras th:nth-child(8),
#lista-zapisanych-tras td:nth-child(8) {
  position: sticky;
  right: 0;
  z-index: 1;
  width: 6%;
  min-width: 58px;
  text-align: center;
  background: #ffffff;
}

#lista-zapisanych-tras th:nth-child(8) {
  z-index: 2;
  background: #f7f9fa;
}
'''
text = replace_once(text, old, new, 'szerokości kolumn pamięci tras')
text = replace_once(text, '    min-width: 680px;\n', '    min-width: 820px;\n', 'mobilna szerokość pamięci tras')
write(path, text)


# 5. Historyczne testy: nie zamrażają kolejnego podetapu, układ ma 8 kolumn.
path = 'testy/etap_6d_2.test.js'
text = read(path)
text = replace_once(
    text,
    '''  assert.match(etapy, /- \\[x\\] \\*\\*6D\\.2 — stabilny klucz i duplikaty/);\n  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6D\\.3/);\n  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6D\\.2/);\n  assert.match(stan, /106\\/106 zestawów testów/);\n''',
    '''  assert.match(etapy, /- \\[x\\] \\*\\*6D\\.2 — stabilny klucz i duplikaty/);\n''',
    'historyczny test 6D.2'
)
write(path, text)

path = 'testy/pamiec_tras_uklad.test.js'
text = read(path)
text = text.replace('th:nth-child\\(7\\)', 'th:nth-child\\(8\\)')
text = text.replace('td:nth-child\\(7\\)', 'td:nth-child\\(8\\)')
text = text.replace('min-width:\\s*680px', 'min-width:\\s*820px')
text = text.replace(
    'Kolumna akcji z przyciskiem Usuń powinna pozostać widoczna podczas przewijania.',
    'Ósma kolumna akcji z przyciskiem Usuń powinna pozostać widoczna podczas przewijania.'
)
write(path, text)


# 6. Nowy test 6D.3.
test = r'''"use strict";

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
'''
write('testy/etap_6d_3.test.js', test)


# 7. Plan Etapu 6 — 6D zamknięte, następny 6E.1.
path = 'testy/etap_6_plan.test.js'
text = read(path)
text = replace_once(
    text,
    '    const stanPunktu = ["A", "B", "C"].includes(litera) ? "x" : " ";\n',
    '    const stanPunktu = ["A", "B", "C", "D"].includes(litera) ? "x" : " ";\n',
    'status punktu D'
)
text = replace_once(
    text,
    '''      const stan = ["A", "B", "C"].includes(litera) ||
        (litera === "D" && numer <= 2)
        ? "x"
        : " ";
''',
    '''      const stan = ["A", "B", "C", "D"].includes(litera)
        ? "x"
        : " ";
''',
    'status podetapów D'
)
text = text.replace('Następny niezakończony podetap: \\*\\*6D\\.3', 'Następny niezakończony podetap: \\*\\*6E\\.1')
text = replace_once(
    text,
    r'/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6C i 6D\\.1–6D\\.2 zakończone; następny podetap 6D\\.3\\*\\*/',
    r'/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6D zakończone; następny podetap 6E\\.1\\*\\*/',
    'regex top status planu'
)
text = replace_once(
    text,
    '  assert.match(stan, /Rozpocząć \\*\\*6D\\.3 — cache i lokalne podpowiedzi\\*\\*/);\n',
    '  assert.match(stan, /Rozpocząć \\*\\*6E\\.1/);\n',
    'następny krok planu'
)
text = replace_once(
    text,
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6C i 6D.1–6D.2 oraz następny krok 6D.3."\n',
    '  "OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6D oraz następny krok 6E.1."\n',
    'komunikat planu'
)
write(path, text)


# 8. Dokumentacja statusu.
path = 'ETAPY_ROZWOJU.md'
text = read(path)
text = replace_once(
    text,
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6C i 6D.1–6D.2 zakończone; następny podetap 6D.3**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6D zakończone; następny podetap 6E.1**',
    'top status Etapu 6'
)
text = regex_once(
    text,
    r'- \[ \] \*\*6D — pamięć lokalizacji i tras oparta na jednoznacznym miejscu\.\*\*',
    '- [x] **6D — pamięć lokalizacji i tras oparta na jednoznacznym miejscu.**',
    'checkbox 6D'
)
text = regex_once(
    text,
    r'- \[ \] \*\*6D\.3 — cache i lokalne podpowiedzi:\*\*',
    '- [x] **6D.3 — cache i lokalne podpowiedzi:**',
    'checkbox 6D.3'
)
text += '''\n\n## Wynik 6D.3 — cache i lokalne podpowiedzi\n\n- [x] dokładne trafienie stabilnego klucza nadal uzupełnia trasę automatycznie i nie wywołuje internetu;\n- [x] po braku dokładnego trafienia pamięć może lokalnie wyszukać kandydatów po nazwie lub rzeczywistym adresie w obrębie aktywnego węzła;\n- [x] wyszukiwanie jest deterministyczne, nie stosuje fuzzy matchingu i samo nie zmienia daty ostatniego użycia wpisu;\n- [x] znaleziony kandydat nie jest automatycznie stosowany — brama zwraca `wymagany-wybor-z-pamieci`, a internet nie jest wtedy wywoływany;\n- [x] świadome zastosowanie odbywa się wyłącznie przez dokładny `kluczTrasy`, zachowuje źródłowy adres budowy i zapisuje wybraną lokalizację w warstwie roboczej jako potwierdzoną;\n- [x] istniejące ręczne lub odtworzone czasy nadal mają pierwszeństwo i nie są nadpisywane przez wybór z pamięci;\n- [x] okno **Zapisane trasy** wyszukuje offline zarówno po nazwie, jak i adresie oraz pokazuje adres w osobnej kolumnie;\n- [x] test `testy/etap_6d_3.test.js` oraz pełna regresja przechodzą **107/107 zestawów testów**.\n\nPodetap **6D.3** i cały punkt **6D — pamięć lokalizacji i tras oparta na jednoznacznym miejscu** są zakończone. Etap 6 pozostaje otwarty.\nNastępny niezakończony podetap: **6E.1 — porównanie i wybór dostawcy**.\n'''
write(path, text)

path = 'STAN_PROJEKTU.md'
text = read(path)
text = replace_once(text, '- Ostatni zakończony podetap: **6D.2 — stabilny klucz i duplikaty**.', '- Ostatni zakończony podetap: **6D.3 — cache i lokalne podpowiedzi**.', 'stan ostatni krok')
text = replace_once(text, '- **Etap 6** jest rozpoczęty. Punkty **6A–6C** oraz podetapy **6D.1–6D.2** są zakończone; punkt 6D i cały Etap 6 pozostają otwarte.', '- **Etap 6** jest rozpoczęty. Punkty **6A–6D** są zakończone; cały Etap 6 pozostaje otwarty.', 'stan Etapu 6')
text = replace_once(text, '- Pełna regresja po 6D.2 przechodzi **106/106 zestawów testów**.', '- Pełna regresja po 6D.3 przechodzi **107/107 zestawów testów**.', 'liczba testów')
text = replace_once(
    text,
    '- Ten sam opis przy różnych adresach pozostaje rozdzielony, a opis bez adresu nie wybiera automatycznie między kilkoma zapamiętanymi lokalizacjami.\n',
    '- Ten sam opis przy różnych adresach pozostaje rozdzielony, a opis bez adresu nie wybiera automatycznie między kilkoma zapamiętanymi lokalizacjami.\n- Po braku dokładnego trafienia aplikacja przeszukuje pamięć lokalnie przed internetem; znalezione wpisy są tylko podpowiedziami i wymagają jawnego wyboru konkretnego klucza trasy.\n- Okno zapisanych tras pozwala offline wyszukiwać po nazwie i adresie, a samo wyszukiwanie nie zmienia wpisu ani daty ostatniego użycia.\n',
    'stan podpowiedzi'
)
text = regex_once(
    text,
    r'Rozpocząć \*\*6D\.3 — cache i lokalne podpowiedzi\*\*\.[\s\S]*?jego wybór należy do \*\*6E\.1\*\*\.',
    'Rozpocząć **6E.1 — porównanie i wybór dostawcy**. Porównać realne usługi geokodowania i routingu pod kątem kosztu, limitów, licencji, stabilności, działania web/lokalnego i ewentualnej obsługi ciężkich pojazdów. W tym kroku podjąć decyzję o dostawcy, ale nie przenosić logiki dostawcy do silnika harmonogramu.',
    'następny krok STAN'
)
write(path, text)

path = 'testy/TESTY_ETAP_6.md'
text = read(path)
text = replace_once(
    text,
    'również cały punkt **6C** oraz podetapy **6D.1–6D.2**. Następny podetap to\n**6D.3 — cache i lokalne podpowiedzi**.',
    'również całe punkty **6C–6D**. Następny podetap to\n**6E.1 — porównanie i wybór dostawcy**.',
    'status testów Etapu 6'
)
text += '''\n\n### 6D.3 — cache i lokalne podpowiedzi\n\nTest `testy/etap_6d_3.test.js` sprawdza:\n\n- lokalne wyszukiwanie pamięci po nazwie i rzeczywistym adresie bez wywołania sieci;\n- ograniczenie wyników do aktywnego `idWezla`;\n- brak fuzzy matchingu i brak zmiany `ostatnioUzyto` przez samo wyszukiwanie;\n- wiele kandydatów dla wspólnej nazwy przy różnych adresach bez automatycznego wyboru;\n- pierwszeństwo dokładnego cache przed podpowiedziami i internetem;\n- zatrzymanie przed internetem przy niejednoznacznej lokalnej podpowiedzi;\n- jawne zastosowanie wyłącznie konkretnego `kluczTrasy`;\n- zachowanie źródłowego adresu oraz istniejących ręcznych czasów;\n- wyszukiwanie adresu w istniejącym oknie **Zapisane trasy**;\n- zamknięcie całego punktu 6D, aktualizację dokumentacji i przejście do 6E.1.\n\nPełna regresja po 6D.3 obejmuje **107/107 zestawów testów**.\n'''
write(path, text)

path = 'PROJECT_DECISIONS.md'
text = read(path)
text += '''\n\n---\n\n## 129. Podpowiedź cache nie jest automatycznym wyborem lokalizacji\n\nOd **6D.3** rozróżniamy dokładne trafienie stabilnego klucza od lokalnego wyszukania kandydatów. Dokładne, jednoznaczne trafienie pamięci może nadal automatycznie uzupełnić czasy zgodnie z wcześniejszym kontraktem. Wyszukiwanie po nazwie lub części adresu zwraca wyłącznie podpowiedzi.\n\nZasady:\n\n- pamięć jest sprawdzana lokalnie przed próbą użycia internetu;\n- wyszukiwanie obejmuje tylko wpisy aktywnego `idWezla`;\n- wyszukiwanie może korzystać z nazwy i rzeczywistego adresu, ale nie stosuje fuzzy matchingu ani progów podobieństwa;\n- wynik wyszukiwania nie zmienia `ostatnioUzyto` i nie jest traktowany jako użycie trasy;\n- żadna podpowiedź nie jest stosowana automatycznie, nawet gdy wyszukiwanie zwróci jednego kandydata;\n- świadomy wybór operatora wskazuje dokładny `kluczTrasy`; dopiero wtedy wpis może zasilić roboczą lokalizację i czasy;\n- istniejące ręczne albo odtworzone czasy mają pierwszeństwo i nie są nadpisywane przez wybór z cache;\n- wybór z pamięci nie zmienia źródłowego adresu KDX/CSV; zmienia wyłącznie warstwę roboczą;\n- konkretny dostawca geokodowania i routingu nadal nie jest wybrany w 6D.3; decyzja należy do **6E.1**.\n'''
write(path, text)

path = 'KONTRAKT_LOKALIZACJI_I_TRAS.md'
text = read(path)
text += '''\n\n## Cache i lokalne podpowiedzi — 6D.3\n\nPo 6D.3 brama `aplikacja.lokalizacje` rozróżnia dwa poziomy użycia pamięci:\n\n1. **dokładne trafienie stabilnej tożsamości** — może automatycznie zasilić robocze czasy i kończy przepływ przed internetem;\n2. **lokalne wyszukanie kandydatów** — zwraca podpowiedzi, ale nie zmienia budowy i nie wybiera wpisu automatycznie.\n\nWyszukiwanie działa wyłącznie na lokalnej książce `v2`, w obrębie aktywnego `idWezla`, i przeszukuje znormalizowaną etykietę oraz rzeczywisty adres. To wyszukiwanie deterministyczne: wszystkie słowa zapytania muszą występować w danych wpisu. Nie jest to fuzzy matching ani reguła tożsamości.\n\nJeżeli po braku dokładnego cache istnieje co najmniej jedna lokalna podpowiedź, `pobierzLubUstalTrase` zwraca stan `wymagany-wybor-z-pamieci` i **nie wywołuje adaptera internetowego**. Operator albo późniejszy interfejs może zastosować wyłącznie konkretny wpis wskazany przez jego pełny `kluczTrasy`.\n\nŚwiadomie wybrany wpis może uzupełnić roboczy adres lub współrzędne oraz oba czasy ze źródłem `pamiec`, ale nie zmienia `daneZrodlowe`. Jeżeli budowa ma już którykolwiek roboczy czas, wybór z pamięci go nie nadpisuje. Samo wyszukiwanie nie aktualizuje `ostatnioUzyto`; data zmienia się dopiero po faktycznym odczycie wybranego wpisu.\n\nKolejność bramy po 6D.3: **bieżące czasy → dokładny cache → lokalne podpowiedzi wymagające wyboru → adapter internetowy → jawny brak trasy**. Konkretna usługa mapowa nadal nie należy do 6D i zostanie wybrana w 6E.1.\n'''
write(path, text)

path = 'README.md'
text = read(path)
text += '''\n\n## Lokalne podpowiedzi zapisanych tras — 6D.3\n\nWyszukiwanie zapisanych tras działa lokalnie i nie wymaga internetu. Okno **Zapisane trasy** przeszukuje teraz zarówno nazwę lokalizacji, jak i zapamiętany adres oraz pokazuje adres w osobnej kolumnie.\n\nDokładne trafienie stabilnej lokalizacji może nadal automatycznie przywrócić czasy. Jeżeli dokładnego trafienia nie ma, ale pamięć zawiera możliwe lokalne dopasowania, aplikacja zatrzymuje się przed internetem i zwraca je jako podpowiedzi. Taka podpowiedź nie jest używana samoczynnie — zastosowanie wymaga świadomego wskazania konkretnego wpisu. Ręcznie wpisane lub odtworzone czasy mają zawsze pierwszeństwo.\n'''
write(path, text)

print('6D.3: poprawki przygotowane.')
