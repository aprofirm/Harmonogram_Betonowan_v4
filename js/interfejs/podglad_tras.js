(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let ostatnioAktywnyElement = null;

  function normalizujTekstWyszukiwania(wartosc) {
    return String(wartosc || "")
      .trim()
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function porownajNazwyTras(trasaPierwsza, trasaDruga) {
    const nazwaPierwsza = normalizujTekstWyszukiwania(
      trasaPierwsza && trasaPierwsza.opisLokalizacji
    );
    const nazwaDruga = normalizujTekstWyszukiwania(
      trasaDruga && trasaDruga.opisLokalizacji
    );

    return nazwaPierwsza.localeCompare(nazwaDruga, "pl");
  }

  function filtrujISortujTrasy(trasy, fraza, kierunekSortowania) {
    const listaTras = Array.isArray(trasy) ? trasy.slice() : [];
    const szukanaFraza = normalizujTekstWyszukiwania(fraza);
    const kierunek = kierunekSortowania === "nazwa-za" ? "nazwa-za" : "nazwa-az";
    const przefiltrowaneTrasy = szukanaFraza
      ? listaTras.filter(function (trasa) {
          return normalizujTekstWyszukiwania(
            trasa && trasa.opisLokalizacji
          ).includes(szukanaFraza);
        })
      : listaTras;

    return przefiltrowaneTrasy
      .map(function (trasa, indeksPoczatkowy) {
        return {
          trasa: trasa,
          indeksPoczatkowy: indeksPoczatkowy
        };
      })
      .sort(function (elementPierwszy, elementDrugi) {
        const porownanieNazw = porownajNazwyTras(
          elementPierwszy.trasa,
          elementDrugi.trasa
        );
        const porownanie = kierunek === "nazwa-za"
          ? -porownanieNazw
          : porownanieNazw;

        return porownanie ||
          (elementPierwszy.indeksPoczatkowy - elementDrugi.indeksPoczatkowy);
      })
      .map(function (element) {
        return element.trasa;
      });
  }

  function pobierzWymaganyElement(identyfikator) {
    const element = document.getElementById(identyfikator);

    if (!element) {
      throw new Error(
        "Nie znaleziono elementu podglądu pamięci tras: " + identyfikator + "."
      );
    }

    return element;
  }

  function opiszZrodlo(zrodlo) {
    const opisy = {
      reczny: "Ręcznie",
      pamiec: "Z pamięci",
      mapa: "OpenMap"
    };

    return opisy[String(zrodlo || "").toLowerCase()] || "Nieznane";
  }

  function opiszZrodlaTrasy(trasa) {
    const dojazd = opiszZrodlo(trasa.zrodloCzasuDojazdu);
    const powrot = opiszZrodlo(trasa.zrodloCzasuPowrotu);

    return dojazd === powrot
      ? dojazd
      : "Dojazd: " + dojazd + " / Powrót: " + powrot;
  }

  function formatujDate(czasIso) {
    if (!czasIso) {
      return "—";
    }

    const data = new Date(czasIso);
    return Number.isNaN(data.getTime())
      ? String(czasIso)
      : data.toLocaleString("pl-PL");
  }

  function utworzKomorke(tresc) {
    const komorka = document.createElement("td");
    komorka.textContent = tresc;
    return komorka;
  }

  function pokazPustaListe(kontener, tresc) {
    const informacja = document.createElement("p");
    informacja.className = "pusta-historia";
    informacja.textContent = tresc;
    kontener.replaceChildren(informacja);
  }

  function utworzNarzedziaListy(obslugaZmiany) {
    const narzedzia = document.createElement("div");
    const etykietaWyszukiwania = document.createElement("label");
    const opisWyszukiwania = document.createElement("span");
    const poleWyszukiwania = document.createElement("input");
    const przyciskiSortowania = document.createElement("div");
    const przyciskAZ = document.createElement("button");
    const przyciskZA = document.createElement("button");
    const stanWynikow = document.createElement("p");
    let kierunekSortowania = "nazwa-az";

    narzedzia.className = "lista-historii";
    narzedzia.setAttribute("aria-label", "Wyszukiwanie i sortowanie zapisanych tras");

    etykietaWyszukiwania.className = "pole-formularza";
    opisWyszukiwania.textContent = "Szukaj lokalizacji";
    poleWyszukiwania.type = "search";
    poleWyszukiwania.autocomplete = "off";
    poleWyszukiwania.placeholder = "np. Świebodzice, POLST, Jachimowicza";
    poleWyszukiwania.setAttribute("aria-label", "Szukaj w zapisanych trasach");
    etykietaWyszukiwania.appendChild(opisWyszukiwania);
    etykietaWyszukiwania.appendChild(poleWyszukiwania);

    przyciskiSortowania.className = "diagnostyka__przyciski";
    przyciskAZ.className = "przycisk-drugoplanowy";
    przyciskAZ.type = "button";
    przyciskAZ.textContent = "Nazwa A–Z";
    przyciskAZ.setAttribute("aria-pressed", "true");
    przyciskZA.className = "przycisk-drugoplanowy";
    przyciskZA.type = "button";
    przyciskZA.textContent = "Nazwa Z–A";
    przyciskZA.setAttribute("aria-pressed", "false");
    przyciskiSortowania.appendChild(przyciskAZ);
    przyciskiSortowania.appendChild(przyciskZA);

    stanWynikow.className = "pamiec-tras__stan";
    stanWynikow.setAttribute("aria-live", "polite");

    function ustawKierunekSortowania(nowyKierunek) {
      kierunekSortowania = nowyKierunek === "nazwa-za"
        ? "nazwa-za"
        : "nazwa-az";
      przyciskAZ.setAttribute(
        "aria-pressed",
        kierunekSortowania === "nazwa-az" ? "true" : "false"
      );
      przyciskZA.setAttribute(
        "aria-pressed",
        kierunekSortowania === "nazwa-za" ? "true" : "false"
      );
      obslugaZmiany();
    }

    poleWyszukiwania.addEventListener("input", obslugaZmiany);
    przyciskAZ.addEventListener("click", function () {
      ustawKierunekSortowania("nazwa-az");
    });
    przyciskZA.addEventListener("click", function () {
      ustawKierunekSortowania("nazwa-za");
    });

    narzedzia.appendChild(etykietaWyszukiwania);
    narzedzia.appendChild(przyciskiSortowania);
    narzedzia.appendChild(stanWynikow);

    return {
      element: narzedzia,
      poleWyszukiwania: poleWyszukiwania,
      stanWynikow: stanWynikow,
      pobierzFraze: function () {
        return poleWyszukiwania.value;
      },
      pobierzKierunekSortowania: function () {
        return kierunekSortowania;
      }
    };
  }

  function zapiszUsuniecieWDiagnostyce(wynikUsuniecia) {
    if (!aplikacja.diagnostyka ||
        typeof aplikacja.diagnostyka.zapiszZdarzenie !== "function") {
      return;
    }

    aplikacja.diagnostyka.zapiszZdarzenie(
      "informacja",
      "usuniecie-trasy-z-pamieci",
      "Usunięto wpis z lokalnej pamięci tras.",
      { liczbaTras: wynikUsuniecia.liczbaTras }
    );
  }

  function odswiezStanLicznika() {
    if (!aplikacja.pamiecTras || !aplikacja.interfejs) {
      return;
    }

    aplikacja.interfejs.pokazStanPamieciTras(
      aplikacja.pamiecTras.pobierzStanPamieci()
    );
  }

  function utworzPrzyciskUsuniecia(trasa) {
    const przycisk = document.createElement("button");
    przycisk.className = "przycisk-tekstowy";
    przycisk.type = "button";
    przycisk.textContent = "Usuń";
    przycisk.setAttribute(
      "aria-label",
      "Usuń zapamiętaną trasę " + trasa.opisLokalizacji
    );

    przycisk.addEventListener("click", function () {
      const czyPotwierdzono = zakresGlobalny.confirm(
        "Usunąć zapamiętaną trasę „" + trasa.opisLokalizacji + "”?\n\n" +
        "Ta operacja nie usuwa budowy z bieżącego planu. Jeżeli budowa nadal " +
        "ma komplet czasów, kolejne przeliczenie może ponownie zapisać tę trasę."
      );

      if (!czyPotwierdzono) {
        return;
      }

      const wynikUsuniecia = aplikacja.pamiecTras.usunTrase(trasa.kluczTrasy);

      if (wynikUsuniecia.status !== "usunieto-trase") {
        zakresGlobalny.alert(
          wynikUsuniecia.komunikat ||
            "Nie udało się usunąć wybranej trasy z pamięci."
        );
        return;
      }

      zapiszUsuniecieWDiagnostyce(wynikUsuniecia);
      odswiezStanLicznika();
    });

    return przycisk;
  }

  function utworzTabeleTras(trasy) {
    const przewijanie = document.createElement("div");
    const tabela = document.createElement("table");
    const naglowek = document.createElement("thead");
    const wierszNaglowka = document.createElement("tr");
    const cialo = document.createElement("tbody");

    przewijanie.className = "tabela-przewijana";

    [
      "Lokalizacja",
      "Dojazd",
      "Powrót",
      "Źródło",
      "Aktualizacja",
      "Ostatnie użycie",
      "Akcja"
    ].forEach(function (etykieta) {
      const komorka = document.createElement("th");
      komorka.textContent = etykieta;
      wierszNaglowka.appendChild(komorka);
    });

    naglowek.appendChild(wierszNaglowka);
    tabela.appendChild(naglowek);

    trasy.forEach(function (trasa) {
      const wiersz = document.createElement("tr");
      const komorkaAkcji = document.createElement("td");

      wiersz.appendChild(utworzKomorke(trasa.opisLokalizacji));
      wiersz.appendChild(utworzKomorke(trasa.czasDojazduMinuty + " min"));
      wiersz.appendChild(utworzKomorke(trasa.czasPowrotuMinuty + " min"));
      wiersz.appendChild(utworzKomorke(opiszZrodlaTrasy(trasa)));
      wiersz.appendChild(utworzKomorke(formatujDate(trasa.zaktualizowano)));
      wiersz.appendChild(utworzKomorke(formatujDate(trasa.ostatnioUzyto)));
      komorkaAkcji.appendChild(utworzPrzyciskUsuniecia(trasa));
      wiersz.appendChild(komorkaAkcji);
      cialo.appendChild(wiersz);
    });

    tabela.appendChild(cialo);
    przewijanie.appendChild(tabela);
    return przewijanie;
  }

  function uruchomPodgladTras() {
    if (!aplikacja.pamiecTras ||
        typeof aplikacja.pamiecTras.pobierzListeTras !== "function" ||
        typeof aplikacja.pamiecTras.usunTrase !== "function") {
      throw new Error("Podgląd tras wymaga aktualnego modułu pamięci tras.");
    }

    if (!aplikacja.interfejs ||
        typeof aplikacja.interfejs.pokazStanPamieciTras !== "function") {
      throw new Error("Podgląd tras wymaga modułu interfejsu.");
    }

    const przyciskPodgladu = pobierzWymaganyElement("przycisk-podglad-tras");
    const okno = pobierzWymaganyElement("okno-pamieci-tras");
    const przyciskZamknij = pobierzWymaganyElement("przycisk-zamknij-pamiec-tras");
    const lista = pobierzWymaganyElement("lista-zapisanych-tras");
    const pokazStanPamieciTrasPodstawowy = aplikacja.interfejs.pokazStanPamieciTras;
    let narzedziaListy = null;

    function odswiezListe() {
      const wynik = aplikacja.pamiecTras.pobierzListeTras();
      const wszystkieTrasy = Array.isArray(wynik.trasy) ? wynik.trasy : [];
      const widoczneTrasy = filtrujISortujTrasy(
        wszystkieTrasy,
        narzedziaListy ? narzedziaListy.pobierzFraze() : "",
        narzedziaListy ? narzedziaListy.pobierzKierunekSortowania() : "nazwa-az"
      );

      if (narzedziaListy) {
        narzedziaListy.stanWynikow.textContent =
          "Pokazano " + widoczneTrasy.length + " z " + wszystkieTrasy.length + " tras.";
      }

      if (!wszystkieTrasy.length) {
        pokazPustaListe(lista, "Pamięć tras jest pusta.");
        return;
      }

      if (!widoczneTrasy.length) {
        pokazPustaListe(lista, "Brak tras pasujących do wyszukiwania.");
        return;
      }

      lista.replaceChildren(utworzTabeleTras(widoczneTrasy));
    }

    narzedziaListy = utworzNarzedziaListy(odswiezListe);
    lista.parentNode.insertBefore(narzedziaListy.element, lista);

    function otworzOkno() {
      ostatnioAktywnyElement = document.activeElement;
      odswiezListe();
      okno.hidden = false;
      narzedziaListy.poleWyszukiwania.focus();
    }

    function zamknijOkno() {
      okno.hidden = true;

      if (ostatnioAktywnyElement &&
          typeof ostatnioAktywnyElement.focus === "function") {
        ostatnioAktywnyElement.focus();
      }
    }

    aplikacja.interfejs.pokazStanPamieciTras = function (stanPamieci) {
      const wynik = pokazStanPamieciTrasPodstawowy(stanPamieci);
      const liczbaTras = Number(stanPamieci && stanPamieci.liczbaTras);
      przyciskPodgladu.disabled = !Number.isFinite(liczbaTras) || liczbaTras <= 0;

      if (!okno.hidden) {
        odswiezListe();
      }

      return wynik;
    };

    przyciskPodgladu.addEventListener("click", otworzOkno);
    przyciskZamknij.addEventListener("click", zamknijOkno);
    okno.addEventListener("click", function (zdarzenie) {
      if (zdarzenie.target === okno) {
        zamknijOkno();
      }
    });
    document.addEventListener("keydown", function (zdarzenie) {
      if (zdarzenie.key === "Escape" && !okno.hidden) {
        zamknijOkno();
      }
    });

    const stanPoczatkowy = aplikacja.pamiecTras.pobierzStanPamieci();
    przyciskPodgladu.disabled = !stanPoczatkowy.liczbaTras;
  }

  aplikacja.podgladTras = {
    normalizujTekstWyszukiwania: normalizujTekstWyszukiwania,
    filtrujISortujTrasy: filtrujISortujTrasy
  };

  if (typeof document !== "undefined") {
    uruchomPodgladTras();
  }
})(window);
