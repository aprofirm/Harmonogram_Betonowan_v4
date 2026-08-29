(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (
    !aplikacja ||
    !aplikacja.pompy ||
    typeof aplikacja.pompy.obliczOgraniczonyWynikPomp !== "function"
  ) {
    throw new Error(
      "Jawne konsekwencje pomp wymagają wcześniejszego załadowania ograniczonego przydziału pomp."
    );
  }

  const pompy = aplikacja.pompy;
  const oryginalneObliczOgraniczonyWynikPomp =
    pompy.obliczOgraniczonyWynikPomp;

  function pobierzNieujemnaLiczbe(wartosc) {
    const liczba = Number(wartosc);
    return Number.isFinite(liczba) && liczba >= 0 ? liczba : 0;
  }

  function skopiujObiektLubBrak(wartosc) {
    return wartosc && typeof wartosc === "object" && !Array.isArray(wartosc)
      ? Object.assign({}, wartosc)
      : null;
  }

  function pobierzUnikalnePowodyOdrzucenia(wynikBudowy) {
    const powody = [];

    (Array.isArray(wynikBudowy && wynikBudowy.probyKandydatow)
      ? wynikBudowy.probyKandydatow
      : []
    ).forEach(function (proba) {
      const powod = String(proba && proba.powodOdrzucenia || "").trim();

      if (powod && !powody.includes(powod)) {
        powody.push(powod);
      }
    });

    if (
      !powody.length &&
      wynikBudowy &&
      wynikBudowy.powodBrakuPrzydzialu
    ) {
      powody.push(String(wynikBudowy.powodBrakuPrzydzialu));
    }

    return powody;
  }

  function pobierzWybranaProbe(wynikBudowy) {
    const idPompy = wynikBudowy && wynikBudowy.przydzialPompy
      ? wynikBudowy.przydzialPompy.idPompy
      : null;

    if (!idPompy) {
      return null;
    }

    return (Array.isArray(wynikBudowy.probyKandydatow)
      ? wynikBudowy.probyKandydatow
      : []
    ).find(function (proba) {
      return proba && proba.czyPasuje === true && proba.idPompy === idPompy;
    }) || null;
  }

  function utworzPierwotnyPlanPompy(wynikBudowy) {
    return {
      startPlanowany: wynikBudowy.startPlanowany || null,
      startZadany: wynikBudowy.startZadany || null,
      startRoboczyPrzedPompa: wynikBudowy.startRoboczyPrzedPompa || null,
      minutaPlanowanegoStartuBetonowania:
        wynikBudowy.minutaPlanowanegoStartuBetonowania === null ||
        wynikBudowy.minutaPlanowanegoStartuBetonowania === undefined
          ? null
          : Number(wynikBudowy.minutaPlanowanegoStartuBetonowania),
      okresZajetosci: skopiujObiektLubBrak(wynikBudowy.okresZajetosci)
    };
  }

  function utworzJawnySkutekPompy(wynikBudowy) {
    const czyPrzydzielona =
      wynikBudowy.statusPrzydzialuPompy === "przydzielona" &&
      Boolean(wynikBudowy.przydzialPompy);
    const opoznienie = czyPrzydzielona
      ? pobierzNieujemnaLiczbe(wynikBudowy.opoznienieZPowoduPompMinuty)
      : null;
    const wybranaProba = czyPrzydzielona
      ? pobierzWybranaProbe(wynikBudowy)
      : null;
    const powodyOdrzucenia = czyPrzydzielona
      ? []
      : pobierzUnikalnePowodyOdrzucenia(wynikBudowy);
    let status = "zgodnie-z-planem";
    let przyczyna = null;

    if (!czyPrzydzielona) {
      status = "bez-przydzialu";
      przyczyna = wynikBudowy.powodBrakuPrzydzialu ||
        powodyOdrzucenia[0] ||
        "brak-pasujacej-pompy";
    } else if (opoznienie > 0) {
      status = "przesunieta";
      przyczyna = wynikBudowy.skutekNiedoboruPomp &&
        wynikBudowy.skutekNiedoboruPomp.rodzaj
        ? wynikBudowy.skutekNiedoboruPomp.rodzaj
        : "ograniczona-flota-pomp";
    }

    return {
      status: status,
      przydzielonaPompa: czyPrzydzielona
        ? {
          idPompy: wynikBudowy.przydzialPompy.idPompy,
          nazwaPompy: wynikBudowy.przydzialPompy.nazwaPompy
        }
        : null,
      minutaMozliwegoStartuBetonowania: czyPrzydzielona
        ? Number(wynikBudowy.minutaRzeczywistegoStartuBetonowania)
        : null,
      przesuniecieStartuMinuty: opoznienie,
      przyczyna: przyczyna,
      przyczynyOgraniczenia: wybranaProba &&
        Array.isArray(wybranaProba.przyczynyOgraniczenia)
        ? wybranaProba.przyczynyOgraniczenia.map(function (przyczynaOgraniczenia) {
          return Object.assign({}, przyczynaOgraniczenia);
        })
        : [],
      powodyOdrzuceniaPomp: powodyOdrzucenia
    };
  }

  function pobierzStatusFloty(
    liczbaPotrzebnychPomp,
    liczbaPompDostepnychDoPrzydzialu,
    liczbaBrakujacychPomp,
    wynikPomp
  ) {
    if (liczbaPotrzebnychPomp === 0) {
      return "brak-budow-pompowanych";
    }

    if (liczbaPompDostepnychDoPrzydzialu === 0) {
      return "brak-pomp";
    }

    if (liczbaBrakujacychPomp > 0) {
      return "niedobor-pomp";
    }

    if (
      pobierzNieujemnaLiczbe(wynikPomp.liczbaNieprzydzielonychBetonowan) > 0 ||
      pobierzNieujemnaLiczbe(wynikPomp.liczbaOpoznionychBetonowan) > 0
    ) {
      return "ograniczenia-pomp";
    }

    return "flota-wystarczajaca";
  }

  function uzupelnijJawneKonsekwencjePomp(wynikPomp) {
    const wynik = wynikPomp && typeof wynikPomp === "object"
      ? wynikPomp
      : {};
    const liczbaPotrzebnychPomp = pobierzNieujemnaLiczbe(
      wynik.minimalnaLiczbaPomp
    );
    const liczbaPompDostepnychDoPrzydzialu = pobierzNieujemnaLiczbe(
      wynik.liczbaPompUwzglednionychWPrzydziale
    );
    const liczbaBrakujacychPomp = Math.max(
      0,
      liczbaPotrzebnychPomp - liczbaPompDostepnychDoPrzydzialu
    );
    const wynikiBudow = (Array.isArray(wynik.wynikiBudow)
      ? wynik.wynikiBudow
      : []
    ).map(function (wynikBudowy) {
      return Object.assign({}, wynikBudowy, {
        pierwotnyPlanPompy: utworzPierwotnyPlanPompy(wynikBudowy),
        jawnySkutekPompy: utworzJawnySkutekPompy(wynikBudowy)
      });
    });
    const statusFlotyPomp = pobierzStatusFloty(
      liczbaPotrzebnychPomp,
      liczbaPompDostepnychDoPrzydzialu,
      liczbaBrakujacychPomp,
      wynik
    );

    return Object.assign({}, wynik, {
      liczbaPompDostepnychDoPrzydzialu:
        liczbaPompDostepnychDoPrzydzialu,
      liczbaBrakujacychPomp: liczbaBrakujacychPomp,
      statusFlotyPomp: statusFlotyPomp,
      jawneKonsekwencjePomp: {
        statusFlotyPomp: statusFlotyPomp,
        liczbaPotrzebnychPomp: liczbaPotrzebnychPomp,
        liczbaPompZadeklarowanych: pobierzNieujemnaLiczbe(
          wynik.liczbaDostepnychPomp
        ),
        liczbaPompAktywnychNaLiscie: pobierzNieujemnaLiczbe(
          wynik.liczbaAktywnychPompNaLiscie
        ),
        liczbaPompDostepnychDoPrzydzialu:
          liczbaPompDostepnychDoPrzydzialu,
        liczbaBrakujacychPomp: liczbaBrakujacychPomp,
        liczbaBudowBezPrzydzialu: pobierzNieujemnaLiczbe(
          wynik.liczbaNieprzydzielonychBetonowan
        ),
        liczbaBudowPrzesunietych: pobierzNieujemnaLiczbe(
          wynik.liczbaOpoznionychBetonowan
        ),
        maksymalnePrzesuniecieMinuty: pobierzNieujemnaLiczbe(
          wynik.maksymalneOpoznienieBetonowaniaMinuty
        ),
        czyPlanWymagaKorekty: Boolean(wynik.czyOgraniczenieWplyneloNaPlan)
      },
      wynikiBudow: wynikiBudow,
      przydzieloneBetonowania: wynikiBudow.filter(function (wynikBudowy) {
        return wynikBudowy.statusPrzydzialuPompy === "przydzielona";
      })
    });
  }

  function obliczOgraniczonyWynikPomp() {
    return uzupelnijJawneKonsekwencjePomp(
      oryginalneObliczOgraniczonyWynikPomp.apply(pompy, arguments)
    );
  }

  pompy.uzupelnijJawneKonsekwencjePomp = uzupelnijJawneKonsekwencjePomp;
  pompy.obliczOgraniczonyWynikPomp = obliczOgraniczonyWynikPomp;
})(window);
