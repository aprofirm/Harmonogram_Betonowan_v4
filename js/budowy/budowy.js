(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function pobierzWymaganyTekst(wartosc, nazwaPola, numerWiersza) {
    const tekst = wartosc === null || wartosc === undefined ? "" : String(wartosc).trim();

    if (!tekst) {
      const dopisekWiersza = numerWiersza ? " w wierszu " + numerWiersza : "";
      throw new Error("Pole „" + nazwaPola + "” nie może być puste" + dopisekWiersza + ".");
    }

    return tekst;
  }

  function dodajMinutyDoGodziny(godzina, liczbaMinut) {
    const czesci = godzina.split(":");
    const minutyDnia = Number(czesci[0]) * 60 + Number(czesci[1]) + liczbaMinut;
    const minutyPoPolnocy = ((minutyDnia % 1440) + 1440) % 1440;
    const godziny = Math.floor(minutyPoPolnocy / 60);
    const minuty = minutyPoPolnocy % 60;

    return String(godziny).padStart(2, "0") + ":" + String(minuty).padStart(2, "0");
  }

  function przetworzStartPlanowany(wartosc, numerWiersza) {
    const wartoscZrodlowa = pobierzWymaganyTekst(wartosc, "StartPlanowany", numerWiersza);
    const dopasowanieTolerancji = wartoscZrodlowa.match(
      /^(\d{1,2}:\d{2})\s*\(\s*[+-](\d+)\s*min\s*\)$/i
    );

    if (!dopasowanieTolerancji) {
      return {
        wartoscZrodlowa: wartoscZrodlowa,
        startPlanowany: wartoscZrodlowa,
        tolerancjaStartuMinuty: 0,
        najpozniejszyStart: wartoscZrodlowa
      };
    }

    const startPlanowany = dopasowanieTolerancji[1].padStart(5, "0");
    const tolerancjaStartuMinuty = Number(dopasowanieTolerancji[2]);

    return {
      wartoscZrodlowa: wartoscZrodlowa,
      startPlanowany: startPlanowany,
      tolerancjaStartuMinuty: tolerancjaStartuMinuty,
      najpozniejszyStart: dodajMinutyDoGodziny(startPlanowany, tolerancjaStartuMinuty)
    };
  }

  function pobierzIloscBetonuLiczbaM3(wartosc) {
    const tekst = String(wartosc || "").trim();
    const dopasowanie = tekst.match(/-?\d+(?:[.,]\d+)?/);

    if (!dopasowanie) {
      return null;
    }

    const liczba = Number(dopasowanie[0].replace(",", "."));
    return Number.isFinite(liczba) ? liczba : null;
  }

  function pobierzDodatniaIloscBetonu(wartosc) {
    const iloscBetonuLiczbaM3 = pobierzIloscBetonuLiczbaM3(wartosc);

    if (iloscBetonuLiczbaM3 === null || iloscBetonuLiczbaM3 <= 0) {
      throw new Error("Pole „Ilość betonu” musi zawierać liczbę większą niż 0.");
    }

    return iloscBetonuLiczbaM3;
  }

  function pobierzNieujemnaIloscBetonu(wartosc) {
    const iloscBetonuLiczbaM3 = pobierzIloscBetonuLiczbaM3(wartosc);

    if (iloscBetonuLiczbaM3 === null || iloscBetonuLiczbaM3 < 0) {
      throw new Error(
        "Pole „Ilość betonu” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return iloscBetonuLiczbaM3;
  }

  function uzupelnijBazowaIloscBetonu(budowa) {
    if (!budowa || typeof budowa !== "object") {
      throw new Error("Nie znaleziono budowy, dla której ma być zapisana ilość betonu.");
    }

    if (!Object.prototype.hasOwnProperty.call(budowa, "iloscBetonuBazowaM3")) {
      budowa.iloscBetonuBazowaM3 = String(budowa.iloscBetonuM3 || "").trim();
    }

    if (!Object.prototype.hasOwnProperty.call(
      budowa,
      "iloscBetonuBazowaLiczbaM3"
    )) {
      budowa.iloscBetonuBazowaLiczbaM3 = pobierzIloscBetonuLiczbaM3(
        budowa.iloscBetonuBazowaM3
      );
    }

    return budowa;
  }

  function utworzPoczatkoweCzasyRobocze() {
    return {
      czasDojazduRoboczyMinuty: null,
      czasPowrotuRoboczyMinuty: null,
      dodatkowyCzasZaladunkuMinuty: 0,
      czasRozladunkuRoboczyMinuty: null,
      dodatkowyCzasRozladunkuMinuty: 0,
      dodatkowyOdstepDostawMinuty: 0,
      zrodloCzasuDojazdu: "brak",
      zrodloCzasuPowrotu: "brak"
    };
  }

  function pobierzNieujemnaLiczbeLubBrak(wartosc, nazwaPola) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać liczbę nie mniejszą niż 0.");
    }

    return liczba;
  }

  function pobierzNieujemnaLiczbe(wartosc, nazwaPola) {
    const liczba = pobierzNieujemnaLiczbeLubBrak(wartosc, nazwaPola);
    return liczba === null ? 0 : liczba;
  }

  function uzupelnijDodatkowyOdstepDostawBudowy(budowa) {
    if (!budowa || typeof budowa !== "object") {
      throw new Error("Nie znaleziono budowy do uzupełnienia odstępu dostaw.");
    }

    budowa.dodatkowyOdstepDostawMinuty = pobierzNieujemnaLiczbe(
      budowa.dodatkowyOdstepDostawMinuty,
      "Dodatkowy odstęp dostaw"
    );
    return budowa;
  }

  function pobierzDodatniaLiczbeLubBrak(wartosc, nazwaPola) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba <= 0) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać liczbę większą niż 0.");
    }

    return liczba;
  }

  function pobierzEfektywnyCzasRozladunkuMinuty(budowa, czasDomyslnyMinuty) {
    const czasDomyslny = pobierzDodatniaLiczbeLubBrak(
      czasDomyslnyMinuty,
      "Czas rozładunku"
    );

    if (czasDomyslny === null) {
      throw new Error("Pole „Czas rozładunku” musi zawierać liczbę większą niż 0.");
    }

    if (
      budowa &&
      Object.prototype.hasOwnProperty.call(budowa, "czasRozladunkuRoboczyMinuty")
    ) {
      const czasRoboczy = pobierzDodatniaLiczbeLubBrak(
        budowa.czasRozladunkuRoboczyMinuty,
        "Czas rozładunku"
      );
      return czasRoboczy === null ? czasDomyslny : czasRoboczy;
    }

    const dodatkowyCzasZeStarszegoPlanu = pobierzNieujemnaLiczbe(
      budowa && budowa.dodatkowyCzasRozladunkuMinuty,
      "Dodatkowy czas rozładunku"
    );

    return czasDomyslny + dodatkowyCzasZeStarszegoPlanu;
  }

  function migrujCzasRozladunkuBudowy(budowa, czasDomyslnyMinuty) {
    if (!budowa || typeof budowa !== "object") {
      throw new Error("Nie znaleziono budowy do migracji czasu rozładunku.");
    }

    const czyMaNowePole = Object.prototype.hasOwnProperty.call(
      budowa,
      "czasRozladunkuRoboczyMinuty"
    );
    const czasEfektywny = pobierzEfektywnyCzasRozladunkuMinuty(
      budowa,
      czasDomyslnyMinuty
    );
    const dodatkowyCzasZeStarszegoPlanu = pobierzNieujemnaLiczbe(
      budowa.dodatkowyCzasRozladunkuMinuty,
      "Dodatkowy czas rozładunku"
    );

    if (czyMaNowePole) {
      budowa.czasRozladunkuRoboczyMinuty = pobierzDodatniaLiczbeLubBrak(
        budowa.czasRozladunkuRoboczyMinuty,
        "Czas rozładunku"
      );
    } else {
      budowa.czasRozladunkuRoboczyMinuty = dodatkowyCzasZeStarszegoPlanu > 0
        ? czasEfektywny
        : null;
    }

    budowa.dodatkowyCzasRozladunkuMinuty = 0;
    return budowa;
  }

  function pobierzZrodloCzasu(wartosc, czyJestCzas) {
    if (!czyJestCzas) {
      return "brak";
    }

    const zrodlo = String(wartosc || "reczny").trim().toLowerCase();
    return ["reczny", "pamiec", "mapa"].includes(zrodlo) ? zrodlo : "reczny";
  }

  function utworzBudoweZImportu(daneBudowy, numerWiersza) {
    const opisStartu = przetworzStartPlanowany(daneBudowy.startPlanowany, numerWiersza);
    const iloscBetonuLiczbaM3 = pobierzIloscBetonuLiczbaM3(daneBudowy.iloscBetonuM3);
    const iloscBetonuM3 = String(daneBudowy.iloscBetonuM3 || "").trim();

    return Object.assign({
      idBudowy: pobierzWymaganyTekst(daneBudowy.idBudowy, "ID_Budowy", numerWiersza),
      firma: pobierzWymaganyTekst(daneBudowy.firma, "Firma", numerWiersza),
      budowa: pobierzWymaganyTekst(daneBudowy.budowa, "Budowa", numerWiersza),
      startPlanowanyZrodlowy: opisStartu.wartoscZrodlowa,
      startPlanowany: opisStartu.startPlanowany,
      startRoboczy: opisStartu.startPlanowany,
      tolerancjaStartuMinuty: opisStartu.tolerancjaStartuMinuty,
      najpozniejszyStart: opisStartu.najpozniejszyStart,
      rodzajBetonu: String(daneBudowy.rodzajBetonu || "").trim(),
      iloscBetonuM3: iloscBetonuM3,
      iloscBetonuLiczbaM3: iloscBetonuLiczbaM3,
      iloscBetonuBazowaM3: iloscBetonuM3,
      iloscBetonuBazowaLiczbaM3: iloscBetonuLiczbaM3,
      statusRealizacji: iloscBetonuLiczbaM3 === 0 ? "zrealizowana" : "do-realizacji",
      dataPlanowana: String(daneBudowy.dataPlanowana || "").trim(),
      rodzajRozladunku: String(daneBudowy.rodzajRozladunku || "").trim(),
      zrodlo: "csv",
      daneZrodlowe: daneBudowy.daneZrodlowe
    }, utworzPoczatkoweCzasyRobocze());
  }

  function znajdzKolejnyNumerReczny(listaIstniejacychBudow) {
    const zajeteId = new Set(
      listaIstniejacychBudow.map(function (budowa) {
        return String(budowa.idBudowy);
      })
    );
    let numer = 1;

    while (zajeteId.has("RECZNE-" + String(numer).padStart(3, "0"))) {
      numer += 1;
    }

    return numer;
  }

  function utworzBudoweReczna(daneBudowy, listaIstniejacychBudow) {
    const istniejaceBudowy = Array.isArray(listaIstniejacychBudow)
      ? listaIstniejacychBudow
      : [];
    const numer = znajdzKolejnyNumerReczny(istniejaceBudowy);
    const startPlanowany = pobierzWymaganyTekst(
      daneBudowy && daneBudowy.startPlanowany,
      "Start planowany"
    );
    const iloscBetonuM3 = pobierzWymaganyTekst(
      daneBudowy && daneBudowy.iloscBetonuM3,
      "Ilość betonu"
    );
    const iloscBetonuLiczbaM3 = pobierzDodatniaIloscBetonu(iloscBetonuM3);

    return Object.assign({
      idBudowy: "RECZNE-" + String(numer).padStart(3, "0"),
      firma: pobierzWymaganyTekst(daneBudowy && daneBudowy.firma, "Firma"),
      budowa: pobierzWymaganyTekst(daneBudowy && daneBudowy.budowa, "Budowa"),
      startPlanowanyZrodlowy: startPlanowany,
      startPlanowany: startPlanowany,
      startRoboczy: startPlanowany,
      tolerancjaStartuMinuty: 0,
      najpozniejszyStart: startPlanowany,
      rodzajBetonu: "",
      iloscBetonuM3: iloscBetonuM3,
      iloscBetonuLiczbaM3: iloscBetonuLiczbaM3,
      iloscBetonuBazowaM3: iloscBetonuM3,
      iloscBetonuBazowaLiczbaM3: iloscBetonuLiczbaM3,
      statusRealizacji: "do-realizacji",
      dataPlanowana: "",
      rodzajRozladunku: "",
      zrodlo: "reczna",
      daneZrodlowe: null
    }, utworzPoczatkoweCzasyRobocze());
  }

  function ustawCzasyRobocze(budowa, daneCzasow) {
    if (!budowa) {
      throw new Error("Nie znaleziono budowy, dla której mają zostać zapisane czasy.");
    }

    const noweCzasy = daneCzasow || {};
    const czasDojazdu = pobierzNieujemnaLiczbeLubBrak(
      noweCzasy.czasDojazduRoboczyMinuty,
      "Czas dojazdu"
    );
    const czasPowrotu = pobierzNieujemnaLiczbeLubBrak(
      noweCzasy.czasPowrotuRoboczyMinuty,
      "Czas powrotu"
    );

    budowa.czasDojazduRoboczyMinuty = czasDojazdu;
    budowa.czasPowrotuRoboczyMinuty = czasPowrotu;
    budowa.dodatkowyCzasZaladunkuMinuty = pobierzNieujemnaLiczbe(
      noweCzasy.dodatkowyCzasZaladunkuMinuty,
      "Dodatkowy czas załadunku"
    );
    budowa.czasRozladunkuRoboczyMinuty = pobierzDodatniaLiczbeLubBrak(
      Object.prototype.hasOwnProperty.call(noweCzasy, "czasRozladunkuRoboczyMinuty")
        ? noweCzasy.czasRozladunkuRoboczyMinuty
        : budowa.czasRozladunkuRoboczyMinuty,
      "Czas rozładunku"
    );
    budowa.dodatkowyCzasRozladunkuMinuty = pobierzNieujemnaLiczbe(
      noweCzasy.dodatkowyCzasRozladunkuMinuty,
      "Dodatkowy czas rozładunku"
    );
    budowa.dodatkowyOdstepDostawMinuty = pobierzNieujemnaLiczbe(
      Object.prototype.hasOwnProperty.call(
        noweCzasy,
        "dodatkowyOdstepDostawMinuty"
      )
        ? noweCzasy.dodatkowyOdstepDostawMinuty
        : budowa.dodatkowyOdstepDostawMinuty,
      "Dodatkowy odstęp dostaw"
    );
    budowa.zrodloCzasuDojazdu = pobierzZrodloCzasu(
      noweCzasy.zrodloCzasuDojazdu,
      czasDojazdu !== null
    );
    budowa.zrodloCzasuPowrotu = pobierzZrodloCzasu(
      noweCzasy.zrodloCzasuPowrotu,
      czasPowrotu !== null
    );

    return budowa;
  }

  function zmienIloscBetonuRoboczaBudowy(budowa, wartosc) {
    const iloscBetonuLiczbaM3 = pobierzNieujemnaIloscBetonu(wartosc);

    uzupelnijBazowaIloscBetonu(budowa);
    budowa.iloscBetonuM3 = String(wartosc).trim();
    budowa.iloscBetonuLiczbaM3 = iloscBetonuLiczbaM3;
    budowa.statusRealizacji = iloscBetonuLiczbaM3 === 0
      ? "zrealizowana"
      : "do-realizacji";
    return budowa;
  }

  function przywrocBazowaIloscBetonuBudowy(budowa) {
    uzupelnijBazowaIloscBetonu(budowa);

    if (budowa.iloscBetonuBazowaLiczbaM3 === null) {
      throw new Error("Ta budowa nie ma zapisanej bazowej ilości betonu.");
    }

    budowa.iloscBetonuM3 = budowa.iloscBetonuBazowaM3;
    budowa.iloscBetonuLiczbaM3 = budowa.iloscBetonuBazowaLiczbaM3;
    budowa.statusRealizacji = budowa.iloscBetonuBazowaLiczbaM3 === 0
      ? "zrealizowana"
      : "do-realizacji";
    return budowa;
  }

  function czyBrakWartosci(wartosc) {
    return wartosc === null || wartosc === undefined || wartosc === "";
  }

  function zmienCzasRoboczyBudowy(budowa, nazwaPola, wartosc) {
    const dozwolonePola = [
      "czasDojazduRoboczyMinuty",
      "czasPowrotuRoboczyMinuty",
      "dodatkowyCzasZaladunkuMinuty",
      "czasRozladunkuRoboczyMinuty",
      "dodatkowyCzasRozladunkuMinuty",
      "dodatkowyOdstepDostawMinuty"
    ];

    if (!budowa) {
      throw new Error("Nie znaleziono budowy, dla której mają zostać zapisane czasy.");
    }

    if (!dozwolonePola.includes(nazwaPola)) {
      throw new Error("Nie rozpoznano zmienianego pola czasu budowy.");
    }

    const czyObaCzasyPrzejazduSaPuste =
      czyBrakWartosci(budowa.czasDojazduRoboczyMinuty) &&
      czyBrakWartosci(budowa.czasPowrotuRoboczyMinuty);
    const noweCzasy = {
      czasDojazduRoboczyMinuty: budowa.czasDojazduRoboczyMinuty,
      czasPowrotuRoboczyMinuty: budowa.czasPowrotuRoboczyMinuty,
      dodatkowyCzasZaladunkuMinuty: budowa.dodatkowyCzasZaladunkuMinuty,
      czasRozladunkuRoboczyMinuty: budowa.czasRozladunkuRoboczyMinuty,
      dodatkowyCzasRozladunkuMinuty: budowa.dodatkowyCzasRozladunkuMinuty,
      dodatkowyOdstepDostawMinuty: budowa.dodatkowyOdstepDostawMinuty,
      zrodloCzasuDojazdu: budowa.zrodloCzasuDojazdu,
      zrodloCzasuPowrotu: budowa.zrodloCzasuPowrotu
    };
    noweCzasy[nazwaPola] = wartosc;

    if (nazwaPola === "czasRozladunkuRoboczyMinuty") {
      noweCzasy.dodatkowyCzasRozladunkuMinuty = 0;
    }

    if (nazwaPola === "czasDojazduRoboczyMinuty") {
      noweCzasy.zrodloCzasuDojazdu = czyBrakWartosci(wartosc)
        ? "brak"
        : "reczny";
    }

    if (nazwaPola === "czasPowrotuRoboczyMinuty") {
      noweCzasy.zrodloCzasuPowrotu = czyBrakWartosci(wartosc)
        ? "brak"
        : "reczny";
    }

    if (
      nazwaPola === "czasDojazduRoboczyMinuty" &&
      czyObaCzasyPrzejazduSaPuste &&
      !czyBrakWartosci(wartosc)
    ) {
      noweCzasy.czasPowrotuRoboczyMinuty = wartosc;
      noweCzasy.zrodloCzasuPowrotu = "reczny";
    }

    if (
      nazwaPola === "czasPowrotuRoboczyMinuty" &&
      czyObaCzasyPrzejazduSaPuste &&
      !czyBrakWartosci(wartosc)
    ) {
      noweCzasy.czasDojazduRoboczyMinuty = wartosc;
      noweCzasy.zrodloCzasuDojazdu = "reczny";
    }

    return ustawCzasyRobocze(budowa, noweCzasy);
  }

  function utworzListeRobocza(budowyZImportu, budowyReczne) {
    const listaZImportu = Array.isArray(budowyZImportu) ? budowyZImportu : [];
    const listaReczna = Array.isArray(budowyReczne) ? budowyReczne : [];

    return listaZImportu.concat(listaReczna).map(function (budowa) {
      const kopiaBudowy = Object.assign({}, budowa);
      return uzupelnijDodatkowyOdstepDostawBudowy(kopiaBudowy);
    });
  }

  aplikacja.budowy = {
    utworzBudoweZImportu: utworzBudoweZImportu,
    utworzBudoweReczna: utworzBudoweReczna,
    utworzListeRobocza: utworzListeRobocza,
    uzupelnijBazowaIloscBetonu: uzupelnijBazowaIloscBetonu,
    ustawCzasyRobocze: ustawCzasyRobocze,
    uzupelnijDodatkowyOdstepDostawBudowy:
      uzupelnijDodatkowyOdstepDostawBudowy,
    pobierzEfektywnyCzasRozladunkuMinuty: pobierzEfektywnyCzasRozladunkuMinuty,
    migrujCzasRozladunkuBudowy: migrujCzasRozladunkuBudowy,
    zmienCzasRoboczyBudowy: zmienCzasRoboczyBudowy,
    zmienIloscBetonuRoboczaBudowy: zmienIloscBetonuRoboczaBudowy,
    przywrocBazowaIloscBetonuBudowy: przywrocBazowaIloscBetonuBudowy
  };
})(window);
