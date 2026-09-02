(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI_V1 = "harmonogramBetonowan.pamiecTras.v1";
  const KLUCZ_PAMIECI = "harmonogramBetonowan.pamiecTras.v2";
  const WERSJA_FORMATU = 2;
  const MAKSYMALNA_LICZBA_TRAS = 1000;
  const MAKSYMALNY_ROZMIAR_PAMIECI_BAJTY = 1024 * 1024;
  const MAKSYMALNA_DLUGOSC_OPISU = 500;
  const DOZWOLONE_ZRODLA = Object.freeze(["reczny", "mapa", "pamiec"]);
  const DOZWOLONE_ZRODLA_DANYCH = Object.freeze([
    "reczny",
    "mapa",
    "pamiec",
    "mieszane"
  ]);
  const RODZAJE_KLUCZA_LOKALIZACJI = Object.freeze([
    "wspolrzedne",
    "adres",
    "opis-zgodnosciowy"
  ]);
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

  function pobierzPoprawneIdWezla(idWezla) {
    const id = String(idWezla || "").trim();

    if (!id) {
      throw new Error("ID węzła jest wymagane dla pamięci trasy.");
    }

    return id;
  }

  function pobierzZnormalizowanyIdWezla(idWezla) {
    const id = pobierzPoprawneIdWezla(idWezla);
    const znormalizowane = normalizujOpisLokalizacji(id);

    if (!znormalizowane) {
      throw new Error("ID węzła nie zawiera znaków pozwalających je rozpoznać.");
    }

    return znormalizowane;
  }

  function utworzStaryKluczTrasyV2(opisLokalizacji, idWezla) {
    const opis = pobierzPoprawnyOpis(opisLokalizacji);
    const opisZnormalizowany = normalizujOpisLokalizacji(opis);

    if (!opisZnormalizowany) {
      throw new Error("Opis lokalizacji nie zawiera znaków pozwalających ją rozpoznać.");
    }

    return pobierzZnormalizowanyIdWezla(idWezla) + "::" + opisZnormalizowany;
  }

  function utworzKluczTrasy(opisLokalizacji, idWezla, daneLokalizacji) {
    const tozsamosc = utworzTozsamoscLokalizacji(
      opisLokalizacji,
      daneLokalizacji
    );

    return pobierzZnormalizowanyIdWezla(idWezla) +
      "::" + tozsamosc.kluczLokalizacji;
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

  function pobierzTekstLubBrak(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return null;
    }

    const tekst = String(wartosc).trim();
    return tekst || null;
  }

  function pobierzNieujemnaLiczbeLubBrak(wartosc, nazwaPola) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function przygotujAdresLokalizacji(adres) {
    const dane = czyPoprawnyObiekt(adres) ? adres : {};
    const czesci = czyPoprawnyObiekt(dane.czesci) ? skopiujDane(dane.czesci) : {};
    const tekst = pobierzTekstLubBrak(dane.tekst);
    const tekstZnormalizowany =
      pobierzTekstLubBrak(dane.tekstZnormalizowany) ||
      normalizujOpisLokalizacji(tekst) || null;

    return {
      tekst: tekst,
      tekstZnormalizowany: tekstZnormalizowany,
      czesci: czesci
    };
  }

  function przygotujWspolrzedne(wspolrzedne) {
    if (wspolrzedne === null || wspolrzedne === undefined) {
      return null;
    }

    if (!czyPoprawnyObiekt(wspolrzedne)) {
      throw new Error("Współrzędne lokalizacji muszą być parą liczb.");
    }

    const szerokosc = Number(wspolrzedne.szerokoscGeograficzna);
    const dlugosc = Number(wspolrzedne.dlugoscGeograficzna);

    if (!Number.isFinite(szerokosc) || szerokosc < -90 || szerokosc > 90 ||
        !Number.isFinite(dlugosc) || dlugosc < -180 || dlugosc > 180) {
      throw new Error("Współrzędne lokalizacji są poza dozwolonym zakresem.");
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function czyAdresMaRzeczywisteCzesci(adres) {
    const czesci = adres && czyPoprawnyObiekt(adres.czesci)
      ? adres.czesci
      : {};
    const polaAdresowe = [
      "ulica",
      "numerBudynku",
      "kodPocztowy",
      "miejscowosc",
      "gmina",
      "powiat",
      "wojewodztwo",
      "kraj"
    ];

    return polaAdresowe.some(function (nazwaPola) {
      return Boolean(pobierzTekstLubBrak(czesci[nazwaPola]));
    });
  }

  function czyAdresJestTylkoOpisemZgodnosciowym(adres) {
    const czesci = adres && czyPoprawnyObiekt(adres.czesci)
      ? adres.czesci
      : {};
    const czyMaOpis = Boolean(
      pobierzTekstLubBrak(czesci.firma) ||
      pobierzTekstLubBrak(czesci.nazwaBudowy)
    );

    return czyMaOpis && !czyAdresMaRzeczywisteCzesci(adres);
  }

  function pobierzZnormalizowanyAdresDoKlucza(adres) {
    const przygotowanyAdres = przygotujAdresLokalizacji(adres);

    if (!przygotowanyAdres.tekstZnormalizowany ||
        czyAdresJestTylkoOpisemZgodnosciowym(przygotowanyAdres)) {
      return null;
    }

    return przygotowanyAdres.tekstZnormalizowany;
  }

  function utworzTekstKluczaWspolrzednych(wspolrzedne) {
    const przygotowane = przygotujWspolrzedne(wspolrzedne);

    if (!przygotowane) {
      return null;
    }

    return String(przygotowane.szerokoscGeograficzna) + "," +
      String(przygotowane.dlugoscGeograficzna);
  }

  function utworzTozsamoscLokalizacji(opisLokalizacji, daneLokalizacji) {
    const dane = czyPoprawnyObiekt(daneLokalizacji) ? daneLokalizacji : {};
    const kluczWspolrzednych = utworzTekstKluczaWspolrzednych(
      dane.wspolrzedneLokalizacji
    );

    if (kluczWspolrzednych) {
      return {
        rodzaj: "wspolrzedne",
        kluczLokalizacji: "wspolrzedne::" + kluczWspolrzednych
      };
    }

    const adresZnormalizowany = pobierzZnormalizowanyAdresDoKlucza(
      dane.adresLokalizacji
    );

    if (adresZnormalizowany) {
      return {
        rodzaj: "adres",
        kluczLokalizacji: "adres::" + adresZnormalizowany
      };
    }

    const opis = pobierzPoprawnyOpis(opisLokalizacji);
    const opisZnormalizowany = normalizujOpisLokalizacji(opis);

    if (!opisZnormalizowany) {
      throw new Error("Opis lokalizacji nie zawiera znaków pozwalających ją rozpoznać.");
    }

    return {
      rodzaj: "opis-zgodnosciowy",
      kluczLokalizacji: "opis::" + opisZnormalizowany
    };
  }

  function pobierzZrodloDanych(wartosc, zrodloDojazdu, zrodloPowrotu) {
    const podane = String(wartosc || "").trim().toLowerCase();

    if (DOZWOLONE_ZRODLA_DANYCH.includes(podane)) {
      return podane;
    }

    if (zrodloDojazdu === zrodloPowrotu) {
      return zrodloDojazdu;
    }

    return "mieszane";
  }

  function wybierzMetadane(nowaWartosc, poprzedniaWartosc, przygotuj) {
    if (nowaWartosc !== undefined) {
      return przygotuj(nowaWartosc);
    }

    if (poprzedniaWartosc !== undefined) {
      return przygotuj(poprzedniaWartosc);
    }

    return przygotuj(null);
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

  function czyWspolnePolaTrasySaPoprawne(trasa) {
    if (!czyPoprawnyObiekt(trasa) ||
        !trasa.kluczTrasy ||
        !trasa.opisLokalizacji ||
        !trasa.opisZnormalizowany ||
        !trasa.idWezla ||
        !trasa.idWezlaZnormalizowany ||
        !Number.isFinite(Number(trasa.czasDojazduMinuty)) ||
        Number(trasa.czasDojazduMinuty) < 0 ||
        !Number.isFinite(Number(trasa.czasPowrotuMinuty)) ||
        Number(trasa.czasPowrotuMinuty) < 0 ||
        !czyPoprawnyObiekt(trasa.adresLokalizacji) ||
        !DOZWOLONE_ZRODLA_DANYCH.includes(trasa.zrodloDanych) ||
        !trasa.utworzono ||
        !trasa.zaktualizowano ||
        !trasa.ostatnioUzyto) {
      return false;
    }

    try {
      przygotujAdresLokalizacji(trasa.adresLokalizacji);
      przygotujWspolrzedne(trasa.wspolrzedneLokalizacji);
      pobierzNieujemnaLiczbeLubBrak(
        trasa.dystansDojazduMetry,
        "Dystans dojazdu"
      );
      pobierzNieujemnaLiczbeLubBrak(
        trasa.dystansPowrotuMetry,
        "Dystans powrotu"
      );

      return trasa.idWezlaZnormalizowany === pobierzZnormalizowanyIdWezla(
        trasa.idWezla
      ) &&
        trasa.opisZnormalizowany === normalizujOpisLokalizacji(
          trasa.opisLokalizacji
        );
    } catch (bladWalidacji) {
      return false;
    }
  }

  function czyPoprawnaTrasaV2Przed6D2(trasa) {
    if (!czyWspolnePolaTrasySaPoprawne(trasa)) {
      return false;
    }

    try {
      return trasa.kluczTrasy === utworzStaryKluczTrasyV2(
        trasa.opisLokalizacji,
        trasa.idWezla
      );
    } catch (bladWalidacji) {
      return false;
    }
  }

  function czyPoprawnaTrasa(trasa) {
    if (!czyWspolnePolaTrasySaPoprawne(trasa) ||
        !RODZAJE_KLUCZA_LOKALIZACJI.includes(trasa.rodzajKluczaLokalizacji) ||
        !trasa.kluczLokalizacji) {
      return false;
    }

    try {
      const tozsamosc = utworzTozsamoscLokalizacji(
        trasa.opisLokalizacji,
        {
          adresLokalizacji: trasa.adresLokalizacji,
          wspolrzedneLokalizacji: trasa.wspolrzedneLokalizacji
        }
      );

      return trasa.rodzajKluczaLokalizacji === tozsamosc.rodzaj &&
        trasa.kluczLokalizacji === tozsamosc.kluczLokalizacji &&
        trasa.kluczTrasy === pobierzZnormalizowanyIdWezla(trasa.idWezla) +
          "::" + tozsamosc.kluczLokalizacji;
    } catch (bladWalidacji) {
      return false;
    }
  }

  function migrujTraseV1(trasa) {
    if (!czyPoprawnyObiekt(trasa) || !trasa.opisLokalizacji) {
      throw new Error("Stary wpis trasy nie zawiera opisu lokalizacji.");
    }

    const idWezla = pobierzTekstLubBrak(trasa.idWezla) || "wezel-domyslny";
    const zrodloDojazdu = pobierzZrodlo(trasa.zrodloCzasuDojazdu);
    const zrodloPowrotu = pobierzZrodlo(trasa.zrodloCzasuPowrotu);
    const teraz = new Date().toISOString();

    const tozsamosc = utworzTozsamoscLokalizacji(trasa.opisLokalizacji, {});

    return {
      kluczTrasy: utworzKluczTrasy(trasa.opisLokalizacji, idWezla, {}),
      rodzajKluczaLokalizacji: tozsamosc.rodzaj,
      kluczLokalizacji: tozsamosc.kluczLokalizacji,
      opisLokalizacji: pobierzPoprawnyOpis(trasa.opisLokalizacji),
      opisZnormalizowany: normalizujOpisLokalizacji(trasa.opisLokalizacji),
      idWezla: idWezla,
      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),
      adresLokalizacji: przygotujAdresLokalizacji(null),
      wspolrzedneLokalizacji: null,
      dystansDojazduMetry: null,
      dystansPowrotuMetry: null,
      czasDojazduMinuty: pobierzCzasPrzejazdu(
        trasa.czasDojazduMinuty,
        "Czas dojazdu"
      ),
      czasPowrotuMinuty: pobierzCzasPrzejazdu(
        trasa.czasPowrotuMinuty,
        "Czas powrotu"
      ),
      zrodloCzasuDojazdu: zrodloDojazdu,
      zrodloCzasuPowrotu: zrodloPowrotu,
      zrodloDanych: pobierzZrodloDanych(
        trasa.zrodloDanych,
        zrodloDojazdu,
        zrodloPowrotu
      ),
      dostawcaDanych: pobierzTekstLubBrak(trasa.dostawcaDanych),
      utworzono: pobierzTekstLubBrak(trasa.utworzono) || teraz,
      zaktualizowano: pobierzTekstLubBrak(trasa.zaktualizowano) || teraz,
      ostatnioUzyto: pobierzTekstLubBrak(trasa.ostatnioUzyto) || teraz
    };
  }

  function migrujTraseV2DoStabilnegoKlucza(trasa) {
    const adresLokalizacji = przygotujAdresLokalizacji(trasa.adresLokalizacji);
    const wspolrzedneLokalizacji = przygotujWspolrzedne(
      trasa.wspolrzedneLokalizacji
    );
    const tozsamosc = utworzTozsamoscLokalizacji(
      trasa.opisLokalizacji,
      {
        adresLokalizacji: adresLokalizacji,
        wspolrzedneLokalizacji: wspolrzedneLokalizacji
      }
    );

    return Object.assign({}, trasa, {
      kluczTrasy: pobierzZnormalizowanyIdWezla(trasa.idWezla) +
        "::" + tozsamosc.kluczLokalizacji,
      rodzajKluczaLokalizacji: tozsamosc.rodzaj,
      kluczLokalizacji: tozsamosc.kluczLokalizacji,
      adresLokalizacji: adresLokalizacji,
      wspolrzedneLokalizacji: wspolrzedneLokalizacji
    });
  }

  function migrujKsiazkeV2DoStabilnychKluczy(ksiazka) {
    const trasy = [];
    let liczbaScalonychDuplikatow = 0;

    ksiazka.trasy.forEach(function (staraTrasa) {
      const trasa = migrujTraseV2DoStabilnegoKlucza(staraTrasa);
      const indeksDuplikatu = trasy.findIndex(function (istniejacaTrasa) {
        return istniejacaTrasa.kluczTrasy === trasa.kluczTrasy;
      });

      if (indeksDuplikatu !== -1) {
        const poprzedniaTrasa = trasy[indeksDuplikatu];
        trasa.utworzono = poprzedniaTrasa.utworzono || trasa.utworzono;
        trasy.splice(indeksDuplikatu, 1);
        liczbaScalonychDuplikatow += 1;
      }

      trasy.push(trasa);
    });

    return {
      ksiazka: {
        wersja: WERSJA_FORMATU,
        trasy: trasy
      },
      liczbaScalonychDuplikatow: liczbaScalonychDuplikatow
    };
  }

  function pobierzTekstPamieciV1() {
    if (!pamiecLokalna || trybPamieci !== "trwala") {
      return null;
    }

    try {
      return pamiecLokalna.getItem(KLUCZ_PAMIECI_V1);
    } catch (bladOdczytu) {
      return null;
    }
  }

  function sprobujMigrowacKsiazkeV1() {
    const tekstV1 = pobierzTekstPamieciV1();

    if (!tekstV1) {
      return null;
    }

    try {
      const staraKsiazka = JSON.parse(tekstV1);

      if (!czyPoprawnyObiekt(staraKsiazka) ||
          staraKsiazka.wersja !== 1 ||
          !Array.isArray(staraKsiazka.trasy)) {
        throw new Error("Nieprawidłowy format książki tras v1.");
      }

      const nowaKsiazka = {
        wersja: WERSJA_FORMATU,
        trasy: staraKsiazka.trasy.map(migrujTraseV1)
      };

      if (!nowaKsiazka.trasy.every(czyPoprawnaTrasa)) {
        throw new Error("Nie udało się zweryfikować zmigrowanych tras.");
      }

      const ograniczona = ograniczKsiazke(nowaKsiazka);
      const statusZapisu = zapiszTekstPamieci(ograniczona.tekstPamieci);

      return {
        status: "zmigrowano-v1-do-v2",
        statusZapisu: statusZapisu,
        ksiazka: ograniczona.ksiazka,
        liczbaZmigrowanychTras: ograniczona.ksiazka.trasy.length
      };
    } catch (bladMigracji) {
      return {
        status: "blad-migracji-v1",
        ksiazka: utworzPustaKsiazke(),
        komunikat: bladMigracji.message
      };
    }
  }

  function odczytajKsiazke() {
    zapewnijUruchomienie();
    const tekstPamieci = pobierzTekstPamieci();

    if (!tekstPamieci) {
      const wynikMigracji = sprobujMigrowacKsiazkeV1();

      if (wynikMigracji) {
        return wynikMigracji;
      }

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

    if (ksiazka.trasy.every(czyPoprawnaTrasa)) {
      return {
        status: "odczytano",
        ksiazka: ksiazka
      };
    }

    if (ksiazka.trasy.every(function (trasa) {
      return czyPoprawnaTrasa(trasa) || czyPoprawnaTrasaV2Przed6D2(trasa);
    })) {
      try {
        const migracja = migrujKsiazkeV2DoStabilnychKluczy(ksiazka);

        if (!migracja.ksiazka.trasy.every(czyPoprawnaTrasa)) {
          throw new Error("Nie udało się zweryfikować stabilnych kluczy tras.");
        }

        const ograniczona = ograniczKsiazke(migracja.ksiazka);
        const statusZapisu = zapiszTekstPamieci(ograniczona.tekstPamieci);

        return {
          status: "zmigrowano-klucze-6d2",
          statusZapisu: statusZapisu,
          ksiazka: ograniczona.ksiazka,
          liczbaScalonychDuplikatow: migracja.liczbaScalonychDuplikatow
        };
      } catch (bladMigracji) {
        return {
          status: "blad-migracji-kluczy-6d2",
          ksiazka: utworzPustaKsiazke(),
          komunikat: bladMigracji.message
        };
      }
    }

    usunUszkodzonyZapis();
    return {
      status: "uszkodzony-zapis",
      ksiazka: utworzPustaKsiazke()
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
    const idWezla = pobierzPoprawneIdWezla(daneTrasy.idWezla);
    const teraz = new Date().toISOString();
    const poprzednia = poprzedniaTrasa || {};
    const zrodloDojazdu = pobierzZrodlo(daneTrasy.zrodloCzasuDojazdu);
    const zrodloPowrotu = pobierzZrodlo(daneTrasy.zrodloCzasuPowrotu);
    const adresLokalizacji = wybierzMetadane(
      daneTrasy.adresLokalizacji,
      poprzednia.adresLokalizacji,
      przygotujAdresLokalizacji
    );
    const wspolrzedneLokalizacji = wybierzMetadane(
      daneTrasy.wspolrzedneLokalizacji,
      poprzednia.wspolrzedneLokalizacji,
      przygotujWspolrzedne
    );
    const tozsamosc = utworzTozsamoscLokalizacji(
      opisLokalizacji,
      {
        adresLokalizacji: adresLokalizacji,
        wspolrzedneLokalizacji: wspolrzedneLokalizacji
      }
    );

    return {
      kluczTrasy: pobierzZnormalizowanyIdWezla(idWezla) +
        "::" + tozsamosc.kluczLokalizacji,
      rodzajKluczaLokalizacji: tozsamosc.rodzaj,
      kluczLokalizacji: tozsamosc.kluczLokalizacji,
      opisLokalizacji: opisLokalizacji,
      opisZnormalizowany: normalizujOpisLokalizacji(opisLokalizacji),
      idWezla: idWezla,
      idWezlaZnormalizowany: pobierzZnormalizowanyIdWezla(idWezla),
      adresLokalizacji: adresLokalizacji,
      wspolrzedneLokalizacji: wspolrzedneLokalizacji,
      dystansDojazduMetry: wybierzMetadane(
        daneTrasy.dystansDojazduMetry,
        poprzednia.dystansDojazduMetry,
        function (wartosc) {
          return pobierzNieujemnaLiczbeLubBrak(wartosc, "Dystans dojazdu");
        }
      ),
      dystansPowrotuMetry: wybierzMetadane(
        daneTrasy.dystansPowrotuMetry,
        poprzednia.dystansPowrotuMetry,
        function (wartosc) {
          return pobierzNieujemnaLiczbeLubBrak(wartosc, "Dystans powrotu");
        }
      ),
      czasDojazduMinuty: pobierzCzasPrzejazdu(
        daneTrasy.czasDojazduMinuty,
        "Czas dojazdu"
      ),
      czasPowrotuMinuty: pobierzCzasPrzejazdu(
        daneTrasy.czasPowrotuMinuty,
        "Czas powrotu"
      ),
      zrodloCzasuDojazdu: zrodloDojazdu,
      zrodloCzasuPowrotu: zrodloPowrotu,
      zrodloDanych: pobierzZrodloDanych(
        daneTrasy.zrodloDanych,
        zrodloDojazdu,
        zrodloPowrotu
      ),
      dostawcaDanych: daneTrasy.dostawcaDanych !== undefined
        ? pobierzTekstLubBrak(daneTrasy.dostawcaDanych)
        : pobierzTekstLubBrak(poprzednia.dostawcaDanych),
      utworzono: poprzednia.utworzono || teraz,
      zaktualizowano: teraz,
      ostatnioUzyto: teraz
    };
  }

  function znajdzIndeksyPoDokladnymOpisie(ksiazka, opisLokalizacji, idWezla) {
    const opisZnormalizowany = normalizujOpisLokalizacji(
      pobierzPoprawnyOpis(opisLokalizacji)
    );
    const idWezlaZnormalizowany = pobierzZnormalizowanyIdWezla(idWezla);
    const indeksy = [];

    ksiazka.trasy.forEach(function (trasa, indeksTrasy) {
      if (trasa.idWezlaZnormalizowany === idWezlaZnormalizowany &&
          trasa.opisZnormalizowany === opisZnormalizowany) {
        indeksy.push(indeksTrasy);
      }
    });

    return indeksy;
  }

  function zapiszTrase(daneTrasy) {
    zapewnijUruchomienie();

    let tozsamoscPodana;
    let kluczPodany;

    try {
      if (!czyPoprawnyObiekt(daneTrasy)) {
        throw new Error("Dane trasy muszą być obiektem.");
      }

      tozsamoscPodana = utworzTozsamoscLokalizacji(
        daneTrasy.opisLokalizacji,
        {
          adresLokalizacji: daneTrasy.adresLokalizacji,
          wspolrzedneLokalizacji: daneTrasy.wspolrzedneLokalizacji
        }
      );
      kluczPodany = utworzKluczTrasy(
        daneTrasy.opisLokalizacji,
        daneTrasy.idWezla,
        {
          adresLokalizacji: daneTrasy.adresLokalizacji,
          wspolrzedneLokalizacji: daneTrasy.wspolrzedneLokalizacji
        }
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
    let indeksIstniejacejTrasy = ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === kluczPodany;
    });

    if (indeksIstniejacejTrasy === -1 &&
        tozsamoscPodana.rodzaj === "opis-zgodnosciowy") {
      const indeksyPoOpisie = znajdzIndeksyPoDokladnymOpisie(
        ksiazka,
        daneTrasy.opisLokalizacji,
        daneTrasy.idWezla
      );

      if (indeksyPoOpisie.length > 1) {
        return utworzWynik("blad-zapisu", {
          komunikat: "Ten opis pasuje do kilku zapamiętanych lokalizacji. Podaj adres lub współrzędne."
        });
      }

      if (indeksyPoOpisie.length === 1) {
        indeksIstniejacejTrasy = indeksyPoOpisie[0];
      }
    }

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

    const indeksDuplikatuKlucza = ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === nowaTrasa.kluczTrasy;
    });

    if (indeksDuplikatuKlucza !== -1) {
      ksiazka.trasy.splice(indeksDuplikatuKlucza, 1);
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

  function pobierzTrase(opisLokalizacji, idWezla, daneLokalizacji) {
    zapewnijUruchomienie();

    let tozsamosc;
    let kluczTrasy;

    try {
      tozsamosc = utworzTozsamoscLokalizacji(
        opisLokalizacji,
        daneLokalizacji
      );
      kluczTrasy = utworzKluczTrasy(
        opisLokalizacji,
        idWezla,
        daneLokalizacji
      );
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

    let indeksZnalezionejTrasy = wynikOdczytu.ksiazka.trasy.findIndex(function (trasa) {
      return trasa.kluczTrasy === kluczTrasy;
    });

    if (indeksZnalezionejTrasy === -1 &&
        tozsamosc.rodzaj === "opis-zgodnosciowy") {
      const indeksyPoOpisie = znajdzIndeksyPoDokladnymOpisie(
        wynikOdczytu.ksiazka,
        opisLokalizacji,
        idWezla
      );

      if (indeksyPoOpisie.length > 1) {
        return utworzWynik("niejednoznaczna-lokalizacja", {
          trasa: null,
          liczbaPasujacychTras: indeksyPoOpisie.length,
          komunikat: "Ten opis odpowiada kilku zapamiętanym lokalizacjom. Wymagany jest adres lub współrzędne."
        });
      }

      if (indeksyPoOpisie.length === 1) {
        indeksZnalezionejTrasy = indeksyPoOpisie[0];
      }
    }

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
      kluczPamieciStarszejWersji: KLUCZ_PAMIECI_V1,
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
    utworzTozsamoscLokalizacji: utworzTozsamoscLokalizacji,
    zapiszTrase: zapiszTrase,
    pobierzTrase: pobierzTrase,
    pobierzListeTras: pobierzListeTras,
    usunTrase: usunTrase
  };
})(window);