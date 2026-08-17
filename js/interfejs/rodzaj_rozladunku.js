(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let sekcjaOdbiorowWlasnych = null;
  let licznikOdbiorowWlasnych = null;
  let wierszeOdbiorowWlasnych = null;

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
    const etykietaIlosci = poleIlosci && typeof poleIlosci.closest === "function"
      ? poleIlosci.closest(".pole-formularza")
      : null;

    if (!formularz || !poleIlosci || !etykietaIlosci || etykietaIlosci.parentElement !== formularz) {
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
    formularz.insertBefore(etykieta, etykietaIlosci);
    return pole;
  }

  function utworzNaglowekTabeliOdbiorow() {
    const thead = document.createElement("thead");
    const wiersz = document.createElement("tr");

    ["Start", "Firma", "Odbiór / miejsce", "Beton", "ID", "Status"].forEach(
      function (naglowek) {
        const komorka = document.createElement("th");
        komorka.textContent = naglowek;
        wiersz.appendChild(komorka);
      }
    );

    thead.appendChild(wiersz);
    return thead;
  }

  function zapewnijSekcjeOdbiorowWlasnych() {
    if (sekcjaOdbiorowWlasnych && sekcjaOdbiorowWlasnych.isConnected) {
      return sekcjaOdbiorowWlasnych;
    }

    const panelHarmonogramu = document.querySelector(".panel-harmonogramu");

    if (!panelHarmonogramu) {
      throw new Error("Nie znaleziono panelu harmonogramu dla odbiorów własnych.");
    }

    const sekcja = document.createElement("details");
    const podsumowanie = document.createElement("summary");
    const grupaTytulu = document.createElement("span");
    const etykieta = document.createElement("span");
    const tytul = document.createElement("strong");
    const licznik = document.createElement("span");
    const opis = document.createElement("p");
    const przewijanie = document.createElement("div");
    const tabela = document.createElement("table");
    const tbody = document.createElement("tbody");

    sekcja.className = "panel panel-odbiorow-wlasnych";
    sekcja.hidden = true;
    podsumowanie.className = "panel-odbiorow-wlasnych__summary";
    grupaTytulu.className = "panel-odbiorow-wlasnych__tytul";
    etykieta.className = "etykieta-sekcji";
    etykieta.textContent = "POZA AUTOMATYCZNYM HARMONOGRAMEM";
    tytul.textContent = "Odbiory własne";
    licznik.className = "licznik-odbiorow-wlasnych";
    licznik.textContent = "0";
    opis.className = "opis-panelu panel-odbiorow-wlasnych__opis";
    opis.textContent =
      "Pozycje z pustym polem „Rodzaj rozładunku” w KDX. Nie wymagają dojazdu ani powrotu, nie tworzą kursów i są realizowane wtedy, gdy operator ma wolne okno załadunkowe.";
    przewijanie.className = "tabela-przewijana tabela-przewijana--odbiory";
    tabela.className = "tabela-odbiorow-wlasnych";
    tbody.id = "wiersze-odbiorow-wlasnych";

    grupaTytulu.appendChild(etykieta);
    grupaTytulu.appendChild(tytul);
    podsumowanie.appendChild(grupaTytulu);
    podsumowanie.appendChild(licznik);
    tabela.appendChild(utworzNaglowekTabeliOdbiorow());
    tabela.appendChild(tbody);
    przewijanie.appendChild(tabela);
    sekcja.appendChild(podsumowanie);
    sekcja.appendChild(opis);
    sekcja.appendChild(przewijanie);
    panelHarmonogramu.insertAdjacentElement("afterend", sekcja);

    sekcjaOdbiorowWlasnych = sekcja;
    licznikOdbiorowWlasnych = licznik;
    wierszeOdbiorowWlasnych = tbody;
    return sekcja;
  }

  function utworzKomorke(tresc, nazwaKlasy) {
    const komorka = document.createElement("td");
    komorka.textContent = tresc;

    if (nazwaKlasy) {
      komorka.className = nazwaKlasy;
    }

    return komorka;
  }

  function opiszStart(budowa) {
    if (Number(budowa && budowa.tolerancjaStartuMinuty) > 0 && budowa.najpozniejszyStart) {
      return String(budowa.startPlanowany || "") + "–" + String(budowa.najpozniejszyStart);
    }

    return String(budowa && budowa.startPlanowany || "—");
  }

  function opiszBeton(budowa) {
    const rodzaj = String(budowa && budowa.rodzajBetonu || "").trim();
    const ilosc = Number(budowa && budowa.iloscBetonuLiczbaM3);
    const opisIlosci = Number.isFinite(ilosc) ? String(ilosc).replace(".", ",") + " m³" : "—";

    return rodzaj ? rodzaj + " · " + opisIlosci : opisIlosci;
  }

  function utworzWierszOdbioruWlasnego(budowa) {
    const wiersz = document.createElement("tr");
    const czyZrealizowany = budowa.statusRealizacji === "zrealizowana" ||
      Number(budowa.iloscBetonuLiczbaM3) === 0;

    if (czyZrealizowany) {
      wiersz.className = "wiersz-zrealizowany";
    }

    wiersz.appendChild(utworzKomorke(opiszStart(budowa), "wartosc-wazna"));
    wiersz.appendChild(utworzKomorke(String(budowa.firma || "")));
    wiersz.appendChild(utworzKomorke(String(budowa.budowa || "")));
    wiersz.appendChild(utworzKomorke(opiszBeton(budowa)));
    wiersz.appendChild(utworzKomorke(String(budowa.idBudowy || ""), "identyfikator-budowy"));
    wiersz.appendChild(
      utworzKomorke(
        czyZrealizowany ? "Zrealizowany" : "Do wydania — poza harmonogramem",
        czyZrealizowany ? "status-zrealizowany" : "status-poza-harmonogramem"
      )
    );
    return wiersz;
  }

  function renderujOdbioryWlasne(listaBudow) {
    zapewnijSekcjeOdbiorowWlasnych();
    const odbiory = (Array.isArray(listaBudow) ? listaBudow : []).filter(function (budowa) {
      return aplikacja.budowy.czyOdbiorWlasny(budowa);
    });
    const fragment = document.createDocumentFragment();

    odbiory.forEach(function (budowa) {
      fragment.appendChild(utworzWierszOdbioruWlasnego(budowa));
    });

    wierszeOdbiorowWlasnych.replaceChildren(fragment);
    licznikOdbiorowWlasnych.textContent = String(odbiory.length);
    sekcjaOdbiorowWlasnych.hidden = odbiory.length === 0;

    if (!odbiory.length) {
      sekcjaOdbiorowWlasnych.open = false;
    }
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

  function rozdzielWidokBudow(listaBudow) {
    const kontener = document.getElementById("wiersze-harmonogramu");
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];

    renderujOdbioryWlasne(budowy);

    if (!kontener || !budowy.length) {
      return;
    }

    const wiersze = Array.from(kontener.querySelectorAll("tr"));
    let liczbaDostawPlanowanych = 0;

    budowy.forEach(function (budowa, indeksBudowy) {
      const wiersz = wiersze[indeksBudowy];

      if (!wiersz) {
        return;
      }

      if (aplikacja.budowy.czyOdbiorWlasny(budowa)) {
        wiersz.remove();
        return;
      }

      liczbaDostawPlanowanych += 1;
      dodajEtykieteRodzajuRozladunku(wiersz, budowa);
    });

    const licznikBudow = document.getElementById("liczba-budow");

    if (licznikBudow) {
      licznikBudow.textContent = String(liczbaDostawPlanowanych);
    }
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
      " Odbiory własne przeniesiono do osobnej rozwijanej tabeli i nie wymagają czasów przejazdu.";
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
      rozdzielWidokBudow(listaBudow);

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
    zapewnijSekcjeOdbiorowWlasnych();
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
    opakujPokazanieListy("wyczyscPlan", function () {
      return [];
    }, false);
  }

  rozszerzInterfejs();
})(window);
