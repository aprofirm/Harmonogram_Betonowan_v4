(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let obslugaZmianyLimituOpoznieniaBudowy = function () {};

  function pobierzGlobalnyLimitMinuty() {
    const poleGlobalne = document.getElementById("maksymalne-opoznienie");
    const wartoscPola = poleGlobalne ? Number(poleGlobalne.value) : NaN;

    if (Number.isFinite(wartoscPola) && wartoscPola >= 0) {
      return wartoscPola;
    }

    return Number(
      aplikacja.konfiguracja.parametryDomyslne.maksymalneOpoznienieStartuMinuty
    );
  }

  function pobierzIndywidualnyLimitMinuty(budowa) {
    const wartosc = budowa && budowa.maksymalneOpoznienieStartuBudowyMinuty;

    if (wartosc === null || wartosc === undefined || wartosc === "") {
      return null;
    }

    const liczba = Number(wartosc);
    return Number.isFinite(liczba) && liczba >= 0 ? liczba : null;
  }

  function utworzKomorkeLimituOpoznienia(budowa) {
    const komorka = document.createElement("td");
    const kontrolki = document.createElement("span");
    const pole = document.createElement("input");
    const przyciskPrzywroc = document.createElement("button");
    const znacznikZrodla = document.createElement("small");
    const limitGlobalny = pobierzGlobalnyLimitMinuty();
    const limitIndywidualny = pobierzIndywidualnyLimitMinuty(budowa);
    const czyIndywidualny = limitIndywidualny !== null;
    const czyZrealizowana = budowa.statusRealizacji === "zrealizowana";

    komorka.className = "komorka-czasu-budowy komorka-limitu-opoznienia";
    kontrolki.className = "kontrolki-czasu-rozladunku";

    pole.className = "pole-czasu-budowy pole-limitu-opoznienia";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = czyIndywidualny ? String(limitIndywidualny) : "";
    pole.placeholder = String(limitGlobalny);
    pole.disabled = czyZrealizowana;
    pole.title = czyIndywidualny
      ? "Indywidualny limit tej budowy."
      : "Puste pole korzysta z globalnego limitu " + String(limitGlobalny) + " min.";
    pole.setAttribute(
      "aria-label",
      "Indywidualny limit opóźnienia startu dla budowy " + budowa.idBudowy
    );
    pole.addEventListener("change", function () {
      obslugaZmianyLimituOpoznieniaBudowy(
        budowa.idBudowy,
        pole.value,
        false
      );
    });

    przyciskPrzywroc.className = "przycisk-przywroc-czas-rozladunku";
    przyciskPrzywroc.type = "button";
    przyciskPrzywroc.textContent = "↺";
    przyciskPrzywroc.disabled = czyZrealizowana || !czyIndywidualny;
    przyciskPrzywroc.title =
      "Przywróć globalny limit " + String(limitGlobalny) + " min";
    przyciskPrzywroc.setAttribute(
      "aria-label",
      "Przywróć globalny limit " + String(limitGlobalny) +
        " min dla budowy " + budowa.budowa
    );
    przyciskPrzywroc.addEventListener("click", function () {
      obslugaZmianyLimituOpoznieniaBudowy(budowa.idBudowy, null, true);
    });

    znacznikZrodla.className = "znacznik-zrodla-czasu";
    znacznikZrodla.dataset.zrodlo = czyIndywidualny ? "reczny" : "ustawienia";
    znacznikZrodla.textContent = czyIndywidualny
      ? "Indywidualny"
      : "Globalny " + String(limitGlobalny) + " min";

    kontrolki.appendChild(pole);
    kontrolki.appendChild(przyciskPrzywroc);
    komorka.appendChild(kontrolki);
    komorka.appendChild(znacznikZrodla);
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
        pustaKomorka.colSpan = 13;
      }
      return;
    }

    const budowyWedlugId = new Map();
    budowy.forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    Array.from(kontener.querySelectorAll("tr")).forEach(function (wiersz) {
      if (wiersz.querySelector(".komorka-limitu-opoznienia")) {
        return;
      }

      const komorkaId = wiersz.querySelector(".identyfikator-budowy");
      const budowa = komorkaId
        ? budowyWedlugId.get(String(komorkaId.textContent || "").trim())
        : null;

      if (!budowa) {
        return;
      }

      const komorkaStartu = wiersz.children[0];
      wiersz.insertBefore(
        utworzKomorkeLimituOpoznienia(budowa),
        komorkaStartu ? komorkaStartu.nextSibling : null
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
      throw new Error("Moduł limitu opóźnienia wymaga modułu interfejsu.");
    }

    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;

    aplikacja.interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      obslugaZmianyLimituOpoznieniaBudowy = typeof argumenty[14] === "function"
        ? argumenty[14]
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
