(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const interfejs = aplikacja.interfejs = aplikacja.interfejs || {};
  const TYP_POLECENIA_PRZYWROCENIA_AUTOMATU =
    "przywroc-automatyczna-trase-budowy";
  let obslugaZmianyCzasowBudowy = function () {
    return null;
  };

  function czyJestNieujemnaLiczba(wartosc) {
    return wartosc !== null &&
      wartosc !== undefined &&
      wartosc !== "" &&
      Number.isFinite(Number(wartosc)) &&
      Number(wartosc) >= 0;
  }

  function opiszZrodlo(zrodlo) {
    const opisy = {
      reczny: "Ręcznie",
      pamiec: "Z pamięci",
      mapa: "OpenMap",
      csv: "CSV",
      ustawienia: "Z ustawień",
      brak: "Brak"
    };
    const klucz = String(zrodlo || "brak").trim().toLowerCase() || "brak";
    return opisy[klucz] || String(zrodlo || "Nieznane");
  }

  function formatujDystans(metry) {
    if (!czyJestNieujemnaLiczba(metry)) {
      return null;
    }

    const dystansMetry = Number(metry);

    if (dystansMetry < 1000) {
      return Math.round(dystansMetry) + " m";
    }

    return (Math.round(dystansMetry / 100) / 10)
      .toFixed(1)
      .replace(".", ",") + " km";
  }

  function pobierzPoleCzasuDlaKierunku(kierunek) {
    if (kierunek === "do-budowy") {
      return "czasDojazduRoboczyMinuty";
    }

    if (kierunek === "do-wezla") {
      return "czasPowrotuRoboczyMinuty";
    }

    throw new Error("Nie rozpoznano kierunku wyniku trasy przy budowie.");
  }

  function pobierzKierunekDlaPolaCzasu(nazwaPola) {
    if (nazwaPola === "czasDojazduRoboczyMinuty") {
      return "do-budowy";
    }

    if (nazwaPola === "czasPowrotuRoboczyMinuty") {
      return "do-wezla";
    }

    return null;
  }

  function utworzPoleceniePrzywroceniaAutomatu(kierunek) {
    pobierzPoleCzasuDlaKierunku(kierunek);

    return {
      typPolecenia: TYP_POLECENIA_PRZYWROCENIA_AUTOMATU,
      kierunek: kierunek
    };
  }

  function czyPoleceniePrzywroceniaAutomatu(wartosc) {
    return Boolean(
      wartosc &&
      typeof wartosc === "object" &&
      !Array.isArray(wartosc) &&
      wartosc.typPolecenia === TYP_POLECENIA_PRZYWROCENIA_AUTOMATU
    );
  }

  function rozszerzBrameZmianyCzasuOPrzywracanieAutomatu() {
    const lokalizacje = aplikacja.lokalizacje;

    if (!lokalizacje ||
        typeof lokalizacje.zmienCzasRoboczyBudowy !== "function") {
      throw new Error(
        "Przywracanie automatu wymaga bramy zmiany czasu roboczego budowy."
      );
    }

    if (lokalizacje.czyObslugujePoleceniePrzywroceniaAutomatu) {
      return;
    }

    const zmienCzasRoboczyBudowyPodstawowy =
      lokalizacje.zmienCzasRoboczyBudowy;

    lokalizacje.zmienCzasRoboczyBudowy = function (
      budowa,
      nazwaPola,
      wartosc
    ) {
      if (!czyPoleceniePrzywroceniaAutomatu(wartosc)) {
        return zmienCzasRoboczyBudowyPodstawowy.apply(null, arguments);
      }

      const kierunekPola = pobierzKierunekDlaPolaCzasu(nazwaPola);

      if (!kierunekPola || kierunekPola !== wartosc.kierunek) {
        throw new Error(
          "Pole czasu nie odpowiada kierunkowi przywracanej trasy automatycznej."
        );
      }

      if (typeof lokalizacje.przywrocAutomatycznaTraseBudowy !== "function") {
        throw new Error(
          "Nie załadowano mechanizmu przywracania automatycznej trasy budowy."
        );
      }

      const wynik = lokalizacje.przywrocAutomatycznaTraseBudowy(
        budowa,
        wartosc.kierunek
      );

      if (!wynik || !wynik.czyPrzywrocono) {
        throw new Error(
          "Brak automatycznej wartości trasy, którą można przywrócić."
        );
      }

      return budowa;
    };

    lokalizacje.utworzPoleceniePrzywroceniaAutomatu =
      utworzPoleceniePrzywroceniaAutomatu;
    lokalizacje.czyObslugujePoleceniePrzywroceniaAutomatu = true;
  }

  function pobierzStanKierunku(budowa, kierunek) {
    if (
      aplikacja.lokalizacje &&
      typeof aplikacja.lokalizacje.pobierzStanWartosciTrasyBudowy === "function"
    ) {
      const stan = aplikacja.lokalizacje.pobierzStanWartosciTrasyBudowy(budowa);
      return kierunek === "do-wezla" ? stan.doWezla : stan.doBudowy;
    }

    const czyPowrot = kierunek === "do-wezla";
    const czas = czyPowrot
      ? budowa && budowa.czasPowrotuRoboczyMinuty
      : budowa && budowa.czasDojazduRoboczyMinuty;
    const zrodlo = czyPowrot
      ? budowa && budowa.zrodloCzasuPowrotu
      : budowa && budowa.zrodloCzasuDojazdu;

    return {
      kierunek: kierunek,
      czasRoboczyMinuty: czyJestNieujemnaLiczba(czas) ? Number(czas) : null,
      dystansRoboczyMetry: null,
      zrodloRobocze: zrodlo || "brak",
      czyKorektaReczna: String(zrodlo || "") === "reczny",
      czasAutomatycznyMinuty: null,
      dystansAutomatycznyMetry: null,
      zrodloAutomatyczne: "brak",
      czyMaWartoscAutomatyczna: false,
      czyMoznaPrzywrocicAutomatyczna: false
    };
  }

  function pobierzPrezentacjeTrasyBudowy(budowa, kierunek) {
    if (kierunek !== "do-budowy" && kierunek !== "do-wezla") {
      throw new Error("Nie rozpoznano kierunku wyniku trasy przy budowie.");
    }

    const stan = pobierzStanKierunku(budowa, kierunek);
    const czyMaRobocza = czyJestNieujemnaLiczba(stan.czasRoboczyMinuty);
    const czyMaAutomatyczna = Boolean(stan.czyMaWartoscAutomatyczna) &&
      czyJestNieujemnaLiczba(stan.czasAutomatycznyMinuty);
    const czyRozniSieOdAutomatu = czyMaAutomatyczna &&
      Boolean(stan.czyMoznaPrzywrocicAutomatyczna);
    const dystansAutomatyczny = formatujDystans(
      stan.dystansAutomatycznyMetry
    );
    const czesciAutomatu = [];
    let status = "gotowa";
    let tekstStanu = "Trasa gotowa";

    if (!czyMaRobocza) {
      status = "brak-czasu-roboczego";
      tekstStanu = "Wymaga uwagi: brak czasu roboczego";
    } else if (czyRozniSieOdAutomatu) {
      status = "rozni-sie-od-automatu";
      tekstStanu = "Robocza różni się od automatu";
    }

    if (czyMaAutomatyczna) {
      czesciAutomatu.push(String(stan.czasAutomatycznyMinuty) + " min");
      if (dystansAutomatyczny) {
        czesciAutomatu.push(dystansAutomatyczny);
      }
      czesciAutomatu.push(opiszZrodlo(stan.zrodloAutomatyczne));
    }

    return {
      kierunek: kierunek,
      status: status,
      czyWymagaUwagi: status !== "gotowa",
      czasRoboczyMinuty: czyMaRobocza ? Number(stan.czasRoboczyMinuty) : null,
      zrodloRobocze: stan.zrodloRobocze || "brak",
      czasAutomatycznyMinuty:
        czyMaAutomatyczna ? Number(stan.czasAutomatycznyMinuty) : null,
      dystansAutomatycznyMetry:
        czyMaAutomatyczna && czyJestNieujemnaLiczba(stan.dystansAutomatycznyMetry)
          ? Number(stan.dystansAutomatycznyMetry)
          : null,
      zrodloAutomatyczne:
        czyMaAutomatyczna ? (stan.zrodloAutomatyczne || "brak") : "brak",
      czyMoznaPrzywrocicAutomatyczna: czyRozniSieOdAutomatu,
      tekstRoboczy: "Robocza: " +
        (czyMaRobocza ? String(stan.czasRoboczyMinuty) + " min" : "brak") +
        " · " + opiszZrodlo(stan.zrodloRobocze),
      tekstAutomatyczny: czyMaAutomatyczna
        ? "Automat: " + czesciAutomatu.join(" · ")
        : "Automat: brak",
      tekstStanu: tekstStanu
    };
  }

  function przywrocAutomatTrasyBudowy(budowa, kierunek) {
    const idBudowy = String(budowa && budowa.idBudowy || "").trim();

    if (!idBudowy) {
      throw new Error("Nie wskazano budowy do przywrócenia automatu.");
    }

    const nazwaPola = pobierzPoleCzasuDlaKierunku(kierunek);
    const polecenie = aplikacja.lokalizacje
      .utworzPoleceniePrzywroceniaAutomatu(kierunek);

    return obslugaZmianyCzasowBudowy(idBudowy, nazwaPola, polecenie);
  }

  function znajdzPoleKierunku(wiersz, idBudowy, kierunek) {
    const etykieta = kierunek === "do-wezla"
      ? "Czas powrotu dla budowy " + idBudowy
      : "Czas dojazdu dla budowy " + idBudowy;

    return Array.from(wiersz.querySelectorAll("input.pole-czasu-budowy"))
      .find(function (pole) {
        return String(pole.getAttribute("aria-label") || "") === etykieta;
      }) || null;
  }

  function utworzPrzyciskPrzywroceniaAutomatu(budowa, prezentacja) {
    const przycisk = document.createElement("button");
    const opisKierunku = prezentacja.kierunek === "do-wezla"
      ? "powrotu"
      : "dojazdu";

    przycisk.className =
      "przycisk-tekstowy wynik-trasy-budowy__przywroc-automat";
    przycisk.type = "button";
    przycisk.textContent = "Użyj automatu";
    przycisk.title =
      "Zastąp wartość roboczą " + opisKierunku +
      " wynikiem automatycznym. Harmonogram będzie wymagał ponownego przeliczenia.";
    przycisk.setAttribute(
      "aria-label",
      "Użyj automatycznego czasu " + opisKierunku + " dla budowy " +
        String(budowa.budowa || budowa.idBudowy)
    );
    przycisk.addEventListener("click", function () {
      przywrocAutomatTrasyBudowy(budowa, prezentacja.kierunek);
    });
    return przycisk;
  }

  function utworzPodgladKierunku(budowa, prezentacja) {
    const kontener = document.createElement("div");
    const automat = document.createElement("small");

    kontener.className = "wynik-trasy-budowy";
    kontener.dataset.kierunek = prezentacja.kierunek;
    kontener.dataset.status = prezentacja.status;
    kontener.title = prezentacja.tekstRoboczy + ". " +
      prezentacja.tekstAutomatyczny + ". " + prezentacja.tekstStanu + ".";

    automat.className = "wynik-trasy-budowy__automat";
    automat.textContent = prezentacja.tekstAutomatyczny;
    kontener.appendChild(automat);

    if (prezentacja.czyWymagaUwagi) {
      const stan = document.createElement("small");
      stan.className = "wynik-trasy-budowy__stan";
      stan.dataset.status = prezentacja.status;
      stan.textContent = prezentacja.tekstStanu;
      kontener.appendChild(document.createElement("br"));
      kontener.appendChild(stan);
    }

    if (prezentacja.czyMoznaPrzywrocicAutomatyczna) {
      kontener.appendChild(document.createElement("br"));
      kontener.appendChild(
        utworzPrzyciskPrzywroceniaAutomatu(budowa, prezentacja)
      );
    }

    return kontener;
  }

  function uzupelnijKomorkeTrasy(wiersz, budowa, kierunek) {
    const idBudowy = String(budowa && budowa.idBudowy || "").trim();
    const pole = znajdzPoleKierunku(wiersz, idBudowy, kierunek);

    if (!pole) {
      return;
    }

    const komorka = typeof pole.closest === "function"
      ? pole.closest("td")
      : pole.parentNode;

    if (!komorka) {
      return;
    }

    Array.from(
      komorka.querySelectorAll(".wynik-trasy-budowy[data-kierunek=\"" +
        kierunek + "\"]")
    ).forEach(function (istniejacy) {
      istniejacy.remove();
    });

    const prezentacja = pobierzPrezentacjeTrasyBudowy(budowa, kierunek);
    komorka.appendChild(utworzPodgladKierunku(budowa, prezentacja));
  }

  function uzupelnijWierszeBudow(listaBudow) {
    const kontener = document.getElementById("wiersze-harmonogramu");
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    if (!kontener || !budowy.length) {
      return;
    }

    const budowyWedlugId = new Map();
    budowy.forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    Array.from(kontener.querySelectorAll("tr")).forEach(function (wiersz) {
      const komorkaId = wiersz.querySelector(".identyfikator-budowy");
      const idBudowy = komorkaId
        ? String(komorkaId.textContent || "").trim()
        : "";
      const budowa = budowyWedlugId.get(idBudowy);

      if (!budowa) {
        return;
      }

      uzupelnijKomorkeTrasy(wiersz, budowa, "do-budowy");
      uzupelnijKomorkeTrasy(wiersz, budowa, "do-wezla");
    });
  }

  function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow) {
    const funkcjaPodstawowa = interfejs[nazwaFunkcji];

    if (typeof funkcjaPodstawowa !== "function") {
      return;
    }

    interfejs[nazwaFunkcji] = function () {
      const argumenty = Array.from(arguments);
      const wynik = funkcjaPodstawowa.apply(null, argumenty);
      uzupelnijWierszeBudow(pobierzListeBudow(argumenty) || []);
      return wynik;
    };
  }

  function rozszerzInterfejs() {
    if (!interfejs || typeof interfejs.pokazListeBudow !== "function") {
      throw new Error("Widoczny wynik trasy wymaga modułu interfejsu.");
    }

    rozszerzBrameZmianyCzasuOPrzywracanieAutomatu();

    const uruchomInterfejsPodstawowy = interfejs.uruchomInterfejs;
    interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      obslugaZmianyCzasowBudowy = typeof argumenty[4] === "function"
        ? argumenty[4]
        : function () {
          return null;
        };
      return uruchomInterfejsPodstawowy.apply(null, argumenty);
    };

    interfejs.pobierzPrezentacjeTrasyBudowy = pobierzPrezentacjeTrasyBudowy;
    interfejs.przywrocAutomatTrasyBudowy = przywrocAutomatTrasyBudowy;
    interfejs.uzupelnijWynikiTrasPrzyBudowach = uzupelnijWierszeBudow;

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
    opakujPokazanieListy("wyczyscPlan", function () {
      return [];
    });
  }

  rozszerzInterfejs();
})(window);