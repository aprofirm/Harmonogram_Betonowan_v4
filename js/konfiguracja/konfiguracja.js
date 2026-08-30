(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const parametryDomyslne = Object.freeze({
    poczatekDnia: "07:00",
    pojemnoscGruszkiM3: 8,
    czasZaladunkuMinuty: 10,
    czasRozladunkuMinuty: 15,
    maksymalneOpoznienieStartuMinuty: 30,
    trybGruszek: "oblicz-potrzebne",
    liczbaDostepnychGruszek: null,
    trybPomp: "oblicz-potrzebne",
    liczbaDostepnychPomp: null
  });

  aplikacja.konfiguracja = Object.freeze({
    nazwaAplikacji: "Harmonogram Betonowań v4",
    numerEtapu: 5,
    punktEtapu: "5C.3",
    parametryDomyslne: parametryDomyslne,
    komunikatPoPrzeliczeniu:
      "Kursy, godziny pełnego cyklu i przydział dostępnych gruszek zostały obliczone od nowa."
  });
})(window);
