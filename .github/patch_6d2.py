from pathlib import Path
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: oczekiwano 1 wystąpienia, znaleziono {count}: {old[:80]!r}')
    write(path, text.replace(old, new, 1))


def append_once(path, marker, content):
    text = read(path)
    if marker in text:
        return
    write(path, text.rstrip() + '\n\n' + content.strip() + '\n')


# --- js/pamiec/pamiec_tras.js ---
path = 'js/pamiec/pamiec_tras.js'
replace_once(
    path,
    '  const DOZWOLONE_ZRODLA_DANYCH = Object.freeze([\n    "reczny",\n    "mapa",\n    "pamiec",\n    "mieszane"\n  ]);',
    '  const DOZWOLONE_ZRODLA_DANYCH = Object.freeze([\n    "reczny",\n    "mapa",\n    "pamiec",\n    "mieszane"\n  ]);\n  const RODZAJE_KLUCZA_LOKALIZACJI = Object.freeze([\n    "wspolrzedne",\n    "adres",\n    "opis-zgodnosciowy"\n  ]);'
)

replace_once(
    path,
    '''  function utworzKluczTrasy(opisLokalizacji, idWezla) {
    const opis = pobierzPoprawnyOpis(opisLokalizacji);
    const opisZnormalizowany = normalizujOpisLokalizacji(opis);

    if (!opisZnormalizowany) {
      throw new Error("Opis lokalizacji nie zawiera znaków pozwalających ją rozpoznać.");
    }

    return pobierzZnormalizowanyIdWezla(idWezla) + "::" + opisZnormalizowany;
  }
''',
    '''  function utworzStaryKluczTrasyV2(opisLokalizacji, idWezla) {
    const opis = pobierzPoprawnyOpis(opisLokalizacji);
    const opisZnormalizowany = normalizujOpisLokalizacji(opis);

    if (!opisZnormalizowany) {
      throw new Error("Opis lokalizacji nie zawiera znaków pozwalających ją rozpoznać.");
    }

    return pobierzZnormalizowanyIdWezla(idWezla) + "::" + opisZnormalizowany;
  }

  function utworzKluczTrasy(opisLokalizacji, idWezla, daneLokalizacji) {
    const tozsamosc = utworzTozsamoscLokalizacji(
      opisLokalizacji,
      daneLokalizacji
    );

    return pobierzZnormalizowanyIdWezla(idWezla) +
      "::" + tozsamosc.kluczLokalizacji;
  }
'''
)

replace_once(
    path,
    '''  function przygotujAdresLokalizacji(adres) {
    const dane = czyPoprawnyObiekt(adres) ? adres : {};
    const czesci = czyPoprawnyObiekt(dane.czesci) ? skopiujDane(dane.czesci) : {};

    return {
      tekst: pobierzTekstLubBrak(dane.tekst),
      tekstZnormalizowany: pobierzTekstLubBrak(dane.tekstZnormalizowany),
      czesci: czesci
    };
  }
''',
    '''  function przygotujAdresLokalizacji(adres) {
    const dane = czyPoprawnyObiekt(adres) ? adres : {};
    const czesci = czyPoprawnyObiekt(dane.czesci) ? skopiujDane(dane.czesci) : {};
    const tekst = pobierzTekstLubBrak(dane.tekst);
    const tekstZnormalizowany =
      pobierzTekstLubBrak(dane.tekstZnormalizowany) ||
      normalizujOpisLokalizacji(tekst) || null;

    return {
      tekst: tekst,
      tekstZnormalizowany: tekstZnormalizowany,
      czesci: czesci
    };
  }
'''
)

needle = '''  function pobierzZrodloDanych(wartosc, zrodloDojazdu, zrodloPowrotu) {'''
insert = '''  function czyAdresMaRzeczywisteCzesci(adres) {
    const czesci = adres && czyPoprawnyObiekt(adres.czesci)
      ? adres.czesci
      : {};
    const polaAdresowe = [
      "ulica",
      "numerBudynku",
      "kodPocztowy",
      "miejscowosc",
      "gmina",
      "powiat",
      "wojewodztwo",
      "kraj"
    ];

    return polaAdresowe.some(function (nazwaPola) {
      return Boolean(pobierzTekstLubBrak(czesci[nazwaPola]));
    });
  }

  function czyAdresJestTylkoOpisemZgodnosciowym(adres) {
    const czesci = adres && czyPoprawnyObiekt(adres.czesci)
      ? adres.czesci
      : {};
    const czyMaOpis = Boolean(
      pobierzTekstLubBrak(czesci.firma) ||
      pobierzTekstLubBrak(czesci.nazwaBudowy)
    );

    return czyMaOpis && !czyAdresMaRzeczywisteCzesci(adres);
  }

  function pobierzZnormalizowanyAdresDoKlucza(adres) {
    const przygotowanyAdres = przygotujAdresLokalizacji(adres);

    if (!przygotowanyAdres.tekstZnormalizowany ||
        czyAdresJestTylkoOpisemZgodnosciowym(przygotowanyAdres)) {
      return null;
    }

    return przygotowanyAdres.tekstZnormalizowany;
  }

  function utworzTekstKluczaWspolrzednych(wspolrzedne) {
    const przygotowane = przygotujWspolrzedne(wspolrzedne);

    if (!przygotowane) {
      return null;
    }

    return String(przygotowane.szerokoscGeograficzna) + "," +
      String(przygotowane.dlugoscGeograficzna);
  }

  function utworzTozsamoscLokalizacji(opisLokalizacji, daneLokalizacji) {
    const dane = czyPoprawnyObiekt(daneLokalizacji) ? daneLokalizacji : {};
    const kluczWspolrzednych = utworzTekstKluczaWspolrzednych(
      dane.wspolrzedneLokalizacji
    );

    if (kluczWspolrzednych) {
      return {
        rodzaj: "wspolrzedne",
        kluczLokalizacji: "wspolrzedne::" + kluczWspolrzednych
      };
    }

    const adresZnormalizowany = pobierzZnormalizowanyAdresDoKlucza(
      dane.adresLokalizacji
    );

    if (adresZnormalizowany) {
      return {
        rodzaj: "adres",
        kluczLokalizacji: "adres::" + adresZnormalizowany
      };
    }

    const opis = pobierzPoprawnyOpis(opisLokalizacji);
    const opisZnormalizowany = normalizujOpisLokalizacji(opis);

    if (!opisZnormalizowany) {
      throw new Error("Opis lokalizacji nie zawiera znaków pozwalających ją rozpoznać.");
    }

    return {
      rodzaj: "opis-zgodnosciowy",
      kluczLokalizacji: "opis::" + opisZnormalizowany
    };
  }

'''
text = read(path)
if needle not in text or 'function utworzTozsamoscLokalizacji' in text:
    raise SystemExit('pamiec_tras.js: nie udało się znaleźć miejsca dla tożsamości 6D.2')
