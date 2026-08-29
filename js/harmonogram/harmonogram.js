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

  function pobierzUstawieniaTrybuPomp(parametry) {
    const trybPomp = parametry.trybPomp || "oblicz-potrzebne";

    if (trybPomp === "oblicz-potrzebne") {
      return {
        trybPomp: trybPomp,
        liczbaDostepnychPomp: null
      };
    }

    if (trybPomp !== "mam-okreslona-liczbe") {
      throw new Error("Nie rozpoznano wybranego trybu pracy pomp.");
    }

    const liczbaDostepnychPomp = Number(parametry.liczbaDostepnychPomp);

    if (!Number.isInteger(liczbaDostepnychPomp) || liczbaDostepnychPomp < 0) {
      throw new Error(
        "Liczba dostępnych pomp musi być liczbą całkowitą nie mniejszą niż 0."
      );
    }

    return {
      trybPomp: trybPomp,
      liczbaDostepnychPomp: liczbaDostepnychPomp
    };
  }

  function utworzOpcjePompZBudow(listaBudow, opcjePomp) {
    const opcje = opcjePomp && typeof opcjePomp === "object"
      ? opcjePomp
      : {};

    if (typeof opcje.pobierzDanePrzejazdu === "function") {
      return opcje;
    }

    return Object.assign({}, opcje, {
      pobierzDanePrzejazdu: function (danePrzejazdu) {
        const dane = danePrzejazdu && typeof danePrzejazdu === "object"
          ? danePrzejazdu
          : {};
        const budowaZrodlowa = dane.budowaZrodlowa;
        const budowaDocelowa = dane.budowaDocelowa;
        const mapaPrzejazdow = budowaZrodlowa &&
          budowaZrodlowa.przejazdyPompyMinuty;
        const idBudowyDocelowej = String(
          budowaDocelowa && budowaDocelowa.idBudowy || ""
        ).trim();

        if (
          !mapaPrzejazdow ||
          typeof mapaPrzejazdow !== "object" ||
          Array.isArray(mapaPrzejazdow) ||
          !idBudowyDocelowej ||
          !Object.prototype.hasOwnProperty.call(
            mapaPrzejazdow,
            idBudowyDocelowej
          )
        ) {
          return null;
        }

        return {
          czasPrzejazduMinuty: mapaPrzejazdow[idBudowyDocelowej],
          zrodloCzasuPrzejazdu: "csv"
        };
      }
    });
  }

  function obliczCentralnyWynikPomp(
    listaBudow,
    listaPomp,
    listaKursow,
    parametry,
    opcjePomp
  ) {
    const ustawieniaTrybuPomp = pobierzUstawieniaTrybuPomp(parametry);
    const czyPelnySilnikPompDostepny =
      typeof aplikacja.pompy.obliczMinimalnaLiczbePomp === "function" &&
      typeof aplikacja.pompy.obliczOgraniczonyWynikPomp === "function";

    if (!czyPelnySilnikPompDostepny) {
      return aplikacja.pompy.utworzPustyStanPomp();
    }

    if (ustawieniaTrybuPomp.trybPomp === "mam-okreslona-liczbe") {
      return aplikacja.pompy.obliczOgraniczonyWynikPomp(
        listaBudow,
        listaPomp,
        listaKursow,
        ustawieniaTrybuPomp.liczbaDostepnychPomp,
        opcjePomp
      );
    }

    const wynikBazowy = aplikacja.pompy.utworzWynikSilnikaPomp(
      listaBudow,
      [],
      ustawieniaTrybuPomp,
      listaKursow
    );
    const wynikMinimalnejFloty = aplikacja.pompy.obliczMinimalnaLiczbePomp(
      listaBudow,
      listaKursow
    );

    return Object.assign({}, wynikBazowy, {
      status: "obliczono",
      trybPomp: ustawieniaTrybuPomp.trybPomp,
      minimalnaLiczbaPomp: wynikMinimalnejFloty.minimalnaLiczbaPomp,
      liczbaDostepnychPomp: null,
      liczbaBudowWymagajacychPompy:
        wynikMinimalnejFloty.liczbaBudowDoPrzydzialu,
      wynikMinimalnejFloty: wynikMinimalnejFloty
    });
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
    // 4I.1: pompy dostają bazowe kursy przed korektami ograniczonej floty
    // gruszek. Wyniki obu zasobów są nadal niezależne; sprzężenie należy do Etapu 5.
    const wynikPomp = obliczCentralnyWynikPomp(
      listaBudow,
      aktualneDane.listaPomp,
      kursyZCzasami,
      parametry,
      utworzOpcjePompZBudow(listaBudow, aktualneDane.opcjePomp)
    );
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
      pompy: wynikPomp,
      gruszki: stanGruszek,
      lokalizacje: aplikacja.lokalizacje.utworzPustyStanLokalizacji(),
      kursy: kursy,
      trybGruszek: ustawieniaTrybuGruszek.trybGruszek,
      minimalnaLiczbaGruszek: minimalnaLiczbaGruszek,
      liczbaDostepnychGruszek:
        ustawieniaTrybuGruszek.liczbaDostepnychGruszek,
      trybPomp: wynikPomp.trybPomp,
      minimalnaLiczbaPomp: wynikPomp.minimalnaLiczbaPomp,
      liczbaDostepnychPomp: wynikPomp.liczbaDostepnychPomp,
      konflikty: konflikty,
      komunikaty: [komunikatKursow]
    };
  }

  aplikacja.harmonogram = {
    przeliczCalyHarmonogram: przeliczCalyHarmonogram
  };
})(window);
