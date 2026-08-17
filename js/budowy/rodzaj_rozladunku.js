(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const RODZAJE_ROZLADUNKU_RECZNE = Object.freeze([
    "odbior-wlasny",
    "lej",
    "pompa",
    "wywrotka",
    "taczka"
  ]);

  function normalizujTekst(wartosc) {
    return String(wartosc || "")
      .trim()
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  }

  function normalizujRodzajRozladunku(wartosc, opcje) {
    const tekst = String(wartosc || "").trim();
    const ustawienia = opcje || {};

    if (!tekst) {
      return ustawienia.pusteJakoOdbiorWlasny ? "odbior-wlasny" : "";
    }

    const klucz = normalizujTekst(tekst);
    const mapowanie = {
      odbiorwlasny: "odbior-wlasny",
      odbior: "odbior-wlasny",
      lej: "lej",
      pompa: "pompa",
      wywrotka: "wywrotka",
      taczka: "taczka"
    };

    return mapowanie[klucz] || tekst;
  }

  function czyDaneZrodloweMajaRodzajRozladunku(daneZrodlowe) {
    if (!daneZrodlowe || typeof daneZrodlowe !== "object") {
      return false;
    }

    return Object.keys(daneZrodlowe).some(function (nazwaKolumny) {
      const nazwa = normalizujTekst(nazwaKolumny);
      return nazwa === "rodzajrozladunku" ||
        nazwa === "sposobrozladunku" ||
        nazwa === "rozladunek";
    });
  }

  function pobierzRodzajRozladunkuReczny(wartosc) {
    const rodzaj = normalizujRodzajRozladunku(wartosc);

    if (!RODZAJE_ROZLADUNKU_RECZNE.includes(rodzaj)) {
      throw new Error(
        "Wybierz rodzaj rozładunku: Odbiór własny, Lej, Pompa, Wywrotka albo Taczka."
      );
    }

    return rodzaj;
  }

  function czyOdbiorWlasny(budowa) {
    return normalizujRodzajRozladunku(
      budowa && budowa.rodzajRozladunku
    ) === "odbior-wlasny";
  }

  function opiszRodzajRozladunku(wartosc) {
    const rodzaj = normalizujRodzajRozladunku(wartosc);
    const opisy = {
      "odbior-wlasny": "Odbiór własny",
      lej: "Lej",
      pompa: "Pompa",
      wywrotka: "Wywrotka",
      taczka: "Taczka"
    };

    return opisy[rodzaj] || String(wartosc || "").trim();
  }

  function rozszerzModelBudowy() {
    if (!aplikacja.budowy) {
      throw new Error("Moduł rodzaju rozładunku wymaga modułu budów.");
    }

    const utworzBudoweZImportuPodstawowe = aplikacja.budowy.utworzBudoweZImportu;
    const utworzBudoweRecznaPodstawowe = aplikacja.budowy.utworzBudoweReczna;

    aplikacja.budowy.utworzBudoweZImportu = function (daneBudowy, numerWiersza) {
      const dane = Object.assign({}, daneBudowy || {});
      const czyKolumnaJestWPliku = czyDaneZrodloweMajaRodzajRozladunku(
        dane.daneZrodlowe
      );

      dane.rodzajRozladunku = normalizujRodzajRozladunku(
        dane.rodzajRozladunku,
        { pusteJakoOdbiorWlasny: czyKolumnaJestWPliku }
      );

      return utworzBudoweZImportuPodstawowe(dane, numerWiersza);
    };

    aplikacja.budowy.utworzBudoweReczna = function (daneBudowy, listaIstniejacychBudow) {
      const dane = Object.assign({}, daneBudowy || {});
      const rodzajRozladunku = pobierzRodzajRozladunkuReczny(
        dane.rodzajRozladunku
      );
      const budowa = utworzBudoweRecznaPodstawowe(
        dane,
        listaIstniejacychBudow
      );

      budowa.rodzajRozladunku = rodzajRozladunku;
      return budowa;
    };

    aplikacja.budowy.normalizujRodzajRozladunku = normalizujRodzajRozladunku;
    aplikacja.budowy.czyOdbiorWlasny = czyOdbiorWlasny;
    aplikacja.budowy.opiszRodzajRozladunku = opiszRodzajRozladunku;
  }

  function rozszerzGenerowanieKursow() {
    if (!aplikacja.gruszki) {
      throw new Error("Moduł rodzaju rozładunku wymaga modułu gruszek.");
    }

    const generujDlaBudowyPodstawowe = aplikacja.gruszki.generujKursyDlaBudowy;
    const generujKursyPodstawowe = aplikacja.gruszki.generujKursy;

    aplikacja.gruszki.generujKursyDlaBudowy = function (budowa, pojemnoscGruszkiM3) {
      if (czyOdbiorWlasny(budowa)) {
        return [];
      }

      return generujDlaBudowyPodstawowe(budowa, pojemnoscGruszkiM3);
    };

    aplikacja.gruszki.generujKursy = function (listaBudow, pojemnoscGruszkiM3) {
      const budowyDoZaplanowania = (Array.isArray(listaBudow) ? listaBudow : [])
        .filter(function (budowa) {
          return !czyOdbiorWlasny(budowa);
        });

      return generujKursyPodstawowe(
        budowyDoZaplanowania,
        pojemnoscGruszkiM3
      );
    };
  }

  function utworzWynikPominieciaTrasy() {
    return {
      status: "pominieto-odbior-wlasny",
      czyUzupelniono: false,
      trasa: null,
      czyWywolanoMape: false
    };
  }

  function rozszerzLokalizacje() {
    if (!aplikacja.lokalizacje) {
      throw new Error("Moduł rodzaju rozładunku wymaga modułu lokalizacji.");
    }

    const zapiszCzasyPodstawowe = aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci;
    const zapiszKompletnePodstawowe =
      aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci;
    const uzupelnijBudowePodstawowe = aplikacja.lokalizacje.uzupelnijBudoweZPamieci;
    const pobierzLubUstalPodstawowe = aplikacja.lokalizacje.pobierzLubUstalTrase;

    aplikacja.lokalizacje.zapiszCzasyBudowyWPamieci = function (budowa) {
      if (czyOdbiorWlasny(budowa)) {
        return { status: "pominieto-odbior-wlasny", liczbaTras: null };
      }

      return zapiszCzasyPodstawowe(budowa);
    };

    aplikacja.lokalizacje.zapiszKompletneTrasyBudowWPamieci = function (
      listaBudow,
      opcje
    ) {
      const budowy = Array.isArray(listaBudow) ? listaBudow : [];
      const budowyDoTras = budowy.filter(function (budowa) {
        return !czyOdbiorWlasny(budowa);
      });
      const wynik = zapiszKompletnePodstawowe(budowyDoTras, opcje);

      wynik.liczbaBudow = budowy.length;
      wynik.liczbaPominietychOdbiorowWlasnych =
        budowy.length - budowyDoTras.length;
      return wynik;
    };

    aplikacja.lokalizacje.uzupelnijBudoweZPamieci = function (budowa) {
      if (czyOdbiorWlasny(budowa)) {
        return utworzWynikPominieciaTrasy();
      }

      return uzupelnijBudowePodstawowe(budowa);
    };

    aplikacja.lokalizacje.uzupelnijListeBudowZPamieci = function (listaBudow) {
      const budowy = Array.isArray(listaBudow) ? listaBudow : [];
      let liczbaUzupelnionych = 0;
      let liczbaPominietychOdbiorowWlasnych = 0;

      budowy.forEach(function (budowa) {
        if (czyOdbiorWlasny(budowa)) {
          liczbaPominietychOdbiorowWlasnych += 1;
          return;
        }

        if (aplikacja.lokalizacje.uzupelnijBudoweZPamieci(budowa).czyUzupelniono) {
          liczbaUzupelnionych += 1;
        }
      });

      return {
        liczbaBudow: budowy.length,
        liczbaUzupelnionych: liczbaUzupelnionych,
        liczbaPominietychOdbiorowWlasnych: liczbaPominietychOdbiorowWlasnych
      };
    };

    aplikacja.lokalizacje.pobierzLubUstalTrase = function (budowa, pobierzTraseZMapy) {
      if (czyOdbiorWlasny(budowa)) {
        return Promise.resolve(utworzWynikPominieciaTrasy());
      }

      return pobierzLubUstalPodstawowe(budowa, pobierzTraseZMapy);
    };
  }

  rozszerzModelBudowy();
  rozszerzGenerowanieKursow();
  rozszerzLokalizacje();
})(window);
