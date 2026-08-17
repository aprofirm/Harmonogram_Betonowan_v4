(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI = "harmonogramBetonowan.pamiecTras.v1";
  const WERSJA_FORMATU = 1;
  const MAKSYMALNA_LICZBA_TRAS = 1000;
  const MAKSYMALNY_ROZMIAR_PAMIECI_BAJTY = 1024 * 1024;
  const MAKSYMALNA_DLUGOSC_OPISU = 500;
  const DOMYSLNY_ID_WEZLA = "wezel-domyslny";
  const DOZWOLONE_ZRODLA = Object.freeze(["reczny", "mapa", "pamiec"]);
  let pamiecLokalna = null;
  let trybPamieci = "biezaca-sesja";
  let zapisBiezacejSesji = null;
  let czyUruchomiono = false;

  function skopiujDane(dane) {
    return JSON.parse(JSON.stringify(dane));
  }

  function czyPoprawnyObiekt(dane) {
    return Boolean(dane) && typeof dane === "object" && !Array.isArray(dane);
  }

  function policzPrzyblizonyRozmiarBajtow(tekst) {
    // localStorage przechowuje tekst, zwykle liczony jako znaki UTF-16.
    return String(tekst || "").length * 2;
  }

  function normalizujOpisLokalizacji(opisLokalizacji) {
    return String(opisLokalizacji || "")
      .trim()
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function pobierzPoprawnyOpis(opisLokalizacji) {
    const opis = String(opisLokalizacji || "").trim();

    if (!opis) {
      throw new Error("Opis lokalizacji nie może być pusty.");
    }

    if (opis.length > MAKSYMALNA_DLUGOSC_OPISU) {
      throw new Error(
        "Opis lokalizacji nie może być dłuższy niż " +
          MAKSYMALNA_DLUGOSC_OPISU + " znaków."
      );
    }

    return opis;
  }

  function pobierzZnormalizowanyIdWezla(idWezla) {
    return normalizujOpisLokalizacji(idWezla || DOMYSLNY_ID_WEZLA);
  }

  function utworzKluczTrasy(opisLokalizacji, idWezla) {
    const opis = pobierzPoprawnyOpis(opisLokalizacji);
    const opisZnormalizowany = normalizujOpisLokalizacji(opis);

    if (!opisZnormalizowany) {
      throw new Error("Opis lokalizacji nie zawiera znaków pozwalających ją rozpoznać.");
    }

    return pobierzZnormalizowanyIdWezla(idWezla) + "::" + opisZnormalizowany;
  }

  function pobierzCzasPrzejazdu(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function pobierzZrodlo(wartosc) {
    const zrodlo = String(wartosc || "reczny").trim().toLowerCase();
    return DOZWOLONE_ZRODLA.includes(zrodlo) ? zrodlo : "reczny";
  }

  function utworzPustaKsiazke() {
    return {
      wersja: WERSJA_FORMATU,
      trasy: []
    };
  }

  function utworzWynik(status, szczegoly) {
    return Object.assign({
      status: status,
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU
    }, szczegoly || {});
  }

  function rozpoznajPamiecLokalna() {
    const kluczTestowy = KLUCZ_PAMIECI + ".test";

    try {
      const magazyn = zakresGlobalny.localStorage;

      if (!magazyn) {
        return null;
      }

      magazyn.setItem(kluczTestowy, "1");
      magazyn.removeItem(kluczTestowy);
      return magazyn;
    } catch (bladPamieci) {
      return null;
    }
  }

  function uruchomPamiecTras() {
    if (!czyUruchomiono) {
      pamiecLokalna = rozpoznajPamiecLokalna();
      trybPamieci = pamiecLokalna ? "trwala" : "biezaca-sesja";
      czyUruchomiono = true;
    }

    return pobierzStanPamieci();
  }

  function zapewnijUruchomienie() {
    if (!czyUruchomiono) {
      pamiecLokalna = rozpoznajPamiecLokalna();
      trybPamieci = pamiecLokalna ? "trwala" : "biezaca-sesja";
      czyUruchomiono = true;
    }
  }

  function usunUszkodzonyZapis() {
    zapisBiezacejSesji = null;

    if (!pamiecLokalna) {
      return;
    }

    try {
      pamiecLokalna.removeItem(KLUCZ_PAMIECI);
    } catch (bladUsuwania) {
      // Uszkodzona książka tras nie może zatrzymać harmonogramu.
    }
  }

  function pobierzTekstPamieci() {
    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        return pamiecLokalna.getItem(KLUCZ_PAMIECI);
      } catch (bladOdczytu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return zapisBiezacejSesji;
  }

  function czyPoprawnaTrasa(trasa) {
    return czyPoprawnyObiekt(trasa) &&
      Boolean(trasa.kluczTrasy) &&
      Boolean(trasa.opisLokalizacji) &&
      Boolean(trasa.opisZnormalizowany) &&
      Boolean(trasa.idWezlaZnormalizowany) &&
      Number.isFinite(Number(trasa.czasDojazduMinuty)) &&
      Number(trasa.czasDojazduMinuty) >= 0 &&
      Number.isFinite(Number(trasa.czasPowrotuMinuty)) &&
      Number(trasa.czasPowrotuMinuty) >= 0 &&
      Boolean(trasa.utworzono) &&
      Boolean(trasa.zaktualizowano) &&
      Boolean(trasa.ostatnioUzyto);
  }

  function odczytajKsiazke() {
    zapewnijUruchomienie();
    const tekstPamieci = pobierzTekstPamieci();

    if (!tekstPamieci) {
      return {
        status: "brak-zapisu",
        ksiazka: utworzPustaKsiazke()
      };
    }

    let ksiazka;

    try {
      ksiazka = JSON.parse(tekstPamieci);
    } catch (bladFormatu) {
      usunUszkodzonyZapis();
      return {
        status: "uszkodzony-zapis",
        ksiazka: utworzPustaKsiazke()
      };
    }

    if (!czyPoprawnyObiekt(ksiazka) || !Array.isArray(ksiazka.trasy)) {
      usunUszkodzonyZapis();
      return {
        status: "uszkodzony-zapis",
        ksiazka: utworzPustaKsiazke()
      };
    }

    if (ksiazka.wersja !== WERSJA_FORMATU) {
      return {
        status: "niezgodna-wersja",
        ksiazka: null,
        wersjaZapisu: ksiazka.wersja
      };
    }

    if (!ksiazka.trasy.every(czyPoprawnaTrasa)) {
      usunUszkodzonyZapis();
      return {
        status: "uszkodzony-zapis",
        ksiazka: utworzPustaKsiazke()
      };
    }

    return {
      status: "odczytano",
      ksiazka: ksiazka
    };
  }

  function ograniczKsiazke(ksiazka) {
    let liczbaZastapionychTras = 0;

    while (ksiazka.trasy.length > MAKSYMALNA_LICZBA_TRAS) {
      ksiazka.trasy.shift();
      liczbaZastapionychTras += 1;
    }

    let tekstPamieci = JSON.stringify(ksiazka);

    while (
      ksiazka.trasy.length > 1 &&
      policzPrzyblizonyRozmiarBajtow(tekstPamieci) >
        MAKSYMALNY_ROZMIAR_PAMIECI_BAJTY
    ) {
      ksiazka.trasy.shift();
      liczbaZastapionychTras += 1;
      tekstPamieci = JSON.stringify(ksiazka);
    }

    return {
      ksiazka: ksiazka,
      tekstPamieci: tekstPamieci,
      liczbaZastapionychTras: liczbaZastapionychTras,
      rozmiarBajtow: policzPrzyblizonyRozmiarBajtow(tekstPamieci)
    };
  }

  function zapiszTekstPamieci(tekstPamieci) {
    zapisBiezacejSesji = tekstPamieci;

    if (pamiecLokalna && trybPamieci === "trwala") {
      try {
        pamiecLokalna.setItem(KLUCZ_PAMIECI, tekstPamieci);
        return "zapisano-trwale";
      } catch (bladZapisu) {
        pamiecLokalna = null;
        trybPamieci = "biezaca-sesja";
      }
    }

    return "zapisano-w-sesji";
  }

  function utworzTraseDoZapisu(daneTrasy, poprzedniaTrasa) {
    if (!czyPoprawnyObiekt(daneTrasy)) {
      throw new Error("Dane trasy muszą być obiektem.");
    }

    const opisLokalizacji = pobierzPoprawnyOpis(daneTrasy.opisLokalizacji);
    const idWezla = String(daneTrasy.idWezla || DOMYSLNY_ID_WEZLA).trim();
    const teraz = new Date().toISOString();

    return {
      kluczTrasy: utworzKluczTrasy(opisLokalizacji, idWezla),
      opisLokalizacji: opisLokalizacji,
      opisZnormalizowany: normalizujOpisLokalizacji(opisLokalizacji),
      idWezla: idWezla,
      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),
      czasDojazduMinuty: pobierzCzasPrzejazdu(
        daneTrasy.czasDojazduMinuty,
        "Czas dojazdu"
      ),
      czasPowrotuMinuty: pobierzCzasPrzejazdu(
        daneTrasy.czasPowrotuMinuty,
        "Czas powrotu"
      ),
      zrodloCzasuDojazdu: pobierzZrodlo(daneTrasy.zrodloCzasuDojazdu),
      zrodloCzasuPowrotu: pobierzZrodlo(daneTrasy.zrodloCzasuPowrotu),
      utworzono: poprzedniaTrasa && poprzedniaTrasa.utworzono
        ? poprzedniaTrasa.utworzono
        : teraz,
      zaktualizowano: teraz,
      ostatnioUzyto: teraz
    };
  }

  function zapiszTrase(daneTrasy) {
    zapewnijUruchomienie();

    let kluczTrasy;

    try {
      kluczTrasy = utworzKluczTrasy(
        daneTrasy && daneTrasy.opisLokalizacji,
        daneTrasy && daneTrasy.idWezla
      );
    } catch (bladDanych) {
      return utworzWynik("blad-zapisu", { komunikat: bladDanych.message });
    }

    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        komunikat: "Nie nadpisano pamięci tras z innej wersji programu."
      });
    }

    const ksiazka = wynikOdczytu.ksiazka;
    const indeksIstniejacejTrasy = ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === kluczTrasy;
    });
    const poprzedniaTrasa = indeksIstniejacejTrasy === -1
      ? null
      : ksiazka.trasy[indeksIstniejacejTrasy];
    let nowaTrasa;

    try {
      nowaTrasa = utworzTraseDoZapisu(daneTrasy, poprzedniaTrasa);
    } catch (bladDanych) {
      return utworzWynik("blad-zapisu", { komunikat: bladDanych.message });
    }

    if (indeksIstniejacejTrasy !== -1) {
      ksiazka.trasy.splice(indeksIstniejacejTrasy, 1);
    }

    // Najnowszy lub ostatnio używany wpis znajduje się na końcu listy.
    ksiazka.trasy.push(nowaTrasa);
    const ograniczonaKsiazka = ograniczKsiazke(ksiazka);
    const statusZapisu = zapiszTekstPamieci(ograniczonaKsiazka.tekstPamieci);

    return utworzWynik(statusZapisu, {
      trasa: skopiujDane(nowaTrasa),
      liczbaTras: ograniczonaKsiazka.ksiazka.trasy.length,
      liczbaZastapionychTras: ograniczonaKsiazka.liczbaZastapionychTras,
      rozmiarBajtow: ograniczonaKsiazka.rozmiarBajtow
    });
  }

  function pobierzTrase(opisLokalizacji, idWezla) {
    zapewnijUruchomienie();

    let kluczTrasy;

    try {
      kluczTrasy = utworzKluczTrasy(opisLokalizacji, idWezla);
    } catch (bladDanych) {
      return utworzWynik("blad-odczytu", {
        trasa: null,
        komunikat: bladDanych.message
      });
    }

    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        trasa: null,
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const indeksZnalezionejTrasy = wynikOdczytu.ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === kluczTrasy;
    });

    if (indeksZnalezionejTrasy === -1) {
      return utworzWynik("brak-trasy", { trasa: null });
    }

    const znalezionaTrasa = wynikOdczytu.ksiazka.trasy[indeksZnalezionejTrasy];
    znalezionaTrasa.ostatnioUzyto = new Date().toISOString();
    wynikOdczytu.ksiazka.trasy.splice(indeksZnalezionejTrasy, 1);
    wynikOdczytu.ksiazka.trasy.push(znalezionaTrasa);
    const zaktualizowanaKsiazka = ograniczKsiazke(wynikOdczytu.ksiazka);
    const statusAktualizacji = zapiszTekstPamieci(
      zaktualizowanaKsiazka.tekstPamieci
    );

    return utworzWynik("odczytano-trase", {
      trasa: skopiujDane(znalezionaTrasa),
      zrodloOdczytu: "pamiec",
      statusAktualizacji: statusAktualizacji
    });
  }

  function pobierzListeTras() {
    zapewnijUruchomienie();
    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        trasy: [],
        liczbaTras: 0,
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const trasyOdNajnowszej = wynikOdczytu.ksiazka.trasy
      .slice()
      .reverse();

    return utworzWynik("odczytano-liste-tras", {
      trasy: skopiujDane(trasyOdNajnowszej),
      liczbaTras: trasyOdNajnowszej.length
    });
  }

  function usunTrase(kluczTrasy) {
    zapewnijUruchomienie();
    const klucz = String(kluczTrasy || "").trim();

    if (!klucz) {
      return utworzWynik("blad-usuwania", {
        komunikat: "Nie wskazano trasy do usunięcia."
      });
    }

    const wynikOdczytu = odczytajKsiazke();

    if (!wynikOdczytu.ksiazka) {
      return utworzWynik(wynikOdczytu.status, {
        wersjaZapisu: wynikOdczytu.wersjaZapisu || null
      });
    }

    const indeksTrasy = wynikOdczytu.ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === klucz;
    });

    if (indeksTrasy === -1) {
      return utworzWynik("brak-trasy", {
        liczbaTras: wynikOdczytu.ksiazka.trasy.length
      });
    }

    const usunietaTrasa = wynikOdczytu.ksiazka.trasy.splice(indeksTrasy, 1)[0];
    const tekstPamieci = JSON.stringify(wynikOdczytu.ksiazka);
    const statusZapisu = zapiszTekstPamieci(tekstPamieci);

    return utworzWynik("usunieto-trase", {
      trasa: skopiujDane(usunietaTrasa),
      liczbaTras: wynikOdczytu.ksiazka.trasy.length,
      statusZapisu: statusZapisu,
      rozmiarBajtow: policzPrzyblizonyRozmiarBajtow(tekstPamieci)
    });
  }

  function pobierzStanPamieci() {
    zapewnijUruchomienie();
    const wynikOdczytu = odczytajKsiazke();
    const liczbaTras = wynikOdczytu.ksiazka
      ? wynikOdczytu.ksiazka.trasy.length
      : 0;
    const tekstPamieci = pobierzTekstPamieci();

    return {
      trybPamieci: trybPamieci,
      wersjaFormatu: WERSJA_FORMATU,
      kluczPamieci: KLUCZ_PAMIECI,
      liczbaTras: liczbaTras,
      maksymalnaLiczbaTras: MAKSYMALNA_LICZBA_TRAS,
      maksymalnyRozmiarPamieciBajty: MAKSYMALNY_ROZMIAR_PAMIECI_BAJTY,
      rozmiarBajtow: policzPrzyblizonyRozmiarBajtow(tekstPamieci)
    };
  }

  aplikacja.pamiecTras = {
    uruchomPamiecTras: uruchomPamiecTras,
    pobierzStanPamieci: pobierzStanPamieci,
    normalizujOpisLokalizacji: normalizujOpisLokalizacji,
    utworzKluczTrasy: utworzKluczTrasy,
    zapiszTrase: zapiszTrase,
    pobierzTrase: pobierzTrase,
    pobierzListeTras: pobierzListeTras,
    usunTrase: usunTrase
  };
})(window);