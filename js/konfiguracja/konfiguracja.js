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
    numerEtapu: 2,
    parametryDomyslne: parametryDomyslne,
    komunikatPoPrzeliczeniu:
      "Dane budów są gotowe. Obliczenia kursów i zasobów zostaną dodane w kolejnych etapach."
  });
})(window);
