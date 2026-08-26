(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  if (
    !aplikacja.pompy ||
    typeof aplikacja.pompy.wyznaczPelnyOkresZajetosciPompyBudowy !== "function"
  ) {
    throw new Error(
      "Moduł przejazdów pomp wymaga wcześniejszego wczytania modułu pomp."
    );
  }

  function czyBrakWartosci(wartosc) {
    return wartosc === null ||
      wartosc === undefined ||
      (typeof wartosc === "string" && wartosc.trim() === "");
  }

  function pobierzIdBudowy(budowa, opisBudowy) {
    if (!budowa || typeof budowa !== "object" || Array.isArray(budowa)) {
      throw new Error("Nie znaleziono " + opisBudowy + " przejazdu pompy.");
    }

    const idBudowy = String(budowa.idBudowy || "").trim();

    if (!idBudowy) {
      throw new Error(
        "Brakuje identyfikatora " + opisBudowy + " przejazdu pompy."
      );
    }

    return idBudowy;
  }

  function pobierzCzasPrzejazduMinuty(danePrzejazdu) {
    const dane = danePrzejazdu && typeof danePrzejazdu === "object"
      ? danePrzejazdu
      : {};
    const wartosc = dane.czasPrzejazduMinuty;

    if (czyBrakWartosci(wartosc)) {
      throw new Error(
        "Uzupełnij czas przejazdu pompy pomiędzy kolejnymi budowami."
      );
    }

    const czasPrzejazduMinuty = Number(wartosc);

    if (!Number.isFinite(czasPrzejazduMinuty) || czasPrzejazduMinuty < 0) {
      throw new Error(
        "Czas przejazdu pompy między budowami musi być liczbą nie mniejszą niż 0."
      );
    }

    return czasPrzejazduMinuty;
  }

  function pobierzZrodloCzasuPrzejazdu(danePrzejazdu) {
    const dane = danePrzejazdu && typeof danePrzejazdu === "object"
      ? danePrzejazdu
      : {};
    const zrodlo = String(dane.zrodloCzasuPrzejazdu || "").trim();

    return zrodlo || "reczny";
  }

  function normalizujDanePrzejazduPompy(danePrzejazdu) {
    return {
      czasPrzejazduMinuty: pobierzCzasPrzejazduMinuty(danePrzejazdu),
      zrodloCzasuPrzejazdu: pobierzZrodloCzasuPrzejazdu(danePrzejazdu)
    };
  }

  function wyznaczPrzejazdPompyMiedzyBudowami(
    budowaZrodlowa,
    budowaDocelowa,
    listaKursow,
    danePrzejazdu
  ) {
    const idBudowyZrodlowej = pobierzIdBudowy(
      budowaZrodlowa,
      "budowy źródłowej"
    );
    const idBudowyDocelowej = pobierzIdBudowy(
      budowaDocelowa,
      "budowy docelowej"
    );

    if (idBudowyZrodlowej === idBudowyDocelowej) {
      throw new Error("Przejazd pompy wymaga dwóch różnych budów.");
    }

    const okresZajetosciZrodlowy =
      aplikacja.pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
        budowaZrodlowa,
        listaKursow
      );
    const okresZajetosciDocelowy =
      aplikacja.pompy.wyznaczPelnyOkresZajetosciPompyBudowy(
        budowaDocelowa,
        listaKursow
      );

    if (!okresZajetosciZrodlowy || !okresZajetosciDocelowy) {
      return null;
    }

    const daneRoboczePrzejazdu = normalizujDanePrzejazduPompy(danePrzejazdu);
    const czasPrzejazduMinuty = daneRoboczePrzejazdu.czasPrzejazduMinuty;
    const minutaWyjazduZBudowy =
      okresZajetosciZrodlowy.minutaZakonczeniaZajetosci;
    const minutaPrzyjazduNaBudowe =
      minutaWyjazduZBudowy + czasPrzejazduMinuty;
    const minutaPlanowanegoRozpoczeciaPrzygotowania =
      okresZajetosciDocelowy.minutaRozpoczeciaZajetosci;
    const czasPrzygotowaniaPompyMinuty =
      okresZajetosciDocelowy.czasPrzygotowaniaPompyMinuty;
    const minutaGotowosciDoBetonowaniaPoPrzejezdzie =
      minutaPrzyjazduNaBudowe + czasPrzygotowaniaPompyMinuty;

    return {
      idBudowyZrodlowej: idBudowyZrodlowej,
      idBudowyDocelowej: idBudowyDocelowej,
      rodzajTrasy: "budowa-do-budowy",
      czyWplywaNaDostepnoscPompy: true,
      czasPrzejazduMinuty: czasPrzejazduMinuty,
      zrodloCzasuPrzejazdu: daneRoboczePrzejazdu.zrodloCzasuPrzejazdu,
      minutaWyjazduZBudowy: minutaWyjazduZBudowy,
      minutaPrzyjazduNaBudowe: minutaPrzyjazduNaBudowe,
      minutaPlanowanegoRozpoczeciaPrzygotowania:
        minutaPlanowanegoRozpoczeciaPrzygotowania,
      czasPrzygotowaniaPompyNaBudowieDocelowejMinuty:
        czasPrzygotowaniaPompyMinuty,
      minutaPlanowanegoStartuBetonowania:
        okresZajetosciDocelowy.minutaRozpoczeciaBetonowania,
      minutaGotowosciDoBetonowaniaPoPrzejezdzie:
        minutaGotowosciDoBetonowaniaPoPrzejezdzie,
      czyMoznaRozpoczacPrzygotowanieZgodnieZPlanem:
        minutaPrzyjazduNaBudowe <=
        minutaPlanowanegoRozpoczeciaPrzygotowania
    };
  }

  aplikacja.pompy.normalizujDanePrzejazduPompy =
    normalizujDanePrzejazduPompy;
  aplikacja.pompy.wyznaczPrzejazdPompyMiedzyBudowami =
    wyznaczPrzejazdPompyMiedzyBudowami;
})(window);
