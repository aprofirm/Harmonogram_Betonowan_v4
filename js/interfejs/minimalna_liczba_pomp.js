(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;

  if (!aplikacja || !aplikacja.interfejs || !aplikacja.pompy) {
    throw new Error(
      "Widok minimalnej liczby pomp wymaga interfejsu i modułu pomp."
    );
  }

  const interfejs = aplikacja.interfejs;
  const oryginalnePokazWynik = interfejs.pokazWynik;
  const oryginalneOznaczWynikJakoNieaktualny =
    interfejs.oznaczWynikJakoNieaktualny;
  const oryginalnePokazPrzywroconyPlan = interfejs.pokazPrzywroconyPlan;
  const oryginalneWyczyscPlan = interfejs.wyczyscPlan;
  let minimalnaLiczbaPompInterfejsu = null;

  function pobierzElement(identyfikator) {
    return document.getElementById(identyfikator);
  }

  function odswiezOpisPotrzebnychPomp() {
    const trybPomp = pobierzElement("tryb-pomp");
    const opis = pobierzElement("podsumowanie-dostepnosci-pomp");

    if (
      !trybPomp ||
      !opis ||
      trybPomp.value === "mam-okreslona-liczbe"
    ) {
      return;
    }

    if (minimalnaLiczbaPompInterfejsu === null) {
      opis.textContent = "Po obliczeniu pokażemy potrzebną liczbę pomp.";
      return;
    }

    if (minimalnaLiczbaPompInterfejsu === 0) {
      opis.textContent = "Plan nie wymaga pompy.";
      return;
    }

    opis.textContent = "Potrzebne pompy: " +
      String(minimalnaLiczbaPompInterfejsu) + ".";
  }

  function pokazMinimalnaLiczbePomp(wynikHarmonogramu) {
    if (typeof aplikacja.pompy.obliczMinimalnaLiczbePomp !== "function") {
      throw new Error(
        "Widok minimalnej liczby pomp wymaga silnika 4G.1."
      );
    }

    const dane = wynikHarmonogramu || {};
    const wynikMinimalnejFloty = aplikacja.pompy.obliczMinimalnaLiczbePomp(
      Array.isArray(dane.budowy) ? dane.budowy : [],
      Array.isArray(dane.kursy) ? dane.kursy : []
    );
    const licznik = pobierzElement("minimalna-liczba-pomp");

    minimalnaLiczbaPompInterfejsu = wynikMinimalnejFloty.minimalnaLiczbaPomp;

    if (licznik) {
      licznik.textContent = String(minimalnaLiczbaPompInterfejsu);
    }

    odswiezOpisPotrzebnychPomp();
    return wynikMinimalnejFloty;
  }

  function wyczyscMinimalnaLiczbePomp() {
    minimalnaLiczbaPompInterfejsu = null;
    odswiezOpisPotrzebnychPomp();
  }

  function pokazWynik(wynikHarmonogramu) {
    const wynik = oryginalnePokazWynik.apply(interfejs, arguments);
    pokazMinimalnaLiczbePomp(wynikHarmonogramu);
    return wynik;
  }

  function oznaczWynikJakoNieaktualny() {
    wyczyscMinimalnaLiczbePomp();
    return oryginalneOznaczWynikJakoNieaktualny.apply(interfejs, arguments);
  }

  function pokazPrzywroconyPlan() {
    wyczyscMinimalnaLiczbePomp();
    return oryginalnePokazPrzywroconyPlan.apply(interfejs, arguments);
  }

  function wyczyscPlan() {
    wyczyscMinimalnaLiczbePomp();
    return oryginalneWyczyscPlan.apply(interfejs, arguments);
  }

  interfejs.pokazWynik = pokazWynik;
  interfejs.oznaczWynikJakoNieaktualny = oznaczWynikJakoNieaktualny;
  interfejs.pokazPrzywroconyPlan = pokazPrzywroconyPlan;
  interfejs.wyczyscPlan = wyczyscPlan;
  interfejs.pokazMinimalnaLiczbePomp = pokazMinimalnaLiczbePomp;
})(window);