write(path, text.replace(needle, insert + needle, 1))

old_validation = re.compile(r'''  function czyPoprawnaTrasa\(trasa\) \{[\s\S]*?\n  \}\n\n  function migrujTraseV1''')
text = read(path)
match = old_validation.search(text)
if not match:
    raise SystemExit('pamiec_tras.js: nie znaleziono walidacji trasy')
new_validation = '''  function czyWspolnePolaTrasySaPoprawne(trasa) {
    if (!czyPoprawnyObiekt(trasa) ||
        !trasa.kluczTrasy ||
        !trasa.opisLokalizacji ||
        !trasa.opisZnormalizowany ||
        !trasa.idWezla ||
        !trasa.idWezlaZnormalizowany ||
        !Number.isFinite(Number(trasa.czasDojazduMinuty)) ||
        Number(trasa.czasDojazduMinuty) < 0 ||
        !Number.isFinite(Number(trasa.czasPowrotuMinuty)) ||
        Number(trasa.czasPowrotuMinuty) < 0 ||
        !czyPoprawnyObiekt(trasa.adresLokalizacji) ||
        !DOZWOLONE_ZRODLA_DANYCH.includes(trasa.zrodloDanych) ||
        !trasa.utworzono ||
        !trasa.zaktualizowano ||
        !trasa.ostatnioUzyto) {
      return false;
    }

    try {
      przygotujAdresLokalizacji(trasa.adresLokalizacji);
      przygotujWspolrzedne(trasa.wspolrzedneLokalizacji);
      pobierzNieujemnaLiczbeLubBrak(
        trasa.dystansDojazduMetry,
        "Dystans dojazdu"
      );
      pobierzNieujemnaLiczbeLubBrak(
        trasa.dystansPowrotuMetry,
        "Dystans powrotu"
      );

      return trasa.idWezlaZnormalizowany === pobierzZnormalizowanyIdWezla(
        trasa.idWezla
      ) &&
        trasa.opisZnormalizowany === normalizujOpisLokalizacji(
          trasa.opisLokalizacji
        );
    } catch (bladWalidacji) {
      return false;
    }
  }

  function czyPoprawnaTrasaV2Przed6D2(trasa) {
    if (!czyWspolnePolaTrasySaPoprawne(trasa)) {
      return false;
    }

    try {
      return trasa.kluczTrasy === utworzStaryKluczTrasyV2(
        trasa.opisLokalizacji,
        trasa.idWezla
      );
    } catch (bladWalidacji) {
      return false;
    }
  }

  function czyPoprawnaTrasa(trasa) {
    if (!czyWspolnePolaTrasySaPoprawne(trasa) ||
        !RODZAJE_KLUCZA_LOKALIZACJI.includes(trasa.rodzajKluczaLokalizacji) ||
        !trasa.kluczLokalizacji) {
      return false;
    }

    try {
      const tozsamosc = utworzTozsamoscLokalizacji(
        trasa.opisLokalizacji,
        {
          adresLokalizacji: trasa.adresLokalizacji,
          wspolrzedneLokalizacji: trasa.wspolrzedneLokalizacji
        }
      );

      return trasa.rodzajKluczaLokalizacji === tozsamosc.rodzaj &&
        trasa.kluczLokalizacji === tozsamosc.kluczLokalizacji &&
        trasa.kluczTrasy === pobierzZnormalizowanyIdWezla(trasa.idWezla) +
          "::" + tozsamosc.kluczLokalizacji;
    } catch (bladWalidacji) {
      return false;
    }
  }

  function migrujTraseV1'''
write(path, text[:match.start()] + new_validation + text[match.end():])

# Dodaj pola nowej tożsamości do migracji v1.
replace_once(
    path,
    '''    return {
      kluczTrasy: utworzKluczTrasy(trasa.opisLokalizacji, idWezla),
      opisLokalizacji: pobierzPoprawnyOpis(trasa.opisLokalizacji),''',
    '''    const tozsamosc = utworzTozsamoscLokalizacji(trasa.opisLokalizacji, {});

    return {
      kluczTrasy: utworzKluczTrasy(trasa.opisLokalizacji, idWezla, {}),
      rodzajKluczaLokalizacji: tozsamosc.rodzaj,
      kluczLokalizacji: tozsamosc.kluczLokalizacji,
      opisLokalizacji: pobierzPoprawnyOpis(trasa.opisLokalizacji),'''
)

needle = '''  function pobierzTekstPamieciV1() {'''
insert = '''  function migrujTraseV2DoStabilnegoKlucza(trasa) {
    const adresLokalizacji = przygotujAdresLokalizacji(trasa.adresLokalizacji);
    const wspolrzedneLokalizacji = przygotujWspolrzedne(
      trasa.wspolrzedneLokalizacji
    );
    const tozsamosc = utworzTozsamoscLokalizacji(
      trasa.opisLokalizacji,
      {
        adresLokalizacji: adresLokalizacji,
        wspolrzedneLokalizacji: wspolrzedneLokalizacji
      }
    );

    return Object.assign({}, trasa, {
      kluczTrasy: pobierzZnormalizowanyIdWezla(trasa.idWezla) +
        "::" + tozsamosc.kluczLokalizacji,
      rodzajKluczaLokalizacji: tozsamosc.rodzaj,
      kluczLokalizacji: tozsamosc.kluczLokalizacji,
      adresLokalizacji: adresLokalizacji,
      wspolrzedneLokalizacji: wspolrzedneLokalizacji
    });
  }

  function migrujKsiazkeV2DoStabilnychKluczy(ksiazka) {
    const trasy = [];
    let liczbaScalonychDuplikatow = 0;

    ksiazka.trasy.forEach(function (staraTrasa) {
      const trasa = migrujTraseV2DoStabilnegoKlucza(staraTrasa);
      const indeksDuplikatu = trasy.findIndex(function (istniejacaTrasa) {
        return istniejacaTrasa.kluczTrasy === trasa.kluczTrasy;
      });

      if (indeksDuplikatu !== -1) {
        const poprzedniaTrasa = trasy[indeksDuplikatu];
        trasa.utworzono = poprzedniaTrasa.utworzono || trasa.utworzono;
        trasy.splice(indeksDuplikatu, 1);
        liczbaScalonychDuplikatow += 1;
      }

      trasy.push(trasa);
    });

    return {
      ksiazka: {
        wersja: WERSJA_FORMATU,
        trasy: trasy
      },
      liczbaScalonychDuplikatow: liczbaScalonychDuplikatow
    };
  }

'''
text = read(path)
if needle not in text or 'function migrujTraseV2DoStabilnegoKlucza' in text:
    raise SystemExit('pamiec_tras.js: nie udało się wstawić migracji kluczy v2')
write(path, text.replace(needle, insert + needle, 1))

