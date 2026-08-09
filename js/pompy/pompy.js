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

  aplikacja.pompy = {
    utworzPustyStanPomp: utworzPustyStanPomp
  };
})(window);
