(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const interfejs = aplikacja.interfejs = aplikacja.interfejs || {};

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

  function znajdzPoleKierunku(wiersz, idBudowy, kierunek) {
    const etykieta = kierunek === "do-wezla"
      ? "Czas powrotu dla budowy " + idBudowy
      : "Czas dojazdu dla budowy " + idBudowy;

    return Array.from(wiersz.querySelectorAll("input.pole-czasu-budowy"))
      .find(function (pole) {
        return String(pole.getAttribute("aria-label") || "") === etykieta;
      }) || null;
  }

  function utworzPodgladKierunku(prezentacja) {
    const kontener = document.createElement("div");
    const robocza = document.createElement("small");
    const automat = document.createElement("small");
    const stan = document.createElement("small");

    kontener.className = "wynik-trasy-budowy";
    kontener.dataset.kierunek = prezentacja.kierunek;
    kontener.dataset.status = prezentacja.status;
    kontener.title = prezentacja.tekstRoboczy + ". " +
      prezentacja.tekstAutomatyczny + ". " + prezentacja.tekstStanu + ".";

    robocza.className = "wynik-trasy-budowy__robocza";
    robocza.textContent = prezentacja.tekstRoboczy;
    automat.className = "wynik-trasy-budowy__automat";
    automat.textContent = prezentacja.tekstAutomatyczny;
    stan.className = "wynik-trasy-budowy__stan";
    stan.dataset.status = prezentacja.status;
    stan.textContent = prezentacja.tekstStanu;

    kontener.appendChild(robocza);
    kontener.appendChild(document.createElement("br"));
    kontener.appendChild(automat);
    kontener.appendChild(document.createElement("br"));
    kontener.appendChild(stan);
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

    komorka.appendChild(
      utworzPodgladKierunku(
        pobierzPrezentacjeTrasyBudowy(budowa, kierunek)
      )
    );
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

    interfejs.pobierzPrezentacjeTrasyBudowy = pobierzPrezentacjeTrasyBudowy;
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