replace_once(
    path,
    '''    if (!ksiazka.trasy.every(czyPoprawnaTrasa)) {
      usunUszkodzonyZapis();
      return {
        status: "uszkodzony-zapis",
        ksiazka: utworzPustaKsiazke()
      };
    }

    return {
      status: "odczytano",
      ksiazka: ksiazka
    };''',
    '''    if (ksiazka.trasy.every(czyPoprawnaTrasa)) {
      return {
        status: "odczytano",
        ksiazka: ksiazka
      };
    }

    if (ksiazka.trasy.every(function (trasa) {
      return czyPoprawnaTrasa(trasa) || czyPoprawnaTrasaV2Przed6D2(trasa);
    })) {
      try {
        const migracja = migrujKsiazkeV2DoStabilnychKluczy(ksiazka);

        if (!migracja.ksiazka.trasy.every(czyPoprawnaTrasa)) {
          throw new Error("Nie udało się zweryfikować stabilnych kluczy tras.");
        }

        const ograniczona = ograniczKsiazke(migracja.ksiazka);
        const statusZapisu = zapiszTekstPamieci(ograniczona.tekstPamieci);

        return {
          status: "zmigrowano-klucze-6d2",
          statusZapisu: statusZapisu,
          ksiazka: ograniczona.ksiazka,
          liczbaScalonychDuplikatow: migracja.liczbaScalonychDuplikatow
        };
      } catch (bladMigracji) {
        return {
          status: "blad-migracji-kluczy-6d2",
          ksiazka: utworzPustaKsiazke(),
          komunikat: bladMigracji.message
        };
      }
    }

    usunUszkodzonyZapis();
    return {
      status: "uszkodzony-zapis",
      ksiazka: utworzPustaKsiazke()
    };'''
)

# Zastąp konstruktor wpisu, aby klucz wynikał z zachowanych metadanych.
text = read(path)
pattern = re.compile(r'''  function utworzTraseDoZapisu\(daneTrasy, poprzedniaTrasa\) \{[\s\S]*?\n  \}\n\n  function zapiszTrase''')
match = pattern.search(text)
if not match:
    raise SystemExit('pamiec_tras.js: nie znaleziono utworzTraseDoZapisu')
new_block = '''  function utworzTraseDoZapisu(daneTrasy, poprzedniaTrasa) {
    if (!czyPoprawnyObiekt(daneTrasy)) {
      throw new Error("Dane trasy muszą być obiektem.");
    }

    const opisLokalizacji = pobierzPoprawnyOpis(daneTrasy.opisLokalizacji);
    const idWezla = pobierzPoprawneIdWezla(daneTrasy.idWezla);
    const teraz = new Date().toISOString();
    const poprzednia = poprzedniaTrasa || {};
    const zrodloDojazdu = pobierzZrodlo(daneTrasy.zrodloCzasuDojazdu);
    const zrodloPowrotu = pobierzZrodlo(daneTrasy.zrodloCzasuPowrotu);
    const adresLokalizacji = wybierzMetadane(
      daneTrasy.adresLokalizacji,
      poprzednia.adresLokalizacji,
      przygotujAdresLokalizacji
    );
    const wspolrzedneLokalizacji = wybierzMetadane(
      daneTrasy.wspolrzedneLokalizacji,
      poprzednia.wspolrzedneLokalizacji,
      przygotujWspolrzedne
    );
    const tozsamosc = utworzTozsamoscLokalizacji(
      opisLokalizacji,
      {
        adresLokalizacji: adresLokalizacji,
        wspolrzedneLokalizacji: wspolrzedneLokalizacji
      }
    );

    return {
      kluczTrasy: pobierzZnormalizowanyIdWezla(idWezla) +
        "::" + tozsamosc.kluczLokalizacji,
      rodzajKluczaLokalizacji: tozsamosc.rodzaj,
      kluczLokalizacji: tozsamosc.kluczLokalizacji,
      opisLokalizacji: opisLokalizacji,
      opisZnormalizowany: normalizujOpisLokalizacji(opisLokalizacji),
      idWezla: idWezla,
      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),
      adresLokalizacji: adresLokalizacji,
      wspolrzedneLokalizacji: wspolrzedneLokalizacji,
      dystansDojazduMetry: wybierzMetadane(
        daneTrasy.dystansDojazduMetry,
        poprzednia.dystansDojazduMetry,
        function (wartosc) {
          return pobierzNieujemnaLiczbeLubBrak(wartosc, "Dystans dojazdu");
        }
      ),
      dystansPowrotuMetry: wybierzMetadane(
        daneTrasy.dystansPowrotuMetry,
        poprzednia.dystansPowrotuMetry,
        function (wartosc) {
          return pobierzNieujemnaLiczbeLubBrak(wartosc, "Dystans powrotu");
        }
      ),
      czasDojazduMinuty: pobierzCzasPrzejazdu(
        daneTrasy.czasDojazduMinuty,
        "Czas dojazdu"
      ),
      czasPowrotuMinuty: pobierzCzasPrzejazdu(
        daneTrasy.czasPowrotuMinuty,
        "Czas powrotu"
      ),
      zrodloCzasuDojazdu: zrodloDojazdu,
      zrodloCzasuPowrotu: zrodloPowrotu,
      zrodloDanych: pobierzZrodloDanych(
        daneTrasy.zrodloDanych,
        zrodloDojazdu,
        zrodloPowrotu
      ),
      dostawcaDanych: daneTrasy.dostawcaDanych !== undefined
        ? pobierzTekstLubBrak(daneTrasy.dostawcaDanych)
        : pobierzTekstLubBrak(poprzednia.dostawcaDanych),
      utworzono: poprzednia.utworzono || teraz,
      zaktualizowano: teraz,
      ostatnioUzyto: teraz
    };
  }

  function znajdzIndeksyPoDokladnymOpisie(ksiazka, opisLokalizacji, idWezla) {
    const opisZnormalizowany = normalizujOpisLokalizacji(
      pobierzPoprawnyOpis(opisLokalizacji)
    );
    const idWezlaZnormalizowany = pobierzZnormalizowanyIdWezla(idWezla);
    const indeksy = [];

    ksiazka.trasy.forEach(function (trasa, indeksTrasy) {
      if (trasa.idWezlaZnormalizowany === idWezlaZnormalizowany &&
          trasa.opisZnormalizowany === opisZnormalizowany) {
        indeksy.push(indeksTrasy);
      }
    });

    return indeksy;
  }

  function zapiszTrase'''
write(path, text[:match.start()] + new_block + text[match.end():])

# Zastąp zapis i odczyt, zachowując zgodność starego API tylko przy jednoznacznym dokładnym opisie.
text = read(path)
pattern = re.compile(r'''  function zapiszTrase\(daneTrasy\) \{[\s\S]*?\n  \}\n\n  function pobierzTrase\(opisLokalizacji, idWezla\) \{[\s\S]*?\n  \}\n\n  function pobierzListeTras''')
match = pattern.search(text)
if not match:
    raise SystemExit('pamiec_tras.js: nie znaleziono zapisu/odczytu trasy')
