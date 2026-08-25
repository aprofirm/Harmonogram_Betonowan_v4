(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;
  let czyTrwaPrzeliczanie = false;
  let stanImportu = aplikacja.importCsv.utworzPustyStanImportu();
  let budowyReczne = [];
  let listaPomp = [];
  let numerOstatniegoImportu = 0;
  let czyOstatniPlanPrzeliczony = false;

  const POLA_BUDOWY_DO_PAMIECI = Object.freeze([
    "idBudowy",
    "firma",
    "budowa",
    "startPlanowanyZrodlowy",
    "startPlanowany",
    "startZadany",
    "startRoboczy",
    "tolerancjaStartuMinuty",
    "najpozniejszyStart",
    "rodzajBetonu",
    "iloscBetonuM3",
    "iloscBetonuLiczbaM3",
    "iloscBetonuBazowaM3",
    "iloscBetonuBazowaLiczbaM3",
    "statusRealizacji",
    "dataPlanowana",
    "rodzajRozladunku",
    "wymaganyWysiegPompyMetry",
    "zrodlo",
    "czasDojazduRoboczyMinuty",
    "czasPowrotuRoboczyMinuty",
    "dodatkowyCzasZaladunkuMinuty",
    "czasRozladunkuRoboczyMinuty",
    "dodatkowyCzasRozladunkuMinuty",
    "dodatkowyOdstepDostawMinuty",
    "czasPrzygotowaniaPompyRoboczyMinuty",
    "czasZakonczeniaObslugiPompyRoboczyMinuty",
    "zrodloCzasuDojazdu",
    "zrodloCzasuPowrotu"
  ]);

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

  function skopiujBudoweDoPamieci(budowa) {
    return POLA_BUDOWY_DO_PAMIECI.reduce(function (kopia, nazwaPola) {
      if (Object.prototype.hasOwnProperty.call(budowa, nazwaPola)) {
        kopia[nazwaPola] = budowa[nazwaPola];
      }

      return kopia;
    }, {});
  }

  function skopiujListeBudowDoPamieci(listaBudow) {
    return (Array.isArray(listaBudow) ? listaBudow : []).map(
      skopiujBudoweDoPamieci
    );
  }

  function utworzDanePlanuDoZapisu() {
    return {
      wersjaStanuAplikacji: 3,
      nazwaPliku: stanImportu.nazwaPliku || null,
      separator: stanImportu.separator || null,
      ostrzezeniaImportu: Array.isArray(stanImportu.ostrzezenia)
        ? stanImportu.ostrzezenia.slice()
        : [],
      budowyZImportu: skopiujListeBudowDoPamieci(stanImportu.budowy),
      budowyReczne: skopiujListeBudowDoPamieci(budowyReczne),
      listaPomp: aplikacja.pompy.skopiujListePomp(listaPomp),
      parametry: aplikacja.interfejs.pobierzWartosciParametrowDoZapisu(),
      czyHarmonogramPrzeliczony: czyOstatniPlanPrzeliczony
    };
  }

  function czyPlanZawieraBudowy(danePlanu) {
    return Boolean(
      danePlanu &&
      ((Array.isArray(danePlanu.budowyZImportu) && danePlanu.budowyZImportu.length) ||
        (Array.isArray(danePlanu.budowyReczne) && danePlanu.budowyReczne.length))
    );
  }

  function pobierzHistorieIOdswiezStan(wynikOstatniejOperacji) {
    const historia = aplikacja.pamiecPlanu.pobierzHistoriePlanow();
    const wynikPamieci = wynikOstatniejOperacji || historia;

    aplikacja.interfejs.pokazStanPamieciPlanu(
      wynikPamieci,
      historia.liczbaZapisow
    );
    return historia;
  }

  function odswiezStanPamieciTras() {
    if (!aplikacja.pamiecTras) {
      return null;
    }

    const stanPamieciTras = aplikacja.pamiecTras.pobierzStanPamieci();
    aplikacja.interfejs.pokazStanPamieciTras(stanPamieciTras);
    return stanPamieciTras;
  }

  function archiwizujKompletneTrasy(opcje) {
    const wynik = aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci(
      pobierzAktualnaListeBudow(),
      opcje
    );

    odswiezStanPamieciTras();
    return wynik;
  }

  function zapiszBiezacyPlan() {
    const wynikZapisu = aplikacja.pamiecPlanu.zapiszPlan(
      utworzDanePlanuDoZapisu()
    );

    pobierzHistorieIOdswiezStan(wynikZapisu);

    if (wynikZapisu.status === "blad-zapisu") {
      zapiszZdarzenieDiagnostyczne(
        "ostrzezenie",
        "blad-automatycznego-zapisu-planu",
        "Nie udało się automatycznie zapisać bieżącego planu."
      );
    }

    return wynikZapisu;
  }

  function oznaczPlanJakoNieprzeliczony(czyOdswiezycWidok) {
    czyOstatniPlanPrzeliczony = false;

    if (czyOdswiezycWidok) {
      aplikacja.interfejs.oznaczWynikJakoNieaktualny();
    }

    return zapiszBiezacyPlan();
  }

  function pobierzAktualnaListeBudow() {
    return aplikacja.budowy.utworzListeRobocza(stanImportu.budowy, budowyReczne);
  }

  function znajdzBudoweDoZmiany(idBudowy) {
    return stanImportu.budowy.concat(budowyReczne).find(function (budowa) {
      return String(budowa.idBudowy) === String(idBudowy);
    });
  }

  function obsluzZmianeCzasowBudowy(idBudowy, nazwaPola, wartosc) {
    try {
      const budowa = znajdzBudoweDoZmiany(idBudowy);

      if (!budowa) {
        throw new Error("Nie znaleziono budowy o ID „" + idBudowy + "”.");
      }

      aplikacja.budowy.zmienCzasRoboczyBudowy(budowa, nazwaPola, wartosc);
      const czyZmienionoCzasTrasy =
        nazwaPola === "czasDojazduRoboczyMinuty" ||
        nazwaPola === "czasPowrotuRoboczyMinuty";
      const wynikPamieciTrasy = czyZmienionoCzasTrasy
        ? aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci(budowa)
        : null;
      oznaczPlanJakoNieprzeliczony(true);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      odswiezStanPamieciTras();
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zmiana-czasow-budowy",
        "Zmieniono robocze czasy budowy.",
        {
          idBudowy: budowa.idBudowy,
          pole: nazwaPola,
          statusPamieciTrasy: wynikPamieciTrasy
            ? wynikPamieciTrasy.status
            : "bez-zmiany-trasy"
        }
      );
      return budowa;
    } catch (blad) {
      aplikacja.interfejs.pokazBladCzasow(blad);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-czasow-budowy",
        "Nie udało się zapisać roboczych czasów budowy."
      );
      return null;
    }
  }

  function obsluzZmianeIlosciBetonuBudowy(
    idBudowy,
    wartosc,
    czyPrzywrocicBazowa
  ) {
    try {
      const budowa = znajdzBudoweDoZmiany(idBudowy);

      if (!budowa) {
        throw new Error("Nie znaleziono budowy o ID „" + idBudowy + "”.");
      }

      if (czyPrzywrocicBazowa) {
        aplikacja.budowy.przywrocBazowaIloscBetonuBudowy(budowa);
      } else {
        aplikacja.budowy.zmienIloscBetonuRoboczaBudowy(budowa, wartosc);
      }

      oznaczPlanJakoNieprzeliczony(true);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        czyPrzywrocicBazowa
          ? "przywrocenie-bazowej-ilosci-betonu"
          : "zmiana-roboczej-ilosci-betonu",
        czyPrzywrocicBazowa
          ? "Przywrócono bazową ilość betonu budowy."
          : "Zmieniono roboczą ilość betonu budowy.",
        { idBudowy: budowa.idBudowy, iloscBetonuM3: budowa.iloscBetonuLiczbaM3 }
      );
      return budowa;
    } catch (blad) {
      aplikacja.interfejs.pokazBladIlosciBetonu(blad);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-ilosci-betonu",
        "Nie udało się zmienić roboczej ilości betonu budowy."
      );
      return null;
    }
  }

  function obsluzZmianeStartuBudowy(idBudowy, wartosc, czyPrzywrocicPlanowany) {
    try {
      const budowa = znajdzBudoweDoZmiany(idBudowy);

      if (!budowa) {
        throw new Error("Nie znaleziono budowy o ID „" + idBudowy + "”.");
      }

      if (czyPrzywrocicPlanowany) {
        aplikacja.budowy.przywrocStartPlanowanyBudowy(budowa);
      } else {
        aplikacja.budowy.zmienStartZadanyBudowy(budowa, wartosc);
      }

      oznaczPlanJakoNieprzeliczony(true);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        czyPrzywrocicPlanowany
          ? "przywrocenie-planowanego-startu-budowy"
          : "zmiana-zadanego-startu-budowy",
        czyPrzywrocicPlanowany
          ? "Przywrócono planowaną godzinę budowy."
          : "Zmieniono zadaną godzinę budowy.",
        { idBudowy: budowa.idBudowy }
      );
      return budowa;
    } catch (blad) {
      aplikacja.interfejs.pokazBladStartuBudowy(blad);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-startu-budowy",
        "Nie udało się zmienić zadanej godziny budowy."
      );
      return null;
    }
  }

  function wykonajPrzeliczenie(opcje) {
    const ustawieniaPrzeliczenia = opcje || {};

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
      czyOstatniPlanPrzeliczony = false;
      const parametry = aplikacja.interfejs.pobierzParametryZFormularza();
      const wynikArchiwizacjiTras =
        ustawieniaPrzeliczenia.czyArchiwizowacTrasy === false
          ? null
          : archiwizujKompletneTrasy();
      const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
        parametry: parametry,
        stanImportu: stanImportu,
        budowyReczne: budowyReczne
      });

      czyOstatniPlanPrzeliczony = true;
      aplikacja.interfejs.pokazWynik(wynik);
      const danePlanu = utworzDanePlanuDoZapisu();
      let wynikZapisu = null;
      let wynikHistorii = null;

      if (ustawieniaPrzeliczenia.czyZapisacBiezacy !== false) {
        wynikZapisu = aplikacja.pamiecPlanu.zapiszPlan(danePlanu);
      }

      if (ustawieniaPrzeliczenia.czyDodacDoHistorii !== false) {
        wynikHistorii = aplikacja.pamiecPlanu.zapiszPlanHistoryczny(danePlanu);
      }

      pobierzHistorieIOdswiezStan(wynikZapisu || wynikHistorii);
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zakonczenie-przeliczania",
        "Przeliczanie harmonogramu zakończyło się poprawnie.",
        {
          czasTrwaniaMs: Date.now() - czasRozpoczecia,
          liczbaBudow: wynik.budowy.length,
          liczbaKursow: wynik.kursy.length,
          trybGruszek: wynik.trybGruszek,
          minimalnaLiczbaGruszek: wynik.minimalnaLiczbaGruszek,
          liczbaDostepnychGruszek: wynik.liczbaDostepnychGruszek,
          liczbaOpoznionychKursow: wynik.gruszki.liczbaOpoznionychKursow,
          maksymalneOpoznienieKursuMinuty:
            wynik.gruszki.maksymalneOpoznienieKursuMinuty,
          liczbaKonfliktow: wynik.konflikty.length,
          statusZapisuPlanu: wynikZapisu ? wynikZapisu.status : "bez-zapisu",
          statusHistorii: wynikHistorii ? wynikHistorii.status : "bez-nowego-zapisu",
          liczbaZarchiwizowanychTras: wynikArchiwizacjiTras
            ? wynikArchiwizacjiTras.liczbaZapisanych
            : 0
        }
      );
    } catch (blad) {
      czyOstatniPlanPrzeliczony = false;
      aplikacja.interfejs.pokazBlad(blad);

      if (ustawieniaPrzeliczenia.czyZapisacBiezacy !== false) {
        zapiszBiezacyPlan();
      }

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

  function obsluzPrzeliczenie() {
    wykonajPrzeliczenie({
      czyZapisacBiezacy: true,
      czyDodacDoHistorii: true
    });
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

      const wynikPamieciTras = aplikacja.lokalizacje.uzupelnijListeBudowZPamieci(
        nowyStanImportu.budowy
      );

      // Nowy plik zastępuje poprzedni import. Budowy ręczne pozostają osobną listą.
      stanImportu = nowyStanImportu;
      const listaBudow = pobierzAktualnaListeBudow();
      aplikacja.interfejs.pokazUdanyImport(stanImportu, listaBudow);
      odswiezStanPamieciTras();
      czyOstatniPlanPrzeliczony = false;
      zapiszBiezacyPlan();
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
          liczbaTrasZPamieci: wynikPamieciTras.liczbaUzupelnionych,
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
      aplikacja.lokalizacje.uzupelnijBudoweZPamieci(budowaReczna);
      budowyReczne = budowyReczne.concat([budowaReczna]);
      aplikacja.interfejs.pokazDodanaBudowe(budowaReczna, pobierzAktualnaListeBudow());
      odswiezStanPamieciTras();
      czyOstatniPlanPrzeliczony = false;
      zapiszBiezacyPlan();
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

  function czyPoprawnaLiczbaPompDoUtworzenia(wartosc) {
    const liczba = Number(wartosc);
    const tekst = String(
      wartosc === null || wartosc === undefined ? "" : wartosc
    ).trim();

    return tekst !== "" &&
      Number.isInteger(liczba) && liczba >= 0;
  }

  function dopasujListePompDoParametrow(parametry) {
    const dane = parametry || {};

    if (
      dane.trybPomp === "mam-okreslona-liczbe" &&
      czyPoprawnaLiczbaPompDoUtworzenia(dane.liczbaDostepnychPomp)
    ) {
      listaPomp = aplikacja.pompy.dopasujLiczbePomp(
        listaPomp,
        dane.liczbaDostepnychPomp,
        dane.poczatekDnia ||
          aplikacja.konfiguracja.parametryDomyslne.poczatekDnia
      );
    }

    aplikacja.interfejs.pokazListePomp(listaPomp, dane.trybPomp);
  }

  function obsluzZmianeParametrow(parametry) {
    dopasujListePompDoParametrow(parametry);
    oznaczPlanJakoNieprzeliczony(true);
    aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
    zapiszZdarzenieDiagnostyczne(
      "informacja",
      "zmiana-parametrow-planu",
      "Zmieniono parametry planu."
    );
  }

  function obsluzZmianePompy(idPompy, nazwaPola, wartosc) {
    try {
      listaPomp = aplikacja.pompy.zmienDanePompy(
        listaPomp,
        idPompy,
        nazwaPola,
        wartosc
      );
      aplikacja.interfejs.pokazListePomp(
        listaPomp,
        aplikacja.interfejs.pobierzWartosciParametrowDoZapisu().trybPomp
      );
      oznaczPlanJakoNieprzeliczony(true);
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zmiana-danych-pompy",
        "Zmieniono dane pompy.",
        { idPompy: idPompy, pole: nazwaPola }
      );
      return listaPomp;
    } catch (blad) {
      aplikacja.interfejs.pokazBladPompy(blad);
      aplikacja.interfejs.pokazListePomp(
        listaPomp,
        aplikacja.interfejs.pobierzWartosciParametrowDoZapisu().trybPomp
      );
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-danych-pompy",
        "Nie udało się zapisać danych pompy."
      );
      return null;
    }
  }

  function obsluzZmianeWymaganegoWysieguPompy(idBudowy, wartosc) {
    try {
      const budowa = znajdzBudoweDoZmiany(idBudowy);

      if (!budowa) {
        throw new Error("Nie znaleziono budowy o ID „" + idBudowy + "”.");
      }

      aplikacja.pompy.zmienWymaganyWysiegPompyBudowy(budowa, wartosc);
      oznaczPlanJakoNieprzeliczony(true);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zmiana-wymaganego-wysiegu-pompy",
        "Zmieniono wymagany wysięg pompy dla budowy.",
        {
          idBudowy: idBudowy,
          wymaganyWysiegPompyMetry: budowa.wymaganyWysiegPompyMetry
        }
      );
      return budowa;
    } catch (blad) {
      aplikacja.interfejs.pokazBladPompy(blad);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-wymaganego-wysiegu-pompy",
        "Nie udało się zapisać wymaganego wysięgu pompy."
      );
      return null;
    }
  }

  function obsluzZmianeCzasowPompyBudowy(idBudowy, daneCzasow) {
    try {
      const budowa = znajdzBudoweDoZmiany(idBudowy);

      if (!budowa) {
        throw new Error("Nie znaleziono budowy o ID „" + idBudowy + "”.");
      }

      aplikacja.pompy.zmienCzasyObslugiPompyBudowy(budowa, daneCzasow);
      oznaczPlanJakoNieprzeliczony(true);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "zmiana-czasow-obslugi-pompy",
        "Zmieniono czasy obsługi pompy dla budowy.",
        {
          idBudowy: idBudowy,
          czasPrzygotowaniaPompyRoboczyMinuty:
            budowa.czasPrzygotowaniaPompyRoboczyMinuty,
          czasZakonczeniaObslugiPompyRoboczyMinuty:
            budowa.czasZakonczeniaObslugiPompyRoboczyMinuty
        }
      );
      return budowa;
    } catch (blad) {
      aplikacja.interfejs.pokazBladPompy(blad);
      aplikacja.interfejs.pokazListeBudow(pobierzAktualnaListeBudow());
      zapiszBladDiagnostyczny(
        blad,
        "blad-zmiany-czasow-obslugi-pompy",
        "Nie udało się zapisać czasów obsługi pompy."
      );
      return null;
    }
  }

  function utworzStanImportuZPamieci(danePlanu) {
    return {
      nazwaPliku: danePlanu.nazwaPliku || null,
      separator: danePlanu.separator || null,
      wierszeZrodlowe: [],
      budowy: skopiujListeBudowDoPamieci(danePlanu.budowyZImportu),
      ostrzezenia: Array.isArray(danePlanu.ostrzezeniaImportu)
        ? danePlanu.ostrzezeniaImportu.slice()
        : []
    };
  }

  function przywrocDanePlanu(danePlanu, czyPrzeliczycPonownie) {
    if (!danePlanu || typeof danePlanu !== "object" || Array.isArray(danePlanu)) {
      throw new Error("Zapisany plan nie zawiera poprawnego stanu aplikacji.");
    }

    numerOstatniegoImportu += 1;
    stanImportu = utworzStanImportuZPamieci(danePlanu);
    budowyReczne = skopiujListeBudowDoPamieci(danePlanu.budowyReczne);
    const zapisanePompy = Array.isArray(danePlanu.listaPomp)
      ? danePlanu.listaPomp
      : [];
    const liczbaMigrowanychWysiegowPomp = zapisanePompy.filter(function (pompa) {
      const wysieg = pompa && pompa.wysiegMetry;
      return wysieg === null ||
        wysieg === undefined ||
        String(wysieg).trim() === "";
    }).length;
    listaPomp = aplikacja.pompy.normalizujListePomp(
      danePlanu.listaPomp,
      danePlanu.parametry && danePlanu.parametry.poczatekDnia
    );
    const zapisanyCzasRozladunku = Number(
      danePlanu.parametry && danePlanu.parametry.czasRozladunkuMinuty
    );
    const czasRozladunkuDoMigracji =
      Number.isFinite(zapisanyCzasRozladunku) && zapisanyCzasRozladunku > 0
        ? zapisanyCzasRozladunku
        : aplikacja.konfiguracja.parametryDomyslne.czasRozladunkuMinuty;
    let liczbaMigrowanychCzasowRozladunku = 0;
    let liczbaMigrowanychStartowZadanych = 0;
    let liczbaMigrowanychWymaganWysiegu = 0;

    stanImportu.budowy.concat(budowyReczne).forEach(function (budowa) {
      const czyBrakujeStartuZadanego =
        !Object.prototype.hasOwnProperty.call(budowa, "startZadany");
      const zapisanyWymaganyWysieg = budowa.wymaganyWysiegPompyMetry;
      const czyWymagaMigracjiWysiegu =
        aplikacja.pompy.czyBudowaWymagaPompy(budowa) &&
        (
          zapisanyWymaganyWysieg === null ||
          zapisanyWymaganyWysieg === undefined ||
          String(zapisanyWymaganyWysieg).trim() === "" ||
          Number(zapisanyWymaganyWysieg) <
            aplikacja.pompy.DOMYSLNY_WYSIEG_POMPY_METRY
        );
      const czyWymagaMigracji =
        !Object.prototype.hasOwnProperty.call(
          budowa,
          "czasRozladunkuRoboczyMinuty"
        ) || Number(budowa.dodatkowyCzasRozladunkuMinuty) !== 0;

      aplikacja.budowy.uzupelnijStartZadanyBudowy(budowa);
      aplikacja.budowy.migrujCzasRozladunkuBudowy(
        budowa,
        czasRozladunkuDoMigracji
      );
      aplikacja.pompy.uzupelnijWymaganyWysiegPompyBudowy(budowa);

      if (czyBrakujeStartuZadanego) {
        liczbaMigrowanychStartowZadanych += 1;
      }

      if (czyWymagaMigracjiWysiegu) {
        liczbaMigrowanychWymaganWysiegu += 1;
      }

      if (czyWymagaMigracji) {
        liczbaMigrowanychCzasowRozladunku += 1;
      }
    });
    stanImportu.budowy.forEach(aplikacja.budowy.uzupelnijBazowaIloscBetonu);
    budowyReczne.forEach(aplikacja.budowy.uzupelnijBazowaIloscBetonu);
    czyOstatniPlanPrzeliczony = Boolean(danePlanu.czyHarmonogramPrzeliczony);
    const wynikMigracjiTras = archiwizujKompletneTrasy({
      tylkoBrakujace: true
    });

    aplikacja.interfejs.pokazPrzywroconyPlan(
      stanImportu,
      pobierzAktualnaListeBudow(),
      danePlanu.parametry || {},
      czyOstatniPlanPrzeliczony,
      listaPomp
    );

    if (
      liczbaMigrowanychCzasowRozladunku > 0 ||
      liczbaMigrowanychStartowZadanych > 0 ||
      liczbaMigrowanychWysiegowPomp > 0 ||
      liczbaMigrowanychWymaganWysiegu > 0
    ) {
      zapiszBiezacyPlan();
    }

    if (liczbaMigrowanychCzasowRozladunku > 0) {
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "migracja-czasow-rozladunku",
        "Przeniesiono czasy rozładunku ze starszego formatu planu.",
        { liczbaBudow: liczbaMigrowanychCzasowRozladunku }
      );
    }

    if (liczbaMigrowanychStartowZadanych > 0) {
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "migracja-startow-zadanych",
        "Uzupełniono godziny zadane w budowach ze starszego planu.",
        { liczbaBudow: liczbaMigrowanychStartowZadanych }
      );
    }

    if (
      liczbaMigrowanychWysiegowPomp > 0 ||
      liczbaMigrowanychWymaganWysiegu > 0
    ) {
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "migracja-wysiegow-pomp",
        "Uzupełniono standardowy wysięg pomp 32 m w starszym planie.",
        {
          liczbaPomp: liczbaMigrowanychWysiegowPomp,
          liczbaBudow: liczbaMigrowanychWymaganWysiegu
        }
      );
    }

    if (czyPrzeliczycPonownie && czyOstatniPlanPrzeliczony) {
      wykonajPrzeliczenie({
        czyZapisacBiezacy: false,
        czyDodacDoHistorii: false,
        czyArchiwizowacTrasy: false
      });
    }

    return wynikMigracjiTras;
  }

  function obsluzWczytanieZapisuHistorycznego(idZapisu) {
    const wynikOdczytu = aplikacja.pamiecPlanu.odczytajPlanHistoryczny(idZapisu);

    if (!wynikOdczytu.danePlanu) {
      zapiszZdarzenieDiagnostyczne(
        "ostrzezenie",
        "brak-zapisu-historycznego",
        "Nie udało się odczytać wybranego zapisu historycznego.",
        { idZapisu: idZapisu, status: wynikOdczytu.status }
      );
      return;
    }

    const czyPotwierdzono = typeof zakresGlobalny.confirm === "function" &&
      zakresGlobalny.confirm(
        "Wczytać wybrany zapis historyczny? Bieżący plan zostanie wcześniej " +
        "zabezpieczony, jeżeli różni się od wybranej wersji."
      );

    if (!czyPotwierdzono) {
      return;
    }

    try {
      const biezacyPlan = utworzDanePlanuDoZapisu();
      const czyBiezacyJestInny =
        JSON.stringify(biezacyPlan) !== JSON.stringify(wynikOdczytu.danePlanu);

      if (czyPlanZawieraBudowy(biezacyPlan) && czyBiezacyJestInny) {
        aplikacja.pamiecPlanu.zapiszPlanHistoryczny(biezacyPlan);
      }

      przywrocDanePlanu(wynikOdczytu.danePlanu, false);
      const wynikZapisu = aplikacja.pamiecPlanu.zapiszPlan(
        utworzDanePlanuDoZapisu()
      );
      aplikacja.interfejs.zamknijOknoHistorii();
      pobierzHistorieIOdswiezStan(wynikZapisu);

      if (czyOstatniPlanPrzeliczony) {
        wykonajPrzeliczenie({
          czyZapisacBiezacy: false,
          czyDodacDoHistorii: false,
          czyArchiwizowacTrasy: false
        });
      }

      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "wczytanie-zapisu-historycznego",
        "Wczytano historyczny zapis planu.",
        { idZapisu: idZapisu, zapisano: wynikOdczytu.zapisano }
      );
    } catch (blad) {
      aplikacja.interfejs.pokazBlad(blad);
      zapiszBladDiagnostyczny(
        blad,
        "blad-wczytania-historii",
        "Nie udało się przywrócić historycznego planu."
      );
    }
  }

  function obsluzOtwarcieHistorii() {
    const historia = aplikacja.pamiecPlanu.pobierzHistoriePlanow();

    aplikacja.interfejs.pokazHistoriePlanow(
      historia.zapisy,
      obsluzWczytanieZapisuHistorycznego
    );
    aplikacja.interfejs.pokazStanPamieciPlanu(historia, historia.liczbaZapisow);
  }

  function obsluzWyczyszczeniePlanu() {
    const czyPotwierdzono = typeof zakresGlobalny.confirm === "function" &&
      zakresGlobalny.confirm(
        "Wyczyścić bieżący plan dnia? Historia zapisów i diagnostyka pozostaną."
      );

    if (!czyPotwierdzono) {
      return;
    }

    numerOstatniegoImportu += 1;
    stanImportu = aplikacja.importCsv.utworzPustyStanImportu();
    budowyReczne = [];
    listaPomp = [];
    czyOstatniPlanPrzeliczony = false;

    const wynikUsuniecia = aplikacja.pamiecPlanu.usunBiezacyPlan();
    aplikacja.interfejs.wyczyscPlan(aplikacja.konfiguracja.parametryDomyslne);
    pobierzHistorieIOdswiezStan(wynikUsuniecia);
    zapiszZdarzenieDiagnostyczne(
      "informacja",
      "wyczyszczenie-planu-dnia",
      "Wyczyszczono bieżący plan dnia bez usuwania historii i diagnostyki."
    );
  }

  function uruchomIOdtworzPamiecPlanu() {
    const stanPamieci = aplikacja.pamiecPlanu.uruchomPamiecPlanu();
    const historia = pobierzHistorieIOdswiezStan(stanPamieci);
    const zapisanyPlan = aplikacja.pamiecPlanu.odczytajPlan();

    if (zapisanyPlan.status !== "odczytano") {
      if (zapisanyPlan.status !== "brak-zapisu") {
        zapiszZdarzenieDiagnostyczne(
          "ostrzezenie",
          "pominiety-zapis-planu",
          "Nie przywrócono bieżącego planu z pamięci.",
          { status: zapisanyPlan.status }
        );
      }

      aplikacja.interfejs.pokazStanPamieciPlanu(
        zapisanyPlan.status === "brak-zapisu" ? stanPamieci : zapisanyPlan,
        historia.liczbaZapisow
      );
      return;
    }

    try {
      przywrocDanePlanu(zapisanyPlan.danePlanu, true);
      zapiszZdarzenieDiagnostyczne(
        "informacja",
        "odtworzenie-planu-po-uruchomieniu",
        "Przywrócono bieżący plan z pamięci przeglądarki.",
        {
          zapisano: zapisanyPlan.zapisano,
          czyHarmonogramPrzeliczony: czyOstatniPlanPrzeliczony
        }
      );
    } catch (blad) {
      aplikacja.pamiecPlanu.usunBiezacyPlan();
      zapiszBladDiagnostyczny(
        blad,
        "blad-odtworzenia-planu",
        "Zapisany plan został pominięty, ponieważ nie można go odtworzyć."
      );
    }
  }

  function uruchomAplikacje() {
    try {
      aplikacja.interfejs.uruchomInterfejs(
        aplikacja.konfiguracja.parametryDomyslne,
        obsluzPrzeliczenie,
        obsluzImportPliku,
        obsluzDodanieBudowyRecznej,
        obsluzZmianeCzasowBudowy,
        obsluzZmianeIlosciBetonuBudowy,
        obsluzZmianeParametrow,
        obsluzWyczyszczeniePlanu,
        obsluzOtwarcieHistorii,
        obsluzZmianeStartuBudowy,
        obsluzZmianePompy,
        obsluzZmianeWymaganegoWysieguPompy,
        obsluzZmianeCzasowPompyBudowy
      );
      aplikacja.pamiecTras.uruchomPamiecTras();
      odswiezStanPamieciTras();
      uruchomIOdtworzPamiecPlanu();
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
