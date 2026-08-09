(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzPustyStanGruszek() {
    return {
      dostepneGruszki: [],
      przydzieloneKursy: []
    };
  }

  aplikacja.gruszki = {
    utworzPustyStanGruszek: utworzPustyStanGruszek
  };
})(window);
