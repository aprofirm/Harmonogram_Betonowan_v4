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

  function utworzBudoweZImportu(daneBudowy, numerWiersza) {
    const opisStartu = przetworzStartPlanowany(daneBudowy.startPlanowany, numerWiersza);
    const iloscBetonuLiczbaM3 = pobierzIloscBetonuLiczbaM3(daneBudowy.iloscBetonuM3);

    return {
      idBudowy: pobierzWymaganyTekst(daneBudowy.idBudowy, "ID_Budowy", numerWiersza),
      firma: pobierzWymaganyTekst(daneBudowy.firma, "Firma", numerWiersza),
      budowa: pobierzWymaganyTekst(daneBudowy.budowa, "Budowa", numerWiersza),
      startPlanowanyZrodlowy: opisStartu.wartoscZrodlowa,
      startPlanowany: opisStartu.startPlanowany,
      startRoboczy: opisStartu.startPlanowany,
      tolerancjaStartuMinuty: opisStartu.tolerancjaStartuMinuty,
      najpozniejszyStart: opisStartu.najpozniejszyStart,
      rodzajBetonu: String(daneBudowy.rodzajBetonu || "").trim(),
      iloscBetonuM3: String(daneBudowy.iloscBetonuM3 || "").trim(),
      iloscBetonuLiczbaM3: iloscBetonuLiczbaM3,
      statusRealizacji: iloscBetonuLiczbaM3 === 0 ? "zrealizowana" : "do-realizacji",
      dataPlanowana: String(daneBudowy.dataPlanowana || "").trim(),
      rodzajRozladunku: String(daneBudowy.rodzajRozladunku || "").trim(),
      zrodlo: "csv",
      daneZrodlowe: daneBudowy.daneZrodlowe
    };
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

    return {
      idBudowy: "RECZNE-" + String(numer).padStart(3, "0"),
      firma: pobierzWymaganyTekst(daneBudowy && daneBudowy.firma, "Firma"),
      budowa: pobierzWymaganyTekst(daneBudowy && daneBudowy.budowa, "Budowa"),
      startPlanowanyZrodlowy: startPlanowany,
      startPlanowany: startPlanowany,
      startRoboczy: startPlanowany,
      tolerancjaStartuMinuty: 0,
      najpozniejszyStart: startPlanowany,
      rodzajBetonu: "",
      iloscBetonuM3: "",
      iloscBetonuLiczbaM3: null,
      statusRealizacji: "do-realizacji",
      dataPlanowana: "",
      rodzajRozladunku: "",
      zrodlo: "reczna",
      daneZrodlowe: null
    };
  }

  function utworzListeRobocza(budowyZImportu, budowyReczne) {
    const listaZImportu = Array.isArray(budowyZImportu) ? budowyZImportu : [];
    const listaReczna = Array.isArray(budowyReczne) ? budowyReczne : [];

    return listaZImportu.concat(listaReczna).map(function (budowa) {
      return Object.assign({}, budowa);
    });
  }

  aplikacja.budowy = {
    utworzBudoweZImportu: utworzBudoweZImportu,
    utworzBudoweReczna: utworzBudoweReczna,
    utworzListeRobocza: utworzListeRobocza
  };
})(window);