new_block = '''  function zapiszTrase(daneTrasy) {
    zapewnijUruchomienie();

    let tozsamoscPodana;
    let kluczPodany;

    try {
      if (!czyPoprawnyObiekt(daneTrasy)) {
        throw new Error("Dane trasy muszą być obiektem.");
      }

      tozsamoscPodana = utworzTozsamoscLokalizacji(
        daneTrasy.opisLokalizacji,
        {
          adresLokalizacji: daneTrasy.adresLokalizacji,
          wspolrzedneLokalizacji: daneTrasy.wspolrzedneLokalizacji
        }
      );
      kluczPodany = utworzKluczTrasy(
        daneTrasy.opisLokalizacji,
        daneTrasy.idWezla,
        {
          adresLokalizacji: daneTrasy.adresLokalizacji,
          wspolrzedneLokalizacji: daneTrasy.wspolrzedneLokalizacji
        }
      );
    } catch (bladDanych) {
      return utworzWynik("blad-zapisu", { komunikat: bladDanych.message });
    }

    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        komunikat: "Nie nadpisano pamięci tras z innej wersji programu."
      });
    }

    const ksiazka = wynikOdczytu.ksiazka;
    let indeksIstniejacejTrasy = ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === kluczPodany;
    });

    if (indeksIstniejacejTrasy === -1 &&
        tozsamoscPodana.rodzaj === "opis-zgodnosciowy") {
      const indeksyPoOpisie = znajdzIndeksyPoDokladnymOpisie(
        ksiazka,
        daneTrasy.opisLokalizacji,
        daneTrasy.idWezla
      );

      if (indeksyPoOpisie.length > 1) {
        return utworzWynik("blad-zapisu", {
          komunikat: "Ten opis pasuje do kilku zapamiętanych lokalizacji. Podaj adres lub współrzędne."
        });
      }

      if (indeksyPoOpisie.length === 1) {
        indeksIstniejacejTrasy = indeksyPoOpisie[0];
      }
    }

    const poprzedniaTrasa = indeksIstniejacejTrasy === -1
      ? null
      : ksiazka.trasy[indeksIstniejacejTrasy];
    let nowaTrasa;

    try {
      nowaTrasa = utworzTraseDoZapisu(daneTrasy, poprzedniaTrasa);
    } catch (bladDanych) {
      return utworzWynik("blad-zapisu", { komunikat: bladDanych.message });
    }

    if (indeksIstniejacejTrasy !== -1) {
      ksiazka.trasy.splice(indeksIstniejacejTrasy, 1);
    }

    const indeksDuplikatuKlucza = ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === nowaTrasa.kluczTrasy;
    });

    if (indeksDuplikatuKlucza !== -1) {
      ksiazka.trasy.splice(indeksDuplikatuKlucza, 1);
    }

    // Najnowszy lub ostatnio używany wpis znajduje się na końcu listy.
    ksiazka.trasy.push(nowaTrasa);
    const ograniczonaKsiazka = ograniczKsiazke(ksiazka);
    const statusZapisu = zapiszTekstPamieci(ograniczonaKsiazka.tekstPamieci);

    return utworzWynik(statusZapisu, {
      trasa: skopiujDane(nowaTrasa),
      liczbaTras: ograniczonaKsiazka.ksiazka.trasy.length,
      liczbaZastapionychTras: ograniczonaKsiazka.liczbaZastapionychTras,
      rozmiarBajtow: ograniczonaKsiazka.rozmiarBajtow
    });
  }

  function pobierzTrase(opisLokalizacji, idWezla, daneLokalizacji) {
    zapewnijUruchomienie();

    let tozsamosc;
    let kluczTrasy;

    try {
      tozsamosc = utworzTozsamoscLokalizacji(
        opisLokalizacji,
        daneLokalizacji
      );
      kluczTrasy = utworzKluczTrasy(
        opisLokalizacji,
        idWezla,
        daneLokalizacji
      );
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

    let indeksZnalezionejTrasy = wynikOdczytu.ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === kluczTrasy;
    });

    if (indeksZnalezionejTrasy === -1 &&
        tozsamosc.rodzaj === "opis-zgodnosciowy") {
      const indeksyPoOpisie = znajdzIndeksyPoDokladnymOpisie(
        wynikOdczytu.ksiazka,
        opisLokalizacji,
        idWezla
      );

      if (indeksyPoOpisie.length > 1) {
        return utworzWynik("niejednoznaczna-lokalizacja", {
          trasa: null,
          liczbaPasujacychTras: indeksyPoOpisie.length,
          komunikat: "Ten opis odpowiada kilku zapamiętanym lokalizacjom. Wymagany jest adres lub współrzędne."
        });
      }

      if (indeksyPoOpisie.length === 1) {
        indeksZnalezionejTrasy = indeksyPoOpisie[0];
      }
    }

    if (indeksZnalezionejTrasy === -1) {
      return utworzWynik("brak-trasy", { trasa: null });
    }

    const znalezionaTrasa = wynikOdczytu.ksiazka.trasy[indeksZnalezionejTrasy];
    znalezionaTrasa.ostatnioUzyto = new Date().toISOString();
    wynikOdczytu.ksiazka.trasy.splice(indeksZnalezionejTrasy, 1);
    wynikOdczytu.ksiazka.trasy.push(znalezionaTrasa);
    const zaktualizowanaKsiazka = ograniczKsiazke(wynikOdczytu.ksiazka);
    const statusAktualizacji = zapiszTekstPamieci(
      zaktualizowanaKsiazka.tekstPamieci
    );

    return utworzWynik("odczytano-trase", {
      trasa: skopiujDane(znalezionaTrasa),
      zrodloOdczytu: "pamiec",
      statusAktualizacji: statusAktualizacji
    });
  }

  function pobierzListeTras'''
write(path, text[:match.start()] + new_block + text[match.end():])

replace_once(
    path,
    '''    utworzKluczTrasy: utworzKluczTrasy,
    zapiszTrase: zapiszTrase,''',
    '''    utworzKluczTrasy: utworzKluczTrasy,
    utworzTozsamoscLokalizacji: utworzTozsamoscLokalizacji,
    zapiszTrase: zapiszTrase,'''
)

# --- js/lokalizacje/lokalizacje.js ---
path = 'js/lokalizacje/lokalizacje.js'
replace_once(
    path,
    '''    // Do czasu wydzielenia osobnego adresu w Etapie 6 bezpieczniej łączymy
    // firmę i pole Budowa, zamiast zgadywać podobieństwo samych nazw obiektów.
    return firma + " | " + miejsce;
  }
''',
    '''    // Opis pozostaje etykietą zgodnościową. Od 6D.2 tożsamość wpisu cache
    // wykorzystuje rzeczywisty adres lub współrzędne, gdy są dostępne.
    return firma + " | " + miejsce;
  }

  function pobierzDaneTozsamosciPamieciBudowy(budowa) {
    const modelLokalizacji = budowa && budowa.modelLokalizacji || {};
    const warstwaLokalizacji = modelLokalizacji.daneRobocze || {};

    return {
      adresLokalizacji: warstwaLokalizacji.adres || null,
      wspolrzedneLokalizacji: warstwaLokalizacji.wspolrzedne || null
    };
  }
'''
)

