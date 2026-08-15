(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const DOMYSLNY_ID_WEZLA = "wezel-domyslny";

  function utworzPustyStanLokalizacji() {
    return {
      rozpoznaneLokalizacje: [],
      ostrzezenia: []
    };
  }

  function czyJestCzas(wartosc) {
    return wartosc !== null && wartosc !== undefined && wartosc !== "" &&
      Number.isFinite(Number(wartosc)) && Number(wartosc) >= 0;
  }

  function utworzOpisLokalizacjiBudowy(budowa) {
    const firma = String(budowa && budowa.firma || "").trim();
    const miejsce = String(budowa && budowa.budowa || "").trim();

    if (!firma || !miejsce) {
      return "";
    }

    // Do czasu wydzielenia osobnego adresu w Etapie 6 bezpieczniej łączymy
    // firmę i pole Budowa, zamiast zgadywać podobieństwo samych nazw obiektów.
    return firma + " | " + miejsce;
  }

  function pobierzPierwotneZrodlo(zrodloBudowy, zrodloZapamietane) {
    if (zrodloBudowy === "pamiec") {
      return zrodloZapamietane || "reczny";
    }

    return zrodloBudowy === "mapa" ? "mapa" : "reczny";
  }

  function zapiszCzasyBudowyWPamieci(budowa) {
    if (!aplikacja.pamiecTras) {
      return { status: "brak-modulu-pamieci-tras", liczbaTras: 0 };
    }

    const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);

    if (!opisLokalizacji ||
        !czyJestCzas(budowa && budowa.czasDojazduRoboczyMinuty) ||
        !czyJestCzas(budowa && budowa.czasPowrotuRoboczyMinuty)) {
      return { status: "pominieto-niekompletne-czasy", liczbaTras: null };
    }

    const poprzedniWpis = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      DOMYSLNY_ID_WEZLA
    );
    const poprzedniaTrasa = poprzedniWpis.trasa || {};

    return aplikacja.pamiecTras.zapiszTrase({
      idWezla: DOMYSLNY_ID_WEZLA,
      opisLokalizacji: opisLokalizacji,
      czasDojazduMinuty: budowa.czasDojazduRoboczyMinuty,
      czasPowrotuMinuty: budowa.czasPowrotuRoboczyMinuty,
      zrodloCzasuDojazdu: pobierzPierwotneZrodlo(
        budowa.zrodloCzasuDojazdu,
        poprzedniaTrasa.zrodloCzasuDojazdu
      ),
      zrodloCzasuPowrotu: pobierzPierwotneZrodlo(
        budowa.zrodloCzasuPowrotu,
        poprzedniaTrasa.zrodloCzasuPowrotu
      )
    });
  }

  function zapiszKompletneTrasyBudowWPamieci(listaBudow, opcje) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const ustawienia = opcje || {};
    let liczbaKompletnych = 0;
    let liczbaZapisanych = 0;
    let liczbaPominietychIstniejacych = 0;

    budowy.forEach(function (budowa) {
      const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);
      const czyKompletna = Boolean(opisLokalizacji) &&
        czyJestCzas(budowa && budowa.czasDojazduRoboczyMinuty) &&
        czyJestCzas(budowa && budowa.czasPowrotuRoboczyMinuty);

      if (!czyKompletna) {
        return;
      }

      liczbaKompletnych += 1;

      if (ustawienia.tylkoBrakujace) {
        const istniejacaTrasa = aplikacja.pamiecTras.pobierzTrase(
          opisLokalizacji,
          DOMYSLNY_ID_WEZLA
        );

        if (istniejacaTrasa.trasa) {
          liczbaPominietychIstniejacych += 1;
          return;
        }
      }

      const wynikZapisu = zapiszCzasyBudowyWPamieci(budowa);

      if (wynikZapisu.status === "zapisano-trwale" ||
          wynikZapisu.status === "zapisano-w-sesji") {
        liczbaZapisanych += 1;
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaKompletnych: liczbaKompletnych,
      liczbaZapisanych: liczbaZapisanych,
      liczbaPominietychNiekompletnych: budowy.length - liczbaKompletnych,
      liczbaPominietychIstniejacych: liczbaPominietychIstniejacych
    };
  }

  function uzupelnijBudoweZPamieci(budowa) {
    if (!budowa || !aplikacja.pamiecTras) {
      return { status: "brak-modulu-pamieci-tras", czyUzupelniono: false };
    }

    // Dane obecne w bieżącym albo odtworzonym planie zawsze mają pierwszeństwo.
    if (czyJestCzas(budowa.czasDojazduRoboczyMinuty) ||
        czyJestCzas(budowa.czasPowrotuRoboczyMinuty)) {
      return { status: "pozostawiono-istniejace-czasy", czyUzupelniono: false };
    }

    const opisLokalizacji = utworzOpisLokalizacjiBudowy(budowa);

    if (!opisLokalizacji) {
      return { status: "brak-opisu-lokalizacji", czyUzupelniono: false };
    }

    const wynikOdczytu = aplikacja.pamiecTras.pobierzTrase(
      opisLokalizacji,
      DOMYSLNY_ID_WEZLA
    );

    if (!wynikOdczytu.trasa) {
      return Object.assign({}, wynikOdczytu, { czyUzupelniono: false });
    }

    aplikacja.budowy.ustawCzasyRobocze(budowa, {
      czasDojazduRoboczyMinuty: wynikOdczytu.trasa.czasDojazduMinuty,
      czasPowrotuRoboczyMinuty: wynikOdczytu.trasa.czasPowrotuMinuty,
      dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
      czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
      dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
      zrodloCzasuDojazdu: "pamiec",
      zrodloCzasuPowrotu: "pamiec"
    });

    return Object.assign({}, wynikOdczytu, { czyUzupelniono: true });
  }

  function uzupelnijListeBudowZPamieci(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    let liczbaUzupelnionych = 0;

    budowy.forEach(function (budowa) {
      if (uzupelnijBudoweZPamieci(budowa).czyUzupelniono) {
        liczbaUzupelnionych += 1;
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaUzupelnionych: liczbaUzupelnionych
    };
  }

  function utworzWynikTrasyZBudowy(budowa) {
    return {
      czasDojazduMinuty: Number(budowa.czasDojazduRoboczyMinuty),
      czasPowrotuMinuty: Number(budowa.czasPowrotuRoboczyMinuty),
      zrodloCzasuDojazdu: budowa.zrodloCzasuDojazdu,
      zrodloCzasuPowrotu: budowa.zrodloCzasuPowrotu
    };
  }

  function pobierzLubUstalTrase(budowa, pobierzTraseZMapy) {
    if (!budowa) {
      return Promise.resolve({
        status: "brak-budowy",
        trasa: null,
        czyWywolanoMape: false
      });
    }

    if (czyJestCzas(budowa.czasDojazduRoboczyMinuty) &&
        czyJestCzas(budowa.czasPowrotuRoboczyMinuty)) {
      return Promise.resolve({
        status: "uzyto-biezacych-czasow",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: false
      });
    }

    const wynikPamieci = uzupelnijBudoweZPamieci(budowa);

    if (wynikPamieci.czyUzupelniono) {
      return Promise.resolve({
        status: "uzyto-pamieci-tras",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: false
      });
    }

    if (typeof pobierzTraseZMapy !== "function") {
      return Promise.resolve({
        status: "brak-trasy-i-uslugi-mapowej",
        trasa: null,
        czyWywolanoMape: false
      });
    }

    const zapytanieMapowe = {
      idWezla: DOMYSLNY_ID_WEZLA,
      opisLokalizacji: utworzOpisLokalizacjiBudowy(budowa),
      idBudowy: budowa.idBudowy
    };

    return Promise.resolve().then(function () {
      return pobierzTraseZMapy(zapytanieMapowe);
    }).then(function (trasaZMapy) {
      if (!trasaZMapy ||
          !czyJestCzas(trasaZMapy.czasDojazduMinuty) ||
          !czyJestCzas(trasaZMapy.czasPowrotuMinuty)) {
        return {
          status: "brak-wyniku-mapy",
          trasa: null,
          czyWywolanoMape: true
        };
      }

      aplikacja.budowy.ustawCzasyRobocze(budowa, {
        czasDojazduRoboczyMinuty: trasaZMapy.czasDojazduMinuty,
        czasPowrotuRoboczyMinuty: trasaZMapy.czasPowrotuMinuty,
        dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
        czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
        dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
        zrodloCzasuDojazdu: "mapa",
        zrodloCzasuPowrotu: "mapa"
      });
      const wynikZapisu = zapiszCzasyBudowyWPamieci(budowa);

      return {
        status: "uzyto-wyniku-mapy",
        trasa: utworzWynikTrasyZBudowy(budowa),
        czyWywolanoMape: true,
        statusZapisu: wynikZapisu.status
      };
    }).catch(function (bladMapy) {
      return {
        status: "blad-uslugi-mapowej",
        trasa: null,
        czyWywolanoMape: true,
        komunikat: bladMapy && bladMapy.message
          ? bladMapy.message
          : "Nie udało się pobrać trasy z usługi mapowej."
      };
    });
  }

  aplikacja.lokalizacje = {
    utworzPustyStanLokalizacji: utworzPustyStanLokalizacji,
    utworzOpisLokalizacjiBudowy: utworzOpisLokalizacjiBudowy,
    zapiszCzasyBudowyWPamieci: zapiszCzasyBudowyWPamieci,
    zapiszKompletneTrasyBudowWPamieci: zapiszKompletneTrasyBudowWPamieci,
    uzupelnijBudoweZPamieci: uzupelnijBudoweZPamieci,
    uzupelnijListeBudowZPamieci: uzupelnijListeBudowZPamieci,
    pobierzLubUstalTrase: pobierzLubUstalTrase
  };
})(window);
