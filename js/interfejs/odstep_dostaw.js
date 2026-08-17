(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let obslugaZmianyCzasowBudowy = function () {};

  function pobierzOdstepDostaw(budowa) {
    const wartosc = budowa && budowa.dodatkowyOdstepDostawMinuty;
    const liczba = wartosc === null || wartosc === undefined || wartosc === ""
      ? 0
      : Number(wartosc);

    return Number.isFinite(liczba) && liczba >= 0 ? liczba : 0;
  }

  function utworzKomorkeOdstepuDostaw(budowa) {
    const komorka = document.createElement("td");
    const pole = document.createElement("input");

    komorka.className = "komorka-czasu-budowy komorka-odstepu-dostaw";
    pole.className = "pole-czasu-budowy pole-odstepu-dostaw";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = String(pobierzOdstepDostaw(budowa));
    pole.disabled = budowa.statusRealizacji === "zrealizowana";
    pole.title =
      "Dodatkowa przerwa od końca rozładunku do początku następnej dostawy tej budowy.";
    pole.setAttribute(
      "aria-label",
      "Dodatkowy odstęp dostaw dla budowy " + budowa.idBudowy
    );
    pole.addEventListener("change", function () {
      obslugaZmianyCzasowBudowy(
        budowa.idBudowy,
        "dodatkowyOdstepDostawMinuty",
        pole.value
      );
    });

    komorka.appendChild(pole);
    return komorka;
  }

  function uzupelnijWierszeBudow(listaBudow) {
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

    const budowyWedlugId = new Map();
    budowy.forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    Array.from(kontener.querySelectorAll("tr")).forEach(function (wiersz) {
      if (wiersz.querySelector(".komorka-odstepu-dostaw")) {
        return;
      }

      const komorkaId = wiersz.querySelector(".identyfikator-budowy");
      const budowa = komorkaId
        ? budowyWedlugId.get(String(komorkaId.textContent || "").trim())
        : null;

      if (!budowa) {
        return;
      }

      const komorkaRozladunku = wiersz.children[6];
      wiersz.insertBefore(
        utworzKomorkeOdstepuDostaw(budowa),
        komorkaRozladunku ? komorkaRozladunku.nextSibling : null
      );
    });
  }

  function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow) {
    const funkcjaPodstawowa = aplikacja.interfejs[nazwaFunkcji];

    if (typeof funkcjaPodstawowa !== "function") {
      return;
    }

    aplikacja.interfejs[nazwaFunkcji] = function () {
      const argumenty = Array.from(arguments);
      const wynik = funkcjaPodstawowa.apply(null, argumenty);
      uzupelnijWierszeBudow(pobierzListeBudow(argumenty) || []);
      return wynik;
    };
  }

  function rozszerzInterfejs() {
    if (!aplikacja.interfejs) {
      throw new Error("Moduł odstępu dostaw wymaga modułu interfejsu.");
    }

    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;

    aplikacja.interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      obslugaZmianyCzasowBudowy = typeof argumenty[4] === "function"
        ? argumenty[4]
        : function () {};
      return uruchomInterfejsPodstawowy.apply(null, argumenty);
    };

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
