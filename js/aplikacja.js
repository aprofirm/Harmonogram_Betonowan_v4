(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;
  let czyTrwaPrzeliczanie = false;

  function obsluzPrzeliczenie() {
    if (czyTrwaPrzeliczanie) {
      return;
    }

    czyTrwaPrzeliczanie = true;
    aplikacja.interfejs.pokazTrwajacePrzeliczenie();

    try {
      const parametry = aplikacja.interfejs.pobierzParametryZFormularza();
      const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
        parametry: parametry,
        budowyReczne: []
      });

      aplikacja.interfejs.pokazWynik(wynik);
    } catch (blad) {
      aplikacja.interfejs.pokazBlad(blad);
    } finally {
      czyTrwaPrzeliczanie = false;
      aplikacja.interfejs.zakonczPrzeliczenie();
    }
  }

  function uruchomAplikacje() {
    aplikacja.interfejs.uruchomInterfejs(
      aplikacja.konfiguracja.parametryDomyslne,
      obsluzPrzeliczenie
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", uruchomAplikacje);
  } else {
    uruchomAplikacje();
  }
})(window);
