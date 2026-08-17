(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  function utworzOpcjeRodzajuRozladunku(pole) {
    [
      { wartosc: "", opis: "Wybierz rodzaj" },
      { wartosc: "odbior-wlasny", opis: "Odbiór własny" },
      { wartosc: "lej", opis: "Lej" },
      { wartosc: "pompa", opis: "Pompa" },
      { wartosc: "wywrotka", opis: "Wywrotka" },
      { wartosc: "taczka", opis: "Taczka" }
    ].forEach(function (opcja, indeks) {
      const elementOpcji = document.createElement("option");
      elementOpcji.value = opcja.wartosc;
      elementOpcji.textContent = opcja.opis;

      if (indeks === 0) {
        elementOpcji.disabled = true;
        elementOpcji.selected = true;
      }

      pole.appendChild(elementOpcji);
    });
  }

  function zapewnijPoleRodzajuRozladunku() {
    const istniejacePole = document.getElementById("reczny-rodzaj-rozladunku");

    if (istniejacePole) {
      return istniejacePole;
    }

    const formularz = document.getElementById("formularz-budowy-recznej");
    const poleIlosci = document.getElementById("reczna-ilosc-betonu");

    if (!formularz || !poleIlosci || !poleIlosci.parentElement) {
      throw new Error("Nie znaleziono formularza ręcznej budowy dla rodzaju rozładunku.");
    }

    const etykieta = document.createElement("label");
    const opis = document.createElement("span");
    const pole = document.createElement("select");

    etykieta.className = "pole-formularza";
    etykieta.setAttribute("for", "reczny-rodzaj-rozladunku");
    opis.textContent = "Rodzaj rozładunku";
    pole.id = "reczny-rodzaj-rozladunku";
    pole.name = "rodzajRozladunku";
    pole.required = true;
    pole.setAttribute("aria-label", "Rodzaj rozładunku ręcznej budowy");
    utworzOpcjeRodzajuRozladunku(pole);
    etykieta.appendChild(opis);
    etykieta.appendChild(pole);
    formularz.insertBefore(etykieta, poleIlosci.parentElement);
    return pole;
  }

  function dodajEtykieteRodzajuRozladunku(wiersz, budowa) {
    const komorkaBudowy = wiersz && wiersz.children[2];
    const opisRodzaju = aplikacja.budowy.opiszRodzajRozladunku(
      budowa && budowa.rodzajRozladunku
    );

    if (!komorkaBudowy || !opisRodzaju ||
        komorkaBudowy.querySelector(".rodzaj-rozladunku-budowy")) {
      return;
    }

    const etykieta = document.createElement("small");
    etykieta.className = "rodzaj-rozladunku-budowy";
    etykieta.textContent = opisRodzaju;
    komorkaBudowy.appendChild(etykieta);
  }

  function oznaczOdbiorWlasny(wiersz, budowa) {
    if (!wiersz || !aplikacja.budowy.czyOdbiorWlasny(budowa) ||
        budowa.statusRealizacji === "zrealizowana") {
      return;
    }

    wiersz.classList.add("wiersz-odbior-wlasny");

    [3, 4, 5, 6, 7].forEach(function (indeksKomorki) {
      const komorka = wiersz.children[indeksKomorki];

      if (!komorka) {
        return;
      }

      const wartosc = document.createElement("span");
      wartosc.className = "wartosc-poza-harmonogramem";
      wartosc.textContent = "—";
      komorka.replaceChildren(wartosc);
    });

    const komorkaStatusu = wiersz.lastElementChild;

    if (komorkaStatusu) {
      komorkaStatusu.className = "status-poza-harmonogramem";
      komorkaStatusu.textContent = "Odbiór własny — poza harmonogramem";
    }
  }

  function uzupelnijWierszeBudow(listaBudow) {
    const kontener = document.getElementById("wiersze-harmonogramu");
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    if (!kontener || !budowy.length) {
      return;
    }

    const wiersze = Array.from(kontener.querySelectorAll("tr"));

    budowy.forEach(function (budowa, indeksBudowy) {
      const wiersz = wiersze[indeksBudowy];

      if (!wiersz) {
        return;
      }

      dodajEtykieteRodzajuRozladunku(wiersz, budowa);
      oznaczOdbiorWlasny(wiersz, budowa);
    });
  }

  function poprawKomunikatImportu(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const liczbaOdbiorowWlasnych = budowy.filter(function (budowa) {
      return aplikacja.budowy.czyOdbiorWlasny(budowa) &&
        budowa.statusRealizacji !== "zrealizowana";
    }).length;

    if (!liczbaOdbiorowWlasnych) {
      return;
    }

    const trescStatusu = document.getElementById("tresc-statusu");

    if (!trescStatusu) {
      return;
    }

    trescStatusu.textContent = trescStatusu.textContent
      .replace("dla aktywnych budów", "dla dostaw planowanych") +
      " Odbiory własne są widoczne na liście, ale nie tworzą kursów i nie wymagają czasów przejazdu.";
  }

  function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow, czyPoprawicImport) {
    const funkcjaPodstawowa = aplikacja.interfejs[nazwaFunkcji];

    if (typeof funkcjaPodstawowa !== "function") {
      return;
    }

    aplikacja.interfejs[nazwaFunkcji] = function () {
      const argumenty = Array.from(arguments);
      const wynik = funkcjaPodstawowa.apply(null, argumenty);
      const listaBudow = pobierzListeBudow(argumenty) || [];
      uzupelnijWierszeBudow(listaBudow);

      if (czyPoprawicImport) {
        poprawKomunikatImportu(listaBudow);
      }

      return wynik;
    };
  }

  function rozszerzInterfejs() {
    if (!aplikacja.interfejs || !aplikacja.budowy ||
        typeof aplikacja.budowy.czyOdbiorWlasny !== "function") {
      throw new Error("Interfejs rodzaju rozładunku wymaga modułu budów i interfejsu.");
    }

    const poleRodzaju = zapewnijPoleRodzajuRozladunku();
    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;

    aplikacja.interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      const obslugaDodaniaBudowy = argumenty[3];

      argumenty[3] = function (daneBudowy) {
        const dane = Object.assign({}, daneBudowy || {}, {
          rodzajRozladunku: poleRodzaju.value
        });
        return obslugaDodaniaBudowy(dane);
      };

      return uruchomInterfejsPodstawowy.apply(null, argumenty);
    };

    opakujPokazanieListy("pokazListeBudow", function (argumenty) {
      return argumenty[0];
    }, false);
    opakujPokazanieListy("pokazWynik", function (argumenty) {
      return argumenty[0] && argumenty[0].budowy;
    }, false);
    opakujPokazanieListy("pokazPrzywroconyPlan", function (argumenty) {
      return argumenty[1];
    }, false);
    opakujPokazanieListy("pokazUdanyImport", function (argumenty) {
      return argumenty[1];
    }, true);
    opakujPokazanieListy("pokazDodanaBudowe", function (argumenty) {
      return argumenty[1];
    }, false);
  }

  rozszerzInterfejs();
})(window);
