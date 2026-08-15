(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI = "harmonogramBetonowan.planDnia.v1";
  const KLUCZ_HISTORII = "harmonogramBetonowan.historiaPlanu.v1";
  const WERSJA_FORMATU = 1;
  const MAKSYMALNA_LICZBA_ZAPISOW_HISTORYCZNYCH = 100;
  const MAKSYMALNY_ROZMIAR_HISTORII_BAJTY = 3 * 1024 * 1024;
  let pamiecLokalna = null;
  let trybPamieci = "biezaca-sesja";
  let zapisBiezacejSesji = null;
  let zapisHistoriiBiezacejSesji = null;
  let kolejnyNumerZapisuHistorycznego = 0;
  let czyUruchomiono = false;

  function skopiujDane(dane) {
    return JSON.parse(JSON.stringify(dane));
  }

  function czyPoprawnyObiekt(dane) {
    return Boolean(dane) && typeof dane === "object" && !Array.isArray(dane);
  }

  function utworzStanPamieci() {
    return {
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU,
      kluczPamieci: KLUCZ_PAMIECI,
      kluczHistorii: KLUCZ_HISTORII,
      maksymalnaLiczbaZapisowHistorycznych:
        MAKSYMALNA_LICZBA_ZAPISOW_HISTORYCZNYCH,
      maksymalnyRozmiarHistoriiBajty: MAKSYMALNY_ROZMIAR_HISTORII_BAJTY
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
    if (!czyPoprawnyObiekt(danePlanu)) {
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

    if (!czyPoprawnyObiekt(pakiet)) {
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

    if (!czyPoprawnyObiekt(pakiet.danePlanu)) {
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

  function usunBiezacyPlan() {
    zapewnijUruchomienie();
    zapisBiezacejSesji = null;

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        pamiecLokalna.removeItem(KLUCZ_PAMIECI);
        return utworzWynik("usunieto-biezacy-plan");
      } catch (bladUsuwania) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return utworzWynik("usunieto-biezacy-plan-z-sesji");
  }

  function utworzPustaHistorie() {
    return {
      wersja: WERSJA_FORMATU,
      zapisy: []
    };
  }

  function usunUszkodzonaHistorie() {
    zapisHistoriiBiezacejSesji = null;

    if (!pamiecLokalna) {
      return;
    }

    try {
      pamiecLokalna.removeItem(KLUCZ_HISTORII);
    } catch (bladUsuwania) {
      // Uszkodzona historia nie może zablokować bieżącego planu.
    }
  }

  function pobierzTekstHistorii() {
    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        return pamiecLokalna.getItem(KLUCZ_HISTORII);
      } catch (bladOdczytu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return zapisHistoriiBiezacejSesji;
  }

  function czyPoprawnyWpisHistoryczny(wpis) {
    return czyPoprawnyObiekt(wpis) &&
      Boolean(wpis.idZapisu) &&
      Boolean(wpis.zapisano) &&
      czyPoprawnyObiekt(wpis.danePlanu);
  }

  function odczytajPakietHistorii() {
    const tekstHistorii = pobierzTekstHistorii();

    if (!tekstHistorii) {
      return {
        status: "brak-historii",
        historia: utworzPustaHistorie()
      };
    }

    let historia;

    try {
      historia = JSON.parse(tekstHistorii);
    } catch (bladFormatu) {
      usunUszkodzonaHistorie();
      return {
        status: "uszkodzona-historia",
        historia: utworzPustaHistorie()
      };
    }

    if (!czyPoprawnyObiekt(historia) || !Array.isArray(historia.zapisy)) {
      usunUszkodzonaHistorie();
      return {
        status: "uszkodzona-historia",
        historia: utworzPustaHistorie()
      };
    }

    if (historia.wersja !== WERSJA_FORMATU) {
      return {
        status: "niezgodna-wersja-historii",
        historia: null,
        wersjaZapisu: historia.wersja
      };
    }

    if (!historia.zapisy.every(czyPoprawnyWpisHistoryczny)) {
      usunUszkodzonaHistorie();
      return {
        status: "uszkodzona-historia",
        historia: utworzPustaHistorie()
      };
    }

    return {
      status: "odczytano-historie",
      historia: historia
    };
  }

  function policzPrzyblizonyRozmiarBajtow(tekst) {
    // localStorage jest zwykle liczony jako tekst UTF-16, dlatego mnożymy przez 2.
    return String(tekst || "").length * 2;
  }

  function ograniczHistorie(historia) {
    let liczbaNadpisanych = 0;

    while (historia.zapisy.length > MAKSYMALNA_LICZBA_ZAPISOW_HISTORYCZNYCH) {
      historia.zapisy.shift();
      liczbaNadpisanych += 1;
    }

    let tekstHistorii = JSON.stringify(historia);

    while (
      historia.zapisy.length &&
      policzPrzyblizonyRozmiarBajtow(tekstHistorii) >
        MAKSYMALNY_ROZMIAR_HISTORII_BAJTY
    ) {
      historia.zapisy.shift();
      liczbaNadpisanych += 1;
      tekstHistorii = JSON.stringify(historia);
    }

    return {
      historia: historia,
      tekstHistorii: tekstHistorii,
      liczbaNadpisanych: liczbaNadpisanych,
      rozmiarBajtow: policzPrzyblizonyRozmiarBajtow(tekstHistorii)
    };
  }

  function zapiszTekstHistorii(tekstHistorii) {
    zapisHistoriiBiezacejSesji = tekstHistorii;

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        pamiecLokalna.setItem(KLUCZ_HISTORII, tekstHistorii);
        return "zapisano-historie-trwale";
      } catch (bladZapisu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return "zapisano-historie-w-sesji";
  }

  function pobierzLiczbeBudow(danePlanu) {
    const budowyZImportu = Array.isArray(danePlanu.budowyZImportu)
      ? danePlanu.budowyZImportu.length
      : 0;
    const budowyReczne = Array.isArray(danePlanu.budowyReczne)
      ? danePlanu.budowyReczne.length
      : 0;

    if (budowyZImportu || budowyReczne) {
      return budowyZImportu + budowyReczne;
    }

    return Array.isArray(danePlanu.budowy) ? danePlanu.budowy.length : 0;
  }

  function utworzPodsumowanieZapisu(danePlanu) {
    return {
      nazwaPliku: danePlanu.nazwaPliku || "Plan bez pliku CSV",
      liczbaBudow: pobierzLiczbeBudow(danePlanu),
      czyHarmonogramPrzeliczony: Boolean(danePlanu.czyHarmonogramPrzeliczony)
    };
  }

  function utworzIdZapisuHistorycznego() {
    kolejnyNumerZapisuHistorycznego += 1;
    return "zapis-" + Date.now() + "-" + kolejnyNumerZapisuHistorycznego;
  }

  function zapiszPlanHistoryczny(danePlanu) {
    zapewnijUruchomienie();

    let kopiaDanych;
    let tekstDanych;

    try {
      if (!czyPoprawnyObiekt(danePlanu)) {
        throw new Error("Dane planu muszą być obiektem.");
      }

      kopiaDanych = skopiujDane(danePlanu);
      tekstDanych = JSON.stringify(kopiaDanych);
    } catch (bladDanych) {
      return utworzWynik("blad-zapisu-historii", {
        komunikat: "Nie można przygotować historycznego zapisu planu."
      });
    }

    const wynikOdczytu = odczytajPakietHistorii();

    if (!wynikOdczytu.historia) {
      return utworzWynik(wynikOdczytu.status, {
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null,
        komunikat: "Historia pochodzi z nieobsługiwanej wersji programu."
      });
    }

    const historia = wynikOdczytu.historia;
    const ostatniZapis = historia.zapisy[historia.zapisy.length - 1];

    if (ostatniZapis && JSON.stringify(ostatniZapis.danePlanu) === tekstDanych) {
      return utworzWynik("pominieto-duplikat", {
        idZapisu: ostatniZapis.idZapisu,
        zapisano: ostatniZapis.zapisano,
        liczbaZapisow: historia.zapisy.length
      });
    }

    const wpis = {
      idZapisu: utworzIdZapisuHistorycznego(),
      zapisano: new Date().toISOString(),
      podsumowanie: utworzPodsumowanieZapisu(kopiaDanych),
      danePlanu: kopiaDanych
    };
    historia.zapisy.push(wpis);

    const ograniczonaHistoria = ograniczHistorie(historia);
    const czyNowyWpisPozostal = ograniczonaHistoria.historia.zapisy.some(
      function (zapis) {
        return zapis.idZapisu === wpis.idZapisu;
      }
    );

    if (!czyNowyWpisPozostal) {
      return utworzWynik("przekroczony-limit-historii", {
        komunikat: "Plan jest zbyt duży, aby dodać go do historii."
      });
    }

    const statusZapisu = zapiszTekstHistorii(ograniczonaHistoria.tekstHistorii);

    return utworzWynik(statusZapisu, {
      idZapisu: wpis.idZapisu,
      zapisano: wpis.zapisano,
      liczbaZapisow: ograniczonaHistoria.historia.zapisy.length,
      liczbaNadpisanych: ograniczonaHistoria.liczbaNadpisanych,
      rozmiarBajtow: ograniczonaHistoria.rozmiarBajtow
    });
  }

  function uproscWpisHistoryczny(wpis) {
    return {
      idZapisu: wpis.idZapisu,
      zapisano: wpis.zapisano,
      podsumowanie: skopiujDane(
        wpis.podsumowanie || utworzPodsumowanieZapisu(wpis.danePlanu)
      )
    };
  }

  function pobierzHistoriePlanow() {
    zapewnijUruchomienie();

    const wynikOdczytu = odczytajPakietHistorii();

    if (!wynikOdczytu.historia) {
      return utworzWynik(wynikOdczytu.status, {
        zapisy: [],
        liczbaZapisow: 0,
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const zapisy = wynikOdczytu.historia.zapisy.slice().reverse().map(
      uproscWpisHistoryczny
    );

    return utworzWynik(wynikOdczytu.status, {
      zapisy: zapisy,
      liczbaZapisow: zapisy.length
    });
  }

  function odczytajPlanHistoryczny(idZapisu) {
    zapewnijUruchomienie();

    const wynikOdczytu = odczytajPakietHistorii();

    if (!wynikOdczytu.historia) {
      return utworzWynik(wynikOdczytu.status, {
        danePlanu: null,
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const znalezionyZapis = wynikOdczytu.historia.zapisy.find(function (wpis) {
      return String(wpis.idZapisu) === String(idZapisu);
    });

    if (!znalezionyZapis) {
      return utworzWynik("nie-znaleziono-zapisu-historycznego", {
        danePlanu: null
      });
    }

    return utworzWynik("odczytano-zapis-historyczny", {
      idZapisu: znalezionyZapis.idZapisu,
      zapisano: znalezionyZapis.zapisano,
      danePlanu: skopiujDane(znalezionyZapis.danePlanu)
    });
  }

  aplikacja.pamiecPlanu = {
    uruchomPamiecPlanu: uruchomPamiecPlanu,
    pobierzStanPamieci: pobierzStanPamieci,
    zapiszPlan: zapiszPlan,
    odczytajPlan: odczytajPlan,
    usunBiezacyPlan: usunBiezacyPlan,
    zapiszPlanHistoryczny: zapiszPlanHistoryczny,
    pobierzHistoriePlanow: pobierzHistoriePlanow,
    odczytajPlanHistoryczny: odczytajPlanHistoryczny
  };
})(window);