replace_once(
    path,
    '''    const poprzedniWpis = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      pobierzIdAktywnegoWezla()
    );
    const poprzedniaTrasa = poprzedniWpis.trasa || {};

    const modelLokalizacji = budowa.modelLokalizacji || {};
    const warstwaLokalizacji = modelLokalizacji.daneRobocze || {};''',
    '''    const daneTozsamosci = pobierzDaneTozsamosciPamieciBudowy(budowa);
    const poprzedniWpis = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      pobierzIdAktywnegoWezla(),
      daneTozsamosci
    );
    const poprzedniaTrasa = poprzedniWpis.trasa || {};

    const modelLokalizacji = budowa.modelLokalizacji || {};
    const warstwaLokalizacji = modelLokalizacji.daneRobocze || {};'''
)

# Dwa pozostałe odczyty w pętli i uzupełnianiu dostają dane lokalizacji.
old = '''        const istniejacaTrasa = aplikacja.pamiecTras.pobierzTrase(
          opisLokalizacji,
          pobierzIdAktywnegoWezla()
        );'''
new = '''        const istniejacaTrasa = aplikacja.pamiecTras.pobierzTrase(
          opisLokalizacji,
          pobierzIdAktywnegoWezla(),
          pobierzDaneTozsamosciPamieciBudowy(budowa)
        );'''
replace_once(path, old, new)

old = '''    const wynikOdczytu = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      pobierzIdAktywnegoWezla()
    );'''
new = '''    const wynikOdczytu = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      pobierzIdAktywnegoWezla(),
      pobierzDaneTozsamosciPamieciBudowy(budowa)
    );'''
replace_once(path, old, new)

# --- testy/etap_6d_2.test.js ---
path = 'testy/etap_6d_2.test.js'
if (ROOT / path).exists():
    raise SystemExit(f'{path}: plik już istnieje')
