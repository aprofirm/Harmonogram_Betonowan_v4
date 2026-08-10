(function (zakresGlobalny) {
  "use strict";

  const aplikacja = zakresGlobalny.HarmonogramBetonowan =
    zakresGlobalny.HarmonogramBetonowan || {};

  const KLUCZ_PAMIECI = "harmonogramBetonowan.diagnostyka.v1";
  const MAKSYMALNA_LICZBA_SESJI = 10;
  const MAKSYMALNA_LICZBA_ZDARZEN_W_SESJI = 200;
  const MAKSYMALNA_DLUGOSC_TEKSTU = 1000;
  let sesje = [];
  let biezacaSesja = null;
  let pamiecLokalna = null;
  let trybPamieci = "biezaca-sesja";
  let elementy = null;
  let czyUruchomiono = false;

  function pobierzZnacznikCzasu() {
    return new Date().toISOString();
  }

  function ograniczTekst(wartosc) {
    const tekst = String(wartosc === undefined ? "" : wartosc);

    if (tekst.length <= MAKSYMALNA_DLUGOSC_TEKSTU) {
      return tekst;
    }

    return tekst.slice(0, MAKSYMALNA_DLUGOSC_TEKSTU) + "…";
  }

  function uproscWartosc(wartosc, glebokosc) {
    if (wartosc === null || wartosc === undefined) {
      return null;
    }

    if (typeof wartosc === "string") {
      return ograniczTekst(wartosc);
    }

    if (typeof wartosc === "number" || typeof wartosc === "boolean") {
      return wartosc;
    }

    if (glebokosc >= 3) {
      return "[pominięto dalsze szczegóły]";
    }

    if (Array.isArray(wartosc)) {
      return wartosc.slice(0, 50).map(function (element) {
        return uproscWartosc(element, glebokosc + 1);
      });
    }

    if (typeof wartosc === "object") {
      const uproszczonyObiekt = {};

      Object.keys(wartosc).slice(0, 30).forEach(function (klucz) {
        uproszczonyObiekt[klucz] = uproscWartosc(wartosc[klucz], glebokosc + 1);
      });

      return uproszczonyObiekt;
    }

    return ograniczTekst(wartosc);
  }

  function skopiujDane(dane) {
    return JSON.parse(JSON.stringify(dane));
  }

  function rozpoznajPamiecLokalna() {
    const kluczTestowy = KLUCZ_PAMIECI + ".test";

    try {
      const magazyn = zakresGlobalny.localStorage;

      if (!magazyn) {
        return null;
      }

      magazyn.setItem(kluczTestowy, "1");
      magazyn.removeItem(kluczTestowy);
      return magazyn;
    } catch (bladPamieci) {
      return null;
    }
  }

  function odczytajSesje() {
    if (!pamiecLokalna) {
      return [];
    }

    try {
      const zapisaneDane = pamiecLokalna.getItem(KLUCZ_PAMIECI);
      const odczytaneSesje = zapisaneDane ? JSON.parse(zapisaneDane) : [];

      return Array.isArray(odczytaneSesje) ? odczytaneSesje : [];
    } catch (bladOdczytu) {
      try {
        pamiecLokalna.removeItem(KLUCZ_PAMIECI);
      } catch (bladUsuwania) {
        // Brak trwałej pamięci nie może zablokować uruchomienia aplikacji.
      }
      return [];
    }
  }

  function zapiszSesje() {
    if (!pamiecLokalna || trybPamieci !== "trwala") {
      return;
    }

    try {
      pamiecLokalna.setItem(KLUCZ_PAMIECI, JSON.stringify(sesje));
    } catch (bladZapisu) {
      trybPamieci = "biezaca-sesja";
    }
  }

  function utworzNowaSesje() {
    const konfiguracja = aplikacja.konfiguracja || {};

    return {
      idSesji: "sesja-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      rozpoczecie: pobierzZnacznikCzasu(),
      aplikacja: konfiguracja.nazwaAplikacji || "Harmonogram Betonowań",
      etap: konfiguracja.numerEtapu || null,
      zdarzenia: []
    };
  }

  function zapewnijBiezacaSesje() {
    if (biezacaSesja) {
      return biezacaSesja;
    }

    biezacaSesja = utworzNowaSesje();
    sesje.push(biezacaSesja);
    sesje = sesje.slice(-MAKSYMALNA_LICZBA_SESJI);
    zapiszSesje();
    return biezacaSesja;
  }

  function pobierzBezpieczneWierszeStosu(stos) {
    if (!stos) {
      return [];
    }

    return String(stos).split("\n").slice(0, 10).map(function (wiersz, indeksWiersza) {
      if (indeksWiersza === 0) {
        return ograniczTekst(wiersz.trim());
      }

      const indeksKodu = wiersz.search(/(?:js[\\/]|index\.html:)/i);

      if (indeksKodu === -1) {
        return null;
      }

      return "at " + ograniczTekst(wiersz.slice(indeksKodu).trim());
    }).filter(function (wiersz) {
      return Boolean(wiersz);
    });
  }

  function pobierzBezpiecznaNazwePliku(sciezka) {
    const tekst = String(sciezka || "");
    const indeksKodu = tekst.search(/(?:js[\\/]|index\.html$)/i);

    if (indeksKodu !== -1) {
      return tekst.slice(indeksKodu);
    }

    return tekst.split(/[\\/]/).pop() || "nieznany plik";
  }

  function znajdzElementyDiagnostyki() {
    if (!zakresGlobalny.document || typeof zakresGlobalny.document.getElementById !== "function") {
      return null;
    }

    return {
      stan: zakresGlobalny.document.getElementById("stan-diagnostyki"),
      podglad: zakresGlobalny.document.getElementById("podglad-logow"),
      przyciskPobierz: zakresGlobalny.document.getElementById("przycisk-pobierz-raport"),
      przyciskWyczysc: zakresGlobalny.document.getElementById("przycisk-wyczysc-logi")
    };
  }

  function pobierzWszystkieZdarzenia() {
    return sesje.reduce(function (wynik, sesja) {
      const zdarzeniaSesji = Array.isArray(sesja.zdarzenia) ? sesja.zdarzenia : [];
      return wynik.concat(zdarzeniaSesji);
    }, []);
  }

  function formatujGodzine(znacznikCzasu) {
    const data = new Date(znacznikCzasu);

    if (Number.isNaN(data.getTime())) {
      return "--:--:--";
    }

    return data.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function odswiezWidok() {
    if (!elementy) {
      return;
    }

    const wszystkieZdarzenia = pobierzWszystkieZdarzenia();
    const opisPamieci = trybPamieci === "trwala"
      ? "Zapamiętano w przeglądarce"
      : "Pamięć tylko do zamknięcia strony";

    if (elementy.stan) {
      elementy.stan.textContent = wszystkieZdarzenia.length
        ? opisPamieci + ": " + sesje.length + " uruchomień, " +
          wszystkieZdarzenia.length + " zdarzeń."
        : "Brak zapisanych zdarzeń diagnostycznych.";
    }

    if (elementy.podglad) {
      const ostatnieZdarzenia = wszystkieZdarzenia.slice(-8);
      elementy.podglad.textContent = ostatnieZdarzenia.length
        ? ostatnieZdarzenia.map(function (zdarzenie) {
          return formatujGodzine(zdarzenie.czas) + " · " +
            zdarzenie.poziom.toUpperCase() + " · " + zdarzenie.opis;
        }).join("\n")
        : "Brak zdarzeń w bieżącej pamięci.";
    }
  }

  function zapiszZdarzenie(poziom, kod, opis, szczegoly) {
    const sesja = zapewnijBiezacaSesje();
    const zdarzenie = {
      czas: pobierzZnacznikCzasu(),
      poziom: poziom || "informacja",
      kod: kod || "zdarzenie",
      opis: ograniczTekst(opis || "Zdarzenie diagnostyczne"),
      szczegoly: uproscWartosc(szczegoly || {}, 0)
    };

    sesja.zdarzenia.push(zdarzenie);
    sesja.zdarzenia = sesja.zdarzenia.slice(-MAKSYMALNA_LICZBA_ZDARZEN_W_SESJI);
    zapiszSesje();
    odswiezWidok();
    return skopiujDane(zdarzenie);
  }

  function zapiszBlad(blad, kod, opis, kontekst) {
    const czyBlad = blad && typeof blad === "object";
    const szczegoly = Object.assign({}, kontekst || {}, {
      nazwaBledu: czyBlad && blad.name ? blad.name : "Error",
      komunikatTechniczny: czyBlad && blad.message
        ? ograniczTekst(blad.message)
        : ograniczTekst(blad || "Nieznany błąd"),
      stos: pobierzBezpieczneWierszeStosu(czyBlad && blad.stack)
    });

    return zapiszZdarzenie(
      "blad",
      kod || "blad-techniczny",
      opis || "Wystąpił błąd techniczny",
      szczegoly
    );
  }

  function utworzRaport() {
    const konfiguracja = aplikacja.konfiguracja || {};

    return {
      typRaportu: "Harmonogram Betonowań — raport diagnostyczny",
      wygenerowano: pobierzZnacznikCzasu(),
      aplikacja: konfiguracja.nazwaAplikacji || "Harmonogram Betonowań",
      etap: konfiguracja.numerEtapu || null,
      trybPamieci: trybPamieci,
      zasadyPrywatnosci:
        "Raport nie zawiera treści wierszy CSV ani nazw firm i budów.",
      sesje: skopiujDane(sesje)
    };
  }

  function utworzNazweRaportu() {
    const znacznik = pobierzZnacznikCzasu()
      .slice(0, 19)
      .replace("T", "_")
      .replace(/:/g, "-");

    return "harmonogram-betonowan-raport-" + znacznik + ".json";
  }

  function pobierzRaport() {
    zapiszZdarzenie(
      "informacja",
      "raport-pobrany",
      "Użytkownik pobrał raport diagnostyczny.",
      { liczbaSesji: sesje.length }
    );

    const raport = utworzRaport();
    const tresc = JSON.stringify(raport, null, 2);
    const BlobKonstruktora = zakresGlobalny.Blob;
    const obslugaAdresow = zakresGlobalny.URL;

    if (!BlobKonstruktora || !obslugaAdresow ||
        typeof obslugaAdresow.createObjectURL !== "function") {
      throw new Error("Ta przeglądarka nie pozwala utworzyć pliku raportu.");
    }

    const plikRaportu = new BlobKonstruktora([tresc], {
      type: "application/json;charset=utf-8"
    });
    const adresPliku = obslugaAdresow.createObjectURL(plikRaportu);
    const lacznik = zakresGlobalny.document.createElement("a");

    lacznik.href = adresPliku;
    lacznik.download = utworzNazweRaportu();

    if (zakresGlobalny.document.body &&
        typeof zakresGlobalny.document.body.appendChild === "function") {
      zakresGlobalny.document.body.appendChild(lacznik);
    }

    lacznik.click();

    if (typeof lacznik.remove === "function") {
      lacznik.remove();
    }

    obslugaAdresow.revokeObjectURL(adresPliku);
    return raport;
  }

  function wyczyscLogi() {
    sesje = [];
    biezacaSesja = null;

    if (pamiecLokalna) {
      try {
        pamiecLokalna.removeItem(KLUCZ_PAMIECI);
      } catch (bladUsuwania) {
        trybPamieci = "biezaca-sesja";
      }
    }

    odswiezWidok();
  }

  function pobierzStan() {
    return {
      trybPamieci: trybPamieci,
      maksymalnaLiczbaSesji: MAKSYMALNA_LICZBA_SESJI,
      liczbaSesji: sesje.length,
      liczbaZdarzen: pobierzWszystkieZdarzenia().length
    };
  }

  function podlaczZdarzeniaGlobalne() {
    if (typeof zakresGlobalny.addEventListener !== "function") {
      return;
    }

    zakresGlobalny.addEventListener("error", function (zdarzenie) {
      const blad = zdarzenie.error || new Error(zdarzenie.message || "Błąd JavaScript");

      zapiszBlad(blad, "nieoczekiwany-blad-javascript", "Nieoczekiwany błąd aplikacji.", {
        plik: pobierzBezpiecznaNazwePliku(zdarzenie.filename),
        linia: zdarzenie.lineno || null,
        kolumna: zdarzenie.colno || null
      });
    });

    zakresGlobalny.addEventListener("unhandledrejection", function (zdarzenie) {
      const powod = zdarzenie.reason instanceof Error
        ? zdarzenie.reason
        : new Error(String(zdarzenie.reason || "Nieznany błąd operacji asynchronicznej"));

      zapiszBlad(
        powod,
        "nieobsluzony-blad-asynchroniczny",
        "Nieoczekiwany błąd operacji asynchronicznej."
      );
    });
  }

  function podlaczPrzyciski() {
    if (!elementy) {
      return;
    }

    if (elementy.przyciskPobierz) {
      elementy.przyciskPobierz.addEventListener("click", function () {
        try {
          pobierzRaport();
        } catch (blad) {
          zapiszBlad(blad, "blad-pobierania-raportu", "Nie udało się pobrać raportu.");
        }
      });
    }

    if (elementy.przyciskWyczysc) {
      elementy.przyciskWyczysc.addEventListener("click", wyczyscLogi);
    }
  }

  function uruchomDiagnostyke() {
    if (czyUruchomiono) {
      return;
    }

    czyUruchomiono = true;
    pamiecLokalna = rozpoznajPamiecLokalna();
    trybPamieci = pamiecLokalna ? "trwala" : "biezaca-sesja";
    sesje = odczytajSesje().slice(-MAKSYMALNA_LICZBA_SESJI);
    elementy = znajdzElementyDiagnostyki();
    podlaczZdarzeniaGlobalne();
    podlaczPrzyciski();
    zapewnijBiezacaSesje();
    zapiszZdarzenie(
      "informacja",
      "uruchomienie-aplikacji",
      "Uruchomiono aplikację.",
      { trybPamieci: trybPamieci }
    );
  }

  aplikacja.diagnostyka = {
    uruchomDiagnostyke: uruchomDiagnostyke,
    zapiszZdarzenie: zapiszZdarzenie,
    zapiszBlad: zapiszBlad,
    utworzRaport: utworzRaport,
    pobierzRaport: pobierzRaport,
    wyczyscLogi: wyczyscLogi,
    pobierzStan: pobierzStan
  };

  uruchomDiagnostyke();
})(window);
