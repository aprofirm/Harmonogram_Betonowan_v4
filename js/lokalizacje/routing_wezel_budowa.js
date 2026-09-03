(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const lokalizacje = aplikacja.lokalizacje = aplikacja.lokalizacje || {};

  function czyObiekt(wartosc) {
    return Boolean(wartosc) &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc);
  }

  function utworzWynikBledu(status, kierunek, wynikAdaptera, komunikat) {
    const wynik = czyObiekt(wynikAdaptera) ? wynikAdaptera : {};

    return {
      status: status,
      kierunekBledu: kierunek || null,
      komunikat: wynik.komunikatOperatora || komunikat ||
        "Nie udało się wyznaczyć poprawnej trasy drogowej.",
      czyPonowicPozniej: Boolean(wynik.czyPonowicPozniej),
      statusHttp: Number.isFinite(Number(wynik.statusHttp))
        ? Number(wynik.statusHttp)
        : null,
      doBudowy: null,
      doWezla: null
    };
  }

  function pobierzDateWyznaczenia(opcje) {
    const ustawienia = czyObiekt(opcje) ? opcje : {};

    if (ustawienia.dataWyznaczenia !== null &&
        ustawienia.dataWyznaczenia !== undefined &&
        String(ustawienia.dataWyznaczenia).trim()) {
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
        wspolrzedne: daneKierunku.punktPoczatkowy.wspolrzedne
      },
      punktDocelowy: {
        wspolrzedne: daneKierunku.punktDocelowy.wspolrzedne
      },
      profilPojazdu: Object.assign({}, profilPojazdu)
    };
  }

  function utworzZweryfikowanyWynikKierunku(
    daneKierunku,
    wynikAdaptera,
    dataWyznaczenia
  ) {
    const wynik = czyObiekt(wynikAdaptera) ? wynikAdaptera : {};

    return lokalizacje.utworzWynikKierunkowejTrasyWezelBudowa({
      kierunek: daneKierunku.kierunek,
      punktPoczatkowy: daneKierunku.punktPoczatkowy,
      punktDocelowy: daneKierunku.punktDocelowy,
      dystansDrogowyMetry: wynik.dystansDrogowyMetry,
      czasPrzejazduMinuty: wynik.czasPrzejazduMinuty,
      zrodlo: wynik.zrodlo || "mapa",
      dataWyznaczenia: dataWyznaczenia
    });
  }

  function pobierzJedenKierunek(
    adapter,
    daneKierunku,
    profilPojazdu,
    dataWyznaczenia
  ) {
    const zapytanie = przygotujZapytanieAdaptera(
      daneKierunku,
      profilPojazdu
    );

    return Promise.resolve()
      .then(function () {
        return adapter.wyznaczTrase(zapytanie);
      })
      .then(function (wynikAdaptera) {
        const wynik = czyObiekt(wynikAdaptera) ? wynikAdaptera : {};

        if (wynik.status !== "ok") {
          return {
            czyPoprawny: false,
            blad: utworzWynikBledu(
              wynik.status || "niepoprawny-wynik-trasy",
              daneKierunku.kierunek,
              wynik,
              "Adapter routingu nie zwrócił poprawnego wyniku."
            )
          };
        }

        try {
          return {
            czyPoprawny: true,
            trasa: utworzZweryfikowanyWynikKierunku(
              daneKierunku,
              wynik,
              dataWyznaczenia
            )
          };
        } catch (bladWalidacji) {
          return {
            czyPoprawny: false,
            blad: utworzWynikBledu(
              "niepoprawny-wynik-trasy",
              daneKierunku.kierunek,
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
            daneKierunku.kierunek,
            null,
            "Nie udało się pobrać trasy z adaptera usług mapowych."
          )
        };
      });
  }

  function pobierzKierunkoweTrasyWezelBudowa(
    wezel,
    modelLokalizacjiBudowy,
    adapter,
    opcje
  ) {
    if (typeof lokalizacje.przygotujKierunkiTrasyWezelBudowa !== "function" ||
        typeof lokalizacje.utworzWynikKierunkowejTrasyWezelBudowa !== "function") {
      return Promise.resolve(utworzWynikBledu(
        "brak-kontraktu-trasy",
        null,
        null,
        "Nie załadowano kontraktu kierunkowej trasy 6G.1."
      ));
    }

    const przygotowanie = lokalizacje.przygotujKierunkiTrasyWezelBudowa(
      wezel,
      modelLokalizacjiBudowy
    );

    if (!przygotowanie || przygotowanie.status !== "gotowe") {
      return Promise.resolve(utworzWynikBledu(
        przygotowanie && przygotowanie.status || "trasa-niegotowa",
        null,
        null,
        przygotowanie && przygotowanie.komunikat ||
          "Brakuje danych potrzebnych do wyznaczenia trasy."
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
      przygotowanie.doBudowy,
      profilPojazdu,
      dataWyznaczenia
    ).then(function (wynikDojazdu) {
      if (!wynikDojazdu.czyPoprawny) {
        return wynikDojazdu.blad;
      }

      return pobierzJedenKierunek(
        adapter,
        przygotowanie.doWezla,
        profilPojazdu,
        dataWyznaczenia
      ).then(function (wynikPowrotu) {
        if (!wynikPowrotu.czyPoprawny) {
          return wynikPowrotu.blad;
        }

        return {
          status: "ok",
          kierunekBledu: null,
          komunikat: null,
          czyPonowicPozniej: false,
          statusHttp: null,
          dataWyznaczenia: wynikDojazdu.trasa.dataWyznaczenia,
          doBudowy: wynikDojazdu.trasa,
          doWezla: wynikPowrotu.trasa
        };
      });
    });
  }

  Object.assign(lokalizacje, {
    pobierzKierunkoweTrasyWezelBudowa:
      pobierzKierunkoweTrasyWezelBudowa
  });
})(window);