write(path, r'''"use strict";

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
    removeItem: (klucz) => dane.delete(klucz),
    ustaw: (klucz, wartosc) => dane.set(klucz, String(wartosc))
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

function daneTrasy(opis, adres, dojazd, powrot, dodatki) {
  return Object.assign({
    idWezla: "WEZEL-A",
    opisLokalizacji: opis,
    adresLokalizacji: adres ? { tekst: adres } : undefined,
    czasDojazduMinuty: dojazd,
    czasPowrotuMinuty: powrot,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  }, dodatki || {});
}

function sprawdzAdresJakoStabilnyKlucz() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  modul.zapiszTrase(daneTrasy(
    "Firma A | Nazwa pierwsza",
    "ul. Testowa 12, 00-001 Miasto",
    20,
    22
  ));
  modul.zapiszTrase(daneTrasy(
    "Inna firma | Inna nazwa",
    "UL. TESTOWA 12 00-001 MIASTO",
    24,
    26
  ));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 1);
  const wynik = modul.pobierzTrase(
    "Dowolna etykieta",
    "WEZEL-A",
    { adresLokalizacji: { tekst: "ul testowa 12, 00 001 miasto" } }
  );
  assert.equal(wynik.status, "odczytano-trase");
  assert.equal(wynik.trasa.rodzajKluczaLokalizacji, "adres");
  assert.equal(wynik.trasa.czasDojazduMinuty, 24);
}

function sprawdzTaSamaNazwaNieLaczyRoznychAdresow() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  modul.zapiszTrase(daneTrasy("Firma X | Budowa", "Testowa 1, Miasto", 10, 11));
  modul.zapiszTrase(daneTrasy("Firma X | Budowa", "Testowa 2, Miasto", 30, 31));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 2);
  assert.equal(
    modul.pobierzTrase(
      "Firma X | Budowa",
      "WEZEL-A",
      { adresLokalizacji: { tekst: "Testowa 1, Miasto" } }
    ).trasa.czasDojazduMinuty,
    10
  );
  assert.equal(
    modul.pobierzTrase(
      "Firma X | Budowa",
      "WEZEL-A",
      { adresLokalizacji: { tekst: "Testowa 2, Miasto" } }
    ).trasa.czasDojazduMinuty,
    30
  );
  const bezAdresu = modul.pobierzTrase("Firma X | Budowa", "WEZEL-A");
  assert.equal(bezAdresu.status, "niejednoznaczna-lokalizacja");
  assert.equal(bezAdresu.trasa, null);
}

function sprawdzWspolrzedneMajaPierwszenstwo() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const wspolrzedne = {
    szerokoscGeograficzna: 50.85,
    dlugoscGeograficzna: 16.32
  };
  modul.zapiszTrase(daneTrasy(
    "Pierwsza nazwa",
    "Stary adres 1, Miasto",
    15,
    16,
    { wspolrzedneLokalizacji: wspolrzedne }
  ));
  modul.zapiszTrase(daneTrasy(
    "Druga nazwa",
    "Poprawiony adres 99, Miasto",
    18,
    19,
    { wspolrzedneLokalizacji: { szerokoscGeograficzna: "50.8500", dlugoscGeograficzna: "16.3200" } }
  ));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 1);
  const wynik = modul.pobierzTrase(
    "Jeszcze inna nazwa",
    "WEZEL-A",
    { wspolrzedneLokalizacji: wspolrzedne }
  );
  assert.equal(wynik.trasa.rodzajKluczaLokalizacji, "wspolrzedne");
  assert.equal(wynik.trasa.czasDojazduMinuty, 18);
}

function sprawdzZakresWezla() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const adres = { tekst: "Testowa 10, Miasto" };
  modul.zapiszTrase(Object.assign(daneTrasy("Budowa", null, 12, 13), {
    idWezla: "WEZEL-A",
    adresLokalizacji: adres
  }));
  modul.zapiszTrase(Object.assign(daneTrasy("Budowa", null, 32, 33), {
    idWezla: "WEZEL-B",
    adresLokalizacji: adres
  }));

  assert.equal(modul.pobierzStanPamieci().liczbaTras, 2);
  assert.equal(
    modul.pobierzTrase("Budowa", "WEZEL-A", { adresLokalizacji: adres }).trasa.czasDojazduMinuty,
    12
  );
  assert.equal(
    modul.pobierzTrase("Budowa", "WEZEL-B", { adresLokalizacji: adres }).trasa.czasDojazduMinuty,
    32
  );
}

function sprawdzOpisZgodnosciowyPozostajeBezpieczny() {
  const modul = uruchomPamiec(utworzPamiecLokalna());
  const opisowyAdres = {
    tekst: "Plac A",
    czesci: { firma: "Firma A", nazwaBudowy: "Plac A" }
  };
  modul.zapiszTrase(daneTrasy(
    "Firma A | Plac A",
    null,
    21,
    22,
    { adresLokalizacji: opisowyAdres }
  ));

  const lista = modul.pobierzListeTras().trasy;
  assert.equal(lista[0].rodzajKluczaLokalizacji, "opis-zgodnosciowy");
  assert.equal(
    modul.pobierzTrase("Firma A | Plac A etap 2", "WEZEL-A").status,
    "brak-trasy"
  );
}

function sprawdzMigracjeStaregoV2IScalenieDuplikatu() {
  const pamiec = utworzPamiecLokalna();
  const baza = {
    idWezla: "WEZEL-A",
    idWezlaZnormalizowany: "wezel a",
    adresLokalizacji: { tekst: "Testowa 7, 00-001 Miasto", tekstZnormalizowany: null, czesci: {} },
    wspolrzedneLokalizacji: null,
    dystansDojazduMetry: null,
    dystansPowrotuMetry: null,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny",
    zrodloDanych: "reczny",
    dostawcaDanych: null,
    utworzono: "2026-09-02T10:00:00.000Z",
    zaktualizowano: "2026-09-02T10:00:00.000Z",
    ostatnioUzyto: "2026-09-02T10:00:00.000Z"
  };
  const pierwsza = Object.assign({}, baza, {
    kluczTrasy: "wezel a::pierwsza nazwa",
    opisLokalizacji: "Pierwsza nazwa",
    opisZnormalizowany: "pierwsza nazwa",
    czasDojazduMinuty: 11,
    czasPowrotuMinuty: 12
  });
  const druga = Object.assign({}, baza, {
    kluczTrasy: "wezel a::druga nazwa",
    opisLokalizacji: "Druga nazwa",
    opisZnormalizowany: "druga nazwa",
    czasDojazduMinuty: 31,
    czasPowrotuMinuty: 32,
    zaktualizowano: "2026-09-02T11:00:00.000Z",
    ostatnioUzyto: "2026-09-02T11:00:00.000Z"
  });
  pamiec.ustaw(kluczV2, JSON.stringify({ wersja: 2, trasy: [pierwsza, druga] }));

  const modul = uruchomPamiec(pamiec);
  const stan = modul.pobierzStanPamieci();
  assert.equal(stan.liczbaTras, 1);
  const ksiazka = JSON.parse(pamiec.getItem(kluczV2));
  assert.equal(ksiazka.trasy[0].rodzajKluczaLokalizacji, "adres");
  assert.equal(ksiazka.trasy[0].czasDojazduMinuty, 31);
  assert.match(ksiazka.trasy[0].kluczTrasy, /::adres::testowa 7 00 001 miasto$/);
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

function sprawdzIntegracjeBudowZPamiecia() {
  const aplikacja = uruchomAplikacje();
  const budowaA = {
    idBudowy: "B-A",
    firma: "Firma A",
    budowa: "Nazwa A",
    zrodlo: "csv",
    adresZrodlowy: { tekst: "Testowa 15, 00-001 Miasto", czesci: {} },
    czasDojazduRoboczyMinuty: 23,
    czasPowrotuRoboczyMinuty: 25,
    zrodloCzasuDojazdu: "reczny",
    zrodloCzasuPowrotu: "reczny"
  };
  aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci(budowaA);

  const budowaTenSamAdres = {
    idBudowy: "B-B",
    firma: "Inna Firma",
    budowa: "Inna nazwa",
    zrodlo: "csv",
    adresZrodlowy: { tekst: "TESTOWA 15 00-001 MIASTO", czesci: {} }
  };
  const wynikTenSamAdres = aplikacja.lokalizacje.uzupelnijBudoweZPamieci(
    budowaTenSamAdres
  );
  assert.equal(wynikTenSamAdres.czyUzupelniono, true);
  assert.equal(budowaTenSamAdres.czasDojazduRoboczyMinuty, 23);

  const budowaTaSamaNazwaInnyAdres = {
    idBudowy: "B-C",
    firma: "Firma A",
    budowa: "Nazwa A",
    zrodlo: "csv",
    adresZrodlowy: { tekst: "Testowa 99, 00-001 Miasto", czesci: {} }
  };
  const wynikInnyAdres = aplikacja.lokalizacje.uzupelnijBudoweZPamieci(
    budowaTaSamaNazwaInnyAdres
  );
  assert.equal(wynikInnyAdres.czyUzupelniono, false);
  assert.equal(wynikInnyAdres.status, "brak-trasy");
}

function sprawdzDokumentacje() {
  const etapy = wczytaj("ETAPY_ROZWOJU.md");
  const stan = wczytaj("STAN_PROJEKTU.md");
  const plan = wczytaj("testy/TESTY_ETAP_6.md");
  const decyzje = wczytaj("PROJECT_DECISIONS.md");
  const kontrakt = wczytaj("KONTRAKT_LOKALIZACJI_I_TRAS.md");

  assert.match(etapy, /- \[x\] \*\*6D\.2 — stabilny klucz i duplikaty/);
  assert.match(etapy, /Następny niezakończony podetap: \*\*6D\.3/);
  assert.match(stan, /Ostatni zakończony podetap: \*\*6D\.2/);
  assert.match(stan, /106\/106 zestawów testów/);
  assert.match(plan, /### 6D\.2 — stabilny klucz i duplikaty/);
  assert.match(decyzje, /## 128\. Tożsamość pamięci tras preferuje współrzędne i adres/);
  assert.match(kontrakt, /## Stabilny klucz pamięci tras — 6D\.2/);
}

sprawdzAdresJakoStabilnyKlucz();
sprawdzTaSamaNazwaNieLaczyRoznychAdresow();
sprawdzWspolrzedneMajaPierwszenstwo();
sprawdzZakresWezla();
sprawdzOpisZgodnosciowyPozostajeBezpieczny();
sprawdzMigracjeStaregoV2IScalenieDuplikatu();
sprawdzIntegracjeBudowZPamiecia();
sprawdzDokumentacje();

console.log("OK — 6D.2 używa stabilnej tożsamości lokalizacji i nie scala różnych adresów po nazwie.");
''')

# Historyczny test 6D.1 nie zamraża bieżącego następnego kroku ani licznika.
path = 'testy/etap_6d_1.test.js'
text = read(path)
for line in [
    '  assert.match(etapy, /- \\[ \\] \\*\\*6D\\.2 — stabilny klucz i duplikaty/);\n',
    '  assert.match(etapy, /Następny niezakończony podetap: \\*\\*6D\\.2/);\n',
    '  assert.match(stan, /Ostatni zakończony podetap: \\*\\*6D\\.1/);\n',
    '  assert.match(stan, /105\\/105 zestawów testów/);\n'
]:
    text = text.replace(line, '')
