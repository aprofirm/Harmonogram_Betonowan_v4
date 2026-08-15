(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzPustyStanGruszek() {
    return {
      dostepneGruszki: [],
      przydzieloneKursy: []
    };
  }

  function sprawdzPojemnoscGruszki(pojemnoscGruszkiM3) {
    const pojemnosc = Number(pojemnoscGruszkiM3);

    if (!Number.isFinite(pojemnosc) || pojemnosc <= 0) {
      throw new Error("Pojemność gruszki musi być liczbą większą od 0 m³.");
    }

    return pojemnosc;
  }

  function zaokraglijIloscBetonu(wartosc) {
    return Math.round((wartosc + Number.EPSILON) * 1000) / 1000;
  }

  function pobierzIloscDoZaplanowania(budowa) {
    if (!budowa || budowa.statusRealizacji === "zrealizowana") {
      return 0;
    }

    const iloscBetonuM3 = Number(budowa.iloscBetonuLiczbaM3);

    if (!Number.isFinite(iloscBetonuM3)) {
      return 0;
    }

    if (iloscBetonuM3 < 0) {
      throw new Error(
        "Ilość betonu dla budowy „" + budowa.idBudowy +
          "” nie może być mniejsza od 0 m³."
      );
    }

    if (iloscBetonuM3 === 0) {
      return 0;
    }

    return iloscBetonuM3;
  }

  function utworzIdKursu(idBudowy, numerKursu) {
    return String(idBudowy) + "-KURS-" + String(numerKursu).padStart(3, "0");
  }

  function generujKursyDlaBudowy(budowa, pojemnoscGruszkiM3) {
    const pojemnosc = sprawdzPojemnoscGruszki(pojemnoscGruszkiM3);
    const iloscDoZaplanowaniaM3 = pobierzIloscDoZaplanowania(budowa);

    if (iloscDoZaplanowaniaM3 === 0) {
      return [];
    }

    const liczbaKursow = Math.ceil(iloscDoZaplanowaniaM3 / pojemnosc);
    const kursy = [];
    let iloscJuzRozdzielonaM3 = 0;

    for (let numerKursu = 1; numerKursu <= liczbaKursow; numerKursu += 1) {
      const pozostalaIloscM3 = zaokraglijIloscBetonu(
        iloscDoZaplanowaniaM3 - iloscJuzRozdzielonaM3
      );
      const iloscWKursieM3 = zaokraglijIloscBetonu(
        Math.min(pojemnosc, pozostalaIloscM3)
      );

      kursy.push({
        idKursu: utworzIdKursu(budowa.idBudowy, numerKursu),
        idBudowy: budowa.idBudowy,
        numerKursu: numerKursu,
        liczbaKursowBudowy: liczbaKursow,
        iloscBetonuM3: iloscWKursieM3,
        pojemnoscGruszkiM3: pojemnosc,
        statusKursu: "oczekuje-na-przydzial"
      });

      iloscJuzRozdzielonaM3 = zaokraglijIloscBetonu(
        iloscJuzRozdzielonaM3 + iloscWKursieM3
      );
    }

    return kursy;
  }

  function generujKursy(listaBudow, pojemnoscGruszkiM3) {
    const pojemnosc = sprawdzPojemnoscGruszki(pojemnoscGruszkiM3);
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    return budowy.reduce(function (wszystkieKursy, budowa) {
      return wszystkieKursy.concat(generujKursyDlaBudowy(budowa, pojemnosc));
    }, []);
  }

  function pobierzMinutyGodziny(godzina, nazwaPola, idBudowy) {
    const tekstGodziny = String(godzina || "").trim();
    const dopasowanie = tekstGodziny.match(/^(\d{1,2}):(\d{2})$/);

    if (!dopasowanie) {
      throw new Error(
        "Nie można obliczyć kursów dla budowy „" + idBudowy +
          "”, ponieważ pole „" + nazwaPola + "” nie zawiera poprawnej godziny."
      );
    }

    const godziny = Number(dopasowanie[1]);
    const minuty = Number(dopasowanie[2]);

    if (godziny > 23 || minuty > 59) {
      throw new Error(
        "Nie można obliczyć kursów dla budowy „" + idBudowy +
          "”, ponieważ pole „" + nazwaPola + "” nie zawiera poprawnej godziny."
      );
    }

    return godziny * 60 + minuty;
  }

  function formatujMinutyJakoGodzine(minutyDnia) {
    const minutyPoPolnocy = ((minutyDnia % 1440) + 1440) % 1440;
    const godziny = Math.floor(minutyPoPolnocy / 60);
    const minuty = minutyPoPolnocy % 60;

    return String(godziny).padStart(2, "0") + ":" + String(minuty).padStart(2, "0");
  }

  function pobierzDodatniCzas(wartosc, nazwaPola) {
    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba <= 0) {
      throw new Error("Pole „" + nazwaPola + "” musi zawierać liczbę większą od 0.");
    }

    return liczba;
  }

  function pobierzDodatkowyCzas(wartosc, nazwaPola, idBudowy) {
    const liczba = wartosc === null || wartosc === undefined || wartosc === ""
      ? 0
      : Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” dla budowy „" + idBudowy +
          "” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function pobierzWymaganyCzasPrzejazdu(wartosc, nazwaPola, idBudowy) {
    if (wartosc === null || wartosc === undefined || wartosc === "") {
      throw new Error(
        "Uzupełnij „" + nazwaPola + "” dla budowy „" + idBudowy +
          "” w tabeli danych."
      );
    }

    const liczba = Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      throw new Error(
        "Pole „" + nazwaPola + "” dla budowy „" + idBudowy +
          "” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function obliczCzasyKursu(kurs, budowa, parametry) {
    const czasZaladunkuMinuty = pobierzDodatniCzas(
      parametry.czasZaladunkuMinuty,
      "Czas załadunku"
    );
    const czasRozladunkuDomyslnyMinuty = pobierzDodatniCzas(
      parametry.czasRozladunkuMinuty,
      "Czas rozładunku"
    );
    const czasDojazduMinuty = pobierzWymaganyCzasPrzejazdu(
      budowa.czasDojazduRoboczyMinuty,
      "Czas dojazdu",
      budowa.idBudowy
    );
    const czasPowrotuMinuty = pobierzWymaganyCzasPrzejazdu(
      budowa.czasPowrotuRoboczyMinuty,
      "Czas powrotu",
      budowa.idBudowy
    );
    const dodatkowyCzasZaladunkuMinuty = pobierzDodatkowyCzas(
      budowa.dodatkowyCzasZaladunkuMinuty,
      "Dodatkowy czas załadunku",
      budowa.idBudowy
    );
    const czasRozladunkuMinuty =
      aplikacja.budowy.pobierzEfektywnyCzasRozladunkuMinuty(
        budowa,
        czasRozladunkuDomyslnyMinuty
      );
    const calkowityCzasZaladunkuMinuty =
      czasZaladunkuMinuty + dodatkowyCzasZaladunkuMinuty;
    const calkowityCzasRozladunkuMinuty = czasRozladunkuMinuty;
    const startBudowyMinuty = pobierzMinutyGodziny(
      budowa.startRoboczy,
      "StartRoboczy",
      budowa.idBudowy
    );
    const rozpoczecieRozladunkuMinuty =
      startBudowyMinuty + (kurs.numerKursu - 1) * calkowityCzasRozladunkuMinuty;
    const wyjazdZBetoniarniMinuty = rozpoczecieRozladunkuMinuty - czasDojazduMinuty;
    const rozpoczecieZaladunkuMinuty =
      wyjazdZBetoniarniMinuty - calkowityCzasZaladunkuMinuty;
    const zakonczenieRozladunkuMinuty =
      rozpoczecieRozladunkuMinuty + calkowityCzasRozladunkuMinuty;
    const powrotDoBetoniarniMinuty = zakonczenieRozladunkuMinuty + czasPowrotuMinuty;

    return Object.assign({}, kurs, {
      czasZaladunkuMinuty: czasZaladunkuMinuty,
      dodatkowyCzasZaladunkuMinuty: dodatkowyCzasZaladunkuMinuty,
      calkowityCzasZaladunkuMinuty: calkowityCzasZaladunkuMinuty,
      czasDojazduMinuty: czasDojazduMinuty,
      czasRozladunkuDomyslnyMinuty: czasRozladunkuDomyslnyMinuty,
      czasRozladunkuMinuty: czasRozladunkuMinuty,
      dodatkowyCzasRozladunkuMinuty: 0,
      calkowityCzasRozladunkuMinuty: calkowityCzasRozladunkuMinuty,
      czyNadpisanyCzasRozladunku:
        budowa.czasRozladunkuRoboczyMinuty !== null &&
        budowa.czasRozladunkuRoboczyMinuty !== undefined &&
        budowa.czasRozladunkuRoboczyMinuty !== "",
      czasPowrotuMinuty: czasPowrotuMinuty,
      godzinaRozpoczeciaZaladunku: formatujMinutyJakoGodzine(
        rozpoczecieZaladunkuMinuty
      ),
      godzinaWyjazduZBetoniarni: formatujMinutyJakoGodzine(
        wyjazdZBetoniarniMinuty
      ),
      godzinaPrzyjazduNaBudowe: formatujMinutyJakoGodzine(
        rozpoczecieRozladunkuMinuty
      ),
      godzinaRozpoczeciaRozladunku: formatujMinutyJakoGodzine(
        rozpoczecieRozladunkuMinuty
      ),
      godzinaZakonczeniaRozladunku: formatujMinutyJakoGodzine(
        zakonczenieRozladunkuMinuty
      ),
      godzinaPowrotuDoBetoniarni: formatujMinutyJakoGodzine(
        powrotDoBetoniarniMinuty
      ),
      godzinaGotowosciDoKolejnegoKursu: formatujMinutyJakoGodzine(
        powrotDoBetoniarniMinuty
      )
    });
  }

  function obliczCzasyKursow(kursy, listaBudow, parametry) {
    const budowyWedlugId = new Map();

    (Array.isArray(listaBudow) ? listaBudow : []).forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    return (Array.isArray(kursy) ? kursy : []).map(function (kurs) {
      const budowa = budowyWedlugId.get(String(kurs.idBudowy));

      if (!budowa) {
        throw new Error("Nie znaleziono budowy dla kursu „" + kurs.idKursu + "”.");
      }

      return obliczCzasyKursu(kurs, budowa, parametry || {});
    });
  }

  aplikacja.gruszki = {
    utworzPustyStanGruszek: utworzPustyStanGruszek,
    generujKursyDlaBudowy: generujKursyDlaBudowy,
    generujKursy: generujKursy,
    obliczCzasyKursu: obliczCzasyKursu,
    obliczCzasyKursow: obliczCzasyKursow
  };
})(window);
