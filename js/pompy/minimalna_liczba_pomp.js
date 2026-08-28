(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.pompy) {
    throw new Error(
      "Moduł minimalnej liczby pomp wymaga wcześniejszego załadowania modułu pomp."
    );
  }

  const pompy = aplikacja.pompy;

  function utworzIdPompyTechnicznej(numerPompyTechnicznej) {
    return "POMPA-TECH-" + String(numerPompyTechnicznej).padStart(3, "0");
  }

  function pobierzGraniceOkresuTechnicznego(okresZajetosci, budowa) {
    const minutaRozpoczecia = Number(
      okresZajetosci && okresZajetosci.minutaRozpoczeciaZajetosci
    );
    const minutaZakonczenia = Number(
      okresZajetosci && okresZajetosci.minutaZakonczeniaZajetosci
    );

    if (
      !Number.isFinite(minutaRozpoczecia) ||
      !Number.isFinite(minutaZakonczenia) ||
      minutaZakonczenia < minutaRozpoczecia
    ) {
      throw new Error(
        "Budowa „" + String(budowa && budowa.idBudowy || "bez ID") +
          "” nie ma poprawnego pełnego okresu zajętości pompy."
      );
    }

    return {
      minutaRozpoczecia: minutaRozpoczecia,
      minutaZakonczenia: minutaZakonczenia
    };
  }

  function uporzadkujTechniczneOkresyPomp(listaBudow, listaKursow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const kursy = Array.isArray(listaKursow) ? listaKursow : [];

    return budowy
      .map(function (budowa, indeksWejsciowy) {
        if (!pompy.czyBudowaWymagaPompy(budowa)) {
          return null;
        }

        const okresZajetosci =
          pompy.wyznaczPelnyOkresZajetosciPompyBudowy(budowa, kursy);

        if (!okresZajetosci) {
          return null;
        }

        const granice = pobierzGraniceOkresuTechnicznego(
          okresZajetosci,
          budowa
        );

        return {
          idBudowy: String(budowa.idBudowy || ""),
          indeksWejsciowy: indeksWejsciowy,
          okresZajetosci: okresZajetosci,
          minutaRozpoczeciaZajetosci: granice.minutaRozpoczecia,
          minutaZakonczeniaZajetosci: granice.minutaZakonczenia
        };
      })
      .filter(function (pozycja) {
        return pozycja !== null;
      })
      .sort(function (lewa, prawa) {
        const roznicaStartu =
          lewa.minutaRozpoczeciaZajetosci -
          prawa.minutaRozpoczeciaZajetosci;

        return roznicaStartu || lewa.indeksWejsciowy - prawa.indeksWejsciowy;
      });
  }

  function utworzPompeTechniczna(numerPompyTechnicznej) {
    return {
      idPompyTechnicznej: utworzIdPompyTechnicznej(numerPompyTechnicznej),
      numerPompyTechnicznej: numerPompyTechnicznej,
      minutaDostepnaOd: Number.NEGATIVE_INFINITY,
      ostatnieIdBudowy: null,
      liczbaPrzydzialow: 0
    };
  }

  function znajdzPierwszaWolnaPompeTechniczna(
    pompyTechniczne,
    minutaRozpoczeciaZajetosci
  ) {
    return pompyTechniczne.find(function (pompaTechniczna) {
      return pompaTechniczna.minutaDostepnaOd <=
        minutaRozpoczeciaZajetosci;
    }) || null;
  }

  function obliczMinimalnaLiczbePomp(listaBudow, listaKursow) {
    const kolejka = uporzadkujTechniczneOkresyPomp(listaBudow, listaKursow);
    const pompyTechniczne = [];
    const przydzialyTechniczne = [];

    kolejka.forEach(function (pozycja, indeksKolejnosci) {
      let pompaTechniczna = znajdzPierwszaWolnaPompeTechniczna(
        pompyTechniczne,
        pozycja.minutaRozpoczeciaZajetosci
      );

      if (!pompaTechniczna) {
        pompaTechniczna = utworzPompeTechniczna(
          pompyTechniczne.length + 1
        );
        pompyTechniczne.push(pompaTechniczna);
      }

      pompaTechniczna.minutaDostepnaOd =
        pozycja.minutaZakonczeniaZajetosci;
      pompaTechniczna.ostatnieIdBudowy = pozycja.idBudowy;
      pompaTechniczna.liczbaPrzydzialow += 1;

      przydzialyTechniczne.push({
        idBudowy: pozycja.idBudowy,
        indeksWejsciowy: pozycja.indeksWejsciowy,
        kolejnoscTechniczna: indeksKolejnosci + 1,
        idPompyTechnicznej: pompaTechniczna.idPompyTechnicznej,
        numerPompyTechnicznej: pompaTechniczna.numerPompyTechnicznej,
        okresZajetosci: Object.assign({}, pozycja.okresZajetosci)
      });
    });

    return {
      status: "obliczono",
      minimalnaLiczbaPomp: pompyTechniczne.length,
      liczbaBudowDoPrzydzialu: kolejka.length,
      przydzialyTechniczne: przydzialyTechniczne,
      pompyTechniczne: pompyTechniczne.map(function (pompaTechniczna) {
        return Object.assign({}, pompaTechniczna);
      })
    };
  }

  pompy.uporzadkujTechniczneOkresyPomp = uporzadkujTechniczneOkresyPomp;
  pompy.obliczMinimalnaLiczbePomp = obliczMinimalnaLiczbePomp;
})(window);
