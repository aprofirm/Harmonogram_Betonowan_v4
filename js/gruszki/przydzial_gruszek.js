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

  function utworzOgraniczonaFlote(liczbaDostepnychGruszek) {
    const gruszki = [];

    for (
      let numerGruszki = 1;
      numerGruszki <= liczbaDostepnychGruszek;
      numerGruszki += 1
    ) {
      gruszki.push(utworzNowaGruszke(numerGruszki));
    }

    return gruszki;
  }

  function sprawdzLiczbeDostepnychGruszek(wartosc) {
    const liczba = Number(wartosc);

    if (!Number.isInteger(liczba) || liczba < 0) {
      throw new Error(
        "Liczba dostępnych gruszek musi być liczbą całkowitą nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function znajdzPierwszaDostepnaGruszke(gruszki, minutaRozpoczeciaZaladunku) {
    return gruszki.find(function (gruszka) {
      return gruszka.minutaDostepnaOd <= minutaRozpoczeciaZaladunku;
    }) || null;
  }

  function znajdzNajwczesniejDostepnaGruszke(gruszki) {
    return gruszki.reduce(function (najwczesniejsza, gruszka) {
      if (!najwczesniejsza) {
        return gruszka;
      }

      if (gruszka.minutaDostepnaOd < najwczesniejsza.minutaDostepnaOd) {
        return gruszka;
      }

      if (
        gruszka.minutaDostepnaOd === najwczesniejsza.minutaDostepnaOd &&
        gruszka.numerGruszki < najwczesniejsza.numerGruszki
      ) {
        return gruszka;
      }

      return najwczesniejsza;
    }, null);
  }

  function formatujMinuty(minutyDnia) {
    if (typeof aplikacja.gruszki.formatujMinutyJakoGodzine !== "function") {
      throw new Error(
        "Nie można sformatować godzin ograniczonego przydziału gruszek."
      );
    }

    return aplikacja.gruszki.formatujMinutyJakoGodzine(minutyDnia);
  }

  function przesunCzasyKursu(kurs, nowaMinutaRozpoczeciaZaladunku) {
    const planowanaMinutaRozpoczeciaZaladunku =
      pobierzMinuteRozpoczeciaZaladunku(kurs);
    const opoznienieZPowoduGruszekMinuty =
      nowaMinutaRozpoczeciaZaladunku - planowanaMinutaRozpoczeciaZaladunku;
    const czasZaladunkuMinuty = pobierzNieujemnyCzasKursu(
      kurs,
      "calkowityCzasZaladunkuMinuty",
      "Całkowity czas załadunku"
    );
    const czasDojazduMinuty = pobierzNieujemnyCzasKursu(
      kurs,
      "czasDojazduMinuty",
      "Czas dojazdu"
    );
    const czasRozladunkuMinuty = pobierzNieujemnyCzasKursu(
      kurs,
      "calkowityCzasRozladunkuMinuty",
      "Całkowity czas rozładunku"
    );
    const czasPowrotuMinuty = pobierzNieujemnyCzasKursu(
      kurs,
      "czasPowrotuMinuty",
      "Czas powrotu"
    );
    const minutaWyjazduZBetoniarni =
      nowaMinutaRozpoczeciaZaladunku + czasZaladunkuMinuty;
    const minutaRozpoczeciaRozladunku =
      minutaWyjazduZBetoniarni + czasDojazduMinuty;
    const minutaZakonczeniaRozladunku =
      minutaRozpoczeciaRozladunku + czasRozladunkuMinuty;
    const minutaPowrotuDoBetoniarni =
      minutaZakonczeniaRozladunku + czasPowrotuMinuty;

    return Object.assign({}, kurs, {
      planowanaMinutaRozpoczeciaZaladunku: planowanaMinutaRozpoczeciaZaladunku,
      planowanaGodzinaRozpoczeciaZaladunku: kurs.godzinaRozpoczeciaZaladunku,
      planowanaGodzinaRozpoczeciaRozladunku: kurs.godzinaRozpoczeciaRozladunku,
      opoznienieZPowoduGruszekMinuty: opoznienieZPowoduGruszekMinuty,
      minutaRozpoczeciaZaladunku: nowaMinutaRozpoczeciaZaladunku,
      godzinaRozpoczeciaZaladunku: formatujMinuty(
        nowaMinutaRozpoczeciaZaladunku
      ),
      godzinaWyjazduZBetoniarni: formatujMinuty(minutaWyjazduZBetoniarni),
      godzinaPrzyjazduNaBudowe: formatujMinuty(
        minutaRozpoczeciaRozladunku
      ),
      godzinaRozpoczeciaRozladunku: formatujMinuty(
        minutaRozpoczeciaRozladunku
      ),
      godzinaZakonczeniaRozladunku: formatujMinuty(
        minutaZakonczeniaRozladunku
      ),
      godzinaPowrotuDoBetoniarni: formatujMinuty(
        minutaPowrotuDoBetoniarni
      ),
      godzinaGotowosciDoKolejnegoKursu: formatujMinuty(
        minutaPowrotuDoBetoniarni
      )
    });
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

  function przydzielOgraniczonaLiczbeGruszekDoKursow(
    kursy,
    liczbaDostepnychGruszek
  ) {
    const liczbaGruszek = sprawdzLiczbeDostepnychGruszek(
      liczbaDostepnychGruszek
    );
    const uporzadkowaneKursy = uporzadkujKursy(kursy);
    const liczbaTechnicznychGruszek = Math.min(
      liczbaGruszek,
      uporzadkowaneKursy.length
    );
    const gruszki = utworzOgraniczonaFlote(liczbaTechnicznychGruszek);
    const przydzieloneKursy = [];
    let liczbaOpoznionychKursow = 0;
    let maksymalneOpoznienieKursuMinuty = 0;

    if (liczbaGruszek === 0) {
      return {
        kursy: uporzadkowaneKursy.map(function (pozycja) {
          return Object.assign({}, pozycja.kurs, {
            idGruszki: null,
            numerGruszki: null,
            statusKursu: "nieprzydzielony-brak-gruszki",
            opoznienieZPowoduGruszekMinuty: null
          });
        }),
        gruszki: [],
        liczbaDostepnychGruszek: 0,
        liczbaNieprzydzielonychKursow: uporzadkowaneKursy.length,
        liczbaOpoznionychKursow: 0,
        maksymalneOpoznienieKursuMinuty: 0,
        czyOgraniczenieWplyneloNaPlan: uporzadkowaneKursy.length > 0
      };
    }

    uporzadkowaneKursy.forEach(function (pozycja) {
      const planowanaMinutaRozpoczeciaZaladunku =
        pozycja.minutaRozpoczeciaZaladunku;
      const wolnaGruszka = znajdzPierwszaDostepnaGruszke(
        gruszki,
        planowanaMinutaRozpoczeciaZaladunku
      );
      const gruszka = wolnaGruszka || znajdzNajwczesniejDostepnaGruszke(gruszki);
      const rzeczywistaMinutaRozpoczeciaZaladunku = Math.max(
        planowanaMinutaRozpoczeciaZaladunku,
        gruszka.minutaDostepnaOd
      );
      const przesunietyKurs = przesunCzasyKursu(
        pozycja.kurs,
        rzeczywistaMinutaRozpoczeciaZaladunku
      );
      const minutaGotowosciDoKolejnegoKursu =
        obliczMinuteGotowosciDoKolejnegoKursu(przesunietyKurs);

      if (przesunietyKurs.opoznienieZPowoduGruszekMinuty > 0) {
        liczbaOpoznionychKursow += 1;
        maksymalneOpoznienieKursuMinuty = Math.max(
          maksymalneOpoznienieKursuMinuty,
          przesunietyKurs.opoznienieZPowoduGruszekMinuty
        );
      }

      gruszka.minutaDostepnaOd = minutaGotowosciDoKolejnegoKursu;
      gruszka.ostatniIdKursu = przesunietyKurs.idKursu || null;

      przydzieloneKursy.push(Object.assign({}, przesunietyKurs, {
        idGruszki: gruszka.idGruszki,
        numerGruszki: gruszka.numerGruszki,
        statusKursu: "przydzielony",
        minutaGotowosciDoKolejnegoKursu: minutaGotowosciDoKolejnegoKursu
      }));
    });

    return {
      kursy: przydzieloneKursy,
      gruszki: gruszki.map(function (gruszka) {
        return Object.assign({}, gruszka);
      }),
      liczbaDostepnychGruszek: liczbaGruszek,
      liczbaNieprzydzielonychKursow: 0,
      liczbaOpoznionychKursow: liczbaOpoznionychKursow,
      maksymalneOpoznienieKursuMinuty: maksymalneOpoznienieKursuMinuty,
      czyOgraniczenieWplyneloNaPlan: liczbaOpoznionychKursow > 0
    };
  }

  aplikacja.gruszki.obliczMinuteGotowosciDoKolejnegoKursu =
    obliczMinuteGotowosciDoKolejnegoKursu;
  aplikacja.gruszki.przydzielGruszkiDoKursow = przydzielGruszkiDoKursow;
  aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow =
    przydzielOgraniczonaLiczbeGruszekDoKursow;
})(window);
