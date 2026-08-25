(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let poleRodzajuRozladunku = null;
  let sekcjaOdbiorowWlasnych = null;
  let licznikOdbiorowWlasnych = null;
  let wierszeOdbiorowWlasnych = null;
  let obslugaZmianyWymaganegoWysieguPompy = function () {};
  let obslugaZmianyCzasowPompyBudowy = function () {};

  function sprawdzZaleznosci() {
    if (!aplikacja.interfejs) {
      throw new Error("Interfejs rodzaju rozładunku wymaga modułu interfejsu.");
    }

    if (!aplikacja.budowy ||
        typeof aplikacja.budowy.czyOdbiorWlasny !== "function" ||
        typeof aplikacja.budowy.opiszRodzajRozladunku !== "function") {
      throw new Error("Interfejs rodzaju rozładunku wymaga modułu rodzaju rozładunku budów.");
    }
  }

  function czyOdbiorWlasny(budowa) {
    return aplikacja.budowy.czyOdbiorWlasny(budowa);
  }

  function opiszRodzajRozladunku(wartosc) {
    return aplikacja.budowy.opiszRodzajRozladunku(wartosc);
  }

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
      elementOpcji.disabled = indeks === 0;
      elementOpcji.selected = indeks === 0;
      pole.appendChild(elementOpcji);
    });
  }

  function zapewnijPoleRodzajuRozladunku() {
    const istniejace = document.getElementById("reczny-rodzaj-rozladunku");

    if (istniejace) {
      poleRodzajuRozladunku = istniejace;
      return istniejace;
    }

    const formularz = document.getElementById("formularz-budowy-recznej");
    const poleIlosci = document.getElementById("reczna-ilosc-betonu");
    const etykietaIlosci = poleIlosci && typeof poleIlosci.closest === "function"
      ? poleIlosci.closest(".pole-formularza")
      : null;

    if (!formularz || !etykietaIlosci || etykietaIlosci.parentElement !== formularz) {
      throw new Error("Nie można dodać pola rodzaju rozładunku do formularza ręcznej budowy.");
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
    poleRodzajuRozladunku = pole;
    return pole;
  }

  function utworzNaglowekTabeliOdbiorow() {
    const thead = document.createElement("thead");
    const wiersz = document.createElement("tr");

    [
      "Start do przeliczenia",
      "Firma",
      "Odbiór / miejsce",
      "Beton",
      "ID",
      "Status"
    ].forEach(
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
    const istniejaceWiersze = document.getElementById("wiersze-odbiorow-wlasnych");

    if (istniejaceWiersze) {
      wierszeOdbiorowWlasnych = istniejaceWiersze;
      sekcjaOdbiorowWlasnych = istniejaceWiersze.closest("details");
      licznikOdbiorowWlasnych = sekcjaOdbiorowWlasnych
        ? sekcjaOdbiorowWlasnych.querySelector(".licznik-odbiorow-wlasnych")
        : null;
      return sekcjaOdbiorowWlasnych;
    }

    const panelHarmonogramu = document.querySelector(".panel-harmonogramu");

    if (!panelHarmonogramu) {
      throw new Error("Nie znaleziono panelu harmonogramu dla tabeli odbiorów własnych.");
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
      "Odbiory własne nie wymagają czasów przejazdu, nie tworzą kursów gruszek i są wydawane wtedy, gdy operator ma wolne okno.";
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

  function opiszBeton(budowa) {
    const rodzaj = String(budowa && budowa.rodzajBetonu || "").trim();
    const ilosc = Number(budowa && budowa.iloscBetonuLiczbaM3);
    const opisIlosci = Number.isFinite(ilosc)
      ? String(ilosc).replace(".", ",") + " m³"
      : "—";

    return rodzaj ? rodzaj + " · " + opisIlosci : opisIlosci;
  }

  function renderujOdbioryWlasne(listaBudow) {
    zapewnijSekcjeOdbiorowWlasnych();

    const odbiory = (Array.isArray(listaBudow) ? listaBudow : []).filter(
      czyOdbiorWlasny
    );
    const fragment = document.createDocumentFragment();

    odbiory.forEach(function (budowa) {
      const wiersz = document.createElement("tr");
      const czyZrealizowany = budowa.statusRealizacji === "zrealizowana" ||
        Number(budowa.iloscBetonuLiczbaM3) === 0;

      if (czyZrealizowany) {
        wiersz.className = "wiersz-zrealizowany";
      }

      wiersz.appendChild(
        aplikacja.interfejs.utworzKomorkeStartuBudowy(budowa)
      );
      wiersz.appendChild(utworzKomorke(String(budowa.firma || "")));
      wiersz.appendChild(utworzKomorke(String(budowa.budowa || "")));
      wiersz.appendChild(utworzKomorke(opiszBeton(budowa)));
      wiersz.appendChild(
        utworzKomorke(String(budowa.idBudowy || ""), "identyfikator-budowy")
      );
      wiersz.appendChild(
        utworzKomorke(
          czyZrealizowany
            ? "Zrealizowany"
            : "Do wydania — poza harmonogramem",
          czyZrealizowany ? "status-zrealizowany" : "status-poza-harmonogramem"
        )
      );
      fragment.appendChild(wiersz);
    });

    wierszeOdbiorowWlasnych.replaceChildren(fragment);
    licznikOdbiorowWlasnych.textContent = String(odbiory.length);
    sekcjaOdbiorowWlasnych.hidden = odbiory.length === 0;

    if (!odbiory.length) {
      sekcjaOdbiorowWlasnych.open = false;
    }
  }

  function utworzPoleCzasuPompy(budowa, opis, wartosc) {
    const etykieta = document.createElement("label");
    const tekst = document.createElement("span");
    const kontrolki = document.createElement("span");
    const pole = document.createElement("input");
    const jednostka = document.createElement("span");

    etykieta.className = "czas-obslugi-pompy";
    tekst.textContent = opis;
    kontrolki.className = "czas-obslugi-pompy__kontrolki";
    pole.type = "number";
    pole.min = "0";
    pole.step = "1";
    pole.value = String(wartosc);
    pole.disabled = budowa.statusRealizacji === "zrealizowana";
    pole.setAttribute(
      "aria-label",
      opis + " dla budowy " + budowa.budowa + " w minutach"
    );
    jednostka.textContent = "min";
    kontrolki.appendChild(pole);
    kontrolki.appendChild(jednostka);
    etykieta.appendChild(tekst);
    etykieta.appendChild(kontrolki);

    return {
      etykieta: etykieta,
      pole: pole
    };
  }

  function utworzKontrolkiCzasowPompyBudowy(budowa, czasyPompy) {
    const czyNadpisane =
      czasyPompy.czyCzasPrzygotowaniaNadpisany ||
      czasyPompy.czyCzasZakonczeniaNadpisany;
    const przelacznik = document.createElement("label");
    const polePrzelacznika = document.createElement("input");
    const tekstPrzelacznika = document.createElement("span");
    const formularz = document.createElement("span");
    const przygotowanie = utworzPoleCzasuPompy(
      budowa,
      "Rozstawienie",
      czasyPompy.czasPrzygotowaniaPompyMinuty
    );
    const zakonczenie = utworzPoleCzasuPompy(
      budowa,
      "Po pracy",
      czasyPompy.czasZakonczeniaObslugiPompyMinuty
    );

    function zapiszCzasy() {
      obslugaZmianyCzasowPompyBudowy(budowa.idBudowy, {
        czasPrzygotowaniaPompyRoboczyMinuty: przygotowanie.pole.value,
        czasZakonczeniaObslugiPompyRoboczyMinuty: zakonczenie.pole.value
      });
    }

    przelacznik.className = "inne-czasy-pompy";
    polePrzelacznika.type = "checkbox";
    polePrzelacznika.checked = czyNadpisane;
    polePrzelacznika.disabled = budowa.statusRealizacji === "zrealizowana";
    polePrzelacznika.setAttribute(
      "aria-label",
      "Inne czasy pompy dla budowy " + budowa.budowa
    );
    polePrzelacznika.setAttribute("aria-expanded", String(czyNadpisane));
    tekstPrzelacznika.textContent = "Inne czasy";
    przelacznik.appendChild(polePrzelacznika);
    przelacznik.appendChild(tekstPrzelacznika);

    formularz.className = "czasy-obslugi-pompy";
    formularz.hidden = !czyNadpisane;
    formularz.appendChild(przygotowanie.etykieta);
    formularz.appendChild(zakonczenie.etykieta);
    przygotowanie.pole.addEventListener("change", zapiszCzasy);
    zakonczenie.pole.addEventListener("change", zapiszCzasy);
    polePrzelacznika.addEventListener("change", function () {
      const czyPokazacPola = polePrzelacznika.checked;
      polePrzelacznika.setAttribute("aria-expanded", String(czyPokazacPola));

      if (czyPokazacPola) {
        formularz.hidden = false;
        przygotowanie.pole.focus();
        return;
      }

      obslugaZmianyCzasowPompyBudowy(budowa.idBudowy, {
        czasPrzygotowaniaPompyRoboczyMinuty: null,
        czasZakonczeniaObslugiPompyRoboczyMinuty: null
      });
    });

    return {
      przelacznik: przelacznik,
      formularz: formularz
    };
  }

  function dodajEtykieteRodzaju(wiersz, budowa) {
    const komorkaBudowy = wiersz && wiersz.children[2];
    const opis = opiszRodzajRozladunku(budowa && budowa.rodzajRozladunku);

    if (!komorkaBudowy || !opis) {
      return;
    }

    if (komorkaBudowy.querySelector(".rodzaj-rozladunku-budowy")) {
      return;
    }

    const etykieta = document.createElement("small");
    etykieta.className = "rodzaj-rozladunku-budowy";

    if (!aplikacja.pompy || !aplikacja.pompy.czyBudowaWymagaPompy(budowa)) {
      etykieta.textContent = opis;
      komorkaBudowy.appendChild(etykieta);
      return;
    }

    const domyslnyWysieg = aplikacja.pompy.DOMYSLNY_WYSIEG_POMPY_METRY;
    const wymaganyWysieg =
      aplikacja.pompy.pobierzWymaganyWysiegPompyBudowy(budowa);
    const czasyPompy = aplikacja.pompy.pobierzCzasyObslugiPompyBudowy(budowa);
    const czyWiekszaPompa = wymaganyWysieg > domyslnyWysieg;
    const opisRodzaju = document.createElement("span");
    const przelacznik = document.createElement("label");
    const polePrzelacznika = document.createElement("input");
    const tekstPrzelacznika = document.createElement("span");
    const etykietaWysiegu = document.createElement("label");
    const opisWysiegu = document.createElement("span");
    const kontrolki = document.createElement("span");
    const poleWysiegu = document.createElement("input");
    const jednostka = document.createElement("span");
    const kontrolkiCzasow = utworzKontrolkiCzasowPompyBudowy(
      budowa,
      czasyPompy
    );

    etykieta.className += " rodzaj-rozladunku-budowy--pompa";
    opisRodzaju.className = "rodzaj-rozladunku-budowy__opis";
    opisRodzaju.textContent =
      opis + " · " + String(wymaganyWysieg).replace(".", ",") + " m" +
      " · czasy " + czasyPompy.czasPrzygotowaniaPompyMinuty + "/" +
      czasyPompy.czasZakonczeniaObslugiPompyMinuty + " min";
    opisRodzaju.title =
      czasyPompy.czasPrzygotowaniaPompyMinuty +
      " min przed pierwszym rozładunkiem i " +
      czasyPompy.czasZakonczeniaObslugiPompyMinuty +
      " min po ostatnim rozładunku";
    przelacznik.className = "wieksza-pompa";
    polePrzelacznika.type = "checkbox";
    polePrzelacznika.checked = czyWiekszaPompa;
    polePrzelacznika.disabled = budowa.statusRealizacji === "zrealizowana";
    polePrzelacznika.setAttribute(
      "aria-label",
      "Większa pompa dla budowy " + budowa.budowa
    );
    polePrzelacznika.setAttribute("aria-expanded", String(czyWiekszaPompa));
    tekstPrzelacznika.textContent = "Większa pompa";
    przelacznik.appendChild(polePrzelacznika);
    przelacznik.appendChild(tekstPrzelacznika);
    etykieta.appendChild(opisRodzaju);
    etykieta.appendChild(przelacznik);
    etykieta.appendChild(kontrolkiCzasow.przelacznik);

    etykietaWysiegu.className = "wymagany-wysieg-pompy";
    etykietaWysiegu.hidden = !czyWiekszaPompa;
    opisWysiegu.textContent = "Wysięg";
    kontrolki.className = "wymagany-wysieg-pompy__kontrolki";
    poleWysiegu.type = "number";
    poleWysiegu.min = String(domyslnyWysieg + 0.1);
    poleWysiegu.step = "0.1";
    poleWysiegu.placeholder = "np. 36";
    poleWysiegu.value = czyWiekszaPompa ? String(wymaganyWysieg) : "";
    poleWysiegu.disabled = budowa.statusRealizacji === "zrealizowana";
    poleWysiegu.setAttribute(
      "aria-label",
      "Wymagany wysięg pompy dla budowy " + budowa.budowa + " w metrach"
    );
    poleWysiegu.addEventListener("change", function () {
      obslugaZmianyWymaganegoWysieguPompy(
        budowa.idBudowy,
        poleWysiegu.value
      );
    });
    jednostka.textContent = "m";
    kontrolki.appendChild(poleWysiegu);
    kontrolki.appendChild(jednostka);
    etykietaWysiegu.appendChild(opisWysiegu);
    etykietaWysiegu.appendChild(kontrolki);
    polePrzelacznika.addEventListener("change", function () {
      const czyPokazacPole = polePrzelacznika.checked;
      polePrzelacznika.setAttribute("aria-expanded", String(czyPokazacPole));

      if (czyPokazacPole) {
        etykietaWysiegu.hidden = false;
        poleWysiegu.focus();
        return;
      }

      obslugaZmianyWymaganegoWysieguPompy(
        budowa.idBudowy,
        domyslnyWysieg
      );
    });
    komorkaBudowy.appendChild(etykieta);
    komorkaBudowy.appendChild(etykietaWysiegu);
    komorkaBudowy.appendChild(kontrolkiCzasow.formularz);
  }

  function pokazBrakDostawPlanowanych(kontener, liczbaOdbiorow) {
    if (kontener.querySelector(".pusty-wiersz")) {
      return;
    }

    const wiersz = document.createElement("tr");
    const komorka = document.createElement("td");
    const tytul = document.createElement("strong");
    const opis = document.createElement("span");

    wiersz.className = "pusty-wiersz";
    komorka.colSpan = 12;
    tytul.textContent = "Brak dostaw planowanych";
    opis.textContent = liczbaOdbiorow > 0
      ? "Odbiory własne znajdziesz w rozwijanej sekcji poniżej."
      : "Wczytaj CSV albo dodaj budowę ręcznie.";
    komorka.appendChild(tytul);
    komorka.appendChild(opis);
    wiersz.appendChild(komorka);
    kontener.appendChild(wiersz);
  }

  function rozdzielWidokBudow(listaBudow) {
    const budowy = Array.isArray(listaBudow) ? listaBudow : [];
    const budowyWedlugId = new Map();

    budowy.forEach(function (budowa) {
      budowyWedlugId.set(String(budowa.idBudowy), budowa);
    });

    renderujOdbioryWlasne(budowy);

    const kontener = document.getElementById("wiersze-harmonogramu");

    if (!kontener) {
      return;
    }

    let liczbaPlanowanych = 0;
    let liczbaOdbiorow = 0;

    budowy.forEach(function (budowa) {
      if (czyOdbiorWlasny(budowa)) {
        liczbaOdbiorow += 1;
      }
    });

    Array.from(kontener.querySelectorAll("tr")).forEach(function (wiersz) {
      const komorkaId = wiersz.querySelector(".identyfikator-budowy");

      if (!komorkaId) {
        return;
      }

      const budowa = budowyWedlugId.get(
        String(komorkaId.textContent || "").trim()
      );

      if (!budowa) {
        return;
      }

      if (czyOdbiorWlasny(budowa)) {
        wiersz.remove();
        return;
      }

      liczbaPlanowanych += 1;
      dodajEtykieteRodzaju(wiersz, budowa);
    });

    if (budowy.length > 0 && liczbaPlanowanych === 0) {
      pokazBrakDostawPlanowanych(kontener, liczbaOdbiorow);
    }

    const licznikBudow = document.getElementById("liczba-budow");
    if (licznikBudow) {
      licznikBudow.textContent = String(liczbaPlanowanych);
    }
  }

  function dopiszInformacjeOOdbiorachDoStatusu(listaBudow) {
    const liczbaOdbiorow = (Array.isArray(listaBudow) ? listaBudow : []).filter(
      czyOdbiorWlasny
    ).length;

    if (!liczbaOdbiorow) {
      return;
    }

    const trescStatusu = document.getElementById("tresc-statusu");
    const dopisek =
      " Odbiory własne przeniesiono do osobnej rozwijanej tabeli i nie wymagają dojazdu ani powrotu.";

    if (trescStatusu && !trescStatusu.textContent.includes("Odbiory własne")) {
      trescStatusu.textContent += dopisek;
    }
  }

  function opakujPokazanieListy(nazwaFunkcji, pobierzListeBudow, czyImport) {
    const funkcjaPodstawowa = aplikacja.interfejs[nazwaFunkcji];

    if (typeof funkcjaPodstawowa !== "function") {
      return;
    }

    aplikacja.interfejs[nazwaFunkcji] = function () {
      const argumenty = Array.from(arguments);
      const wynik = funkcjaPodstawowa.apply(null, argumenty);
      const listaBudow = pobierzListeBudow(argumenty) || [];

      rozdzielWidokBudow(listaBudow);

      if (czyImport) {
        dopiszInformacjeOOdbiorachDoStatusu(listaBudow);
      }

      return wynik;
    };
  }

  function rozszerzInterfejs() {
    zapewnijPoleRodzajuRozladunku();
    zapewnijSekcjeOdbiorowWlasnych();

    const uruchomInterfejsPodstawowy = aplikacja.interfejs.uruchomInterfejs;

    aplikacja.interfejs.uruchomInterfejs = function () {
      const argumenty = Array.from(arguments);
      const obslugaDodaniaBudowy = typeof argumenty[3] === "function"
        ? argumenty[3]
        : function () {};

      obslugaZmianyWymaganegoWysieguPompy = typeof argumenty[11] === "function"
        ? argumenty[11]
        : function () {};
      obslugaZmianyCzasowPompyBudowy = typeof argumenty[12] === "function"
        ? argumenty[12]
        : function () {};

      argumenty[3] = function (daneBudowy) {
        const dane = Object.assign({}, daneBudowy || {}, {
          rodzajRozladunku: poleRodzajuRozladunku
            ? poleRodzajuRozladunku.value
            : ""
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

  sprawdzZaleznosci();
  rozszerzInterfejs();
})(window);
