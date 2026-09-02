(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const lokalizacje = aplikacja.lokalizacje = aplikacja.lokalizacje || {};

  const WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY = 1;
  const TYPY_LOKALIZACJI = Object.freeze(["budowa", "wezel"]);
  const RODZAJE_RELACJI = Object.freeze([
    "brak",
    "wezel-budowa",
    "budowa-budowa"
  ]);
  const KIERUNKI_TRASY = Object.freeze([
    "brak",
    "do-budowy",
    "do-wezla",
    "miedzy-budowami"
  ]);
  const STATUSY_JAKOSCI = Object.freeze([
    "brak",
    "nieoceniona",
    "pelna",
    "niepelna",
    "niewystarczajaca",
    "niejednoznaczna",
    "nieznaleziona",
    "potwierdzona"
  ]);
  const ZRODLA_DANYCH = Object.freeze([
    "brak",
    "csv",
    "reczny",
    "pamiec",
    "mapa"
  ]);

  function czyObiekt(wartosc) {
    return Boolean(wartosc) &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc);
  }

  function skopiujDane(wartosc) {
    if (Array.isArray(wartosc)) {
      return wartosc.map(skopiujDane);
    }

    if (czyObiekt(wartosc)) {
      return Object.keys(wartosc).reduce(function (kopia, nazwaPola) {
        kopia[nazwaPola] = skopiujDane(wartosc[nazwaPola]);
        return kopia;
      }, {});
    }

    return wartosc;
  }

  function pobierzObiektLubPusty(wartosc, nazwaPola) {
    if (wartosc === null || wartosc === undefined) {
      return {};
    }

    if (!czyObiekt(wartosc)) {
      throw new Error("Pole „" + nazwaPola + "” musi być obiektem danych.");
    }

    return wartosc;
  }

  function pobierzTekstLubBrak(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return null;
    }

    const tekst = String(wartosc).trim();
    return tekst || null;
  }

  function pobierzWymaganyTekst(wartosc, nazwaPola) {
    const tekst = pobierzTekstLubBrak(wartosc);

    if (!tekst) {
      throw new Error("Pole „" + nazwaPola + "” jest wymagane.");
    }

    return tekst;
  }

  function pobierzDozwolonaWartosc(
    wartosc,
    wartoscDomyslna,
    dozwoloneWartosci,
    nazwaPola
  ) {
    const tekst = pobierzTekstLubBrak(wartosc) || wartoscDomyslna;

    if (!dozwoloneWartosci.includes(tekst)) {
      throw new Error(
        "Pole „" + nazwaPola + "” ma nieobsługiwaną wartość „" + tekst + "”."
      );
    }

    return tekst;
  }

  function pobierzNieujemnaLiczbeLubBrak(wartosc, nazwaPola) {
    if (
      wartosc === null ||
      wartosc === undefined ||
      (typeof wartosc === "string" && wartosc.trim() === "")
    ) {
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

  function pobierzWymaganaLiczbe(wartosc, nazwaPola) {
    const czyPusta = wartosc === null ||
      wartosc === undefined ||
      (typeof wartosc === "string" && wartosc.trim() === "");
    const liczba = czyPusta ? NaN : Number(wartosc);

    if (!Number.isFinite(liczba)) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać poprawną liczbę.");
    }

    return liczba;
  }

  function pobierzZnacznikKorektyRecznej(wartosc) {
    if (wartosc === null || wartosc === undefined) {
      return false;
    }

    if (typeof wartosc !== "boolean") {
      throw new Error("Pole „Ręczna korekta” musi mieć wartość logiczną.");
    }

    return wartosc;
  }


  function normalizujTekstAdresu(wartosc) {
    const tekst = pobierzTekstLubBrak(wartosc);

    if (!tekst) {
      return null;
    }

    const tekstZnormalizowany = tekst
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");

    return tekstZnormalizowany || null;
  }

  function pobierzCzescAdresu(czesci, nazwaPola) {
    return pobierzTekstLubBrak(czesci && czesci[nazwaPola]);
  }

  function zlozTekstAdresuZCzesci(czesciAdresu) {
    const czesci = pobierzObiektLubPusty(czesciAdresu, "Części adresu");
    const ulicaINumer = [
      pobierzCzescAdresu(czesci, "ulica"),
      pobierzCzescAdresu(czesci, "numerBudynku")
    ].filter(Boolean).join(" ") || null;
    const kodIMiejscowosc = [
      pobierzCzescAdresu(czesci, "kodPocztowy"),
      pobierzCzescAdresu(czesci, "miejscowosc")
    ].filter(Boolean).join(" ") || null;
    const segmenty = [
      ulicaINumer,
      kodIMiejscowosc,
      pobierzCzescAdresu(czesci, "gmina"),
      pobierzCzescAdresu(czesci, "powiat"),
      pobierzCzescAdresu(czesci, "wojewodztwo"),
      pobierzCzescAdresu(czesci, "kraj")
    ].filter(Boolean);

    return segmenty.length ? segmenty.join(", ") : null;
  }

  function utworzAdresRoboczy(daneAdresu) {
    const adres = utworzAdres(daneAdresu);
    const tekstRoboczy = adres.tekst || zlozTekstAdresuZCzesci(adres.czesci);

    return {
      tekst: tekstRoboczy,
      tekstZnormalizowany: normalizujTekstAdresu(tekstRoboczy),
      czesci: skopiujDane(adres.czesci)
    };
  }


  function pobierzRozpoznaneCzesciAdresu(czesciAdresu) {
    const czesci = pobierzObiektLubPusty(czesciAdresu, "Części adresu");

    return {
      ulica: pobierzCzescAdresu(czesci, "ulica"),
      numerBudynku: pobierzCzescAdresu(czesci, "numerBudynku"),
      kodPocztowy: pobierzCzescAdresu(czesci, "kodPocztowy"),
      miejscowosc: pobierzCzescAdresu(czesci, "miejscowosc"),
      gmina: pobierzCzescAdresu(czesci, "gmina"),
      powiat: pobierzCzescAdresu(czesci, "powiat"),
      wojewodztwo: pobierzCzescAdresu(czesci, "wojewodztwo"),
      kraj: pobierzCzescAdresu(czesci, "kraj"),
      firma: pobierzCzescAdresu(czesci, "firma"),
      nazwaBudowy: pobierzCzescAdresu(czesci, "nazwaBudowy")
    };
  }

  function czyTekstMaNumerBudynku(tekst) {
    return /(?:^|[\s,])\d+[a-zA-Z]?(?:[\/-]\d+[a-zA-Z]?)?(?=$|[\s,])/i.test(
      String(tekst || "")
    );
  }

  function czyTekstMaKodPocztowy(tekst) {
    return /\b\d{2}[-\s]\d{3}\b/.test(String(tekst || ""));
  }

  function policzZnaczaceSlowaAdresu(tekst) {
    const tekstZnormalizowany = normalizujTekstAdresu(tekst);

    if (!tekstZnormalizowany) {
      return 0;
    }

    return tekstZnormalizowany.split(" ").filter(function (slowo) {
      return /[a-z]/.test(slowo);
    }).length;
  }

  function czyAdresJestTylkoOpisemZgodnosciowym(czesci) {
    const czyMaWlasciwaCzescAdresu = [
      "ulica",
      "numerBudynku",
      "kodPocztowy",
      "miejscowosc",
      "gmina",
      "powiat",
      "wojewodztwo",
      "kraj"
    ].some(function (nazwaPola) {
      return Boolean(czesci[nazwaPola]);
    });
    const czyMaOpisZgodnosciowy = Boolean(czesci.firma || czesci.nazwaBudowy);

    return !czyMaWlasciwaCzescAdresu && czyMaOpisZgodnosciowy;
  }

  function ocenAdresLokalnie(daneAdresu) {
    const adres = utworzAdresRoboczy(daneAdresu);
    const czesci = pobierzRozpoznaneCzesciAdresu(adres.czesci);
    const tekst = adres.tekst || "";
    const czyMaTekst = Boolean(adres.tekstZnormalizowany);
    const czyMaWlasciwaCzesc = [
      czesci.ulica,
      czesci.numerBudynku,
      czesci.kodPocztowy,
      czesci.miejscowosc,
      czesci.gmina,
      czesci.powiat,
      czesci.wojewodztwo,
      czesci.kraj
    ].some(Boolean);

    if (!czyMaTekst && !czyMaWlasciwaCzesc) {
      return { statusJakosci: "brak", czyMoznaSzukacAutomatycznie: false };
    }

    if (czyAdresJestTylkoOpisemZgodnosciowym(czesci)) {
      return {
        statusJakosci: "niewystarczajaca",
        czyMoznaSzukacAutomatycznie: false
      };
    }

    if (czesci.ulica && czesci.numerBudynku && czesci.miejscowosc) {
      return { statusJakosci: "pelna", czyMoznaSzukacAutomatycznie: true };
    }

    if (
      (czesci.ulica && czesci.miejscowosc) ||
      (czesci.kodPocztowy && czesci.miejscowosc) ||
      (
        czesci.miejscowosc &&
        Boolean(czesci.gmina || czesci.powiat || czesci.wojewodztwo || czesci.kraj)
      )
    ) {
      return { statusJakosci: "niepelna", czyMoznaSzukacAutomatycznie: true };
    }

    const liczbaSlow = policzZnaczaceSlowaAdresu(tekst);
    const czyMaNumer = czyTekstMaNumerBudynku(tekst);
    const czyMaKod = czyTekstMaKodPocztowy(tekst);
    const czyMaSeparatorCzesci = /[,;]/.test(tekst);

    if (czyMaNumer && liczbaSlow >= 2 && (czyMaKod || czyMaSeparatorCzesci)) {
      return { statusJakosci: "pelna", czyMoznaSzukacAutomatycznie: true };
    }

    if (liczbaSlow >= 2 && (czyMaNumer || czyMaKod || czyMaSeparatorCzesci)) {
      return { statusJakosci: "niepelna", czyMoznaSzukacAutomatycznie: true };
    }

    return {
      statusJakosci: "niewystarczajaca",
      czyMoznaSzukacAutomatycznie: false
    };
  }

  function utworzKomunikatJakosciAdresu(statusJakosci) {
    const status = pobierzDozwolonaWartosc(
      statusJakosci,
      "brak",
      STATUSY_JAKOSCI,
      "Status jakości adresu"
    );
    const komunikaty = {
      brak: "Brak danych adresowych. Możesz nadal użyć zapamiętanych lub ręcznych czasów przejazdu.",
      nieoceniona: "Adres nie został jeszcze oceniony.",
      pelna: "Adres wygląda na kompletny i jest gotowy do wyszukania.",
      niepelna: "Adres jest niepełny, ale zawiera dane wystarczające do próby wyszukania. Wynik wymaga sprawdzenia.",
      niewystarczajaca: "Za mało danych adresowych do bezpiecznego wyszukania. Uzupełnij adres albo użyj zapamiętanych lub ręcznych czasów.",
      niejednoznaczna: "Znaleziono więcej niż jedną pasującą lokalizację. Wybierz właściwą lokalizację ręcznie.",
      nieznaleziona: "Nie znaleziono lokalizacji dla tego adresu. Popraw adres albo użyj zapamiętanych lub ręcznych czasów.",
      potwierdzona: "Lokalizacja została potwierdzona przez operatora."
    };

    return komunikaty[status];
  }

  function pobierzInformacjeJakosciAdresu(daneAdresu, statusJakosci) {
    const podanyStatus = pobierzDozwolonaWartosc(
      statusJakosci,
      "nieoceniona",
      STATUSY_JAKOSCI,
      "Status jakości adresu"
    );
    const ocenaLokalna = ocenAdresLokalnie(daneAdresu);
    const status = ["brak", "nieoceniona"].includes(podanyStatus)
      ? ocenaLokalna.statusJakosci
      : podanyStatus;

    return {
      statusJakosci: status,
      czyMoznaSzukacAutomatycznie: ["pelna", "niepelna"].includes(status),
      czyWymagaUwagiOperatora: [
        "brak",
        "niepelna",
        "niewystarczajaca",
        "niejednoznaczna",
        "nieznaleziona"
      ].includes(status),
      komunikatOperatora: utworzKomunikatJakosciAdresu(status)
    };
  }

  function utworzAdres(daneAdresu) {
    const dane = pobierzObiektLubPusty(daneAdresu, "Adres");
    const czesci = pobierzObiektLubPusty(dane.czesci, "Części adresu");

    return {
      tekst: pobierzTekstLubBrak(dane.tekst),
      tekstZnormalizowany: pobierzTekstLubBrak(dane.tekstZnormalizowany),
      czesci: skopiujDane(czesci)
    };
  }

  function utworzWspolrzedne(daneWspolrzednych) {
    if (daneWspolrzednych === null || daneWspolrzednych === undefined) {
      return null;
    }

    if (!czyObiekt(daneWspolrzednych)) {
      throw new Error("Współrzędne muszą być zapisane jako para liczb.");
    }

    const szerokosc = pobierzWymaganaLiczbe(
      daneWspolrzednych.szerokoscGeograficzna,
      "Szerokość geograficzna"
    );
    const dlugosc = pobierzWymaganaLiczbe(
      daneWspolrzednych.dlugoscGeograficzna,
      "Długość geograficzna"
    );

    if (szerokosc < -90 || szerokosc > 90) {
      throw new Error(
        "Szerokość geograficzna musi mieścić się w zakresie od -90 do 90."
      );
    }

    if (dlugosc < -180 || dlugosc > 180) {
      throw new Error(
        "Długość geograficzna musi mieścić się w zakresie od -180 do 180."
      );
    }

    return {
      szerokoscGeograficzna: szerokosc,
      dlugoscGeograficzna: dlugosc
    };
  }

  function utworzWarstweLokalizacji(daneWarstwy) {
    const dane = pobierzObiektLubPusty(
      daneWarstwy,
      "Warstwa danych lokalizacji"
    );

    return {
      adres: utworzAdres(dane.adres),
      wspolrzedne: utworzWspolrzedne(dane.wspolrzedne),
      statusJakosci: pobierzDozwolonaWartosc(
        dane.statusJakosci,
        "brak",
        STATUSY_JAKOSCI,
        "Status jakości lokalizacji"
      ),
      zrodlo: pobierzDozwolonaWartosc(
        dane.zrodlo,
        "brak",
        ZRODLA_DANYCH,
        "Źródło lokalizacji"
      ),
      czyKorektaReczna: pobierzZnacznikKorektyRecznej(
        dane.czyKorektaReczna
      )
    };
  }


  function utworzModelLokalizacji(daneModelu) {
    const dane = pobierzObiektLubPusty(daneModelu, "Model lokalizacji");
    const daneZrodlowe = utworzWarstweLokalizacji(dane.daneZrodlowe);
    const daneAutomatyczne = utworzWarstweLokalizacji(dane.daneAutomatyczne);
    const daneRobocze = utworzWarstweLokalizacji(dane.daneRobocze);

    if (["brak", "nieoceniona"].includes(daneRobocze.statusJakosci)) {
      daneRobocze.statusJakosci = ocenAdresLokalnie(
        daneRobocze.adres
      ).statusJakosci;
    }

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
      idLokalizacji: pobierzTekstLubBrak(dane.idLokalizacji),
      typLokalizacji: pobierzDozwolonaWartosc(
        dane.typLokalizacji,
        "budowa",
        TYPY_LOKALIZACJI,
        "Typ lokalizacji"
      ),
      daneZrodlowe: daneZrodlowe,
      daneAutomatyczne: daneAutomatyczne,
      daneRobocze: daneRobocze
    };
  }

  function utworzModelWezla(daneWezla) {
    const dane = pobierzObiektLubPusty(daneWezla, "Model węzła");
    const idWezla = pobierzWymaganyTekst(dane.idWezla, "ID węzła");
    const nazwa = pobierzWymaganyTekst(dane.nazwa, "Nazwa węzła");
    const daneLokalizacji = pobierzObiektLubPusty(
      dane.modelLokalizacji,
      "Model lokalizacji węzła"
    );
    const idLokalizacji = pobierzTekstLubBrak(daneLokalizacji.idLokalizacji);
    const typLokalizacji = pobierzTekstLubBrak(daneLokalizacji.typLokalizacji);

    if (idLokalizacji && idLokalizacji !== idWezla) {
      throw new Error("ID lokalizacji węzła musi być zgodne z ID węzła.");
    }

    if (typLokalizacji && typLokalizacji !== "wezel") {
      throw new Error("Model węzła musi mieć typ lokalizacji „wezel”.");
    }

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
      idWezla: idWezla,
      nazwa: nazwa,
      modelLokalizacji: utworzModelLokalizacji(Object.assign(
        {},
        daneLokalizacji,
        {
          idLokalizacji: idWezla,
          typLokalizacji: "wezel"
        }
      ))
    };
  }

  function utworzPunktTrasy(danePunktu, nazwaPunktu) {
    if (danePunktu === null || danePunktu === undefined) {
      return null;
    }

    if (!czyObiekt(danePunktu)) {
      throw new Error(nazwaPunktu + " musi wskazywać lokalizację.");
    }

    const idLokalizacji = pobierzTekstLubBrak(danePunktu.idLokalizacji);

    if (!idLokalizacji) {
      throw new Error(nazwaPunktu + " wymaga identyfikatora lokalizacji.");
    }

    return {
      idLokalizacji: idLokalizacji,
      typLokalizacji: pobierzDozwolonaWartosc(
        danePunktu.typLokalizacji,
        "budowa",
        TYPY_LOKALIZACJI,
        "Typ punktu trasy"
      )
    };
  }

  function utworzWarstweTrasy(daneWarstwy) {
    const dane = pobierzObiektLubPusty(daneWarstwy, "Warstwa danych trasy");

    return {
      dystansDrogowyMetry: pobierzNieujemnaLiczbeLubBrak(
        dane.dystansDrogowyMetry,
        "Dystans drogowy"
      ),
      czasPrzejazduMinuty: pobierzNieujemnaLiczbeLubBrak(
        dane.czasPrzejazduMinuty,
        "Czas przejazdu"
      ),
      statusJakosci: pobierzDozwolonaWartosc(
        dane.statusJakosci,
        "brak",
        STATUSY_JAKOSCI,
        "Status jakości trasy"
      ),
      zrodlo: pobierzDozwolonaWartosc(
        dane.zrodlo,
        "brak",
        ZRODLA_DANYCH,
        "Źródło trasy"
      ),
      czyKorektaReczna: pobierzZnacznikKorektyRecznej(
        dane.czyKorektaReczna
      )
    };
  }

  function wyznaczRelacjeIKierunek(punktPoczatkowy, punktDocelowy) {
    if (!punktPoczatkowy && !punktDocelowy) {
      return null;
    }

    if (!punktPoczatkowy || !punktDocelowy) {
      throw new Error("Trasa wymaga punktu początkowego i docelowego.");
    }

    if (
      punktPoczatkowy.typLokalizacji === punktDocelowy.typLokalizacji &&
      punktPoczatkowy.idLokalizacji === punktDocelowy.idLokalizacji
    ) {
      throw new Error("Trasa wymaga dwóch różnych lokalizacji.");
    }

    if (
      punktPoczatkowy.typLokalizacji === "budowa" &&
      punktDocelowy.typLokalizacji === "budowa"
    ) {
      return {
        rodzajRelacji: "budowa-budowa",
        kierunek: "miedzy-budowami"
      };
    }

    if (
      punktPoczatkowy.typLokalizacji === "wezel" &&
      punktDocelowy.typLokalizacji === "budowa"
    ) {
      return {
        rodzajRelacji: "wezel-budowa",
        kierunek: "do-budowy"
      };
    }

    if (
      punktPoczatkowy.typLokalizacji === "budowa" &&
      punktDocelowy.typLokalizacji === "wezel"
    ) {
      return {
        rodzajRelacji: "wezel-budowa",
        kierunek: "do-wezla"
      };
    }

    throw new Error("Trasa nie może łączyć dwóch węzłów.");
  }

  function sprawdzZgodnoscRelacji(
    podanaWartosc,
    wyznaczonaWartosc,
    nazwaPola
  ) {
    if (
      wyznaczonaWartosc &&
      podanaWartosc !== "brak" &&
      podanaWartosc !== wyznaczonaWartosc
    ) {
      throw new Error(
        "Pole „" + nazwaPola + "” nie zgadza się z punktami trasy."
      );
    }

    return wyznaczonaWartosc || podanaWartosc;
  }

  function utworzModelTrasy(daneModelu) {
    const dane = pobierzObiektLubPusty(daneModelu, "Model trasy");
    const punktPoczatkowy = utworzPunktTrasy(
      dane.punktPoczatkowy,
      "Punkt początkowy"
    );
    const punktDocelowy = utworzPunktTrasy(
      dane.punktDocelowy,
      "Punkt docelowy"
    );
    const wyznaczoneDane = wyznaczRelacjeIKierunek(
      punktPoczatkowy,
      punktDocelowy
    );
    const rodzajRelacji = pobierzDozwolonaWartosc(
      dane.rodzajRelacji,
      "brak",
      RODZAJE_RELACJI,
      "Rodzaj relacji"
    );
    const kierunek = pobierzDozwolonaWartosc(
      dane.kierunek,
      "brak",
      KIERUNKI_TRASY,
      "Kierunek trasy"
    );

    return {
      wersjaKontraktu: WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
      idTrasy: pobierzTekstLubBrak(dane.idTrasy),
      rodzajRelacji: sprawdzZgodnoscRelacji(
        rodzajRelacji,
        wyznaczoneDane && wyznaczoneDane.rodzajRelacji,
        "Rodzaj relacji"
      ),
      kierunek: sprawdzZgodnoscRelacji(
        kierunek,
        wyznaczoneDane && wyznaczoneDane.kierunek,
        "Kierunek trasy"
      ),
      punktPoczatkowy: punktPoczatkowy,
      punktDocelowy: punktDocelowy,
      daneZrodlowe: utworzWarstweTrasy(dane.daneZrodlowe),
      daneAutomatyczne: utworzWarstweTrasy(dane.daneAutomatyczne),
      daneRobocze: utworzWarstweTrasy(dane.daneRobocze)
    };
  }

  Object.assign(lokalizacje, {
    WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY:
      WERSJA_KONTRAKTU_LOKALIZACJI_I_TRASY,
    TYPY_LOKALIZACJI: TYPY_LOKALIZACJI,
    RODZAJE_RELACJI: RODZAJE_RELACJI,
    KIERUNKI_TRASY: KIERUNKI_TRASY,
    STATUSY_JAKOSCI: STATUSY_JAKOSCI,
    ZRODLA_DANYCH: ZRODLA_DANYCH,
    normalizujTekstAdresu: normalizujTekstAdresu,
    zlozTekstAdresuZCzesci: zlozTekstAdresuZCzesci,
    utworzAdresRoboczy: utworzAdresRoboczy,
    ocenAdresLokalnie: ocenAdresLokalnie,
    utworzKomunikatJakosciAdresu: utworzKomunikatJakosciAdresu,
    pobierzInformacjeJakosciAdresu: pobierzInformacjeJakosciAdresu,
    utworzModelLokalizacji: utworzModelLokalizacji,
    utworzModelWezla: utworzModelWezla,
    utworzModelTrasy: utworzModelTrasy
  });
})(window);
