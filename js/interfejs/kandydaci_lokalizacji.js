(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};
  const interfejsLokalizacji = aplikacja.interfejsLokalizacji =
    aplikacja.interfejsLokalizacji || {};
  let ostatnioAktywnyElement = null;
  let czyObslugaOknaGotowa = false;

  function pobierzPoziomPewnosci(kandydat) {
    const dane = kandydat && typeof kandydat === "object" ? kandydat : {};
    const podany = String(dane.poziomPewnosci || "").trim();

    if (["wysoka", "srednia", "niska", "brak-oceny"].includes(podany)) {
      return podany;
    }

    const wartosc = Number(dane.pewnosc);

    if (!Number.isFinite(wartosc) || wartosc < 0 || wartosc > 1) {
      return "brak-oceny";
    }

    return wartosc >= 0.8
      ? "wysoka"
      : (wartosc >= 0.5 ? "srednia" : "niska");
  }

  function pobierzEtykietePewnosci(kandydat) {
    const poziom = pobierzPoziomPewnosci(kandydat);
    const etykiety = {
      wysoka: "Wysoka",
      srednia: "Średnia",
      niska: "Niska",
      "brak-oceny": "Brak oceny dostawcy"
    };
    const surowaPewnosc = kandydat && kandydat.pewnosc;

    if (surowaPewnosc === null || surowaPewnosc === undefined || surowaPewnosc === "") {
      return etykiety[poziom];
    }

    const wartosc = Number(surowaPewnosc);

    if (!Number.isFinite(wartosc) || wartosc < 0 || wartosc > 1) {
      return etykiety[poziom];
    }

    return etykiety[poziom] + " · " + Math.round(wartosc * 100) + "%";
  }

  function opiszTypWyniku(typWyniku) {
    const typ = String(typWyniku || "").trim().toLowerCase();
    const etykiety = {
      address: "Adres",
      street: "Ulica",
      venue: "Obiekt",
      locality: "Miejscowość",
      localadmin: "Obszar lokalny",
      county: "Powiat",
      region: "Region"
    };

    return etykiety[typ] || (typ ? String(typWyniku) : "Nieokreślony");
  }

  function formatujWspolrzedne(wspolrzedne) {
    const dane = wspolrzedne && typeof wspolrzedne === "object"
      ? wspolrzedne
      : {};
    const szerokosc = Number(dane.szerokoscGeograficzna);
    const dlugosc = Number(dane.dlugoscGeograficzna);

    if (!Number.isFinite(szerokosc) || !Number.isFinite(dlugosc)) {
      return "Brak współrzędnych";
    }

    return szerokosc.toFixed(6) + ", " + dlugosc.toFixed(6);
  }

  function przygotujKandydataDoWyswietlenia(kandydat, indeks) {
    const dane = kandydat && typeof kandydat === "object" ? kandydat : {};
    const adres = dane.adres && typeof dane.adres === "object" ? dane.adres : {};

    return {
      numer: (Number.isInteger(indeks) ? indeks : 0) + 1,
      indeksKandydata: Number.isInteger(dane.indeksKandydata)
        ? dane.indeksKandydata
        : (Number.isInteger(indeks) ? indeks : 0),
      adresTekst: String(adres.tekst || "").trim() ||
        "Brak pełnego adresu w wyniku",
      wspolrzedneTekst: formatujWspolrzedne(dane.wspolrzedne),
      poziomPewnosci: pobierzPoziomPewnosci(dane),
      etykietaPewnosci: pobierzEtykietePewnosci(dane),
      typWyniku: opiszTypWyniku(dane.typWyniku),
      kandydat: dane
    };
  }

  function przygotujListeKandydatow(kandydaci) {
    return Array.isArray(kandydaci)
      ? kandydaci.map(przygotujKandydataDoWyswietlenia)
      : [];
  }

  function pobierzElement(identyfikator) {
    return zakresGlobalny.document &&
      zakresGlobalny.document.getElementById(identyfikator);
  }

  function zamknijOkno() {
    const okno = pobierzElement("okno-kandydatow-lokalizacji");

    if (!okno) {
      return;
    }

    okno.hidden = true;

    if (ostatnioAktywnyElement &&
        typeof ostatnioAktywnyElement.focus === "function") {
      ostatnioAktywnyElement.focus();
    }

    ostatnioAktywnyElement = null;
  }

  function zapewnijObslugeOkna() {
    if (czyObslugaOknaGotowa || !zakresGlobalny.document) {
      return;
    }

    const okno = pobierzElement("okno-kandydatow-lokalizacji");
    const przyciskZamknij = pobierzElement("przycisk-zamknij-kandydatow-lokalizacji");

    if (!okno || !przyciskZamknij) {
      return;
    }

    przyciskZamknij.addEventListener("click", zamknijOkno);
    okno.addEventListener("click", function (zdarzenie) {
      if (zdarzenie.target === okno) {
        zamknijOkno();
      }
    });
    zakresGlobalny.document.addEventListener("keydown", function (zdarzenie) {
      if (zdarzenie.key === "Escape" && !okno.hidden) {
        zamknijOkno();
      }
    });
    czyObslugaOknaGotowa = true;
  }

  function utworzWierszMetadanych(etykieta, wartosc, klasa) {
    const wiersz = zakresGlobalny.document.createElement("p");
    const nazwa = zakresGlobalny.document.createElement("strong");
    const tresc = zakresGlobalny.document.createElement("span");

    wiersz.className = "kandydat-lokalizacji__meta" + (klasa ? " " + klasa : "");
    nazwa.textContent = etykieta + ": ";
    tresc.textContent = wartosc;
    wiersz.appendChild(nazwa);
    wiersz.appendChild(tresc);
    return wiersz;
  }

  function utworzKarteKandydata(kandydat) {
    const karta = zakresGlobalny.document.createElement("article");
    const naglowek = zakresGlobalny.document.createElement("div");
    const numer = zakresGlobalny.document.createElement("strong");
    const pewnosc = zakresGlobalny.document.createElement("span");
    const adres = zakresGlobalny.document.createElement("p");

    karta.className = "kandydat-lokalizacji";
    karta.dataset.indeksKandydata = String(kandydat.indeksKandydata);
    naglowek.className = "kandydat-lokalizacji__naglowek";
    numer.textContent = "Wynik " + kandydat.numer;
    pewnosc.className = "kandydat-lokalizacji__pewnosc";
    pewnosc.dataset.poziom = kandydat.poziomPewnosci;
    pewnosc.textContent = kandydat.etykietaPewnosci;
    adres.className = "kandydat-lokalizacji__adres";
    adres.textContent = kandydat.adresTekst;

    naglowek.appendChild(numer);
    naglowek.appendChild(pewnosc);
    karta.appendChild(naglowek);
    karta.appendChild(adres);
    karta.appendChild(utworzWierszMetadanych("Typ", kandydat.typWyniku));
    karta.appendChild(
      utworzWierszMetadanych("Współrzędne", kandydat.wspolrzedneTekst)
    );
    return karta;
  }

  function pokazKandydatow(kandydaci, opisBudowy) {
    if (!zakresGlobalny.document) {
      return { status: "brak-dokumentu", liczbaKandydatow: 0 };
    }

    zapewnijObslugeOkna();
    const okno = pobierzElement("okno-kandydatow-lokalizacji");
    const lista = pobierzElement("lista-kandydatow-lokalizacji");
    const opis = pobierzElement("opis-kandydatow-lokalizacji");
    const przyciskZamknij = pobierzElement("przycisk-zamknij-kandydatow-lokalizacji");

    if (!okno || !lista || !opis) {
      return { status: "brak-elementow-interfejsu", liczbaKandydatow: 0 };
    }

    const przygotowani = przygotujListeKandydatow(kandydaci);
    opis.textContent = przygotowani.length
      ? "Znaleziono " + przygotowani.length + " możliwych lokalizacji" +
        (opisBudowy ? " dla „" + String(opisBudowy) + "”" : "") +
        ". Żaden wynik nie zostanie zastosowany bez świadomego wyboru."
      : "Nie ma kandydatów lokalizacji do pokazania.";

    const elementy = przygotowani.map(utworzKarteKandydata);

    if (!elementy.length) {
      const pusty = zakresGlobalny.document.createElement("p");
      pusty.className = "pusta-historia";
      pusty.textContent = "Brak wyników do pokazania.";
      elementy.push(pusty);
    }

    lista.replaceChildren.apply(lista, elementy);
    ostatnioAktywnyElement = zakresGlobalny.document.activeElement;
    okno.hidden = false;

    if (przyciskZamknij && typeof przyciskZamknij.focus === "function") {
      przyciskZamknij.focus();
    }

    return {
      status: przygotowani.length ? "pokazano-kandydatow" : "brak-kandydatow",
      liczbaKandydatow: przygotowani.length
    };
  }

  Object.assign(interfejsLokalizacji, {
    przygotujListeKandydatow: przygotujListeKandydatow,
    pokazKandydatow: pokazKandydatow,
    zamknijOknoKandydatow: zamknijOkno
  });
})(window);
