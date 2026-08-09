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

  function utworzBudoweZImportu(daneBudowy, numerWiersza) {
    const startPlanowany = pobierzWymaganyTekst(
      daneBudowy.startPlanowany,
      "StartPlanowany",
      numerWiersza
    );

    return {
      idBudowy: pobierzWymaganyTekst(daneBudowy.idBudowy, "ID_Budowy", numerWiersza),
      firma: pobierzWymaganyTekst(daneBudowy.firma, "Firma", numerWiersza),
      budowa: pobierzWymaganyTekst(daneBudowy.budowa, "Budowa", numerWiersza),
      startPlanowany: startPlanowany,
      startRoboczy: startPlanowany,
      rodzajBetonu: String(daneBudowy.rodzajBetonu || "").trim(),
      iloscBetonuM3: String(daneBudowy.iloscBetonuM3 || "").trim(),
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
      startPlanowany: startPlanowany,
      startRoboczy: startPlanowany,
      rodzajBetonu: "",
      iloscBetonuM3: "",
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
