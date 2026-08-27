(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.pompy) {
    throw new Error("Moduł przydziału pomp wymaga wcześniejszego załadowania modułu pomp.");
  }

  const pompy = aplikacja.pompy;

  function pobierzPlanowanyStartBetonowania(budowa, listaKursow) {
    if (!pompy.czyBudowaWymagaPompy(budowa)) {
      return null;
    }

    const oknoBetonowania = pompy.wyznaczPlanowaneOknoBetonowaniaBudowy(
      budowa,
      listaKursow
    );

    if (!oknoBetonowania) {
      return null;
    }

    const minutaStartu = Number(oknoBetonowania.minutaRozpoczeciaBetonowania);

    if (!Number.isFinite(minutaStartu)) {
      throw new Error(
        "Budowa „" + String(budowa && budowa.idBudowy || "bez ID") +
          "” nie ma poprawnego planowanego początku betonowania dla przydziału pompy."
      );
    }

    return minutaStartu;
  }

  function uporzadkujBudowyDoPrzydzialuPomp(listaBudow, listaKursow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const kursy = Array.isArray(listaKursow) ? listaKursow : [];

    return budowy
      .map(function (budowa, indeksWejsciowy) {
        const minutaPlanowanegoStartuBetonowania =
          pobierzPlanowanyStartBetonowania(budowa, kursy);

        if (minutaPlanowanegoStartuBetonowania === null) {
          return null;
        }

        return {
          budowa: budowa,
          indeksWejsciowy: indeksWejsciowy,
          minutaPlanowanegoStartuBetonowania:
            minutaPlanowanegoStartuBetonowania
        };
      })
      .filter(function (pozycja) {
        return pozycja !== null;
      })
      .sort(function (lewa, prawa) {
        const roznicaStartu =
          lewa.minutaPlanowanegoStartuBetonowania -
          prawa.minutaPlanowanegoStartuBetonowania;

        return roznicaStartu || lewa.indeksWejsciowy - prawa.indeksWejsciowy;
      })
      .map(function (pozycja, indeksKolejnosci) {
        return {
          budowa: pozycja.budowa,
          indeksWejsciowy: pozycja.indeksWejsciowy,
          kolejnoscPrzydzialuPompy: indeksKolejnosci + 1,
          minutaPlanowanegoStartuBetonowania:
            pozycja.minutaPlanowanegoStartuBetonowania
        };
      });
  }

  function utworzStanPompy(pompa) {
    return {
      pompa: pompa,
      ostatniPrzydzial: null,
      przydzialy: [],
      liczbaPrzydzialow: 0
    };
  }

  function pobierzGraniceOkresuZajetosci(okresZajetosci, opisOkresu) {
    const okres = okresZajetosci && typeof okresZajetosci === "object"
      ? okresZajetosci
      : {};
    const minutaRozpoczecia = Number(okres.minutaRozpoczeciaZajetosci);
    const minutaZakonczenia = Number(okres.minutaZakonczeniaZajetosci);
    const opis = opisOkresu || "Okres zajętości pompy";

    if (
      !Number.isFinite(minutaRozpoczecia) ||
      !Number.isFinite(minutaZakonczenia) ||
      minutaZakonczenia < minutaRozpoczecia
    ) {
      throw new Error(
        opis + " musi mieć poprawny początek i koniec pełnego cyklu pompy."
      );
    }

    return {
      minutaRozpoczecia: minutaRozpoczecia,
      minutaZakonczenia: minutaZakonczenia
    };
  }

  function czyOkresyZajetosciPompKoliduja(
    pierwszyOkres,
    drugiOkres
  ) {
    const pierwszeGranice = pobierzGraniceOkresuZajetosci(
      pierwszyOkres,
      "Pierwszy okres zajętości pompy"
    );
    const drugieGranice = pobierzGraniceOkresuZajetosci(
      drugiOkres,
      "Drugi okres zajętości pompy"
    );

    // Traktujemy okresy jak przedziały domknięte z lewej i otwarte z prawej.
    // Dzięki temu koniec poprzedniej pracy może być początkiem kolejnej.
    return pierwszeGranice.minutaRozpoczecia <
        drugieGranice.minutaZakonczenia &&
      drugieGranice.minutaRozpoczecia <
        pierwszeGranice.minutaZakonczenia;
  }

  function pobierzPrzydzialyZeStanuPompy(stanPompy) {
    if (Array.isArray(stanPompy && stanPompy.przydzialy)) {
      return stanPompy.przydzialy;
    }

    return stanPompy && stanPompy.ostatniPrzydzial
      ? [stanPompy.ostatniPrzydzial]
      : [];
  }

  function znajdzKolidujacyPrzydzialPompy(stanPompy, okresZajetosci) {
    return pobierzPrzydzialyZeStanuPompy(stanPompy).find(
      function (przydzial) {
        return czyOkresyZajetosciPompKoliduja(
          przydzial.okresZajetosci,
          okresZajetosci
        );
      }
    ) || null;
  }

  function pobierzWymaganyWysiegPompy(budowa) {
    const wymaganyWysieg = Number(
      pompy.pobierzWymaganyWysiegPompyBudowy(budowa)
    );

    if (!Number.isFinite(wymaganyWysieg) || wymaganyWysieg <= 0) {
      throw new Error(
        "Budowa „" + String(budowa && budowa.idBudowy || "bez ID") +
          "” nie ma poprawnego wymaganego wysięgu pompy."
      );
    }

    return wymaganyWysieg;
  }

  function pobierzDanePrzejazduZOpcji(
    opcje,
    pompa,
    budowaZrodlowa,
    budowaDocelowa
  ) {
    if (!opcje || typeof opcje.pobierzDanePrzejazdu !== "function") {
      return null;
    }

    const danePrzejazdu = opcje.pobierzDanePrzejazdu({
      idPompy: pompa.idPompy,
      pompa: pompa,
      budowaZrodlowa: budowaZrodlowa,
      budowaDocelowa: budowaDocelowa
    });

    if (danePrzejazdu === null || danePrzejazdu === undefined) {
      return null;
    }

    if (
      typeof danePrzejazdu !== "object" ||
      Array.isArray(danePrzejazdu)
    ) {
      throw new Error(
        "Dane przejazdu pompy muszą być obiektem albo wartością pustą."
      );
    }

    return danePrzejazdu;
  }

  function utworzOdrzuceniePompy(pompa, powod, szczegoly) {
    return Object.assign({
      idPompy: pompa.idPompy,
      nazwaPompy: pompa.nazwa,
      czyPasuje: false,
      powodOdrzucenia: powod
    }, szczegoly || {});
  }

  function sprawdzCzyPompaPasujeDoBudowy(
    stanPompy,
    budowa,
    okresZajetosci,
    listaKursow,
    opcje
  ) {
    const pompa = stanPompy.pompa;
    const wymaganyWysiegPompyMetry = pobierzWymaganyWysiegPompy(budowa);

    if (pompa.aktywna !== true) {
      return utworzOdrzuceniePompy(pompa, "pompa-nieaktywna");
    }

    if (Number(pompa.wysiegMetry) < wymaganyWysiegPompyMetry) {
      return utworzOdrzuceniePompy(
        pompa,
        "niewystarczajacy-wysieg",
        {
          wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry,
          wysiegPompyMetry: Number(pompa.wysiegMetry)
        }
      );
    }

    const dostepnosc = pompy.sprawdzDostepnoscPompyDlaCyklu(
      pompa,
      okresZajetosci.minutaRozpoczeciaZajetosci,
      okresZajetosci.minutaZakonczeniaZajetosci
    );

    if (!dostepnosc.czyMozeRozpoczac) {
      return utworzOdrzuceniePompy(
        pompa,
        dostepnosc.powodBrakuDostepnosci,
        { dostepnosc: dostepnosc }
      );
    }

    const kolidujacyPrzydzial = znajdzKolidujacyPrzydzialPompy(
      stanPompy,
      okresZajetosci
    );

    if (kolidujacyPrzydzial) {
      return utworzOdrzuceniePompy(
        pompa,
        "pompa-zajeta",
        {
          idPoprzedniejBudowy: kolidujacyPrzydzial.idBudowy,
          minutaGotowosciPoPoprzedniejBudowie:
            kolidujacyPrzydzial.okresZajetosci.minutaZakonczeniaZajetosci,
          minutaRozpoczeciaZajetosci:
            okresZajetosci.minutaRozpoczeciaZajetosci,
          kolidujacyOkresZajetosci:
            Object.assign({}, kolidujacyPrzydzial.okresZajetosci)
        }
      );
    }

    const ostatniPrzydzial = stanPompy.ostatniPrzydzial;

    if (!ostatniPrzydzial) {
      return {
        idPompy: pompa.idPompy,
        nazwaPompy: pompa.nazwa,
        czyPasuje: true,
        powodOdrzucenia: null,
        wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry,
        wysiegPompyMetry: Number(pompa.wysiegMetry),
        dostepnosc: dostepnosc,
        przejazdZPoprzedniejBudowy: null
      };
    }

    const danePrzejazdu = pobierzDanePrzejazduZOpcji(
      opcje,
      pompa,
      ostatniPrzydzial.budowa,
      budowa
    );

    if (!danePrzejazdu) {
      return utworzOdrzuceniePompy(
        pompa,
        "brak-trasy",
        {
          idPoprzedniejBudowy: ostatniPrzydzial.idBudowy,
          idBudowyDocelowej: String(budowa.idBudowy || "")
        }
      );
    }

    let przejazd;

    try {
      przejazd = pompy.wyznaczPrzejazdPompyMiedzyBudowami(
        ostatniPrzydzial.budowa,
        budowa,
        listaKursow,
        danePrzejazdu
      );
    } catch (blad) {
      const komunikatBledu = String(blad && blad.message || blad || "");

      if (/Brak czasu przejazdu pompy/i.test(komunikatBledu)) {
        return utworzOdrzuceniePompy(
          pompa,
          "brak-trasy",
          {
            idPoprzedniejBudowy: ostatniPrzydzial.idBudowy,
            idBudowyDocelowej: String(budowa.idBudowy || ""),
            komunikatBledu: komunikatBledu
          }
        );
      }

      throw blad;
    }

    if (
      !przejazd ||
      !przejazd.czyMoznaRozpoczacPrzygotowanieZgodnieZPlanem
    ) {
      return utworzOdrzuceniePompy(
        pompa,
        "przejazd-miedzy-budowami",
        {
          idPoprzedniejBudowy: ostatniPrzydzial.idBudowy,
          przejazdZPoprzedniejBudowy: przejazd
        }
      );
    }

    return {
      idPompy: pompa.idPompy,
      nazwaPompy: pompa.nazwa,
      czyPasuje: true,
      powodOdrzucenia: null,
      wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry,
      wysiegPompyMetry: Number(pompa.wysiegMetry),
      dostepnosc: dostepnosc,
      przejazdZPoprzedniejBudowy: przejazd
    };
  }

  function przydzielPierwszePasujacePompy(
    listaBudow,
    listaPomp,
    listaKursow,
    opcje
  ) {
    const kursy = Array.isArray(listaKursow) ? listaKursow : [];
    const kolejnoscBudow = uporzadkujBudowyDoPrzydzialuPomp(
      listaBudow,
      kursy
    );
    const listaPompRobocza = pompy.normalizujListePomp(listaPomp);
    const stanyPomp = listaPompRobocza.map(utworzStanPompy);
    const wynikiBudow = kolejnoscBudow.map(function (pozycjaKolejki) {
      const budowa = pozycjaKolejki.budowa;
      const okresZajetosci = pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
        budowa,
        kursy
      );
      const probyKandydatow = [];
      let przydzialPompy = null;

      stanyPomp.some(function (stanPompy) {
        const ocena = sprawdzCzyPompaPasujeDoBudowy(
          stanPompy,
          budowa,
          okresZajetosci,
          kursy,
          opcje
        );
        probyKandydatow.push(ocena);

        if (!ocena.czyPasuje) {
          return false;
        }

        przydzialPompy = {
          idPompy: ocena.idPompy,
          nazwaPompy: ocena.nazwaPompy,
          wysiegPompyMetry: ocena.wysiegPompyMetry,
          wymaganyWysiegPompyMetry: ocena.wymaganyWysiegPompyMetry,
          dostepnosc: ocena.dostepnosc,
          przejazdZPoprzedniejBudowy: ocena.przejazdZPoprzedniejBudowy
        };
        const zapisPrzydzialu = {
          idBudowy: String(budowa.idBudowy || ""),
          budowa: budowa,
          okresZajetosci: okresZajetosci
        };
        stanPompy.ostatniPrzydzial = zapisPrzydzialu;
        stanPompy.przydzialy.push(zapisPrzydzialu);
        stanPompy.liczbaPrzydzialow += 1;
        return true;
      });

      return {
        idBudowy: String(budowa.idBudowy || ""),
        budowa: budowa,
        indeksWejsciowy: pozycjaKolejki.indeksWejsciowy,
        kolejnoscPrzydzialuPompy:
          pozycjaKolejki.kolejnoscPrzydzialuPompy,
        minutaPlanowanegoStartuBetonowania:
          pozycjaKolejki.minutaPlanowanegoStartuBetonowania,
        statusPrzydzialuPompy: przydzialPompy
          ? "przydzielona"
          : "brak-pasujacej-pompy",
        przydzialPompy: przydzialPompy,
        okresZajetosci: okresZajetosci,
        probyKandydatow: probyKandydatow
      };
    });
    const liczbaPrzydzielonychBetonowan = wynikiBudow.filter(
      function (wynikBudowy) {
        return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
      }
    ).length;

    return {
      status: "obliczono",
      liczbaBudowDoPrzydzialu: kolejnoscBudow.length,
      liczbaPrzydzielonychBetonowan: liczbaPrzydzielonychBetonowan,
      liczbaNieprzydzielonychBetonowan:
        kolejnoscBudow.length - liczbaPrzydzielonychBetonowan,
      wynikiBudow: wynikiBudow,
      przydzieloneBetonowania: wynikiBudow.filter(function (wynikBudowy) {
        return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
      }),
      stanPomp: stanyPomp.map(function (stanPompy) {
        return {
          idPompy: stanPompy.pompa.idPompy,
          nazwaPompy: stanPompy.pompa.nazwa,
          aktywna: stanPompy.pompa.aktywna,
          liczbaPrzydzialow: stanPompy.liczbaPrzydzialow,
          ostatnieIdBudowy: stanPompy.ostatniPrzydzial
            ? stanPompy.ostatniPrzydzial.idBudowy
            : null,
          przydzialy: stanPompy.przydzialy.map(function (przydzial) {
            return {
              idBudowy: przydzial.idBudowy,
              okresZajetosci: Object.assign({}, przydzial.okresZajetosci)
            };
          })
        };
      })
    };
  }

  pompy.pobierzPlanowanyStartBetonowania = pobierzPlanowanyStartBetonowania;
  pompy.uporzadkujBudowyDoPrzydzialuPomp = uporzadkujBudowyDoPrzydzialuPomp;
  pompy.czyOkresyZajetosciPompKoliduja =
    czyOkresyZajetosciPompKoliduja;
  pompy.znajdzKolidujacyPrzydzialPompy =
    znajdzKolidujacyPrzydzialPompy;
  pompy.sprawdzCzyPompaPasujeDoBudowy = sprawdzCzyPompaPasujeDoBudowy;
  pompy.przydzielPierwszePasujacePompy = przydzielPierwszePasujacePompy;
})(window);