write(path, text)

# Plan Etapu 6 oczekuje zakończenia D.1–D.2 i kolejnego D.3.
path = 'testy/etap_6_plan.test.js'
replace_once(
    path,
    '''      const stan = ["A", "B", "C"].includes(litera) ||
        (litera === "D" && numer === 1)
        ? "x"
        : " ";''',
    '''      const stan = ["A", "B", "C"].includes(litera) ||
        (litera === "D" && numer <= 2)
        ? "x"
        : " ";'''
)
replace_once(path, 'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6D\\.2/);', 'assert.match(etapy, /Następny niezakończony podetap: \\*\\*6D\\.3/);')
replace_once(
    path,
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6C i 6D\\.1 zakończone; następny podetap 6D\\.2\\*\\*/',
    '/Etap 6 — Adresy, lokalizacje i trasy — \\*\\*rozpoczęty 2026-09-02; 6A–6C i 6D\\.1–6D\\.2 zakończone; następny podetap 6D\\.3\\*\\*/'
)
replace_once(path, 'assert.match(stan, /Rozpocząć \\*\\*6D\\.2 — stabilny klucz i duplikaty\\*\\*/);', 'assert.match(stan, /Rozpocząć \\*\\*6D\\.3 — cache i lokalne podpowiedzi\\*\\*/);')
replace_once(
    path,
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6C i 6D.1 oraz następny krok 6D.2."',
    '"OK — Etap 6 ma kompletny plan 6A–6J, zakończone 6A–6C i 6D.1–6D.2 oraz następny krok 6D.3."'
)

# --- dokumentacja ---
path = 'ETAPY_ROZWOJU.md'
replace_once(
    path,
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6C i 6D.1 zakończone; następny podetap 6D.2**',
    '- [ ] Etap 6 — Adresy, lokalizacje i trasy — **rozpoczęty 2026-09-02; 6A–6C i 6D.1–6D.2 zakończone; następny podetap 6D.3**'
)
replace_once(
    path,
    '  - [ ] **6D.2 — stabilny klucz i duplikaty:** identyfikować wpis przez węzeł',
    '  - [x] **6D.2 — stabilny klucz i duplikaty:** identyfikować wpis przez węzeł'
)
replace_once(
    path,
    'Następny niezakończony podetap: **6D.2 — stabilny klucz i duplikaty**.',
    'Następny niezakończony podetap: **6D.3 — cache i lokalne podpowiedzi**.'
)
append_once(path, '## Wynik 6D.2 — stabilny klucz i duplikaty', '''
## Wynik 6D.2 — stabilny klucz i duplikaty

- [x] wpis pamięci nadal jest zawsze zakresowany `idWezla`;
- [x] jeżeli są współrzędne, klucz wykorzystuje dokładnie znormalizowaną parę
  współrzędnych i nie zależy od nazwy ani zapisu adresu;
- [x] bez współrzędnych klucz wykorzystuje znormalizowany rzeczywisty adres;
- [x] `Firma | Budowa` pozostaje wyłącznie ścieżką zgodnościową, gdy nie ma
  rzeczywistego adresu ani współrzędnych;
- [x] podobna lub identyczna nazwa z innym adresem nie nadpisuje innej trasy;
- [x] stary interfejs oparty tylko na opisie może użyć dokładnego opisu tylko
  wtedy, gdy wskazuje on najwyżej jeden wpis; przy kilku lokalizacjach wynik
  jest jawnie niejednoznaczny;
- [x] istniejąca książka `v2` sprzed 6D.2 jest przy odczycie bezpiecznie
  przekluczowana, a duplikaty tej samej stabilnej lokalizacji są scalane tak,
  aby nowszy wpis pozostał aktywny;
- [x] format książki pozostaje `v2`; zmienia się semantyka tożsamości wpisu,
  nie kontrakt domenowy wersji `1`;
- [x] nie podłączono dostawcy map ani fuzzy matchingu.

Podetap **6D.2** jest zakończony. Punkt 6D pozostaje otwarty. Następny podetap:
**6D.3 — cache i lokalne podpowiedzi**.
''')

path = 'STAN_PROJEKTU.md'
replace_once(path, '- Ostatni zakończony podetap: **6D.1 — rozszerzenie formatu pamięci**.', '- Ostatni zakończony podetap: **6D.2 — stabilny klucz i duplikaty**.')
replace_once(
    path,
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6C** oraz podetap **6D.1** są zakończone; punkt 6D i cały Etap 6 pozostają otwarte.',
    '- **Etap 6** jest rozpoczęty. Punkty **6A–6C** oraz podetapy **6D.1–6D.2** są zakończone; punkt 6D i cały Etap 6 pozostają otwarte.'
)
replace_once(path, '- Pełna regresja po 6D.1 przechodzi **105/105 zestawów testów**.', '- Pełna regresja po 6D.2 przechodzi **106/106 zestawów testów**.')
replace_once(
    path,
    '- Gdy `v2` nie istnieje, wcześniejsza książka `v1` jest bezpiecznie kopiowana do nowego formatu; oryginalny zapis `v1` pozostaje kopią bezpieczeństwa.',
    '- Gdy `v2` nie istnieje, wcześniejsza książka `v1` jest bezpiecznie kopiowana do nowego formatu; oryginalny zapis `v1` pozostaje kopią bezpieczeństwa.\n- Tożsamość wpisu pamięci tras preferuje współrzędne, potem znormalizowany rzeczywisty adres; opis `Firma | Budowa` jest tylko ścieżką zgodnościową.\n- Ten sam opis przy różnych adresach pozostaje rozdzielony, a opis bez adresu nie wybiera automatycznie między kilkoma zapamiętanymi lokalizacjami.'
)
old_next = '''Rozpocząć **6D.2 — stabilny klucz i duplikaty**. Zmienić identyfikację wpisu tak, aby opierała się na ID węzła oraz znormalizowanym adresie i/lub współrzędnych, a podobna nazwa budowy nie była automatycznie uznawana za tę samą lokalizację. Nadal nie podłączać konkretnego dostawcy map — jego wybór należy do **6E.1**.'''
new_next = '''Rozpocząć **6D.3 — cache i lokalne podpowiedzi**. Przed próbą internetu wykorzystywać stabilną pamięć lokalizacji i tras oraz przygotować bezpieczne wyszukanie znanej budowy offline. Zastosowanie podpowiedzi nie może zgadywać lokalizacji — przy wielu kandydatach wymagany będzie świadomy wybór operatora. Nadal nie podłączać konkretnego dostawcy map — jego wybór należy do **6E.1**.'''
replace_once(path, old_next, new_next)

