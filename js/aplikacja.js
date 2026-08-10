(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;
  let czyTrwaPrzeliczanie = false;
  let stanImportu = aplikacja.importCsv.utworzPustyStanImportu();
  let budowyReczne = [];
  let numerOstatniegoImportu = 0;

  function zapiszZdarzenieDiagnostyczne(poziom, kod, opis, szczegoly) {
    if (aplikacja.diagnostyka) {
      aplikacja.diagnostyka.zapiszZdarzenie(poziom, kod, opis, szczegoly);
    }
  }

  function zapiszBladDiagnostyczny(blad, kod, opis, szczegoly) {
    if (aplikacja.diagnostyka) {
      aplikacja.diagnostyka.zapiszBlad(blad, kod, opis, szczegoly);
    }
  }

  function pobierzNaglowkiPliku(stan) {
    if (!stan.wierszeZrodlowe || !stan.wierszeZrodlowe.length) {
      return [];
    }

    return Object.keys(stan.wierszeZrodlowe[0]);
  }

  function pobierzAktualnaListeBudow() {
    return aplikacja.budowy.utworzListeRobocza(stanImportu.budowy, budowyReczne);
  }

  function obsluzPrzeliczenie() {
    if (czyTrwaPrzeliczanie) {
      zapiszZdarzenieDiagnostyczne(
        "ostrzezenie",
        "pominiete-podwojne-przeliczenie",
        "Pominięto kolejne kliknięcie, ponieważ przeliczanie już trwało."
      );
      return;
    }

    const czasRozpoczecia = Date.now();
    czyTrwaPrzeliczanie = true;
    aplikacja.interfejs.pokazTrwajacePrzeliczenie();
    zapiszZdarzenieDiagnostyczne(
      "informacja",
      "rozpoczecie-przeliczania",
      "Rozpoczęto przeliczanie harmonogramu.",
      { liczbaBudow: pobierzAktualnaListeBudow().length }
    );

    try {
      const parametry = aplikacja.interfejs.pobierzParametryZFormularza();
      const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
        parametry: parametry,
        stanImportu: stanImportu,
        budowyReczne: budowyReczne
      });

      aplikacja.interfejs.pokazWynik(wynik);
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zakonczenie-przeliczania",
        "Przeliczanie harmonogramu zakończyło się poprawnie.",
        {
          czasTrwaniaMs: Date.now() - czasRozpoczecia,
          liczbaBudow: wynik.budowy.length,
          liczbaKursow: wynik.kursy.length,
          liczbaKonfliktow: wynik.konflikty.length
        }
      );
    } catch (blad) {
      aplikacja.interfejs.pokazBlad(blad);
      zapiszBladDiagnostyczny(
        blad,
        "blad-przeliczania",
        "Przeliczanie harmonogramu zakończyło się błędem.",
        { czasTrwaniaMs: Date.now() - czasRozpoczecia }
      );
    } finally {
      czyTrwaPrzeliczanie = false;
      aplikacja.interfejs.zakonczPrzeliczenie();
    }
  }

  function obsluzImportPliku(plik) {
    const czasRozpoczecia = Date.now();
    const opisPliku = {
      nazwaPliku: plik && plik.name ? plik.name : "nieznany plik",
      rozmiarBajtow: plik && Number.isFinite(plik.size) ? plik.size : null
    };

    numerOstatniegoImportu += 1;
    const numerBiezacegoImportu = numerOstatniegoImportu;
    aplikacja.interfejs.pokazTrwajacyImport(plik && plik.name);
    zapiszZdarzenieDiagnostyczne(
      "informacja",
      "rozpoczecie-importu",
      "Rozpoczęto import pliku CSV.",
      opisPliku
    );

    return aplikacja.importCsv.importujPlik(plik).then(function (nowyStanImportu) {
      if (numerBiezacegoImportu !== numerOstatniegoImportu) {
        zapiszZdarzenieDiagnostyczne(
          "ostrzezenie",
          "pominiety-starszy-import",
          "Pominięto wynik starszego importu po wybraniu kolejnego pliku.",
          opisPliku
        );
        return null;
      }

      const identyfikatoryReczne = new Set(
        budowyReczne.map(function (budowa) {
          return budowa.idBudowy;
        })
      );
      const konfliktId = nowyStanImportu.budowy.find(function (budowa) {
        return identyfikatoryReczne.has(budowa.idBudowy);
      });

      if (konfliktId) {
        throw new Error(
          "ID_Budowy „" + konfliktId.idBudowy +
            "” jest już używane przez budowę dodaną ręcznie."
        );
      }

      // Nowy plik zastępuje poprzedni import. Budowy ręczne pozostają osobną listą.
      stanImportu = nowyStanImportu;
      const listaBudow = pobierzAktualnaListeBudow();
      aplikacja.interfejs.pokazUdanyImport(stanImportu, listaBudow);
      zapiszZdarzenieDiagnostyczne(
        stanImportu.ostrzezenia.length ? "ostrzezenie" : "informacja",
        "zakonczenie-importu",
        stanImportu.ostrzezenia.length
          ? "Import CSV zakończył się z ostrzeżeniem."
          : "Import CSV zakończył się poprawnie.",
        Object.assign({}, opisPliku, {
          czasTrwaniaMs: Date.now() - czasRozpoczecia,
          separator: stanImportu.separator,
          liczbaBudow: stanImportu.budowy.length,
          liczbaOstrzezen: stanImportu.ostrzezenia.length,
          naglowkiKolumn: pobierzNaglowkiPliku(stanImportu)
        })
      );
      return stanImportu;
    }).catch(function (blad) {
      if (numerBiezacegoImportu === numerOstatniegoImportu) {
        aplikacja.interfejs.pokazBladImportu(blad);
        zapiszBladDiagnostyczny(
          blad,
          "blad-importu",
          "Import CSV zakończył się błędem.",
          Object.assign({}, opisPliku, {
            czasTrwaniaMs: Date.now() - czasRozpoczecia
          })
        );
      }
      return null;
    }).finally(function () {
      if (numerBiezacegoImportu === numerOstatniegoImportu) {
        aplikacja.interfejs.wyczyscWyborPliku();
      }
    });
  }

  function obsluzDodanieBudowyRecznej(daneBudowy) {
    try {
      const budowaReczna = aplikacja.budowy.utworzBudoweReczna(
        daneBudowy,
        pobierzAktualnaListeBudow()
      );
      budowyReczne = budowyReczne.concat([budowaReczna]);
      aplikacja.interfejs.pokazDodanaBudowe(budowaReczna, pobierzAktualnaListeBudow());
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "dodanie-budowy-recznej",
        "Dodano budowę ręcznie.",
        { idBudowy: budowaReczna.idBudowy }
      );
      return budowaReczna;
    } catch (blad) {
      aplikacja.interfejs.pokazBladDanych(blad);
      zapiszBladDiagnostyczny(
        blad,
        "blad-budowy-recznej",
        "Nie udało się dodać budowy ręcznie."
      );
      return null;
    }
  }

  function uruchomAplikacje() {
    try {
      aplikacja.interfejs.uruchomInterfejs(
        aplikacja.konfiguracja.parametryDomyslne,
        obsluzPrzeliczenie,
        obsluzImportPliku,
        obsluzDodanieBudowyRecznej
      );
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "interfejs-gotowy",
        "Interfejs aplikacji jest gotowy do pracy."
      );
    } catch (blad) {
      zapiszBladDiagnostyczny(
        blad,
        "blad-uruchomienia-interfejsu",
        "Nie udało się uruchomić interfejsu aplikacji."
      );
      throw blad;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", uruchomAplikacje);
  } else {
    uruchomAplikacje();
  }
})(window);
