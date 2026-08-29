(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.interfejs) {
    throw new Error(
      "Widok wyniku pomp wymaga wcześniejszego załadowania interfejsu."
    );
  }

  const interfejs = aplikacja.interfejs;
  const oryginalnePokazWynik = interfejs.pokazWynik;
  const oryginalneOznaczWynikJakoNieaktualny =
    interfejs.oznaczWynikJakoNieaktualny;
  const oryginalnePokazPrzywroconyPlan = interfejs.pokazPrzywroconyPlan;
  const oryginalneWyczyscPlan = interfejs.wyczyscPlan;

  function pobierzElement(identyfikator) {
    return document.getElementById(identyfikator);
  }

  function pobierzNieujemnaLiczbeCalkowitaLubBrak(wartosc) {
    const liczba = Number(wartosc);

    if (
      wartosc === null ||
      wartosc === undefined ||
      wartosc === "" ||
      !Number.isInteger(liczba) ||
      liczba < 0
    ) {
      return null;
    }

    return liczba;
  }

  function pobierzTrybPompZInterfejsu() {
    const poleTrybu = pobierzElement("tryb-pomp");
    return poleTrybu && poleTrybu.value
      ? String(poleTrybu.value)
      : "oblicz-potrzebne";
  }

  function pobierzWynikZgodnosci4G(wynikHarmonogramu) {
    const dane = wynikHarmonogramu && typeof wynikHarmonogramu === "object"
      ? wynikHarmonogramu
      : {};

    if (
      !aplikacja.pompy ||
      typeof aplikacja.pompy.obliczMinimalnaLiczbePomp !== "function"
    ) {
      return null;
    }

    const wynikMinimalnejFloty = aplikacja.pompy.obliczMinimalnaLiczbePomp(
      Array.isArray(dane.budowy) ? dane.budowy : [],
      Array.isArray(dane.kursy) ? dane.kursy : []
    );

    return {
      trybPomp: pobierzTrybPompZInterfejsu(),
      minimalnaLiczbaPomp: pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikMinimalnejFloty.minimalnaLiczbaPomp
      ),
      liczbaDostepnychDoPrzydzialu: null,
      liczbaBrakujacychPomp: null,
      statusFlotyPomp: "",
      czyTrybZgodnosci4G: true
    };
  }

  function pobierzCentralnyWynikPomp(wynikHarmonogramu) {
    const dane = wynikHarmonogramu && typeof wynikHarmonogramu === "object"
      ? wynikHarmonogramu
      : {};
    const wynikPomp = dane.pompy && typeof dane.pompy === "object"
      ? dane.pompy
      : null;

    if (!wynikPomp || wynikPomp.status !== "obliczono") {
      // Zgodność ze starszym kontraktem 4G.2. Produkcyjny przepływ 4I.2
      // zawsze przekazuje centralny wynik `wynik.pompy` z 4I.1.
      return pobierzWynikZgodnosci4G(dane);
    }

    const liczbaDostepnychDoPrzydzialu =
      pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikPomp.liczbaPompDostepnychDoPrzydzialu
      );
    const liczbaUwzglednionych = pobierzNieujemnaLiczbeCalkowitaLubBrak(
      wynikPomp.liczbaPompUwzglednionychWPrzydziale
    );

    return {
      trybPomp: String(
        wynikPomp.trybPomp || dane.trybPomp || "oblicz-potrzebne"
      ),
      minimalnaLiczbaPomp: pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikPomp.minimalnaLiczbaPomp
      ),
      liczbaDostepnychDoPrzydzialu:
        liczbaDostepnychDoPrzydzialu === null
          ? liczbaUwzglednionych
          : liczbaDostepnychDoPrzydzialu,
      liczbaBrakujacychPomp: pobierzNieujemnaLiczbeCalkowitaLubBrak(
        wynikPomp.liczbaBrakujacychPomp
      ),
      statusFlotyPomp: String(wynikPomp.statusFlotyPomp || ""),
      czyTrybZgodnosci4G: false
    };
  }

  function opiszCentralnyWynikPomp(wynikPomp, opisDostepnosci) {
    if (!wynikPomp || wynikPomp.minimalnaLiczbaPomp === null) {
      return "Po obliczeniu pokażemy potrzebną liczbę pomp.";
    }

    const potrzebne = wynikPomp.minimalnaLiczbaPomp;

    if (wynikPomp.trybPomp !== "mam-okreslona-liczbe") {
      return potrzebne === 0
        ? "Plan nie wymaga pompy."
        : "Potrzebne pompy: " + String(potrzebne) + ".";
    }

    const dostepne = wynikPomp.liczbaDostepnychDoPrzydzialu === null
      ? 0
      : wynikPomp.liczbaDostepnychDoPrzydzialu;
    let opisWyniku = "Potrzebne: " + String(potrzebne) +
      " · dostępne: " + String(dostepne) + ".";

    if (potrzebne === 0 || wynikPomp.statusFlotyPomp === "brak-budow-pompowanych") {
      opisWyniku = "Plan nie wymaga pompy · dostępne: " + String(dostepne) + ".";
    } else if (wynikPomp.statusFlotyPomp === "brak-pomp") {
      opisWyniku += " Brak pompy do przydziału.";
    } else if (wynikPomp.statusFlotyPomp === "niedobor-pomp") {
      const brakujace = wynikPomp.liczbaBrakujacychPomp === null
        ? Math.max(0, potrzebne - dostepne)
        : wynikPomp.liczbaBrakujacychPomp;
      opisWyniku += " Brakuje: " + String(brakujace) + ".";
    } else if (wynikPomp.statusFlotyPomp === "ograniczenia-pomp") {
      opisWyniku += " Dostępność pomp ogranicza plan.";
    } else if (wynikPomp.statusFlotyPomp === "flota-wystarczajaca") {
      opisWyniku += " Flota wystarcza.";
    }

    const opisLokalny = String(opisDostepnosci || "").trim();

    if (
      opisLokalny &&
      opisLokalny !== "Po obliczeniu pokażemy potrzebną liczbę pomp." &&
      !opisLokalny.startsWith("Potrzebne") &&
      !opisLokalny.startsWith("Plan nie wymaga")
    ) {
      opisWyniku += " " + opisLokalny;
    }

    return opisWyniku;
  }

  function pokazCentralnyWynikPomp(wynikHarmonogramu) {
    const wynikPomp = pobierzCentralnyWynikPomp(wynikHarmonogramu);
    const licznikPotrzebnych = pobierzElement("minimalna-liczba-pomp");
    const licznikDostepnych = pobierzElement("liczba-dostepnych-pomp-wynik");
    const opis = pobierzElement("podsumowanie-dostepnosci-pomp");
    const sekcjaPomp = document.querySelector
      ? document.querySelector(".sterowanie-zasobu--pompy")
      : null;
    const opisDostepnosci = opis ? opis.textContent : "";

    if (!wynikPomp) {
      wyczyscCentralnyWynikPomp();
      return null;
    }

    if (licznikPotrzebnych) {
      licznikPotrzebnych.textContent = wynikPomp.minimalnaLiczbaPomp === null
        ? "—"
        : String(wynikPomp.minimalnaLiczbaPomp);
    }

    if (wynikPomp.czyTrybZgodnosci4G) {
      if (wynikPomp.trybPomp !== "mam-okreslona-liczbe" && opis) {
        opis.textContent = opiszCentralnyWynikPomp(wynikPomp, "");
      }
      return wynikPomp;
    }

    if (licznikDostepnych) {
      licznikDostepnych.textContent =
        wynikPomp.trybPomp === "mam-okreslona-liczbe"
          ? String(wynikPomp.liczbaDostepnychDoPrzydzialu === null
            ? 0
            : wynikPomp.liczbaDostepnychDoPrzydzialu)
          : "—";
    }

    if (opis) {
      opis.textContent = opiszCentralnyWynikPomp(
        wynikPomp,
        opisDostepnosci
      );
    }

    if (sekcjaPomp) {
      sekcjaPomp.dataset.statusPomp = wynikPomp.statusFlotyPomp || "obliczono";
    }

    return wynikPomp;
  }

  function wyczyscCentralnyWynikPomp() {
    const trybPomp = pobierzElement("tryb-pomp");
    const licznikPotrzebnych = pobierzElement("minimalna-liczba-pomp");
    const licznikDostepnych = pobierzElement("liczba-dostepnych-pomp-wynik");
    const opis = pobierzElement("podsumowanie-dostepnosci-pomp");
    const sekcjaPomp = document.querySelector
      ? document.querySelector(".sterowanie-zasobu--pompy")
      : null;
    const czyTrybOgraniczony =
      trybPomp && trybPomp.value === "mam-okreslona-liczbe";

    if (licznikPotrzebnych) {
      licznikPotrzebnych.textContent = "—";
    }

    if (!czyTrybOgraniczony) {
      if (licznikDostepnych) {
        licznikDostepnych.textContent = "—";
      }

      if (opis) {
        opis.textContent = "Po obliczeniu pokażemy potrzebną liczbę pomp.";
      }
    }

    if (sekcjaPomp) {
      delete sekcjaPomp.dataset.statusPomp;
    }
  }

  function pokazWynik(wynikHarmonogramu) {
    const wynik = oryginalnePokazWynik.apply(interfejs, arguments);
    pokazCentralnyWynikPomp(wynikHarmonogramu);
    return wynik;
  }

  function oznaczWynikJakoNieaktualny() {
    const wynik = oryginalneOznaczWynikJakoNieaktualny.apply(interfejs, arguments);
    wyczyscCentralnyWynikPomp();
    return wynik;
  }

  function pokazPrzywroconyPlan() {
    const wynik = oryginalnePokazPrzywroconyPlan.apply(interfejs, arguments);
    wyczyscCentralnyWynikPomp();
    return wynik;
  }

  function wyczyscPlan() {
    const wynik = oryginalneWyczyscPlan.apply(interfejs, arguments);
    wyczyscCentralnyWynikPomp();
    return wynik;
  }

  interfejs.pokazWynik = pokazWynik;
  interfejs.oznaczWynikJakoNieaktualny = oznaczWynikJakoNieaktualny;
  interfejs.pokazPrzywroconyPlan = pokazPrzywroconyPlan;
  interfejs.wyczyscPlan = wyczyscPlan;
  interfejs.pokazMinimalnaLiczbePomp = pokazCentralnyWynikPomp;
  interfejs.pokazCentralnyWynikPomp = pokazCentralnyWynikPomp;
})(window);
