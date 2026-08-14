(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzPustyStanGruszek() {
    return {
      dostepneGruszki: [],
      przydzieloneKursy: []
    };
  }

  function sprawdzPojemnoscGruszki(pojemnoscGruszkiM3) {
    const pojemnosc = Number(pojemnoscGruszkiM3);

    if (!Number.isFinite(pojemnosc) || pojemnosc <= 0) {
      throw new Error("Pojemność gruszki musi być liczbą większą od 0 m³.");
    }

    return pojemnosc;
  }

  function zaokraglijIloscBetonu(wartosc) {
    return Math.round((wartosc + Number.EPSILON) * 1000) / 1000;
  }

  function pobierzIloscDoZaplanowania(budowa) {
    if (!budowa || budowa.statusRealizacji === "zrealizowana") {
      return 0;
    }

    const iloscBetonuM3 = Number(budowa.iloscBetonuLiczbaM3);

    if (!Number.isFinite(iloscBetonuM3)) {
      return 0;
    }

    if (iloscBetonuM3 < 0) {
      throw new Error(
        "Ilość betonu dla budowy „" + budowa.idBudowy +
          "” nie może być mniejsza od 0 m³."
      );
    }

    if (iloscBetonuM3 === 0) {
      return 0;
    }

    return iloscBetonuM3;
  }

  function utworzIdKursu(idBudowy, numerKursu) {
    return String(idBudowy) + "-KURS-" + String(numerKursu).padStart(3, "0");
  }

  function generujKursyDlaBudowy(budowa, pojemnoscGruszkiM3) {
    const pojemnosc = sprawdzPojemnoscGruszki(pojemnoscGruszkiM3);
    const iloscDoZaplanowaniaM3 = pobierzIloscDoZaplanowania(budowa);

    if (iloscDoZaplanowaniaM3 === 0) {
      return [];
    }

    const liczbaKursow = Math.ceil(iloscDoZaplanowaniaM3 / pojemnosc);
    const kursy = [];
    let iloscJuzRozdzielonaM3 = 0;

    for (let numerKursu = 1; numerKursu <= liczbaKursow; numerKursu += 1) {
      const pozostalaIloscM3 = zaokraglijIloscBetonu(
        iloscDoZaplanowaniaM3 - iloscJuzRozdzielonaM3
      );
      const iloscWKursieM3 = zaokraglijIloscBetonu(
        Math.min(pojemnosc, pozostalaIloscM3)
      );

      kursy.push({
        idKursu: utworzIdKursu(budowa.idBudowy, numerKursu),
        idBudowy: budowa.idBudowy,
        numerKursu: numerKursu,
        liczbaKursowBudowy: liczbaKursow,
        iloscBetonuM3: iloscWKursieM3,
        pojemnoscGruszkiM3: pojemnosc,
        statusKursu: "oczekuje-na-przydzial"
      });

      iloscJuzRozdzielonaM3 = zaokraglijIloscBetonu(
        iloscJuzRozdzielonaM3 + iloscWKursieM3
      );
    }

    return kursy;
  }

  function generujKursy(listaBudow, pojemnoscGruszkiM3) {
    const pojemnosc = sprawdzPojemnoscGruszki(pojemnoscGruszkiM3);
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    return budowy.reduce(function (wszystkieKursy, budowa) {
      return wszystkieKursy.concat(generujKursyDlaBudowy(budowa, pojemnosc));
    }, []);
  }

  aplikacja.gruszki = {
    utworzPustyStanGruszek: utworzPustyStanGruszek,
    generujKursyDlaBudowy: generujKursyDlaBudowy,
    generujKursy: generujKursy
  };
})(window);
