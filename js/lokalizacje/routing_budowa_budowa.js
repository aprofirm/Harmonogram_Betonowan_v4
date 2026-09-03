(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const lokalizacje = aplikacja.lokalizacje = aplikacja.lokalizacje || {};

  const ZRODLA_TRASY = Object.freeze(["csv", "reczny", "pamiec", "mapa"]);

  function czyObiekt(wartosc) {
    return Boolean(wartosc) &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc);
  }

  function pobierzTekst(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return null;
    }

    const tekst = String(wartosc).trim();
    return tekst || null;
  }

  function pobierzWymaganaLiczbe(wartosc, nazwaPola) {
    const czyPusta = wartosc === null ||
      wartosc === undefined ||
      (typeof wartosc === "string" && wartosc.trim() === "");
    const liczba = czyPusta ? NaN : Number(wartosc);

    if (!Number.isFinite(liczba)) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać poprawną liczbę.");
    }

    return liczba;
  }

  function pobierzNieujemnaLiczbe(wartosc, nazwaPola) {
    const liczba = pobierzWymaganaLiczbe(wartosc, nazwaPola);

    if (liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function normalizujWspolrzedne(wartosc, nazwaPola) {
    if (!czyObiekt(wartosc)) {
      throw new Error(nazwaPola + " wymaga pełnej pary współrzędnych.");
    }

    const szerokosc = pobierzWymaganaLiczbe(
      wartosc.szerokoscGeograficzna,
      nazwaPola + " — szerokość geograficzna"
    );
    const dlugosc = pobierzWymaganaLiczbe(
      wartosc.dlugoscGeograficzna,
      nazwaPola + " — długość geograficzna"
    );

    if (szerokosc < -90 || szerokosc > 90) {
      throw new Error(nazwaPola + " ma niepoprawną szerokość geograficzną.");
    }

    if (dlugosc < -180 || dlugosc > 180) {
      throw new Error(nazwaPola + " ma niepoprawną długość geograficzną.");
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function pobierzPunktPotwierdzonejBudowy(modelLokalizacji, opis) {
    const model = czyObiekt(modelLokalizacji) ? modelLokalizacji : {};
    const daneRobocze = czyObiekt(model.daneRobocze) ? model.daneRobocze : {};
    const idLokalizacji = pobierzTekst(model.idLokalizacji);

    if (!idLokalizacji) {
      return {
        status: "brak-id-budowy",
        komunikat: opis + " wymaga identyfikatora lokalizacji."
      };
    }

    if (model.typLokalizacji && model.typLokalizacji !== "budowa") {
      return {
        status: "niepoprawny-typ-lokalizacji",
        komunikat: opis + " musi mieć typ lokalizacji „budowa”."
      };
    }

    if (daneRobocze.statusJakosci !== "potwierdzona") {
      return {
        status: "lokalizacja-budowy-niepotwierdzona",
        komunikat: opis + " wymaga potwierdzonej lokalizacji roboczej."
      };
    }

    try {
      return {
        status: "gotowe",
        punkt: {
          idLokalizacji: idLokalizacji,
          typLokalizacji: "budowa",
          wspolrzedne: normalizujWspolrzedne(
            daneRobocze.wspolrzedne,
            opis
          )
        }
      };
    } catch (blad) {
      return {
        status: "brak-wspolrzednych-budowy",
        komunikat: blad && blad.message
          ? blad.message
          : opis + " wymaga pełnych współrzędnych."
      };
    }
  }

  function pobierzStanGotowosciTrasyBudowaBudowa(
    modelPierwszejBudowy,
    modelDrugiejBudowy
  ) {
    const pierwsza = pobierzPunktPotwierdzonejBudowy(
      modelPierwszejBudowy,
      "Pierwsza budowa"
    );

    if (pierwsza.status !== "gotowe") {
      return {
        status: pierwsza.status,
        komunikat: pierwsza.komunikat
      };
    }

    const druga = pobierzPunktPotwierdzonejBudowy(
      modelDrugiejBudowy,
      "Druga budowa"
    );

    if (druga.status !== "gotowe") {
      return {
        status: druga.status,
        komunikat: druga.komunikat
      };
    }

    if (pierwsza.punkt.idLokalizacji === druga.punkt.idLokalizacji) {
      return {
        status: "ta-sama-budowa",
        komunikat: "Trasa budowa → budowa wymaga dwóch różnych lokalizacji."
      };
    }

    return {
      status: "gotowe",
      komunikat: null,
      pierwszaBudowa: pierwsza.punkt,
      drugaBudowa: druga.punkt
    };
  }

  function przygotujKierunkiTrasyBudowaBudowa(
    modelPierwszejBudowy,
    modelDrugiejBudowy
  ) {
    const stan = pobierzStanGotowosciTrasyBudowaBudowa(
      modelPierwszejBudowy,
      modelDrugiejBudowy
    );

    if (stan.status !== "gotowe") {
      return {
        status: stan.status,
        komunikat: stan.komunikat,
        pierwszaDoDrugiej: null,
        drugaDoPierwszej: null
      };
    }

    return {
      status: "gotowe",
      komunikat: null,
      pierwszaDoDrugiej: {
        kierunek: "miedzy-budowami",
        punktPoczatkowy: stan.pierwszaBudowa,
        punktDocelowy: stan.drugaBudowa
      },
      drugaDoPierwszej: {
        kierunek: "miedzy-budowami",
        punktPoczatkowy: stan.drugaBudowa,
        punktDocelowy: stan.pierwszaBudowa
      }
    };
  }

  function pobierzZrodlo(wartosc) {
    const zrodlo = pobierzTekst(wartosc);

    if (!ZRODLA_TRASY.includes(zrodlo)) {
      throw new Error("Wynik trasy wymaga rozpoznanego źródła danych.");
    }

    return zrodlo;
  }

  function pobierzDateIso(wartosc) {
    const tekst = pobierzTekst(wartosc);
    const data = tekst ? new Date(tekst) : null;

    if (!data || Number.isNaN(data.getTime())) {
      throw new Error("Wynik trasy wymaga poprawnej daty wyznaczenia.");
    }

    return data.toISOString();
  }

  function utworzWynikKierunkowejTrasyBudowaBudowa(daneWyniku) {
    const dane = czyObiekt(daneWyniku) ? daneWyniku : {};
    const punktPoczatkowy = czyObiekt(dane.punktPoczatkowy)
      ? dane.punktPoczatkowy
      : {};
    const punktDocelowy = czyObiekt(dane.punktDocelowy)
      ? dane.punktDocelowy
      : {};
    const idPoczatkowe = pobierzTekst(punktPoczatkowy.idLokalizacji);
    const idDocelowe = pobierzTekst(punktDocelowy.idLokalizacji);

    if (!idPoczatkowe || !idDocelowe) {
      throw new Error("Trasa budowa → budowa wymaga identyfikatorów obu lokalizacji.");
    }

    if (idPoczatkowe === idDocelowe) {
      throw new Error("Trasa budowa → budowa wymaga dwóch różnych lokalizacji.");
    }

    if (
      punktPoczatkowy.typLokalizacji !== "budowa" ||
      punktDocelowy.typLokalizacji !== "budowa"
    ) {
      throw new Error("Trasa 6H.1 może łączyć wyłącznie dwie budowy.");
    }

    return {
      wersjaKontraktu: 1,
      rodzajRelacji: "budowa-budowa",
      kierunek: "miedzy-budowami",
      punktPoczatkowy: {
        idLokalizacji: idPoczatkowe,
        typLokalizacji: "budowa",
        wspolrzedne: normalizujWspolrzedne(
          punktPoczatkowy.wspolrzedne,
          "Punkt początkowy"
        )
      },
      punktDocelowy: {
        idLokalizacji: idDocelowe,
        typLokalizacji: "budowa",
        wspolrzedne: normalizujWspolrzedne(
          punktDocelowy.wspolrzedne,
          "Punkt docelowy"
        )
      },
      dystansDrogowyMetry: pobierzNieujemnaLiczbe(
        dane.dystansDrogowyMetry,
        "Dystans drogowy"
      ),
      czasPrzejazduMinuty: pobierzNieujemnaLiczbe(
        dane.czasPrzejazduMinuty,
        "Czas przejazdu"
      ),
      zrodlo: pobierzZrodlo(dane.zrodlo),
      dataWyznaczenia: pobierzDateIso(dane.dataWyznaczenia)
    };
  }

  function pobierzDateWyznaczenia(opcje) {
    const ustawienia = czyObiekt(opcje) ? opcje : {};

    if (
      ustawienia.dataWyznaczenia !== null &&
      ustawienia.dataWyznaczenia !== undefined &&
      String(ustawienia.dataWyznaczenia).trim()
    ) {
      return String(ustawienia.dataWyznaczenia).trim();
    }

    return new Date().toISOString();
  }

  function pobierzProfilPojazdu(opcje) {
    const ustawienia = czyObiekt(opcje) ? opcje : {};

    return czyObiekt(ustawienia.profilPojazdu)
      ? Object.assign({}, ustawienia.profilPojazdu)
      : {};
  }

  function przygotujZapytanieAdaptera(daneKierunku, profilPojazdu) {
    return {
      punktPoczatkowy: {
        wspolrzedne: Object.assign({}, daneKierunku.punktPoczatkowy.wspolrzedne)
      },
      punktDocelowy: {
        wspolrzedne: Object.assign({}, daneKierunku.punktDocelowy.wspolrzedne)
      },
      profilPojazdu: Object.assign({}, profilPojazdu)
    };
  }

  function utworzWynikBledu(status, relacjaBledu, wynikAdaptera, komunikat) {
    const wynik = czyObiekt(wynikAdaptera) ? wynikAdaptera : {};

    return {
      status: status,
      relacjaBledu: relacjaBledu || null,
      komunikat: wynik.komunikatOperatora || komunikat ||
        "Nie udało się wyznaczyć poprawnej trasy pomiędzy budowami.",
      czyPonowicPozniej: Boolean(wynik.czyPonowicPozniej),
      statusHttp: Number.isFinite(Number(wynik.statusHttp))
        ? Number(wynik.statusHttp)
        : null,
      pierwszaDoDrugiej: null,
      drugaDoPierwszej: null
    };
  }

  function pobierzJedenKierunek(
    adapter,
    daneKierunku,
    profilPojazdu,
    dataWyznaczenia,
    relacjaBledu
  ) {
    return Promise.resolve()
      .then(function () {
        return adapter.wyznaczTrase(
          przygotujZapytanieAdaptera(daneKierunku, profilPojazdu)
        );
      })
      .then(function (wynikAdaptera) {
        const wynik = czyObiekt(wynikAdaptera) ? wynikAdaptera : {};

        if (wynik.status !== "ok") {
          return {
            czyPoprawny: false,
            blad: utworzWynikBledu(
              wynik.status || "niepoprawny-wynik-trasy",
              relacjaBledu,
              wynik,
              "Adapter routingu nie zwrócił poprawnego wyniku."
            )
          };
        }

        try {
          return {
            czyPoprawny: true,
            trasa: utworzWynikKierunkowejTrasyBudowaBudowa({
              punktPoczatkowy: daneKierunku.punktPoczatkowy,
              punktDocelowy: daneKierunku.punktDocelowy,
              dystansDrogowyMetry: wynik.dystansDrogowyMetry,
              czasPrzejazduMinuty: wynik.czasPrzejazduMinuty,
              zrodlo: wynik.zrodlo || "mapa",
              dataWyznaczenia: dataWyznaczenia
            })
          };
        } catch (bladWalidacji) {
          return {
            czyPoprawny: false,
            blad: utworzWynikBledu(
              "niepoprawny-wynik-trasy",
              relacjaBledu,
              wynik,
              bladWalidacji && bladWalidacji.message
            )
          };
        }
      })
      .catch(function () {
        return {
          czyPoprawny: false,
          blad: utworzWynikBledu(
            "blad-uslugi",
            relacjaBledu,
            null,
            "Nie udało się pobrać trasy z adaptera usług mapowych."
          )
        };
      });
  }

  function pobierzKierunkoweTrasyBudowaBudowa(
    modelPierwszejBudowy,
    modelDrugiejBudowy,
    adapter,
    opcje
  ) {
    const przygotowanie = przygotujKierunkiTrasyBudowaBudowa(
      modelPierwszejBudowy,
      modelDrugiejBudowy
    );

    if (przygotowanie.status !== "gotowe") {
      return Promise.resolve(utworzWynikBledu(
        przygotowanie.status,
        null,
        null,
        przygotowanie.komunikat
      ));
    }

    if (!adapter || typeof adapter.wyznaczTrase !== "function") {
      return Promise.resolve(utworzWynikBledu(
        "brak-adaptera-routingu",
        null,
        null,
        "Nie podłączono adaptera routingu."
      ));
    }

    const profilPojazdu = pobierzProfilPojazdu(opcje);
    const dataWyznaczenia = pobierzDateWyznaczenia(opcje);

    return pobierzJedenKierunek(
      adapter,
      przygotowanie.pierwszaDoDrugiej,
      profilPojazdu,
      dataWyznaczenia,
      "pierwsza-do-drugiej"
    ).then(function (wynikPierwszy) {
      if (!wynikPierwszy.czyPoprawny) {
        return wynikPierwszy.blad;
      }

      return pobierzJedenKierunek(
        adapter,
        przygotowanie.drugaDoPierwszej,
        profilPojazdu,
        dataWyznaczenia,
        "druga-do-pierwszej"
      ).then(function (wynikDrugi) {
        if (!wynikDrugi.czyPoprawny) {
          return wynikDrugi.blad;
        }

        return {
          status: "ok",
          relacjaBledu: null,
          komunikat: null,
          czyPonowicPozniej: false,
          statusHttp: null,
          dataWyznaczenia: wynikPierwszy.trasa.dataWyznaczenia,
          pierwszaDoDrugiej: wynikPierwszy.trasa,
          drugaDoPierwszej: wynikDrugi.trasa
        };
      });
    });
  }

  Object.assign(lokalizacje, {
    pobierzStanGotowosciTrasyBudowaBudowa:
      pobierzStanGotowosciTrasyBudowaBudowa,
    przygotujKierunkiTrasyBudowaBudowa:
      przygotujKierunkiTrasyBudowaBudowa,
    utworzWynikKierunkowejTrasyBudowaBudowa:
      utworzWynikKierunkowejTrasyBudowaBudowa,
    pobierzKierunkoweTrasyBudowaBudowa:
      pobierzKierunkoweTrasyBudowaBudowa
  });
})(window);
