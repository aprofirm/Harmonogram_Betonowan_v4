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
    const kursy = aplikacja.gruszki.obliczCzasyKursow(
      wygenerowaneKursy,
      listaBudow,
      parametry
    );
    const komunikatKursow = kursy.length
      ? "Wygenerowano " + kursy.length +
        " kursów z godzinami załadunku, dojazdu, rozładunku i powrotu. " +
        "Przydział numerów gruszek zostanie dodany w punkcie 3C."
      : "Nie wygenerowano kursów. Pozycje z 0 m³ są już zrealizowane, " +
        "a pozycje bez ilości wymagają uzupełnienia danych.";

    return {
      etap: aplikacja.konfiguracja.numerEtapu,
      punktEtapu: aplikacja.konfiguracja.punktEtapu,
      status: "gotowy",
      parametry: parametry,
      budowy: listaBudow,
      pompy: aplikacja.pompy.utworzPustyStanPomp(),
      gruszki: aplikacja.gruszki.utworzPustyStanGruszek(),
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
