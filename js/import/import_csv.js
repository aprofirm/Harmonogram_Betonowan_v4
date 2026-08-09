(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzPustyStanImportu() {
    return {
      nazwaPliku: null,
      wierszeZrodlowe: [],
      ostrzezenia: []
    };
  }

  aplikacja.importCsv = {
    utworzPustyStanImportu: utworzPustyStanImportu
  };
})(window);
