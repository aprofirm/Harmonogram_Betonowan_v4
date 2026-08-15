(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI = "harmonogramBetonowan.planDnia.v1";
  const WERSJA_FORMATU = 1;
  let pamiecLokalna = null;
  let trybPamieci = "biezaca-sesja";
  let zapisBiezacejSesji = null;
  let czyUruchomiono = false;

  function skopiujDane(dane) {
    return JSON.parse(JSON.stringify(dane));
  }

  function utworzStanPamieci() {
    return {
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU,
      kluczPamieci: KLUCZ_PAMIECI
    };
  }

  function utworzWynik(status, szczegoly) {
    return Object.assign({
      status: status,
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU
    }, szczegoly || {});
  }

  function rozpoznajPamiecLokalna() {
    const kluczTestowy = KLUCZ_PAMIECI + ".test";

    try {
      const magazyn = zakresGlobalny.localStorage;

      if (!magazyn) {
        return null;
      }

      magazyn.setItem(kluczTestowy, "1");
      magazyn.removeItem(kluczTestowy);
      return magazyn;
    } catch (bladPamieci) {
      return null;
    }
  }

  function uruchomPamiecPlanu() {
    if (!czyUruchomiono) {
      pamiecLokalna = rozpoznajPamiecLokalna();
      trybPamieci = pamiecLokalna ? "trwala" : "biezaca-sesja";
      czyUruchomiono = true;
    }

    return utworzStanPamieci();
  }

  function zapewnijUruchomienie() {
    if (!czyUruchomiono) {
      uruchomPamiecPlanu();
    }
  }

  function pobierzStanPamieci() {
    zapewnijUruchomienie();
    return utworzStanPamieci();
  }

  function utworzPakietZapisu(danePlanu) {
    if (!danePlanu || typeof danePlanu !== "object" || Array.isArray(danePlanu)) {
      throw new Error("Dane planu muszą być obiektem.");
    }

    return {
      wersja: WERSJA_FORMATU,
      zapisano: new Date().toISOString(),
      danePlanu: skopiujDane(danePlanu)
    };
  }

  function zapiszPlan(danePlanu) {
    zapewnijUruchomienie();

    let pakiet;
    let tekstZapisu;

    try {
      pakiet = utworzPakietZapisu(danePlanu);
      tekstZapisu = JSON.stringify(pakiet);
    } catch (bladDanych) {
      return utworzWynik("blad-zapisu", {
        komunikat: "Nie można przygotować danych planu do zapisu."
      });
    }

    zapisBiezacejSesji = tekstZapisu;

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        pamiecLokalna.setItem(KLUCZ_PAMIECI, tekstZapisu);
        return utworzWynik("zapisano-trwale", {
          zapisano: pakiet.zapisano
        });
      } catch (bladZapisu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return utworzWynik("zapisano-w-sesji", {
      zapisano: pakiet.zapisano,
      komunikat: "Przeglądarka nie udostępnia trwałej pamięci planu."
    });
  }

  function usunUszkodzonyZapis() {
    zapisBiezacejSesji = null;

    if (!pamiecLokalna) {
      return;
    }

    try {
      pamiecLokalna.removeItem(KLUCZ_PAMIECI);
    } catch (bladUsuwania) {
      // Uszkodzony zapis nie może zablokować dalszej pracy aplikacji.
    }
  }

  function pobierzTekstZapisu() {
    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        return pamiecLokalna.getItem(KLUCZ_PAMIECI);
      } catch (bladOdczytu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return zapisBiezacejSesji;
  }

  function odczytajPlan() {
    zapewnijUruchomienie();

    const tekstZapisu = pobierzTekstZapisu();

    if (!tekstZapisu) {
      return utworzWynik("brak-zapisu", { danePlanu: null });
    }

    let pakiet;

    try {
      pakiet = JSON.parse(tekstZapisu);
    } catch (bladFormatu) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", {
        danePlanu: null,
        komunikat: "Zapisany plan jest uszkodzony i został pominięty."
      });
    }

    if (!pakiet || typeof pakiet !== "object" || Array.isArray(pakiet)) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", {
        danePlanu: null,
        komunikat: "Zapisany plan ma niepoprawny format i został pominięty."
      });
    }

    if (pakiet.wersja !== WERSJA_FORMATU) {
      return utworzWynik("niezgodna-wersja", {
        danePlanu: null,
        wersjaZapisu: pakiet.wersja,
        komunikat: "Zapisany plan pochodzi z nieobsługiwanej wersji programu."
      });
    }

    if (
      !pakiet.danePlanu ||
      typeof pakiet.danePlanu !== "object" ||
      Array.isArray(pakiet.danePlanu)
    ) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", {
        danePlanu: null,
        komunikat: "Zapisany plan nie zawiera poprawnych danych i został pominięty."
      });
    }

    return utworzWynik("odczytano", {
      danePlanu: skopiujDane(pakiet.danePlanu),
      zapisano: pakiet.zapisano || null
    });
  }

  aplikacja.pamiecPlanu = {
    uruchomPamiecPlanu: uruchomPamiecPlanu,
    pobierzStanPamieci: pobierzStanPamieci,
    zapiszPlan: zapiszPlan,
    odczytajPlan: odczytajPlan
  };
})(window);
