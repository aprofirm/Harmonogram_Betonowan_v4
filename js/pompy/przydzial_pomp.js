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

  pompy.pobierzPlanowanyStartBetonowania = pobierzPlanowanyStartBetonowania;
  pompy.uporzadkujBudowyDoPrzydzialuPomp = uporzadkujBudowyDoPrzydzialuPomp;
})(window);
