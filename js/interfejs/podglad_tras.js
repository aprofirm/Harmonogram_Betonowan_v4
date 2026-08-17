(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  let ostatnioAktywnyElement = null;

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

    function odswiezListe() {
      const wynik = aplikacja.pamiecTras.pobierzListeTras();
      const trasy = Array.isArray(wynik.trasy) ? wynik.trasy : [];

      if (!trasy.length) {
        pokazPustaListe(lista, "Pamięć tras jest pusta.");
        return;
      }

      lista.replaceChildren(utworzTabeleTras(trasy));
    }

    function otworzOkno() {
      ostatnioAktywnyElement = document.activeElement;
      odswiezListe();
      okno.hidden = false;
      przyciskZamknij.focus();
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

  uruchomPodgladTras();
})(window);
