(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzListeRobocza(wierszeZrodlowe, budowyReczne) {
    const listaZImportu = Array.isArray(wierszeZrodlowe) ? wierszeZrodlowe : [];
    const listaReczna = Array.isArray(budowyReczne) ? budowyReczne : [];

    return listaZImportu.concat(listaReczna);
  }

  aplikacja.budowy = {
    utworzListeRobocza: utworzListeRobocza
  };
})(window);
