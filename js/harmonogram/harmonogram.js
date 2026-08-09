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
    const stanImportu = aktualneDane.stanImportu ||
      aplikacja.importCsv.utworzPustyStanImportu();
    const listaBudow = aplikacja.budowy.utworzListeRobocza(
      stanImportu.budowy,
      aktualneDane.budowyReczne
    );

    return {
      etap: aplikacja.konfiguracja.numerEtapu,
      status: "gotowy",
      parametry: polaczParametry(aktualneDane.parametry),
      budowy: listaBudow,
      pompy: aplikacja.pompy.utworzPustyStanPomp(),
      gruszki: aplikacja.gruszki.utworzPustyStanGruszek(),
      lokalizacje: aplikacja.lokalizacje.utworzPustyStanLokalizacji(),
      kursy: [],
      konflikty: [],
      komunikaty: [aplikacja.konfiguracja.komunikatPoPrzeliczeniu]
    };
  }

  aplikacja.harmonogram = {
    przeliczCalyHarmonogram: przeliczCalyHarmonogram
  };
})(window);
