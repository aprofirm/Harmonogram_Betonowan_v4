(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const WERSJA_KONTRAKTU = 1;
  const DOZWOLONE_TYPY_POWIAZAN = [
    "harmonogram",
    "budowa",
    "kurs",
    "zasob",
    "parametr"
  ];

  if (
    !aplikacja.harmonogram ||
    typeof aplikacja.harmonogram.przeliczCalyHarmonogram !== "function"
  ) {
    throw new Error(
      "Moduł kontraktu konfliktów wymaga głównego silnika harmonogramu."
    );
  }

  function pobierzWymaganyTekst(wartosc, nazwaPola) {
    const tekst = String(wartosc === null || wartosc === undefined ? "" : wartosc)
      .trim();

    if (!tekst) {
      throw new Error(
        "Konflikt wymaga niepustego pola „" + nazwaPola + "”."
      );
    }

    return tekst;
  }

  function dodajPowiazanie(lista, typ, id, rola) {
    const typPowiazania = String(typ || "").trim();
    const idPowiazania = String(id || "").trim();
    const rolaPowiazania = String(rola || "dotyczy").trim() || "dotyczy";

    if (
      !DOZWOLONE_TYPY_POWIAZAN.includes(typPowiazania) ||
      !idPowiazania
    ) {
      return;
    }

    const czyIstnieje = lista.some(function (powiazanie) {
      return powiazanie.typ === typPowiazania &&
        powiazanie.id === idPowiazania &&
        powiazanie.rola === rolaPowiazania;
    });

    if (!czyIstnieje) {
      lista.push({
        typ: typPowiazania,
        id: idPowiazania,
        rola: rolaPowiazania
      });
    }
  }

  function pobierzKategorieKonfliktu(konflikt) {
    const kategoriaJawna = String(
      konflikt && konflikt.kategoriaKonfliktu || ""
    ).trim();

    if (kategoriaJawna) {
      return kategoriaJawna;
    }

    const kod = String(konflikt && konflikt.kod || "");
    const przyczyna = String(konflikt && konflikt.przyczyna || "");

    if (kod === "BRAK_DOSTEPNYCH_GRUSZEK") {
      return "brak-gruszki";
    }

    if (kod === "BRAK_MOZLIWEJ_POMPY") {
      if (przyczyna === "brak-trasy") {
        return "brak-trasy";
      }

      if (
        przyczyna === "po-dostepnosci" ||
        przyczyna === "pompa-nieaktywna"
      ) {
        return "niedostepnosc";
      }

      if (przyczyna === "niewystarczajacy-wysieg") {
        return "niezgodny-parametr";
      }

      return "brak-pompy";
    }

    if (kod === "PRZEKROCZONY_LIMIT_OPOZNIENIA_STARTU") {
      return "limit-startu";
    }

    if (kod === "PRZEKROCZONY_LIMIT_PRZESTOJU_BETONOWANIA") {
      return "limit-przestoju";
    }

    if (kod === "NIESTABILNY_HARMONOGRAM_LIMIT_ITERACJI") {
      return "niestabilnosc";
    }

    return "inne";
  }

  function pobierzPowiazaniaKonfliktu(konflikt) {
    const powiazania = [];
    const istniejacePowiazania = Array.isArray(konflikt.powiazania)
      ? konflikt.powiazania
      : [];

    istniejacePowiazania.forEach(function (powiazanie) {
      dodajPowiazanie(
        powiazania,
        powiazanie && powiazanie.typ,
        powiazanie && powiazanie.id,
        powiazanie && powiazanie.rola
      );
    });

    dodajPowiazanie(powiazania, "budowa", konflikt.idBudowy, "dotyczy");
    dodajPowiazanie(powiazania, "kurs", konflikt.idKursu, "dotyczy");
    dodajPowiazanie(
      powiazania,
      "kurs",
      konflikt.idPoprzedniegoKursu,
      "poprzedni"
    );
    dodajPowiazanie(
      powiazania,
      "kurs",
      konflikt.idNastepnegoKursu,
      "nastepny"
    );
    dodajPowiazanie(
      powiazania,
      "zasob",
      konflikt.idPompy ? "pompa:" + konflikt.idPompy : "",
      "pompa"
    );
    dodajPowiazanie(
      powiazania,
      "zasob",
      konflikt.idGruszki ? "gruszka:" + konflikt.idGruszki : "",
      "gruszka"
    );
    dodajPowiazanie(
      powiazania,
      "parametr",
      konflikt.nazwaParametru,
      "dotyczy"
    );

    if (
      konflikt.rodzaj === "gruszki" ||
      konflikt.kod === "BRAK_DOSTEPNYCH_GRUSZEK"
    ) {
      dodajPowiazanie(powiazania, "zasob", "gruszki", "typ-zasobu");
    }

    if (
      konflikt.rodzaj === "pompy" ||
      konflikt.kod === "BRAK_MOZLIWEJ_POMPY"
    ) {
      dodajPowiazanie(powiazania, "zasob", "pompy", "typ-zasobu");
    }

    if (!powiazania.length) {
      dodajPowiazanie(powiazania, "harmonogram", "glowny", "dotyczy");
    }

    return powiazania;
  }

  function pobierzNazweBudowyDlaKomunikatu(konflikt) {
    return String(
      konflikt && (konflikt.nazwaBudowy || konflikt.idBudowy) || ""
    ).trim();
  }

  function pobierzEtykieteKursu(konflikt, nazwaNumeru, nazwaId) {
    const numer = konflikt && konflikt[nazwaNumeru];
    const id = String(konflikt && konflikt[nazwaId] || "").trim();

    if (numer !== null && numer !== undefined && String(numer).trim() !== "") {
      return "kursu " + String(numer).trim();
    }

    if (id) {
      return "kursu „" + id + "”";
    }

    return "kursu";
  }

  function utworzKomunikatOperatora(konflikt) {
    const kategoria = String(
      konflikt && konflikt.kategoriaKonfliktu ||
      pobierzKategorieKonfliktu(konflikt)
    ).trim();
    const nazwaBudowy = pobierzNazweBudowyDlaKomunikatu(konflikt);
    const budowa = nazwaBudowy ? "Budowa „" + nazwaBudowy + "”: " : "";

    if (kategoria === "brak-gruszki") {
      const liczbaKursow = Number(konflikt && konflikt.liczbaKursow);

      if (Number.isFinite(liczbaKursow) && liczbaKursow > 0) {
        return "Brak dostępnych gruszek. Nie można przydzielić " +
          liczbaKursow + " kursów.";
      }

      return "Brak dostępnej gruszki do realizacji planu.";
    }

    if (kategoria === "brak-pompy") {
      return budowa +
        "nie znaleziono dostępnej pompy spełniającej wymagania tej budowy.";
    }

    if (kategoria === "niedostepnosc") {
      return budowa +
        "żadna zgodna pompa nie jest dostępna w wymaganym czasie.";
    }

    if (kategoria === "niezgodny-parametr") {
      return budowa +
        "dostępne pompy nie mają wystarczającego wysięgu.";
    }

    if (kategoria === "brak-trasy") {
      return budowa +
        "brakuje czasu przejazdu pompy potrzebnego do wyznaczenia przydziału. " +
        "Uzupełnij czas przejazdu między budowami.";
    }

    if (kategoria === "limit-startu") {
      const startZadany = String(konflikt && konflikt.startZadany || "").trim();
      const startRoboczy = String(konflikt && konflikt.startRoboczy || "").trim();
      const opoznienie = Number(konflikt && konflikt.opoznienieStartuMinuty);
      const limit = Number(
        konflikt && konflikt.maksymalneOpoznienieStartuMinuty
      );
      const przekroczenie = Number(
        konflikt && konflikt.przekroczenieLimituMinuty
      );

      if (
        startZadany &&
        startRoboczy &&
        Number.isFinite(opoznienie) &&
        Number.isFinite(limit) &&
        Number.isFinite(przekroczenie)
      ) {
        return budowa + "start przesunął się z " + startZadany + " na " +
          startRoboczy + " (" + opoznienie + " min opóźnienia). Limit " +
          limit + " min został przekroczony o " + przekroczenie + " min.";
      }

      return budowa + "przekroczono dopuszczalny limit opóźnienia startu.";
    }

    if (kategoria === "limit-przestoju") {
      const poprzedniKurs = pobierzEtykieteKursu(
        konflikt,
        "numerPoprzedniegoKursu",
        "idPoprzedniegoKursu"
      );
      const nastepnyKurs = pobierzEtykieteKursu(
        konflikt,
        "numerNastepnegoKursu",
        "idNastepnegoKursu"
      );
      const przestoj = Number(konflikt && konflikt.przestojMinuty);
      const limit = Number(konflikt && konflikt.maksymalnyPrzestojMinuty);
      const przekroczenie = Number(
        konflikt && konflikt.przekroczenieLimituMinuty
      );

      if (
        Number.isFinite(przestoj) &&
        Number.isFinite(limit) &&
        Number.isFinite(przekroczenie)
      ) {
        return budowa + "przerwa między końcem rozładunku " + poprzedniKurs +
          " a początkiem rozładunku " + nastepnyKurs + " wynosi " +
          przestoj + " min. Limit " + limit + " min został przekroczony o " +
          przekroczenie + " min.";
      }

      return budowa + "przerwa między kolejnymi dostawami przekracza limit.";
    }

    if (kategoria === "niestabilnosc") {
      const liczbaIteracji = Number(konflikt && konflikt.liczbaIteracji);
      const maksymalnaLiczbaIteracji = Number(
        konflikt && konflikt.maksymalnaLiczbaIteracji
      );

      if (
        Number.isFinite(liczbaIteracji) &&
        Number.isFinite(maksymalnaLiczbaIteracji)
      ) {
        return "Harmonogram nie osiągnął stabilności po " + liczbaIteracji +
          " iteracjach (limit " + maksymalnaLiczbaIteracji +
          "). Plan wymaga ręcznej weryfikacji.";
      }

      return "Harmonogram nie osiągnął stabilności. Plan wymaga ręcznej weryfikacji.";
    }

    if (kategoria === "kolizja") {
      return budowa +
        "wykryto kolizję zasobu — ten sam zasób jest potrzebny w nakładających się okresach.";
    }

    return String(konflikt && konflikt.opis || "").trim() ||
      "Wykryto konflikt wymagający uwagi operatora.";
  }

  function normalizujKonflikt(konflikt) {
    if (!konflikt || typeof konflikt !== "object" || Array.isArray(konflikt)) {
      throw new Error("Konflikt musi być obiektem.");
    }

    const kod = pobierzWymaganyTekst(konflikt.kod, "kod");
    const rodzaj = pobierzWymaganyTekst(konflikt.rodzaj, "rodzaj");
    const opis = pobierzWymaganyTekst(konflikt.opis, "opis");
    const znormalizowanyKonflikt = Object.assign({}, konflikt, {
      wersjaKontraktu: WERSJA_KONTRAKTU,
      poziom: "konflikt",
      kod: kod,
      rodzaj: rodzaj,
      kategoriaKonfliktu: pobierzKategorieKonfliktu(konflikt),
      opis: opis,
      powiazania: pobierzPowiazaniaKonfliktu(konflikt)
    });

    return Object.assign({}, znormalizowanyKonflikt, {
      komunikatOperatora: utworzKomunikatOperatora(znormalizowanyKonflikt)
    });
  }

  function normalizujListeKonfliktow(listaKonfliktow) {
    return (Array.isArray(listaKonfliktow) ? listaKonfliktow : [])
      .map(normalizujKonflikt);
  }

  function uporzadkujPowiazaniaDoKlucza(powiazania) {
    return (Array.isArray(powiazania) ? powiazania : [])
      .map(function (powiazanie) {
        return [
          String(powiazanie && powiazanie.typ || ""),
          String(powiazanie && powiazanie.id || ""),
          String(powiazanie && powiazanie.rola || "")
        ];
      })
      .sort(function (pierwsze, drugie) {
        const tekstPierwszy = JSON.stringify(pierwsze);
        const tekstDrugi = JSON.stringify(drugie);

        if (tekstPierwszy < tekstDrugi) {
          return -1;
        }

        if (tekstPierwszy > tekstDrugi) {
          return 1;
        }

        return 0;
      });
  }

  function pobierzKluczZnormalizowanegoKonfliktu(konflikt) {
    return JSON.stringify([
      konflikt.wersjaKontraktu,
      konflikt.poziom,
      konflikt.kod,
      konflikt.rodzaj,
      konflikt.kategoriaKonfliktu,
      String(konflikt.przyczyna || ""),
      uporzadkujPowiazaniaDoKlucza(konflikt.powiazania)
    ]);
  }

  function pobierzKluczTozsamosciKonfliktu(konflikt) {
    return pobierzKluczZnormalizowanegoKonfliktu(
      normalizujKonflikt(konflikt)
    );
  }

  function agregujListeKonfliktow(listaKonfliktow) {
    const widzianeKlucze = new Set();
    const wynik = [];

    normalizujListeKonfliktow(listaKonfliktow).forEach(function (konflikt) {
      const klucz = pobierzKluczZnormalizowanegoKonfliktu(konflikt);

      if (widzianeKlucze.has(klucz)) {
        return;
      }

      widzianeKlucze.add(klucz);
      wynik.push(konflikt);
    });

    return wynik;
  }

  function utworzKonflikt(daneKonfliktu) {
    return normalizujKonflikt(daneKonfliktu);
  }

  const przeliczCalyHarmonogramPodstawowy =
    aplikacja.harmonogram.przeliczCalyHarmonogram;

  aplikacja.harmonogram.przeliczCalyHarmonogram = function (daneWejsciowe) {
    const wynik = przeliczCalyHarmonogramPodstawowy(daneWejsciowe);

    wynik.konflikty = agregujListeKonfliktow(wynik.konflikty);
    return wynik;
  };

  aplikacja.konflikty = {
    wersjaKontraktu: WERSJA_KONTRAKTU,
    utworzKonflikt: utworzKonflikt,
    normalizujKonflikt: normalizujKonflikt,
    normalizujListeKonfliktow: normalizujListeKonfliktow,
    utworzKomunikatOperatora: utworzKomunikatOperatora,
    pobierzKluczTozsamosciKonfliktu: pobierzKluczTozsamosciKonfliktu,
    agregujListeKonfliktow: agregujListeKonfliktow
  };
})(window);
