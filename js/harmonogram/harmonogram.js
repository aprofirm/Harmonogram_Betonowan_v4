(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function polaczParametry(parametryUzytkownika) {
    return Object.assign(
      {},
      aplikacja.konfiguracja.parametryDomyslne,
      parametryUzytkownika || {}
    );
  }

  function policzOdbioryWlasne(listaBudow) {
    if (!aplikacja.budowy ||
        typeof aplikacja.budowy.czyOdbiorWlasny !== "function") {
      return 0;
    }

    return (Array.isArray(listaBudow) ? listaBudow : []).filter(function (budowa) {
      return aplikacja.budowy.czyOdbiorWlasny(budowa) &&
        budowa.statusRealizacji !== "zrealizowana" &&
        Number(budowa.iloscBetonuLiczbaM3) > 0;
    }).length;
  }

  function utworzKomunikatKursow(kursy, listaBudow) {
    const liczbaOdbiorowWlasnych = policzOdbioryWlasne(listaBudow);
    const dopisekOdbiorow = liczbaOdbiorowWlasnych
      ? " Odbiory własne poza harmonogramem: " + liczbaOdbiorowWlasnych + "."
      : "";

    if (kursy.length) {
      const liczbaGruszek = new Set(
        kursy.map(function (kurs) { return kurs.idGruszki; }).filter(Boolean)
      ).size;
      return "Wygenerowano " + kursy.length +
        " kursów z godzinami pełnego cyklu. Przydzielono " + liczbaGruszek +
        " gruszek bez nakładania ich kursów." + dopisekOdbiorow;
    }

    if (liczbaOdbiorowWlasnych) {
      return "Nie wygenerowano kursów planowanych. Odbiory własne pozostają " +
        "widoczne na liście dnia, ale są realizowane poza automatycznym " +
        "harmonogramem. Odbiory własne: " + liczbaOdbiorowWlasnych + ".";
    }

    return "Nie wygenerowano kursów. Pozycje z 0 m³ są już zrealizowane, " +
      "a pozycje bez ilości wymagają uzupełnienia danych.";
  }

  function przeliczCalyHarmonogram(daneWejsciowe) {
    const aktualneDane = daneWejsciowe || {};
    const parametry = polaczParametry(aktualneDane.parametry);
    const stanImportu = aktualneDane.stanImportu ||
      aplikacja.importCsv.utworzPustyStanImportu();
    const listaBudow = aplikacja.budowy.utworzListeRobocza(
      stanImportu.budowy,
      aktualneDane.budowyReczne
    );
    const wygenerowaneKursy = aplikacja.gruszki.generujKursy(
      listaBudow,
      parametry.pojemnoscGruszkiM3
    );
    const kursyZCzasami = aplikacja.gruszki.obliczCzasyKursow(
      wygenerowaneKursy,
      listaBudow,
      parametry
    );
    const wynikPrzydzialu = aplikacja.gruszki.przydzielGruszkiDoKursow(
      kursyZCzasami
    );
    const kursy = wynikPrzydzialu.kursy;
    const stanGruszek = {
      dostepneGruszki: wynikPrzydzialu.gruszki,
      przydzieloneKursy: kursy
    };
    const komunikatKursow = utworzKomunikatKursow(kursy, listaBudow);

    return {
      etap: aplikacja.konfiguracja.numerEtapu,
      punktEtapu: aplikacja.konfiguracja.punktEtapu,
      status: "gotowy",
      parametry: parametry,
      budowy: listaBudow,
      pompy: aplikacja.pompy.utworzPustyStanPomp(),
      gruszki: stanGruszek,
      lokalizacje: aplikacja.lokalizacje.utworzPustyStanLokalizacji(),
      kursy: kursy,
      konflikty: [],
      komunikaty: [komunikatKursow]
    };
  }

  aplikacja.harmonogram = {
    przeliczCalyHarmonogram: przeliczCalyHarmonogram
  };
})(window);
