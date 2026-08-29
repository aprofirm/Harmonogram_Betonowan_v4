(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.pompy) {
    throw new Error(
      "Moduł ograniczonego przydziału pomp wymaga wcześniejszego załadowania modułów pomp."
    );
  }

  const pompy = aplikacja.pompy;

  function pobierzNieujemnaLiczbeCalkowita(wartosc, nazwaPola) {
    const tekst = String(
      wartosc === null || wartosc === undefined ? "" : wartosc
    ).trim();
    const liczba = Number(wartosc);

    if (tekst === "" || !Number.isInteger(liczba) || liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać nieujemną liczbę całkowitą."
      );
    }

    return liczba;
  }

  function utworzStanPompy(pompa) {
    return {
      pompa: pompa,
      ostatniPrzydzial: null,
      przydzialy: [],
      liczbaPrzydzialow: 0
    };
  }

  function przesunOkresZajetosciPompy(okresZajetosci, przesuniecieMinuty) {
    const okres = okresZajetosci && typeof okresZajetosci === "object"
      ? okresZajetosci
      : {};
    const przesuniecie = Number(przesuniecieMinuty);

    if (!Number.isFinite(przesuniecie) || przesuniecie < 0) {
      throw new Error("Przesunięcie cyklu pompy musi być liczbą nie mniejszą niż 0.");
    }

    const polaMinut = [
      "minutaRozpoczeciaZajetosci",
      "minutaRozpoczeciaBetonowania",
      "minutaZakonczeniaBetonowania",
      "minutaZakonczeniaZajetosci"
    ];
    const wynik = Object.assign({}, okres);

    polaMinut.forEach(function (nazwaPola) {
      const minuta = Number(okres[nazwaPola]);

      if (!Number.isFinite(minuta)) {
        throw new Error(
          "Pełny okres zajętości pompy nie ma poprawnej wartości pola „" +
            nazwaPola + "”."
        );
      }

      wynik[nazwaPola] = minuta + przesuniecie;
    });

    return wynik;
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

    if (typeof danePrzejazdu !== "object" || Array.isArray(danePrzejazdu)) {
      throw new Error(
        "Dane przejazdu pompy muszą być obiektem albo wartością pustą."
      );
    }

    return danePrzejazdu;
  }

  function utworzBrakKandydata(pompa, powod, szczegoly) {
    return Object.assign({
      idPompy: pompa.idPompy,
      nazwaPompy: pompa.nazwa,
      czyPasuje: false,
      powodOdrzucenia: powod
    }, szczegoly || {});
  }

  function wybierzGlowneOgraniczenie(przyczyny) {
    return przyczyny.reduce(function (wybrane, przyczyna) {
      if (!wybrane) {
        return przyczyna;
      }

      return przyczyna.minutaWymaganegoRozpoczeciaPrzygotowania >
        wybrane.minutaWymaganegoRozpoczeciaPrzygotowania
        ? przyczyna
        : wybrane;
    }, null);
  }

  function ocenPompeDlaOgraniczonegoPrzydzialu(
    stanPompy,
    budowa,
    planowanyOkresZajetosci,
    opcje
  ) {
    const pompa = stanPompy.pompa;
    const wymaganyWysiegPompyMetry = Number(
      pompy.pobierzWymaganyWysiegPompyBudowy(budowa)
    );
    const wysiegPompyMetry = Number(pompa.wysiegMetry);

    if (
      !Number.isFinite(wymaganyWysiegPompyMetry) ||
      wymaganyWysiegPompyMetry <= 0
    ) {
      throw new Error(
        "Budowa „" + String(budowa && budowa.idBudowy || "bez ID") +
          "” nie ma poprawnego wymaganego wysięgu pompy."
      );
    }

    if (wysiegPompyMetry < wymaganyWysiegPompyMetry) {
      return utworzBrakKandydata(
        pompa,
        "niewystarczajacy-wysieg",
        {
          wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry,
          wysiegPompyMetry: wysiegPompyMetry
        }
      );
    }

    const minutaPlanowanegoRozpoczeciaPrzygotowania = Number(
      planowanyOkresZajetosci.minutaRozpoczeciaZajetosci
    );
    const minutaPlanowanegoStartuBetonowania = Number(
      planowanyOkresZajetosci.minutaRozpoczeciaBetonowania
    );
    const minutaPlanowanegoZakonczeniaZajetosci = Number(
      planowanyOkresZajetosci.minutaZakonczeniaZajetosci
    );

    if (
      !Number.isFinite(minutaPlanowanegoRozpoczeciaPrzygotowania) ||
      !Number.isFinite(minutaPlanowanegoStartuBetonowania) ||
      !Number.isFinite(minutaPlanowanegoZakonczeniaZajetosci)
    ) {
      throw new Error("Planowany okres zajętości pompy jest niekompletny.");
    }

    const dostepnoscPlanowana = pompy.sprawdzDostepnoscPompyDlaCyklu(
      pompa,
      minutaPlanowanegoRozpoczeciaPrzygotowania,
      minutaPlanowanegoZakonczeniaZajetosci
    );

    if (
      !dostepnoscPlanowana.czyMozeRozpoczac &&
      dostepnoscPlanowana.powodBrakuDostepnosci !== "przed-dostepnoscia"
    ) {
      return utworzBrakKandydata(
        pompa,
        dostepnoscPlanowana.powodBrakuDostepnosci || "po-dostepnosci",
        { dostepnosc: dostepnoscPlanowana }
      );
    }

    let minutaRzeczywistegoRozpoczeciaPrzygotowania =
      minutaPlanowanegoRozpoczeciaPrzygotowania;
    let przejazdZPoprzedniejBudowy = null;
    const przyczynyOgraniczenia = [];

    if (
      dostepnoscPlanowana.dostepnaOdMinuta !== null &&
      dostepnoscPlanowana.dostepnaOdMinuta >
        minutaRzeczywistegoRozpoczeciaPrzygotowania
    ) {
      minutaRzeczywistegoRozpoczeciaPrzygotowania =
        dostepnoscPlanowana.dostepnaOdMinuta;
      przyczynyOgraniczenia.push({
        rodzaj: "przed-dostepnoscia",
        minutaWymaganegoRozpoczeciaPrzygotowania:
          dostepnoscPlanowana.dostepnaOdMinuta
      });
    }

    const ostatniPrzydzial = stanPompy.ostatniPrzydzial;

    if (ostatniPrzydzial) {
      const minutaGotowosciPoPoprzedniejBudowie = Number(
        ostatniPrzydzial.rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci
      );

      if (
        minutaGotowosciPoPoprzedniejBudowie >
          minutaPlanowanegoRozpoczeciaPrzygotowania
      ) {
        przyczynyOgraniczenia.push({
          rodzaj: "pompa-zajeta",
          idPoprzedniejBudowy: ostatniPrzydzial.idBudowy,
          minutaGotowosciPoPoprzedniejBudowie:
            minutaGotowosciPoPoprzedniejBudowie,
          minutaWymaganegoRozpoczeciaPrzygotowania:
            minutaGotowosciPoPoprzedniejBudowie
        });
      }

      const danePrzejazdu = pobierzDanePrzejazduZOpcji(
        opcje,
        pompa,
        ostatniPrzydzial.budowa,
        budowa
      );

      if (!danePrzejazdu) {
        return utworzBrakKandydata(
          pompa,
          "brak-trasy",
          {
            idPoprzedniejBudowy: ostatniPrzydzial.idBudowy,
            idBudowyDocelowej: String(budowa.idBudowy || "")
          }
        );
      }

      const daneRoboczePrzejazdu = pompy.normalizujDanePrzejazduPompy(
        danePrzejazdu,
        ostatniPrzydzial.idBudowy,
        String(budowa.idBudowy || "")
      );
      const minutaWyjazduZBudowy =
        minutaGotowosciPoPoprzedniejBudowie;
      const minutaPrzyjazduNaBudowe =
        minutaWyjazduZBudowy + daneRoboczePrzejazdu.czasPrzejazduMinuty;

      przejazdZPoprzedniejBudowy = {
        idBudowyZrodlowej: ostatniPrzydzial.idBudowy,
        idBudowyDocelowej: String(budowa.idBudowy || ""),
        rodzajTrasy: "budowa-do-budowy",
        czasPrzejazduMinuty: daneRoboczePrzejazdu.czasPrzejazduMinuty,
        zrodloCzasuPrzejazdu: daneRoboczePrzejazdu.zrodloCzasuPrzejazdu,
        minutaWyjazduZBudowy: minutaWyjazduZBudowy,
        minutaPrzyjazduNaBudowe: minutaPrzyjazduNaBudowe
      };

      if (
        daneRoboczePrzejazdu.czasPrzejazduMinuty > 0 &&
        minutaPrzyjazduNaBudowe >
          minutaPlanowanegoRozpoczeciaPrzygotowania
      ) {
        przyczynyOgraniczenia.push({
          rodzaj: "przejazd-miedzy-budowami",
          idPoprzedniejBudowy: ostatniPrzydzial.idBudowy,
          czasPrzejazduMinuty: daneRoboczePrzejazdu.czasPrzejazduMinuty,
          minutaPrzyjazduNaBudowe: minutaPrzyjazduNaBudowe,
          minutaWymaganegoRozpoczeciaPrzygotowania:
            minutaPrzyjazduNaBudowe
        });
      }

      minutaRzeczywistegoRozpoczeciaPrzygotowania = Math.max(
        minutaRzeczywistegoRozpoczeciaPrzygotowania,
        minutaPrzyjazduNaBudowe
      );
    }

    const przesuniecieStartuMinuty = Math.max(
      0,
      minutaRzeczywistegoRozpoczeciaPrzygotowania -
        minutaPlanowanegoRozpoczeciaPrzygotowania
    );
    const rzeczywistyOkresZajetosci = przesunOkresZajetosciPompy(
      planowanyOkresZajetosci,
      przesuniecieStartuMinuty
    );
    const dostepnoscRzeczywista = pompy.sprawdzDostepnoscPompyDlaCyklu(
      pompa,
      rzeczywistyOkresZajetosci.minutaRozpoczeciaZajetosci,
      rzeczywistyOkresZajetosci.minutaZakonczeniaZajetosci
    );

    if (!dostepnoscRzeczywista.czyMozeRozpoczac) {
      return utworzBrakKandydata(
        pompa,
        dostepnoscRzeczywista.powodBrakuDostepnosci || "po-dostepnosci",
        {
          dostepnosc: dostepnoscRzeczywista,
          minutaRzeczywistegoRozpoczeciaPrzygotowania:
            minutaRzeczywistegoRozpoczeciaPrzygotowania
        }
      );
    }

    const glowneOgraniczenie = wybierzGlowneOgraniczenie(
      przyczynyOgraniczenia
    );

    return {
      idPompy: pompa.idPompy,
      nazwaPompy: pompa.nazwa,
      czyPasuje: true,
      powodOdrzucenia: null,
      wymaganyWysiegPompyMetry: wymaganyWysiegPompyMetry,
      wysiegPompyMetry: wysiegPompyMetry,
      planowanyOkresZajetosci: Object.assign({}, planowanyOkresZajetosci),
      rzeczywistyOkresZajetosci: rzeczywistyOkresZajetosci,
      minutaPlanowanegoStartuBetonowania:
        minutaPlanowanegoStartuBetonowania,
      minutaRzeczywistegoStartuBetonowania:
        minutaPlanowanegoStartuBetonowania + przesuniecieStartuMinuty,
      przesuniecieStartuMinuty: przesuniecieStartuMinuty,
      przyczynaOgraniczenia: glowneOgraniczenie
        ? glowneOgraniczenie.rodzaj
        : null,
      przyczynyOgraniczenia: przyczynyOgraniczenia,
      dostepnosc: dostepnoscRzeczywista,
      przejazdZPoprzedniejBudowy: przejazdZPoprzedniejBudowy
    };
  }

  function wybierzNajlepszegoKandydata(probyKandydatow) {
    return probyKandydatow.reduce(function (wybrany, kandydat) {
      if (!kandydat.czyPasuje) {
        return wybrany;
      }

      if (!wybrany) {
        return kandydat;
      }

      if (
        kandydat.minutaRzeczywistegoStartuBetonowania <
          wybrany.minutaRzeczywistegoStartuBetonowania
      ) {
        return kandydat;
      }

      return wybrany;
    }, null);
  }

  function utworzWynikBrakuPrzydzialu(
    pozycjaKolejki,
    planowanyOkresZajetosci,
    probyKandydatow,
    powodBrakuPrzydzialu
  ) {
    return {
      idBudowy: String(pozycjaKolejki.budowa.idBudowy || ""),
      budowa: pozycjaKolejki.budowa,
      indeksWejsciowy: pozycjaKolejki.indeksWejsciowy,
      kolejnoscPrzydzialuPompy:
        pozycjaKolejki.kolejnoscPrzydzialuPompy,
      minutaPlanowanegoStartuBetonowania:
        pozycjaKolejki.minutaPlanowanegoStartuBetonowania,
      minutaRzeczywistegoStartuBetonowania: null,
      statusPrzydzialuPompy: "brak-pasujacej-pompy",
      powodBrakuPrzydzialu: powodBrakuPrzydzialu,
      przydzialPompy: null,
      okresZajetosci: Object.assign({}, planowanyOkresZajetosci),
      rzeczywistyOkresZajetosci: null,
      probyKandydatow: probyKandydatow,
      opoznienieZPowoduPompMinuty: null,
      skutekNiedoboruPomp: {
        rodzaj: powodBrakuPrzydzialu
      }
    };
  }

  function utworzWynikPrzydzialu(
    pozycjaKolejki,
    planowanyOkresZajetosci,
    kandydat,
    probyKandydatow
  ) {
    const czyPrzesunieta = kandydat.przesuniecieStartuMinuty > 0;

    return {
      idBudowy: String(pozycjaKolejki.budowa.idBudowy || ""),
      budowa: pozycjaKolejki.budowa,
      indeksWejsciowy: pozycjaKolejki.indeksWejsciowy,
      kolejnoscPrzydzialuPompy:
        pozycjaKolejki.kolejnoscPrzydzialuPompy,
      minutaPlanowanegoStartuBetonowania:
        pozycjaKolejki.minutaPlanowanegoStartuBetonowania,
      minutaRzeczywistegoStartuBetonowania:
        kandydat.minutaRzeczywistegoStartuBetonowania,
      statusPrzydzialuPompy: "przydzielona",
      powodBrakuPrzydzialu: null,
      przydzialPompy: {
        idPompy: kandydat.idPompy,
        nazwaPompy: kandydat.nazwaPompy,
        wysiegPompyMetry: kandydat.wysiegPompyMetry,
        wymaganyWysiegPompyMetry: kandydat.wymaganyWysiegPompyMetry,
        dostepnosc: kandydat.dostepnosc,
        przejazdZPoprzedniejBudowy: kandydat.przejazdZPoprzedniejBudowy
      },
      okresZajetosci: Object.assign({}, planowanyOkresZajetosci),
      rzeczywistyOkresZajetosci:
        Object.assign({}, kandydat.rzeczywistyOkresZajetosci),
      probyKandydatow: probyKandydatow,
      opoznienieZPowoduPompMinuty: kandydat.przesuniecieStartuMinuty,
      skutekNiedoboruPomp: czyPrzesunieta
        ? {
          rodzaj: kandydat.przyczynaOgraniczenia || "ograniczona-flota-pomp",
          przesuniecieStartuMinuty: kandydat.przesuniecieStartuMinuty,
          minutaPlanowanegoStartuBetonowania:
            pozycjaKolejki.minutaPlanowanegoStartuBetonowania,
          minutaRzeczywistegoStartuBetonowania:
            kandydat.minutaRzeczywistegoStartuBetonowania
        }
        : null
    };
  }

  function przydzielOgraniczonaLiczbePompDoBudow(
    listaBudow,
    listaPomp,
    listaKursow,
    liczbaDostepnychPomp,
    opcje
  ) {
    const liczbaPomp = pobierzNieujemnaLiczbeCalkowita(
      liczbaDostepnychPomp,
      "Liczba dostępnych pomp"
    );
    const kursy = Array.isArray(listaKursow) ? listaKursow : [];
    const pompyAktywne = pompy.pobierzPompyAktywneDoPrzydzialu(listaPomp);
    const pompyDoPrzydzialu = pompyAktywne.slice(
      0,
      Math.min(liczbaPomp, pompyAktywne.length)
    );
    const stanyPomp = pompyDoPrzydzialu.map(utworzStanPompy);
    const kolejnoscBudow = pompy.uporzadkujBudowyDoPrzydzialuPomp(
      listaBudow,
      kursy
    );
    const wynikiBudow = [];

    kolejnoscBudow.forEach(function (pozycjaKolejki) {
      const budowa = pozycjaKolejki.budowa;
      const planowanyOkresZajetosci =
        pompy.wyznaczPelnyOkresZajetosciPompyBudowy(budowa, kursy);

      if (!planowanyOkresZajetosci) {
        return;
      }

      if (!stanyPomp.length) {
        wynikiBudow.push(
          utworzWynikBrakuPrzydzialu(
            pozycjaKolejki,
            planowanyOkresZajetosci,
            [],
            "brak-dostepnych-pomp"
          )
        );
        return;
      }

      const probyKandydatow = stanyPomp.map(function (stanPompy) {
        return ocenPompeDlaOgraniczonegoPrzydzialu(
          stanPompy,
          budowa,
          planowanyOkresZajetosci,
          opcje
        );
      });
      const wybranyKandydat = wybierzNajlepszegoKandydata(probyKandydatow);

      if (!wybranyKandydat) {
        wynikiBudow.push(
          utworzWynikBrakuPrzydzialu(
            pozycjaKolejki,
            planowanyOkresZajetosci,
            probyKandydatow,
            "brak-mozliwego-kandydata"
          )
        );
        return;
      }

      const stanWybranejPompy = stanyPomp.find(function (stanPompy) {
        return stanPompy.pompa.idPompy === wybranyKandydat.idPompy;
      });
      const zapisPrzydzialu = {
        idBudowy: String(budowa.idBudowy || ""),
        budowa: budowa,
        planowanyOkresZajetosci: Object.assign({}, planowanyOkresZajetosci),
        rzeczywistyOkresZajetosci:
          Object.assign({}, wybranyKandydat.rzeczywistyOkresZajetosci)
      };

      stanWybranejPompy.ostatniPrzydzial = zapisPrzydzialu;
      stanWybranejPompy.przydzialy.push(zapisPrzydzialu);
      stanWybranejPompy.liczbaPrzydzialow += 1;

      wynikiBudow.push(
        utworzWynikPrzydzialu(
          pozycjaKolejki,
          planowanyOkresZajetosci,
          wybranyKandydat,
          probyKandydatow
        )
      );
    });

    const liczbaPrzydzielonychBetonowan = wynikiBudow.filter(
      function (wynikBudowy) {
        return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
      }
    ).length;
    const liczbaOpoznionychBetonowan = wynikiBudow.filter(
      function (wynikBudowy) {
        return Number(wynikBudowy.opoznienieZPowoduPompMinuty) > 0;
      }
    ).length;
    const maksymalneOpoznienieBetonowaniaMinuty = wynikiBudow.reduce(
      function (maksymalne, wynikBudowy) {
        const opoznienie = Number(wynikBudowy.opoznienieZPowoduPompMinuty);
        return Number.isFinite(opoznienie)
          ? Math.max(maksymalne, opoznienie)
          : maksymalne;
      },
      0
    );

    return {
      status: "obliczono",
      liczbaDostepnychPomp: liczbaPomp,
      liczbaAktywnychPompNaLiscie: pompyAktywne.length,
      liczbaPompUwzglednionychWPrzydziale: pompyDoPrzydzialu.length,
      liczbaBudowDoPrzydzialu: kolejnoscBudow.length,
      liczbaPrzydzielonychBetonowan: liczbaPrzydzielonychBetonowan,
      liczbaNieprzydzielonychBetonowan:
        wynikiBudow.length - liczbaPrzydzielonychBetonowan,
      liczbaOpoznionychBetonowan: liczbaOpoznionychBetonowan,
      maksymalneOpoznienieBetonowaniaMinuty:
        maksymalneOpoznienieBetonowaniaMinuty,
      czyOgraniczenieWplyneloNaPlan:
        liczbaOpoznionychBetonowan > 0 ||
        wynikiBudow.length > liczbaPrzydzielonychBetonowan,
      wynikiBudow: wynikiBudow,
      przydzieloneBetonowania: wynikiBudow.filter(function (wynikBudowy) {
        return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
      }),
      okresyZajetosci: wynikiBudow
        .filter(function (wynikBudowy) {
          return wynikBudowy.rzeczywistyOkresZajetosci !== null;
        })
        .map(function (wynikBudowy) {
          return {
            idBudowy: wynikBudowy.idBudowy,
            idPompy: wynikBudowy.przydzialPompy.idPompy,
            planowanyOkresZajetosci:
              Object.assign({}, wynikBudowy.okresZajetosci),
            rzeczywistyOkresZajetosci:
              Object.assign({}, wynikBudowy.rzeczywistyOkresZajetosci)
          };
        }),
      stanPomp: stanyPomp.map(function (stanPompy) {
        return {
          idPompy: stanPompy.pompa.idPompy,
          nazwaPompy: stanPompy.pompa.nazwa,
          liczbaPrzydzialow: stanPompy.liczbaPrzydzialow,
          ostatnieIdBudowy: stanPompy.ostatniPrzydzial
            ? stanPompy.ostatniPrzydzial.idBudowy
            : null,
          przydzialy: stanPompy.przydzialy.map(function (przydzial) {
            return {
              idBudowy: przydzial.idBudowy,
              planowanyOkresZajetosci:
                Object.assign({}, przydzial.planowanyOkresZajetosci),
              rzeczywistyOkresZajetosci:
                Object.assign({}, przydzial.rzeczywistyOkresZajetosci)
            };
          })
        };
      })
    };
  }

  function obliczOgraniczonyWynikPomp(
    listaBudow,
    listaPomp,
    listaKursow,
    liczbaDostepnychPomp,
    opcje
  ) {
    const kursy = Array.isArray(listaKursow) ? listaKursow : [];
    const wynikBazowy = pompy.utworzWynikSilnikaPomp(
      listaBudow,
      listaPomp,
      {
        trybPomp: "mam-okreslona-liczbe",
        liczbaDostepnychPomp: liczbaDostepnychPomp
      },
      kursy
    );
    const wynikMinimalny = pompy.obliczMinimalnaLiczbePomp(
      listaBudow,
      kursy
    );
    const wynikPrzydzialu = przydzielOgraniczonaLiczbePompDoBudow(
      listaBudow,
      listaPomp,
      kursy,
      liczbaDostepnychPomp,
      opcje
    );
    const bazoweWynikiPoId = new Map(
      wynikBazowy.wynikiBudow.map(function (wynikBudowy) {
        return [wynikBudowy.idBudowy, wynikBudowy];
      })
    );
    const wynikiBudow = wynikPrzydzialu.wynikiBudow.map(function (wynikBudowy) {
      return Object.assign(
        {},
        bazoweWynikiPoId.get(wynikBudowy.idBudowy) || {},
        wynikBudowy
      );
    });

    return Object.assign({}, wynikBazowy, wynikPrzydzialu, {
      status: "obliczono",
      trybPomp: "mam-okreslona-liczbe",
      minimalnaLiczbaPomp: wynikMinimalny.minimalnaLiczbaPomp,
      liczbaBudowWymagajacychPompy: wynikMinimalny.liczbaBudowDoPrzydzialu,
      wynikiBudow: wynikiBudow,
      przydzieloneBetonowania: wynikiBudow.filter(function (wynikBudowy) {
        return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
      })
    });
  }

  pompy.przesunOkresZajetosciPompy = przesunOkresZajetosciPompy;
  pompy.przydzielOgraniczonaLiczbePompDoBudow =
    przydzielOgraniczonaLiczbePompDoBudow;
  pompy.obliczOgraniczonyWynikPomp = obliczOgraniczonyWynikPomp;
})(window);
