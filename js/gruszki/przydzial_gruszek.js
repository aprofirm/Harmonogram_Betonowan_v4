(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  aplikacja.gruszki = aplikacja.gruszki || {};

  function pobierzMinuteRozpoczeciaZaladunku(kurs) {
    const minuta = Number(kurs && kurs.minutaRozpoczeciaZaladunku);

    if (!Number.isFinite(minuta)) {
      throw new Error(
        "Kurs „" + String(kurs && kurs.idKursu || "bez ID") +
          "” nie ma poprawnej minuty rozpoczęcia załadunku."
      );
    }

    return minuta;
  }

  function pobierzNieujemnyCzasKursu(kurs, nazwaPola, etykieta) {
    const czas = Number(kurs && kurs[nazwaPola]);

    if (!Number.isFinite(czas) || czas < 0) {
      throw new Error(
        "Kurs „" + String(kurs && kurs.idKursu || "bez ID") +
          "” nie ma poprawnej wartości pola „" + etykieta + "”."
      );
    }

    return czas;
  }

  function obliczMinuteGotowosciDoKolejnegoKursu(kurs) {
    return pobierzMinuteRozpoczeciaZaladunku(kurs) +
      pobierzNieujemnyCzasKursu(
        kurs,
        "calkowityCzasZaladunkuMinuty",
        "Całkowity czas załadunku"
      ) +
      pobierzNieujemnyCzasKursu(kurs, "czasDojazduMinuty", "Czas dojazdu") +
      pobierzNieujemnyCzasKursu(
        kurs,
        "calkowityCzasRozladunkuMinuty",
        "Całkowity czas rozładunku"
      ) +
      pobierzNieujemnyCzasKursu(kurs, "czasPowrotuMinuty", "Czas powrotu");
  }

  function utworzIdGruszki(numerGruszki) {
    return "GRUSZKA-" + String(numerGruszki).padStart(3, "0");
  }

  function utworzNowaGruszke(numerGruszki) {
    return {
      idGruszki: utworzIdGruszki(numerGruszki),
      numerGruszki: numerGruszki,
      minutaDostepnaOd: Number.NEGATIVE_INFINITY,
      ostatniIdKursu: null
    };
  }

  function znajdzPierwszaDostepnaGruszke(gruszki, minutaRozpoczeciaZaladunku) {
    return gruszki.find(function (gruszka) {
      return gruszka.minutaDostepnaOd <= minutaRozpoczeciaZaladunku;
    }) || null;
  }

  function uporzadkujKursy(kursy) {
    return (Array.isArray(kursy) ? kursy : [])
      .map(function (kurs, indeksPierwotny) {
        return {
          kurs: kurs,
          indeksPierwotny: indeksPierwotny,
          minutaRozpoczeciaZaladunku: pobierzMinuteRozpoczeciaZaladunku(kurs)
        };
      })
      .sort(function (lewy, prawy) {
        const roznicaCzasu =
          lewy.minutaRozpoczeciaZaladunku - prawy.minutaRozpoczeciaZaladunku;
        return roznicaCzasu || lewy.indeksPierwotny - prawy.indeksPierwotny;
      });
  }

  function przydzielGruszkiDoKursow(kursy) {
    const uporzadkowaneKursy = uporzadkujKursy(kursy);
    const gruszki = [];
    const przydzieloneKursy = [];

    uporzadkowaneKursy.forEach(function (pozycja) {
      const kurs = pozycja.kurs;
      const minutaRozpoczeciaZaladunku = pozycja.minutaRozpoczeciaZaladunku;
      let gruszka = znajdzPierwszaDostepnaGruszke(
        gruszki,
        minutaRozpoczeciaZaladunku
      );

      if (!gruszka) {
        gruszka = utworzNowaGruszke(gruszki.length + 1);
        gruszki.push(gruszka);
      }

      const minutaGotowosciDoKolejnegoKursu =
        obliczMinuteGotowosciDoKolejnegoKursu(kurs);

      gruszka.minutaDostepnaOd = minutaGotowosciDoKolejnegoKursu;
      gruszka.ostatniIdKursu = kurs.idKursu || null;

      przydzieloneKursy.push(Object.assign({}, kurs, {
        idGruszki: gruszka.idGruszki,
        numerGruszki: gruszka.numerGruszki,
        statusKursu: "przydzielony",
        minutaGotowosciDoKolejnegoKursu: minutaGotowosciDoKolejnegoKursu
      }));
    });

    return {
      kursy: przydzieloneKursy,
      minimalnaLiczbaGruszek: gruszki.length,
      gruszki: gruszki.map(function (gruszka) {
        return Object.assign({}, gruszka);
      })
    };
  }

  aplikacja.gruszki.obliczMinuteGotowosciDoKolejnegoKursu =
    obliczMinuteGotowosciDoKolejnegoKursu;
  aplikacja.gruszki.przydzielGruszkiDoKursow = przydzielGruszkiDoKursow;
})(window);
