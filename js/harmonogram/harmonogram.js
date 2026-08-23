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

  function pobierzUstawieniaTrybuGruszek(parametry) {
    const trybGruszek = parametry.trybGruszek || "oblicz-potrzebne";

    if (trybGruszek === "oblicz-potrzebne") {
      return {
        trybGruszek: trybGruszek,
        liczbaDostepnychGruszek: null
      };
    }

    if (trybGruszek !== "mam-okreslona-liczbe") {
      throw new Error("Nie rozpoznano wybranego trybu pracy gruszek.");
    }

    const liczbaDostepnychGruszek = Number(parametry.liczbaDostepnychGruszek);

    if (
      !Number.isInteger(liczbaDostepnychGruszek) ||
      liczbaDostepnychGruszek < 0
    ) {
      throw new Error(
        "Liczba dostępnych gruszek musi być liczbą całkowitą nie mniejszą niż 0."
      );
    }

    return {
      trybGruszek: trybGruszek,
      liczbaDostepnychGruszek: liczbaDostepnychGruszek
    };
  }

  function utworzDopisekOdbiorowWlasnych(listaBudow) {
    const liczbaOdbiorowWlasnych = policzOdbioryWlasne(listaBudow);

    return liczbaOdbiorowWlasnych
      ? " Odbiory własne poza harmonogramem: " + liczbaOdbiorowWlasnych + "."
      : "";
  }

  function utworzKomunikatKursow(
    kursy,
    listaBudow,
    minimalnaLiczbaGruszek
  ) {
    const liczbaOdbiorowWlasnych = policzOdbioryWlasne(listaBudow);
    const dopisekOdbiorow = utworzDopisekOdbiorowWlasnych(listaBudow);

    if (kursy.length) {
      return "Wygenerowano " + kursy.length +
        " kursów z godzinami pełnego cyklu. Minimalna liczba gruszek " +
        "potrzebna do realizacji bez nakładania kursów: " +
        minimalnaLiczbaGruszek + "." + dopisekOdbiorow;
    }

    if (liczbaOdbiorowWlasnych) {
      return "Nie wygenerowano kursów planowanych. Odbiory własne pozostają " +
        "widoczne na liście dnia, ale są realizowane poza automatycznym " +
        "harmonogramem. Odbiory własne: " + liczbaOdbiorowWlasnych + ".";
    }

    return "Nie wygenerowano kursów. Pozycje z 0 m³ są już zrealizowane, " +
      "a pozycje bez ilości wymagają uzupełnienia danych.";
  }

  function utworzKomunikatOgraniczonejFloty(
    wynikPrzydzialu,
    minimalnaLiczbaGruszek,
    listaBudow
  ) {
    const liczbaDostepnychGruszek =
      wynikPrzydzialu.liczbaDostepnychGruszek;
    const dopisekOdbiorow = utworzDopisekOdbiorowWlasnych(listaBudow);

    if (wynikPrzydzialu.liczbaNieprzydzielonychKursow > 0) {
      return "Minimalna liczba potrzebnych gruszek: " +
        minimalnaLiczbaGruszek + ". Dostępne gruszki: 0. Nie przydzielono " +
        wynikPrzydzialu.liczbaNieprzydzielonychKursow +
        " kursów." + dopisekOdbiorow;
    }

    if (!wynikPrzydzialu.czyOgraniczenieWplyneloNaPlan) {
      return "Dostępnych gruszek: " + liczbaDostepnychGruszek +
        ". Minimalna liczba potrzebnych: " + minimalnaLiczbaGruszek +
        "; ograniczenie nie zmienia godzin kursów." + dopisekOdbiorow;
    }

    return "Minimalna liczba potrzebnych gruszek: " +
      minimalnaLiczbaGruszek + ". Dostępne gruszki: " +
      liczbaDostepnychGruszek + ". Przeliczono kursy. " +
      "Opóźnionych kursów: " + wynikPrzydzialu.liczbaOpoznionychKursow +
      ", największe opóźnienie: " +
      wynikPrzydzialu.maksymalneOpoznienieKursuMinuty +
      " min." + dopisekOdbiorow;
  }

  function utworzKonfliktyOgraniczonejFloty(wynikPrzydzialu) {
    if (wynikPrzydzialu.liczbaNieprzydzielonychKursow <= 0) {
      return [];
    }

    return [{
      kod: "BRAK_DOSTEPNYCH_GRUSZEK",
      rodzaj: "gruszki",
      opis: "Nie można przydzielić kursów, ponieważ dostępnych jest 0 gruszek.",
      liczbaKursow: wynikPrzydzialu.liczbaNieprzydzielonychKursow
    }];
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
    const ustawieniaTrybuGruszek = pobierzUstawieniaTrybuGruszek(parametry);
    const wynikMinimalnejFloty = aplikacja.gruszki.przydzielGruszkiDoKursow(
      kursyZCzasami
    );
    const czyOgraniczonaFlota =
      ustawieniaTrybuGruszek.trybGruszek === "mam-okreslona-liczbe";
    const wynikPrzydzialu = czyOgraniczonaFlota
      ? aplikacja.gruszki.przydzielOgraniczonaLiczbeGruszekDoKursow(
        kursyZCzasami,
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek
      )
      : wynikMinimalnejFloty;
    const kursy = wynikPrzydzialu.kursy;
    const minimalnaLiczbaGruszek =
      wynikMinimalnejFloty.minimalnaLiczbaGruszek;
    const stanGruszek = {
      trybGruszek: ustawieniaTrybuGruszek.trybGruszek,
      minimalnaLiczbaGruszek: minimalnaLiczbaGruszek,
      liczbaDostepnychGruszek:
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,
      dostepneGruszki: wynikPrzydzialu.gruszki,
      przydzieloneKursy: kursy,
      liczbaNieprzydzielonychKursow:
        wynikPrzydzialu.liczbaNieprzydzielonychKursow || 0,
      liczbaOpoznionychKursow:
        wynikPrzydzialu.liczbaOpoznionychKursow || 0,
      maksymalneOpoznienieKursuMinuty:
        wynikPrzydzialu.maksymalneOpoznienieKursuMinuty || 0,
      czyOgraniczenieWplyneloNaPlan:
        Boolean(wynikPrzydzialu.czyOgraniczenieWplyneloNaPlan)
    };
    const komunikatKursow = czyOgraniczonaFlota
      ? utworzKomunikatOgraniczonejFloty(
        wynikPrzydzialu,
        minimalnaLiczbaGruszek,
        listaBudow
      )
      : utworzKomunikatKursow(
        kursy,
        listaBudow,
        minimalnaLiczbaGruszek
      );
    const konflikty = czyOgraniczonaFlota
      ? utworzKonfliktyOgraniczonejFloty(wynikPrzydzialu)
      : [];

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
      trybGruszek: ustawieniaTrybuGruszek.trybGruszek,
      minimalnaLiczbaGruszek: minimalnaLiczbaGruszek,
      liczbaDostepnychGruszek:
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,
      konflikty: konflikty,
      komunikaty: [komunikatKursow]
    };
  }

  aplikacja.harmonogram = {
    przeliczCalyHarmonogram: przeliczCalyHarmonogram
  };
})(window);
