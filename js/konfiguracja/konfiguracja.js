(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const parametryDomyslne = Object.freeze({
    poczatekDnia: "07:00",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    maksymalneOpoznienieStartuMinuty: 30
  });

  aplikacja.konfiguracja = Object.freeze({
    nazwaAplikacji: "Harmonogram Betonowań v4",
    numerEtapu: 3,
    punktEtapu: "3B.1",
    parametryDomyslne: parametryDomyslne,
    komunikatPoPrzeliczeniu:
      "Kursy i godziny pełnego cyklu zostały obliczone od nowa."
  });
})(window);