path = 'KONTRAKT_LOKALIZACJI_I_TRAS.md'
replace_once(
    path,
    'Status: **6A.1–6A.3 i 6B.1–6B.3 oraz całe punkty 6A–6B zakończone 2026-09-02**.',
    'Status: **6A–6C oraz 6D.1–6D.2 zakończone 2026-09-02; następny podetap 6D.3**.'
)
replace_once(
    path,
    '| `js/pamiec/pamiec_tras.js` | Zapisuje wersję `v1` lokalnej książki tras i rozpoznaje dokładny klucz. | Jest wyłącznie trwałą pamięcią przyjętych danych; nie mutuje modelu i nie wyznacza tras. |',
    '| `js/pamiec/pamiec_tras.js` | Zapisuje wersję `v2` lokalnej książki tras i rozpoznaje stabilny klucz zakresowany węzłem. | Jest wyłącznie trwałą pamięcią przyjętych danych; nie mutuje modelu i nie wyznacza tras. |'
)
append_once(path, '## Stabilny klucz pamięci tras — 6D.2', '''
## Stabilny klucz pamięci tras — 6D.2

Format książki pozostaje `v2`, ale tożsamość wpisu nie jest już oparta wyłącznie
na etykiecie `Firma | Budowa`. Klucz ma zawsze zakres `idWezla`, a część
lokalizacyjna jest wybierana deterministycznie w kolejności:

1. dokładna para współrzędnych po normalizacji liczbowej;
2. znormalizowany rzeczywisty adres;
3. dokładnie znormalizowany opis zgodnościowy — tylko gdy brakuje dwóch
   silniejszych danych.

Adres zawierający wyłącznie zgodnościowe części `firma`/`nazwaBudowy` nie jest
udawany jako rzeczywisty adres. Nie stosujemy podobieństwa tekstowego, odległości
współrzędnych ani innych progów fuzzy.

Stare wywołanie `pobierzTrase(opis, idWezla)` pozostaje zgodne: może odnaleźć
wpis przez dokładny opis tylko wtedy, gdy dla danego węzła istnieje najwyżej
jedna taka lokalizacja. Jeżeli ten sam opis występuje przy kilku stabilnych
adresach lub punktach, pamięć zwraca stan `niejednoznaczna-lokalizacja` zamiast
wybierać wpis automatycznie.

Istniejący zapis `v2` sprzed 6D.2 jest rozpoznawany przy pierwszym odczycie,
przekluczowany według powyższej reguły i zapisany ponownie jako `v2`. Jeżeli
kilka starych etykiet prowadzi do dokładnie tego samego stabilnego klucza,
zostaje jeden, najnowszy wpis. Migracja `v1 → v2` z 6D.1 nadal działa, a wpisy
bez adresu i współrzędnych zachowują opis zgodnościowy, więc wcześniejsze ręczne
czasy nie znikają.
''')

path = 'README.md'
marker = 'Plik bez kolumn adresowych nadal działa tak jak wcześniej.'
text = read(path)
if marker not in text:
    raise SystemExit('README.md: brak miejsca na opis 6D.2')
addition = marker + '''\n\nPamięć tras rozpoznaje lokalizację niezależnie od samej nazwy budowy. Dla danego\nwęzła najpierw używa współrzędnych, a gdy ich nie ma — znormalizowanego\nrzeczywistego adresu. Dzięki temu dwie różnie nazwane pozycje pod tym samym\nadresem mogą korzystać z jednego wpisu, a identyczna nazwa użyta przy dwóch\nróżnych adresach nie miesza czasów. `Firma | Budowa` pozostaje tylko zgodnością\ndla starych danych bez adresu; przy kilku takich kandydatach program nie wybiera\ntrasy automatycznie. Nie ma tu dopasowania rozmytego ani zgadywania lokalizacji.'''
write(path, text.replace(marker, addition, 1))

path = 'PROJECT_DECISIONS.md'
append_once(path, '## 128. Tożsamość pamięci tras preferuje współrzędne i adres', '''
## 128. Tożsamość pamięci tras preferuje współrzędne i adres

Od **6D.2** nazwa firmy ani swobodna nazwa budowy nie są podstawowym
identyfikatorem znanej lokalizacji.

Zasady:

- każdy wpis jest zawsze zakresowany stabilnym `idWezla`;
- jeżeli lokalizacja ma współrzędne, dokładna znormalizowana para współrzędnych
  jest najsilniejszą tożsamością wpisu;
- bez współrzędnych używany jest znormalizowany rzeczywisty adres;
- opis `Firma | Budowa` jest dozwolony wyłącznie jako zgodność dla starszych lub
  niepełnych danych bez adresu i współrzędnych;
- identyczna albo podobna nazwa nie może połączyć dwóch różnych adresów;
- brak adresu nie pozwala automatycznie wybrać jednej z kilku lokalizacji o tym
  samym dokładnym opisie;
- normalizacja usuwa wyłącznie techniczne różnice zapisu; nie stosujemy fuzzy
  matchingu ani tolerancji odległości punktów;
- dotychczasowe ręczne czasy bez danych lokalizacyjnych nadal są zachowywane i
  dostępne przez bezpieczną ścieżkę zgodnościową;
- wybór konkretnej usługi mapowej pozostaje zakresem 6E.1.
''')

path = 'testy/TESTY_ETAP_6.md'
replace_once(
    path,
    'i **6B.1–6B.3** oraz całe punkty **6A–6B** są zakończone. Zakończony jest\nrównież cały punkt **6C**. Następny podetap to **6D.1 — rozszerzenie formatu pamięci**.',
    'i **6B.1–6B.3** oraz całe punkty **6A–6B** są zakończone. Zakończony jest\nrównież cały punkt **6C** oraz podetapy **6D.1–6D.2**. Następny podetap to\n**6D.3 — cache i lokalne podpowiedzi**.'
)
append_once(path, '### 6D.2 — stabilny klucz i duplikaty', '''
### 6D.2 — stabilny klucz i duplikaty

Test `testy/etap_6d_2.test.js` sprawdza:

- jeden wpis dla tego samego węzła i tego samego znormalizowanego adresu mimo
  zmiany etykiety firmy lub budowy;
- osobne wpisy dla identycznej nazwy przy różnych adresach;
- pierwszeństwo dokładnych współrzędnych przed tekstem adresu;
- osobny zakres tej samej lokalizacji dla różnych `idWezla`;
- pozostawienie `Firma | Budowa` jako zgodności dla danych bez rzeczywistego
  adresu i brak dopasowania podobnych opisów;
- jawny stan niejednoznaczny, gdy stare wywołanie tylko po opisie pasuje do
  kilku stabilnych lokalizacji;
- migrację istniejącego `v2` sprzed 6D.2 i scalenie duplikatów tego samego
  stabilnego klucza bez utraty najnowszych czasów;
- integrację bramy `aplikacja.lokalizacje`: inna nazwa pod tym samym adresem
  korzysta z cache, a ta sama nazwa pod innym adresem nie;
- aktualizację dokumentacji, **106/106 zestawów testów** i przejście do 6D.3.
''')

print('6D.2 patch prepared')
