(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzPustyStanPomp() {
    return {
      dostepnePompy: [],
      przydzieloneBetonowania: []
    };
  }

  function pobierzRodzajRozladunkuBudowy(budowa) {
    if (!budowa || typeof budowa !== "object" || Array.isArray(budowa)) {
      return "";
    }

    if (
      aplikacja.budowy &&
      typeof aplikacja.budowy.normalizujRodzajRozladunku === "function"
    ) {
      return aplikacja.budowy.normalizujRodzajRozladunku(
        budowa.rodzajRozladunku
      );
    }

    return String(budowa.rodzajRozladunku || "").trim().toLowerCase();
  }

  function czyBudowaWymagaPompy(budowa) {
    return pobierzRodzajRozladunkuBudowy(budowa) === "pompa";
  }

  function zakwalifikujBudowyDoObslugiPomp(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const budowyWymagajacePompy = [];
    const budowyNiewymagajacePompy = [];

    budowy.forEach(function (budowa) {
      if (czyBudowaWymagaPompy(budowa)) {
        budowyWymagajacePompy.push(budowa);
      } else {
        budowyNiewymagajacePompy.push(budowa);
      }
    });

    return {
      liczbaBudow: budowy.length,
      liczbaBudowWymagajacychPompy: budowyWymagajacePompy.length,
      liczbaBudowNiewymagajacychPompy: budowyNiewymagajacePompy.length,
      budowyWymagajacePompy: budowyWymagajacePompy,
      budowyNiewymagajacePompy: budowyNiewymagajacePompy
    };
  }

  aplikacja.pompy = {
    utworzPustyStanPomp: utworzPustyStanPomp,
    czyBudowaWymagaPompy: czyBudowaWymagaPompy,
    zakwalifikujBudowyDoObslugiPomp: zakwalifikujBudowyDoObslugiPomp
  };
})(window);
