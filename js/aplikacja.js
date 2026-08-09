(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan;
  let czyTrwaPrzeliczanie = false;
  let stanImportu = aplikacja.importCsv.utworzPustyStanImportu();
  let budowyReczne = [];
  let numerOstatniegoImportu = 0;

  function pobierzAktualnaListeBudow() {
    return aplikacja.budowy.utworzListeRobocza(stanImportu.budowy, budowyReczne);
  }

  function obsluzPrzeliczenie() {
    if (czyTrwaPrzeliczanie) {
      return;
    }

    czyTrwaPrzeliczanie = true;
    aplikacja.interfejs.pokazTrwajacePrzeliczenie();

    try {
      const parametry = aplikacja.interfejs.pobierzParametryZFormularza();
      const wynik = aplikacja.harmonogram.przeliczCalyHarmonogram({
        parametry: parametry,
        stanImportu: stanImportu,
        budowyReczne: budowyReczne
      });

      aplikacja.interfejs.pokazWynik(wynik);
    } catch (blad) {
      aplikacja.interfejs.pokazBlad(blad);
    } finally {
      czyTrwaPrzeliczanie = false;
      aplikacja.interfejs.zakonczPrzeliczenie();
    }
  }

  function obsluzImportPliku(plik) {
    numerOstatniegoImportu += 1;
    const numerBiezacegoImportu = numerOstatniegoImportu;
    aplikacja.interfejs.pokazTrwajacyImport(plik && plik.name);

    return aplikacja.importCsv.importujPlik(plik).then(function (nowyStanImportu) {
      if (numerBiezacegoImportu !== numerOstatniegoImportu) {
        return null;
      }

      const identyfikatoryReczne = new Set(
        budowyReczne.map(function (budowa) {
          return budowa.idBudowy;
        })
      );
      const konfliktId = nowyStanImportu.budowy.find(function (budowa) {
        return identyfikatoryReczne.has(budowa.idBudowy);
      });

      if (konfliktId) {
        throw new Error(
          "ID_Budowy „" + konfliktId.idBudowy +
            "” jest już używane przez budowę dodaną ręcznie."
        );
      }

      // Nowy plik zastępuje poprzedni import. Budowy ręczne pozostają osobną listą.
      stanImportu = nowyStanImportu;
      const listaBudow = pobierzAktualnaListeBudow();
      aplikacja.interfejs.pokazUdanyImport(stanImportu, listaBudow);
      return stanImportu;
    }).catch(function (blad) {
      if (numerBiezacegoImportu === numerOstatniegoImportu) {
        aplikacja.interfejs.pokazBladImportu(blad);
      }
      return null;
    }).finally(function () {
      if (numerBiezacegoImportu === numerOstatniegoImportu) {
        aplikacja.interfejs.wyczyscWyborPliku();
      }
    });
  }

  function obsluzDodanieBudowyRecznej(daneBudowy) {
    try {
      const budowaReczna = aplikacja.budowy.utworzBudoweReczna(
        daneBudowy,
        pobierzAktualnaListeBudow()
      );
      budowyReczne = budowyReczne.concat([budowaReczna]);
      aplikacja.interfejs.pokazDodanaBudowe(budowaReczna, pobierzAktualnaListeBudow());
      return budowaReczna;
    } catch (blad) {
      aplikacja.interfejs.pokazBladDanych(blad);
      return null;
    }
  }

  function uruchomAplikacje() {
    aplikacja.interfejs.uruchomInterfejs(
      aplikacja.konfiguracja.parametryDomyslne,
      obsluzPrzeliczenie,
      obsluzImportPliku,
      obsluzDodanieBudowyRecznej
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", uruchomAplikacje);
  } else {
    uruchomAplikacje();
  }
})(window);
