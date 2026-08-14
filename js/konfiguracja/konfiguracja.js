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
    numerEtapu: 3,
    punktEtapu: "3A",
    parametryDomyslne: parametryDomyslne,
    komunikatPoPrzeliczeniu:
      "Kursy zostały wygenerowane na podstawie ilości betonu i pojemności gruszki."
  });
})(window);
