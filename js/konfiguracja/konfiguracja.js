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
    punktEtapu: "3C.3",
    parametryDomyslne: parametryDomyslne,
    komunikatPoPrzeliczeniu:
      "Kursy, godziny pełnego cyklu i przydział gruszek zostały obliczone od nowa."
  });
})(window);
