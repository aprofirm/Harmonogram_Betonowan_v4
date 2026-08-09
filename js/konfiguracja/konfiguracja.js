(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const parametryDomyslne = Object.freeze({
    poczatekDnia: "07:00",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    maksymalneOpoznienieStartuMinuty: 30
  });

  aplikacja.konfiguracja = Object.freeze({
    nazwaAplikacji: "Harmonogram Betonowań v4",
    numerEtapu: 1,
    parametryDomyslne: parametryDomyslne,
    komunikatPoPrzeliczeniu:
      "Szkielet aplikacji działa poprawnie. Obliczenia kursów i zasobów zostaną dodane w kolejnych etapach."
  });
})(window);
