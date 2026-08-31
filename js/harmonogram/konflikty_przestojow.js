(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  if (
    !aplikacja.harmonogram ||
    typeof aplikacja.harmonogram.przeliczCalyHarmonogram !== "function"
  ) {
    throw new Error(
      "Moduł konfliktów przestojów wymaga głównego silnika harmonogramu."
    );
  }

  function opiszPrzekroczenieLimituPrzestoju(
    nazwaBudowy,
    przerwa,
    maksymalnyPrzestojMinuty,
    przekroczenieLimituMinuty
  ) {
    return "Budowa „" + nazwaBudowy + "” ma przerwę " +
      przerwa.przestojMinuty +
      " min między końcem rozładunku kursu " +
      przerwa.numerPoprzedniegoKursu + " o " +
      przerwa.godzinaZakonczeniaPoprzedniegoRozladunku +
      " a początkiem rozładunku kursu " +
      przerwa.numerNastepnegoKursu + " o " +
      przerwa.godzinaRozpoczeciaNastepnegoRozladunku +
      ". Dopuszczalny limit " + maksymalnyPrzestojMinuty +
      " min został przekroczony o " + przekroczenieLimituMinuty + " min.";
  }

  function utworzKonfliktPrzestoju(
    budowa,
    przerwa,
    maksymalnyPrzestojMinuty
  ) {
    const przestojMinuty = Number(przerwa && przerwa.przestojMinuty);

    if (
      !Number.isFinite(przestojMinuty) ||
      przestojMinuty <= maksymalnyPrzestojMinuty
    ) {
      return null;
    }

    const idBudowy = String(budowa && budowa.idBudowy || "");
    const nazwaBudowy = String(
      budowa && budowa.budowa || idBudowy || "bez nazwy"
    );
    const przekroczenieLimituMinuty =
      przestojMinuty - maksymalnyPrzestojMinuty;

    return {
      kod: "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA",
      rodzaj: "przestoj-betonowania",
      idBudowy: idBudowy,
      nazwaBudowy: nazwaBudowy,
      idPoprzedniegoKursu: String(przerwa.idPoprzedniegoKursu || ""),
      numerPoprzedniegoKursu: Number(przerwa.numerPoprzedniegoKursu),
      idNastepnegoKursu: String(przerwa.idNastepnegoKursu || ""),
      numerNastepnegoKursu: Number(przerwa.numerNastepnegoKursu),
      minutaZakonczeniaPoprzedniegoRozladunku:
        Number(przerwa.minutaZakonczeniaPoprzedniegoRozladunku),
      godzinaZakonczeniaPoprzedniegoRozladunku:
        String(przerwa.godzinaZakonczeniaPoprzedniegoRozladunku || ""),
      minutaRozpoczeciaNastepnegoRozladunku:
        Number(przerwa.minutaRozpoczeciaNastepnegoRozladunku),
      godzinaRozpoczeciaNastepnegoRozladunku:
        String(przerwa.godzinaRozpoczeciaNastepnegoRozladunku || ""),
      przestojMinuty: przestojMinuty,
      maksymalnyPrzestojMinuty: maksymalnyPrzestojMinuty,
      przekroczenieLimituMinuty: przekroczenieLimituMinuty,
      opis: opiszPrzekroczenieLimituPrzestoju(
        nazwaBudowy,
        przerwa,
        maksymalnyPrzestojMinuty,
        przekroczenieLimituMinuty
      )
    };
  }

  function utworzKonfliktyPrzestojow(wynik) {
    const maksymalnyPrzestojMinuty = Number(
      wynik && wynik.parametry && wynik.parametry.maksymalnyPrzestojMinuty
    );

    if (!Number.isFinite(maksymalnyPrzestojMinuty)) {
      throw new Error(
        "Nie można ocenić przestojów bez poprawnego maksymalnego limitu."
      );
    }

    return (Array.isArray(wynik.budowy) ? wynik.budowy : [])
      .reduce(function (konflikty, budowa) {
        const analiza = budowa && budowa.analizaPrzestojowBetonowania;
        const przerwy = analiza &&
          Array.isArray(analiza.przerwyMiedzyDostawami)
          ? analiza.przerwyMiedzyDostawami
          : [];

        przerwy.forEach(function (przerwa) {
          const konflikt = utworzKonfliktPrzestoju(
            budowa,
            przerwa,
            maksymalnyPrzestojMinuty
          );

          if (konflikt) {
            konflikty.push(konflikt);
          }
        });

        return konflikty;
      }, []);
  }

  const przeliczCalyHarmonogramPodstawowy =
    aplikacja.harmonogram.przeliczCalyHarmonogram;

  aplikacja.harmonogram.przeliczCalyHarmonogram = function (daneWejsciowe) {
    const wynik = przeliczCalyHarmonogramPodstawowy(daneWejsciowe);
    const konfliktyPrzestojow = utworzKonfliktyPrzestojow(wynik);
    const dotychczasoweKonflikty = Array.isArray(wynik.konflikty)
      ? wynik.konflikty
      : [];

    wynik.konflikty = dotychczasoweKonflikty.concat(konfliktyPrzestojow);
    return wynik;
  };

  aplikacja.harmonogram.utworzKonfliktyPrzestojow =
    utworzKonfliktyPrzestojow;
})(window);
