(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzPustyStanLokalizacji() {
    return {
      rozpoznaneLokalizacje: [],
      ostrzezenia: []
    };
  }

  aplikacja.lokalizacje = {
    utworzPustyStanLokalizacji: utworzPustyStanLokalizacji
  };
})(window);
