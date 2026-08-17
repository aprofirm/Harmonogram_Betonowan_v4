(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const odstepyAktywneWedlugId = new Map();
  let odstepyDoPrzywroceniaWedlugId = new Map();
  let obslugaZmianyCzasowBudowy = function () {};

  function pobierzIdBudowy(budowa) {
    return String(budowa && budowa.idBudowy || "");
  }

  function pobierzNieujemnyOdstep(wartosc, idBudowy) {
    const liczba = wartosc === null || wartosc === undefined || wartosc === ""
      ? 0
      : Number(wartosc);

    if (!Number.isFinite(liczba) || liczba < 0) {
      throw new Error(
        "Pole „Dodatkowy odstęp dostaw” dla budowy „" + idBudowy +
          "” musi zawierać liczbę nie mniejszą niż 0."
      );
    }

    return liczba;
  }

  function pobierzMinutyGodziny(godzina, nazwaPola, idBudowy) {
    const tekst = String(godzina || "").trim();
    const dopasowanie = tekst.match(/^(\d{1,2}):(\d{2})$/);

    if (!dopasowanie) {
      throw new Error(
        "Nie można obliczyć rytmu dla budowy „" + idBudowy +
          "”, ponieważ pole „" + nazwaPola + "” nie zawiera poprawnej godziny."
      );
    }

    const godziny = Number(dopasowanie[1]);
    const minuty = Number(dopasowanie[2]);

    if (godziny > 23 || minuty > 59) {
      throw new Error(
        "Nie można obliczyć rytmu dla budowy „" + idBudowy +
          "”, ponieważ pole „" + nazwaPola + "” nie zawiera poprawnej godziny."
      );
    }

    return godziny * 60 + minuty;
  }

  function dodajMinutyDoGodziny(godzina, liczbaMinut) {
    const minutyDnia = pobierzMinutyGodziny(godzina, "godzina kursu", "kurs") +
      liczbaMinut;
    const minutyPoPolnocy = ((minutyDnia % 1440) + 1440) % 1440;
    const godziny = Math.floor(minutyPoPolnocy / 60);
    const minuty = minutyPoPolnocy % 60;

    return String(godziny).padStart(2, "0") + ":" + String(minuty).padStart(2, "0");
  }

  function zapamietajOdstepBudowy(budowa) {
    const idBudowy = pobierzIdBudowy(budowa);

    if (!idBudowy) {
      return;
    }

    const czyMaWlasnyOdstep = Object.prototype.hasOwnProperty.call(
      budowa,
      "dodatkowyOdstepDostawMinuty"
    );

    if (!czyMaWlasnyOdstep && odstepyDoPrzywroceniaWedlugId.has(idBudowy)) {
      budowa.dodatkowyOdstepDostawMinuty =
        odstepyDoPrzywroceniaWedlugId.get(idBudowy);
    }

    const odstep = pobierzNieujemnyOdstep(
      budowa.dodatkowyOdstepDostawMinuty,
      idBudowy
    );
    budowa.dodatkowyOdstepDostawMinuty = odstep;
    odstepyAktywneWedlugId.set(idBudowy, odstep);
  }

  function zapamietajOdstepyZListy(listaBudow) {
    (Array.isArray(listaBudow) ? listaBudow : []).forEach(zapamietajOdstepBudowy);
  }

  function przechwycOdstepyDoPrzywrocenia(danePlanu) {
    const mapa = new Map();
    const listy = [
      danePlanu && danePlanu.budowyZImportu,
      danePlanu && danePlanu.budowyReczne,
      danePlanu && danePlanu.budowy
    ];

    listy.forEach(function (listaBudow) {
      (Array.isArray(listaBudow) ? listaBudow : []).forEach(function (budowa) {
        const idBudowy = pobierzIdBudowy(budowa);

        if (!idBudowy) {
          return;
        }

        mapa.set(
          idBudowy,
          pobierzNieujemnyOdstep(budowa.dodatkowyOdstepDostawMinuty, idBudowy)
        );
      });
    });

    odstepyDoPrzywroceniaWedlugId = mapa;
  }

  function uzupelnijOdstepyWPlanie(danePlanu) {
    if (!danePlanu || typeof danePlanu !== "object") {
      return danePlanu;
    }

    [danePlanu.budowyZImportu, danePlanu.budowyReczne, danePlanu.budowy]
      .forEach(function (listaBudow) {
        (Array.isArray(listaBudow) ? listaBudow : []).forEach(function (budowa) {
          const idBudowy = pobierzIdBudowy(budowa);
          const odstep = odstepyAktywneWedlugId.has(idBudowy)
            ? odstepyAktywneWedlugId.get(idBudowy)
            : pobierzNieujemnyOdstep(budowa.dodatkowyOdstepDostawMinuty, idBudowy);

          budowa.dodatkowyOdstepDostawMinuty = odstep;
        });
      });

    return danePlanu;
  }

  function przesunGodzinyKursu(kurs, przesuniecieMinuty) {
    const polaGodzin = [
      "godzinaRozpoczeciaZaladunku",
      "godzinaWyjazduZBetoniarni",
      "godzinaPrzyjazduNaBudowe",
      "godzinaRozpoczeciaRozladunku",
      "godzinaZakonczeniaRozladunku",
      "godzinaPowrotuDoBetoniarni",
      "godzinaGotowosciDoKolejnegoKursu"
    ];
    const wynik = Object.assign({}, kurs);

    polaGodzin.forEach(function (nazwaPola) {
      wynik[nazwaPola] = dodajMinutyDoGodziny(kurs[nazwaPola], przesuniecieMinuty);
    });

    return wynik;
  }

  function rozszerzObliczeniaRytmu() {
    if (!aplikacja.gruszki || typeof aplikacja.gruszki.obliczCzasyKursu !== "function") {
      return;
    }

    const obliczCzasyKursuPodstawowe = aplikacja.gruszki.obliczCzasyKursu;

    aplikacja.gruszki.obliczCzasyKursu = function (kurs, budowa, parametry) {
      const wynikPodstawowy = obliczCzasyKursuPodstawowe(kurs, budowa, parametry);
      const idBudowy = pobierzIdBudowy(budowa);
      const dodatkowyOdstepDostawMinuty = pobierzNieujemnyOdstep(
        budowa.dodatkowyOdstepDostawMinuty,
        idBudowy
      );
      const rytmDostawMinuty =
        Number(wynikPodstawowy.czasRozladunkuMinuty) + dodatkowyOdstepDostawMinuty;
      const przesuniecieMinuty =
        (Number(kurs.numerKursu) - 1) * dodatkowyOdstepDostawMinuty;
      const wynik = przesunGodzinyKursu(wynikPodstawowy, przesuniecieMinuty);
      const startBudowyMinuty = pobierzMinutyGodziny(
        budowa.startRoboczy,
        "StartRoboczy",
        idBudowy
      );

      wynik.dodatkowyOdstepDostawMinuty = dodatkowyOdstepDostawMinuty;
      wynik.rytmDostawMinuty = rytmDostawMinuty;
      wynik.minutaRozpoczeciaZaladunku =
        startBudowyMinuty +
        (Number(kurs.numerKursu) - 1) * rytmDostawMinuty -
        Number(wynik.czasDojazduMinuty) -
        Number(wynik.calkowityCzasZaladunkuMinuty);
      return wynik;
    };

    aplikacja.gruszki.obliczCzasyKursow = function (kursy, listaBudow, parametry) {
      const budowyWedlugId = new Map();

      (Array.isArray(listaBudow) ? listaBudow : []).forEach(function (budowa) {
        budowyWedlugId.set(pobierzIdBudowy(budowa), budowa);
      });

      return (Array.isArray(kursy) ? kursy : [])
        .map(function (kurs, indeksPierwotny) {
          const budowa = budowyWedlugId.get(String(kurs.idBudowy));

          if (!budowa) {
            throw new Error("Nie znaleziono budowy dla kursu „" + kurs.idKursu + "”.");
          }

          return {
            indeksPierwotny: indeksPierwotny,
            kurs: aplikacja.gruszki.obliczCzasyKursu(kurs, budowa, parametry || {})
          };
        })
        .sort(function (lewy, prawy) {
          const roznicaCzasu =
            lewy.kurs.minutaRozpoczeciaZaladunku - prawy.kurs.minutaRozpoczeciaZaladunku;
          return roznicaCzasu || lewy.indeksPierwotny - prawy.indeksPierwotny;
        })
        .map(function (pozycja) {
          return pozycja.kurs;
        });
    };
  }

  function rozszerzModelBudow() {
    if (!aplikacja.budowy || typeof aplikacja.budowy.utworzListeRobocza !== "function") {
      return;
    }

    const utworzListeRoboczaPodstawowa = aplikacja.budowy.utworzListeRobocza;

    aplikacja.budowy.utworzListeRobocza = function (budowyZImportu, budowyReczne) {
      zapamietajOdstepyZListy(budowyZImportu);
      zapamietajOdstepyZListy(budowyReczne);
      return utworzListeRoboczaPodstawowa(budowyZImportu, budowyReczne);
    };
  }

  function rozszerzPamiecPlanu() {
    if (!aplikacja.pamiecPlanu) {
      return;
    }

    ["zapiszPlan", "zapiszPlanHistoryczny"].forEach(function (nazwaFunkcji) {
      const funkcjaPodstawowa = aplikacja.pamiecPlanu[nazwaFunkcji];

      if (typeof funkcjaPodstawowa !== "function") {
        return;
      }

      aplikacja.pamiecPlanu[nazwaFunkcji] = function (danePlanu) {
        return funkcjaPodstawowa(uzupelnijOdstepyWPlanie(danePlanu));
      };
    });

    ["odczytajPlan", "odczytajPlanHistoryczny"].forEach(function (nazwaFunkcji) {
      const funkcjaPodstawowa = aplikacja.pamiecPlanu[nazwaFunkcji];

      if (typeof funkcjaPodstawowa !== "function") {
        return;
      }

      aplikacja.pamiecPlanu[nazwaFunkcji] = function () {
        const wynik = funkcjaPodstawowa.apply(null, arguments);

        if (wynik && wynik.danePlanu) {
          przechwycOdstepyDoPrzywrocenia(wynik.danePlanu);
        }

        return wynik;
      };
    });
  }

  function utworzKomorkeOdstepuDostaw(budowa) {
    const komorka = document.createElement("td");
    const pole = document.createElement("input");
    const idBudowy = pobierzIdBudowy(budowa);
    const odstep = pobierzNieujemnyOdstep(
      budowa.dodatkowyOdstepDostawMinuty,
      idBudowy
    );

    komorka.className = "komorka-czasu-budowy komorka-odstepu-dostaw";
    pole.className = "pole-czasu-budowy pole-odstepu-dostaw";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = String(odstep);
    pole.disabled = budowa.statusRealizacji === "zrealizowana";
    pole.title = "Przerwa od końca rozładunku poprzedniego kursu do początku następnego.";
    pole.setAttribute(
      "aria-label",
      "Dodatkowy odstęp dostaw dla budowy " + idBudowy
    );
    pole.addEventListener("change", function () {
      let nowyOdstep;

      try {
        nowyOdstep = pobierzNieujemnyOdstep(pole.value, idBudowy);
      } catch (bladWalidacji) {
        obslugaZmianyCzasowBudowy(
          idBudowy,
          "dodatkowyOdstepDostawMinuty",
          pole.value
        );
        return;
      }

      // Handler aplikacji zapisuje plan jeszcze przed ponownym narysowaniem tabeli,
      // dlatego nowa wartość musi być dostępna dla warstwy pamięci już teraz.
      odstepyAktywneWedlugId.set(idBudowy, nowyOdstep);
      const zaktualizowanaBudowa = obslugaZmianyCzasowBudowy(
        idBudowy,
        "dodatkowyOdstepDostawMinuty",
        pole.value
      );

      if (zaktualizowanaBudowa) {
        zapamietajOdstepBudowy(zaktualizowanaBudowa);
      } else {
        zapamietajOdstepBudowy(budowa);
      }
    });

    komorka.appendChild(pole);
    return komorka;
  }

  function dodajNaglowekOdstepuDostaw() {
    const wierszNaglowka = document.querySelector(
      ".panel-harmonogramu table thead tr"
    );

    if (!wierszNaglowka || wierszNaglowka.querySelector(".naglowek-odstepu-dostaw")) {
      return;
    }

    const naglowek = document.createElement("th");
    const komorkaRozladunku = wierszNaglowka.children[6];
    naglowek.className = "naglowek-odstepu-dostaw";
    naglowek.textContent = "Odstęp dostaw";
    naglowek.title = "Dodatkowa przerwa po rozładunku przed następną dostawą tej budowy.";
    wierszNaglowka.insertBefore(naglowek, komorkaRozladunku.nextSibling);
  }

  function dodajKolumneOdstepuDostaw(listaBudow) {
    dodajNaglowekOdstepuDostaw();

    const kontener = document.getElementById("wiersze-harmonogramu");
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    if (!kontener) {
      return;
    }

    if (!budowy.length) {
      const pustaKomorka = kontener.querySelector(".pusty-wiersz td");

      if (pustaKomorka) {
        pustaKomorka.colSpan = 12;
      }
      return;
    }

    const wiersze = Array.from(kontener.querySelectorAll("tr"));

    budowy.forEach(function (budowa, indeksBudowy) {
      const wiersz = wiersze[indeksBudowy];

      if (!wiersz || wiersz.querySelector(".komorka-odstepu-dostaw")) {
        return;
      }

      zapamietajOdstepBudowy(budowa);
      const komorkaRozladunku = wiersz.children[6];
      wiersz.insertBefore(
        utworzKomorkeOdstepuDostaw(budowa),
        komorkaRozladunku ? komorkaRozladunku.nextSibling : null
      );
    });
  }

  function rozszerzInterfejs() {
    if (!aplikacja.interfejs) {
      return;
    }

    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;

    if (typeof uruchomInterfejsPodstawowy === "function") {
      aplikacja.interfejs.uruchomInterfejs = function () {
        const argumenty = Array.from(arguments);
        obslugaZmianyCzasowBudowy = typeof argumenty[4] === "function"
          ? argumenty[4]
          : function () {};
        const wynik = uruchomInterfejsPodstawowy.apply(null, argumenty);
        dodajNaglowekOdstepuDostaw();
        return wynik;
      };
    }

    function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow) {
      const funkcjaPodstawowa = aplikacja.interfejs[nazwaFunkcji];

      if (typeof funkcjaPodstawowa !== "function") {
        return;
      }

      aplikacja.interfejs[nazwaFunkcji] = function () {
        const argumenty = Array.from(arguments);
        const wynik = funkcjaPodstawowa.apply(null, argumenty);
        dodajKolumneOdstepuDostaw(pobierzListeBudow(argumenty) || []);
        return wynik;
      };
    }

    opakujPokazanieListy("pokazListeBudow", function (argumenty) {
      return argumenty[0];
    });
    opakujPokazanieListy("pokazWynik", function (argumenty) {
      return argumenty[0] && argumenty[0].budowy;
    });
    opakujPokazanieListy("pokazPrzywroconyPlan", function (argumenty) {
      return argumenty[1];
    });
    opakujPokazanieListy("pokazUdanyImport", function (argumenty) {
      return argumenty[1];
    });
    opakujPokazanieListy("pokazDodanaBudowe", function (argumenty) {
      return argumenty[1];
    });

    const wyczyscPlanPodstawowy = aplikacja.interfejs.wyczyscPlan;

    if (typeof wyczyscPlanPodstawowy === "function") {
      aplikacja.interfejs.wyczyscPlan = function () {
        odstepyAktywneWedlugId.clear();
        odstepyDoPrzywroceniaWedlugId.clear();
        const wynik = wyczyscPlanPodstawowy.apply(null, arguments);
        dodajKolumneOdstepuDostaw([]);
        return wynik;
      };
    }
  }

  rozszerzModelBudow();
  rozszerzObliczeniaRytmu();
  rozszerzPamiecPlanu();
  rozszerzInterfejs();
})(window);
