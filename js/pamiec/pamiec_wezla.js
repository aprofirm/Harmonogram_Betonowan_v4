(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI = "harmonogramBetonowan.aktywnyWezel.v1";
  const WERSJA_FORMATU = 1;
  let pamiecLokalna = null;
  let trybPamieci = "biezaca-sesja";
  let zapisBiezacejSesji = null;
  let czyUruchomiono = false;

  function skopiujDane(dane) {
    return dane === null || dane === undefined
      ? dane
      : JSON.parse(JSON.stringify(dane));
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

  function zapewnijUruchomienie() {
    if (!czyUruchomiono) {
      pamiecLokalna = rozpoznajPamiecLokalna();
      trybPamieci = pamiecLokalna ? "trwala" : "biezaca-sesja";
      czyUruchomiono = true;
    }
  }

  function uruchomPamiecWezla() {
    zapewnijUruchomienie();
    return pobierzStanPamieci();
  }

  function pobierzTekstPamieci() {
    zapewnijUruchomienie();

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

  function usunUszkodzonyZapis() {
    zapisBiezacejSesji = null;

    if (!pamiecLokalna) {
      return;
    }

    try {
      pamiecLokalna.removeItem(KLUCZ_PAMIECI);
    } catch (bladUsuwania) {
      // Uszkodzony zapis węzła nie może zatrzymać harmonogramu.
    }
  }

  function utworzWynik(status, szczegoly) {
    return Object.assign({
      status: status,
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU
    }, szczegoly || {});
  }

  function odczytajWezel() {
    const tekstPamieci = pobierzTekstPamieci();

    if (!tekstPamieci) {
      return utworzWynik("brak-zapisu", { wezel: null });
    }

    let zapis;

    try {
      zapis = JSON.parse(tekstPamieci);
    } catch (bladFormatu) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", { wezel: null });
    }

    if (!zapis || typeof zapis !== "object" || Array.isArray(zapis)) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", { wezel: null });
    }

    if (zapis.wersja !== WERSJA_FORMATU) {
      return utworzWynik("niezgodna-wersja", {
        wezel: null,
        wersjaZapisu: zapis.wersja
      });
    }

    try {
      const wezel = aplikacja.lokalizacje.utworzModelWezla(zapis.wezel);
      return utworzWynik("odczytano", {
        wezel: skopiujDane(wezel),
        zapisano: zapis.zapisano || null
      });
    } catch (bladWalidacji) {
      usunUszkodzonyZapis();
      return utworzWynik("uszkodzony-zapis", {
        wezel: null,
        komunikat: bladWalidacji.message
      });
    }
  }

  function zapiszTekstPamieci(tekstPamieci) {
    zapisBiezacejSesji = tekstPamieci;

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        pamiecLokalna.setItem(KLUCZ_PAMIECI, tekstPamieci);
        return "zapisano-trwale";
      } catch (bladZapisu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return "zapisano-w-sesji";
  }

  function zapiszWezel(daneWezla) {
    zapewnijUruchomienie();

    let wezel;

    try {
      wezel = aplikacja.lokalizacje.utworzModelWezla(daneWezla);
    } catch (bladWalidacji) {
      return utworzWynik("blad-zapisu", {
        wezel: null,
        komunikat: bladWalidacji.message
      });
    }

    const zapis = {
      wersja: WERSJA_FORMATU,
      wezel: wezel,
      zapisano: new Date().toISOString()
    };
    const status = zapiszTekstPamieci(JSON.stringify(zapis));

    return utworzWynik(status, {
      wezel: skopiujDane(wezel),
      zapisano: zapis.zapisano
    });
  }

  function pobierzStanPamieci() {
    const tekstPamieci = pobierzTekstPamieci();

    return utworzWynik("gotowa", {
      kluczPamieci: KLUCZ_PAMIECI,
      czyMaZapis: Boolean(tekstPamieci)
    });
  }

  aplikacja.pamiecWezla = {
    uruchomPamiecWezla: uruchomPamiecWezla,
    pobierzStanPamieci: pobierzStanPamieci,
    odczytajWezel: odczytajWezel,
    zapiszWezel: zapiszWezel
  };
})(window);
