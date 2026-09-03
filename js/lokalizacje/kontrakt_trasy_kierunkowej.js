(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const lokalizacje = aplikacja.lokalizacje = aplikacja.lokalizacje || {};

  const WERSJA_KONTRAKTU_KIERUNKOWEJ_TRASY = 1;
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

  function pobierzNieujemnaLiczbe(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
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

    const szerokosc = Number(wartosc.szerokoscGeograficzna);
    const dlugosc = Number(wartosc.dlugoscGeograficzna);

    if (!Number.isFinite(szerokosc) || szerokosc < -90 || szerokosc > 90) {
      throw new Error(
        nazwaPola + " ma niepoprawną szerokość geograficzną."
      );
    }

    if (!Number.isFinite(dlugosc) || dlugosc < -180 || dlugosc > 180) {
      throw new Error(
        nazwaPola + " ma niepoprawną długość geograficzną."
      );
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function utworzPunktTrasy(danePunktu, nazwaPola) {
    const dane = czyObiekt(danePunktu) ? danePunktu : {};
    const idLokalizacji = pobierzTekst(dane.idLokalizacji);
    const typLokalizacji = pobierzTekst(dane.typLokalizacji);

    if (!idLokalizacji) {
      throw new Error(nazwaPola + " wymaga identyfikatora lokalizacji.");
    }

    if (!["wezel", "budowa"].includes(typLokalizacji)) {
      throw new Error(nazwaPola + " ma nieobsługiwany typ lokalizacji.");
    }

    return {
      idLokalizacji: idLokalizacji,
      typLokalizacji: typLokalizacji,
      wspolrzedne: normalizujWspolrzedne(
        dane.wspolrzedne,
        nazwaPola
      )
    };
  }

  function wyznaczKierunek(punktPoczatkowy, punktDocelowy) {
    if (
      punktPoczatkowy.typLokalizacji === "wezel" &&
      punktDocelowy.typLokalizacji === "budowa"
    ) {
      return "do-budowy";
    }

    if (
      punktPoczatkowy.typLokalizacji === "budowa" &&
      punktDocelowy.typLokalizacji === "wezel"
    ) {
      return "do-wezla";
    }

    throw new Error(
      "Kontrakt 6G.1 wymaga kierunkowej relacji węzeł ↔ budowa."
    );
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

  function utworzWynikKierunkowejTrasyWezelBudowa(daneWyniku) {
    const dane = czyObiekt(daneWyniku) ? daneWyniku : {};
    const punktPoczatkowy = utworzPunktTrasy(
      dane.punktPoczatkowy,
      "Punkt początkowy"
    );
    const punktDocelowy = utworzPunktTrasy(
      dane.punktDocelowy,
      "Punkt docelowy"
    );
    const kierunek = wyznaczKierunek(punktPoczatkowy, punktDocelowy);
    const podanyKierunek = pobierzTekst(dane.kierunek);

    if (podanyKierunek && podanyKierunek !== kierunek) {
      throw new Error("Kierunek trasy nie zgadza się z punktami końcowymi.");
    }

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_KIERUNKOWEJ_TRASY,
      rodzajRelacji: "wezel-budowa",
      kierunek: kierunek,
      punktPoczatkowy: punktPoczatkowy,
      punktDocelowy: punktDocelowy,
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

  function pobierzPunktZModeluLokalizacji(
    modelLokalizacji,
    typLokalizacji,
    idAwaryjne
  ) {
    const model = czyObiekt(modelLokalizacji) ? modelLokalizacji : {};
    const daneRobocze = czyObiekt(model.daneRobocze) ? model.daneRobocze : {};
    const idLokalizacji = pobierzTekst(model.idLokalizacji) || pobierzTekst(idAwaryjne);

    if (!idLokalizacji) {
      return null;
    }

    try {
      return {
        idLokalizacji: idLokalizacji,
        typLokalizacji: typLokalizacji,
        wspolrzedne: normalizujWspolrzedne(
          daneRobocze.wspolrzedne,
          typLokalizacji === "wezel" ? "Węzeł" : "Budowa"
        )
      };
    } catch (blad) {
      return null;
    }
  }

  function pobierzStanGotowosciTrasyWezelBudowa(wezel, modelLokalizacjiBudowy) {
    const daneWezla = czyObiekt(wezel) ? wezel : {};
    const punktWezla = pobierzPunktZModeluLokalizacji(
      daneWezla.modelLokalizacji,
      "wezel",
      daneWezla.idWezla
    );

    if (!punktWezla) {
      return {
        status: "brak-wspolrzednych-wezla",
        komunikat: "Routing wymaga pełnych współrzędnych aktywnego węzła."
      };
    }

    const modelBudowy = czyObiekt(modelLokalizacjiBudowy)
      ? modelLokalizacjiBudowy
      : {};
    const daneRoboczeBudowy = czyObiekt(modelBudowy.daneRobocze)
      ? modelBudowy.daneRobocze
      : {};

    if (daneRoboczeBudowy.statusJakosci !== "potwierdzona") {
      return {
        status: "lokalizacja-budowy-niepotwierdzona",
        komunikat: "Routing wymaga potwierdzonej lokalizacji roboczej budowy."
      };
    }

    const punktBudowy = pobierzPunktZModeluLokalizacji(
      modelBudowy,
      "budowa",
      null
    );

    if (!punktBudowy) {
      return {
        status: "brak-wspolrzednych-budowy",
        komunikat: "Potwierdzona budowa musi mieć pełne współrzędne."
      };
    }

    return {
      status: "gotowe",
      komunikat: null,
      punktWezla: punktWezla,
      punktBudowy: punktBudowy
    };
  }

  function czyMoznaWyznaczycTraseWezelBudowa(wezel, modelLokalizacjiBudowy) {
    return pobierzStanGotowosciTrasyWezelBudowa(
      wezel,
      modelLokalizacjiBudowy
    ).status === "gotowe";
  }

  function przygotujKierunkiTrasyWezelBudowa(wezel, modelLokalizacjiBudowy) {
    const stan = pobierzStanGotowosciTrasyWezelBudowa(
      wezel,
      modelLokalizacjiBudowy
    );

    if (stan.status !== "gotowe") {
      return {
        status: stan.status,
        komunikat: stan.komunikat,
        doBudowy: null,
        doWezla: null
      };
    }

    return {
      status: "gotowe",
      komunikat: null,
      doBudowy: {
        kierunek: "do-budowy",
        punktPoczatkowy: utworzPunktTrasy(stan.punktWezla, "Punkt początkowy"),
        punktDocelowy: utworzPunktTrasy(stan.punktBudowy, "Punkt docelowy")
      },
      doWezla: {
        kierunek: "do-wezla",
        punktPoczatkowy: utworzPunktTrasy(stan.punktBudowy, "Punkt początkowy"),
        punktDocelowy: utworzPunktTrasy(stan.punktWezla, "Punkt docelowy")
      }
    };
  }

  Object.assign(lokalizacje, {
    WERSJA_KONTRAKTU_KIERUNKOWEJ_TRASY:
      WERSJA_KONTRAKTU_KIERUNKOWEJ_TRASY,
    utworzWynikKierunkowejTrasyWezelBudowa:
      utworzWynikKierunkowejTrasyWezelBudowa,
    pobierzStanGotowosciTrasyWezelBudowa:
      pobierzStanGotowosciTrasyWezelBudowa,
    czyMoznaWyznaczycTraseWezelBudowa:
      czyMoznaWyznaczycTraseWezelBudowa,
    przygotujKierunkiTrasyWezelBudowa:
      przygotujKierunkiTrasyWezelBudowa
  });
})(window);
